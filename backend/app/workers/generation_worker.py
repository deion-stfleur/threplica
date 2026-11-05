"""Sequential background worker for generation jobs."""

from __future__ import annotations

import logging
import queue
import threading
import time
import traceback

from app import config
from app.constants import MOCK_STAGE_TIMING
from app.services import job_service
from app.services.file_service import model_path_for_job
from app.services.trellis_service import trellis_service

logger = logging.getLogger(__name__)


class GenerationWorker:
    """Processes generation jobs one at a time from an in-memory queue."""

    def __init__(self) -> None:
        self._queue: queue.Queue[str] = queue.Queue()
        self._thread: threading.Thread | None = None
        self._stop = threading.Event()

    def start(self) -> None:
        if self._thread and self._thread.is_alive():
            return
        self._stop.clear()
        self._thread = threading.Thread(
            target=self._run_loop,
            name="spatialforge-generation-worker",
            daemon=True,
        )
        self._thread.start()
        logger.info("Generation worker started")

    def stop(self) -> None:
        self._stop.set()
        self._queue.put("__stop__")
        if self._thread:
            self._thread.join(timeout=2)

    def enqueue(self, job_id: str) -> None:
        self._queue.put(job_id)

    def _run_loop(self) -> None:
        while not self._stop.is_set():
            job_id = self._queue.get()
            try:
                if job_id == "__stop__":
                    break
                self._process_job(job_id)
            finally:
                self._queue.task_done()

    def _process_job(self, job_id: str) -> None:
        trellis_service.set_active_job(True)
        started = time.monotonic()
        try:
            job = job_service.read_job(job_id)
            upload = job_service.resolve_stored_path(job["upload_path"])
            seed = int(job["seed"])
            quality = job["quality"]
            remove_background = bool(job.get("remove_background", True))
            output = model_path_for_job(job_id)

            for delay, status in MOCK_STAGE_TIMING:
                remaining = delay - (time.monotonic() - started)
                if remaining > 0:
                    time.sleep(remaining)

                if status == "exporting":
                    job_service.set_job_status(job_id, "exporting")
                    result = trellis_service.generate(
                        image_path=str(upload),
                        output_path=str(output),
                        quality=quality,
                        seed=seed,
                        remove_background=remove_background,
                    )
                    job_service.update_job(
                        job_id,
                        settings_used=result.get("settings_used"),
                    )
                elif status == "completed":
                    model_rel = str(output.resolve().relative_to(config.BASE_DIR))
                    job_service.set_job_status(
                        job_id,
                        "completed",
                        model_path=model_rel,
                    )
                    logger.info("Job %s completed", job_id)
                else:
                    job_service.set_job_status(job_id, status)
        except Exception as exc:  # noqa: BLE001 - convert to job failure
            logger.error("Job %s failed: %s\n%s", job_id, exc, traceback.format_exc())
            user_message = _user_facing_error(exc)
            try:
                job_service.set_job_status(job_id, "failed", error=user_message)
            except Exception:  # noqa: BLE001
                logger.exception("Could not persist failure for job %s", job_id)
        finally:
            trellis_service.set_active_job(False)


def _user_facing_error(exc: Exception) -> str:
    text = str(exc).lower()
    if "out of memory" in text or ("cuda" in text and "memory" in text):
        return (
            "The GPU ran out of memory while generating this model. "
            "Try the Preview quality setting."
        )
    if "sample" in text and "not found" in text:
        return "The sample model file is missing on the server."
    return "Generation failed while creating the 3D model."


generation_worker = GenerationWorker()
