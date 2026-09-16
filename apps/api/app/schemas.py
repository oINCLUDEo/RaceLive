"""Публичные сериализаторы.

ВАЖНО (правовой контур): ни одна из этих моделей не является объектом провайдера.
Публичный API отдаёт только эти представления. Сырые ответы OpenF1/Jolpica наружу не выходят.
"""

from datetime import datetime

from pydantic import BaseModel


class SessionOut(BaseModel):
    type: str
    name_ru: str | None
    name_en: str
    starts_at: datetime | None
    status: str
    is_final: bool


class CircuitOut(BaseModel):
    key: str
    name_ru: str | None
    name_en: str
    country: str | None
    country_code: str | None = None  # ISO2 для флага


class MeetingOut(BaseModel):
    round: int
    name_ru: str | None
    name_en: str
    starts_at: datetime | None
    ends_at: datetime | None
    circuit: CircuitOut | None
    sessions: list[SessionOut]


class SeasonOut(BaseModel):
    year: int


class DriverStandingOut(BaseModel):
    position: int
    points: float
    wins: int
    code: str
    driver_id: str
    name_ru: str | None
    name_en: str
    team_slug: str | None
    team_name: str | None


class QualifyingResultOut(BaseModel):
    position: int
    code: str
    driver_id: str
    name_ru: str | None
    name_en: str
    team_slug: str | None
    team_name: str
    q1: str | None
    q2: str | None
    q3: str | None


class DriverSeasonResultOut(BaseModel):
    round: int
    name_ru: str | None
    name_en: str
    position: int
    points: float
    status: str


class DriverProfileOut(BaseModel):
    driver_id: str
    code: str
    name_ru: str | None
    name_en: str
    number: str | None
    nationality: str | None
    dob: str | None
    team_slug: str | None
    team_name: str | None
    position: int | None
    points: float | None
    wins: int | None
    photo_url: str | None = None
    results: list[DriverSeasonResultOut]


class RaceResultOut(BaseModel):
    position: int
    points: float
    grid: int
    status: str
    time: str | None
    code: str
    driver_id: str
    name_ru: str | None
    name_en: str
    team_slug: str | None
    team_name: str


class TeamDriverOut(BaseModel):
    code: str
    driver_id: str
    name_ru: str | None
    name_en: str
    points: float


class TeamRoundEntryOut(BaseModel):
    code: str
    driver_id: str
    name_ru: str | None
    name_en: str
    position: int
    status: str
    points: float


class TeamRoundOut(BaseModel):
    round: int
    name_ru: str | None
    name_en: str
    team_points: float
    entries: list[TeamRoundEntryOut]


class TeamH2HOut(BaseModel):
    a_id: str
    a_name: str
    b_id: str
    b_name: str
    a_ahead: int
    b_ahead: int


class TeamProfileOut(BaseModel):
    slug: str
    name: str
    nationality: str | None
    position: int | None
    points: float | None
    wins: int | None
    drivers: list[TeamDriverOut]
    rounds: list[TeamRoundOut]
    h2h: TeamH2HOut | None


class ConstructorStandingOut(BaseModel):
    position: int
    points: float
    wins: int
    team_slug: str | None
    team_name: str


class CircuitListItemOut(BaseModel):
    key: str
    name_ru: str | None
    name_en: str
    country: str | None
    country_code: str | None
    round: int | None


class CircuitPageOut(BaseModel):
    key: str
    name_ru: str | None
    name_en: str
    country: str | None
    country_code: str | None
    length_m: int | None
    opened: int | None
    first_gp: int | None
    locality: str | None
    round: int | None
    meeting_starts_at: datetime | None
    meeting_name_ru: str | None
    meeting_name_en: str | None
    winner_name_ru: str | None
    winner_name_en: str | None
    winner_team_slug: str | None


class NextSessionOut(BaseModel):
    """Ближайшая предстоящая сессия + минимальный контекст этапа."""

    round: int
    meeting_name_ru: str | None
    meeting_name_en: str
    session: SessionOut


class LiveOut(BaseModel):
    """Статус эфира: идёт ли сессия сейчас, иначе — ближайшая."""

    live: bool
    round: int | None
    meeting_name_ru: str | None
    meeting_name_en: str | None
    session: SessionOut | None
