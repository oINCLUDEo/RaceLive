from fastapi import APIRouter
from sqlalchemy import text

from ..config import get_settings
from ..db import engine

router = APIRouter(tags=["health"])


@router.get("/api/health")
async def health() -> dict:
    checks: dict[str, str] = {}
    try:
        async with engine.connect() as conn:
            await conn.execute(text("SELECT 1"))
        checks["postgres"] = "ok"
    except Exception as exc:  # noqa: BLE001
        checks["postgres"] = f"error: {exc}"

    status = "ok" if all(v == "ok" for v in checks.values()) else "degraded"
    return {"status": status, "provider": get_settings().data_provider, "checks": checks}
