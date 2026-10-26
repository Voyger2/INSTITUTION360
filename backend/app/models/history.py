from datetime import date, datetime

from sqlalchemy import JSON, Date, DateTime, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base

ACTION_TYPES = (
    "status_change",
    "assignment",
    "transfer",
    "clarification_requested",
    "clarification_received",
    "escalation",
    "note",
)


class StatusHistory(Base):
    __tablename__ = "status_history"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    complaint_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("complaints.id"), index=True
    )
    from_status: Mapped[str | None] = mapped_column(String(32), nullable=True)
    to_status: Mapped[str] = mapped_column(String(32))
    changed_by: Mapped[str] = mapped_column(String(36))
    changed_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    reason: Mapped[str] = mapped_column(Text)


class AssignmentHistory(Base):
    __tablename__ = "assignment_history"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    complaint_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("complaints.id"), index=True
    )
    from_bureau_code: Mapped[str | None] = mapped_column(String(16), nullable=True)
    from_officer_id: Mapped[str | None] = mapped_column(String(36), nullable=True)
    to_bureau_code: Mapped[str] = mapped_column(String(16))
    to_officer_id: Mapped[str] = mapped_column(String(36))
    transfer_reason: Mapped[str] = mapped_column(Text)
    transferred_by: Mapped[str] = mapped_column(String(36))
    transferred_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))


class ActionHistory(Base):
    __tablename__ = "action_history"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    complaint_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("complaints.id"), index=True
    )
    action_type: Mapped[str] = mapped_column(String(48), index=True)
    description: Mapped[str] = mapped_column(Text)
    performed_by: Mapped[str] = mapped_column(String(36))
    performed_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    meta: Mapped[dict | None] = mapped_column(JSON, nullable=True)


class AuditEvent(Base):
    __tablename__ = "audit_events"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    actor_id: Mapped[str] = mapped_column(String(36), index=True)
    actor_name: Mapped[str] = mapped_column(String(200))
    action: Mapped[str] = mapped_column(String(64), index=True)
    entity_type: Mapped[str] = mapped_column(String(48), index=True)
    entity_id: Mapped[str] = mapped_column(String(64), index=True)
    detail: Mapped[str] = mapped_column(Text, default="")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), index=True)
