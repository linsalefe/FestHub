from datetime import date, datetime

from pydantic import BaseModel


class BudgetItemCreate(BaseModel):
    catalog_item_id: int | None = None
    name: str
    cost: float = 0
    price: float = 0
    quantity: int = 1


class BudgetItemResponse(BaseModel):
    id: int
    budget_id: int
    catalog_item_id: int | None = None
    name: str
    cost: float
    price: float
    quantity: int

    model_config = {"from_attributes": True}


class VariableCostCreate(BaseModel):
    name: str
    value: float = 0


class VariableCostResponse(BaseModel):
    id: int
    budget_id: int
    name: str
    value: float

    model_config = {"from_attributes": True}


class BudgetCreate(BaseModel):
    client_id: int | None = None
    theme_id: int | None = None
    status: str = "draft"
    event_date: date | None = None
    event_address: str | None = None
    discount: float = 0
    payment_condition: str = "50% entrada + 50% no evento"
    validity_days: int = 7
    notes: str | None = None
    items: list[BudgetItemCreate] | None = None
    variable_costs: list[VariableCostCreate] | None = None


class BudgetUpdate(BaseModel):
    client_id: int | None = None
    theme_id: int | None = None
    event_date: date | None = None
    event_address: str | None = None
    discount: float | None = None
    payment_condition: str | None = None
    validity_days: int | None = None
    notes: str | None = None


class BudgetResponse(BaseModel):
    id: int
    tenant_id: int
    client_id: int | None = None
    theme_id: int | None = None
    status: str
    event_date: date | None = None
    event_address: str | None = None
    discount: float
    payment_condition: str
    validity_days: int
    notes: str | None = None
    total_cached: float
    created_at: datetime
    updated_at: datetime
    client: dict | None = None
    theme: dict | None = None
    items: list[BudgetItemResponse] = []
    variable_costs: list[VariableCostResponse] = []

    model_config = {"from_attributes": True}
