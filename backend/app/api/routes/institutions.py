from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.complaint import Complaint
from app.models.institution import Institution
from app.models.overlap import OverlapAlert
from app.schemas.complaint import ComplaintOut
from app.schemas.institution import InstitutionOut

router = APIRouter(prefix="/institutions", tags=["institutions"], dependencies=[Depends(get_current_user)])


@router.get("")
def list_institutions(
    search: str | None = None,
    region_code: str | None = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
) -> dict:
    query = select(Institution)
    conditions = []
    if search:
        like = f"%{search}%"
        conditions.append(
            or_(Institution.name.ilike(like), Institution.aicte_permanent_id.ilike(like))
        )
    if region_code:
        conditions.append(Institution.region_code == region_code)
    if conditions:
        query = query.where(*conditions)

    total = db.scalar(select(func.count()).select_from(query.subquery())) or 0
    rows = db.scalars(
        query.order_by(Institution.name).offset((page - 1) * page_size).limit(page_size)
    ).all()
    return {
        "items": [InstitutionOut.model_validate(r) for r in rows],
        "total": total,
        "page": page,
        "page_size": page_size,
    }


@router.get("/{institution_id}")
def get_institution(institution_id: str, db: Session = Depends(get_db)) -> dict:
    institution = db.get(Institution, institution_id)
    if not institution:
        raise HTTPException(status_code=404, detail="Institution not found")

    complaints = db.scalars(
        select(Complaint)
        .where(Complaint.institution_id == institution.id)
        .order_by(Complaint.received_date.desc())
    ).all()
    alerts = db.scalars(
        select(OverlapAlert).where(OverlapAlert.institution_id == institution.id)
    ).all()
    return {
        "institution": InstitutionOut.model_validate(institution),
        "total_cases": len(complaints),
        "active_cases": sum(1 for c in complaints if c.is_active),
        "disposed_cases": sum(1 for c in complaints if c.status in ("Disposed", "Rejected", "Closed")),
        "overlap_alerts": len(alerts),
    }


@router.get("/{institution_id}/complaints")
def institution_complaints(
    institution_id: str, db: Session = Depends(get_db)
) -> list[ComplaintOut]:
    from app.api.routes.complaints import _complaint_out

    institution = db.get(Institution, institution_id)
    if not institution:
        raise HTTPException(status_code=404, detail="Institution not found")
    complaints = db.scalars(
        select(Complaint)
        .where(Complaint.institution_id == institution.id)
        .order_by(Complaint.received_date.desc())
    ).all()
    return [_complaint_out(db, c) for c in complaints]
