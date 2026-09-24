"""Стримы кастеров (Фаза 6). Отдаём только сериализаторы; видео — сторонний embed."""

from fastapi import APIRouter, Header, HTTPException, Request
from pydantic import BaseModel

from .. import realtime
from ..config import get_settings
from ..schemas import StreamOut
from ..services import streams as svc

# Разрешённые реакции (строки 1:1 с фронтом).
REACTIONS = {"🔥", "❤️", "👏", "🏎️", "😮"}

router = APIRouter(prefix="/api/v1", tags=["streams"])


@router.get("/streams", response_model=list[StreamOut])
async def streams() -> list[StreamOut]:
    return [StreamOut(**s) for s in await svc.list_streams()]


class ReactIn(BaseModel):
    e: str
    n: str | None = None  # одноразовый id отправителя — чтобы не показать себе реакцию дважды


@router.post("/streams/{stream_id}/react")
async def react(stream_id: str, body: ReactIn, request: Request) -> dict:
    """Реакция зрителя: проверяем, режем спам по IP и рассылаем всем в канал стрима."""
    if body.e not in REACTIONS:
        raise HTTPException(status_code=400, detail="Неизвестная реакция")
    if not svc.stream_exists(stream_id):
        raise HTTPException(status_code=404, detail="Стрим не найден")
    ip = (request.headers.get("x-forwarded-for") or (request.client.host if request.client else "")).split(",")[0].strip()
    if not await svc.allow_reaction(ip):
        raise HTTPException(status_code=429, detail="Слишком часто")
    await realtime.publish(f"reactions:{stream_id}", {"e": body.e, "n": (body.n or "")[:24]})
    return {"ok": True}


class LiveIn(BaseModel):
    live: bool


@router.post("/streams/{stream_id}/live")
async def set_live(
    stream_id: str,
    body: LiveIn,
    x_admin_token: str = Header(default=""),
) -> dict:
    token = get_settings().admin_token
    # Тумблер выключен, пока не задан секрет (иначе кто угодно менял бы «в эфире»).
    if not token or x_admin_token != token:
        raise HTTPException(status_code=403, detail="Нет доступа")
    if not await svc.set_live(stream_id, body.live):
        raise HTTPException(status_code=404, detail="Стрим не найден")
    return {"id": stream_id, "live": body.live}
