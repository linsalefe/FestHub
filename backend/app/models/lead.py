from datetime import date, datetime, timezone

from sqlalchemy import Date, DateTime, ForeignKey, Integer, Numeric, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class Lead(Base):
    __tablename__ = "leads"

    id: Mapped[int] = mapped_column(primary_key=True)
    tenant_id: Mapped[int] = mapped_column(ForeignKey("tenants.id"), index=True)
    pipeline_id: Mapped[int] = mapped_column(ForeignKey("pipelines.id"))
    stage_id: Mapped[int] = mapped_column(ForeignKey("pipeline_stages.id"))
    client_id: Mapped[int | None] = mapped_column(ForeignKey("clients.id"), nullable=True)
    name: Mapped[str] = mapped_column(String(200))
    phone: Mapped[str | None] = mapped_column(String(20), nullable=True)
    email: Mapped[str | None] = mapped_column(String(200), nullable=True)
    event_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    event_type: Mapped[str | None] = mapped_column(String(100), nullable=True)
    theme_id: Mapped[int | None] = mapped_column(ForeignKey("themes.id"), nullable=True)
    estimated_value: Mapped[float] = mapped_column(Numeric(10, 2), default=0)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    position: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=func.now(),
    )

    client = relationship("Client")
    pipeline = relationship("Pipeline")
    stage = relationship("PipelineStage", back_populates="leads")
    theme = relationship("Theme")
