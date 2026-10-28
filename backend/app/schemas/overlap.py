from datetime import datetime

from pydantic import BaseModel, ConfigDict


class OverlapAlertOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    institution_id: str
    institution_name: str
    institution_aicte_id: str
    case_ids: list[str]
    bureau_codes: list[str]
    bureau_names: list[str]
    alert_status: str
    detected_at: datetime
    reviewed_by: str | None
    reviewed_at: datetime | None
    review_decision: str | None
    review_reason: str | None
    is_demo_data: bool = True


class OverlapReviewRequest(BaseModel):
    decision: str
    reason: str
