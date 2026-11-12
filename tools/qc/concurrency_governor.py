"""Concurrency governor for CC scene generation (video-slowfix phase2, task 2.1).

Single source of truth for scene-generation concurrency:

- ``ConcurrencyGovernor`` wraps a ``threading.BoundedSemaphore`` with explicit
  ``permits_reserved`` tracking. On an HTTP 429 burst,
  ``handle_rate_limit_burst`` reserves up to 2 permits non-blocking (throttling
  6 -> 4); ``check_restore`` releases only the exact number of permits that
  were actually acquired once the cooldown elapses — eliminating
  ``ValueError: Semaphore released too many times``.
- ``probe_anthropic_tier`` / ``resolve_max_concurrency`` pick the startup
  ceiling: Anthropic API key Tier 4+ -> 6, OAuth subscription (claude CLI) or
  unknown/unprobeable -> safe default 4. ``OM_MAX_CONCURRENCY`` overrides the
  probe (rollback: ``OM_MAX_CONCURRENCY=2``).

The probe is best-effort with a hard timeout and never raises: a probe
failure must never crash orchestrator startup.
"""

from __future__ import annotations

import logging
import os
import threading
import time
import urllib.request
from collections.abc import Mapping

# Task 2.1 step 1: credential-driven base concurrency.
TIER4_MAX_CONCURRENCY = 6   # Anthropic API key Tier 4+ (TPM limit 150k-300k)
DEFAULT_MAX_CONCURRENCY = 4  # OAuth subscription / unknown / unprobeable

# Best-effort probe: never let a slow endpoint stall startup.
ANTHROPIC_TIER_PROBE_TIMEOUT_S = 3.0
# Tier 4 == 4,000 requests/min on the Anthropic rate-limit header.
TIER4_MIN_REQUESTS_PER_MIN = 4000

ENV_MAX_CONCURRENCY = "OM_MAX_CONCURRENCY"

# Task 2.1 (review fix 5): per-process memo of the *probe tier* so repeat
# resolve calls (orchestrator banner, governor construction, wrapper governor
# init) never re-run the ~3s network probe. The env check itself stays live on
# every call — OM_MAX_CONCURRENCY must keep winning dynamically. Explicit
# ``probe`` args bypass the cache so tests stay deterministic.
_TIER_CACHE: str | None = None


class ConcurrencyGovernor:
    """BoundedSemaphore with safe permit reservation on rate-limit bursts."""

    def __init__(self, max_concurrency: int = 6, cooldown_seconds: float = 300.0):
        self.max_concurrency = max_concurrency
        self.sem = threading.BoundedSemaphore(max_concurrency)
        self.cooldown_seconds = cooldown_seconds
        self.throttled = False
        self.permits_reserved = 0
        self.last_throttled_at = 0.0
        self.lock = threading.Lock()

    def check_restore(self):
        with self.lock:
            if self.throttled and (time.time() - self.last_throttled_at >= self.cooldown_seconds):
                if self.permits_reserved > 0:
                    for _ in range(self.permits_reserved):
                        self.sem.release()
                    logging.info(f"Rate limit cooldown complete: restored {self.permits_reserved} permits")
                self.permits_reserved = 0
                self.throttled = False

    def acquire(self):
        self.check_restore()
        self.sem.acquire()

    def release(self):
        self.sem.release()
        self.check_restore()

    def handle_rate_limit_burst(self):
        with self.lock:
            now = time.time()
            if not self.throttled and self.max_concurrency >= 6:
                # Non-blocking acquisition to reserve up to 2 permits safely
                acquired = sum(1 for _ in range(2) if self.sem.acquire(blocking=False))
                self.permits_reserved = acquired
                self.throttled = True
                self.last_throttled_at = now
                logging.warning(
                    f"Burst 429 detected: throttled concurrency from 6 to {6 - acquired} "
                    f"(reserved {acquired} permits) for {self.cooldown_seconds}s"
                )


def _fetch_rate_limit_header(api_key: str, timeout: float) -> str | None:
    """Lightweight authenticated GET; returns the requests-per-minute header.

    Raises on any transport failure — callers must treat this as best-effort.
    """
    req = urllib.request.Request(
        "https://api.anthropic.com/v1/models",
        headers={"x-api-key": api_key, "anthropic-version": "2023-06-01"},
    )
    with urllib.request.urlopen(req, timeout=timeout) as resp:  # noqa: S310 - fixed API host
        return resp.headers.get("anthropic-ratelimit-requests-limit")


def probe_anthropic_tier(
    timeout: float = ANTHROPIC_TIER_PROBE_TIMEOUT_S,
    env: Mapping[str, str] | None = None,
) -> str:
    """Best-effort Anthropic credential tier probe. Never raises.

    Returns one of:
    - ``"tier4"``   — API key whose rate-limit header reports Tier 4+ (>= 4000 RPM)
    - ``"api-key"`` — API key on a lower tier
    - ``"oauth"``   — no API key (claude CLI subscription path)
    - ``"unknown"`` — probe failed, timed out, or the header was missing/unparseable
    """
    env = os.environ if env is None else env
    api_key = (env.get("ANTHROPIC_API_KEY") or "").strip()
    if not api_key:
        # claude CLI subscription (OAuth) path — not probeable via API key.
        return "oauth"
    try:
        header = _fetch_rate_limit_header(api_key, timeout)
    except Exception:
        return "unknown"
    if not header or not header.strip().isdigit():
        return "unknown"
    return "tier4" if int(header) >= TIER4_MIN_REQUESTS_PER_MIN else "api-key"


def resolve_max_concurrency(
    env: Mapping[str, str] | None = None,
    probe=None,
) -> tuple[int, str]:
    """Resolve the orchestrator's concurrency ceiling. Returns ``(value, source)``.

    Precedence: ``OM_MAX_CONCURRENCY`` env override (rollback value: 2) wins on
    every call; otherwise the credential probe decides (Tier 4+ -> 6, anything
    else -> 4). The probe tier is memoized per process — at most one network
    probe per process; explicit ``probe`` args bypass the cache.
    """
    global _TIER_CACHE
    env = os.environ if env is None else env
    raw = (env.get(ENV_MAX_CONCURRENCY) or "").strip()
    if raw:
        try:
            value = int(raw)
            if value >= 1:
                return value, f"env:{ENV_MAX_CONCURRENCY}"
            logging.warning("%s=%s must be >= 1; ignoring", ENV_MAX_CONCURRENCY, raw)
        except ValueError:
            logging.warning("%s=%r is not an integer; ignoring", ENV_MAX_CONCURRENCY, raw)
    if probe is not None:
        tier = probe()
    else:
        if _TIER_CACHE is None:
            _TIER_CACHE = probe_anthropic_tier()
        tier = _TIER_CACHE
    if tier == "tier4":
        return TIER4_MAX_CONCURRENCY, "probe:tier4"
    return DEFAULT_MAX_CONCURRENCY, f"probe:{tier}"
