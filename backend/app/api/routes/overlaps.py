from datetime import datetime, timezone
import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, require_not_oversight
from app.db.session import get_db
from app.models.institution import Institution
from app.models.bureau import Bureau
from app.models.overlap import OverlapAlert, REVIEW_DECISIONS
from app.models.user import User
from app.schemas.overlap import OverlapAlertOut, OverlapReviewRequest
from app.services.audit import record_audit
from app.services.overlap import detect_overlaps

router = APIRouter(prefix="/overlaps", tags=["overlaps"], dependencies=[Depends(get_current_user)])


def _alert_out(db: Session, alert: OverlapAlert) -> OverlapAlertOut:
    institution = db.get(Institution, alert.institution_id)
    bureau_names = []
    for code in alert.bureau_codes:
        bureau = db.get(Bureau, code)
        bureau_names.append(bureau.name if bureau else code)
    return OverlapAlertOut(
        id=alert.id,
        institution_id=alert.institution_id,
        institution_name=institution.name if institution else "",
        institution_aicte_id=alert.institution_aicte_id,
        case_ids=alert.case_ids,
        bureau_codes=alert.bureau_codes,
        bureau_names=bureau_names,
        alert_status=alert.alert_status,
        detected_at=alert.detected_at,
        reviewed_by=alert.reviewed_by,
        reviewed_at=alert.reviewed_at,
        review_decision=alert.review_decision,
        review_reason=alert.review_reason,
        is_demo_data=True,
    )


@router.get("")
def list_overlaps(
    alert_status: str | None = None, db: Session = Depends(get_db)
) -> list[OverlapAlertOut]:
    query = select(OverlapAlert).order_by(OverlapAlert.detected_at.desc())
    if alert_status:
        query = query.where(OverlapAlert.alert_status == alert_status)
    alerts = db.scalars(query).all()
    return [_alert_out(db, alert) for alert in alerts]


@router.post("/detect")
def run_detection(
    db: Session = Depends(get_db), user: User = Depends(require_not_oversight)
) -> dict:
    alerts = detect_overlaps(db)
    return {"created": len(alerts)}


@router.post("/{alert_id}/review")
def review_alert(
    alert_id: str,
    payload: OverlapReviewRequest,
    db: Session = Depends(get_db),
    user: User = Depends(require_not_oversight),
) -> OverlapAlertOut:
    alert = db.get(OverlapAlert, alert_id)
    if not alert:
        raise HTTPException(status_code=404, detail="Overlap alert not found")
    if payload.decision not in REVIEW_DECISIONS:
        raise HTTPException(
            status_code=422,
            detail=f"Decision must be one of: {', '.join(REVIEW_DECISIONS)}",
        )
    if not payload.reason.strip():
        raise HTTPException(status_code=422, detail="A review reason is required")

    alert.alert_status = payload.decision
    alert.review_decision = payload.decision
    alert.review_reason = payload.reason.strip()
    alert.reviewed_by = user.id
    alert.reviewed_at = datetime.now(timezone.utc)

    record_audit(
        db,
        actor_id=user.id,
        actor_name=user.name,
        action="overlap_review",
        entity_type="overlap_alert",
        entity_id=alert.id,
        detail=f"{payload.decision}: {payload.reason.strip()}",
    )
    db.commit()
    db.refresh(alert)
    return _alert_out(db, alert)
