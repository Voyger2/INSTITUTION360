from datetime import date

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.bureau import Bureau
from app.models.complaint import ACTIVE_STATUSES, FINAL_STATUSES, Complaint
from app.models.institution import Institution
from app.models.overlap import OverlapAlert

OPEN_ALERT_STATUSES = ("new", "coordination_required")


def _active_case(case: Complaint) -> bool:
    return case.status in ACTIVE_STATUSES


def bureau_workload(db: Session) -> list[dict]:
    results: list[dict] = []
    bureaus = db.scalars(select(Bureau).order_by(Bureau.code)).all()
    for bureau in bureaus:
        cases = db.scalars(
            select(Complaint).where(Complaint.bureau_code == bureau.code)
        ).all()
        active = [c for c in cases if _active_case(c)]
        overdue = [c for c in cases if c.is_overdue]
        disposed = [c for c in cases if c.status in FINAL_STATUSES]
        avg_days = 0.0
        if disposed:
            total_days = sum(
                (c.last_action_date - c.received_date).days for c in disposed
            )
            avg_days = round(total_days / len(disposed), 1)
        results.append(
            {
                "bureau_code": bureau.code,
                "bureau_name": bureau.name,
                "total_cases": len(cases),
                "active_cases": len(active),
                "overdue_cases": len(overdue),
                "avg_disposal_days": avg_days,
            }
        )
    return results


def region_distribution(db: Session) -> list[dict]:
    region_codes = db.scalars(
        select(Institution.region_code).distinct().order_by(Institution.region_code)
    ).all()
    results: list[dict] = []
    for code in region_codes:
        institution_ids = db.scalars(
            select(Institution.id).where(Institution.region_code == code)
        ).all()
        cases = (
            db.scalars(select(Complaint).where(Complaint.institution_id.in_(institution_ids))).all()
            if institution_ids
            else []
        )
        results.append(
            {
                "region_code": code,
                "total_cases": len(cases),
                "active_cases": sum(1 for c in cases if _active_case(c)),
                "overdue_cases": sum(1 for c in cases if c.is_overdue),
            }
        )
    return results


def status_distribution(db: Session) -> list[dict]:
    rows = db.execute(
        select(Complaint.status, func.count(Complaint.id)).group_by(Complaint.status)
    ).all()
    total = sum(count for _, count in rows) or 1
    return [
        {"status": status, "count": count, "percentage": round(count * 100.0 / total, 1)}
        for status, count in rows
    ]


def pending_ageing(db: Session, today: date | None = None) -> list[dict]:
    today = today or date.today()
    buckets = [
        ("0-7 days", 0, 7),
        ("8-14 days", 8, 14),
        ("15-30 days", 15, 30),
        ("30+ days", 31, None),
    ]
    active_cases = [c for c in db.scalars(select(Complaint)).all() if _active_case(c)]
    results = []
    for label, low, high in buckets:
        count = sum(
            1
            for case in active_cases
            if (today - case.received_date).days >= low
            and (high is None or (today - case.received_date).days <= high)
        )
        results.append({"bucket": label, "count": count})
    return results


def dashboard_metrics(db: Session) -> dict:
    cases = db.scalars(select(Complaint)).all()
    open_alerts = db.scalars(
        select(OverlapAlert).where(OverlapAlert.alert_status.in_(OPEN_ALERT_STATUSES))
    ).all()
    return {
        "total_cases": len(cases),
        "pending_cases": sum(1 for c in cases if c.status == "Received"),
        "under_process_cases": sum(1 for c in cases if c.status == "Under Process"),
        "disposed_cases": sum(1 for c in cases if c.status in FINAL_STATUSES),
        "transferred_cases": sum(1 for c in cases if c.status == "Transferred"),
        "overdue_cases": sum(1 for c in cases if c.is_overdue),
        "overlap_alerts": len(open_alerts),
    }
