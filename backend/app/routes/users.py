from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user, hash_password, verify_password
from app.models.user import User
from app.schemas.user import UserCreate, UserUpdate, UserChangePassword, UserResponse

router = APIRouter(prefix="/api/users", tags=["users"])


@router.get("", response_model=list[UserResponse])
def list_users(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    return db.query(User).filter(User.tenant_id == user.tenant_id).order_by(User.name).all()


@router.post("", response_model=UserResponse)
def create_user(data: UserCreate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    existing = db.query(User).filter(User.email == data.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email já cadastrado")
    new_user = User(
        tenant_id=user.tenant_id,
        name=data.name,
        email=data.email,
        password_hash=hash_password(data.password),
        role=data.role,
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user


@router.put("/{user_id}", response_model=UserResponse)
def update_user(user_id: int, data: UserUpdate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    target = db.query(User).filter(User.id == user_id, User.tenant_id == user.tenant_id).first()
    if not target:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(target, key, value)
    db.commit()
    db.refresh(target)
    return target


@router.delete("/{user_id}", response_model=UserResponse)
def deactivate_user(user_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    target = db.query(User).filter(User.id == user_id, User.tenant_id == user.tenant_id).first()
    if not target:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")
    target.is_active = not target.is_active
    db.commit()
    db.refresh(target)
    return target


@router.patch("/{user_id}/password")
def change_password(user_id: int, data: UserChangePassword, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    target = db.query(User).filter(User.id == user_id, User.tenant_id == user.tenant_id).first()
    if not target:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")
    if not verify_password(data.current_password, target.password_hash):
        raise HTTPException(status_code=400, detail="Senha atual incorreta")
    target.password_hash = hash_password(data.new_password)
    db.commit()
    return {"message": "Senha alterada com sucesso"}
