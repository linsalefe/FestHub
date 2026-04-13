from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.budget import Budget, BudgetItem, BudgetVariableCost
from app.models.user import User
from app.schemas.budget import (
    BudgetCreate,
    BudgetItemCreate,
    BudgetItemResponse,
    BudgetResponse,
    BudgetUpdate,
    VariableCostCreate,
    VariableCostResponse,
)
from app.services.budget_calculator import calculate_budget

router = APIRouter(prefix="/api/budgets", tags=["budgets"])

VALID_STATUSES = {"draft", "sent", "approved", "paid", "done"}


def _serialize_budget(b: Budget) -> dict:
    data = {
        "id": b.id,
        "tenant_id": b.tenant_id,
        "client_id": b.client_id,
        "theme_id": b.theme_id,
        "status": b.status,
        "event_date": b.event_date.isoformat() if b.event_date else None,
        "event_address": b.event_address,
        "discount": float(b.discount or 0),
        "payment_condition": b.payment_condition,
        "validity_days": b.validity_days,
        "notes": b.notes,
        "total_cached": float(b.total_cached or 0),
        "created_at": b.created_at.isoformat(),
        "updated_at": b.updated_at.isoformat(),
        "client": {"id": b.client.id, "name": b.client.name, "phone": b.client.phone, "email": b.client.email, "city": b.client.city} if b.client else None,
        "theme": {"id": b.theme.id, "name": b.theme.name, "color": b.theme.color, "emoji": b.theme.emoji} if b.theme else None,
        "items": [
            {"id": i.id, "budget_id": i.budget_id, "catalog_item_id": i.catalog_item_id, "name": i.name, "cost": float(i.cost), "price": float(i.price), "quantity": i.quantity}
            for i in b.items
        ],
        "variable_costs": [
            {"id": vc.id, "budget_id": vc.budget_id, "name": vc.name, "value": float(vc.value)}
            for vc in b.variable_costs
        ],
    }
    return data


def _get_budget(budget_id: int, tenant_id: int, db: Session) -> Budget:
    budget = (
        db.query(Budget)
        .options(joinedload(Budget.items), joinedload(Budget.variable_costs), joinedload(Budget.client), joinedload(Budget.theme))
        .filter(Budget.id == budget_id, Budget.tenant_id == tenant_id)
        .first()
    )
    if not budget:
        raise HTTPException(status_code=404, detail="Orçamento não encontrado")
    return budget


@router.get("")
def list_budgets(status: str | None = None, client_id: int | None = None, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    query = (
        db.query(Budget)
        .options(joinedload(Budget.items), joinedload(Budget.variable_costs), joinedload(Budget.client), joinedload(Budget.theme))
        .filter(Budget.tenant_id == user.tenant_id)
    )
    if status:
        query = query.filter(Budget.status == status)
    if client_id:
        query = query.filter(Budget.client_id == client_id)
    budgets = query.order_by(Budget.created_at.desc()).unique().all()
    return [_serialize_budget(b) for b in budgets]


@router.post("")
def create_budget(data: BudgetCreate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    budget = Budget(
        tenant_id=user.tenant_id,
        client_id=data.client_id,
        theme_id=data.theme_id,
        status=data.status,
        event_date=data.event_date,
        event_address=data.event_address,
        discount=data.discount,
        payment_condition=data.payment_condition,
        validity_days=data.validity_days,
        notes=data.notes,
    )
    db.add(budget)
    db.flush()

    if data.items:
        for item_data in data.items:
            item = BudgetItem(budget_id=budget.id, **item_data.model_dump())
            db.add(item)

    if data.variable_costs:
        for vc_data in data.variable_costs:
            vc = BudgetVariableCost(budget_id=budget.id, **vc_data.model_dump())
            db.add(vc)

    db.commit()
    budget = _get_budget(budget.id, user.tenant_id, db)
    calc = calculate_budget(budget, db)
    budget.total_cached = calc["total"]
    db.commit()
    db.refresh(budget)
    return _serialize_budget(budget)


@router.get("/{budget_id}")
def get_budget(budget_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    budget = _get_budget(budget_id, user.tenant_id, db)
    return _serialize_budget(budget)


@router.put("/{budget_id}")
def update_budget(budget_id: int, data: BudgetUpdate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    budget = _get_budget(budget_id, user.tenant_id, db)
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(budget, key, value)
    db.commit()
    budget = _get_budget(budget_id, user.tenant_id, db)
    calc = calculate_budget(budget, db)
    budget.total_cached = calc["total"]
    db.commit()
    db.refresh(budget)
    return _serialize_budget(budget)


@router.patch("/{budget_id}/status")
def change_status(budget_id: int, body: dict, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    new_status = body.get("status")
    if new_status not in VALID_STATUSES:
        raise HTTPException(status_code=400, detail=f"Status inválido. Use: {', '.join(VALID_STATUSES)}")
    budget = _get_budget(budget_id, user.tenant_id, db)
    budget.status = new_status
    db.commit()
    db.refresh(budget)
    return _serialize_budget(budget)


@router.post("/{budget_id}/duplicate")
def duplicate_budget(budget_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    original = _get_budget(budget_id, user.tenant_id, db)
    new_budget = Budget(
        tenant_id=original.tenant_id,
        client_id=original.client_id,
        theme_id=original.theme_id,
        status="draft",
        event_date=original.event_date,
        event_address=original.event_address,
        discount=original.discount,
        payment_condition=original.payment_condition,
        validity_days=original.validity_days,
        notes=original.notes,
    )
    db.add(new_budget)
    db.flush()

    for item in original.items:
        new_item = BudgetItem(
            budget_id=new_budget.id,
            catalog_item_id=item.catalog_item_id,
            name=item.name,
            cost=item.cost,
            price=item.price,
            quantity=item.quantity,
        )
        db.add(new_item)

    for vc in original.variable_costs:
        new_vc = BudgetVariableCost(
            budget_id=new_budget.id,
            name=vc.name,
            value=vc.value,
        )
        db.add(new_vc)

    db.commit()
    new_budget = _get_budget(new_budget.id, user.tenant_id, db)
    calc = calculate_budget(new_budget, db)
    new_budget.total_cached = calc["total"]
    db.commit()
    return _serialize_budget(new_budget)


@router.delete("/{budget_id}", status_code=204)
def delete_budget(budget_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    budget = db.query(Budget).filter(Budget.id == budget_id, Budget.tenant_id == user.tenant_id).first()
    if not budget:
        raise HTTPException(status_code=404, detail="Orçamento não encontrado")
    db.delete(budget)
    db.commit()


# --- Budget Items ---

@router.post("/{budget_id}/items", response_model=BudgetItemResponse)
def add_item(budget_id: int, data: BudgetItemCreate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    budget = db.query(Budget).filter(Budget.id == budget_id, Budget.tenant_id == user.tenant_id).first()
    if not budget:
        raise HTTPException(status_code=404, detail="Orçamento não encontrado")
    item = BudgetItem(budget_id=budget_id, **data.model_dump())
    db.add(item)
    db.commit()
    db.refresh(item)
    # Update cached total
    budget = _get_budget(budget_id, user.tenant_id, db)
    calc = calculate_budget(budget, db)
    budget.total_cached = calc["total"]
    db.commit()
    return item


@router.put("/{budget_id}/items/{item_id}", response_model=BudgetItemResponse)
def update_item(budget_id: int, item_id: int, data: BudgetItemCreate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    budget = db.query(Budget).filter(Budget.id == budget_id, Budget.tenant_id == user.tenant_id).first()
    if not budget:
        raise HTTPException(status_code=404, detail="Orçamento não encontrado")
    item = db.query(BudgetItem).filter(BudgetItem.id == item_id, BudgetItem.budget_id == budget_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item não encontrado")
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(item, key, value)
    db.commit()
    db.refresh(item)
    budget = _get_budget(budget_id, user.tenant_id, db)
    calc = calculate_budget(budget, db)
    budget.total_cached = calc["total"]
    db.commit()
    return item


@router.delete("/{budget_id}/items/{item_id}", status_code=204)
def remove_item(budget_id: int, item_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    budget = db.query(Budget).filter(Budget.id == budget_id, Budget.tenant_id == user.tenant_id).first()
    if not budget:
        raise HTTPException(status_code=404, detail="Orçamento não encontrado")
    item = db.query(BudgetItem).filter(BudgetItem.id == item_id, BudgetItem.budget_id == budget_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item não encontrado")
    db.delete(item)
    db.commit()
    budget = _get_budget(budget_id, user.tenant_id, db)
    calc = calculate_budget(budget, db)
    budget.total_cached = calc["total"]
    db.commit()


# --- Variable Costs ---

@router.post("/{budget_id}/variable-costs", response_model=VariableCostResponse)
def add_variable_cost(budget_id: int, data: VariableCostCreate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    budget = db.query(Budget).filter(Budget.id == budget_id, Budget.tenant_id == user.tenant_id).first()
    if not budget:
        raise HTTPException(status_code=404, detail="Orçamento não encontrado")
    vc = BudgetVariableCost(budget_id=budget_id, **data.model_dump())
    db.add(vc)
    db.commit()
    db.refresh(vc)
    budget = _get_budget(budget_id, user.tenant_id, db)
    calc = calculate_budget(budget, db)
    budget.total_cached = calc["total"]
    db.commit()
    return vc


@router.put("/{budget_id}/variable-costs/{vc_id}", response_model=VariableCostResponse)
def update_variable_cost(budget_id: int, vc_id: int, data: VariableCostCreate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    budget = db.query(Budget).filter(Budget.id == budget_id, Budget.tenant_id == user.tenant_id).first()
    if not budget:
        raise HTTPException(status_code=404, detail="Orçamento não encontrado")
    vc = db.query(BudgetVariableCost).filter(BudgetVariableCost.id == vc_id, BudgetVariableCost.budget_id == budget_id).first()
    if not vc:
        raise HTTPException(status_code=404, detail="Custo variável não encontrado")
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(vc, key, value)
    db.commit()
    db.refresh(vc)
    budget = _get_budget(budget_id, user.tenant_id, db)
    calc = calculate_budget(budget, db)
    budget.total_cached = calc["total"]
    db.commit()
    return vc


@router.delete("/{budget_id}/variable-costs/{vc_id}", status_code=204)
def remove_variable_cost(budget_id: int, vc_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    budget = db.query(Budget).filter(Budget.id == budget_id, Budget.tenant_id == user.tenant_id).first()
    if not budget:
        raise HTTPException(status_code=404, detail="Orçamento não encontrado")
    vc = db.query(BudgetVariableCost).filter(BudgetVariableCost.id == vc_id, BudgetVariableCost.budget_id == budget_id).first()
    if not vc:
        raise HTTPException(status_code=404, detail="Custo variável não encontrado")
    db.delete(vc)
    db.commit()
    budget = _get_budget(budget_id, user.tenant_id, db)
    calc = calculate_budget(budget, db)
    budget.total_cached = calc["total"]
    db.commit()


@router.get("/{budget_id}/calculate")
def calculate(budget_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    budget = _get_budget(budget_id, user.tenant_id, db)
    return calculate_budget(budget, db)
