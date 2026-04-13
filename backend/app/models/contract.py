from datetime import datetime, timezone

from sqlalchemy import Column, Date, DateTime, ForeignKey, Integer, Numeric, String, Text, Time
from sqlalchemy.orm import relationship

from app.core.database import Base


class Contract(Base):
    __tablename__ = "contracts"

    id = Column(Integer, primary_key=True, autoincrement=True)
    tenant_id = Column(Integer, ForeignKey("tenants.id"), nullable=False, index=True)
    budget_id = Column(Integer, ForeignKey("budgets.id"), nullable=False, index=True)
    client_id = Column(Integer, ForeignKey("clients.id"), nullable=False)
    contract_number = Column(String(20), nullable=False)
    status = Column(String(20), nullable=False, default="draft")
    event_date = Column(Date, nullable=False)
    event_time = Column(Time, nullable=True)
    event_address = Column(Text, nullable=True)
    event_duration = Column(String(50), nullable=True)
    montage_time = Column(Time, nullable=True)
    demontage_time = Column(Time, nullable=True)
    total_value = Column(Numeric(10, 2), nullable=False)
    down_payment = Column(Numeric(10, 2), default=0)
    down_payment_date = Column(Date, nullable=True)
    remaining_value = Column(Numeric(10, 2), default=0)
    remaining_payment_date = Column(Date, nullable=True)
    payment_method = Column(String(50), nullable=True)
    cancellation_policy = Column(Text, default="Em caso de cancelamento com menos de 7 dias do evento, sera cobrada multa de 30% do valor total.")
    additional_clauses = Column(Text, nullable=True)
    client_document = Column(String(20), nullable=True)
    client_address = Column(Text, nullable=True)
    signed_at = Column(Date, nullable=True)
    pdf_generated_at = Column(DateTime(timezone=True), nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    budget = relationship("Budget", backref="contracts", lazy="select")
    client = relationship("Client", backref="contracts", lazy="select")
