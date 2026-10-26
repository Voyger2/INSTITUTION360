from datetime import date

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.config import get_settings
from app.db.session import get_db
from app.models.complaint import ACTIVE_STATUSES, Complaint
from app.models.overlap import OverlapAlert
from app.services.deadlines import days_overdue

router = APIRouter(prefix="/notifications", tags=["notifications"], dependencies=[Depends(get_current_user)])


@router.get("")
def notifications(db: Session = Depends(get_db)) -> dict:
    settings = get_settings()
    today = date.today()
    complaints = db.scalars(select(Complaint)).all()

    active = [c for c in complaints if c.status in tuple(ACTIVE_STATUSES)]
    overdue = [c for c in active if c.expected_disposal_date < today]
    due_soon = [
        c
        for c in active
        if c.expected_disposal_date >= today
        and (c.expected_disposal_date - today).days <= settings.warning_days
    ]
    new_alerts = db.scalars(
        select(OverlapAlert).where(OverlapAlert.alert_status == "new")
    ).all()

    def brief(complaint: Complaint) -> dict:
        return {
            "id": complaint.id,
            "case_id": complaint.case_id,
            "status": complaint.status,
            "bureau_code": complaint.bureau_code,
            "expected_disposal_date": complaint.expected_disposal_date.isoformat(),
            "days_overdue": (
                days_overdue(complaint.expected_disposal_date, today)
                if complaint.expected_disposal_date < today
                else 0
            ),
            "days_to_deadline": (complaint.expected_disposal_date - today).days,
        }

    return {
        "overdue": [brief(c) for c in overdue],
        "due_soon": [brief(c) for c in due_soon],
        "new_overlap_alerts": [
            {
                "id": alert.id,
                "institution_aicte_id": alert.institution_aicte_id,
                "case_ids": alert.case_ids,
                "bureau_codes": alert.bureau_codes,
            }
            for alert in new_alerts
        ],
        "counts": {
            "overdue": len(overdue),
            "due_soon": len(due_soon),
            "new_overlap_alerts": len(new_alerts),
        },
        "thresholds": {
            "warning_days": settings.warning_days,
            "overdue_days": settings.overdue_days,
        },
        "is_demo_data": True,
    }
