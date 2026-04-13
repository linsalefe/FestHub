from datetime import date, datetime

from pydantic import BaseModel


class ChecklistItemCreate(BaseModel):
    title: str
    due_date: date | None = None
    position: int = 0


class ChecklistItemUpdate(BaseModel):
    title: str | None = None
    is_done: bool | None = None
    due_date: date | None = None
    position: int | None = None


class ChecklistItemResponse(BaseModel):
    id: int
    budget_id: int
    title: str
    is_done: bool
    due_date: date | None = None
    position: int
    created_at: datetime

    model_config = {"from_attributes": True}
