from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.catalog_item import CatalogItem
from app.models.user import User
from app.schemas.catalog import CatalogItemCreate, CatalogItemResponse, CatalogItemUpdate

router = APIRouter(prefix="/api/catalog", tags=["catalog"])


@router.get("", response_model=list[CatalogItemResponse])
def list_catalog(category: str | None = None, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    query = db.query(CatalogItem).filter(CatalogItem.tenant_id == user.tenant_id)
    if category:
        query = query.filter(CatalogItem.category == category)
    return query.order_by(CatalogItem.name).all()


@router.post("", response_model=CatalogItemResponse)
def create_item(data: CatalogItemCreate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    item = CatalogItem(tenant_id=user.tenant_id, **data.model_dump())
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


@router.put("/{item_id}", response_model=CatalogItemResponse)
def update_item(item_id: int, data: CatalogItemUpdate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    item = db.query(CatalogItem).filter(CatalogItem.id == item_id, CatalogItem.tenant_id == user.tenant_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item não encontrado")
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(item, key, value)
    db.commit()
    db.refresh(item)
    return item


@router.delete("/{item_id}", status_code=204)
def delete_item(item_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    item = db.query(CatalogItem).filter(CatalogItem.id == item_id, CatalogItem.tenant_id == user.tenant_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item não encontrado")
    db.delete(item)
    db.commit()
