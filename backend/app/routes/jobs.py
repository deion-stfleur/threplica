"""Job status and download routes."""

from __future__ import annotations

from pathlib import Path

from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse

from app import config
from app.schemas import JobStatusResponse
from app.services import job_service
from app.services.file_service import FileValidationError, is_valid_job_id, model_path_for_job
from app.services.job_service import JobNotFoundError, JobValidationError

router = APIRouter()


@router.get("/jobs/{job_id}", response_model=JobStatusResponse)
def get_job(job_id: str) -> JobStatusResponse:
    if not is_valid_job_id(job_id):
        raise HTTPException(status_code=400, detail="Invalid job id.")

    try:
        job = job_service.read_job(job_id)
    except JobNotFoundError as exc:
        raise HTTPException(status_code=404, detail="Job not found.") from exc
    except JobValidationError as exc:
        raise HTTPException(status_code=400, detail=exc.detail) from exc

    return JobStatusResponse(**job_service.to_public_response(job))


@router.get("/jobs/{job_id}/download")
def download_job_model(job_id: str):
    if not is_valid_job_id(job_id):
        raise HTTPException(status_code=400, detail="Invalid job id.")

    try:
        job = job_service.read_job(job_id)
    except JobNotFoundError as exc:
        raise HTTPException(status_code=404, detail="Job not found.") from exc

    if job.get("status") != "completed":
        raise HTTPException(status_code=409, detail="Model is not ready for download.")

    try:
        path = model_path_for_job(job_id)
    except FileValidationError as exc:
        raise HTTPException(status_code=exc.status_code, detail=exc.detail) from exc

    if not path.exists():
        # Fall back to stored model_path if present
        stored = job.get("model_path")
        if stored:
            candidate = Path(stored)
            if not candidate.is_absolute():
                candidate = (config.BASE_DIR / candidate).resolve()
            path = candidate

    if not path.exists():
        raise HTTPException(status_code=404, detail="Model file not found.")

    return FileResponse(
        path=path,
        media_type="model/gltf-binary",
        filename=f"spatialforge-{job_id}.glb",
        headers={
            "Content-Disposition": f'attachment; filename="spatialforge-{job_id}.glb"'
        },
    )
