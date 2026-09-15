"""Управление реплеем: скорость (общая для потока, меняется на лету)."""

from fastapi import APIRouter
from pydantic import BaseModel

from .. import replay

router = APIRouter(prefix="/api/v1/live", tags=["live"])


class SpeedIn(BaseModel):
    speed: float


@router.get("/speed")
async def get_speed() -> dict:
    return {"speed": replay.current_speed, "options": replay.ALLOWED_SPEEDS}


@router.post("/speed")
async def post_speed(body: SpeedIn) -> dict:
    return {"speed": replay.set_speed(body.speed), "options": replay.ALLOWED_SPEEDS}
