"""Open-Meteo — бесплатный прогноз погоды (без ключа) для уик-энда гонки.

Клиент за token-bucket'ом (твёрдое правило: лимит провайдера не превышаем физически).
Прогноз доступен примерно на 16 дней вперёд; дальше/в прошлом — сервис вернёт пусто.

База: https://api.open-meteo.com/v1/forecast
"""

from __future__ import annotations

import asyncio

import httpx

from ..ratelimit import TokenBucket

BASE_URL = "https://api.open-meteo.com/v1/forecast"

_DAILY = (
    "weather_code,temperature_2m_max,temperature_2m_min,"
    "precipitation_probability_max,precipitation_sum,wind_speed_10m_max"
)


class OpenMeteoClient:
    name = "open-meteo"

    def __init__(self) -> None:
        self._bucket = TokenBucket(rate_per_sec=2.0, burst=4)

    _RETRIES = 2

    async def daily(self, lat: float, lon: float, start_date: str, end_date: str) -> dict:
        params = {
            "latitude": lat,
            "longitude": lon,
            "daily": _DAILY,
            "timezone": "auto",
            "wind_speed_unit": "ms",
            "start_date": start_date,
            "end_date": end_date,
        }
        last_exc: Exception | None = None
        async with httpx.AsyncClient(timeout=15.0) as client:
            for attempt in range(self._RETRIES):
                await self._bucket.acquire()
                try:
                    resp = await client.get(BASE_URL, params=params, headers={"Accept": "application/json"})
                    if resp.status_code == 429:
                        raise httpx.HTTPStatusError("rate limited", request=resp.request, response=resp)
                    resp.raise_for_status()
                    data = resp.json()
                    return data if isinstance(data, dict) else {}
                except (httpx.HTTPError, ValueError) as exc:
                    last_exc = exc
                    if attempt < self._RETRIES - 1:
                        await asyncio.sleep(1.0)
        raise RuntimeError(f"Open-Meteo недоступен: {BASE_URL}") from last_exc
