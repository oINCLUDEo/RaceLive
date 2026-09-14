"""Данные команды: профиль + результаты по этапам, общий Redis-кэш (app.cache)."""

from dataclasses import asdict

from ..cache import cached
from ..providers import get_provider
from ..providers.base import (
    ProviderConstructorInfo,
    ProviderConstructorRound,
    ProviderResultEntry,
)

TTL_INFO = 24 * 3600
TTL_RES = 3600


async def get_constructor_info(
    season: int, cid: str
) -> ProviderConstructorInfo | None:
    async def fetch() -> dict | None:
        v = await get_provider().constructor_info(season, cid)
        return asdict(v) if v else None

    data = await cached(f"cons:info:{season}:{cid}", TTL_INFO, fetch)
    return ProviderConstructorInfo(**data) if data else None


async def get_constructor_results(
    season: int, cid: str
) -> list[ProviderConstructorRound]:
    async def fetch() -> list[dict]:
        return [asdict(x) for x in await get_provider().constructor_results(season, cid)]

    data = await cached(f"cons:results:{season}:{cid}", TTL_RES, fetch)
    return [
        ProviderConstructorRound(
            round=d["round"],
            race_name=d["race_name"],
            circuit_id=d["circuit_id"],
            entries=[ProviderResultEntry(**e) for e in d["entries"]],
        )
        for d in data
    ]
