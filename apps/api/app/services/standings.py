"""Зачёты (личный и конструкторов): тянем у провайдера и держим в лёгком TTL-кэше
(в процессе), чтобы не бить провайдера на каждый запрос. Зачёт меняется после гонок —
часа хватает. Для прода это позже переедет в Redis/БД, как расписание."""

import time

from ..providers import get_provider
from ..providers.base import ProviderConstructorStanding, ProviderDriverStanding

TTL = 3600.0
_drivers: dict[int, tuple[float, list[ProviderDriverStanding]]] = {}
_constructors: dict[int, tuple[float, list[ProviderConstructorStanding]]] = {}


async def get_driver_standings(season: int) -> list[ProviderDriverStanding]:
    now = time.time()
    hit = _drivers.get(season)
    if hit and hit[0] > now:
        return hit[1]
    rows = await get_provider().driver_standings(season)
    if rows:
        _drivers[season] = (now + TTL, rows)
    return rows


async def get_constructor_standings(season: int) -> list[ProviderConstructorStanding]:
    now = time.time()
    hit = _constructors.get(season)
    if hit and hit[0] > now:
        return hit[1]
    rows = await get_provider().constructor_standings(season)
    if rows:
        _constructors[season] = (now + TTL, rows)
    return rows
