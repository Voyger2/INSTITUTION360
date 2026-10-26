from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class Bureau(Base):
    __tablename__ = "bureaus"

    code: Mapped[str] = mapped_column(String(16), primary_key=True)
    name: Mapped[str] = mapped_column(String(200))
    region_code: Mapped[str] = mapped_column(String(8), index=True)
    description: Mapped[str] = mapped_column(String(500), default="")
