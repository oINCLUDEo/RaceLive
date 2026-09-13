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


class NextSessionOut(BaseModel):
    """Ближайшая предстоящая сессия + минимальный контекст этапа."""

    round: int
    meeting_name_ru: str | None
    meeting_name_en: str
    session: SessionOut
