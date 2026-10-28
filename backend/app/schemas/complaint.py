from datetime import date, datetime

from pydantic import BaseModel, ConfigDict

from app.models.complaint import CATEGORIES, COMPLAINT_STATUSES

ComplaintStatus = str


class InstitutionOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    aicte_permanent_id: str
    name: str
    region_code: str
    state: str
    district: str
    type: str
    established_year: int
    address: str
    website: str | None
    contact_email: str | None
    contact_phone: str | None
    is_demo_data: bool


class ComplaintOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    case_id: str
    institution_id: str
    category: str
    bureau_code: str
    assigned_officer_id: str | None
    status: str
    received_date: date
    expected_disposal_date: date
    last_action_date: date
    description: str
    is_demo_data: bool
    institution_name: str
    institution_aicte_id: str
    assigned_officer_name: str | None
    is_active: bool
    is_overdue: bool
    days_overdue: int
    days_to_deadline: int


class StatusChangeRequest(BaseModel):
    to_status: str
    reason: str


class AssignmentRequest(BaseModel):
    officer_id: str
    reason: str


class TransferRequest(BaseModel):
    to_bureau_code: str
    officer_id: str
    reason: str


class ComplaintList(BaseModel):
    items: list[ComplaintOut]
    total: int
    page: int
    page_size: int


class HistoryEntry(BaseModel):
    id: str
    at: datetime
    entry_type: str
    description: str
    actor: str
    detail: dict | None = None


class ComplaintHistory(BaseModel):
    complaint_id: str
    status_history: list[HistoryEntry]
    assignment_history: list[HistoryEntry]
    action_history: list[HistoryEntry]
