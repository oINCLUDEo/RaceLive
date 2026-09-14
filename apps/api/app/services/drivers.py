"""Профиль пилота: инфо + результаты по сезону, TTL-кэш в процессе."""

import time

from ..providers import get_provider
from ..providers.base import ProviderDriverInfo, ProviderDriverSeasonResult

TTL_INFO = 24 * 3600.0
TTL_RES = 3600.0
_info: dict[tuple[int, str], tuple[float, ProviderDriverInfo | None]] = {}
_res: dict[tuple[int, str], tuple[float, list[ProviderDriverSeasonResult]]] = {}


async def get_driver_info(season: int, driver_id: str) -> ProviderDriverInfo | None:
    key = (season, driver_id)
    now = time.time()
    hit = _info.get(key)
    if hit and hit[0] > now:
        return hit[1]
    v = await get_provider().driver_info(season, driver_id)
    if v:
        _info[key] = (now + TTL_INFO, v)
    return v


async def get_driver_results(
    season: int, driver_id: str
) -> list[ProviderDriverSeasonResult]:
    key = (season, driver_id)
    now = time.time()
    hit = _res.get(key)
    if hit and hit[0] > now:
        return hit[1]
    rows = await get_provider().driver_results(season, driver_id)
    if rows:
        _res[key] = (now + TTL_RES, rows)
    return rows
