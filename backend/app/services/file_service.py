"""Filesystem helpers for uploads and generated models."""

from __future__ import annotations

import shutil
import uuid
from pathlib import Path

from fastapi import UploadFile
from PIL import Image, ImageOps, UnidentifiedImageError

from app import config
from app.constants import ALLOWED_IMAGE_MIME_TYPES

MAX_IMAGE_DIMENSION = 8192


class FileValidationError(Exception):
    """Raised when an uploaded file fails validation."""

    def __init__(self, detail: str, status_code: int = 400):
        self.detail = detail
        self.status_code = status_code
        super().__init__(detail)


def create_job_id() -> str:
    return str(uuid.uuid4())


def is_valid_job_id(job_id: str) -> bool:
    try:
        uuid.UUID(job_id)
        return True
    except (ValueError, TypeError, AttributeError):
        return False


def extension_for_mime(mime_type: str) -> str:
    mapping = {
        "image/jpeg": ".jpg",
        "image/png": ".png",
        "image/webp": ".webp",
    }
    return mapping.get(mime_type, ".png")


def save_upload_bytes(
    raw: bytes,
    job_id: str,
    declared_type: str | None = None,
) -> Path:
    """Validate and store uploaded image bytes using a server-side filename."""
    if not is_valid_job_id(job_id):
        raise FileValidationError("Invalid job id.")

    max_bytes = config.MAX_UPLOAD_MB * 1024 * 1024
    if not raw:
        raise FileValidationError("The uploaded file is empty.")
    if len(raw) > max_bytes:
        raise FileValidationError(
            f"The uploaded image exceeds the {config.MAX_UPLOAD_MB} MB limit."
        )

    normalized_type = (declared_type or "").split(";")[0].strip().lower()
    if normalized_type and normalized_type not in ALLOWED_IMAGE_MIME_TYPES:
        raise FileValidationError("Unsupported image format.")

    from io import BytesIO

    try:
        with Image.open(BytesIO(raw)) as image:
            detected_format = (image.format or "").upper()
            image = ImageOps.exif_transpose(image)
            width, height = image.size
            if width > MAX_IMAGE_DIMENSION or height > MAX_IMAGE_DIMENSION:
                raise FileValidationError(
                    "The image dimensions are too large. Please use a smaller image."
                )

            format_to_mime = {
                "JPEG": "image/jpeg",
                "JPG": "image/jpeg",
                "PNG": "image/png",
                "WEBP": "image/webp",
            }
            mime_type = format_to_mime.get(detected_format)
            if mime_type is None:
                raise FileValidationError("Unsupported image format.")

            extension = extension_for_mime(mime_type)
            destination = config.UPLOADS_DIR / f"{job_id}{extension}"
            destination.parent.mkdir(parents=True, exist_ok=True)

            save_image = image.copy()
            if mime_type == "image/jpeg" and save_image.mode not in {"RGB", "L"}:
                save_image = save_image.convert("RGB")

            if mime_type == "image/jpeg":
                save_image.save(destination, format="JPEG", quality=95)
            elif mime_type == "image/png":
                save_image.save(destination, format="PNG")
            else:
                save_image.save(destination, format="WEBP")
    except FileValidationError:
        raise
    except UnidentifiedImageError as exc:
        raise FileValidationError("Unsupported image format.") from exc
    except OSError as exc:
        raise FileValidationError("The uploaded image could not be read.") from exc

    return destination


def save_upload(upload: UploadFile, job_id: str) -> Path:
    """Validate and store an uploaded image using a server-side filename."""
    raw = upload.file.read()
    return save_upload_bytes(raw, job_id, upload.content_type)


def model_path_for_job(job_id: str) -> Path:
    if not is_valid_job_id(job_id):
        raise FileValidationError("Invalid job id.")
    return config.MODELS_DIR / f"{job_id}.glb"


def safe_model_file(filename: str) -> Path:
    """Resolve a model filename under MODELS_DIR, rejecting path traversal."""
    if not filename or "/" in filename or "\\" in filename or ".." in filename:
        raise FileValidationError("Invalid model filename.", status_code=400)

    if not filename.lower().endswith(".glb"):
        raise FileValidationError("Invalid model filename.", status_code=400)

    models_root = config.MODELS_DIR.resolve()
    candidate = (models_root / filename).resolve()

    if candidate.parent != models_root:
        raise FileValidationError("Invalid model filename.", status_code=400)

    return candidate


def ensure_sample_model() -> Path:
    """Ensure a sample GLB exists for mock mode."""
    sample_dir = config.STORAGE_ROOT / "samples"
    sample_dir.mkdir(parents=True, exist_ok=True)
    sample_path = sample_dir / "sample-model.glb"

    if sample_path.exists() and sample_path.stat().st_size > 0:
        return sample_path

    frontend_sample = (
        config.BASE_DIR.parent / "frontend" / "public" / "sample-model.glb"
    )
    if frontend_sample.exists():
        shutil.copy2(frontend_sample, sample_path)
        return sample_path

    raise FileNotFoundError(
        "Sample GLB not found. Place sample-model.glb in "
        "backend/storage/samples/ or frontend/public/."
    )


def copy_sample_model(destination: Path) -> Path:
    sample = ensure_sample_model()
    destination.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(sample, destination)
    return destination
