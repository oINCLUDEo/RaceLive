from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException, Query

from ..localization import driver_name_ru, meeting_name_ru, team_slug_for
from ..schemas import DriverProfileOut, DriverSeasonResultOut
from ..services import drivers as dsvc
from ..services import standings as ssvc

router = APIRouter(prefix="/api/v1", tags=["drivers"])


def _year() -> int:
    return datetime.now(timezone.utc).year


@router.get("/drivers/{driver_id}", response_model=DriverProfileOut)
async def driver_profile(driver_id: str, season: int = Query(default_factory=_year)):
    used = season
    info = await dsvc.get_driver_info(season, driver_id)
    if info is None:
        used = season - 1
        info = await dsvc.get_driver_info(used, driver_id)
    if info is None:
        raise HTTPException(status_code=404, detail="Пилот не найден")

    results = await dsvc.get_driver_results(used, driver_id)
    standings = await ssvc.get_driver_standings(used)
    st = next((s for s in standings if s.driver_id == driver_id), None)
    name_en = f"{info.given} {info.family}".strip()

    return DriverProfileOut(
        driver_id=info.driver_id,
        code=info.code,
        name_ru=driver_name_ru(info.code, name_en),
        name_en=name_en,
        number=info.number,
        nationality=info.nationality,
        dob=info.dob,
        team_slug=team_slug_for(st.constructor_id) if st else None,
        team_name=st.constructor_name if st else None,
        position=st.position if st else None,
        points=st.points if st else None,
        wins=st.wins if st else None,
        results=[
            DriverSeasonResultOut(
                round=r.round,
                name_ru=meeting_name_ru(r.circuit_id, r.race_name),
                name_en=r.race_name,
                position=r.position,
                points=r.points,
                status=r.status,
            )
            for r in results
        ],
    )
