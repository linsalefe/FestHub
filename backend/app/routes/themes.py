from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.theme import Theme
from app.models.user import User

router = APIRouter(prefix="/api/themes", tags=["themes"])


class ThemeCreate(BaseModel):
    name: str
    color: str = "#4A5BA8"
    emoji: str = "🎉"
    suggested_items: list[int] | None = None


class ThemeUpdate(BaseModel):
    name: str | None = None
    color: str | None = None
    emoji: str | None = None
    suggested_items: list[int] | None = None


class ThemeResponse(BaseModel):
    id: int
    tenant_id: int
    name: str
    color: str
    emoji: str
    suggested_items: list[int] | None = None

    model_config = {"from_attributes": True}


@router.get("", response_model=list[ThemeResponse])
def list_themes(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    return db.query(Theme).filter(Theme.tenant_id == user.tenant_id).order_by(Theme.name).all()


@router.post("", response_model=ThemeResponse)
def create_theme(data: ThemeCreate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    theme = Theme(tenant_id=user.tenant_id, **data.model_dump())
    db.add(theme)
    db.commit()
    db.refresh(theme)
    return theme


@router.put("/{theme_id}", response_model=ThemeResponse)
def update_theme(theme_id: int, data: ThemeUpdate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    theme = db.query(Theme).filter(Theme.id == theme_id, Theme.tenant_id == user.tenant_id).first()
    if not theme:
        raise HTTPException(status_code=404, detail="Tema não encontrado")
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(theme, key, value)
    db.commit()
    db.refresh(theme)
    return theme


@router.delete("/{theme_id}", status_code=204)
def delete_theme(theme_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    theme = db.query(Theme).filter(Theme.id == theme_id, Theme.tenant_id == user.tenant_id).first()
    if not theme:
        raise HTTPException(status_code=404, detail="Tema não encontrado")
    db.delete(theme)
    db.commit()
