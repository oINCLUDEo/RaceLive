"""Итоги гонок: тянем у провайдера с TTL-кэшем (в процессе). Завершённая гонка не
меняется, поэтому TTL длинный. Для прода переедет в БД (is_final), как в архитектуре."""

import time

from ..providers import get_provider
from ..providers.base import ProviderQualifyingResult, ProviderRaceResult

TTL = 6 * 3600.0
_race: dict[tuple[int, str], tuple[float, list[ProviderRaceResult]]] = {}
_qual: dict[tuple[int, str], tuple[float, list[ProviderQualifyingResult]]] = {}


async def get_race_results(season: int, rnd: int | str) -> list[ProviderRaceResult]:
    key = (season, str(rnd))
    now = time.time()
    hit = _race.get(key)
    if hit and hit[0] > now:
        return hit[1]
    rows = await get_provider().race_results(season, rnd)
    if rows:
        _race[key] = (now + TTL, rows)
    return rows


async def get_qualifying_results(
    season: int, rnd: int | str
) -> list[ProviderQualifyingResult]:
    key = (season, str(rnd))
    now = time.time()
    hit = _qual.get(key)
    if hit and hit[0] > now:
        return hit[1]
    rows = await get_provider().qualifying_results(season, rnd)
    if rows:
        _qual[key] = (now + TTL, rows)
    return rows
