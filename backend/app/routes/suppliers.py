from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.supplier import Supplier
from app.models.user import User
from app.schemas.supplier import SupplierCreate, SupplierUpdate, SupplierResponse

router = APIRouter(prefix="/api/suppliers", tags=["suppliers"])


@router.get("", response_model=list[SupplierResponse])
def list_suppliers(category: str | None = None, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    query = db.query(Supplier).filter(Supplier.tenant_id == user.tenant_id)
    if category:
        query = query.filter(Supplier.category == category)
    return query.order_by(Supplier.name).all()


@router.post("", response_model=SupplierResponse)
def create_supplier(data: SupplierCreate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    s = Supplier(tenant_id=user.tenant_id, **data.model_dump())
    db.add(s)
    db.commit()
    db.refresh(s)
    return s


@router.get("/{supplier_id}", response_model=SupplierResponse)
def get_supplier(supplier_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    s = db.query(Supplier).filter(Supplier.id == supplier_id, Supplier.tenant_id == user.tenant_id).first()
    if not s:
        raise HTTPException(status_code=404, detail="Fornecedor não encontrado")
    return s


@router.put("/{supplier_id}", response_model=SupplierResponse)
def update_supplier(supplier_id: int, data: SupplierUpdate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    s = db.query(Supplier).filter(Supplier.id == supplier_id, Supplier.tenant_id == user.tenant_id).first()
    if not s:
        raise HTTPException(status_code=404, detail="Fornecedor não encontrado")
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(s, key, value)
    db.commit()
    db.refresh(s)
    return s


@router.delete("/{supplier_id}", status_code=204)
def delete_supplier(supplier_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    s = db.query(Supplier).filter(Supplier.id == supplier_id, Supplier.tenant_id == user.tenant_id).first()
    if not s:
        raise HTTPException(status_code=404, detail="Fornecedor não encontrado")
    db.delete(s)
    db.commit()
