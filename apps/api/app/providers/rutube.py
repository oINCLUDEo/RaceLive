"""Rutube — публичный API канала (без ключа) для авто-подхвата эфира кастера.

Клиент за token-bucket'ом (твёрдое правило). Ищем среди видео канала прямой эфир
(is_on_air), берём его embed_url; если эфира нет — последнюю трансляцию/видео как
запасной плеер. Ничего не хостим — отдаём только ссылку на официальный плеер.

База: https://rutube.ru/api
"""

from __future__ import annotations

import asyncio

import httpx

from ..ratelimit import TokenBucket

BASE_URL = "https://rutube.ru/api"


class RutubeClient:
    name = "rutube"

    def __init__(self) -> None:
        self._bucket = TokenBucket(rate_per_sec=1.0, burst=2)

    _RETRIES = 2

    async def _get(self, path: str) -> dict:
        url = f"{BASE_URL}/{path}"
        last_exc: Exception | None = None
        async with httpx.AsyncClient(timeout=15.0, headers={"User-Agent": "race.live/1.0"}) as client:
            for attempt in range(self._RETRIES):
                await self._bucket.acquire()
                try:
                    resp = await client.get(url, headers={"Accept": "application/json"})
                    resp.raise_for_status()
                    data = resp.json()
                    return data if isinstance(data, dict) else {}
                except (httpx.HTTPError, ValueError) as exc:
                    last_exc = exc
                    if attempt < self._RETRIES - 1:
                        await asyncio.sleep(1.0)
        raise RuntimeError(f"Rutube недоступен: {url}") from last_exc

    async def resolve_channel(self, channel_id: str) -> dict | None:
        """Вернуть {embed_url, live, title} по каналу или None."""
        data = await self._get(f"video/person/{channel_id}/?page=1")
        results = data.get("results") or []
        if not results:
            return None
        on_air = next((v for v in results if v.get("is_on_air")), None)
        pick = on_air or next((v for v in results if v.get("is_livestream")), None) or results[0]
        embed = pick.get("embed_url") or (f"https://rutube.ru/play/embed/{pick['id']}" if pick.get("id") else "")
        if not embed:
            return None
        return {
            "embed_url": embed,
            "live": bool(on_air),
            "title": pick.get("title"),
            "thumb": pick.get("thumbnail_url") or pick.get("picture_url"),
        }
