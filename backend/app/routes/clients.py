from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.client import Client
from app.models.user import User
from app.schemas.client import ClientCreate, ClientResponse, ClientUpdate

router = APIRouter(prefix="/api/clients", tags=["clients"])


@router.get("", response_model=list[ClientResponse])
def list_clients(q: str | None = None, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    query = db.query(Client).filter(Client.tenant_id == user.tenant_id)
    if q:
        query = query.filter(Client.name.ilike(f"%{q}%"))
    return query.order_by(Client.name).all()


@router.post("", response_model=ClientResponse)
def create_client(data: ClientCreate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    client = Client(tenant_id=user.tenant_id, **data.model_dump())
    db.add(client)
    db.commit()
    db.refresh(client)
    return client


@router.put("/{client_id}", response_model=ClientResponse)
def update_client(client_id: int, data: ClientUpdate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    client = db.query(Client).filter(Client.id == client_id, Client.tenant_id == user.tenant_id).first()
    if not client:
        raise HTTPException(status_code=404, detail="Cliente não encontrado")
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(client, key, value)
    db.commit()
    db.refresh(client)
    return client


@router.delete("/{client_id}", status_code=204)
def delete_client(client_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    client = db.query(Client).filter(Client.id == client_id, Client.tenant_id == user.tenant_id).first()
    if not client:
        raise HTTPException(status_code=404, detail="Cliente não encontrado")
    db.delete(client)
    db.commit()
