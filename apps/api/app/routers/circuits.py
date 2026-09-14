from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from ..circuits_facts import CIRCUIT_FACTS
from ..db import get_db
from ..localization import (
    circuit_name_ru,
    country_code,
    country_ru,
    driver_name_ru,
    team_slug_for,
)
from ..models import Meeting
from ..providers import get_provider
from ..schemas import CircuitListItemOut, CircuitPageOut
from ..services import results as res_svc
from ..services import schedule as sched_svc

router = APIRouter(prefix="/api/v1", tags=["circuits"])


def _year() -> int:
    return datetime.now(timezone.utc).year


async def _meetings(db: AsyncSession) -> list[Meeting]:
    return await sched_svc.get_schedule(db, get_provider(), _year())


@router.get("/circuits", response_model=list[CircuitListItemOut])
async def circuits_index(db: AsyncSession = Depends(get_db)):
    out: list[CircuitListItemOut] = []
    for m in await _meetings(db):
        c = m.circuit
        if not c:
            continue
        out.append(
            CircuitListItemOut(
                key=c.key,
                name_ru=c.name_ru or circuit_name_ru(c.key, c.name_en),
                name_en=c.name_en,
                country=country_ru(c.key, c.country) or c.country,
                country_code=country_code(c.key, c.country),
                round=m.round,
            )
        )
    return out


@router.get("/circuits/{key}", response_model=CircuitPageOut)
async def circuit_detail(key: str, db: AsyncSession = Depends(get_db)):
    facts = CIRCUIT_FACTS.get(key)
    meeting = next((m for m in await _meetings(db) if m.circuit and m.circuit.key == key), None)
    if not facts and meeting is None:
        raise HTTPException(status_code=404, detail="Трасса не найдена")

    name_en = (facts or {}).get("name_en") or (
        meeting.circuit.name_en if meeting and meeting.circuit else key
    )
    country_en = meeting.circuit.country if meeting and meeting.circuit else None

    winner_ru = winner_en = winner_team = None
    if meeting and meeting.ends_at and meeting.ends_at < datetime.now(timezone.utc):
        res = await res_svc.get_race_results(_year(), meeting.round)
        if res:
            w = res[0]
            winner_en = f"{w.given} {w.family}".strip()
            winner_ru = driver_name_ru(w.code, winner_en)
            winner_team = team_slug_for(w.constructor_id)

    return CircuitPageOut(
        key=key,
        name_ru=circuit_name_ru(key, name_en),
        name_en=name_en,
        country=country_ru(key, country_en),
        country_code=country_code(key, country_en),
        length_m=(facts or {}).get("length_m"),
        opened=(facts or {}).get("opened"),
        first_gp=(facts or {}).get("first_gp"),
        locality=(facts or {}).get("locality"),
        round=meeting.round if meeting else None,
        meeting_starts_at=meeting.starts_at if meeting else None,
        meeting_name_ru=(meeting.name_ru if meeting else None),
        meeting_name_en=(meeting.name_en if meeting else None),
        winner_name_ru=winner_ru,
        winner_name_en=winner_en,
        winner_team_slug=winner_team,
    )
