from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import (
    audit,
    auth,
    complaints,
    dashboard,
    health,
    institutions,
    notifications,
    overlaps,
    reports,
)
from app.core.config import get_settings

settings = get_settings()

app = FastAPI(
    title="INSTITUTION360 API",
    description=(
        "Backend for the AICTE institution-related complaint monitoring and "
        "tracking system (SIH26264). "
        "**Demonstration stage:** seeded synthetic data, demo-grade authentication."
    ),
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[origin.strip() for origin in settings.cors_origins.split(",")],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

API_PREFIX = "/api"
app.include_router(health.router, prefix=API_PREFIX)
app.include_router(auth.router, prefix=API_PREFIX)
app.include_router(institutions.router, prefix=API_PREFIX)
app.include_router(complaints.router, prefix=API_PREFIX)
app.include_router(overlaps.router, prefix=API_PREFIX)
app.include_router(notifications.router, prefix=API_PREFIX)
app.include_router(reports.router, prefix=API_PREFIX)
app.include_router(dashboard.router, prefix=API_PREFIX)
app.include_router(audit.router, prefix=API_PREFIX)
