from datetime import date, timedelta

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session, joinedload

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.models.budget import Budget
from app.models.transaction import Transaction
from app.models.calendar_event import CalendarEvent
from app.models.lead import Lead

router = APIRouter(prefix="/api/notifications", tags=["notifications"])


@router.get("")
def get_notifications(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    today = date.today()
    notifications = []

    # --- Orçamentos vencendo (created_at + validity_days < today + 3) ---
    budgets = (
        db.query(Budget)
        .options(joinedload(Budget.client))
        .filter(
            Budget.tenant_id == user.tenant_id,
            Budget.status == "sent",
            Budget.validity_days.isnot(None),
        )
        .all()
    )
    for b in budgets:
        if b.validity_days and b.created_at:
            expiry = b.created_at.date() + timedelta(days=b.validity_days)
            days_left = (expiry - today).days
            if days_left <= 3:
                client_name = b.client.name if b.client else "Cliente"
                if days_left < 0:
                    msg = f"Orçamento de {client_name} venceu há {abs(days_left)} dias"
                elif days_left == 0:
                    msg = f"Orçamento de {client_name} vence hoje"
                else:
                    msg = f"Orçamento de {client_name} vence em {days_left} dias"
                notifications.append({
                    "type": "warning",
                    "message": msg,
                    "link": f"/budgets/{b.id}",
                    "created_at": str(today),
                })

    # --- Pagamentos atrasados ---
    overdue = (
        db.query(Transaction)
        .options(joinedload(Transaction.client))
        .filter(
            Transaction.tenant_id == user.tenant_id,
            Transaction.status == "pending",
            Transaction.due_date < today,
        )
        .all()
    )
    for t in overdue:
        days_late = (today - t.due_date).days
        client_name = t.client.name if t.client else "Cliente"
        notifications.append({
            "type": "danger",
            "message": f"Pagamento de R$ {float(t.amount):,.2f} de {client_name} está atrasado há {days_late} dias",
            "link": "/financeiro",
            "created_at": str(today),
        })

    # --- Eventos próximos (hoje a hoje+3) ---
    upcoming_events = (
        db.query(CalendarEvent)
        .filter(
            CalendarEvent.tenant_id == user.tenant_id,
            CalendarEvent.event_date >= today,
            CalendarEvent.event_date <= today + timedelta(days=3),
        )
        .all()
    )
    for ev in upcoming_events:
        days_until = (ev.event_date - today).days
        if days_until == 0:
            msg = f"Festa de {ev.title} é hoje!"
        elif days_until == 1:
            msg = f"Festa de {ev.title} é amanhã"
        else:
            msg = f"Festa de {ev.title} em {days_until} dias"
        notifications.append({
            "type": "info",
            "message": msg,
            "link": "/calendar",
            "created_at": str(today),
        })

    # --- Leads parados há mais de 7 dias ---
    stale_date = today - timedelta(days=7)
    stale_leads = (
        db.query(Lead)
        .filter(
            Lead.tenant_id == user.tenant_id,
            Lead.updated_at < stale_date,
        )
        .all()
    )
    for lead in stale_leads:
        days_stale = (today - lead.updated_at.date()).days
        notifications.append({
            "type": "warning",
            "message": f"Lead {lead.name} sem movimentação há {days_stale} dias",
            "link": "/pipeline",
            "created_at": str(today),
        })

    return notifications
