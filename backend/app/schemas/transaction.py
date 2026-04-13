from datetime import date, datetime
from pydantic import BaseModel


class TransactionCreate(BaseModel):
    type: str
    category: str
    description: str
    amount: float
    payment_method: str | None = None
    reference_date: date
    due_date: date | None = None
    paid_at: date | None = None
    status: str = "paid"
    budget_id: int | None = None
    client_id: int | None = None
    installment_number: int | None = None
    total_installments: int | None = None
    notes: str | None = None


class TransactionUpdate(BaseModel):
    type: str | None = None
    category: str | None = None
    description: str | None = None
    amount: float | None = None
    payment_method: str | None = None
    reference_date: date | None = None
    due_date: date | None = None
    paid_at: date | None = None
    status: str | None = None
    budget_id: int | None = None
    client_id: int | None = None
    installment_number: int | None = None
    total_installments: int | None = None
    notes: str | None = None


class TransactionResponse(BaseModel):
    id: int
    tenant_id: int
    budget_id: int | None = None
    client_id: int | None = None
    type: str
    category: str
    description: str
    amount: float
    payment_method: str | None = None
    reference_date: date
    due_date: date | None = None
    paid_at: date | None = None
    status: str
    installment_number: int | None = None
    total_installments: int | None = None
    notes: str | None = None
    created_at: datetime
    client_name: str | None = None
    budget_info: str | None = None

    model_config = {"from_attributes": True}


class TransactionSummary(BaseModel):
    total_income: float
    total_expense: float
    balance: float
    pending_income: float
    pending_expense: float
    overdue_count: int


class MonthlySummary(BaseModel):
    month: int
    year: int
    income: float
    expense: float
    balance: float


class TransactionFilter(BaseModel):
    type: str | None = None
    category: str | None = None
    status: str | None = None
    date_from: date | None = None
    date_to: date | None = None
    client_id: int | None = None
    budget_id: int | None = None
