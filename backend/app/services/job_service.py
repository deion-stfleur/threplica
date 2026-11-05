"""Job state persistence as JSON files on disk."""

from __future__ import annotations

import json
import os
import tempfile
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Optional

from app import config
from app.constants import JOB_MESSAGES, JOB_PROGRESS, QUALITY_PRESETS
from app.services.file_service import is_valid_job_id


class JobNotFoundError(Exception):
    pass


class JobValidationError(Exception):
    def __init__(self, detail: str):
        self.detail = detail
        super().__init__(detail)


def _now_iso() -> str:
    return (
        datetime.now(timezone.utc)
        .replace(microsecond=0)
        .isoformat()
        .replace("+00:00", "Z")
    )


def job_file_path(job_id: str) -> Path:
    if not is_valid_job_id(job_id):
        raise JobValidationError("Invalid job id.")
    return config.JOBS_DIR / f"{job_id}.json"


def _atomic_write(path: Path, payload: dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    fd, tmp_name = tempfile.mkstemp(
        prefix=f".{path.stem}.",
        suffix=".tmp",
        dir=path.parent,
    )
    try:
        with os.fdopen(fd, "w", encoding="utf-8") as handle:
            json.dump(payload, handle, indent=2)
            handle.write("\n")
            handle.flush()
            os.fsync(handle.fileno())
        os.replace(tmp_name, path)
    finally:
        if os.path.exists(tmp_name):
            try:
                os.unlink(tmp_name)
            except OSError:
                pass


def _relative_to_backend(path: Path) -> str:
    try:
        return str(path.resolve().relative_to(config.BASE_DIR))
    except ValueError:
        return str(path.resolve())


def create_job(
    *,
    job_id: str,
    quality: str,
    seed: int,
    remove_background: bool,
    upload_path: Path,
) -> dict[str, Any]:
    if quality not in QUALITY_PRESETS:
        raise JobValidationError("Unsupported quality preset.")

    now = _now_iso()
    job = {
        "job_id": job_id,
        "status": "queued",
        "progress": JOB_PROGRESS["queued"],
        "message": JOB_MESSAGES["queued"],
        "quality": quality,
        "seed": seed,
        "remove_background": remove_background,
        "settings_used": QUALITY_PRESETS[quality],
        "upload_path": _relative_to_backend(upload_path),
        "model_path": None,
        "error": None,
        "created_at": now,
        "updated_at": now,
    }
    _atomic_write(job_file_path(job_id), job)
    return job


def read_job(job_id: str) -> dict[str, Any]:
    if not is_valid_job_id(job_id):
        raise JobValidationError("Invalid job id.")

    path = job_file_path(job_id)
    if not path.exists():
        raise JobNotFoundError(job_id)

    with path.open("r", encoding="utf-8") as handle:
        return json.load(handle)


def update_job(job_id: str, **changes: Any) -> dict[str, Any]:
    job = read_job(job_id)
    job.update(changes)
    job["updated_at"] = _now_iso()

    status = job.get("status")
    if status in JOB_PROGRESS and "progress" not in changes:
        job["progress"] = JOB_PROGRESS[status]
    if status in JOB_MESSAGES and "message" not in changes:
        job["message"] = JOB_MESSAGES[status]

    _atomic_write(job_file_path(job_id), job)
    return job


def set_job_status(
    job_id: str,
    status: str,
    *,
    error: Optional[str] = None,
    model_path: Optional[str] = None,
) -> dict[str, Any]:
    changes: dict[str, Any] = {
        "status": status,
        "progress": JOB_PROGRESS.get(status, 0),
        "message": JOB_MESSAGES.get(status, ""),
    }
    if error is not None:
        changes["error"] = error
    if model_path is not None:
        changes["model_path"] = model_path
    return update_job(job_id, **changes)


def resolve_stored_path(stored: str) -> Path:
    path = Path(stored)
    if path.is_absolute():
        return path
    return (config.BASE_DIR / path).resolve()


def to_public_response(job: dict[str, Any]) -> dict[str, Any]:
    """Shape a stored job into the public API response."""
    job_id = job["job_id"]
    status = job["status"]
    response = {
        "job_id": job_id,
        "status": status,
        "progress": job.get("progress", JOB_PROGRESS.get(status, 0)),
        "message": job.get("message", JOB_MESSAGES.get(status, "")),
        "seed": job.get("seed"),
        "created_at": job["created_at"],
        "updated_at": job["updated_at"],
        "model_url": None,
        "download_url": None,
        "error": job.get("error"),
    }

    if status == "completed" and job.get("model_path"):
        response["model_url"] = f"{config.PUBLIC_BASE_URL}/models/{job_id}.glb"
        response["download_url"] = (
            f"{config.PUBLIC_BASE_URL}/api/jobs/{job_id}/download"
        )

    return response
