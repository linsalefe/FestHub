from datetime import date, datetime, timezone
import re

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func, extract
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.budget import Budget
from app.models.client import Client
from app.models.transaction import Transaction
from app.models.user import User
from app.schemas.transaction import (
    TransactionCreate,
    TransactionUpdate,
    TransactionSummary,
    MonthlySummary,
)
from app.services.budget_calculator import calculate_budget

router = APIRouter(prefix="/api/transactions", tags=["transactions"])


def _serialize_transaction(t: Transaction) -> dict:
    return {
        "id": t.id,
        "tenant_id": t.tenant_id,
        "budget_id": t.budget_id,
        "client_id": t.client_id,
        "type": t.type,
        "category": t.category,
        "description": t.description,
        "amount": float(t.amount),
        "payment_method": t.payment_method,
        "reference_date": t.reference_date.isoformat() if t.reference_date else None,
        "due_date": t.due_date.isoformat() if t.due_date else None,
        "paid_at": t.paid_at.isoformat() if t.paid_at else None,
        "status": t.status,
        "installment_number": t.installment_number,
        "total_installments": t.total_installments,
        "notes": t.notes,
        "created_at": t.created_at.isoformat() if t.created_at else None,
        "client_name": t.client.name if t.client else None,
        "client_phone": t.client.phone if t.client else None,
        "budget_info": f"Orcamento #{t.budget_id}" if t.budget_id else None,
    }


@router.get("/summary")
def get_summary(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    tid = user.tenant_id

    total_income = float(
        db.query(func.coalesce(func.sum(Transaction.amount), 0))
        .filter(Transaction.tenant_id == tid, Transaction.type == "income", Transaction.status == "paid")
        .scalar()
    )
    total_expense = float(
        db.query(func.coalesce(func.sum(Transaction.amount), 0))
        .filter(Transaction.tenant_id == tid, Transaction.type == "expense", Transaction.status == "paid")
        .scalar()
    )
    pending_income = float(
        db.query(func.coalesce(func.sum(Transaction.amount), 0))
        .filter(Transaction.tenant_id == tid, Transaction.type == "income", Transaction.status == "pending")
        .scalar()
    )
    pending_expense = float(
        db.query(func.coalesce(func.sum(Transaction.amount), 0))
        .filter(Transaction.tenant_id == tid, Transaction.type == "expense", Transaction.status == "pending")
        .scalar()
    )
    overdue_count = (
        db.query(func.count(Transaction.id))
        .filter(
            Transaction.tenant_id == tid,
            Transaction.status == "pending",
            Transaction.due_date < date.today(),
        )
        .scalar() or 0
    )

    return {
        "total_income": round(total_income, 2),
        "total_expense": round(total_expense, 2),
        "balance": round(total_income - total_expense, 2),
        "pending_income": round(pending_income, 2),
        "pending_expense": round(pending_expense, 2),
        "overdue_count": overdue_count,
    }


@router.get("/monthly")
def get_monthly(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    tid = user.tenant_id
    today = date.today()

    results = []
    for i in range(11, -1, -1):
        m = today.month - i
        y = today.year
        while m <= 0:
            m += 12
            y -= 1

        income = float(
            db.query(func.coalesce(func.sum(Transaction.amount), 0))
            .filter(
                Transaction.tenant_id == tid,
                Transaction.type == "income",
                Transaction.status == "paid",
                extract("month", Transaction.reference_date) == m,
                extract("year", Transaction.reference_date) == y,
            )
            .scalar()
        )
        expense = float(
            db.query(func.coalesce(func.sum(Transaction.amount), 0))
            .filter(
                Transaction.tenant_id == tid,
                Transaction.type == "expense",
                Transaction.status == "paid",
                extract("month", Transaction.reference_date) == m,
                extract("year", Transaction.reference_date) == y,
            )
            .scalar()
        )
        results.append({
            "month": m,
            "year": y,
            "income": round(income, 2),
            "expense": round(expense, 2),
            "balance": round(income - expense, 2),
        })

    return results


@router.get("")
def list_transactions(
    type: str | None = None,
    category: str | None = None,
    status: str | None = None,
    date_from: str | None = None,
    date_to: str | None = None,
    client_id: int | None = None,
    budget_id: int | None = None,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    query = db.query(Transaction).filter(Transaction.tenant_id == user.tenant_id)

    if type:
        query = query.filter(Transaction.type == type)
    if category:
        query = query.filter(Transaction.category == category)
    if status:
        query = query.filter(Transaction.status == status)
    if date_from:
        query = query.filter(Transaction.reference_date >= date_from)
    if date_to:
        query = query.filter(Transaction.reference_date <= date_to)
    if client_id:
        query = query.filter(Transaction.client_id == client_id)
    if budget_id:
        query = query.filter(Transaction.budget_id == budget_id)

    transactions = query.order_by(Transaction.reference_date.desc()).all()
    return [_serialize_transaction(t) for t in transactions]


@router.post("")
def create_transaction(data: TransactionCreate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    t = Transaction(
        tenant_id=user.tenant_id,
        **data.model_dump(),
    )
    db.add(t)
    db.commit()
    db.refresh(t)
    return _serialize_transaction(t)


@router.put("/{transaction_id}")
def update_transaction(transaction_id: int, data: TransactionUpdate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    t = db.query(Transaction).filter(Transaction.id == transaction_id, Transaction.tenant_id == user.tenant_id).first()
    if not t:
        raise HTTPException(status_code=404, detail="Transacao nao encontrada")
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(t, key, value)
    db.commit()
    db.refresh(t)
    return _serialize_transaction(t)


@router.delete("/{transaction_id}", status_code=204)
def delete_transaction(transaction_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    t = db.query(Transaction).filter(Transaction.id == transaction_id, Transaction.tenant_id == user.tenant_id).first()
    if not t:
        raise HTTPException(status_code=404, detail="Transacao nao encontrada")
    db.delete(t)
    db.commit()


@router.patch("/{transaction_id}/pay")
def mark_as_paid(transaction_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    t = db.query(Transaction).filter(Transaction.id == transaction_id, Transaction.tenant_id == user.tenant_id).first()
    if not t:
        raise HTTPException(status_code=404, detail="Transacao nao encontrada")
    t.status = "paid"
    t.paid_at = date.today()
    db.commit()
    db.refresh(t)
    return _serialize_transaction(t)


@router.post("/from-budget/{budget_id}")
def create_from_budget(budget_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    from sqlalchemy.orm import joinedload

    budget = (
        db.query(Budget)
        .options(joinedload(Budget.items), joinedload(Budget.variable_costs), joinedload(Budget.client))
        .filter(Budget.id == budget_id, Budget.tenant_id == user.tenant_id)
        .first()
    )
    if not budget:
        raise HTTPException(status_code=404, detail="Orcamento nao encontrado")

    calc = calculate_budget(budget, db)
    total = calc["total"]
    payment_condition = budget.payment_condition or "50% entrada + 50% no evento"
    event_date = budget.event_date or date.today()

    created_transactions = []

    # Try to parse payment condition like "50% entrada + 50% no evento"
    pattern = r"(\d+)%\s*.*?\+\s*(\d+)%"
    match = re.search(pattern, payment_condition)

    if match:
        pct1 = int(match.group(1))
        pct2 = int(match.group(2))
        amount1 = round(total * pct1 / 100, 2)
        amount2 = round(total * pct2 / 100, 2)

        t1 = Transaction(
            tenant_id=user.tenant_id,
            budget_id=budget.id,
            client_id=budget.client_id,
            type="income",
            category="Sinal/Entrada",
            description=f"Sinal - Orcamento #{budget.id} ({pct1}%)",
            amount=amount1,
            payment_method="PIX",
            reference_date=date.today(),
            due_date=date.today(),
            status="pending",
            installment_number=1,
            total_installments=2,
        )
        db.add(t1)
        db.flush()
        created_transactions.append(t1)

        t2 = Transaction(
            tenant_id=user.tenant_id,
            budget_id=budget.id,
            client_id=budget.client_id,
            type="income",
            category="Quitacao",
            description=f"Restante - Orcamento #{budget.id} ({pct2}%)",
            amount=amount2,
            payment_method="PIX",
            reference_date=event_date,
            due_date=event_date,
            status="pending",
            installment_number=2,
            total_installments=2,
        )
        db.add(t2)
        db.flush()
        created_transactions.append(t2)
    else:
        t = Transaction(
            tenant_id=user.tenant_id,
            budget_id=budget.id,
            client_id=budget.client_id,
            type="income",
            category="Venda de servico",
            description=f"Pagamento - Orcamento #{budget.id}",
            amount=round(total, 2),
            payment_method="PIX",
            reference_date=date.today(),
            due_date=event_date,
            status="pending",
            installment_number=1,
            total_installments=1,
        )
        db.add(t)
        db.flush()
        created_transactions.append(t)

    db.commit()
    for t in created_transactions:
        db.refresh(t)
    return [_serialize_transaction(t) for t in created_transactions]
