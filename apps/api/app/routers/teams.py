import asyncio
from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException, Query

from ..localization import constructor_id_for, driver_name_ru, meeting_name_ru
from ..schemas import (
    TeamDriverOut,
    TeamH2HOut,
    TeamProfileOut,
    TeamRoundEntryOut,
    TeamRoundOut,
)
from ..services import standings as ssvc
from ..services import teams as tsvc

router = APIRouter(prefix="/api/v1", tags=["teams"])


def _year() -> int:
    return datetime.now(timezone.utc).year


@router.get("/teams/{slug}", response_model=TeamProfileOut)
async def team_profile(slug: str, season: int = Query(default_factory=_year)):
    cid = constructor_id_for(slug)
    if cid is None:
        raise HTTPException(status_code=404, detail="Команда не найдена")

    used = season
    cons = await ssvc.get_constructor_standings(used)
    if not cons:
        used = season - 1
        cons = await ssvc.get_constructor_standings(used)
    st = next((c for c in cons if c.constructor_id == cid), None)

    info, results, drivers = await asyncio.gather(
        tsvc.get_constructor_info(used, cid),
        tsvc.get_constructor_results(used, cid),
        ssvc.get_driver_standings(used),
        return_exceptions=True,
    )
    if isinstance(info, BaseException):
        info = None
    if isinstance(results, BaseException):
        results = []
    if isinstance(drivers, BaseException):
        drivers = []

    roster = [
        TeamDriverOut(
            code=d.code,
            driver_id=d.driver_id,
            name_ru=driver_name_ru(d.code, f"{d.given} {d.family}"),
            name_en=f"{d.given} {d.family}".strip(),
            points=d.points,
        )
        for d in drivers
        if d.constructor_id == cid
    ]

    rounds = [
        TeamRoundOut(
            round=r.round,
            name_ru=meeting_name_ru(r.circuit_id, r.race_name),
            name_en=r.race_name,
            team_points=sum(e.points for e in r.entries),
            entries=[
                TeamRoundEntryOut(
                    code=e.code,
                    driver_id=e.driver_id,
                    name_ru=driver_name_ru(e.code, f"{e.given} {e.family}"),
                    name_en=f"{e.given} {e.family}".strip(),
                    position=e.position,
                    status=e.status,
                    points=e.points,
                )
                for e in r.entries
            ],
        )
        for r in results
    ]

    h2h = None
    if len(roster) >= 2:
        a, b = roster[0], roster[1]
        a_ahead = b_ahead = 0
        for r in results:
            by_id = {e.driver_id: e for e in r.entries}
            ea, eb = by_id.get(a.driver_id), by_id.get(b.driver_id)
            if ea and eb and ea.position > 0 and eb.position > 0:
                if ea.position < eb.position:
                    a_ahead += 1
                elif eb.position < ea.position:
                    b_ahead += 1
        h2h = TeamH2HOut(
            a_id=a.driver_id,
            a_name=a.name_ru or a.name_en,
            b_id=b.driver_id,
            b_name=b.name_ru or b.name_en,
            a_ahead=a_ahead,
            b_ahead=b_ahead,
        )

    return TeamProfileOut(
        slug=slug,
        name=st.constructor_name if st else (info.name if info else slug),
        nationality=info.nationality if info else None,
        position=st.position if st else None,
        points=st.points if st else None,
        wins=st.wins if st else None,
        drivers=roster,
        rounds=rounds,
        h2h=h2h,
    )
