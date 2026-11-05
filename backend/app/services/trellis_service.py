"""TRELLIS generation service with mock-mode support."""

from __future__ import annotations

from pathlib import Path
from typing import Any

from app import config
from app.constants import QUALITY_PRESETS
from app.services.file_service import copy_sample_model, ensure_sample_model


class TrellisService:
    """Tracks model-load state and runs generation (mock or real)."""

    def __init__(self) -> None:
        self._state = "not_loaded"
        self._active_job = False

    def load_model(self) -> None:
        """Load TRELLIS once at startup, or mark ready in mock mode."""
        if config.TRELLIS_MOCK_MODE:
            ensure_sample_model()
            self._state = "ready"
            return

        # Real TRELLIS loading will be implemented in Phase 7.
        self._state = "not_loaded"

    def is_ready(self) -> bool:
        return self._state == "ready"

    def gpu_available(self) -> bool:
        if config.TRELLIS_MOCK_MODE:
            return False
        return False

    def has_active_job(self) -> bool:
        return self._active_job

    def set_active_job(self, active: bool) -> None:
        self._active_job = active

    def get_state(self) -> str:
        return self._state

    def generate(
        self,
        image_path: str,
        output_path: str,
        quality: str,
        seed: int,
        remove_background: bool,
    ) -> dict[str, Any]:
        """Generate a GLB for the given image.

        Mock mode copies the sample model. Real TRELLIS arrives in Phase 7.
        """
        if quality not in QUALITY_PRESETS:
            quality = "standard"

        settings = QUALITY_PRESETS[quality]
        destination = Path(output_path)

        if config.TRELLIS_MOCK_MODE:
            copy_sample_model(destination)
            return {
                "output_path": str(destination),
                "seed": seed,
                "quality": quality,
                "settings_used": settings,
                "remove_background": remove_background,
                "mock": True,
                "source_image": image_path,
            }

        raise NotImplementedError(
            "Real TRELLIS generation is not implemented yet. "
            "Enable TRELLIS_MOCK_MODE=true or complete Phase 7."
        )


trellis_service = TrellisService()
