from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.package import Package, PackageItem
from app.models.budget import Budget, BudgetItem
from app.models.catalog_item import CatalogItem
from app.models.user import User
from app.schemas.package import PackageCreate, PackageUpdate, ApplyPackageRequest
from app.services.budget_calculator import calculate_budget

router = APIRouter(prefix="/api/packages", tags=["packages"])


def _serialize_package(p: Package) -> dict:
    items = []
    total_cost = 0
    total_price = 0
    for pi in p.items:
        ci = pi.catalog_item
        item_data = {
            "id": pi.id,
            "catalog_item_id": pi.catalog_item_id,
            "quantity": pi.quantity,
            "catalog_item": {
                "id": ci.id, "name": ci.name, "category": ci.category,
                "cost": float(ci.cost), "price": float(ci.price),
            } if ci else None,
        }
        items.append(item_data)
        if ci:
            total_cost += float(ci.cost) * pi.quantity
            total_price += float(ci.price) * pi.quantity
    return {
        "id": p.id, "name": p.name, "description": p.description,
        "is_active": p.is_active, "items": items,
        "total_cost": total_cost, "total_price": total_price,
    }


@router.get("")
def list_packages(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    packages = db.query(Package).filter(Package.tenant_id == user.tenant_id).all()
    return [_serialize_package(p) for p in packages]


@router.post("")
def create_package(data: PackageCreate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    p = Package(tenant_id=user.tenant_id, name=data.name, description=data.description)
    db.add(p)
    db.flush()
    if data.items:
        for item in data.items:
            db.add(PackageItem(package_id=p.id, catalog_item_id=item.catalog_item_id, quantity=item.quantity))
    db.commit()
    db.refresh(p)
    return _serialize_package(p)


@router.get("/{package_id}")
def get_package(package_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    p = db.query(Package).filter(Package.id == package_id, Package.tenant_id == user.tenant_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Pacote não encontrado")
    return _serialize_package(p)


@router.put("/{package_id}")
def update_package(package_id: int, data: PackageUpdate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    p = db.query(Package).filter(Package.id == package_id, Package.tenant_id == user.tenant_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Pacote não encontrado")
    if data.name is not None:
        p.name = data.name
    if data.description is not None:
        p.description = data.description
    if data.is_active is not None:
        p.is_active = data.is_active
    if data.items is not None:
        for old_item in p.items:
            db.delete(old_item)
        db.flush()
        for item in data.items:
            db.add(PackageItem(package_id=p.id, catalog_item_id=item.catalog_item_id, quantity=item.quantity))
    db.commit()
    db.refresh(p)
    return _serialize_package(p)


@router.delete("/{package_id}", status_code=204)
def delete_package(package_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    p = db.query(Package).filter(Package.id == package_id, Package.tenant_id == user.tenant_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Pacote não encontrado")
    db.delete(p)
    db.commit()


@router.post("/apply-to-budget")
def apply_to_budget(data: ApplyPackageRequest, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    p = db.query(Package).filter(Package.id == data.package_id, Package.tenant_id == user.tenant_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Pacote não encontrado")
    budget = db.query(Budget).filter(Budget.id == data.budget_id, Budget.tenant_id == user.tenant_id).first()
    if not budget:
        raise HTTPException(status_code=404, detail="Orçamento não encontrado")

    added = 0
    for pi in p.items:
        ci = pi.catalog_item
        if ci:
            item = BudgetItem(
                budget_id=budget.id,
                catalog_item_id=ci.id,
                name=ci.name,
                cost=ci.cost,
                price=ci.price,
                quantity=pi.quantity,
            )
            db.add(item)
            added += 1
    db.commit()

    from sqlalchemy.orm import joinedload
    budget = db.query(Budget).options(
        joinedload(Budget.items), joinedload(Budget.variable_costs)
    ).filter(Budget.id == budget.id).first()
    calc = calculate_budget(budget, db)
    budget.total_cached = calc["total"]
    db.commit()

    return {"added": added, "total": calc["total"]}
