from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.checklist import ChecklistItem
from app.models.budget import Budget
from app.models.user import User
from app.schemas.checklist import ChecklistItemCreate, ChecklistItemUpdate, ChecklistItemResponse

router = APIRouter(prefix="/api/checklists", tags=["checklists"])


@router.get("/budget/{budget_id}", response_model=list[ChecklistItemResponse])
def list_checklist(budget_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    return (
        db.query(ChecklistItem)
        .filter(ChecklistItem.budget_id == budget_id, ChecklistItem.tenant_id == user.tenant_id)
        .order_by(ChecklistItem.position, ChecklistItem.id)
        .all()
    )


@router.post("/budget/{budget_id}", response_model=ChecklistItemResponse)
def add_checklist_item(budget_id: int, data: ChecklistItemCreate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    budget = db.query(Budget).filter(Budget.id == budget_id, Budget.tenant_id == user.tenant_id).first()
    if not budget:
        raise HTTPException(status_code=404, detail="Orçamento não encontrado")
    item = ChecklistItem(budget_id=budget_id, tenant_id=user.tenant_id, **data.model_dump())
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


@router.put("/{item_id}", response_model=ChecklistItemResponse)
def update_checklist_item(item_id: int, data: ChecklistItemUpdate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    item = db.query(ChecklistItem).filter(ChecklistItem.id == item_id, ChecklistItem.tenant_id == user.tenant_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item não encontrado")
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(item, key, value)
    db.commit()
    db.refresh(item)
    return item


@router.delete("/{item_id}", status_code=204)
def delete_checklist_item(item_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    item = db.query(ChecklistItem).filter(ChecklistItem.id == item_id, ChecklistItem.tenant_id == user.tenant_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item não encontrado")
    db.delete(item)
    db.commit()


@router.post("/budget/{budget_id}/generate")
def generate_checklist(budget_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    budget = (
        db.query(Budget)
        .options(joinedload(Budget.items))
        .filter(Budget.id == budget_id, Budget.tenant_id == user.tenant_id)
        .first()
    )
    if not budget:
        raise HTTPException(status_code=404, detail="Orçamento não encontrado")

    tasks = []
    for i, item in enumerate(budget.items):
        tasks.append(f"Comprar/preparar: {item.name}")
    tasks.append("Confirmar transporte")
    tasks.append("Montagem no local")
    tasks.append("Desmontagem e recolhimento")
    if budget.event_date:
        tasks.insert(0, f"Confirmar data do evento ({budget.event_date})")

    created = []
    for pos, title in enumerate(tasks):
        ci = ChecklistItem(
            budget_id=budget_id,
            tenant_id=user.tenant_id,
            title=title,
            position=pos,
        )
        db.add(ci)
        created.append(ci)
    db.commit()
    for c in created:
        db.refresh(c)
    return [{"id": c.id, "title": c.title, "is_done": c.is_done, "position": c.position, "budget_id": c.budget_id, "due_date": None, "created_at": c.created_at.isoformat()} for c in created]
