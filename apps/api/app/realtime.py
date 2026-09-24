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
    n = len(_DEMO_GRID)
    # номинальный интервал до впереди идущего по позициям (P1 = 0)
    nominal = [0.0, 1.2, 1.6, 2.3, 2.9, 3.4, 4.1, 5.0][:n]
    while True:
        # Каждый проход — новая «гонка»: сбрасываем сетку, интервалы и ленту
        # рейс-контроля. Иначе при зацикливании расследования/штрафы и события
        # тянулись бы из прошлого круга и не сбрасывались.
        state = [{"code": c, "team": t, "tyre": random.choice(_TYRES)} for c, t, _ in _DEMO_GRID]
        intervals = list(nominal)
        rc: deque[dict] = deque(maxlen=50)  # лента рейс-контроля, новые сверху
        for lap in range(1, total_laps + 1):
            # изредка добавляем сообщение рейс-контроля (эмуляция ленты OpenF1)
            if random.random() < 0.22:
                rc.appendleft(race_control.feed_item(race_control.random_event(), lap))
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
            rc_msgs = [m["message"] for m in reversed(rc)]
            status = race_control.driver_statuses(rc_msgs)
            rows = [
                {
                    "pos": i + 1,
                    "code": state[i]["code"],
                    "team": state[i]["team"],
                    "gap": "ЛИДЕР" if i == 0 else _fmt_gap(gaps[i]),
                    "int": "" if i == 0 else _fmt_gap(intervals[i]),
                    "tyre": state[i]["tyre"],
                    "best": i == best_idx,
                    "pen": status.get(state[i]["code"], {}).get("pen"),
                    "inv": status.get(state[i]["code"], {}).get("inv"),
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
                    "flag": race_control.session_flag(rc_msgs),
                    "demo": True,
                    "badge": "демо-поток",
                },
            )
            await asyncio.sleep(1.6)
        await asyncio.sleep(3.0)  # пауза перед новой демо-гонкой


def start_live_source() -> asyncio.Task | None:
    """Запускает источник тайминга: реплей OpenF1 или демо. Без Centrifugo — ничего."""
    s = get_settings()
    if not (s.centrifugo_api_url and s.centrifugo_api_key):
        return None
    if s.live_source == "openf1_replay":
        from . import replay  # локальный импорт: тянет providers.openf1 только при нужде

        # 0 → replay сам выберет последнюю прошедшую гонку

        return asyncio.create_task(
            replay.run_replay(s.openf1_session_key, s.openf1_replay_speed, publish, TIMING_CHANNEL)
        )
    if s.live_demo:
        return asyncio.create_task(demo_publisher())
    return None


async def stop_task(task: asyncio.Task | None) -> None:
    if task is None:
        return
    task.cancel()
    with contextlib.suppress(Exception):
        await task
