from datetime import datetime, timezone

from sqlalchemy import Column, Date, DateTime, ForeignKey, Integer, Numeric, String, Text
from sqlalchemy.orm import relationship

from app.core.database import Base


class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(Integer, primary_key=True, autoincrement=True)
    tenant_id = Column(Integer, ForeignKey("tenants.id"), nullable=False, index=True)
    budget_id = Column(Integer, ForeignKey("budgets.id"), nullable=True)
    client_id = Column(Integer, ForeignKey("clients.id"), nullable=True)
    type = Column(String(20), nullable=False)  # income / expense
    category = Column(String(100), nullable=False)
    description = Column(String(300), nullable=False)
    amount = Column(Numeric(10, 2), nullable=False)
    payment_method = Column(String(50), nullable=True)
    reference_date = Column(Date, nullable=False)
    due_date = Column(Date, nullable=True)
    paid_at = Column(Date, nullable=True)
    status = Column(String(20), nullable=False, default="paid")
    installment_number = Column(Integer, nullable=True)
    total_installments = Column(Integer, nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    budget = relationship("Budget", backref="transactions", lazy="select")
    client = relationship("Client", backref="transactions", lazy="select")
