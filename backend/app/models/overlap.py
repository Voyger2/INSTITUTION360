from datetime import datetime

from sqlalchemy import JSON, DateTime, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base

ALERT_STATUSES = ("new", "reviewed", "related", "not_overlapping", "coordination_required")
REVIEW_DECISIONS = ("reviewed", "related", "not_overlapping", "coordination_required")


class OverlapAlert(Base):
    __tablename__ = "overlap_alerts"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    institution_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("institutions.id"), index=True
    )
    # Canonical cross-bureau key: AICTE Permanent ID.
    institution_aicte_id: Mapped[str] = mapped_column(String(32), index=True)
    case_ids: Mapped[list] = mapped_column(JSON)
    bureau_codes: Mapped[list] = mapped_column(JSON)
    alert_status: Mapped[str] = mapped_column(String(32), default="new", index=True)
    detected_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    reviewed_by: Mapped[str | None] = mapped_column(String(36), nullable=True)
    reviewed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    review_decision: Mapped[str | None] = mapped_column(String(32), nullable=True)
    review_reason: Mapped[str | None] = mapped_column(String(500), nullable=True)
