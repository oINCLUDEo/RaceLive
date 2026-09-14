"""Локализация сообщений рейс-контроля — ключевая ценность продукта.

Работает с форматом OpenF1: сообщение приходит объектом со структурными полями
(category, flag, scope, sector, message). Локализуем по полям, где можно (флаги),
а текст разбираем только для инцидентов/штрафов/удалений времени. Неизвестный
формат отдаём как есть (по-английски) — ничего не теряем.

Тот же `localize()` используется и для демо-ленты, и для реального потока OpenF1
(твёрдое правило: русская локализация живёт в бэкенде, не на фронте).
"""

from __future__ import annotations

import random
import re

# --- Локализация -----------------------------------------------------------------

_VERDICTS = [
    ("NO FURTHER INVESTIGATION", "расследование прекращено"),
    ("NO FURTHER ACTION", "без последствий"),
    ("UNDER INVESTIGATION", "на рассмотрении стюардов"),
    ("BEING INVESTIGATED", "на рассмотрении стюардов"),
    ("NOTED", "зафиксирован"),
    ("REVIEWED", "рассмотрен"),
]


def _car_code(text: str) -> str | None:
    m = re.search(r"\(([A-Z]{3})\)", text)
    return m.group(1) if m else None


def _verdict(u: str) -> str:
    for en, ru in _VERDICTS:
        if en in u:
            return ru
    return "на рассмотрении стюардов"


def localize(rc: dict) -> str:
    """Сообщение рейс-контроля (объект OpenF1) → русский текст."""
    cat = (rc.get("category") or "").strip()
    flag = (rc.get("flag") or "").strip().upper()
    msg = (rc.get("message") or "").strip()
    u = msg.upper()
    sector = rc.get("sector")

    # --- Флаги: по структурному полю flag ---
    if flag == "GREEN":
        return "Зелёный свет — выезд с пит-лейн открыт" if "PIT" in u else "Зелёный флаг — трасса открыта"
    if flag == "CHEQUERED":
        return "Клетчатый флаг — финиш"
    if flag == "RED":
        return "Красный флаг — сессия остановлена"
    if flag == "BLUE":
        code = _car_code(u)
        return f"Синий флаг: {code} — пропустить лидеров" if code else "Синий флаг — пропустить лидеров"
    if flag == "YELLOW":
        return f"Жёлтый флаг в {sector}-м секторе" if sector else "Жёлтый флаг"
    if flag == "DOUBLE YELLOW":
        return f"Двойной жёлтый флаг в {sector}-м секторе" if sector else "Двойной жёлтый флаг"
    if flag == "CLEAR":
        return f"Чисто в {sector}-м секторе" if sector else "Трасса чиста"

    # --- DRS ---
    if cat == "Drs" or u.startswith("DRS"):
        if "ENABLED" in u:
            return "DRS включён"
        if "DISABLED" in u:
            return "DRS отключён"

    # --- Сейфти-кар ---
    if cat == "SafetyCar" or "SAFETY CAR" in u:
        if "VIRTUAL" in u:
            return "Виртуальный сейфти-кар завершается" if "ENDING" in u else "Виртуальный сейфти-кар (VSC)"
        if "IN THIS LAP" in u:
            return "Сейфти-кар уходит в этом круге"
        if "DEPLOYED" in u:
            return "Сейфти-кар на трассе"

    # --- Статус сессии ---
    if cat == "SessionStatus" or u.startswith("SESSION"):
        if "STARTED" in u:
            return "Сессия началась"
        if "SUSPENDED" in u:
            return "Сессия приостановлена"
        if "RESUMED" in u:
            return "Сессия возобновлена"
        if "FINISHED" in u or "ENDED" in u:
            return "Сессия завершена"

    # --- Пит-лейн ---
    if u.startswith("PIT EXIT CLOSED"):
        return "Выезд с пит-лейн закрыт"
    if u.startswith("PIT ENTRY CLOSED"):
        return "Въезд на пит-лейн закрыт"
    if u.startswith("PIT EXIT OPEN"):
        return "Выезд с пит-лейн открыт"

    # --- Погода ---
    m = re.search(r"RISK OF RAIN.*?(\d+)\s*%", u)
    if m:
        return f"Вероятность дождя: {m.group(1)}%"

    # --- Инциденты (в т.ч. «FIA STEWARDS: ...») ---
    m = re.search(r"INCIDENT INVOLVING CARS? (\d+) \(([A-Z]{3})\)(?: AND (\d+) \(([A-Z]{3})\))?", u)
    if m:
        who = m.group(2) + (f" и {m.group(4)}" if m.group(4) else "")
        prefix = "Стюарды ФИА: " if u.startswith("FIA STEWARDS") else ""
        return f"{prefix}Инцидент {who} — {_verdict(u)}"

    # --- Штраф ---
    m = re.search(r"CAR \d+ \(([A-Z]{3})\).*?(\d+)\s*SECOND", u)
    if m and "PENALTY" in u:
        kind = "Stop&Go" if "STOP" in u else "штраф"
        return f"{m.group(1)}: {kind} {m.group(2)} с"

    # --- Удаление времени/круга (вылет за пределы трассы) ---
    m = re.match(r"CAR \d+ \(([A-Z]{3})\).*(?:LAP|TIME).*REINSTATED", u)
    if m:
        return f"{m.group(1)}: время восстановлено"
    m = re.match(r"CAR \d+ \(([A-Z]{3})\).*(?:LAP|TIME).*DELETED", u)
    if m:
        reason = "вылет за пределы трассы" if "TRACK LIMITS" in u else "отменено"
        return f"{m.group(1)}: время отменено ({reason})"

    return msg  # неизвестный формат — оставляем оригинал, не теряем


# --- Категория/флаг для раскраски на фронте --------------------------------------

def feed_flag(rc: dict) -> str | None:
    f = (rc.get("flag") or "").strip().upper()
    if f in ("YELLOW", "DOUBLE YELLOW"):
        return "yellow"
    if f in ("GREEN", "CLEAR"):
        return "green"
    if f == "RED":
        return "red"
    if f == "BLUE":
        return "blue"
    if f == "CHEQUERED":
        return "chequered"
    return None


def feed_cat(rc: dict) -> str:
    cat = (rc.get("category") or "").strip()
    u = (rc.get("message") or "").upper()
    if (rc.get("flag") or "").strip():
        return "flag"
    if cat == "Drs":
        return "drs"
    if cat == "SafetyCar" or "SAFETY CAR" in u:
        return "sc"
    if "PENALTY" in u:
        return "penalty"
    if "INCIDENT" in u:
        return "incident"
    if cat == "SessionStatus":
        return "session"
    return "info"


def feed_item(rc: dict, lap: int | None = None) -> dict:
    """Готовит сообщение к публикации: русский текст + оригинал + метки для UI."""
    return {
        "lap": lap if lap is not None else rc.get("lap_number"),
        "cat": feed_cat(rc),
        "flag": feed_flag(rc),
        "message": (rc.get("message") or "").strip(),
        "message_ru": localize(rc),
    }


# --- Демо-лента (в формате OpenF1), пока не подключён реальный поток ---------------

_CARS: list[tuple[str, str]] = [
    ("NOR", "4"), ("VER", "1"), ("PIA", "81"), ("LEC", "16"),
    ("RUS", "63"), ("HAM", "44"), ("ANT", "12"), ("ALB", "23"),
]


def random_event() -> dict:
    """Случайное сообщение рейс-контроля в формате OpenF1 (для демо-ленты)."""
    r = random.random()
    if r < 0.24:
        return {"category": "Flag", "flag": "YELLOW", "sector": int(random.choice("123")),
                "message": f"YELLOW IN TRACK SECTOR {random.choice('123')}"}
    if r < 0.40:
        return {"category": "Flag", "flag": "CLEAR", "sector": int(random.choice("123")),
                "message": f"CLEAR IN TRACK SECTOR {random.choice('123')}"}
    if r < 0.52:
        code, num = random.choice(_CARS)
        return {"category": "Flag", "flag": "BLUE",
                "message": f"WAVED BLUE FLAG FOR CAR {num} ({code}) TIMED AT 14:20:00"}
    if r < 0.66:
        return {"category": "Drs", "flag": None,
                "message": random.choice(["DRS ENABLED", "DRS DISABLED"])}
    if r < 0.74:
        return {"category": "SafetyCar", "flag": None, "message": "SAFETY CAR DEPLOYED"}
    if r < 0.82:
        return {"category": "SafetyCar", "flag": None, "message": "VIRTUAL SAFETY CAR DEPLOYED"}
    if r < 0.91:
        code, num = random.choice(_CARS)
        return {"category": "Other", "flag": None,
                "message": f"CAR {num} ({code}) {random.choice([5, 10])} SECOND TIME PENALTY"}
    a = random.choice(_CARS)
    b = random.choice([c for c in _CARS if c != a])
    return {"category": "Other", "flag": None,
            "message": f"TURN 7 INCIDENT INVOLVING CARS {a[1]} ({a[0]}) AND {b[1]} ({b[0]}) NOTED"}
