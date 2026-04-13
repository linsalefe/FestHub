from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.budget import Budget
from app.models.client import Client
from app.models.user import User

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])


@router.get("/stats")
def stats(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    tid = user.tenant_id
    total_budgets = db.query(func.count(Budget.id)).filter(Budget.tenant_id == tid).scalar() or 0
    approved_count = db.query(func.count(Budget.id)).filter(Budget.tenant_id == tid, Budget.status.in_(["approved", "paid", "done"])).scalar() or 0
    total_revenue = float(
        db.query(func.coalesce(func.sum(Budget.total_cached), 0))
        .filter(Budget.tenant_id == tid, Budget.status.in_(["approved", "paid", "done"]))
        .scalar()
    )
    avg_ticket = total_revenue / approved_count if approved_count > 0 else 0
    conversion_rate = (approved_count / total_budgets * 100) if total_budgets > 0 else 0
    total_clients = db.query(func.count(Client.id)).filter(Client.tenant_id == tid).scalar() or 0

    return {
        "total_budgets": total_budgets,
        "approved_count": approved_count,
        "total_revenue": round(total_revenue, 2),
        "avg_ticket": round(avg_ticket, 2),
        "conversion_rate": round(conversion_rate, 1),
        "total_clients": total_clients,
    }


@router.get("/pipeline")
def pipeline(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    tid = user.tenant_id
    statuses = ["draft", "sent", "approved", "paid", "done"]
    result = {}
    for s in statuses:
        count = db.query(func.count(Budget.id)).filter(Budget.tenant_id == tid, Budget.status == s).scalar() or 0
        result[s] = count
    return result
