from sqlalchemy import ForeignKey, Integer, Numeric, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class TenantSettings(Base):
    __tablename__ = "tenant_settings"

    tenant_id: Mapped[int] = mapped_column(ForeignKey("tenants.id"), primary_key=True)
    tax_rate: Mapped[float] = mapped_column(Numeric(5, 2), default=6)
    profit_margin: Mapped[float] = mapped_column(Numeric(5, 2), default=40)
    events_per_month: Mapped[int] = mapped_column(Integer, default=8)
    company_name: Mapped[str | None] = mapped_column(String(200), nullable=True)
    company_logo: Mapped[str | None] = mapped_column(String(500), nullable=True)
    company_phone: Mapped[str | None] = mapped_column(String(50), nullable=True)
    company_instagram: Mapped[str | None] = mapped_column(String(200), nullable=True)
    pdf_accent_color: Mapped[str] = mapped_column(String(20), default="#B45309")

    tenant = relationship("Tenant", back_populates="settings")
