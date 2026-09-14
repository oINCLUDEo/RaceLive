from datetime import datetime, timezone

from fastapi import APIRouter, Query

from ..localization import driver_name_ru, team_slug_for
from ..schemas import ConstructorStandingOut, DriverStandingOut
from ..services import standings as svc

router = APIRouter(prefix="/api/v1", tags=["standings"])


def _year() -> int:
    return datetime.now(timezone.utc).year


@router.get("/standings/drivers", response_model=list[DriverStandingOut])
async def driver_standings(season: int = Query(default_factory=_year)):
    rows = await svc.get_driver_standings(season)
    if not rows and season == _year():
        rows = await svc.get_driver_standings(season - 1)  # провизорный/пустой → прошлый
    return [
        DriverStandingOut(
            position=r.position,
            points=r.points,
            wins=r.wins,
            code=r.code,
            name_ru=driver_name_ru(r.code, f"{r.given} {r.family}"),
            name_en=f"{r.given} {r.family}".strip(),
            team_slug=team_slug_for(r.constructor_id),
            team_name=r.constructor_name,
        )
        for r in rows
    ]


@router.get("/standings/constructors", response_model=list[ConstructorStandingOut])
async def constructor_standings(season: int = Query(default_factory=_year)):
    rows = await svc.get_constructor_standings(season)
    if not rows and season == _year():
        rows = await svc.get_constructor_standings(season - 1)
    return [
        ConstructorStandingOut(
            position=r.position,
            points=r.points,
            wins=r.wins,
            team_slug=team_slug_for(r.constructor_id),
            team_name=r.constructor_name,
        )
        for r in rows
    ]
