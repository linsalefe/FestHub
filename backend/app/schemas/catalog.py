from datetime import datetime

from pydantic import BaseModel


class CatalogItemCreate(BaseModel):
    name: str
    category: str = "Decoração"
    cost: float = 0
    price: float = 0
    photo_url: str | None = None
    is_active: bool = True


class CatalogItemUpdate(BaseModel):
    name: str | None = None
    category: str | None = None
    cost: float | None = None
    price: float | None = None
    photo_url: str | None = None
    is_active: bool | None = None


class CatalogItemResponse(BaseModel):
    id: int
    tenant_id: int
    name: str
    category: str
    cost: float
    price: float
    photo_url: str | None = None
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}
