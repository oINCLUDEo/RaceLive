from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config import get_settings
from .db import Base, engine
from .routers import health, schedule, standings


@asynccontextmanager
async def lifespan(app: FastAPI):
    # MVP: создаём таблицы на старте. С Фазы 2 — Alembic-миграции (ADR-006 / infra/migrations).
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
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


@app.get("/")
async def root() -> dict:
    return {"name": "race.live API", "docs": "/docs", "health": "/api/health"}
