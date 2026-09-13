from datetime import datetime, timezone

UTC = timezone.utc

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from ..db import get_db
from ..localization import circuit_name_ru, country_ru, meeting_name_ru
from ..models import Meeting, Session
from ..providers import get_provider
from ..schemas import (
    CircuitOut,
    MeetingOut,
    NextSessionOut,
    SeasonOut,
    SessionOut,
)
from ..services import schedule as svc

router = APIRouter(prefix="/api/v1", tags=["schedule"])


def _session_out(s: Session) -> SessionOut:
    return SessionOut(
        type=s.type,
        name_ru=s.name_ru,
        name_en=s.name_en,
        starts_at=s.starts_at,
        status=s.status,
        is_final=s.is_final,
    )


def _meeting_out(m: Meeting) -> MeetingOut:
    ckey = m.circuit.key if m.circuit else None
    return MeetingOut(
        round=m.round,
        # RU из БД, иначе fallback по справочнику локализации (покрывает старый кэш)
        name_ru=m.name_ru or meeting_name_ru(ckey, m.name_en),
        name_en=m.name_en,
        starts_at=m.starts_at,
        ends_at=m.ends_at,
        circuit=(
            CircuitOut(
                key=m.circuit.key,
                name_ru=m.circuit.name_ru or circuit_name_ru(ckey, m.circuit.name_en),
                name_en=m.circuit.name_en,
                country=country_ru(ckey, m.circuit.country) or m.circuit.country,
            )
            if m.circuit
            else None
        ),
        sessions=[_session_out(s) for s in m.sessions],
    )


def _default_year() -> int:
    return datetime.now(UTC).year


@router.get("/seasons", response_model=list[SeasonOut])
async def seasons() -> list[SeasonOut]:
    return [SeasonOut(year=y) for y in svc.list_seasons_range()]


@router.get("/schedule", response_model=list[MeetingOut])
async def schedule(
    season: int = Query(default_factory=_default_year),
    db: AsyncSession = Depends(get_db),
) -> list[MeetingOut]:
    meetings = await svc.get_schedule(db, get_provider(), season)
    return [_meeting_out(m) for m in meetings]


@router.get("/meetings/{rnd}", response_model=MeetingOut)
async def meeting(
    rnd: int,
    season: int = Query(default_factory=_default_year),
    db: AsyncSession = Depends(get_db),
) -> MeetingOut:
    m = await svc.get_meeting(db, get_provider(), season, rnd)
    if m is None:
        raise HTTPException(status_code=404, detail="Этап не найден")
    return _meeting_out(m)


@router.get("/next-session", response_model=NextSessionOut | None)
async def next_session(db: AsyncSession = Depends(get_db)) -> NextSessionOut | None:
    provider = get_provider()
    year = _default_year()
    found = await svc.get_next_session(db, provider, year)
    if found is None:
        # текущий сезон закончился — заглянуть в следующий
        found = await svc.get_next_session(db, provider, year + 1)
    if found is None:
        return None
    m, s = found
    return NextSessionOut(
        round=m.round,
        meeting_name_ru=m.name_ru,
        meeting_name_en=m.name_en,
        session=_session_out(s),
    )
