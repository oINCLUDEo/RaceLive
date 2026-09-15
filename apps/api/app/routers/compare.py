"""Сравнение двух пилотов по кругам (тест). Данные — OpenF1 (времена кругов гонки)."""

from datetime import datetime, timezone

from fastapi import APIRouter, Query

from .. import replay
from ..cache import cached
from ..localization import driver_name_ru
from ..providers.openf1 import OpenF1Client

router = APIRouter(prefix="/api/v1", tags=["compare"])


async def _race_list(client: OpenF1Client) -> list[dict]:
    """Список прошедших гонок сезона для выбора (новые сверху)."""
    now = datetime.now(timezone.utc).timestamp()
    cur = datetime.now(timezone.utc).year
    for year in (cur, cur - 1):
        try:
            rows = await client.race_sessions(year)
        except Exception:
            rows = []
        past = sorted(
            ((t, r) for r in rows if (t := replay._ts(r.get("date_start"))) and t <= now),
            key=lambda x: -x[0],
        )
        if past:
            return [
                {
                    "key": r.get("session_key"),
                    "label": r.get("country_name") or r.get("circuit_short_name") or f"#{r.get('session_key')}",
                }
                for _, r in past
            ]
    return []


async def _build(session_key: int) -> dict:
    client = OpenF1Client()
    if not session_key:
        session_key = await replay._latest_race_key(client)
    if not session_key:
        return {"session": None, "session_key": None, "drivers": [], "sessions": []}

    sess = await client.session(session_key)
    drivers = await client.drivers(session_key)
    laps = await client.laps(session_key)
    pits = await client.pit(session_key)
    sessions = await _race_list(client)

    label = ""
    if sess:
        label = f"Гонка · {sess.get('circuit_short_name') or sess.get('country_name') or ''}".strip(" ·")

    pit_laps: dict[int, list[int]] = {}
    for p in pits:
        num, ln = p.get("driver_number"), p.get("lap_number")
        if num is not None and ln is not None:
            pit_laps.setdefault(num, []).append(ln)

    by_num: dict[int, dict] = {}
    for d in drivers:
        num = d.get("driver_number")
        if num is None:
            continue
        code = d.get("name_acronym") or str(num)
        full = d.get("full_name") or code
        by_num[num] = {
            "num": num,
            "code": code,
            "name_ru": driver_name_ru(code, full) or full,
            "name_en": full,
            "team": replay._slug_for(d.get("team_name")),
            "laps": [],
            "pits": sorted(set(pit_laps.get(num, []))),
        }
    for lp in laps:
        num = lp.get("driver_number")
        dur = lp.get("lap_duration")
        ln = lp.get("lap_number")
        if num in by_num and dur and ln:
            by_num[num]["laps"].append({"lap": ln, "time": round(float(dur), 3)})

    result = [d for d in by_num.values() if d["laps"]]
    for d in result:
        d["laps"].sort(key=lambda x: x["lap"])
    result.sort(key=lambda d: d["code"])
    return {"session": label, "session_key": session_key, "drivers": result, "sessions": sessions}


@router.get("/compare")
async def compare(session: int | None = Query(None)) -> dict:
    key = session or 0
    return await cached(f"compare:{key}", 6 * 3600, lambda: _build(key))
