"""Realtime-транспорт тайминга (Фаза 3).

Публикует кадры тайминга в Centrifugo по HTTP API. Realtime не критичен:
если Centrifugo не настроен/недоступен — тихо ничего не делаем, остальное API живёт.

Пока нет реального потока (OpenF1 — коммерческий, Фаза 3.2), при LIVE_DEMO=true
крутится лёгкая симуляция гонки, чтобы отладить весь путь данных до фронта.
Данные помечены как демо на клиенте — ничего не выдаём за настоящий эфир.
"""

from __future__ import annotations

import asyncio
import contextlib
import random
from collections import deque

import httpx

from . import race_control
from .config import get_settings

TIMING_CHANNEL = "timing:live"


async def publish(channel: str, data: dict) -> None:
    """Опубликовать кадр в канал Centrifugo. Ошибки проглатываем — realtime опционален."""
    s = get_settings()
    if not s.centrifugo_api_url or not s.centrifugo_api_key:
        return
    url = s.centrifugo_api_url.rstrip("/") + "/publish"
    try:
        async with httpx.AsyncClient(timeout=3.0) as client:
            await client.post(
                url,
                json={"channel": channel, "data": data},
                headers={"X-API-Key": s.centrifugo_api_key},
            )
    except Exception:
        return


# --- Демо-симуляция гонки (до подключения реального потока) ---------------------

_DEMO_GRID = [
    ("NOR", "mclaren", 0.0),
    ("VER", "redbull", 0.15),
    ("PIA", "mclaren", 0.25),
    ("LEC", "ferrari", 0.40),
    ("RUS", "mercedes", 0.55),
    ("HAM", "ferrari", 0.70),
    ("ANT", "mercedes", 0.90),
    ("ALB", "williams", 1.20),
]
_TYRES = ("S", "M", "H")


def _fmt_gap(seconds: float) -> str:
    return f"+{seconds:0.3f}"


async def demo_publisher() -> None:
    """Крутит демо-кадры тайминга в TIMING_CHANNEL, пока задача жива.

    Модель «интервал до впереди идущего»: у каждой позиции есть номинальный
    интервал (реалистичный разброс), он колеблется с возвратом к среднему; когда
    интервал схлопывается к нулю — обгон (машины меняются местами). Суммарный отрыв
    замыкающего держится в разумных ~20 c, а не растёт до бесконечности.
    """
    total_laps = 51
    state = [{"code": c, "team": t, "tyre": random.choice(_TYRES)} for c, t, _ in _DEMO_GRID]
    n = len(state)
    # номинальный интервал до впереди идущего по позициям (P1 = 0)
    nominal = [0.0, 1.2, 1.6, 2.3, 2.9, 3.4, 4.1, 5.0][:n]
    intervals = list(nominal)
    rc: deque[dict] = deque(maxlen=8)  # лента рейс-контроля, новые сверху
    lap = 1
    while True:
        # изредка добавляем сообщение рейс-контроля (эмуляция ленты OpenF1)
        if random.random() < 0.22:
            rc.appendleft({"lap": lap, **race_control.random_event()})
        # интервалы «дышат» вокруг номинала: возврат к среднему + шум
        for i in range(1, n):
            intervals[i] += (nominal[i] - intervals[i]) * 0.25 + random.uniform(-0.4, 0.5)
            intervals[i] = max(0.0, intervals[i])
        # обгон: если интервал схлопнулся — меняемся местами с впереди идущим
        for i in range(1, n):
            if intervals[i] < 0.2 and random.random() < 0.5:
                state[i - 1], state[i] = state[i], state[i - 1]
                intervals[i] = random.uniform(0.4, 0.9)
        # накопленный отрыв от лидера
        cum = 0.0
        gaps = []
        for i in range(n):
            cum += intervals[i]
            gaps.append(cum)
        # быстрейший круг — иногда подсвечиваем кого-то из середины/хвоста
        best_idx = random.randint(1, n - 1) if random.random() < 0.25 else -1
        rows = [
            {
                "pos": i + 1,
                "code": state[i]["code"],
                "team": state[i]["team"],
                "gap": "ЛИДЕР" if i == 0 else _fmt_gap(gaps[i]),
                "tyre": state[i]["tyre"],
                "best": i == best_idx,
            }
            for i in range(n)
        ]
        await publish(
            TIMING_CHANNEL,
            {
                "session": "Гонка · Баку",
                "lap": lap,
                "total_laps": total_laps,
                "rows": rows,
                "rc": list(rc),
                "demo": True,
            },
        )
        lap = lap % total_laps + 1
        await asyncio.sleep(1.6)


def start_demo_publisher() -> asyncio.Task | None:
    """Запускает демо-публикатор, если включён LIVE_DEMO и настроен Centrifugo."""
    s = get_settings()
    if not (s.live_demo and s.centrifugo_api_url and s.centrifugo_api_key):
        return None
    return asyncio.create_task(demo_publisher())


async def stop_task(task: asyncio.Task | None) -> None:
    if task is None:
        return
    task.cancel()
    with contextlib.suppress(Exception):
        await task
