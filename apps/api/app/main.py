import asyncio
import contextlib
from contextlib import asynccontextmanager
from datetime import datetime, timezone

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config import get_settings
from .db import Base, SessionLocal, engine
from .providers import get_provider
from .routers import circuits, drivers, health, results, schedule, standings, teams
from .services import schedule as sched_svc
from .services import standings as stand_svc


async def _prewarm() -> None:
    """Прогрев кэшей при старте: расписание + зачёты уже тёплые к первому запросу
    пользователя (иначе холодная страница ждёт провайдера). Ошибки не критичны."""
    year = datetime.now(timezone.utc).year
    provider = get_provider()
    with contextlib.suppress(Exception):
        async with SessionLocal() as db:
            await sched_svc.get_schedule(db, provider, year)
    with contextlib.suppress(Exception):
        await stand_svc.get_driver_standings(year)
    with contextlib.suppress(Exception):
        await stand_svc.get_constructor_standings(year)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # MVP: создаём таблицы на старте. С Фазы 3 — Alembic-миграции (см. журнал решений).
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    task = asyncio.create_task(_prewarm())  # в фоне, не блокирует старт
    yield
    task.cancel()
    with contextlib.suppress(Exception):
        await task
    await engine.dispose()


settings = get_settings()

app = FastAPI(
    title="race.live API",
    version="0.1.0",
    summary="Расписание / результаты / тайминг автогонок. MVP: Фаза 1 (расписание).",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router)
app.include_router(schedule.router)
app.include_router(standings.router)
app.include_router(results.router)
app.include_router(drivers.router)
app.include_router(circuits.router)
app.include_router(teams.router)


@app.get("/")
async def root() -> dict:
    return {"name": "race.live API", "docs": "/docs", "health": "/api/health"}
