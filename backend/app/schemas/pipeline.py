from pydantic import BaseModel


class PipelineStageCreate(BaseModel):
    name: str
    color: str = "#4A5BA8"
    position: int = 0


class PipelineStageUpdate(BaseModel):
    name: str | None = None
    color: str | None = None
    position: int | None = None


class PipelineStageResponse(BaseModel):
    id: int
    name: str
    color: str
    position: int
    leads_count: int = 0

    model_config = {"from_attributes": True}


class PipelineCreate(BaseModel):
    name: str
    stages: list[PipelineStageCreate] | None = None


class PipelineUpdate(BaseModel):
    name: str


class PipelineResponse(BaseModel):
    id: int
    name: str
    is_default: bool
    stages: list[PipelineStageResponse] = []

    model_config = {"from_attributes": True}


class StageReorderItem(BaseModel):
    id: int
    position: int


class StageReorderRequest(BaseModel):
    stages: list[StageReorderItem]
