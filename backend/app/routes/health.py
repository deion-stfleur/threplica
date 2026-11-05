"""Health check endpoint."""

from fastapi import APIRouter

from app.schemas import HealthResponse
from app.services.trellis_service import trellis_service

router = APIRouter()


@router.get("/health", response_model=HealthResponse)
def get_health() -> HealthResponse:
    """Return generator readiness without exposing sensitive GPU details."""
    return HealthResponse(
        status="ok",
        gpu_available=trellis_service.gpu_available(),
        model_loaded=trellis_service.is_ready(),
        active_job=trellis_service.has_active_job(),
    )
