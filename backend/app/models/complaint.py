from datetime import date, datetime

from sqlalchemy import Boolean, DateTime, Date, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base

# Status lifecycle (must mirror the frontend contract in src/types/index.ts).
COMPLAINT_STATUSES = (
    "Received",
    "Under Process",
    "Action Initiated",
    "Pending Clarification",
    "Referred to Bureau",
    "Disposed",
    "Transferred",
    "Rejected",
    "Closed",
)

ACTIVE_STATUSES = frozenset(
    {
        "Received",
        "Under Process",
        "Action Initiated",
        "Pending Clarification",
        "Referred to Bureau",
    }
)

FINAL_STATUSES = frozenset({"Disposed", "Rejected", "Closed"})

CATEGORIES = (
    "Approval Process Violation",
    "Infrastructure Deficiency",
    "Faculty Shortage",
    "Admission Irregularity",
    "Fee Structure Violation",
    "Academic Quality",
    "Grievance Redressal",
    "Document Verification",
    "Compliance Failure",
    "Other",
)

VALID_TRANSITIONS: dict[str, tuple[str, ...]] = {
    "Received": ("Under Process", "Referred to Bureau", "Rejected"),
    "Under Process": (
        "Action Initiated",
        "Pending Clarification",
        "Referred to Bureau",
        "Rejected",
        "Disposed",
    ),
    "Action Initiated": (
        "Pending Clarification",
        "Referred to Bureau",
        "Disposed",
        "Transferred",
    ),
    "Pending Clarification": ("Under Process", "Rejected", "Disposed"),
    "Referred to Bureau": ("Under Process", "Action Initiated", "Rejected"),
    "Transferred": ("Under Process", "Disposed", "Rejected"),
    "Disposed": (),
    "Rejected": (),
    "Closed": (),
}


class Complaint(Base):
    __tablename__ = "complaints"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    case_id: Mapped[str] = mapped_column(String(32), unique=True, index=True)
    institution_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("institutions.id"), index=True
    )
    category: Mapped[str] = mapped_column(String(64), index=True)
    bureau_code: Mapped[str] = mapped_column(String(16), ForeignKey("bureaus.code"), index=True)
    assigned_officer_id: Mapped[str | None] = mapped_column(
        String(36), ForeignKey("users.id"), nullable=True
    )
    status: Mapped[str] = mapped_column(String(32), index=True, default="Received")
    received_date: Mapped[date] = mapped_column(Date)
    expected_disposal_date: Mapped[date] = mapped_column(Date)
    last_action_date: Mapped[date] = mapped_column(Date)
    description: Mapped[str] = mapped_column(Text)
    is_demo_data: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))

    institution: Mapped["Institution"] = relationship(back_populates="complaints")  # noqa: F821
    assigned_officer: Mapped["User | None"] = relationship()  # noqa: F821

    @property
    def is_active(self) -> bool:
        return self.status in ACTIVE_STATUSES

    @property
    def is_overdue(self) -> bool:
        return self.is_active and self.expected_disposal_date < date.today()

    @property
    def days_overdue(self) -> int:
        if not self.is_overdue:
            return 0
        return (date.today() - self.expected_disposal_date).days

    @property
    def days_to_deadline(self) -> int:
        return (self.expected_disposal_date - date.today()).days
