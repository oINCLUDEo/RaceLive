"""JolpicaProvider — расписание/результаты, бесплатно, без ключа (Ergast-совместимый API).

https://github.com/jolpica/jolpica-f1  ·  база: https://api.jolpi.ca/ergast/f1
Клиент обёрнут в token bucket + экспоненциальный backoff — лимит не превышается физически.
"""

import asyncio
from datetime import UTC, datetime

import httpx

from ..config import get_settings
from ..ratelimit import TokenBucket
from .base import ProviderMeeting, ProviderSession

BASE_URL = "https://api.jolpi.ca/ergast/f1"

# Ключ в ответе Ergast -> (наш type, name_en, name_ru)
_SESSION_KEYS: list[tuple[str, str, str, str]] = [
    ("FirstPractice", "practice", "Practice 1", "Свободная практика 1"),
    ("SecondPractice", "practice", "Practice 2", "Свободная практика 2"),
    ("ThirdPractice", "practice", "Practice 3", "Свободная практика 3"),
    ("SprintQualifying", "sprint_qualifying", "Sprint Qualifying", "Спринт-квалификация"),
    ("SprintShootout", "sprint_qualifying", "Sprint Shootout", "Спринт-квалификация"),
    ("Sprint", "sprint", "Sprint", "Спринт"),
    ("Qualifying", "qualifying", "Qualifying", "Квалификация"),
]


def _parse_dt(date: str | None, time: str | None) -> datetime | None:
    if not date:
        return None
    try:
        if time:
            return datetime.fromisoformat(f"{date}T{time}".replace("Z", "+00:00"))
        return datetime.fromisoformat(date).replace(tzinfo=UTC)
    except ValueError:
        return None


class JolpicaProvider:
    name = "jolpica"

    def __init__(self) -> None:
        s = get_settings()
        self._bucket = TokenBucket(s.provider_rate_per_sec, s.provider_rate_burst)

    async def _get(self, path: str) -> dict:
        url = f"{BASE_URL}/{path}"
        last_exc: Exception | None = None
        async with httpx.AsyncClient(timeout=20.0) as client:
            for attempt in range(5):
                await self._bucket.acquire()
                try:
                    resp = await client.get(url, headers={"Accept": "application/json"})
                    if resp.status_code == 429:
                        raise httpx.HTTPStatusError(
                            "rate limited", request=resp.request, response=resp
                        )
                    resp.raise_for_status()
                    return resp.json()
                except (httpx.HTTPError, ValueError) as exc:
                    last_exc = exc
                    await asyncio.sleep(min(2**attempt, 30))  # backoff
        raise RuntimeError(f"Провайдер недоступен: {url}") from last_exc

    async def schedule(self, season: int) -> list[ProviderMeeting]:
        data = await self._get(f"{season}/races/?format=json&limit=100")
        races = data["MRData"]["RaceTable"]["Races"]
        meetings: list[ProviderMeeting] = []

        for race in races:
            rnd = int(race["round"])
            circuit = race.get("Circuit", {})
            location = circuit.get("Location", {})
            sessions: list[ProviderSession] = []

            for key, stype, name_en, name_ru in _SESSION_KEYS:
                block = race.get(key)
                if not block:
                    continue
                sessions.append(
                    ProviderSession(
                        type=stype,
                        name_en=name_en,
                        name_ru=name_ru,
                        starts_at=_parse_dt(block.get("date"), block.get("time")),
                        provider_key=f"{season}-{rnd}-{key}",
                    )
                )

            # сама гонка — из полей верхнего уровня
            sessions.append(
                ProviderSession(
                    type="race",
                    name_en="Race",
                    name_ru="Гонка",
                    starts_at=_parse_dt(race.get("date"), race.get("time")),
                    provider_key=f"{season}-{rnd}-Race",
                )
            )

            starts = [s.starts_at for s in sessions if s.starts_at]
            meetings.append(
                ProviderMeeting(
                    round=rnd,
                    name_en=race.get("raceName", f"Round {rnd}"),
                    name_ru=None,  # RU-названия этапов — контентная работа Фазы 2
                    circuit_key=circuit.get("circuitId", f"circuit-{rnd}"),
                    circuit_name_en=circuit.get("circuitName", ""),
                    circuit_name_ru=None,
                    country=location.get("country"),
                    starts_at=min(starts) if starts else None,
                    ends_at=max(starts) if starts else None,
                    sessions=sessions,
                )
            )

        return meetings
