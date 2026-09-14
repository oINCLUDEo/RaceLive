"""Итоги гонок: тянем у провайдера с TTL-кэшем (в процессе). Завершённая гонка не
меняется, поэтому TTL длинный. Для прода переедет в БД (is_final), как в архитектуре."""

import time

from ..providers import get_provider
from ..providers.base import ProviderRaceResult

TTL = 6 * 3600.0
_cache: dict[tuple[int, str], tuple[float, list[ProviderRaceResult]]] = {}


async def get_race_results(season: int, rnd: int | str) -> list[ProviderRaceResult]:
    key = (season, str(rnd))
    now = time.time()
    hit = _cache.get(key)
    if hit and hit[0] > now:
        return hit[1]
    rows = await get_provider().race_results(season, rnd)
    if rows:
        _cache[key] = (now + TTL, rows)
    return rows
