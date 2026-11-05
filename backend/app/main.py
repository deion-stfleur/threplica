"""SpatialForge FastAPI application entry point."""

from contextlib import asynccontextmanager
import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app import config
from app.routes import generation, health, jobs, models
from app.services.trellis_service import trellis_service
from app.workers.generation_worker import generation_worker

logging.basicConfig(level=logging.INFO)


@asynccontextmanager
async def lifespan(app: FastAPI):
    config.ensure_storage_dirs()
    trellis_service.load_model()
    generation_worker.start()
    yield
    generation_worker.stop()


app = FastAPI(
    title="SpatialForge API",
    description="Image-to-3D generation API for SpatialForge.",
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=config.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router, prefix="/api", tags=["health"])
app.include_router(generation.router, prefix="/api", tags=["generation"])
app.include_router(jobs.router, prefix="/api", tags=["jobs"])
app.include_router(models.router, tags=["models"])


@app.get("/")
def root():
    return {
        "name": "SpatialForge API",
        "version": "0.1.0",
        "docs": "/docs",
        "health": "/api/health",
        "mock_mode": config.TRELLIS_MOCK_MODE,
    }
