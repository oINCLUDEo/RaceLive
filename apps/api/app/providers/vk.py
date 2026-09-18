"""VK API — авто-подхват прямого эфира сообщества (требует сервисный токен).

VK не отдаёт живой стрим паблика без токена. С токеном: resolveScreenName → owner_id,
затем video.get → ищем видео с live=1. Клиент за token-bucket'ом. Токен — из настроек
(VK_SERVICE_TOKEN); без него resolve() возвращает None, и VK-кастер считается офлайн.

База: https://api.vk.com/method
"""

from __future__ import annotations

import asyncio

import httpx

from ..config import get_settings
from ..ratelimit import TokenBucket

BASE_URL = "https://api.vk.com/method"
API_VERSION = "5.199"


class VKClient:
    name = "vk"

    def __init__(self) -> None:
        self._bucket = TokenBucket(rate_per_sec=2.0, burst=3)

    async def _call(self, method: str, **params) -> dict:
        token = get_settings().vk_service_token
        if not token:
            raise RuntimeError("VK_SERVICE_TOKEN не задан")
        params = {**params, "access_token": token, "v": API_VERSION}
        async with httpx.AsyncClient(timeout=15.0) as client:
            await self._bucket.acquire()
            resp = await client.get(f"{BASE_URL}/{method}", params=params)
            resp.raise_for_status()
            data = resp.json()
        if "error" in data:
            raise RuntimeError(f"VK error: {data['error'].get('error_msg')}")
        return data.get("response") or {}

    async def resolve_community(self, screen_name: str) -> dict | None:
        """Вернуть {embed_url, live, title} по короткому имени сообщества или None."""
        if not get_settings().vk_service_token:
            return None
        obj = await self._call("utils.resolveScreenName", screen_name=screen_name)
        if not obj or "object_id" not in obj:
            return None
        oid = int(obj["object_id"])
        owner = -oid if obj.get("type") in ("group", "page", "event") else oid
        await asyncio.sleep(0)  # уступить циклу между вызовами
        vids = await self._call("video.get", owner_id=owner, count=15)
        items = vids.get("items") or []
        if not items:
            return None
        live = next((v for v in items if v.get("live") == 1 or v.get("live_status") == "started"), None)
        pick = live or items[0]
        embed = f"https://vk.com/video_ext.php?oid={pick.get('owner_id')}&id={pick.get('id')}&hd=2"
        return {"embed_url": embed, "live": bool(live), "title": pick.get("title")}
