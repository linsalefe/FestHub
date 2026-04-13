from datetime import date, datetime

from pydantic import BaseModel


class LeadCreate(BaseModel):
    name: str
    phone: str | None = None
    email: str | None = None
    event_date: date | None = None
    event_type: str | None = None
    theme_id: int | None = None
    estimated_value: float = 0
    notes: str | None = None
    pipeline_id: int
    stage_id: int
    client_id: int | None = None


class LeadUpdate(BaseModel):
    name: str | None = None
    phone: str | None = None
    email: str | None = None
    event_date: date | None = None
    event_type: str | None = None
    theme_id: int | None = None
    estimated_value: float | None = None
    notes: str | None = None
    stage_id: int | None = None
    client_id: int | None = None
    position: int | None = None


class LeadMoveRequest(BaseModel):
    stage_id: int
    position: int = 0


class LeadResponse(BaseModel):
    id: int
    name: str
    phone: str | None = None
    email: str | None = None
    event_date: date | None = None
    event_type: str | None = None
    estimated_value: float
    notes: str | None = None
    stage_id: int
    pipeline_id: int
    client_id: int | None = None
    client: dict | None = None
    theme: dict | None = None
    position: int
    created_at: datetime

    model_config = {"from_attributes": True}
