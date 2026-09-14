"""Зачёты (личный и конструкторов): данные провайдера в общем Redis-кэше (см. app.cache).
TTL час — зачёт меняется после гонок."""

from dataclasses import asdict

from ..cache import cached
from ..providers import get_provider
from ..providers.base import ProviderConstructorStanding, ProviderDriverStanding

TTL = 3600


async def get_driver_standings(season: int) -> list[ProviderDriverStanding]:
    async def fetch() -> list[dict]:
        return [asdict(x) for x in await get_provider().driver_standings(season)]

    data = await cached(f"standings:drivers:{season}", TTL, fetch)
    return [ProviderDriverStanding(**d) for d in data]


async def get_constructor_standings(season: int) -> list[ProviderConstructorStanding]:
    async def fetch() -> list[dict]:
        return [asdict(x) for x in await get_provider().constructor_standings(season)]

    data = await cached(f"standings:constructors:{season}", TTL, fetch)
    return [ProviderConstructorStanding(**d) for d in data]
