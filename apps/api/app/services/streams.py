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
    if entry is None or "auto" in entry:
        return False  # тумблер только для ручных записей; auto управляет резолвер
    try:
        await _r().hset(_LIVE_HKEY, stream_id, "1" if live else "0")
    except Exception:
        pass
    return True


async def _resolved(stream_id: str) -> dict | None:
    try:
        raw = await _r().get(_RESOLVED_PREFIX + stream_id)
        return json.loads(raw) if raw else None
    except Exception:
        return None


async def refresh_auto() -> None:
    """Фоновая задача: обновить эфир всех auto-записей в Redis."""
    for s in STREAMS:
        auto = s.get("auto")
        if not auto:
            continue
        try:
            if s["platform"] == "rutube" and auto.get("channel"):
                res = await _rutube.resolve_channel(auto["channel"])
            elif s["platform"] == "vk" and auto.get("screen_name"):
                res = await _vk.resolve_community(auto["screen_name"])
            else:
                res = None
        except Exception:
            res = None
        if res and _host_ok(res.get("embed_url", "")):
            try:
                await _r().set(_RESOLVED_PREFIX + s["id"], json.dumps(res, ensure_ascii=False), ex=_RESOLVED_TTL)
            except Exception:
                pass


async def list_streams() -> list[dict]:
    overrides = await _live_overrides()
    out: list[dict] = []
    for s in STREAMS:
        if "auto" in s:
            res = await _resolved(s["id"]) or {}
            embed = res.get("embed_url", "")
            live = bool(res.get("live", False))
            title = res.get("title")
            thumb = res.get("thumb")
        else:
            embed = s.get("embed_url", "")
            live = overrides.get(s["id"], bool(s.get("live", False)))
            title = None
            thumb = s.get("thumb")
        if embed and not _host_ok(embed):
            embed = ""  # чужой/битый хост наружу не отдаём
        out.append(
            {
                "id": s["id"],
                "caster": s["caster"],
                "platform": s["platform"],
                "embed_url": embed,
                "title": title,
                "thumb": thumb,
                "channel_url": s.get("channel_url"),
                "round": s.get("round"),
                "live": live and bool(embed),
                "note": s.get("note"),
            }
        )
    out.sort(key=lambda x: (not x["live"], x["caster"]))
    return out
