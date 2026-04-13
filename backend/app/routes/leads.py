from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.lead import Lead
from app.models.budget import Budget
from app.models.client import Client
from app.models.user import User
from app.schemas.lead import LeadCreate, LeadUpdate, LeadMoveRequest

router = APIRouter(prefix="/api/leads", tags=["leads"])


def _serialize_lead(l: Lead) -> dict:
    return {
        "id": l.id,
        "name": l.name,
        "phone": l.phone,
        "email": l.email,
        "event_date": l.event_date.isoformat() if l.event_date else None,
        "event_type": l.event_type,
        "estimated_value": float(l.estimated_value or 0),
        "notes": l.notes,
        "stage_id": l.stage_id,
        "pipeline_id": l.pipeline_id,
        "client_id": l.client_id,
        "client": {"id": l.client.id, "name": l.client.name} if l.client else None,
        "theme": {"id": l.theme.id, "name": l.theme.name, "emoji": l.theme.emoji, "color": l.theme.color} if l.theme else None,
        "position": l.position,
        "created_at": l.created_at.isoformat(),
    }


@router.get("")
def list_leads(pipeline_id: int | None = None, stage_id: int | None = None, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    query = db.query(Lead).filter(Lead.tenant_id == user.tenant_id)
    if pipeline_id:
        query = query.filter(Lead.pipeline_id == pipeline_id)
    if stage_id:
        query = query.filter(Lead.stage_id == stage_id)
    leads = query.order_by(Lead.position, Lead.created_at.desc()).all()
    return [_serialize_lead(l) for l in leads]


@router.post("")
def create_lead(data: LeadCreate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    lead = Lead(tenant_id=user.tenant_id, **data.model_dump())
    db.add(lead)
    db.commit()
    db.refresh(lead)
    return _serialize_lead(lead)


@router.get("/{lead_id}")
def get_lead(lead_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    lead = db.query(Lead).filter(Lead.id == lead_id, Lead.tenant_id == user.tenant_id).first()
    if not lead:
        raise HTTPException(status_code=404, detail="Lead não encontrado")
    return _serialize_lead(lead)


@router.put("/{lead_id}")
def update_lead(lead_id: int, data: LeadUpdate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    lead = db.query(Lead).filter(Lead.id == lead_id, Lead.tenant_id == user.tenant_id).first()
    if not lead:
        raise HTTPException(status_code=404, detail="Lead não encontrado")
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(lead, key, value)
    db.commit()
    db.refresh(lead)
    return _serialize_lead(lead)


@router.patch("/{lead_id}/move")
def move_lead(lead_id: int, data: LeadMoveRequest, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    lead = db.query(Lead).filter(Lead.id == lead_id, Lead.tenant_id == user.tenant_id).first()
    if not lead:
        raise HTTPException(status_code=404, detail="Lead não encontrado")
    lead.stage_id = data.stage_id
    lead.position = data.position
    db.commit()
    db.refresh(lead)
    return _serialize_lead(lead)


@router.delete("/{lead_id}", status_code=204)
def delete_lead(lead_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    lead = db.query(Lead).filter(Lead.id == lead_id, Lead.tenant_id == user.tenant_id).first()
    if not lead:
        raise HTTPException(status_code=404, detail="Lead não encontrado")
    db.delete(lead)
    db.commit()


@router.post("/{lead_id}/convert")
def convert_lead(lead_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    lead = db.query(Lead).filter(Lead.id == lead_id, Lead.tenant_id == user.tenant_id).first()
    if not lead:
        raise HTTPException(status_code=404, detail="Lead não encontrado")

    # Create or link client
    client_id = lead.client_id
    if not client_id and lead.name:
        client = Client(
            tenant_id=user.tenant_id,
            name=lead.name,
            phone=lead.phone,
            email=lead.email,
        )
        db.add(client)
        db.flush()
        client_id = client.id
        lead.client_id = client_id

    budget = Budget(
        tenant_id=user.tenant_id,
        client_id=client_id,
        theme_id=lead.theme_id,
        status="draft",
        event_date=lead.event_date,
    )
    db.add(budget)
    db.commit()
    db.refresh(budget)
    return {"budget_id": budget.id, "client_id": client_id}
