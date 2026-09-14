from datetime import datetime, timezone

from fastapi import APIRouter, Query

from ..localization import driver_name_ru, team_slug_for
from ..schemas import QualifyingResultOut, RaceResultOut
from ..services import results as svc

router = APIRouter(prefix="/api/v1", tags=["results"])


def _year() -> int:
    return datetime.now(timezone.utc).year


@router.get("/results/{rnd}", response_model=list[RaceResultOut])
async def race_results(rnd: int, season: int = Query(default_factory=_year)):
    rows = await svc.get_race_results(season, rnd)
    return [
        RaceResultOut(
            position=r.position,
            points=r.points,
            grid=r.grid,
            status=r.status,
            time=r.time,
            code=r.code,
            driver_id=r.driver_id,
            name_ru=driver_name_ru(r.code, f"{r.given} {r.family}"),
            name_en=f"{r.given} {r.family}".strip(),
            team_slug=team_slug_for(r.constructor_id),
            team_name=r.constructor_name,
        )
        for r in rows
    ]


@router.get("/qualifying/{rnd}", response_model=list[QualifyingResultOut])
async def qualifying_results(rnd: int, season: int = Query(default_factory=_year)):
    rows = await svc.get_qualifying_results(season, rnd)
    return [
        QualifyingResultOut(
            position=r.position,
            code=r.code,
            driver_id=r.driver_id,
            name_ru=driver_name_ru(r.code, f"{r.given} {r.family}"),
            name_en=f"{r.given} {r.family}".strip(),
            team_slug=team_slug_for(r.constructor_id),
            team_name=r.constructor_name,
            q1=r.q1,
            q2=r.q2,
            q3=r.q3,
        )
        for r in rows
    ]
