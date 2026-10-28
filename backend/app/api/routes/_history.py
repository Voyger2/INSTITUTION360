import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.history import ActionHistory, AssignmentHistory, StatusHistory
from app.models.complaint import Complaint
from app.models.user import User
from app.schemas.complaint import (
    AssignmentRequest,
    ComplaintHistory,
    HistoryEntry,
    StatusChangeRequest,
    TransferRequest,
)

router = APIRouter(prefix="/complaints", tags=["complaints"])


def _actor_name(user: User) -> str:
    return user.name


def _record_action(
    db: Session,
    complaint: Complaint,
    user: User,
    action_type: str,
    description: str,
    meta: dict | None = None,
) -> None:
    db.add(
        ActionHistory(
            id=uuid.uuid4().hex,
            complaint_id=complaint.id,
            action_type=action_type,
            description=description,
            performed_by=user.id,
            performed_at=datetime.now(timezone.utc),
            meta=meta,
        )
    )


def build_history(db: Session, complaint_id: str) -> ComplaintHistory:
    status_rows = db.scalars(
        select(StatusHistory)
        .where(StatusHistory.complaint_id == complaint_id)
        .order_by(StatusHistory.changed_at.desc())
    ).all()
    assignment_rows = db.scalars(
        select(AssignmentHistory)
        .where(AssignmentHistory.complaint_id == complaint_id)
        .order_by(AssignmentHistory.transferred_at.desc())
    ).all()
    action_rows = db.scalars(
        select(ActionHistory)
        .where(ActionHistory.complaint_id == complaint_id)
        .order_by(ActionHistory.performed_at.desc())
    ).all()

    return ComplaintHistory(
        complaint_id=complaint_id,
        status_history=[
            HistoryEntry(
                id=r.id,
                at=r.changed_at,
                entry_type="Status change",
                description=f"{r.from_status or 'New'} -> {r.to_status}: {r.reason}",
                actor=r.changed_by,
            )
            for r in status_rows
        ],
        assignment_history=[
            HistoryEntry(
                id=r.id,
                at=r.transferred_at,
                entry_type="Assignment",
                description=f"Case assigned to bureau {r.to_bureau_code}, officer {r.to_officer_id}: {r.transfer_reason}",
                actor=r.transferred_by,
                detail={
                    "from_bureau_code": r.from_bureau_code,
                    "to_bureau_code": r.to_bureau_code,
                    "to_officer_id": r.to_officer_id,
                },
            )
            for r in assignment_rows
        ],
        action_history=[
            HistoryEntry(
                id=r.id,
                at=r.performed_at,
                entry_type=r.action_type,
                description=r.description,
                actor=r.performed_by,
                detail=r.meta,
            )
            for r in action_rows
        ],
    )
