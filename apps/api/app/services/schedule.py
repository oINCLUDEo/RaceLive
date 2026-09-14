"""Кэш-through для расписания.

Сезон тянется у провайдера один раз, кладётся в Postgres и обновляется не чаще, чем раз в
SCHEDULE_TTL_HOURS. Это выполняет требование «кэширование вместо повторных обращений».
"""

from datetime import datetime, timedelta, timezone

UTC = timezone.utc

from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from ..config import get_settings
from ..models import Circuit, Meeting, Season, Session
from ..providers.base import DataProvider


async def _get_circuit(db: AsyncSession, key: str, name_en: str,
                       name_ru: str | None, country: str | None) -> Circuit:
    existing = (
        await db.execute(select(Circuit).where(Circuit.key == key))
    ).scalar_one_or_none()
    if existing:
        return existing
    circuit = Circuit(key=key, name_en=name_en, name_ru=name_ru, country=country)
    db.add(circuit)
    await db.flush()
    return circuit


async def _is_fresh(season: Season) -> bool:
    ttl = timedelta(hours=get_settings().schedule_ttl_hours)
    updated = season.updated_at
    if updated is None:
        return False
    if updated.tzinfo is None:
        updated = updated.replace(tzinfo=UTC)
    return datetime.now(UTC) - updated < ttl


async def ensure_cached(db: AsyncSession, provider: DataProvider, year: int) -> Season:
    season = (
        await db.execute(select(Season).where(Season.year == year))
    ).scalar_one_or_none()

    if season and await _is_fresh(season):
        return season

    meetings = await provider.schedule(year)

    if season is None:
        season = Season(year=year)
        db.add(season)
        await db.flush()
    else:
        # полная замена этапов сезона: прямой DELETE без ленивой загрузки
        # relationship (иначе MissingGreenlet в async). FK ondelete=CASCADE в БД
        # снесёт связанные сессии.
        await db.execute(delete(Meeting).where(Meeting.season_id == season.id))
        await db.flush()

    for pm in meetings:
        circuit = await _get_circuit(
            db, pm.circuit_key, pm.circuit_name_en, pm.circuit_name_ru, pm.country
        )
        meeting = Meeting(
            season_id=season.id,
            circuit_id=circuit.id,
            round=pm.round,
            name_en=pm.name_en,
            name_ru=pm.name_ru,
            starts_at=pm.starts_at,
            ends_at=pm.ends_at,
        )
        db.add(meeting)
        await db.flush()
        for ps in pm.sessions:
            db.add(
                Session(
                    meeting_id=meeting.id,
                    type=ps.type,
                    name_en=ps.name_en,
                    name_ru=ps.name_ru,
                    starts_at=ps.starts_at,
                    provider_key=ps.provider_key,
                )
            )

    season.updated_at = datetime.now(UTC)
    await db.commit()
    return season


async def get_schedule(db: AsyncSession, provider: DataProvider, year: int) -> list[Meeting]:
    await ensure_cached(db, provider, year)
    result = await db.execute(
        select(Meeting)
        .join(Season)
        .where(Season.year == year)
        .options(selectinload(Meeting.sessions), selectinload(Meeting.circuit))
        .order_by(Meeting.round)
    )
    return list(result.scalars().all())


async def get_meeting(db: AsyncSession, provider: DataProvider, year: int,
                      rnd: int) -> Meeting | None:
    await ensure_cached(db, provider, year)
    result = await db.execute(
        select(Meeting)
        .join(Season)
        .where(Season.year == year, Meeting.round == rnd)
        .options(selectinload(Meeting.sessions), selectinload(Meeting.circuit))
    )
    return result.scalar_one_or_none()


async def get_next_session(db: AsyncSession, provider: DataProvider,
                           year: int) -> tuple[Meeting, Session] | None:
    await ensure_cached(db, provider, year)
    now = datetime.now(UTC)
    result = await db.execute(
        select(Session, Meeting)
        .join(Meeting, Session.meeting_id == Meeting.id)
        .join(Season, Meeting.season_id == Season.id)
        .where(Season.year == year, Session.starts_at > now)
        .options(selectinload(Meeting.circuit))
        .order_by(Session.starts_at)
        .limit(1)
    )
    row = result.first()
    if row is None:
        return None
    session, meeting = row
    return meeting, session


# Примерная длительность сессии (мин) — для определения «идёт сейчас».
_SESSION_DURATION = {
    "practice": 70,
    "qualifying": 70,
    "sprint_qualifying": 50,
    "sprint": 60,
    "race": 150,
}


async def get_live_session(
    db: AsyncSession, provider: DataProvider, year: int
) -> tuple[Meeting, Session] | None:
    """Идёт ли сессия прямо сейчас (по расписанию): последняя стартовавшая сессия,
    если её окно ещё не закрылось."""
    await ensure_cached(db, provider, year)
    now = datetime.now(UTC)
    result = await db.execute(
        select(Session, Meeting)
        .join(Meeting, Session.meeting_id == Meeting.id)
        .join(Season, Meeting.season_id == Season.id)
        .where(Season.year == year, Session.starts_at <= now)
        .options(selectinload(Meeting.circuit))
        .order_by(Session.starts_at.desc())
        .limit(1)
    )
    row = result.first()
    if row is None:
        return None
    session, meeting = row
    dur = _SESSION_DURATION.get(session.type, 90)
    if session.starts_at and now < session.starts_at + timedelta(minutes=dur):
        return meeting, session
    return None


def list_seasons_range() -> list[int]:
    """Диапазон сезонов, доступных в UI (текущий год и несколько назад)."""
    current = datetime.now(UTC).year
    return list(range(current, current - 6, -1))
