from sqlalchemy import Boolean, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class Institution(Base):
    __tablename__ = "institutions"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    # Canonical identifier for institution matching (cross-bureau overlap key).
    aicte_permanent_id: Mapped[str] = mapped_column(
        String(32), unique=True, index=True
    )
    name: Mapped[str] = mapped_column(String(300), index=True)
    region_code: Mapped[str] = mapped_column(String(8), index=True)
    state: Mapped[str] = mapped_column(String(100))
    district: Mapped[str] = mapped_column(String(100))
    type: Mapped[str] = mapped_column(String(64))
    established_year: Mapped[int] = mapped_column(Integer)
    address: Mapped[str] = mapped_column(String(500), default="")
    website: Mapped[str | None] = mapped_column(String(300), nullable=True)
    contact_email: Mapped[str | None] = mapped_column(String(320), nullable=True)
    contact_phone: Mapped[str | None] = mapped_column(String(32), nullable=True)
    is_demo_data: Mapped[bool] = mapped_column(Boolean, default=True)

    complaints: Mapped[list["Complaint"]] = relationship(  # noqa: F821
        back_populates="institution"
    )
