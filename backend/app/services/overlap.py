import uuid
from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.complaint import ACTIVE_STATUSES, Complaint
from app.models.institution import Institution
from app.models.overlap import OverlapAlert
from app.models.user import utcnow


def detect_overlaps(db: Session) -> list[OverlapAlert]:
    """Detect cross-bureau overlaps keyed on the canonical AICTE Permanent ID.

    An alert is created when >= 2 distinct bureaus hold ACTIVE complaints for
    the same institution. An open alert is created only once per case-set;
    alerts already covering the same cases are left untouched (their review
    state is preserved).
    """
    alerts: list[OverlapAlert] = []
    rows = db.execute(
        select(Complaint, Institution)
        .join(Institution, Complaint.institution_id == Institution.id)
        .where(Complaint.status.in_(tuple(ACTIVE_STATUSES)))
    ).all()

    grouped: dict[str, dict] = {}
    for complaint, institution in rows:
        key = institution.aicte_permanent_id
        entry = grouped.setdefault(
            key,
            {"institution": institution, "cases": [], "bureaus": set()},
        )
        entry["cases"].append(complaint)
        entry["bureaus"].add(complaint.bureau_code)

    for aicte_id, entry in grouped.items():
        if len(entry["bureaus"]) < 2:
            continue
        case_ids = sorted(c.case_id for c in entry["cases"])
        bureau_codes = sorted(entry["bureaus"])

        existing = db.scalars(
            select(OverlapAlert)
            .where(OverlapAlert.institution_aicte_id == aicte_id)
            .where(OverlapAlert.alert_status.in_(("new", "coordination_required")))
        ).all()
        if any(sorted(existing_alert.case_ids) == case_ids for existing_alert in existing):
            continue

        alert = OverlapAlert(
            id=uuid.uuid4().hex,
            institution_id=entry["institution"].id,
            institution_aicte_id=aicte_id,
            case_ids=case_ids,
            bureau_codes=bureau_codes,
            alert_status="new",
            detected_at=utcnow(),
        )
        db.add(alert)
        alerts.append(alert)

    if alerts:
        db.commit()
    return alerts
