from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import (
    create_access_token,
    create_refresh_token,
    decode_token,
    get_current_user,
    verify_password,
)
from app.models.user import User
from app.schemas.auth import LoginRequest, RefreshRequest, TokenResponse

router = APIRouter(prefix="/api/auth", tags=["auth"])


def _user_dict(user: User) -> dict:
    return {
        "id": user.id,
        "name": user.name,
        "email": user.email,
        "role": user.role,
        "tenant_id": user.tenant_id,
    }


@router.post("/login", response_model=TokenResponse)
def login(data: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == data.email, User.is_active.is_(True)).first()
    if not user or not verify_password(data.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Email ou senha inválidos")
    token_data = {"sub": str(user.id), "tenant_id": user.tenant_id}
    return TokenResponse(
        access_token=create_access_token(token_data),
        refresh_token=create_refresh_token(token_data),
        user=_user_dict(user),
    )


@router.post("/refresh", response_model=TokenResponse)
def refresh(data: RefreshRequest, db: Session = Depends(get_db)):
    payload = decode_token(data.refresh_token)
    if payload.get("type") != "refresh":
        raise HTTPException(status_code=401, detail="Token inválido")
    user = db.query(User).filter(User.id == int(payload["sub"])).first()
    if not user:
        raise HTTPException(status_code=401, detail="Usuário não encontrado")
    token_data = {"sub": str(user.id), "tenant_id": user.tenant_id}
    return TokenResponse(
        access_token=create_access_token(token_data),
        refresh_token=create_refresh_token(token_data),
        user=_user_dict(user),
    )


@router.get("/me")
def me(current_user: User = Depends(get_current_user)):
    return _user_dict(current_user)
