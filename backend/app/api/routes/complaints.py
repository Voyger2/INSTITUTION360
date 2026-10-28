from datetime import date, datetime, timezone
import uuid

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session

from app.api.deps import (
    enforce_bureau_scope,
    get_current_user,
    require_not_oversight,
)
from app.db.session import get_db
from app.models.complaint import (
    ACTIVE_STATUSES,
    FINAL_STATUSES,
    VALID_TRANSITIONS,
    Complaint,
)
from app.models.history import AssignmentHistory, StatusHistory
from app.models.institution import Institution
from app.models.overlap import OverlapAlert  # noqa: F401 (used by detect_overlaps via service)
from app.models.user import User
from app.schemas.complaint import (
    AssignmentRequest,
    ComplaintHistory,
    ComplaintList,
    ComplaintOut,
    StatusChangeRequest,
    TransferRequest,
)
from app.services.audit import record_audit
from app.services.overlap import detect_overlaps

from ._history import _record_action, build_history

router = APIRouter(prefix="/complaints", tags=["complaints"], dependencies=[Depends(get_current_user)])


@router.get("")
def list_complaints(
    search: str | None = None,
    bureau_code: str | None = None,
    status: str | None = None,
    category: str | None = None,
    is_overdue: bool | None = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
) -> ComplaintList:
    query = select(Complaint)
    conditions = []
    if search:
        like = f"%{search}%"
        query = query.join(
            Institution, Complaint.institution_id == Institution.id
        )
        conditions.append(
            or_(
                Complaint.case_id.ilike(like),
                Complaint.description.ilike(like),
                Institution.name.ilike(like),
            )
        )
    if bureau_code:
        conditions.append(Complaint.bureau_code == bureau_code)
    if status:
        conditions.append(Complaint.status == status)
    if category:
        conditions.append(Complaint.category == category)
    if is_overdue is True:
        conditions.extend(
            [
                Complaint.status.in_(tuple(ACTIVE_STATUSES)),
                Complaint.expected_disposal_date < date.today(),
            ]
        )
    elif is_overdue is False:
        not_overdue = or_(
            Complaint.status.in_(FINAL_STATUSES),
            Complaint.expected_disposal_date >= date.today(),
        )
        conditions.append(not_overdue)
    if conditions:
        query = query.where(*conditions)

    total = db.scalar(select(func.count()).select_from(query.subquery())) or 0
    rows = db.scalars(
        query.order_by(Complaint.received_date.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
    ).all()
    items = [_complaint_out(db, row) for row in rows]
    return ComplaintList(items=items, total=total, page=page, page_size=page_size)


def _complaint_out(db: Session, complaint: Complaint) -> ComplaintOut:
    institution = db.get(Institution, complaint.institution_id)
    officer = db.get(User, complaint.assigned_officer_id) if complaint.assigned_officer_id else None
    return ComplaintOut(
        id=complaint.id,
        case_id=complaint.case_id,
        institution_id=complaint.institution_id,
        category=complaint.category,
        bureau_code=complaint.bureau_code,
        assigned_officer_id=complaint.assigned_officer_id,
        status=complaint.status,
        received_date=complaint.received_date,
        expected_disposal_date=complaint.expected_disposal_date,
        last_action_date=complaint.last_action_date,
        description=complaint.description,
        is_demo_data=complaint.is_demo_data,
        institution_name=institution.name if institution else "",
        institution_aicte_id=institution.aicte_permanent_id if institution else "",
        assigned_officer_name=officer.name if officer else None,
        is_active=complaint.is_active,
        is_overdue=complaint.is_overdue,
        days_overdue=complaint.days_overdue,
        days_to_deadline=complaint.days_to_deadline,
    )


@router.get("/{complaint_id}")
def get_complaint(
    complaint_id: str, db: Session = Depends(get_db)
) -> ComplaintOut:
    complaint = db.get(Complaint, complaint_id)
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")
    return _complaint_out(db, complaint)


@router.get("/{complaint_id}/history")
def get_complaint_history(
    complaint_id: str, db: Session = Depends(get_db)
) -> ComplaintHistory:
    if not db.get(Complaint, complaint_id):
        raise HTTPException(status_code=404, detail="Complaint not found")
    return build_history(db, complaint_id)


@router.post("/{complaint_id}/status-change")
def change_status(
    complaint_id: str,
    payload: StatusChangeRequest,
    db: Session = Depends(get_db),
    user: User = Depends(require_not_oversight),
) -> dict:
    complaint = db.get(Complaint, complaint_id)
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")

    enforce_bureau_scope(complaint.bureau_code, user)

    if payload.to_status not in VALID_TRANSITIONS.get(complaint.status, ()):
        raise HTTPException(
            status_code=422,
            detail=f"Invalid transition from '{complaint.status}' to '{payload.to_status}'",
        )
    if not payload.reason.strip():
        raise HTTPException(status_code=422, detail="A reason is required")

    now = datetime.now(timezone.utc)
    db.add(
        StatusHistory(
            id=uuid.uuid4().hex,
            complaint_id=complaint.id,
            from_status=complaint.status,
            to_status=payload.to_status,
            changed_by=user.id,
            changed_at=now,
            reason=payload.reason.strip(),
        )
    )
    _record_action(
        db,
        complaint,
        user,
        "status_change",
        f"Status changed from {complaint.status} to {payload.to_status}",
        {"from_status": complaint.status, "to_status": payload.to_status},
    )
    complaint.status = payload.to_status
    complaint.last_action_date = now.date()
    record_audit(
        db,
        actor_id=user.id,
        actor_name=user.name,
        action="status_change",
        entity_type="complaint",
        entity_id=complaint.case_id,
        detail=f"{complaint.status} -> {payload.to_status}",
    )
    db.commit()
    detect_overlaps(db)
    return {"success": True, "status": complaint.status}


@router.post("/{complaint_id}/assignment")
def assign_officer(
    complaint_id: str,
    payload: AssignmentRequest,
    db: Session = Depends(get_db),
    user: User = Depends(require_not_oversight),
) -> dict:
    complaint = db.get(Complaint, complaint_id)
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")

    enforce_bureau_scope(complaint.bureau_code, user)

    officer = db.get(User, payload.officer_id)
    if not officer or not officer.is_active:
        raise HTTPException(status_code=422, detail="Officer not found")
    if officer.bureau_code != complaint.bureau_code:
        raise HTTPException(
            status_code=422,
            detail="Assigned officer must belong to the case's bureau; use transfer instead",
        )
    if not payload.reason.strip():
        raise HTTPException(status_code=422, detail="A reason is required")

    now = datetime.now(timezone.utc)
    previous_officer_id = complaint.assigned_officer_id
    db.add(
        AssignmentHistory(
            id=uuid.uuid4().hex,
            complaint_id=complaint.id,
            from_bureau_code=complaint.bureau_code,
            from_officer_id=previous_officer_id,
            to_bureau_code=complaint.bureau_code,
            to_officer_id=officer.id,
            transfer_reason=payload.reason.strip(),
            transferred_by=user.id,
            transferred_at=now,
        )
    )
    _record_action(
        db,
        complaint,
        user,
        "assignment",
        f"Officer assigned: {officer.name}",
        {"officer_id": officer.id},
    )
    complaint.assigned_officer_id = officer.id
    complaint.last_action_date = now.date()
    record_audit(
        db,
        actor_id=user.id,
        actor_name=user.name,
        action="assignment",
        entity_type="complaint",
        entity_id=complaint.case_id,
        detail=f"Assigned to {officer.name}",
    )
    db.commit()
    return {"success": True, "assigned_officer_id": officer.id}


@router.post("/{complaint_id}/transfer")
def transfer_case(
    complaint_id: str,
    payload: TransferRequest,
    db: Session = Depends(get_db),
    user: User = Depends(require_not_oversight),
) -> dict:
    complaint = db.get(Complaint, complaint_id)
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")

    enforce_bureau_scope(complaint.bureau_code, user)

    if payload.to_bureau_code == complaint.bureau_code:
        raise HTTPException(
            status_code=422, detail="Target bureau must differ from the current bureau"
        )
    officer = db.get(User, payload.officer_id)
    if not officer or not officer.is_active:
        raise HTTPException(status_code=422, detail="Officer not found")
    if officer.bureau_code != payload.to_bureau_code:
        raise HTTPException(
            status_code=422, detail="Receiving officer must belong to the target bureau"
        )
    if not payload.reason.strip():
        raise HTTPException(status_code=422, detail="A reason is required")

    now = datetime.now(timezone.utc)
    from_bureau = complaint.bureau_code
    from_officer = complaint.assigned_officer_id
    db.add(
        AssignmentHistory(
            id=uuid.uuid4().hex,
            complaint_id=complaint.id,
            from_bureau_code=from_bureau,
            from_officer_id=from_officer,
            to_bureau_code=payload.to_bureau_code,
            to_officer_id=officer.id,
            transfer_reason=payload.reason.strip(),
            transferred_by=user.id,
            transferred_at=now,
        )
    )
    _record_action(
        db,
        complaint,
        user,
        "transfer",
        f"Case transferred from {from_bureau} to {payload.to_bureau_code}",
        {"from_bureau_code": from_bureau, "to_bureau_code": payload.to_bureau_code},
    )
    complaint.bureau_code = payload.to_bureau_code
    complaint.assigned_officer_id = officer.id
    complaint.last_action_date = now.date()
    record_audit(
        db,
        actor_id=user.id,
        actor_name=user.name,
        action="transfer",
        entity_type="complaint",
        entity_id=complaint.case_id,
        detail=f"{from_bureau} -> {payload.to_bureau_code}",
    )
    db.commit()
    detect_overlaps(db)
    return {"success": True, "bureau_code": complaint.bureau_code}
