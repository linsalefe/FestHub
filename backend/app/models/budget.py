from datetime import date, datetime, timezone

from sqlalchemy import Date, DateTime, ForeignKey, Integer, Numeric, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class Budget(Base):
    __tablename__ = "budgets"

    id: Mapped[int] = mapped_column(primary_key=True)
    tenant_id: Mapped[int] = mapped_column(ForeignKey("tenants.id"), index=True)
    client_id: Mapped[int | None] = mapped_column(ForeignKey("clients.id"), nullable=True)
    theme_id: Mapped[int | None] = mapped_column(ForeignKey("themes.id"), nullable=True)
    status: Mapped[str] = mapped_column(String(20), default="draft")
    event_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    event_address: Mapped[str | None] = mapped_column(Text, nullable=True)
    discount: Mapped[float] = mapped_column(Numeric(10, 2), default=0)
    payment_condition: Mapped[str] = mapped_column(String(200), default="50% entrada + 50% no evento")
    validity_days: Mapped[int] = mapped_column(Integer, default=7)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    scenario_label: Mapped[str | None] = mapped_column(String(50), nullable=True)
    parent_budget_id: Mapped[int | None] = mapped_column(ForeignKey("budgets.id"), nullable=True)
    pdf_generated_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    total_cached: Mapped[float] = mapped_column(Numeric(10, 2), default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=func.now(),
    )

    client = relationship("Client", back_populates="budgets")
    theme = relationship("Theme")
    items = relationship("BudgetItem", back_populates="budget", cascade="all, delete-orphan")
    variable_costs = relationship("BudgetVariableCost", back_populates="budget", cascade="all, delete-orphan")


class BudgetItem(Base):
    __tablename__ = "budget_items"

    id: Mapped[int] = mapped_column(primary_key=True)
    budget_id: Mapped[int] = mapped_column(ForeignKey("budgets.id", ondelete="CASCADE"))
    catalog_item_id: Mapped[int | None] = mapped_column(ForeignKey("catalog_items.id"), nullable=True)
    name: Mapped[str] = mapped_column(String(200))
    cost: Mapped[float] = mapped_column(Numeric(10, 2), default=0)
    price: Mapped[float] = mapped_column(Numeric(10, 2), default=0)
    quantity: Mapped[int] = mapped_column(Integer, default=1)

    budget = relationship("Budget", back_populates="items")


class BudgetVariableCost(Base):
    __tablename__ = "budget_variable_costs"

    id: Mapped[int] = mapped_column(primary_key=True)
    budget_id: Mapped[int] = mapped_column(ForeignKey("budgets.id", ondelete="CASCADE"))
    name: Mapped[str] = mapped_column(String(200))
    value: Mapped[float] = mapped_column(Numeric(10, 2), default=0)

    budget = relationship("Budget", back_populates="variable_costs")
