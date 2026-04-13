from datetime import datetime

from pydantic import BaseModel


class TenantSettingsUpdate(BaseModel):
    tax_rate: float | None = None
    profit_margin: float | None = None
    events_per_month: int | None = None
    company_name: str | None = None
    company_logo: str | None = None
    company_phone: str | None = None
    company_instagram: str | None = None
    pdf_accent_color: str | None = None


class TenantSettingsResponse(BaseModel):
    tenant_id: int
    tax_rate: float
    profit_margin: float
    events_per_month: int
    company_name: str | None = None
    company_logo: str | None = None
    company_phone: str | None = None
    company_instagram: str | None = None
    pdf_accent_color: str

    model_config = {"from_attributes": True}


class FixedCostCreate(BaseModel):
    name: str
    value: float = 0


class FixedCostResponse(BaseModel):
    id: int
    tenant_id: int
    name: str
    value: float
    created_at: datetime

    model_config = {"from_attributes": True}
