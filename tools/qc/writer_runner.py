"""Shared CC writer run logic (video-slowfix phase2, task 2.2).

Single source of truth for transient API error detection and the jittered
exponential backoff loop around the ``claude`` writer invocation. Consumed by
``projects/*/scripts/cc_pipeline/writer_wrapper.py``; on a 429 burst the loop
asks the shared ``ConcurrencyGovernor`` to reserve permits (throttle 6 -> 4)
before backing off.

Backoff schedule per plan: max 4 attempts, sleep ``(2 ** attempt) * 2.0 +
uniform(0.5, 2.5)`` seconds between attempts.
"""

from __future__ import annotations

import logging
import random
import subprocess
import threading
import time

# Task 2.2: rate-limit and capacity errors worth retrying with backoff.
TRANSIENT_API_ERROR_MARKERS = [
    "rate_limit_error", "429 Too Many Requests",
    "overloaded_error", "529 Site Overloaded",
    "ServiceUnavailable", "capacity exceeded",
]


def is_transient_api_error(output_str: str) -> bool:
    """Detect API rate-limit / capacity errors in writer CLI output."""
    return any(m.lower() in (output_str or "").lower() for m in TRANSIENT_API_ERROR_MARKERS)


def execute_writer_with_backoff(cmd, cwd, env, task, governor, max_attempts=4,
                                watchdog_seconds=None, on_retry=None):
    """Run the writer CLI with jittered exponential backoff on transient errors.

    Returns ``(returncode, stdout)`` of the last attempt; on exhausted retries
    returns ``(1, "Exhausted retries on API errors")``. Each transient failure
    notifies the governor's ``handle_rate_limit_burst`` so the shared semaphore
    throttles concurrent workers for the cooldown window.

    Optional integrations (plan-default behavior when omitted):
    - ``watchdog_seconds``: per-attempt kill timer (phase 1 task 1.4 heritage —
      a hung CLI session inside a retry must not wedge the wrapper forever).
    - ``on_retry``: zero-arg callback invoked before each re-attempt; the
      wrapper uses it to reset the per-attempt sandbox so retries start fresh
      (phase 1 task 1.3: "retries start fresh").
    """
    for attempt in range(1, max_attempts + 1):
        proc = subprocess.Popen(cmd, cwd=cwd, env=env, stdin=subprocess.PIPE,
                                stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True)
        if watchdog_seconds is not None:
            def _kill(proc=proc):
                time.sleep(watchdog_seconds)
                if proc.poll() is None:
                    proc.kill()
            threading.Thread(target=_kill, daemon=True).start()
        stdout, _ = proc.communicate(task)
        if proc.returncode != 0 and is_transient_api_error(stdout):
            governor.handle_rate_limit_burst()
            sleep_s = (2 ** attempt) * 2.0 + random.uniform(0.5, 2.5)
            logging.warning(f"Transient API error on attempt {attempt}; sleeping {sleep_s:.1f}s before retry")
            if on_retry is not None:
                try:
                    on_retry()
                except Exception as e:  # cleanup must never mask the retry itself
                    logging.warning(f"on_retry callback failed (non-fatal): {e}")
            time.sleep(sleep_s)
            continue
        return proc.returncode, stdout
    return 1, "Exhausted retries on API errors"
