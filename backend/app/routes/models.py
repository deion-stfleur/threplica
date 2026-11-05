"""Static model file serving."""

from __future__ import annotations

from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse

from app.services.file_service import FileValidationError, safe_model_file

router = APIRouter()


@router.get("/models/{filename}")
def get_model_file(filename: str):
    try:
        path = safe_model_file(filename)
    except FileValidationError as exc:
        raise HTTPException(status_code=exc.status_code, detail=exc.detail) from exc

    if not path.exists():
        raise HTTPException(status_code=404, detail="Model file not found.")

    return FileResponse(
        path=path,
        media_type="model/gltf-binary",
        filename=filename,
    )
