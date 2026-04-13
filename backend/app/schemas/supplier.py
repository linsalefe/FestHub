from datetime import datetime

from pydantic import BaseModel


class SupplierCreate(BaseModel):
    name: str
    phone: str | None = None
    email: str | None = None
    category: str | None = None
    notes: str | None = None


class SupplierUpdate(BaseModel):
    name: str | None = None
    phone: str | None = None
    email: str | None = None
    category: str | None = None
    notes: str | None = None


class SupplierResponse(BaseModel):
    id: int
    name: str
    phone: str | None = None
    email: str | None = None
    category: str | None = None
    notes: str | None = None
    created_at: datetime

    model_config = {"from_attributes": True}
