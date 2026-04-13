from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.core.database import Base, engine
from app.routes import (
    auth, budgets, catalog, clients, dashboard,
    settings as settings_routes, themes,
    pipeline, leads, packages, suppliers, calendar, checklist, users,
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Import all models so metadata knows about them
    import app.models  # noqa: F401
    Base.metadata.create_all(bind=engine)
    yield


app = FastAPI(title=settings.APP_NAME, lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(clients.router)
app.include_router(catalog.router)
app.include_router(themes.router)
app.include_router(budgets.router)
app.include_router(dashboard.router)
app.include_router(settings_routes.router)
app.include_router(pipeline.router)
app.include_router(leads.router)
app.include_router(packages.router)
app.include_router(suppliers.router)
app.include_router(calendar.router)
app.include_router(checklist.router)
app.include_router(users.router)


@app.get("/api/health")
def health():
    return {"status": "ok", "app": "Île Magique"}
