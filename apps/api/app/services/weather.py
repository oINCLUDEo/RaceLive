"""Прогноз погоды на гоночный уик-энд (Open-Meteo).

Русская локализация условий — здесь, в бэкенде (твёрдое правило). Публичный ответ —
только сериализованные дни, не сырой объект Open-Meteo. Результат кэшируется в Redis.
"""

from __future__ import annotations

from datetime import date, datetime, timedelta, timezone

from .. import cache
from ..circuit_coords import CIRCUIT_COORDS
from ..localization import circuit_name_ru
from ..models import Meeting
from ..providers.openmeteo import OpenMeteoClient

_client = OpenMeteoClient()

FORECAST_HORIZON_DAYS = 16
CACHE_TTL_SEC = 2 * 60 * 60

WEEKDAY_RU = [
    "Понедельник", "Вторник", "Среда", "Четверг", "Пятница", "Суббота", "Воскресенье",
]

# WMO weather code → (slug для иконки, русское название). Slug группирует коды.
_WMO: dict[int, tuple[str, str]] = {
    0: ("clear", "Ясно"),
    1: ("clear", "Преимущественно ясно"),
    2: ("cloudy", "Переменная облачность"),
    3: ("cloudy", "Пасмурно"),
    45: ("fog", "Туман"),
    48: ("fog", "Изморозь"),
    51: ("rain", "Морось"),
    53: ("rain", "Морось"),
    55: ("rain", "Сильная морось"),
    56: ("rain", "Ледяная морось"),
    57: ("rain", "Ледяная морось"),
    61: ("rain", "Небольшой дождь"),
    63: ("rain", "Дождь"),
    65: ("rain", "Сильный дождь"),
    66: ("rain", "Ледяной дождь"),
    67: ("rain", "Ледяной дождь"),
    71: ("snow", "Небольшой снег"),
    73: ("snow", "Снег"),
    75: ("snow", "Сильный снег"),
    77: ("snow", "Снежная крупа"),
    80: ("rain", "Ливень"),
    81: ("rain", "Ливень"),
    82: ("rain", "Сильный ливень"),
    85: ("snow", "Снегопад"),
    86: ("snow", "Сильный снегопад"),
    95: ("storm", "Гроза"),
    96: ("storm", "Гроза с градом"),
    99: ("storm", "Сильная гроза с градом"),
}


def _at(seq, i):
    if isinstance(seq, list) and 0 <= i < len(seq):
        return seq[i]
    return None


def _empty(rnd: int, circuit_ru: str | None, note: str) -> dict:
    return {"round": rnd, "circuit_ru": circuit_ru, "available": False, "note": note, "days": []}


async def get_weekend_forecast(meeting: Meeting) -> dict:
    rnd = meeting.round
    ckey = meeting.circuit.key if meeting.circuit else None
    circuit_ru = (
        (meeting.circuit.name_ru or circuit_name_ru(ckey, meeting.circuit.name_en))
        if meeting.circuit
        else None
    )
    coords = CIRCUIT_COORDS.get(ckey) if ckey else None
    if not coords:
        return _empty(rnd, circuit_ru, "Координаты трассы неизвестны")

    # Заголовочная сессия дня — последняя по времени в этот день (обычно главная).
    session_by_date: dict[date, str] = {}
    for s in sorted(
        (s for s in meeting.sessions if s.starts_at), key=lambda s: s.starts_at
    ):
        session_by_date[s.starts_at.date()] = s.name_ru or s.name_en

    dates = sorted(session_by_date.keys())
    if not dates:
        return _empty(rnd, circuit_ru, "Даты сессий пока неизвестны")

    today = datetime.now(timezone.utc).date()
    start, end = dates[0], dates[-1]
    if end < today:
        return _empty(rnd, circuit_ru, "Уик-энд уже прошёл")
    if start > today + timedelta(days=FORECAST_HORIZON_DAYS):
        return _empty(rnd, circuit_ru, "Прогноз появится ближе к уик-энду")
    start = max(start, today)

    lat, lon = coords
    key = f"weather:v1:{rnd}:{start.isoformat()}:{end.isoformat()}"

    async def _produce() -> dict:
        raw = await _client.daily(lat, lon, start.isoformat(), end.isoformat())
        daily = raw.get("daily") or {}
        times = daily.get("time") or []
        days: list[dict] = []
        for i, iso in enumerate(times):
            try:
                d = date.fromisoformat(iso)
            except ValueError:
                continue
            code = _at(daily.get("weather_code"), i)
            slug, ru = _WMO.get(int(code) if code is not None else -1, ("cloudy", "Облачно"))
            tmax = _at(daily.get("temperature_2m_max"), i)
            tmin = _at(daily.get("temperature_2m_min"), i)
            pprob = _at(daily.get("precipitation_probability_max"), i)
            wind = _at(daily.get("wind_speed_10m_max"), i)
            psum = _at(daily.get("precipitation_sum"), i)
            rain = slug in ("rain", "storm") or (psum is not None and psum >= 0.2)
            days.append(
                {
                    "date": iso,
                    "label_ru": WEEKDAY_RU[d.weekday()],
                    "session_ru": session_by_date.get(d),
                    "t_max": round(tmax) if tmax is not None else None,
                    "t_min": round(tmin) if tmin is not None else None,
                    "precip_prob": int(pprob) if pprob is not None else None,
                    "wind_max": round(wind, 1) if wind is not None else None,
                    "condition": slug,
                    "condition_ru": ru,
                    "rain": rain,
                }
            )
        if not days:
            return {}
        return {"round": rnd, "circuit_ru": circuit_ru, "available": True, "note": None, "days": days}

    try:
        data = await cache.cached(key, CACHE_TTL_SEC, _produce)
    except Exception:
        return _empty(rnd, circuit_ru, "Прогноз временно недоступен")
    if not data:
        return _empty(rnd, circuit_ru, "Прогноз временно недоступен")
    return data
