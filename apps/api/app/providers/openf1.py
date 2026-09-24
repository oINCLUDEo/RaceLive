"""OpenF1 — источник live/replay-данных (позиции, интервалы, круги, шины, рейс-контроль).

Два режима доступа:
  • без ключа — бесплатная история (≤30 запросов/мин). ВАЖНО: пока идёт живая сессия,
    OpenF1 закрывает для анонимов ВЕСЬ API (даже прошлые гонки) — отвечает 401
    «Live F1 session in progress». Это ловим как OpenF1Locked.
  • с аккаунтом (OPENF1_USERNAME/OPENF1_PASSWORD, платный тариф) — живые данные во время
    сессии по REST, ≤60 запросов/мин. Токен: POST /token (form username/password),
    живёт час, передаётся как «Authorization: Bearer …».

Клиент всегда за token-bucket'ом (твёрдое правило): лимит не превышается физически.

База: https://api.openf1.org/v1
"""

from __future__ import annotations

import asyncio
import time

import httpx

from ..config import get_settings
from ..ratelimit import TokenBucket

API_ROOT = "https://api.openf1.org"
BASE_URL = f"{API_ROOT}/v1"


class OpenF1Locked(RuntimeError):
    """Идёт живая сессия — анонимный доступ к OpenF1 закрыт до её конца."""


class OpenF1Client:
    name = "openf1"

    def __init__(self) -> None:
        s = get_settings()
        self._user = s.openf1_username
        self._password = s.openf1_password
        # Бесплатно: 30/мин → 0.45/с; платно: 60/мин → 0.95/с. С запасом ниже лимита.
        self._bucket = TokenBucket(rate_per_sec=0.95 if self.has_auth else 0.45, burst=4)
        self._token: str | None = None
        self._token_exp = 0.0
        self._token_lock = asyncio.Lock()

    @property
    def has_auth(self) -> bool:
        return bool(self._user and self._password)

    _RETRIES = 3

    async def _headers(self, client: httpx.AsyncClient, force: bool = False) -> dict:
        h = {"Accept": "application/json"}
        if not self.has_auth:
            return h
        async with self._token_lock:
            if force or not self._token or time.time() > self._token_exp - 300:
                await self._bucket.acquire()
                r = await client.post(
                    f"{API_ROOT}/token",
                    data={"username": self._user, "password": self._password},
                    headers={"Content-Type": "application/x-www-form-urlencoded"},
                )
                r.raise_for_status()
                body = r.json()
                self._token = body["access_token"]
                self._token_exp = time.time() + float(body.get("expires_in") or 3600)
        h["Authorization"] = f"Bearer {self._token}"
        return h

    async def _request(self, url: httpx.URL | str, params: dict | None = None) -> list[dict]:
        last_exc: Exception | None = None
        async with httpx.AsyncClient(timeout=30.0) as client:
            for attempt in range(self._RETRIES):
                await self._bucket.acquire()
                try:
                    headers = await self._headers(client, force=attempt > 0 and isinstance(last_exc, _AuthExpired))
                    resp = await client.get(url, params=params, headers=headers)
                    if resp.status_code == 401:
                        detail = resp.text
                        if "Live F1 session in progress" in detail and not self.has_auth:
                            raise OpenF1Locked(detail[:200])
                        raise _AuthExpired(detail[:200])
                    if resp.status_code == 429:
                        raise httpx.HTTPStatusError("rate limited", request=resp.request, response=resp)
                    resp.raise_for_status()
                    data = resp.json()
                    return data if isinstance(data, list) else []
                except OpenF1Locked:
                    raise
                except (httpx.HTTPError, ValueError, _AuthExpired) as exc:
                    last_exc = exc
                    if attempt < self._RETRIES - 1:
                        await asyncio.sleep(1.0 * (attempt + 1))
        raise RuntimeError(f"OpenF1 недоступен: {url}") from last_exc

    async def _get(self, endpoint: str, **params) -> list[dict]:
        return await self._request(f"{BASE_URL}/{endpoint}", params=params)

    async def _get_since(self, endpoint: str, session_key: int | str, since: str | None, field: str = "date") -> list[dict]:
        """Строки новее `since` (фильтр OpenF1 вида `date>2025-…`). Оператор `>` должен
        уйти в запросе как есть, поэтому собираем raw-путь без перекодирования."""
        query = f"/v1/{endpoint}?session_key={session_key}"
        if since:
            query += f"&{field}>{since}"
        url = httpx.URL(scheme="https", host="api.openf1.org", raw_path=query.encode())
        return await self._request(url)

    # --- эндпойнты ---------------------------------------------------------------
    async def session(self, session_key: int | str) -> dict | None:
        rows = await self._get("sessions", session_key=session_key)
        return rows[0] if rows else None

    async def race_sessions(self, year: int) -> list[dict]:
        return await self._get("sessions", year=year, session_name="Race")

    async def drivers(self, session_key: int | str) -> list[dict]:
        return await self._get("drivers", session_key=session_key)

    async def race_control(self, session_key: int | str) -> list[dict]:
        return await self._get("race_control", session_key=session_key)

    async def position(self, session_key: int | str) -> list[dict]:
        return await self._get("position", session_key=session_key)

    async def intervals(self, session_key: int | str) -> list[dict]:
        return await self._get("intervals", session_key=session_key)

    async def laps(self, session_key: int | str) -> list[dict]:
        return await self._get("laps", session_key=session_key)

    async def stints(self, session_key: int | str) -> list[dict]:
        return await self._get("stints", session_key=session_key)

    async def weather(self, session_key: int | str) -> list[dict]:
        return await self._get("weather", session_key=session_key)

    async def pit(self, session_key: int | str) -> list[dict]:
        return await self._get("pit", session_key=session_key)


class _AuthExpired(Exception):
    """401 при наличии ключа — перевыпустить токен и повторить."""
