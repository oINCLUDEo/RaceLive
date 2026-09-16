"""Фото пилотов (headshot) из OpenF1 — по коду пилота (name_acronym).

Официальные фото с formula1.com; используем как автозаполнение аватара, если у нас
нет локального файла. Кэшируем на сутки. Ошибки не критичны — вернём пустой словарь.
"""

from .. import replay
from ..cache import cached
from ..providers.openf1 import OpenF1Client


async def _fetch() -> dict:
    client = OpenF1Client()
    key = await replay._latest_race_key(client)
    if not key:
        return {}
    rows = await client.drivers(key)
    return {
        r["name_acronym"]: r["headshot_url"]
        for r in rows
        if r.get("name_acronym") and r.get("headshot_url")
    }


async def get_headshots() -> dict:
    return await cached("driver:headshots", 24 * 3600, _fetch)
