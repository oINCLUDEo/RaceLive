"""Replay прошедшей гонки из OpenF1 в канал тайминга.

Тянем историю сессии один раз, строим таймлайн и «проигрываем» её кадрами в
timing:live с ускорением. Настоящие позиции, интервалы, шины и лента рейс-контроля
(переведённая `race_control.localize()`). Тот же кадр-формат, что у демо, поэтому
фронт менять не нужно. Когда появится доступ к live OpenF1 — сюда же ляжет realtime.
"""

from __future__ import annotations

import asyncio
import bisect
import contextlib
import logging
from datetime import datetime, timezone
from typing import Awaitable, Callable

from . import race_control
from .providers.openf1 import OpenF1Client

log = logging.getLogger("uvicorn.error")

# OpenF1 team_name -> наш slug (для логотипа). Матчим по подстроке, регистр не важен.
_TEAM_SLUGS: list[tuple[str, str]] = [
    ("red bull", "redbull"),
    ("rb", "rb"),
    ("mclaren", "mclaren"),
    ("ferrari", "ferrari"),
    ("mercedes", "mercedes"),
    ("aston martin", "astonmartin"),
    ("alpine", "alpine"),
    ("haas", "haas"),
    ("williams", "williams"),
    ("kick sauber", "sauber"),
    ("sauber", "sauber"),
    ("audi", "audi"),
    ("cadillac", "cadillac"),
]

_COMPOUND = {
    "SOFT": "S", "MEDIUM": "M", "HARD": "H", "INTERMEDIATE": "I", "WET": "W",
}


def _slug_for(team_name: str | None) -> str:
    n = (team_name or "").lower()
    # «Red Bull Racing» содержит и "red bull" — проверяем «rb» как отдельное слово
    if n == "rb" or n.startswith("rb "):
        return "rb"
    for needle, slug in _TEAM_SLUGS:
        if needle in n:
            return slug
    return ""


def _ts(s: str | None) -> float | None:
    if not s:
        return None
    try:
        return datetime.fromisoformat(s.replace("Z", "+00:00")).timestamp()
    except ValueError:
        return None


def _latest(series: list[tuple[float, object]], t: float):
    """Последнее значение с временем <= t (series отсортирован по времени)."""
    if not series:
        return None
    i = bisect.bisect_right(series, (t, float("inf"))) - 1
    return series[i][1] if i >= 0 else None


def _fmt_gap(gap: object) -> str:
    if gap is None:
        return ""
    if isinstance(gap, str):
        m = gap.upper()
        if "LAP" in m:
            num = "".join(ch for ch in m if ch.isdigit()) or "1"
            return f"+{num} круг"
        return gap
    try:
        return f"+{float(gap):.3f}"
    except (TypeError, ValueError):
        return str(gap)


class Timeline:
    """Собранный таймлайн сессии; frame_at(t) отдаёт кадр тайминга на момент t."""

    def __init__(
        self,
        drivers: list[dict],
        position: list[dict],
        intervals: list[dict],
        laps: list[dict],
        stints: list[dict],
        rc: list[dict],
        session_label: str,
    ) -> None:
        self.session_label = session_label
        self.info: dict[int, dict] = {
            d["driver_number"]: {
                "code": d.get("name_acronym") or str(d.get("driver_number")),
                "team": _slug_for(d.get("team_name")),
            }
            for d in drivers
            if d.get("driver_number") is not None
        }

        self.pos: dict[int, list[tuple[float, object]]] = {}
        for r in position:
            t = _ts(r.get("date"))
            if t is not None and r.get("position") is not None:
                self.pos.setdefault(r["driver_number"], []).append((t, r["position"]))

        self.gap: dict[int, list[tuple[float, object]]] = {}
        for r in intervals:
            t = _ts(r.get("date"))
            if t is not None:
                self.gap.setdefault(r["driver_number"], []).append((t, r.get("gap_to_leader")))

        self.lap: dict[int, list[tuple[float, object]]] = {}
        for r in laps:
            t = _ts(r.get("date_start"))
            if t is not None and r.get("lap_number") is not None:
                self.lap.setdefault(r["driver_number"], []).append((t, r["lap_number"]))

        self.stints: dict[int, list[tuple[int, int, str]]] = {}
        for r in stints:
            num = r.get("driver_number")
            comp = _COMPOUND.get((r.get("compound") or "").upper())
            if num is not None and comp:
                self.stints.setdefault(num, []).append(
                    (r.get("lap_start") or 0, r.get("lap_end") or 9999, comp)
                )

        self.rc: list[tuple[float, dict]] = sorted(
            [(t, r) for r in rc if (t := _ts(r.get("date"))) is not None],
            key=lambda x: x[0],
        )

        for series in (*self.pos.values(), *self.gap.values(), *self.lap.values()):
            series.sort(key=lambda x: x[0])

        # Быстрейший круг: когда меняется обладатель лучшего времени круга (t → driver_number).
        fl_events = sorted(
            (
                (_ts(r.get("date_start")), r["driver_number"], r["lap_duration"])
                for r in laps
                if r.get("lap_duration") and r.get("date_start") and r.get("driver_number") is not None
            ),
            key=lambda x: x[0] if x[0] is not None else 0.0,
        )
        self.fastest: list[tuple[float, object]] = []
        best = float("inf")
        for t, num, dur in fl_events:
            if t is not None and dur < best:
                best = dur
                self.fastest.append((t, num))

        starts = [s[0][0] for s in self.pos.values() if s] + ([self.rc[0][0]] if self.rc else [])
        ends = [s[-1][0] for s in self.pos.values() if s] + ([self.rc[-1][0]] if self.rc else [])
        self.t_start = min(starts) if starts else 0.0
        self.t_end = max(ends) if ends else 0.0
        self.total_laps = max(
            (v for series in self.lap.values() for _, v in series if isinstance(v, int)),
            default=0,
        )

    def _tyre(self, num: int, lap: object) -> str | None:
        if not isinstance(lap, int):
            return None
        for lo, hi, comp in self.stints.get(num, []):
            if lo <= lap <= hi:
                return comp
        return None

    def frame_at(self, t: float) -> dict:
        entries = []
        for num, meta in self.info.items():
            position = _latest(self.pos.get(num, []), t)
            if position is None:
                continue
            lap = _latest(self.lap.get(num, []), t)
            entries.append(
                {
                    "num": num,
                    "pos": int(position),
                    "code": meta["code"],
                    "team": meta["team"],
                    "gap": _latest(self.gap.get(num, []), t),
                    "tyre": self._tyre(num, lap),
                    "lap": lap,
                }
            )
        entries.sort(key=lambda e: e["pos"])
        fl_holder = _latest(self.fastest, t)  # кто держит быстрейший круг на момент t
        rows = [
            {
                "pos": e["pos"],
                "code": e["code"],
                "team": e["team"],
                "gap": "ЛИДЕР" if e["pos"] == 1 else _fmt_gap(e["gap"]),
                "tyre": e["tyre"],
                "best": e["num"] == fl_holder,
            }
            for e in entries
        ]
        leader_lap = entries[0]["lap"] if entries and isinstance(entries[0]["lap"], int) else None
        recent = [race_control.feed_item(r, r.get("lap_number")) for tt, r in self.rc if tt <= t]
        return {
            "session": self.session_label,
            "lap": leader_lap,
            "total_laps": self.total_laps or None,
            "rows": rows,
            "rc": list(reversed(recent[-8:])),
            "badge": "реплей",
        }


async def _latest_race_key(client: OpenF1Client) -> int:
    """session_key последней уже прошедшей гонки (текущий сезон, иначе прошлый)."""
    now = datetime.now(timezone.utc)
    for year in (now.year, now.year - 1):
        try:
            rows = await client.race_sessions(year)
        except Exception:
            rows = []
        past = [(t, r) for r in rows if (t := _ts(r.get("date_start"))) and t <= now.timestamp()]
        if past:
            return max(past, key=lambda x: x[0])[1].get("session_key") or 0
    return 0


async def run_replay(
    session_key: int,
    speed: float,
    publish: Callable[[str, dict], Awaitable[None]],
    channel: str,
) -> None:
    """Тянет сессию OpenF1 и бесконечно проигрывает её кадрами в channel."""
    client = OpenF1Client()

    # session_key <= 0 → автоматически берём последнюю прошедшую гонку сезона
    if session_key <= 0:
        session_key = await _latest_race_key(client)
        if not session_key:
            log.warning("OpenF1 replay: не нашёл последнюю прошедшую гонку")
            return

    try:
        sess = await client.session(session_key)
    except Exception as exc:
        log.warning("OpenF1 replay: сессия %s недоступна: %s", session_key, exc)
        return
    if not sess:
        log.warning("OpenF1 replay: сессия %s не найдена", session_key)
        return
    label = f"Гонка · {sess.get('circuit_short_name') or sess.get('country_name') or ''}".strip(" ·")

    try:
        drivers = await client.drivers(session_key)
        position = await client.position(session_key)
        intervals = await client.intervals(session_key)
        laps = await client.laps(session_key)
        stints = await client.stints(session_key)
        rc = await client.race_control(session_key)
    except Exception as exc:
        log.warning("OpenF1 replay: не удалось загрузить данные сессии %s: %s", session_key, exc)
        return

    tl = Timeline(drivers, position, intervals, laps, stints, rc, label)
    if tl.t_end <= tl.t_start:
        log.warning("OpenF1 replay: пустой таймлайн для сессии %s", session_key)
        return
    log.info(
        "OpenF1 replay: %s — %d пилотов, %d сообщений РК, %d кругов, скорость x%.0f",
        label, len(tl.info), len(tl.rc), tl.total_laps, speed,
    )

    step = 20.0  # секунд гоночного времени на кадр
    delay = max(0.2, step / max(speed, 1.0))
    while True:
        t = tl.t_start
        while t <= tl.t_end:
            with contextlib.suppress(Exception):
                await publish(channel, tl.frame_at(t))
            t += step
            await asyncio.sleep(delay)
        await asyncio.sleep(3.0)  # пауза перед повтором реплея
