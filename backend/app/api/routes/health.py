from fastapi import APIRouter

from app.core.config import get_settings

router = APIRouter()


@router.get("/health")
def health() -> dict:
    settings = get_settings()
    return {
        "status": "ok",
        "service": "INSTITUTION360 API",
        "is_demo_data": settings.is_demo_data,
        "database": settings.database_url.split("://")[0],
    }
