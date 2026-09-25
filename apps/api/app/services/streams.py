"""Сервис стримов кастеров. Видео не трогаем — только метаданные и embed-src.

Два источника на запись: ручной embed_url или auto (резолвер площадки в фоне). Хост
embed_url всегда проверяется по белому списку. Разрешённое состояние auto хранится в
Redis с TTL — если резолвер молчит, эфир сам «протухает» в офлайн.
"""

from __future__ import annotations

import json
from urllib.parse import urlparse

import redis.asyncio as aioredis

from ..config import get_settings
from ..providers.rutube import RutubeClient
from ..providers.vk import VKClient
from ..streams_config import ALLOWED_EMBED_HOSTS, STREAMS

_LIVE_HKEY = "streams:live"
_RESOLVED_PREFIX = "streams:resolved:"
_RESOLVED_TTL = 180  # авто-состояние живёт 3 мин без обновления резолвером

_redis: aioredis.Redis | None = None
_rutube = RutubeClient()
_vk = VKClient()


def _r() -> aioredis.Redis:
    global _redis
    if _redis is None:
        _redis = aioredis.from_url(get_settings().redis_url, encoding="utf-8", decode_responses=True)
    return _redis


def _host_ok(url: str) -> bool:
    try:
        host = (urlparse(url).hostname or "").lower()
    except Exception:
        return False
    return any(host == h or host.endswith("." + h) for h in ALLOWED_EMBED_HOSTS)


async def _live_overrides() -> dict[str, bool]:
    try:
        raw = await _r().hgetall(_LIVE_HKEY)
        return {k: v == "1" for k, v in raw.items()}
    except Exception:
        return {}


async def set_live(stream_id: str, live: bool) -> bool:
    entry = next((s for s in STREAMS if s["id"] == stream_id), None)
    if entry is None or any("auto" in src for src in _sources(entry)):
        return False  # тумблер только для ручных записей; auto управляет резолвер
    try:
        await _r().hset(_LIVE_HKEY, stream_id, "1" if live else "0")
    except Exception:
        pass
    return True


def stream_exists(stream_id: str) -> bool:
    return any(s["id"] == stream_id for s in STREAMS)


_LIKES_TTL = 3 * 24 * 3600


async def add_like(stream_id: str) -> int:
    """+1 к лайкам стрима (счётчик живёт 3 дня — «за уик-энд»)."""
    try:
        key = f"react:likes:{stream_id}"
        n = await _r().incr(key)
        await _r().expire(key, _LIKES_TTL)
        return int(n)
    except Exception:
        return 0


async def _likes(stream_id: str) -> int:
    try:
        return int(await _r().get(f"react:likes:{stream_id}") or 0)
    except Exception:
        return 0


async def allow_reaction(client_ip: str, limit: int = 12, window: int = 10) -> bool:
    """Анти-спам реакций: не больше `limit` за `window` секунд с одного IP."""
    try:
        key = f"react:rl:{client_ip or 'anon'}"
        n = await _r().incr(key)
        if n == 1:
            await _r().expire(key, window)
        return n <= limit
    except Exception:
        return True  # Redis недоступен — не ломаем реакции


async def _resolved(stream_id: str) -> dict | None:
    try:
        raw = await _r().get(_RESOLVED_PREFIX + stream_id)
        return json.loads(raw) if raw else None
    except Exception:
        return None


def _sources(s: dict) -> list[dict]:
    """Площадки записи: явный список "sources" или одна — из полей самой записи."""
    if s.get("sources"):
        return s["sources"]
    return [{k: s[k] for k in ("platform", "channel_url", "auto", "embed_url", "thumb", "live") if k in s}]


def _rkey(stream_id: str, idx: int) -> str:
    # Основная площадка — под прежним ключом (совместимость), остальные — с индексом.
    return stream_id if idx == 0 else f"{stream_id}:{idx}"


async def refresh_auto() -> None:
    """Фоновая задача: обновить эфир всех auto-площадок в Redis."""
    for s in STREAMS:
        for i, src in enumerate(_sources(s)):
            auto = src.get("auto")
            if not auto:
                continue
            try:
                if src["platform"] == "rutube" and auto.get("channel"):
                    res = await _rutube.resolve_channel(auto["channel"])
                elif src["platform"] == "vk" and auto.get("screen_name"):
                    res = await _vk.resolve_community(auto["screen_name"])
                else:
                    res = None
            except Exception:
                res = None
            if res and _host_ok(res.get("embed_url", "")):
                try:
                    await _r().set(_RESOLVED_PREFIX + _rkey(s["id"], i), json.dumps(res, ensure_ascii=False), ex=_RESOLVED_TTL)
                except Exception:
                    pass


async def _source_state(stream_id: str, idx: int, src: dict, overrides: dict[str, bool]) -> dict:
    if "auto" in src:
        res = await _resolved(_rkey(stream_id, idx)) or {}
        embed = res.get("embed_url", "")
        live = bool(res.get("live", False))
        title, thumb = res.get("title"), res.get("thumb")
        viewers, views = res.get("viewers"), res.get("views")
    else:
        embed = src.get("embed_url", "")
        live = overrides.get(stream_id, bool(src.get("live", False)))
        title, thumb = None, src.get("thumb")
        viewers = views = None
    if embed and not _host_ok(embed):
        embed = ""  # чужой/битый хост наружу не отдаём
    live = live and bool(embed)
    return {
        "platform": src["platform"],
        "embed_url": embed,
        "title": title,
        "thumb": thumb,
        "viewers": viewers if live else None,
        "views": views,
        "channel_url": src.get("channel_url"),
        "live": live,
    }


async def list_streams() -> list[dict]:
    overrides = await _live_overrides()
    out: list[dict] = []
    for s in STREAMS:
        sources = [await _source_state(s["id"], i, src, overrides) for i, src in enumerate(_sources(s))]
        # Основная — первая в эфире, иначе первая с записью, иначе первая по списку.
        main = next((x for x in sources if x["live"]), None) or next((x for x in sources if x["embed_url"]), sources[0])
        out.append(
            {
                "id": s["id"],
                "caster": s["caster"],
                **main,
                "likes": await _likes(s["id"]),
                "round": s.get("round"),
                "note": s.get("note"),
                "sources": sources,
            }
        )
    out.sort(key=lambda x: (not x["live"], x["caster"]))
    return out
