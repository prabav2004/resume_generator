import hashlib
import json
import logging
import re
import threading
import time
from collections.abc import Callable
from dataclasses import dataclass
from typing import TypeVar

from openai import RateLimitError

from app.utils.exceptions import AppError

logger = logging.getLogger(__name__)

T = TypeVar("T")


def stable_request_key(stage: str, payload: dict) -> str:
    serialized = json.dumps(payload, sort_keys=True, default=str, separators=(",", ":"))
    digest = hashlib.sha256(serialized.encode("utf-8")).hexdigest()
    return f"{stage}:{digest}"


@dataclass
class _CachedResult:
    value: object
    expires_at: float


class RequestDeduplicator:
    def __init__(self, ttl_seconds: int = 120) -> None:
        self.ttl_seconds = ttl_seconds
        self._lock = threading.Lock()
        self._inflight: dict[str, threading.Event] = {}
        self._results: dict[str, _CachedResult] = {}
        self._errors: dict[str, BaseException] = {}

    def run(self, key: str, factory: Callable[[], T]) -> T:
        now = time.monotonic()
        with self._lock:
            cached = self._results.get(key)
            if cached and cached.expires_at > now:
                logger.info("Reusing cached LLM result for key=%s", key)
                return cached.value  # type: ignore[return-value]

            event = self._inflight.get(key)
            if event is None:
                event = threading.Event()
                self._inflight[key] = event
                owner = True
            else:
                owner = False

        if not owner:
            logger.info("Waiting for in-flight LLM request key=%s", key)
            event.wait()
            with self._lock:
                cached = self._results.get(key)
                if cached and cached.expires_at > time.monotonic():
                    return cached.value  # type: ignore[return-value]
                error = self._errors.get(key)
            if error:
                raise error
            raise AppError("Duplicate request finished without a reusable result.", status_code=503, code="llm_request_unavailable")

        try:
            result = factory()
            with self._lock:
                self._results[key] = _CachedResult(result, time.monotonic() + self.ttl_seconds)
                self._errors.pop(key, None)
            return result
        except BaseException as exc:
            with self._lock:
                self._errors[key] = exc
            raise
        finally:
            with self._lock:
                self._inflight.pop(key, None)
                event.set()


def is_rate_limit_error(exc: BaseException) -> bool:
    if isinstance(exc, RateLimitError):
        return True
    text = str(exc).lower()
    return "rate limit" in text or "too many requests" in text or "429" in text


def is_schema_error(exc: BaseException) -> bool:
    text = str(exc).lower()
    return any(marker in text for marker in (
        "structured", "schema", "validation", "does not match",
        "json_validate_failed", "expected object", "invalid json",
        "failed_generation", "invalid_request_error",
    ))


def retry_after_seconds(exc: BaseException, fallback: float = 15.0) -> float:
    response = getattr(exc, "response", None)
    headers = getattr(response, "headers", None)
    if headers:
        retry_after = headers.get("retry-after") or headers.get("Retry-After")
        if retry_after:
            try:
                return max(0.0, float(retry_after))
            except ValueError:
                pass

    match = re.search(r"try again in\s+([0-9.]+)\s*s", str(exc), re.IGNORECASE)
    if match:
        return max(0.0, float(match.group(1)))

    return fallback
