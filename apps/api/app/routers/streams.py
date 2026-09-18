"""Стримы кастеров (Фаза 6). Отдаём только сериализаторы; видео — сторонний embed."""

from fastapi import APIRouter, Header, HTTPException
from pydantic import BaseModel

from ..config import get_settings
from ..schemas import StreamOut
from ..services import streams as svc

router = APIRouter(prefix="/api/v1", tags=["streams"])


@router.get("/streams", response_model=list[StreamOut])
async def streams() -> list[StreamOut]:
    return [StreamOut(**s) for s in await svc.list_streams()]


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
