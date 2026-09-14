"""JolpicaProvider — расписание/результаты, бесплатно, без ключа (Ergast-совместимый API).

https://github.com/jolpica/jolpica-f1  ·  база: https://api.jolpi.ca/ergast/f1
Клиент обёрнут в token bucket + экспоненциальный backoff — лимит не превышается физически.
"""

import asyncio
from datetime import datetime, timezone

UTC = timezone.utc

import httpx

from ..config import get_settings
from ..localization import circuit_name_ru, country_ru, meeting_name_ru
from ..ratelimit import TokenBucket
from .base import (
    ProviderConstructorStanding,
    ProviderDriverInfo,
    ProviderDriverSeasonResult,
    ProviderDriverStanding,
    ProviderMeeting,
    ProviderQualifyingResult,
    ProviderRaceResult,
    ProviderSession,
)

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
            ckey = circuit.get("circuitId", f"circuit-{rnd}")
            name_en = race.get("raceName", f"Round {rnd}")
            circuit_en = circuit.get("circuitName", "")
            country_en = location.get("country")
            meetings.append(
                ProviderMeeting(
                    round=rnd,
                    name_en=name_en,
                    name_ru=meeting_name_ru(ckey, name_en),
                    circuit_key=ckey,
                    circuit_name_en=circuit_en,
                    circuit_name_ru=circuit_name_ru(ckey, circuit_en),
                    country=country_ru(ckey, country_en) or country_en,
                    starts_at=min(starts) if starts else None,
                    ends_at=max(starts) if starts else None,
                    sessions=sessions,
                )
            )

        return meetings

    async def driver_standings(self, season: int) -> list[ProviderDriverStanding]:
        data = await self._get(f"{season}/driverStandings/?format=json&limit=100")
        lists = data["MRData"]["StandingsTable"]["StandingsLists"]
        if not lists:
            return []
        out: list[ProviderDriverStanding] = []
        for row in lists[0].get("DriverStandings", []):
            d = row.get("Driver", {})
            cons = (row.get("Constructors") or [{}])[-1]
            out.append(
                ProviderDriverStanding(
                    position=int(row.get("position", 0)),
                    points=float(row.get("points", 0)),
                    wins=int(row.get("wins", 0)),
                    code=d.get("code") or d.get("driverId", "").upper()[:3],
                    given=d.get("givenName", ""),
                    family=d.get("familyName", ""),
                    constructor_id=cons.get("constructorId", ""),
                    constructor_name=cons.get("name", ""),
                    driver_id=d.get("driverId", ""),
                )
            )
        return out

    async def constructor_standings(
        self, season: int
    ) -> list[ProviderConstructorStanding]:
        data = await self._get(f"{season}/constructorStandings/?format=json&limit=100")
        lists = data["MRData"]["StandingsTable"]["StandingsLists"]
        if not lists:
            return []
        out: list[ProviderConstructorStanding] = []
        for row in lists[0].get("ConstructorStandings", []):
            c = row.get("Constructor", {})
            out.append(
                ProviderConstructorStanding(
                    position=int(row.get("position", 0)),
                    points=float(row.get("points", 0)),
                    wins=int(row.get("wins", 0)),
                    constructor_id=c.get("constructorId", ""),
                    constructor_name=c.get("name", ""),
                )
            )
        return out

    async def race_results(self, season: int, rnd: int | str) -> list[ProviderRaceResult]:
        data = await self._get(f"{season}/{rnd}/results/?format=json&limit=100")
        races = data["MRData"]["RaceTable"]["Races"]
        if not races:
            return []
        out: list[ProviderRaceResult] = []
        for row in races[0].get("Results", []):
            d = row.get("Driver", {})
            c = row.get("Constructor", {})
            t = row.get("Time") or {}
            out.append(
                ProviderRaceResult(
                    position=int(row.get("position", 0)),
                    points=float(row.get("points", 0)),
                    grid=int(row.get("grid", 0)),
                    status=row.get("status", ""),
                    time=t.get("time"),
                    code=d.get("code") or d.get("driverId", "").upper()[:3],
                    given=d.get("givenName", ""),
                    family=d.get("familyName", ""),
                    constructor_id=c.get("constructorId", ""),
                    constructor_name=c.get("name", ""),
                    driver_id=d.get("driverId", ""),
                )
            )
        return out

    async def qualifying_results(
        self, season: int, rnd: int | str
    ) -> list[ProviderQualifyingResult]:
        data = await self._get(f"{season}/{rnd}/qualifying/?format=json&limit=100")
        races = data["MRData"]["RaceTable"]["Races"]
        if not races:
            return []
        out: list[ProviderQualifyingResult] = []
        for row in races[0].get("QualifyingResults", []):
            d = row.get("Driver", {})
            c = row.get("Constructor", {})
            out.append(
                ProviderQualifyingResult(
                    position=int(row.get("position", 0)),
                    code=d.get("code") or d.get("driverId", "").upper()[:3],
                    given=d.get("givenName", ""),
                    family=d.get("familyName", ""),
                    constructor_id=c.get("constructorId", ""),
                    constructor_name=c.get("name", ""),
                    driver_id=d.get("driverId", ""),
                    q1=row.get("Q1") or None,
                    q2=row.get("Q2") or None,
                    q3=row.get("Q3") or None,
                )
            )
        return out

    async def driver_info(
        self, season: int, driver_id: str
    ) -> ProviderDriverInfo | None:
        data = await self._get(f"{season}/drivers/{driver_id}/?format=json")
        drivers = data["MRData"]["DriverTable"]["Drivers"]
        if not drivers:
            return None
        d = drivers[0]
        return ProviderDriverInfo(
            driver_id=d.get("driverId", driver_id),
            code=d.get("code") or driver_id.upper()[:3],
            given=d.get("givenName", ""),
            family=d.get("familyName", ""),
            number=d.get("permanentNumber"),
            nationality=d.get("nationality"),
            dob=d.get("dateOfBirth"),
        )

    async def driver_results(
        self, season: int, driver_id: str
    ) -> list[ProviderDriverSeasonResult]:
        data = await self._get(
            f"{season}/drivers/{driver_id}/results/?format=json&limit=100"
        )
        races = data["MRData"]["RaceTable"]["Races"]
        out: list[ProviderDriverSeasonResult] = []
        for race in races:
            res = (race.get("Results") or [{}])[0]
            out.append(
                ProviderDriverSeasonResult(
                    round=int(race.get("round", 0)),
                    race_name=race.get("raceName", ""),
                    circuit_id=race.get("Circuit", {}).get("circuitId", ""),
                    position=int(res.get("position", 0) or 0),
                    points=float(res.get("points", 0) or 0),
                    grid=int(res.get("grid", 0) or 0),
                    status=res.get("status", ""),
                )
            )
        return out
