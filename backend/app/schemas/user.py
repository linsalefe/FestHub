from datetime import datetime

from pydantic import BaseModel


class UserCreate(BaseModel):
    name: str
    email: str
    password: str
    role: str = "user"


class UserUpdate(BaseModel):
    name: str | None = None
    email: str | None = None
    role: str | None = None


class UserChangePassword(BaseModel):
    current_password: str
    new_password: str


class UserResponse(BaseModel):
    id: int
    name: str
    email: str
    role: str
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}
