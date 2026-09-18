import asyncio
import contextlib
from contextlib import asynccontextmanager
from datetime import datetime, timezone

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from . import realtime
from .config import get_settings
from .db import Base, SessionLocal, engine
from .providers import get_provider
from .routers import circuits, compare, drivers, health, live, results, schedule, standings, streams, teams, weather
from .services import results as results_svc
from .services import schedule as sched_svc
from .services import standings as stand_svc
from .services import streams as streams_svc

# Как часто обновлять горячие кэши. Меньше самого короткого TTL (зачёт — 1 ч),
# чтобы пользователь практически никогда не попадал на холодный запрос к провайдеру.
WARM_INTERVAL_SEC = 25 * 60


async def _warm_once() -> None:
    """Прогрев горячих кэшей: расписание, зачёты, результаты последней гонки."""
    year = datetime.now(timezone.utc).year
    provider = get_provider()
    last_round: int | None = None
    with contextlib.suppress(Exception):
        async with SessionLocal() as db:
            meetings = await sched_svc.get_schedule(db, provider, year)
            now = datetime.now(timezone.utc)
            # round/ends_at — колонки (не связи), безопасно читать вне сессии
            done = [m for m in meetings if m.ends_at and m.ends_at < now]
            last_round = done[-1].round if done else None
    with contextlib.suppress(Exception):
        await stand_svc.get_driver_standings(year)
    with contextlib.suppress(Exception):
        await stand_svc.get_constructor_standings(year)
    if last_round is not None:
        with contextlib.suppress(Exception):
            await results_svc.get_race_results(year, last_round)


async def _cache_warmer() -> None:
    """Держит горячие кэши тёплыми: прогрев на старте и периодически до истечения TTL."""
    while True:
        await _warm_once()
        await asyncio.sleep(WARM_INTERVAL_SEC)


# Как часто обновлять эфир auto-стримов (кастеры на Rutube/VK).
STREAMS_RESOLVE_SEC = 60


async def _streams_resolver() -> None:
    """Фоном подхватывает прямой эфир кастеров с площадок (Rutube без ключа, VK — с токеном)."""
    while True:
        with contextlib.suppress(Exception):
            await streams_svc.refresh_auto()
        await asyncio.sleep(STREAMS_RESOLVE_SEC)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # MVP: создаём таблицы на старте. С Фазы 3 — Alembic-миграции (см. журнал решений).
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    task = asyncio.create_task(_cache_warmer())  # в фоне, не блокирует старт
    streams_task = asyncio.create_task(_streams_resolver())  # эфир кастеров
    live_task = realtime.start_live_source()  # реплей OpenF1 или демо-тайминг
    yield
    task.cancel()
    streams_task.cancel()
    with contextlib.suppress(Exception):
        await task
    with contextlib.suppress(Exception):
        await streams_task
    await realtime.stop_task(live_task)
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
app.include_router(live.router)
app.include_router(compare.router)
app.include_router(weather.router)
app.include_router(streams.router)


@app.get("/")
async def root() -> dict:
    return {"name": "race.live API", "docs": "/docs", "health": "/api/health"}
