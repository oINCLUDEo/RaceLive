from datetime import datetime

from sqlalchemy import (
    Boolean,
    DateTime,
    ForeignKey,
    Integer,
    String,
    UniqueConstraint,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .db import Base


class Season(Base):
    __tablename__ = "seasons"

    id: Mapped[int] = mapped_column(primary_key=True)
    year: Mapped[int] = mapped_column(Integer, unique=True, index=True)
    # когда сезон в последний раз обновлялся из провайдера (для TTL-кэша)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    meetings: Mapped[list["Meeting"]] = relationship(
        back_populates="season",
        cascade="all, delete-orphan",
        order_by="Meeting.round",
    )


class Circuit(Base):
    __tablename__ = "circuits"

    id: Mapped[int] = mapped_column(primary_key=True)
    key: Mapped[str] = mapped_column(String, unique=True, index=True)
    name_ru: Mapped[str | None] = mapped_column(String, nullable=True)
    name_en: Mapped[str] = mapped_column(String)
    country: Mapped[str | None] = mapped_column(String, nullable=True)


class Meeting(Base):
    __tablename__ = "meetings"
    __table_args__ = (UniqueConstraint("season_id", "round", name="uq_meeting_round"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    season_id: Mapped[int] = mapped_column(
        ForeignKey("seasons.id", ondelete="CASCADE"), index=True
    )
    circuit_id: Mapped[int | None] = mapped_column(
        ForeignKey("circuits.id"), nullable=True
    )
    round: Mapped[int] = mapped_column(Integer)
    name_ru: Mapped[str | None] = mapped_column(String, nullable=True)
    name_en: Mapped[str] = mapped_column(String)
    starts_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    ends_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    season: Mapped["Season"] = relationship(back_populates="meetings")
    circuit: Mapped["Circuit | None"] = relationship()
    sessions: Mapped[list["Session"]] = relationship(
        back_populates="meeting",
        cascade="all, delete-orphan",
        order_by="Session.starts_at",
    )


class Session(Base):
    __tablename__ = "sessions"

    id: Mapped[int] = mapped_column(primary_key=True)
    meeting_id: Mapped[int] = mapped_column(
        ForeignKey("meetings.id", ondelete="CASCADE"), index=True
    )
    # type: practice | qualifying | sprint_qualifying | sprint | race
    type: Mapped[str] = mapped_column(String)
    name_ru: Mapped[str | None] = mapped_column(String, nullable=True)
    name_en: Mapped[str] = mapped_column(String)
    starts_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True, index=True
    )
    status: Mapped[str] = mapped_column(String, default="scheduled")
    provider_key: Mapped[str] = mapped_column(String, unique=True, index=True)
    is_final: Mapped[bool] = mapped_column(Boolean, default=False)

    meeting: Mapped["Meeting"] = relationship(back_populates="sessions")
