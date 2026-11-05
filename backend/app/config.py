"""Application configuration loaded from environment variables."""

from pathlib import Path

from dotenv import load_dotenv
import os

load_dotenv()

BASE_DIR = Path(__file__).resolve().parent.parent


def _bool(value: str, default: bool = False) -> bool:
    if value is None:
        return default
    return value.strip().lower() in {"1", "true", "yes", "on"}


APP_ENV = os.getenv("APP_ENV", "development")
FRONTEND_ORIGIN = os.getenv("FRONTEND_ORIGIN", "http://localhost:5173")
_extra_origins = [
    origin.strip()
    for origin in os.getenv("FRONTEND_ORIGINS", "").split(",")
    if origin.strip()
]
CORS_ORIGINS = list(dict.fromkeys([FRONTEND_ORIGIN, *_extra_origins]))
PUBLIC_BASE_URL = os.getenv("PUBLIC_BASE_URL", "http://localhost:8000").rstrip("/")
STORAGE_ROOT = Path(os.getenv("STORAGE_ROOT", str(BASE_DIR / "storage"))).resolve()
MAX_UPLOAD_MB = int(os.getenv("MAX_UPLOAD_MB", "10"))
TRELLIS_MOCK_MODE = _bool(os.getenv("TRELLIS_MOCK_MODE"), default=True)
TRELLIS_REPO_PATH = os.getenv("TRELLIS_REPO_PATH", "/workspace/TRELLIS.2")
TRELLIS_MODEL_ID = os.getenv("TRELLIS_MODEL_ID", "microsoft/TRELLIS.2-4B")
HF_TOKEN = os.getenv("HF_TOKEN", "")

UPLOADS_DIR = STORAGE_ROOT / "uploads"
MODELS_DIR = STORAGE_ROOT / "models"
POSTERS_DIR = STORAGE_ROOT / "posters"
JOBS_DIR = STORAGE_ROOT / "jobs"


def ensure_storage_dirs() -> None:
    """Create storage directories if they do not exist."""
    for directory in (UPLOADS_DIR, MODELS_DIR, POSTERS_DIR, JOBS_DIR):
        directory.mkdir(parents=True, exist_ok=True)
