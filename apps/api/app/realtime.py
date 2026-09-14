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

import httpx

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
    """Крутит демо-кадры тайминга в TIMING_CHANNEL, пока задача жива."""
    total_laps = 51
    # накопленное отставание от лидера (в секундах) + текущая шина
    state = [
        {"code": c, "team": t, "gap": base, "tyre": random.choice(_TYRES)}
        for c, t, base in _DEMO_GRID
    ]
    lap = 1
    while True:
        # каждый круг слегка меняем отставания; иногда обгон между соседями
        for d in state[1:]:
            d["gap"] = max(0.0, d["gap"] + random.uniform(-0.35, 0.45))
        state.sort(key=lambda d: d["gap"])
        state[0]["gap"] = 0.0
        if len(state) > 2 and random.random() < 0.25:
            i = random.randint(1, len(state) - 2)
            state[i]["gap"], state[i + 1]["gap"] = state[i + 1]["gap"], state[i]["gap"]
            state.sort(key=lambda d: d["gap"])

        best_idx = min(range(len(state)), key=lambda i: state[i]["gap"] if i else 1e9)
        rows = [
            {
                "pos": i + 1,
                "code": d["code"],
                "team": d["team"],
                "gap": "ЛИДЕР" if i == 0 else _fmt_gap(d["gap"]),
                "tyre": d["tyre"],
                "best": i == best_idx and i != 0 and random.random() < 0.3,
            }
            for i, d in enumerate(state)
        ]
        await publish(
            TIMING_CHANNEL,
            {"session": "Гонка · Баку", "lap": lap, "total_laps": total_laps, "rows": rows, "demo": True},
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
