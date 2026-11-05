"""Shared constants for job progress and quality presets."""

from typing import Any

JOB_PROGRESS = {
    "queued": 5,
    "preprocessing": 15,
    "generating_shape": 35,
    "generating_texture": 70,
    "exporting": 90,
    "completed": 100,
    "failed": 0,
}

JOB_MESSAGES = {
    "queued": "Your model is waiting to start.",
    "preprocessing": "Preparing your image.",
    "generating_shape": "Building the 3D geometry.",
    "generating_texture": "Creating the materials and textures.",
    "exporting": "Packaging the model for the web.",
    "completed": "Your 3D model is ready.",
    "failed": "The model could not be generated.",
}

QUALITY_PRESETS: dict[str, dict[str, Any]] = {
    "preview": {
        "resolution": 512,
        "textureSize": 1024,
        "decimationTarget": 50000,
    },
    "standard": {
        "resolution": 512,
        "textureSize": 2048,
        "decimationTarget": 100000,
    },
    "high": {
        "resolution": 1024,
        "textureSize": 2048,
        "decimationTarget": 150000,
    },
}

ALLOWED_IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp"}
ALLOWED_IMAGE_MIME_TYPES = {"image/jpeg", "image/png", "image/webp"}

# Mock-mode stage delays from job start (seconds)
MOCK_STAGE_TIMING = [
    (1.0, "preprocessing"),
    (2.0, "generating_shape"),
    (4.0, "generating_texture"),
    (6.0, "exporting"),
    (7.0, "completed"),
]
