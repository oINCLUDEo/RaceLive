"""Личный зачёт: тянем у провайдера и держим в лёгком TTL-кэше (в процессе),
чтобы не бить провайдера на каждый запрос. Зачёт меняется после гонок — часа хватает.
Для прода это позже переедет в Redis/БД, как расписание."""

import time

from ..providers import get_provider
from ..providers.base import ProviderDriverStanding

_cache: dict[int, tuple[float, list[ProviderDriverStanding]]] = {}
TTL = 3600.0


async def get_driver_standings(season: int) -> list[ProviderDriverStanding]:
    now = time.time()
    hit = _cache.get(season)
    if hit and hit[0] > now:
        return hit[1]
    rows = await get_provider().driver_standings(season)
    if rows:  # пустой (провизорный сезон) не кэшируем
        _cache[season] = (now + TTL, rows)
    return rows
