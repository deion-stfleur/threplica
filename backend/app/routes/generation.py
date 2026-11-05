"""Generation job creation routes."""

from __future__ import annotations

import random

from fastapi import APIRouter, File, Form, HTTPException, UploadFile
from fastapi import status

from app.constants import QUALITY_PRESETS
from app.schemas import GenerationAcceptedResponse
from app.services import job_service
from app.services.file_service import FileValidationError, create_job_id, save_upload_bytes
from app.services.trellis_service import trellis_service
from app.workers.generation_worker import generation_worker

router = APIRouter()


def _parse_bool(value: str | bool) -> bool:
    if isinstance(value, bool):
        return value
    return str(value).strip().lower() in {"1", "true", "yes", "on"}


@router.post(
    "/generations",
    response_model=GenerationAcceptedResponse,
    status_code=status.HTTP_202_ACCEPTED,
)
async def create_generation(
    image: UploadFile = File(...),
    quality: str = Form("standard"),
    seed: str | None = Form(None),
    remove_background: str = Form("true"),
) -> GenerationAcceptedResponse:
    if not trellis_service.is_ready():
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Generator is starting. Please try again shortly.",
        )

    quality_key = (quality or "standard").strip().lower()
    if quality_key not in QUALITY_PRESETS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Unsupported quality preset. Use preview, standard, or high.",
        )

    resolved_seed: int
    if seed is None or str(seed).strip() == "":
        resolved_seed = random.randint(0, 2_147_483_647)
    else:
        try:
            resolved_seed = int(str(seed).strip())
        except ValueError as exc:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Seed must be an integer.",
            ) from exc

    remove_bg = _parse_bool(remove_background)
    job_id = create_job_id()
    raw = await image.read()

    try:
        upload_path = save_upload_bytes(raw, job_id, image.content_type)
    except FileValidationError as exc:
        raise HTTPException(status_code=exc.status_code, detail=exc.detail) from exc

    job = job_service.create_job(
        job_id=job_id,
        quality=quality_key,
        seed=resolved_seed,
        remove_background=remove_bg,
        upload_path=upload_path,
    )

    generation_worker.enqueue(job_id)

    return GenerationAcceptedResponse(
        job_id=job["job_id"],
        status=job["status"],
        message=job["message"],
        created_at=job["created_at"],
    )
