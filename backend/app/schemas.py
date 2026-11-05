"""Shared response schemas for SpatialForge API."""

from typing import Optional

from pydantic import BaseModel


class HealthResponse(BaseModel):
    status: str
    gpu_available: bool
    model_loaded: bool
    active_job: bool


class GenerationAcceptedResponse(BaseModel):
    job_id: str
    status: str
    message: str
    created_at: str


class JobStatusResponse(BaseModel):
    job_id: str
    status: str
    progress: int
    message: str
    seed: Optional[int] = None
    created_at: str
    updated_at: str
    model_url: Optional[str] = None
    download_url: Optional[str] = None
    error: Optional[str] = None
