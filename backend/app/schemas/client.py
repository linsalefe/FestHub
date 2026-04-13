from datetime import datetime

from pydantic import BaseModel


class ClientCreate(BaseModel):
    name: str
    phone: str | None = None
    email: str | None = None
    city: str | None = None
    address: str | None = None
    notes: str | None = None


class ClientUpdate(BaseModel):
    name: str | None = None
    phone: str | None = None
    email: str | None = None
    city: str | None = None
    address: str | None = None
    notes: str | None = None


class ClientResponse(BaseModel):
    id: int
    tenant_id: int
    name: str
    phone: str | None = None
    email: str | None = None
    city: str | None = None
    address: str | None = None
    notes: str | None = None
    created_at: datetime

    model_config = {"from_attributes": True}
