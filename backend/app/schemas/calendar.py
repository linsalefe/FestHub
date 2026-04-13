from datetime import date, datetime, time

from pydantic import BaseModel


class CalendarEventCreate(BaseModel):
    budget_id: int | None = None
    client_id: int | None = None
    title: str
    event_date: date
    event_time: time | None = None
    event_address: str | None = None
    status: str = "confirmed"
    notes: str | None = None


class CalendarEventUpdate(BaseModel):
    title: str | None = None
    event_date: date | None = None
    event_time: time | None = None
    event_address: str | None = None
    status: str | None = None
    notes: str | None = None
    client_id: int | None = None
    budget_id: int | None = None


class CalendarEventResponse(BaseModel):
    id: int
    budget_id: int | None = None
    client_id: int | None = None
    title: str
    event_date: date
    event_time: time | None = None
    event_address: str | None = None
    status: str
    notes: str | None = None
    created_at: datetime
    client: dict | None = None

    model_config = {"from_attributes": True}
