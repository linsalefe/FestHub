import os
import shutil

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
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


UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "uploads", "logos")
ALLOWED_EXTENSIONS = {".png", ".jpg", ".jpeg"}
MAX_SIZE = 5 * 1024 * 1024  # 5MB


@router.post("/upload-logo")
async def upload_logo(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    # Validate extension
    ext = os.path.splitext(file.filename or "")[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=400, detail="Formato inválido. Use PNG ou JPG.")

    # Validate size
    contents = await file.read()
    if len(contents) > MAX_SIZE:
        raise HTTPException(status_code=400, detail="Arquivo muito grande. Máximo 5MB.")

    # Save file
    os.makedirs(UPLOAD_DIR, exist_ok=True)
    filename = f"{user.tenant_id}_logo{ext}"
    filepath = os.path.join(UPLOAD_DIR, filename)

    # Remove old logo files for this tenant
    for old_ext in ALLOWED_EXTENSIONS:
        old_path = os.path.join(UPLOAD_DIR, f"{user.tenant_id}_logo{old_ext}")
        if os.path.exists(old_path):
            os.remove(old_path)

    with open(filepath, "wb") as f:
        f.write(contents)

    # Update settings
    logo_url = f"/uploads/logos/{filename}"
    s = db.query(TenantSettings).filter(TenantSettings.tenant_id == user.tenant_id).first()
    if not s:
        s = TenantSettings(tenant_id=user.tenant_id)
        db.add(s)
    s.company_logo = logo_url
    db.commit()

    return {"logo_url": logo_url}


@router.delete("/logo", status_code=204)
def delete_logo(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    # Remove file
    for ext in ALLOWED_EXTENSIONS:
        path = os.path.join(UPLOAD_DIR, f"{user.tenant_id}_logo{ext}")
        if os.path.exists(path):
            os.remove(path)

    # Clear settings
    s = db.query(TenantSettings).filter(TenantSettings.tenant_id == user.tenant_id).first()
    if s:
        s.company_logo = None
        db.commit()
