from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import or_

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.models.client import Client
from app.models.budget import Budget
from app.models.lead import Lead
from app.models.catalog_item import CatalogItem
from app.models.contract import Contract
from app.models.supplier import Supplier

router = APIRouter(prefix="/api/search", tags=["search"])


@router.get("")
def global_search(
    q: str = Query("", min_length=1),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    term = f"%{q}%"
    results = []

    # Clients
    clients = (
        db.query(Client)
        .filter(
            Client.tenant_id == user.tenant_id,
            or_(
                Client.name.ilike(term),
                Client.phone.ilike(term),
                Client.email.ilike(term),
            ),
        )
        .limit(5)
        .all()
    )
    for c in clients:
        results.append({
            "type": "client",
            "id": c.id,
            "name": c.name,
            "subtitle": c.phone or c.email or "",
        })

    # Budgets
    budgets = (
        db.query(Budget)
        .options(joinedload(Budget.client))
        .filter(
            Budget.tenant_id == user.tenant_id,
            or_(
                Budget.notes.ilike(term),
            ),
        )
        .limit(5)
        .all()
    )
    # Also search by client name
    budget_by_client = (
        db.query(Budget)
        .options(joinedload(Budget.client))
        .join(Client, Budget.client_id == Client.id)
        .filter(
            Budget.tenant_id == user.tenant_id,
            Client.name.ilike(term),
        )
        .limit(5)
        .all()
    )
    seen_budget_ids = set()
    for b in list(budgets) + list(budget_by_client):
        if b.id not in seen_budget_ids:
            seen_budget_ids.add(b.id)
            client_name = b.client.name if b.client else ""
            results.append({
                "type": "budget",
                "id": b.id,
                "name": f"Orçamento #{b.id}",
                "subtitle": f"{client_name} - {b.status}" if client_name else b.status,
            })
        if len(seen_budget_ids) >= 5:
            break

    # Leads
    leads = (
        db.query(Lead)
        .filter(
            Lead.tenant_id == user.tenant_id,
            or_(
                Lead.name.ilike(term),
                Lead.phone.ilike(term),
                Lead.email.ilike(term),
            ),
        )
        .limit(5)
        .all()
    )
    for l in leads:
        results.append({
            "type": "lead",
            "id": l.id,
            "name": l.name,
            "subtitle": l.event_type or "",
        })

    # Catalog items
    catalog = (
        db.query(CatalogItem)
        .filter(
            CatalogItem.tenant_id == user.tenant_id,
            CatalogItem.name.ilike(term),
        )
        .limit(5)
        .all()
    )
    for item in catalog:
        results.append({
            "type": "catalog",
            "id": item.id,
            "name": item.name,
            "subtitle": item.category or "",
        })

    # Contracts
    contracts = (
        db.query(Contract)
        .options(joinedload(Contract.client))
        .filter(
            Contract.tenant_id == user.tenant_id,
            or_(
                Contract.contract_number.ilike(term),
            ),
        )
        .limit(5)
        .all()
    )
    contract_by_client = (
        db.query(Contract)
        .options(joinedload(Contract.client))
        .join(Client, Contract.client_id == Client.id)
        .filter(
            Contract.tenant_id == user.tenant_id,
            Client.name.ilike(term),
        )
        .limit(5)
        .all()
    )
    seen_contract_ids = set()
    for c in list(contracts) + list(contract_by_client):
        if c.id not in seen_contract_ids:
            seen_contract_ids.add(c.id)
            client_name = c.client.name if c.client else ""
            results.append({
                "type": "contract",
                "id": c.id,
                "name": c.contract_number or f"Contrato #{c.id}",
                "subtitle": client_name,
            })
        if len(seen_contract_ids) >= 5:
            break

    # Suppliers
    suppliers = (
        db.query(Supplier)
        .filter(
            Supplier.tenant_id == user.tenant_id,
            Supplier.name.ilike(term),
        )
        .limit(5)
        .all()
    )
    for s in suppliers:
        results.append({
            "type": "supplier",
            "id": s.id,
            "name": s.name,
            "subtitle": s.category or "",
        })

    return results
