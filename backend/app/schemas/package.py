from pydantic import BaseModel


class PackageItemCreate(BaseModel):
    catalog_item_id: int
    quantity: int = 1


class PackageItemResponse(BaseModel):
    id: int
    catalog_item_id: int
    quantity: int
    catalog_item: dict | None = None

    model_config = {"from_attributes": True}


class PackageCreate(BaseModel):
    name: str
    description: str | None = None
    items: list[PackageItemCreate] | None = None


class PackageUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    is_active: bool | None = None
    items: list[PackageItemCreate] | None = None


class PackageResponse(BaseModel):
    id: int
    name: str
    description: str | None = None
    is_active: bool
    items: list[PackageItemResponse] = []
    total_cost: float = 0
    total_price: float = 0

    model_config = {"from_attributes": True}


class ApplyPackageRequest(BaseModel):
    package_id: int
    budget_id: int
