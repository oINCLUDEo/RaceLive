"""Сервис стримов кастеров. Видео не трогаем — только метаданные и embed-src.

Хост embed_url проверяется по белому списку (не встраиваем чужой origin). Флаг «в
эфире» — стартовое значение из конфига, поверх — override в Redis (тумблер в уик-энд).
"""

from __future__ import annotations

from urllib.parse import urlparse

import redis.asyncio as aioredis

from ..config import get_settings
from ..streams_config import ALLOWED_EMBED_HOSTS, STREAMS

_LIVE_HKEY = "streams:live"

_redis: aioredis.Redis | None = None


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
    if not any(s["id"] == stream_id for s in STREAMS):
        return False
    try:
        await _r().hset(_LIVE_HKEY, stream_id, "1" if live else "0")
    except Exception:
        pass
    return True


async def list_streams() -> list[dict]:
    overrides = await _live_overrides()
    out: list[dict] = []
    for s in STREAMS:
        if not _host_ok(s["embed_url"]):
            continue  # запись с чужим/битым хостом наружу не отдаём
        out.append(
            {
                "id": s["id"],
                "caster": s["caster"],
                "platform": s["platform"],
                "embed_url": s["embed_url"],
                "channel_url": s.get("channel_url"),
                "round": s.get("round"),
                "live": overrides.get(s["id"], bool(s.get("live", False))),
                "note": s.get("note"),
            }
        )
    # живые — вперёд
    out.sort(key=lambda x: (not x["live"], x["caster"]))
    return out
