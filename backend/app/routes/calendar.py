from datetime import date
import calendar as cal_mod

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import extract

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.calendar_event import CalendarEvent
from app.models.user import User
from app.schemas.calendar import CalendarEventCreate, CalendarEventUpdate, CalendarEventResponse

router = APIRouter(prefix="/api/calendar", tags=["calendar"])


def _serialize_event(e: CalendarEvent) -> dict:
    return {
        "id": e.id,
        "budget_id": e.budget_id,
        "client_id": e.client_id,
        "title": e.title,
        "event_date": e.event_date.isoformat(),
        "event_time": e.event_time.isoformat() if e.event_time else None,
        "event_address": e.event_address,
        "status": e.status,
        "notes": e.notes,
        "created_at": e.created_at.isoformat(),
        "client": {"id": e.client.id, "name": e.client.name} if e.client else None,
    }


@router.get("")
def list_events(month: int | None = None, year: int | None = None, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    query = db.query(CalendarEvent).filter(CalendarEvent.tenant_id == user.tenant_id)
    if month and year:
        query = query.filter(
            extract("month", CalendarEvent.event_date) == month,
            extract("year", CalendarEvent.event_date) == year,
        )
    events = query.order_by(CalendarEvent.event_date).all()
    return [_serialize_event(e) for e in events]


@router.post("")
def create_event(data: CalendarEventCreate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    e = CalendarEvent(tenant_id=user.tenant_id, **data.model_dump())
    db.add(e)
    db.commit()
    db.refresh(e)
    return _serialize_event(e)


@router.put("/{event_id}")
def update_event(event_id: int, data: CalendarEventUpdate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    e = db.query(CalendarEvent).filter(CalendarEvent.id == event_id, CalendarEvent.tenant_id == user.tenant_id).first()
    if not e:
        raise HTTPException(status_code=404, detail="Evento não encontrado")
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(e, key, value)
    db.commit()
    db.refresh(e)
    return _serialize_event(e)


@router.delete("/{event_id}", status_code=204)
def delete_event(event_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    e = db.query(CalendarEvent).filter(CalendarEvent.id == event_id, CalendarEvent.tenant_id == user.tenant_id).first()
    if not e:
        raise HTTPException(status_code=404, detail="Evento não encontrado")
    db.delete(e)
    db.commit()


@router.get("/availability")
def check_availability(date_str: str, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    try:
        check_date = date.fromisoformat(date_str)
    except ValueError:
        raise HTTPException(status_code=400, detail="Data inválida")
    count = db.query(CalendarEvent).filter(
        CalendarEvent.tenant_id == user.tenant_id,
        CalendarEvent.event_date == check_date,
        CalendarEvent.status != "cancelled",
    ).count()
    return {"date": date_str, "events_count": count, "available": count == 0}
