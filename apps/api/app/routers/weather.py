"""Прогноз погоды на гоночный уик-энд (Open-Meteo). Отдаёт только сериализованные дни."""

from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from ..db import get_db
from ..providers import get_provider
from ..schemas import WeekendForecastOut
from ..services import schedule as sched_svc
from ..services import weather as weather_svc

router = APIRouter(prefix="/api/v1", tags=["weather"])


def _year() -> int:
    return datetime.now(timezone.utc).year


@router.get("/weather/{rnd}", response_model=WeekendForecastOut)
async def weekend_weather(
    rnd: int,
    season: int = Query(default_factory=_year),
    db: AsyncSession = Depends(get_db),
) -> WeekendForecastOut:
    m = await sched_svc.get_meeting(db, get_provider(), season, rnd)
    if m is None:
        raise HTTPException(status_code=404, detail="Этап не найден")
    data = await weather_svc.get_weekend_forecast(m)
    return WeekendForecastOut(**data)
