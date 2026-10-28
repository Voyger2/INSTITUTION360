from datetime import date

from app.models.complaint import ACTIVE_STATUSES


def is_overdue(status: str, expected_disposal_date: date, today: date) -> bool:
    return status in ACTIVE_STATUSES and expected_disposal_date < today


def days_overdue(expected_disposal_date: date, today: date) -> int:
    delta = (today - expected_disposal_date).days
    return max(0, delta)


def is_due_soon(status: str, expected_disposal_date: date, today: date, warning_days: int) -> bool:
    if status not in ACTIVE_STATUSES or expected_disposal_date < today:
        return False
    return (expected_disposal_date - today).days <= warning_days
