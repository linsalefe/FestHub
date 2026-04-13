from datetime import date, datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import Response
from sqlalchemy import func, extract
from sqlalchemy.orm import Session, joinedload

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.budget import Budget
from app.models.client import Client
from app.models.contract import Contract
from app.models.user import User
from app.schemas.contract import ContractCreate, ContractUpdate
from app.services.budget_calculator import calculate_budget

router = APIRouter(prefix="/api/contracts", tags=["contracts"])

VALID_STATUSES = {"draft", "sent", "signed", "active", "completed", "cancelled"}


def _generate_contract_number(tenant_id: int, db: Session) -> str:
    year = date.today().year
    count = (
        db.query(func.count(Contract.id))
        .filter(
            Contract.tenant_id == tenant_id,
            extract("year", Contract.created_at) == year,
        )
        .scalar() or 0
    )
    return f"CTR-{year}-{count + 1:03d}"


def _serialize_contract(c: Contract) -> dict:
    return {
        "id": c.id,
        "tenant_id": c.tenant_id,
        "budget_id": c.budget_id,
        "client_id": c.client_id,
        "contract_number": c.contract_number,
        "status": c.status,
        "event_date": c.event_date.isoformat() if c.event_date else None,
        "event_time": c.event_time.isoformat() if c.event_time else None,
        "event_address": c.event_address,
        "event_duration": c.event_duration,
        "montage_time": c.montage_time.isoformat() if c.montage_time else None,
        "demontage_time": c.demontage_time.isoformat() if c.demontage_time else None,
        "total_value": float(c.total_value or 0),
        "down_payment": float(c.down_payment or 0),
        "down_payment_date": c.down_payment_date.isoformat() if c.down_payment_date else None,
        "remaining_value": float(c.remaining_value or 0),
        "remaining_payment_date": c.remaining_payment_date.isoformat() if c.remaining_payment_date else None,
        "payment_method": c.payment_method,
        "cancellation_policy": c.cancellation_policy,
        "additional_clauses": c.additional_clauses,
        "client_document": c.client_document,
        "client_address": c.client_address,
        "signed_at": c.signed_at.isoformat() if c.signed_at else None,
        "pdf_generated_at": c.pdf_generated_at.isoformat() if c.pdf_generated_at else None,
        "notes": c.notes,
        "created_at": c.created_at.isoformat() if c.created_at else None,
        "updated_at": c.updated_at.isoformat() if c.updated_at else None,
        "client": {
            "id": c.client.id,
            "name": c.client.name,
            "phone": c.client.phone,
            "email": c.client.email,
        } if c.client else None,
        "budget_summary": {
            "id": c.budget.id,
            "total_cached": float(c.budget.total_cached or 0),
            "status": c.budget.status,
        } if c.budget else None,
    }


@router.get("")
def list_contracts(
    status: str | None = None,
    client_id: int | None = None,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    query = (
        db.query(Contract)
        .options(joinedload(Contract.client), joinedload(Contract.budget))
        .filter(Contract.tenant_id == user.tenant_id)
    )
    if status:
        query = query.filter(Contract.status == status)
    if client_id:
        query = query.filter(Contract.client_id == client_id)

    contracts = query.order_by(Contract.created_at.desc()).all()
    return [_serialize_contract(c) for c in contracts]


@router.post("")
def create_contract(data: ContractCreate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    contract_number = _generate_contract_number(user.tenant_id, db)
    contract = Contract(
        tenant_id=user.tenant_id,
        contract_number=contract_number,
        **data.model_dump(),
    )
    db.add(contract)
    db.commit()
    db.refresh(contract)
    # Reload relationships
    contract = (
        db.query(Contract)
        .options(joinedload(Contract.client), joinedload(Contract.budget))
        .filter(Contract.id == contract.id)
        .first()
    )
    return _serialize_contract(contract)


@router.post("/from-budget/{budget_id}")
def create_from_budget(budget_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    budget = (
        db.query(Budget)
        .options(joinedload(Budget.items), joinedload(Budget.variable_costs), joinedload(Budget.client))
        .filter(Budget.id == budget_id, Budget.tenant_id == user.tenant_id)
        .first()
    )
    if not budget:
        raise HTTPException(status_code=404, detail="Orcamento nao encontrado")
    if not budget.client_id:
        raise HTTPException(status_code=400, detail="Orcamento nao tem cliente vinculado")

    calc = calculate_budget(budget, db)
    total = calc["total"]
    down = round(total * 0.5, 2)
    remaining = round(total - down, 2)

    contract_number = _generate_contract_number(user.tenant_id, db)
    contract = Contract(
        tenant_id=user.tenant_id,
        budget_id=budget.id,
        client_id=budget.client_id,
        contract_number=contract_number,
        event_date=budget.event_date or date.today(),
        event_address=budget.event_address,
        total_value=total,
        down_payment=down,
        down_payment_date=date.today(),
        remaining_value=remaining,
        remaining_payment_date=budget.event_date or date.today(),
        payment_method="PIX",
        client_address=budget.client.address if budget.client else None,
    )
    db.add(contract)
    db.commit()
    db.refresh(contract)
    contract = (
        db.query(Contract)
        .options(joinedload(Contract.client), joinedload(Contract.budget))
        .filter(Contract.id == contract.id)
        .first()
    )
    return _serialize_contract(contract)


@router.get("/{contract_id}")
def get_contract(contract_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    contract = (
        db.query(Contract)
        .options(joinedload(Contract.client), joinedload(Contract.budget))
        .filter(Contract.id == contract_id, Contract.tenant_id == user.tenant_id)
        .first()
    )
    if not contract:
        raise HTTPException(status_code=404, detail="Contrato nao encontrado")
    return _serialize_contract(contract)


@router.put("/{contract_id}")
def update_contract(contract_id: int, data: ContractUpdate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    contract = db.query(Contract).filter(Contract.id == contract_id, Contract.tenant_id == user.tenant_id).first()
    if not contract:
        raise HTTPException(status_code=404, detail="Contrato nao encontrado")
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(contract, key, value)
    db.commit()
    db.refresh(contract)
    contract = (
        db.query(Contract)
        .options(joinedload(Contract.client), joinedload(Contract.budget))
        .filter(Contract.id == contract.id)
        .first()
    )
    return _serialize_contract(contract)


@router.patch("/{contract_id}/status")
def change_status(contract_id: int, body: dict, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    new_status = body.get("status")
    if new_status not in VALID_STATUSES:
        raise HTTPException(status_code=400, detail=f"Status invalido. Use: {', '.join(VALID_STATUSES)}")
    contract = db.query(Contract).filter(Contract.id == contract_id, Contract.tenant_id == user.tenant_id).first()
    if not contract:
        raise HTTPException(status_code=404, detail="Contrato nao encontrado")
    contract.status = new_status
    if new_status == "signed":
        contract.signed_at = date.today()
    db.commit()
    db.refresh(contract)
    contract = (
        db.query(Contract)
        .options(joinedload(Contract.client), joinedload(Contract.budget))
        .filter(Contract.id == contract.id)
        .first()
    )
    return _serialize_contract(contract)


@router.delete("/{contract_id}", status_code=204)
def delete_contract(contract_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    contract = db.query(Contract).filter(Contract.id == contract_id, Contract.tenant_id == user.tenant_id).first()
    if not contract:
        raise HTTPException(status_code=404, detail="Contrato nao encontrado")
    db.delete(contract)
    db.commit()


@router.get("/{contract_id}/pdf")
def get_contract_pdf(contract_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    contract = (
        db.query(Contract)
        .options(joinedload(Contract.client), joinedload(Contract.budget))
        .filter(Contract.id == contract_id, Contract.tenant_id == user.tenant_id)
        .first()
    )
    if not contract:
        raise HTTPException(status_code=404, detail="Contrato nao encontrado")

    from app.services.contract_pdf import generate_contract_pdf
    pdf_bytes = generate_contract_pdf(contract, db)

    contract.pdf_generated_at = datetime.now(timezone.utc)
    db.commit()

    content_type = "application/pdf" if pdf_bytes[:4] == b"%PDF" else "text/html"
    ext = "pdf" if content_type == "application/pdf" else "html"
    return Response(
        content=pdf_bytes,
        media_type=content_type,
        headers={"Content-Disposition": f'attachment; filename="contrato_{contract.contract_number}.{ext}"'},
    )
