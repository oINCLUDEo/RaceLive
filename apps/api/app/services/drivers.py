"""Профиль пилота: инфо + результаты сезона, общий Redis-кэш (см. app.cache)."""

from dataclasses import asdict

from ..cache import cached
from ..providers import get_provider
from ..providers.base import ProviderDriverInfo, ProviderDriverSeasonResult

TTL_INFO = 24 * 3600
TTL_RES = 3600


async def get_driver_info(season: int, driver_id: str) -> ProviderDriverInfo | None:
    async def fetch() -> dict | None:
        v = await get_provider().driver_info(season, driver_id)
        return asdict(v) if v else None

    data = await cached(f"driver:info:{season}:{driver_id}", TTL_INFO, fetch)
    return ProviderDriverInfo(**data) if data else None


async def get_driver_results(
    season: int, driver_id: str
) -> list[ProviderDriverSeasonResult]:
    async def fetch() -> list[dict]:
        return [
            asdict(x) for x in await get_provider().driver_results(season, driver_id)
        ]

    data = await cached(f"driver:results:{season}:{driver_id}", TTL_RES, fetch)
    return [ProviderDriverSeasonResult(**d) for d in data]
