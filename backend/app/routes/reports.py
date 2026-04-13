from datetime import date, timedelta
from collections import defaultdict

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func, extract

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.models.budget import Budget, BudgetItem
from app.models.transaction import Transaction
from app.models.lead import Lead
from app.models.client import Client
from app.models.theme import Theme
from app.models.calendar_event import CalendarEvent

router = APIRouter(prefix="/api/reports", tags=["reports"])


@router.get("/revenue-by-month")
def revenue_by_month(
    months: int = Query(12, ge=1, le=24),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    today = date.today()
    start = today.replace(day=1) - timedelta(days=30 * (months - 1))
    start = start.replace(day=1)

    transactions = (
        db.query(Transaction)
        .filter(
            Transaction.tenant_id == user.tenant_id,
            Transaction.status == "paid",
            Transaction.reference_date >= start,
        )
        .all()
    )

    events = (
        db.query(CalendarEvent)
        .filter(
            CalendarEvent.tenant_id == user.tenant_id,
            CalendarEvent.event_date >= start,
            CalendarEvent.status == "confirmed",
        )
        .all()
    )

    month_data = defaultdict(lambda: {"revenue": 0, "expenses": 0, "events_count": 0})

    for t in transactions:
        ref = t.paid_at or t.reference_date
        if ref:
            key = (ref.month, ref.year)
            if t.type == "income":
                month_data[key]["revenue"] += float(t.amount)
            else:
                month_data[key]["expenses"] += float(t.amount)

    for ev in events:
        key = (ev.event_date.month, ev.event_date.year)
        month_data[key]["events_count"] += 1

    result = []
    current = start
    while current <= today:
        key = (current.month, current.year)
        d = month_data.get(key, {"revenue": 0, "expenses": 0, "events_count": 0})
        result.append({
            "month": current.month,
            "year": current.year,
            "revenue": round(d["revenue"], 2),
            "expenses": round(d["expenses"], 2),
            "profit": round(d["revenue"] - d["expenses"], 2),
            "events_count": d["events_count"],
        })
        if current.month == 12:
            current = current.replace(year=current.year + 1, month=1)
        else:
            current = current.replace(month=current.month + 1)

    return result


@router.get("/revenue-by-theme")
def revenue_by_theme(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    budgets = (
        db.query(Budget)
        .options(joinedload(Budget.theme))
        .filter(
            Budget.tenant_id == user.tenant_id,
            Budget.status.in_(["approved", "paid", "done"]),
            Budget.theme_id.isnot(None),
        )
        .all()
    )

    theme_data = defaultdict(lambda: {"count": 0, "revenue": 0, "emoji": "", "name": ""})
    for b in budgets:
        if b.theme:
            key = b.theme.id
            theme_data[key]["count"] += 1
            theme_data[key]["revenue"] += float(b.total_cached or 0)
            theme_data[key]["emoji"] = b.theme.emoji or ""
            theme_data[key]["name"] = b.theme.name

    result = []
    for _theme_id, data in sorted(theme_data.items(), key=lambda x: x[1]["revenue"], reverse=True):
        result.append({
            "theme_name": data["name"],
            "theme_emoji": data["emoji"],
            "count": data["count"],
            "revenue": round(data["revenue"], 2),
        })

    return result


@router.get("/conversion-funnel")
def conversion_funnel(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    total_leads = db.query(Lead).filter(Lead.tenant_id == user.tenant_id).count()

    budgets_all = (
        db.query(Budget)
        .filter(Budget.tenant_id == user.tenant_id)
        .all()
    )

    total_budgets = len(budgets_all)
    sent = sum(1 for b in budgets_all if b.status in ("sent", "approved", "paid", "done"))
    approved = sum(1 for b in budgets_all if b.status in ("approved", "paid", "done"))
    paid = sum(1 for b in budgets_all if b.status in ("paid", "done"))
    done = sum(1 for b in budgets_all if b.status == "done")

    conversion_rate = round((approved / total_leads * 100) if total_leads > 0 else 0, 1)

    return {
        "total_leads": total_leads,
        "total_budgets": total_budgets,
        "budget_sent": sent,
        "approved": approved,
        "paid": paid,
        "done": done,
        "conversion_rate": conversion_rate,
    }


@router.get("/top-clients")
def top_clients(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    budgets = (
        db.query(Budget)
        .options(joinedload(Budget.client))
        .filter(
            Budget.tenant_id == user.tenant_id,
            Budget.status.in_(["approved", "paid", "done"]),
            Budget.client_id.isnot(None),
        )
        .all()
    )

    client_data = defaultdict(lambda: {"name": "", "events_count": 0, "total_revenue": 0})
    for b in budgets:
        if b.client:
            key = b.client.id
            client_data[key]["name"] = b.client.name
            client_data[key]["events_count"] += 1
            client_data[key]["total_revenue"] += float(b.total_cached or 0)

    result = sorted(client_data.values(), key=lambda x: x["total_revenue"], reverse=True)[:10]
    for r in result:
        r["total_revenue"] = round(r["total_revenue"], 2)

    return result


@router.get("/avg-ticket-trend")
def avg_ticket_trend(
    months: int = Query(12, ge=1, le=24),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    today = date.today()
    start = today.replace(day=1) - timedelta(days=30 * (months - 1))
    start = start.replace(day=1)

    budgets = (
        db.query(Budget)
        .filter(
            Budget.tenant_id == user.tenant_id,
            Budget.status.in_(["approved", "paid", "done"]),
            Budget.created_at >= start,
        )
        .all()
    )

    month_data = defaultdict(lambda: {"total": 0, "count": 0})
    for b in budgets:
        if b.created_at:
            key = (b.created_at.month, b.created_at.year)
            month_data[key]["total"] += float(b.total_cached or 0)
            month_data[key]["count"] += 1

    result = []
    current = start
    while current <= today:
        key = (current.month, current.year)
        d = month_data.get(key, {"total": 0, "count": 0})
        avg = round(d["total"] / d["count"], 2) if d["count"] > 0 else 0
        result.append({
            "month": current.month,
            "year": current.year,
            "avg_ticket": avg,
            "count": d["count"],
        })
        if current.month == 12:
            current = current.replace(year=current.year + 1, month=1)
        else:
            current = current.replace(month=current.month + 1)

    return result


@router.get("/items-ranking")
def items_ranking(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    items = (
        db.query(BudgetItem)
        .join(Budget, BudgetItem.budget_id == Budget.id)
        .filter(
            Budget.tenant_id == user.tenant_id,
            Budget.status.in_(["approved", "paid", "done"]),
        )
        .all()
    )

    item_data = defaultdict(lambda: {"name": "", "category": "", "times_used": 0, "total_revenue": 0})
    for i in items:
        key = i.name
        item_data[key]["name"] = i.name
        item_data[key]["times_used"] += i.quantity
        item_data[key]["total_revenue"] += float(i.price * i.quantity)

    result = sorted(item_data.values(), key=lambda x: x["times_used"], reverse=True)[:15]
    for r in result:
        r["total_revenue"] = round(r["total_revenue"], 2)

    return result
