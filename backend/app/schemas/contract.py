from datetime import date, datetime, time
from pydantic import BaseModel


class ContractCreate(BaseModel):
    budget_id: int
    client_id: int
    event_date: date
    event_time: time | None = None
    event_address: str | None = None
    event_duration: str | None = None
    montage_time: time | None = None
    demontage_time: time | None = None
    total_value: float
    down_payment: float = 0
    down_payment_date: date | None = None
    remaining_value: float = 0
    remaining_payment_date: date | None = None
    payment_method: str | None = None
    cancellation_policy: str | None = None
    additional_clauses: str | None = None
    client_document: str | None = None
    client_address: str | None = None
    notes: str | None = None


class ContractUpdate(BaseModel):
    status: str | None = None
    event_date: date | None = None
    event_time: time | None = None
    event_address: str | None = None
    event_duration: str | None = None
    montage_time: time | None = None
    demontage_time: time | None = None
    total_value: float | None = None
    down_payment: float | None = None
    down_payment_date: date | None = None
    remaining_value: float | None = None
    remaining_payment_date: date | None = None
    payment_method: str | None = None
    cancellation_policy: str | None = None
    additional_clauses: str | None = None
    client_document: str | None = None
    client_address: str | None = None
    signed_at: date | None = None
    notes: str | None = None


class ContractResponse(BaseModel):
    id: int
    tenant_id: int
    budget_id: int
    client_id: int
    contract_number: str
    status: str
    event_date: date
    event_time: time | None = None
    event_address: str | None = None
    event_duration: str | None = None
    montage_time: time | None = None
    demontage_time: time | None = None
    total_value: float
    down_payment: float
    down_payment_date: date | None = None
    remaining_value: float
    remaining_payment_date: date | None = None
    payment_method: str | None = None
    cancellation_policy: str | None = None
    additional_clauses: str | None = None
    client_document: str | None = None
    client_address: str | None = None
    signed_at: date | None = None
    pdf_generated_at: datetime | None = None
    notes: str | None = None
    created_at: datetime
    updated_at: datetime
    client: dict | None = None
    budget_summary: dict | None = None

    model_config = {"from_attributes": True}
