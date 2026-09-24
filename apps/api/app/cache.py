"""Общий кэш в Redis для данных провайдера (зачёты, итоги, профили пилотов).

Зачем: раньше каждый сервис держал свой словарь в памяти процесса — кэш терялся
при рестарте и не разделялся между воркерами/контейнерами. Redis-кэш переживает
рестарт и общий для всех воркеров → меньше «холодных» медленных первых загрузок и
меньше обращений к провайдеру. При недоступности Redis работаем напрямую (graceful).
"""

import json
from collections.abc import Awaitable, Callable
from typing import Any

import redis.asyncio as aioredis

from .config import get_settings

_redis: aioredis.Redis | None = None


def _client() -> aioredis.Redis:
    global _redis
    if _redis is None:
        _redis = aioredis.from_url(
            get_settings().redis_url, encoding="utf-8", decode_responses=True
        )
    return _redis


async def get_json(key: str) -> Any:
    """Прочитать JSON из Redis (None, если нет ключа или Redis недоступен)."""
    try:
        raw = await _client().get(key)
        return json.loads(raw) if raw is not None else None
    except Exception:
        return None


async def set_json(key: str, value: Any, ttl: int) -> None:
    """Записать JSON в Redis (тихо, если Redis недоступен)."""
    try:
        await _client().set(key, json.dumps(value, ensure_ascii=False), ex=ttl)
    except Exception:
        pass


async def cached(
    key: str, ttl: int, producer: Callable[[], Awaitable[Any]]
) -> Any:
    """Вернуть значение из Redis по ключу, иначе вычислить producer() и закэшировать.
    Значение должно быть JSON-сериализуемым. Пустые значения не кэшируются."""
    r: aioredis.Redis | None = _client()
    try:
        raw = await r.get(key)
        if raw is not None:
            return json.loads(raw)
    except Exception:
        r = None  # Redis недоступен — без кэша

    data = await producer()

    if r is not None and data:
        try:
            await r.set(key, json.dumps(data, ensure_ascii=False), ex=ttl)
        except Exception:
            pass
    return data
