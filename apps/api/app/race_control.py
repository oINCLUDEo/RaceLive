"""Локализация сообщений рейс-контроля — ключевая ценность продукта.

Реальный поток (OpenF1) отдаёт сообщения по-английски; `localize()` превращает
их в русские. Демо-генератор ниже эмулирует такую английскую ленту, чтобы весь
путь локализации работал уже сейчас. Когда подключим OpenF1 — тот же `localize()`
применяется к настоящим сообщениям, а результат ложится в `message_ru`
(твёрдое правило: русская локализация живёт в бэкенде/схеме, не на фронте).
"""

from __future__ import annotations

import random
import re

# Номера машин для демо-ленты (реальные брать из потока).
_CARS: list[tuple[str, str]] = [
    ("NOR", "4"),
    ("VER", "1"),
    ("PIA", "81"),
    ("LEC", "16"),
    ("RUS", "63"),
    ("HAM", "44"),
    ("ANT", "12"),
    ("ALB", "23"),
]


def localize(message: str) -> str:
    """Английское сообщение рейс-контроля → русское. Неизвестное отдаём как есть."""
    s = (message or "").strip()
    u = s.upper()

    m = re.match(r"(?:WAVED\s+)?DOUBLE YELLOW FLAG IN TRACK SECTOR (\d)", u)
    if m:
        return f"Двойной жёлтый флаг в {m.group(1)}-м секторе"
    m = re.match(r"YELLOW FLAG IN TRACK SECTOR (\d)", u)
    if m:
        return f"Жёлтый флаг в {m.group(1)}-м секторе"
    m = re.match(r"CLEAR IN TRACK SECTOR (\d)", u)
    if m:
        return f"Чисто в {m.group(1)}-м секторе"
    if u.startswith("TRACK CLEAR"):
        return "Трасса чиста"
    if u.startswith("GREEN LIGHT"):
        return "Зелёный свет — трасса открыта"
    if u.startswith("RED FLAG"):
        return "Красный флаг — сессия остановлена"

    if u.startswith("VIRTUAL SAFETY CAR DEPLOYED"):
        return "Виртуальный сейфти-кар (VSC)"
    if u.startswith("VIRTUAL SAFETY CAR ENDING"):
        return "VSC завершается"
    if u.startswith("SAFETY CAR IN THIS LAP"):
        return "Сейфти-кар уходит в этом круге"
    if u.startswith("SAFETY CAR DEPLOYED"):
        return "Сейфти-кар на трассе"

    if u.startswith("DRS ENABLED"):
        return "DRS включён"
    if u.startswith("DRS DISABLED"):
        return "DRS отключён"

    m = re.match(r"BLUE FLAG FOR CAR \d+ \(([A-Z]{3})\)", u)
    if m:
        return f"Синий флаг: {m.group(1)} — пропустить лидеров"

    m = re.match(r"(\d+) SECONDS? TIME PENALTY FOR CAR \d+ \(([A-Z]{3})\)(?:\s*-\s*(.*))?", u)
    if m:
        base = f"{m.group(1)}-секундный штраф: {m.group(2)}"
        return base
    m = re.match(r"(\d+) SECONDS? STOP AND GO PENALTY FOR CAR \d+ \(([A-Z]{3})\)", u)
    if m:
        return f"Штраф Stop&Go {m.group(1)} с: {m.group(2)}"

    m = re.match(
        r"INCIDENT INVOLVING CARS? \d+ \(([A-Z]{3})\) AND \d+ \(([A-Z]{3})\) (NOTED|UNDER INVESTIGATION)",
        u,
    )
    if m:
        tail = "на рассмотрении стюардов" if m.group(3) == "UNDER INVESTIGATION" else "зафиксирован"
        return f"Инцидент между {m.group(1)} и {m.group(2)}: {tail}"

    if u.startswith("CHEQUERED FLAG"):
        return "Клетчатый флаг — финиш"

    return s  # неизвестный формат — отдаём оригинал, ничего не теряем


def _msg(cat: str, flag: str | None, en: str) -> dict:
    return {"cat": cat, "flag": flag, "message": en, "message_ru": localize(en)}


def random_event() -> dict:
    """Случайное событие рейс-контроля (демо-лента в стиле OpenF1)."""
    r = random.random()
    if r < 0.24:
        return _msg("flag", "yellow", f"YELLOW FLAG IN TRACK SECTOR {random.choice('123')}")
    if r < 0.40:
        return _msg("flag", "green", f"CLEAR IN TRACK SECTOR {random.choice('123')}")
    if r < 0.52:
        code, num = random.choice(_CARS)
        return _msg("flag", "blue", f"BLUE FLAG FOR CAR {num} ({code})")
    if r < 0.66:
        return _msg("drs", None, random.choice(["DRS ENABLED", "DRS DISABLED"]))
    if r < 0.74:
        return _msg("sc", "yellow", "SAFETY CAR DEPLOYED")
    if r < 0.82:
        return _msg("sc", "yellow", "VIRTUAL SAFETY CAR DEPLOYED")
    if r < 0.91:
        code, num = random.choice(_CARS)
        return _msg("penalty", "red", f"{random.choice([5, 10])} SECOND TIME PENALTY FOR CAR {num} ({code})")
    a = random.choice(_CARS)
    b = random.choice([c for c in _CARS if c != a])
    return _msg(
        "incident",
        None,
        f"INCIDENT INVOLVING CARS {a[1]} ({a[0]}) AND {b[1]} ({b[0]}) NOTED",
    )
