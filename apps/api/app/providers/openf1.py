"""OpenF1 — источник live/replay-данных (позиции, интервалы, круги, шины, рейс-контроль).

Бесплатный тариф: 3 req/s, 30 req/min. Клиент за token-bucket'ом (твёрдое правило).
Для replay всё тянется один раз на старте (несколько запросов), поэтому лимит с запасом.
Живой поток (MQTT/WebSocket) — коммерческий; здесь только REST историю/replay.

База: https://api.openf1.org/v1
"""

from __future__ import annotations

import asyncio

import httpx

from ..ratelimit import TokenBucket

BASE_URL = "https://api.openf1.org/v1"


class OpenF1Client:
    name = "openf1"

    def __init__(self) -> None:
        # Консервативно ниже лимита 3 req/s.
        self._bucket = TokenBucket(rate_per_sec=2.0, burst=3)

    _RETRIES = 3

    async def _get(self, endpoint: str, **params) -> list[dict]:
        url = f"{BASE_URL}/{endpoint}"
        last_exc: Exception | None = None
        async with httpx.AsyncClient(timeout=30.0) as client:
            for attempt in range(self._RETRIES):
                await self._bucket.acquire()
                try:
                    resp = await client.get(url, params=params, headers={"Accept": "application/json"})
                    if resp.status_code == 429:
                        raise httpx.HTTPStatusError("rate limited", request=resp.request, response=resp)
                    resp.raise_for_status()
                    data = resp.json()
                    return data if isinstance(data, list) else []
                except (httpx.HTTPError, ValueError) as exc:
                    last_exc = exc
                    if attempt < self._RETRIES - 1:
                        await asyncio.sleep(1.0 * (attempt + 1))
        raise RuntimeError(f"OpenF1 недоступен: {url}") from last_exc

    async def session(self, session_key: int) -> dict | None:
        rows = await self._get("sessions", session_key=session_key)
        return rows[0] if rows else None

    async def race_sessions(self, year: int) -> list[dict]:
        return await self._get("sessions", year=year, session_name="Race")

    async def drivers(self, session_key: int) -> list[dict]:
        return await self._get("drivers", session_key=session_key)

    async def race_control(self, session_key: int) -> list[dict]:
        return await self._get("race_control", session_key=session_key)

    async def position(self, session_key: int) -> list[dict]:
        return await self._get("position", session_key=session_key)

    async def intervals(self, session_key: int) -> list[dict]:
        return await self._get("intervals", session_key=session_key)

    async def laps(self, session_key: int) -> list[dict]:
        return await self._get("laps", session_key=session_key)

    async def stints(self, session_key: int) -> list[dict]:
        return await self._get("stints", session_key=session_key)

    async def weather(self, session_key: int) -> list[dict]:
        return await self._get("weather", session_key=session_key)
