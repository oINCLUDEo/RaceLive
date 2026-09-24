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
import time
from datetime import datetime, timezone
from typing import Awaitable, Callable

from . import cache, race_control
from .providers.openf1 import OpenF1Client, OpenF1Locked

log = logging.getLogger("uvicorn.error")

# Скорость реплея — общая, меняется на лету через API (/api/v1/live/speed).
ALLOWED_SPEEDS = [0.5, 1, 2, 5, 15, 60]
current_speed = 60.0

# Управление перемоткой: race_start — время старта гонки; seek — запрос перемотки;
# note — пояснение для зрителей поверх реплея (напр. «идёт сессия, показываем повтор»).
_replay_ctl: dict = {"race_start": None, "seek": None, "note": None}

# Кэш сырых данных реплея в Redis: во время живой сессии OpenF1 закрыт для анонимов,
# и рестарт api без кэша оставил бы тайминг пустым.
_RAW_TTL = 21 * 24 * 3600

_SESSION_RU = {
    "practice 1": "Практика 1",
    "practice 2": "Практика 2",
    "practice 3": "Практика 3",
    "qualifying": "Квалификация",
    "sprint qualifying": "Спринт-квалификация",
    "sprint shootout": "Спринт-квалификация",
    "sprint": "Спринт",
    "race": "Гонка",
}


def _label(sess: dict) -> str:
    name = _SESSION_RU.get((sess.get("session_name") or "").lower(), sess.get("session_name") or "Сессия")
    place = sess.get("circuit_short_name") or sess.get("country_name") or ""
    return f"{name} · {place}".strip(" ·")


def set_speed(value: float) -> float:
    """Устанавливает скорость реплея (с ограничением). Возвращает применённое значение."""
    global current_speed
    try:
        current_speed = max(0.1, min(120.0, float(value)))
    except (TypeError, ValueError):
        pass
    return current_speed


def request_seek_start() -> bool:
    """Перемотать реплей к старту гонки (после прогрева). True, если старт известен."""
    rs = _replay_ctl.get("race_start")
    if rs is not None:
        _replay_ctl["seek"] = rs
        return True
    return False

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
    if not n:
        return ""
    # Порядок важен: «Red Bull Racing» vs «Racing Bulls / Visa Cash App RB»
    if "red bull racing" in n:
        return "redbull"
    if "racing bulls" in n or "visa cash" in n or "vcarb" in n or "alphatauri" in n or n == "rb" or n.startswith("rb "):
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


def _fmt_laptime(seconds: object) -> str | None:
    try:
        s = float(seconds)
    except (TypeError, ValueError):
        return None
    m, s = divmod(s, 60)
    return f"{int(m)}:{s:06.3f}"


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
        weather: list[dict] | None = None,
        pits: list[dict] | None = None,
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
        self.itv: dict[int, list[tuple[float, object]]] = {}  # интервал до впереди идущего
        for r in intervals:
            t = _ts(r.get("date"))
            if t is not None:
                self.gap.setdefault(r["driver_number"], []).append((t, r.get("gap_to_leader")))
                self.itv.setdefault(r["driver_number"], []).append((t, r.get("interval")))

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

        self.weather: list[tuple[float, dict]] = sorted(
            [(t, w) for w in (weather or []) if (t := _ts(w.get("date"))) is not None],
            key=lambda x: x[0],
        )

        # Пит-стопы: (время, длительность) по пилотам.
        self.pits: dict[int, list[tuple[float, object]]] = {}
        for p in pits or []:
            t = _ts(p.get("date"))
            num = p.get("driver_number")
            if t is not None and num is not None:
                self.pits.setdefault(num, []).append((t, p.get("pit_duration")))
        for series in self.pits.values():
            series.sort(key=lambda x: x[0])

        for series in (*self.pos.values(), *self.gap.values(), *self.itv.values(), *self.lap.values()):
            series.sort(key=lambda x: x[0])

        # Практика/квала: интервалов нет — отставание считаем по лучшему кругу.
        # lapdur[num] = [(момент завершения круга, длительность)].
        self.has_intervals = any(self.gap.values())
        self.lapdur: dict[int, list[tuple[float, float]]] = {}
        for r in laps:
            t0 = _ts(r.get("date_start"))
            dur = r.get("lap_duration")
            num = r.get("driver_number")
            if t0 is not None and isinstance(dur, (int, float)) and num is not None:
                self.lapdur.setdefault(num, []).append((t0 + float(dur), float(dur)))

        # Быстрейший круг: когда меняется обладатель лучшего времени круга (t → driver_number).
        fl_events = sorted(
            (
                (_ts(r.get("date_start")), r["driver_number"], r["lap_duration"])
                for r in laps
                if r.get("lap_duration") and r.get("date_start") and r.get("driver_number") is not None
            ),
            key=lambda x: x[0] if x[0] is not None else 0.0,
        )
        self.fastest: list[tuple[float, object]] = []  # (t, (driver_number, lap_duration))
        best = float("inf")
        for t, num, dur in fl_events:
            if t is not None and dur < best:
                best = dur
                self.fastest.append((t, (num, dur)))

        starts = [s[0][0] for s in self.pos.values() if s] + ([self.rc[0][0]] if self.rc else [])
        ends = [s[-1][0] for s in self.pos.values() if s] + ([self.rc[-1][0]] if self.rc else [])
        self.t_start = min(starts) if starts else 0.0
        self.t_end = max(ends) if ends else 0.0
        # Старт гонки = начало 1-го круга (после прогревочного), иначе — начало данных.
        lap1 = [tt for series in self.lap.values() for (tt, ln) in series if ln == 1]
        self.race_start = min(lap1) if lap1 else self.t_start
        self.total_laps = max(
            (v for series in self.lap.values() for _, v in series if isinstance(v, int)),
            default=0,
        )

    def _stint(self, num: int, lap: object) -> tuple[str | None, int | None]:
        if not isinstance(lap, int):
            return None, None
        for lo, hi, comp in self.stints.get(num, []):
            if lo <= lap <= hi:
                return comp, lo
        return None, None

    def frame_at(self, t: float) -> dict:
        entries = []
        for num, meta in self.info.items():
            position = _latest(self.pos.get(num, []), t)
            if position is None:
                continue
            lap = _latest(self.lap.get(num, []), t)
            comp, stint_start = self._stint(num, lap)
            age = (lap - stint_start + 1) if isinstance(lap, int) and stint_start is not None else None
            pit_list = self.pits.get(num, [])
            stops = sum(1 for pt, _ in pit_list if pt <= t)
            in_pit = any(pt <= t <= pt + 30 for pt, _ in pit_list)  # окно пит-лейна ~30 c
            entries.append(
                {
                    "num": num,
                    "pos": int(position),
                    "code": meta["code"],
                    "team": meta["team"],
                    "gap": _latest(self.gap.get(num, []), t),
                    "int": _latest(self.itv.get(num, []), t),
                    "tyre": comp,
                    "tyre_age": age if age and age > 0 else None,
                    "pit": in_pit,
                    "stops": stops,
                    "lap": lap,
                }
            )
        entries.sort(key=lambda e: e["pos"])
        fl = _latest(self.fastest, t)  # (driver_number, lap_duration) держателя быстрейшего круга
        fl_num = fl[0] if fl else None
        msgs = [r.get("message") or "" for tt, r in self.rc if tt <= t]
        status = race_control.driver_statuses(msgs)

        # Практика/квала: лидеру — его лучший круг, остальным — отставание от него.
        best: dict[int, float] = {}
        if not self.has_intervals:
            for num, series in self.lapdur.items():
                done = [d for te, d in series if te <= t]
                if done:
                    best[num] = min(done)
        ref = min(best.values()) if best else None

        def gap_text(e: dict) -> tuple[str, str]:
            if self.has_intervals:
                if e["pos"] == 1:
                    return "ЛИДЕР", ""
                return _fmt_gap(e["gap"]), _fmt_gap(e["int"])
            b = best.get(e["num"])
            if b is None or ref is None:
                return "", ""
            return (_fmt_laptime(b) or "") if b == ref else f"+{b - ref:.3f}", ""

        rows = [
            {
                "pos": e["pos"],
                "code": e["code"],
                "team": e["team"],
                "gap": gap_text(e)[0],
                "int": gap_text(e)[1],
                "tyre": e["tyre"],
                "tyre_age": e["tyre_age"],
                "pit": e["pit"],
                "stops": e["stops"],
                "best": e["num"] == fl_num,
                "pen": status.get(e["code"], {}).get("pen"),
                "inv": status.get(e["code"], {}).get("inv"),
            }
            for e in entries
        ]
        leader_lap = entries[0]["lap"] if entries and isinstance(entries[0]["lap"], int) else None
        # Вся лента рейс-контроля до момента t (новые сверху) — можно отмотать назад.
        recent = [race_control.feed_item(r, r.get("lap_number")) for tt, r in self.rc if tt <= t]
        fl_code = self.info.get(fl_num, {}).get("code") if fl_num else None
        w = _latest(self.weather, t) or {}
        return {
            "session": self.session_label,
            "lap": leader_lap,
            "total_laps": self.total_laps or None,
            "rows": rows,
            "rc": list(reversed(recent[-150:])),
            "fastest": {"code": fl_code, "time": _fmt_laptime(fl[1])} if fl else None,
            "flag": race_control.session_flag(msgs),
            "weather": {
                "track": w.get("track_temperature"),
                "air": w.get("air_temperature"),
                "humidity": w.get("humidity"),
                "wind": w.get("wind_speed"),
                "wind_dir": w.get("wind_direction"),
                "rain": bool(w.get("rainfall")),
            } if w else None,
            "badge": "реплей",
        }


async def _latest_race_key(client: OpenF1Client) -> int:
    """session_key последней уже прошедшей гонки (текущий сезон, иначе прошлый).
    Если OpenF1 закрыт (идёт живая сессия) — берём последний ключ из кэша."""
    now = datetime.now(timezone.utc)
    for year in (now.year, now.year - 1):
        try:
            rows = await client.race_sessions(year)
        except OpenF1Locked:
            break
        except Exception:
            rows = []
        past = [(t, r) for r in rows if (t := _ts(r.get("date_start"))) and t <= now.timestamp()]
        if past:
            return max(past, key=lambda x: x[0])[1].get("session_key") or 0
    return int(await cache.get_json("replay:last_key") or 0)


async def _load_session(client: OpenF1Client, session_key: int) -> dict | None:
    """Все данные сессии для реплея: из OpenF1 (и в кэш), при недоступности — из кэша."""
    key = f"replay:raw:{session_key}"
    try:
        sess = await client.session(session_key)
        if not sess:
            return None
        raw = {
            "session": sess,
            "drivers": await client.drivers(session_key),
            "position": await client.position(session_key),
            "intervals": await client.intervals(session_key),
            "laps": await client.laps(session_key),
            "stints": await client.stints(session_key),
            "rc": await client.race_control(session_key),
            "weather": await client.weather(session_key),
            "pits": await client.pit(session_key),
        }
        await cache.set_json(key, raw, _RAW_TTL)
        await cache.set_json("replay:last_key", session_key, _RAW_TTL)
        return raw
    except Exception as exc:
        cached = await cache.get_json(key)
        if cached:
            log.info("OpenF1 replay: сессия %s из кэша (%s)", session_key, type(exc).__name__)
            return cached
        log.warning("OpenF1 replay: не удалось загрузить сессию %s: %s", session_key, exc)
        return None


async def run_replay(
    session_key: int,
    speed: float,
    publish: Callable[[str, dict], Awaitable[None]],
    channel: str,
    client: OpenF1Client | None = None,
) -> None:
    """Тянет сессию OpenF1 (или кэш) и бесконечно проигрывает её кадрами в channel."""
    client = client or OpenF1Client()

    # session_key <= 0 → автоматически берём последнюю прошедшую гонку сезона
    if session_key <= 0:
        session_key = await _latest_race_key(client)
        if not session_key:
            log.warning("OpenF1 replay: не нашёл последнюю прошедшую гонку")
            return

    raw = await _load_session(client, session_key)
    if not raw:
        return
    sess = raw["session"]
    label = _label(sess)
    tl = Timeline(
        raw["drivers"], raw["position"], raw["intervals"], raw["laps"], raw["stints"],
        raw["rc"], label, raw["weather"], raw["pits"],
    )
    if tl.t_end <= tl.t_start:
        log.warning("OpenF1 replay: пустой таймлайн для сессии %s", session_key)
        return
    log.info(
        "OpenF1 replay: %s — %d пилотов, %d сообщений РК, %d кругов, скорость x%.0f",
        label, len(tl.info), len(tl.rc), tl.total_laps, speed,
    )

    # Кадр раз в ~2 реальные секунды; гоночное время за кадр = 2с × скорость.
    # Скорость и перемотка читаются на каждой итерации — меняются на лету через API.
    set_speed(speed)  # стартовое значение из настроек
    _replay_ctl["race_start"] = tl.race_start
    real_step = 2.0
    while True:
        t = tl.t_start
        while t <= tl.t_end:
            if _replay_ctl.get("seek") is not None:
                t = _replay_ctl["seek"]
                _replay_ctl["seek"] = None
            frame = tl.frame_at(t)
            if _replay_ctl.get("note"):
                frame["note"] = _replay_ctl["note"]
            with contextlib.suppress(Exception):
                await publish(channel, frame)
            t += real_step * current_speed
            await asyncio.sleep(real_step)
        await asyncio.sleep(3.0)  # пауза перед повтором реплея


# --- Живой тайминг (платный OpenF1) ---------------------------------------------------

LIVE_TICK_SEC = 4.0  # быстрый цикл: позиции + интервалы
LIVE_SLOW_EVERY = 4  # раз в 4 цикла (~16 c): РК, погода, питы, круги, стинты
# Бюджет: 2 запроса/4 c (30/мин) + 5 запросов/16 c (~19/мин) ≈ 49/мин < лимита 60/мин.


def _max_ts(rows: list[dict], field: str = "date") -> float | None:
    ts = [t for r in rows if (t := _ts(r.get(field))) is not None]
    return max(ts) if ts else None


def _since(rows: list[dict], field: str = "date") -> str | None:
    """Максимальная метка времени среди строк — в формате фильтра OpenF1 (UTC без смещения)."""
    best = _max_ts(rows, field)
    if best is None:
        return None
    return datetime.fromtimestamp(best, tz=timezone.utc).strftime("%Y-%m-%dT%H:%M:%S.%f")


async def run_live(
    client: OpenF1Client,
    publish: Callable[[str, dict], Awaitable[None]],
    channel: str,
) -> None:
    """Публикует настоящий тайминг идущей сессии (session_key=latest), пока она не кончится.
    Данные дотягиваются инкрементально (`date>…`), кадр собирается тем же Timeline."""
    sess = await client.session("latest")
    if not sess:
        log.warning("OpenF1 live: нет текущей сессии")
        return
    key = sess["session_key"]
    label = _label(sess)
    end_ts = _ts(sess.get("date_end")) or (time.time() + 3 * 3600)
    drivers = await client.drivers(key)
    log.info("OpenF1 live: %s (session_key=%s)", label, key)

    data: dict[str, list[dict]] = {k: [] for k in ("position", "intervals", "laps", "stints", "race_control", "weather", "pit")}
    tick = 0
    while time.time() < end_ts + 15 * 60:
        try:
            for ep in ("position", "intervals"):
                data[ep] += await client._get_since(ep, key, _since(data[ep]))
            if tick % LIVE_SLOW_EVERY == 0:
                for ep in ("race_control", "weather", "pit"):
                    data[ep] += await client._get_since(ep, key, _since(data[ep]))
                data["laps"] = await client.laps(key)
                data["stints"] = await client.stints(key)
        except Exception as exc:
            log.warning("OpenF1 live: сбой опроса: %s", exc)

        if data["position"]:
            tl = Timeline(
                drivers, data["position"], data["intervals"], data["laps"], data["stints"],
                data["race_control"], label, data["weather"], data["pit"],
            )
            latest = max(
                (_max_ts(data["position"]) or 0.0, _max_ts(data["intervals"]) or 0.0, _max_ts(data["laps"], "date_start") or 0.0)
            )
            frame = tl.frame_at(max(time.time(), latest))
            frame["badge"] = "эфир"
            with contextlib.suppress(Exception):
                await publish(channel, frame)
        tick += 1
        await asyncio.sleep(LIVE_TICK_SEC)
    log.info("OpenF1 live: сессия %s закончилась", label)
