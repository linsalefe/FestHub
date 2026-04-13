from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.pipeline import Pipeline, PipelineStage
from app.models.lead import Lead
from app.models.user import User
from app.schemas.pipeline import (
    PipelineCreate, PipelineUpdate, PipelineResponse,
    PipelineStageCreate, PipelineStageUpdate, PipelineStageResponse,
    StageReorderRequest,
)

router = APIRouter(prefix="/api/pipelines", tags=["pipelines"])


def _serialize_pipeline(p: Pipeline, db: Session) -> dict:
    stages = []
    for s in sorted(p.stages, key=lambda x: x.position):
        count = db.query(Lead).filter(Lead.stage_id == s.id).count()
        stages.append({
            "id": s.id, "name": s.name, "color": s.color,
            "position": s.position, "leads_count": count,
        })
    return {
        "id": p.id, "name": p.name, "is_default": p.is_default,
        "stages": stages,
    }


@router.get("")
def list_pipelines(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    pipelines = db.query(Pipeline).filter(Pipeline.tenant_id == user.tenant_id).all()
    return [_serialize_pipeline(p, db) for p in pipelines]


@router.post("")
def create_pipeline(data: PipelineCreate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    p = Pipeline(tenant_id=user.tenant_id, name=data.name)
    db.add(p)
    db.flush()
    if data.stages:
        for s in data.stages:
            db.add(PipelineStage(pipeline_id=p.id, name=s.name, color=s.color, position=s.position))
    db.commit()
    db.refresh(p)
    return _serialize_pipeline(p, db)


@router.get("/{pipeline_id}")
def get_pipeline(pipeline_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    p = db.query(Pipeline).filter(Pipeline.id == pipeline_id, Pipeline.tenant_id == user.tenant_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Pipeline não encontrado")
    return _serialize_pipeline(p, db)


@router.put("/{pipeline_id}")
def update_pipeline(pipeline_id: int, data: PipelineUpdate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    p = db.query(Pipeline).filter(Pipeline.id == pipeline_id, Pipeline.tenant_id == user.tenant_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Pipeline não encontrado")
    p.name = data.name
    db.commit()
    return _serialize_pipeline(p, db)


@router.delete("/{pipeline_id}", status_code=204)
def delete_pipeline(pipeline_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    p = db.query(Pipeline).filter(Pipeline.id == pipeline_id, Pipeline.tenant_id == user.tenant_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Pipeline não encontrado")
    db.delete(p)
    db.commit()


@router.post("/{pipeline_id}/stages")
def add_stage(pipeline_id: int, data: PipelineStageCreate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    p = db.query(Pipeline).filter(Pipeline.id == pipeline_id, Pipeline.tenant_id == user.tenant_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Pipeline não encontrado")
    s = PipelineStage(pipeline_id=pipeline_id, name=data.name, color=data.color, position=data.position)
    db.add(s)
    db.commit()
    db.refresh(s)
    return {"id": s.id, "name": s.name, "color": s.color, "position": s.position, "leads_count": 0}


@router.put("/{pipeline_id}/stages/{stage_id}")
def update_stage(pipeline_id: int, stage_id: int, data: PipelineStageUpdate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    p = db.query(Pipeline).filter(Pipeline.id == pipeline_id, Pipeline.tenant_id == user.tenant_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Pipeline não encontrado")
    s = db.query(PipelineStage).filter(PipelineStage.id == stage_id, PipelineStage.pipeline_id == pipeline_id).first()
    if not s:
        raise HTTPException(status_code=404, detail="Stage não encontrado")
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(s, key, value)
    db.commit()
    db.refresh(s)
    count = db.query(Lead).filter(Lead.stage_id == s.id).count()
    return {"id": s.id, "name": s.name, "color": s.color, "position": s.position, "leads_count": count}


@router.delete("/{pipeline_id}/stages/{stage_id}", status_code=204)
def delete_stage(pipeline_id: int, stage_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    p = db.query(Pipeline).filter(Pipeline.id == pipeline_id, Pipeline.tenant_id == user.tenant_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Pipeline não encontrado")
    s = db.query(PipelineStage).filter(PipelineStage.id == stage_id, PipelineStage.pipeline_id == pipeline_id).first()
    if not s:
        raise HTTPException(status_code=404, detail="Stage não encontrado")
    db.delete(s)
    db.commit()


@router.put("/{pipeline_id}/stages/reorder")
def reorder_stages(pipeline_id: int, data: StageReorderRequest, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    p = db.query(Pipeline).filter(Pipeline.id == pipeline_id, Pipeline.tenant_id == user.tenant_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Pipeline não encontrado")
    for item in data.stages:
        s = db.query(PipelineStage).filter(PipelineStage.id == item.id, PipelineStage.pipeline_id == pipeline_id).first()
        if s:
            s.position = item.position
    db.commit()
    return _serialize_pipeline(p, db)
