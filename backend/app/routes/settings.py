from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.fixed_cost import FixedCost
from app.models.tenant_settings import TenantSettings
from app.models.user import User
from app.schemas.settings import FixedCostCreate, FixedCostResponse, TenantSettingsResponse, TenantSettingsUpdate

router = APIRouter(prefix="/api/settings", tags=["settings"])


@router.get("", response_model=TenantSettingsResponse)
def get_settings(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    s = db.query(TenantSettings).filter(TenantSettings.tenant_id == user.tenant_id).first()
    if not s:
        s = TenantSettings(tenant_id=user.tenant_id)
        db.add(s)
        db.commit()
        db.refresh(s)
    return s


@router.put("", response_model=TenantSettingsResponse)
def update_settings(data: TenantSettingsUpdate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    s = db.query(TenantSettings).filter(TenantSettings.tenant_id == user.tenant_id).first()
    if not s:
        s = TenantSettings(tenant_id=user.tenant_id)
        db.add(s)
        db.flush()
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(s, key, value)
    db.commit()
    db.refresh(s)
    return s


@router.get("/fixed-costs", response_model=list[FixedCostResponse])
def list_fixed_costs(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    return db.query(FixedCost).filter(FixedCost.tenant_id == user.tenant_id).order_by(FixedCost.name).all()


@router.post("/fixed-costs", response_model=FixedCostResponse)
def create_fixed_cost(data: FixedCostCreate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    fc = FixedCost(tenant_id=user.tenant_id, **data.model_dump())
    db.add(fc)
    db.commit()
    db.refresh(fc)
    return fc


@router.put("/fixed-costs/{fc_id}", response_model=FixedCostResponse)
def update_fixed_cost(fc_id: int, data: FixedCostCreate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    fc = db.query(FixedCost).filter(FixedCost.id == fc_id, FixedCost.tenant_id == user.tenant_id).first()
    if not fc:
        raise HTTPException(status_code=404, detail="Custo fixo não encontrado")
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(fc, key, value)
    db.commit()
    db.refresh(fc)
    return fc


@router.delete("/fixed-costs/{fc_id}", status_code=204)
def delete_fixed_cost(fc_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    fc = db.query(FixedCost).filter(FixedCost.id == fc_id, FixedCost.tenant_id == user.tenant_id).first()
    if not fc:
        raise HTTPException(status_code=404, detail="Custo fixo não encontrado")
    db.delete(fc)
    db.commit()
