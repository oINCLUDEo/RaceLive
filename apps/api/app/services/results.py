"""Итоги гонок и квалификация: данные провайдера в общем Redis-кэше (см. app.cache).
Завершённая гонка не меняется → TTL длинный."""

from dataclasses import asdict

from ..cache import cached
from ..providers import get_provider
from ..providers.base import ProviderQualifyingResult, ProviderRaceResult

TTL = 6 * 3600


async def get_race_results(season: int, rnd: int | str) -> list[ProviderRaceResult]:
    async def fetch() -> list[dict]:
        return [asdict(x) for x in await get_provider().race_results(season, rnd)]

    data = await cached(f"results:race:{season}:{rnd}", TTL, fetch)
    return [ProviderRaceResult(**d) for d in data]


async def get_qualifying_results(
    season: int, rnd: int | str
) -> list[ProviderQualifyingResult]:
    async def fetch() -> list[dict]:
        return [asdict(x) for x in await get_provider().qualifying_results(season, rnd)]

    data = await cached(f"results:quali:{season}:{rnd}", TTL, fetch)
    return [ProviderQualifyingResult(**d) for d in data]
