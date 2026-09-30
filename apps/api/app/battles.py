"""Битвы за позицию и прогноз битв — как графика официальной трансляции.

Чистые функции над рядами таймлайна (без pandas и сети), вызываются при сборке
кадра тайминга: на сервере, один раз на кадр — у всех зрителей одни и те же цифры.

• Битва — соседние по позиции машины ближе BATTLE_GAP (зона DRS). Идущие подряд
  пары склеиваются в «поезд». Тренд — как изменился интервал примерно за круг.
• Прогноз — пары в лидирующей группе, где задний быстрее: по темпу последних
  чистых кругов считаем, через сколько кругов он окажется в зоне атаки.
"""

from __future__ import annotations

import bisect
import math
from statistics import median

BATTLE_GAP = 1.0  # с — зона DRS, «борьба за позицию»
TREND_EPS = 0.1  # с — меньше этого изменение интервала считаем «держится»
FORECAST_TOP = 10  # прогноз — только для лидирующей группы
FORECAST_MAX_GAP = 12.0  # с — дальше прогноз бессмыслен
FORECAST_MIN_RATE = 0.35  # с/круг — медленнее — шум и «грязный воздух», не сближение
FORECAST_MAX_LAPS = 5  # дальше — гадание, не показываем
SLOWDOWN = 1.3  # запас: вблизи сближение замедляется (подобрано на гонках 2025)
TREND_LAPS = 3  # за сколько кругов смотрим фактическое сокращение интервала
PACE_LAPS = 4  # сколько последних кругов берём в темп
CLEAN_FACTOR = 1.05  # круг медленнее медианы на 5% — пит/трафик/SC, не темп


def _num(v: object) -> float | None:
    """Интервал OpenF1: число секунд, либо строка «+1 LAP» и т.п. (тогда не сравниваем)."""
    return float(v) if isinstance(v, (int, float)) and not isinstance(v, bool) else None


def _at(series: list[tuple[float, object]], t: float) -> object:
    i = bisect.bisect_right(series, t, key=lambda x: x[0]) - 1
    return series[i][1] if i >= 0 else None


def pace(lapdur: list[tuple[float, float]], t: float) -> float | None:
    """Темп — медиана последних чистых кругов, завершённых к моменту t."""
    done = [d for te, d in lapdur if te <= t][-(PACE_LAPS + 3):]
    if len(done) < 2:
        return None
    ref = median(done)
    clean = [d for d in done if d <= ref * CLEAN_FACTOR][-PACE_LAPS:]
    return median(clean) if len(clean) >= 2 else None


def compute(
    order: list[dict],
    itv: dict[int, list[tuple[float, object]]],
    lapdur: dict[int, list[tuple[float, float]]],
    t: float,
    flag: str,
    laps_left: int | None,
) -> dict:
    """order — машины по позиции: {num, pos, code, team, pit}. Возвращает
    {"battles": [...], "forecast": [...]} для кадра тайминга."""
    if flag in ("sc", "vsc", "red", "chequered") or len(order) < 2:
        # Под машиной безопасности интервалы «сжаты» искусственно — битв нет.
        return {"battles": [], "forecast": []}

    # Средний круг — чтобы понять, какой интервал был «круг назад».
    paces = [p for num in (o["num"] for o in order[:10]) if (p := pace(lapdur.get(num, []), t))]
    lap_s = median(paces) if paces else 90.0

    # Сошедшие/стоящие машины: их интервал «застывает» на последнем значении — такие
    # не участвуют (иначе сход в конце пелотона выглядел бы как битва с разрывом 0.05).
    def fresh(num: int) -> bool:
        series = itv.get(num, [])
        i = bisect.bisect_right(series, t, key=lambda x: x[0]) - 1
        return i >= 0 and series[i][0] >= t - 2 * lap_s

    order = [o for o in order if fresh(o["num"])]

    def car(o: dict) -> dict:
        return {"code": o["code"], "team": o["team"], "pos": o["pos"]}

    # --- Битвы: пары в зоне DRS, склеенные в поезда ---
    battles: list[dict] = []
    cur: dict | None = None
    for ahead, behind in zip(order, order[1:]):
        gap = _num(_at(itv.get(behind["num"], []), t))
        close = gap is not None and gap < BATTLE_GAP and not ahead["pit"] and not behind["pit"]
        if not close:
            cur = None
            continue
        before = _num(_at(itv.get(behind["num"], []), t - lap_s))
        delta = (gap - before) if before is not None else 0.0
        trend = "closing" if delta < -TREND_EPS else "pulling" if delta > TREND_EPS else "holding"
        if cur is None:
            cur = {"pos": ahead["pos"], "cars": [car(ahead)], "gaps": [], "trends": []}
            battles.append(cur)
        cur["cars"].append(car(behind))
        cur["gaps"].append(round(gap, 3))
        cur["trends"].append(trend)
    # Сначала — самые «горячие»: за высокие места и с минимальным разрывом.
    battles.sort(key=lambda b: (b["pos"], min(b["gaps"])))

    # --- Прогноз: задний быстрее и догонит до зоны DRS в обозримые круги ---
    forecast: list[dict] = []
    top = order[:FORECAST_TOP]
    for ahead, behind in zip(top, top[1:]):
        if ahead["pit"] or behind["pit"]:
            continue
        gap = _num(_at(itv.get(behind["num"], []), t))
        if gap is None or gap < BATTLE_GAP or gap > FORECAST_MAX_GAP:
            continue
        pa, pb = pace(lapdur.get(ahead["num"], []), t), pace(lapdur.get(behind["num"], []), t)
        if pa is None or pb is None:
            continue
        # Сближение должно быть видно дважды: по темпу кругов И по реально
        # сократившемуся интервалу — берём меньшее (осторожная оценка).
        before = _num(_at(itv.get(behind["num"], []), t - TREND_LAPS * lap_s))
        if before is None:
            continue
        rate = min(pa - pb, (before - gap) / TREND_LAPS)
        if rate < FORECAST_MIN_RATE:
            continue
        # Вблизи «грязный воздух» и ответ лидера замедляют сближение — берём запас.
        laps = max(1, math.ceil((gap - BATTLE_GAP) / rate * SLOWDOWN))
        if laps > FORECAST_MAX_LAPS or (laps_left is not None and laps > laps_left):
            continue
        forecast.append(
            {
                "pos": ahead["pos"],
                "ahead": car(ahead),
                "behind": car(behind),
                "gap": round(gap, 3),
                "rate": round(rate, 3),
                "laps": laps,
            }
        )
    forecast.sort(key=lambda f: (f["laps"], f["pos"]))
    return {"battles": battles[:4], "forecast": forecast[:3]}
