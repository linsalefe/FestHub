from datetime import datetime, timezone

from sqlalchemy import ARRAY, DateTime, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class Theme(Base):
    __tablename__ = "themes"

    id: Mapped[int] = mapped_column(primary_key=True)
    tenant_id: Mapped[int] = mapped_column(ForeignKey("tenants.id"), index=True)
    name: Mapped[str] = mapped_column(String(200))
    color: Mapped[str] = mapped_column(String(20), default="#B45309")
    emoji: Mapped[str] = mapped_column(String(10), default="🎉")
    suggested_items: Mapped[list[int] | None] = mapped_column(ARRAY(Integer), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
