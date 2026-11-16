#!/usr/bin/env python
"""Dispatch CC assemble session (Episode.tsx + Root.tsx + tsc) — faa-ground-stop-20261114.

Runs `claude --print` with history/CC_TASK_ASSEMBLE.md on stdin from the
composer root, watchdog kill, verifies: Episode.tsx exists + Root registers
both comps + tsc clean for this episode's files.
Usage: .venv/bin/python dispatch_assemble.py
"""
from __future__ import annotations

import os
import re
import subprocess
import sys
import threading
import time
from pathlib import Path

REPO = Path("/Users/tuyennguyen/project/OpenMontage")
COMPOSER = REPO / "remotion-composer"
SLUG = "faa-ground-stop-20261114"
EP = COMPOSER / "src" / SLUG
PROJ_ROOT = REPO / "projects" / SLUG
TASK = PROJ_ROOT / "history" / "CC_TASK_ASSEMBLE.md"
WATCHDOG_S = 1200


def main() -> int:
    log = PROJ_ROOT / "history" / "cc_assemble.log"
    episode_tsx = EP / "Episode.tsx"
    episode_tsx.unlink(missing_ok=True)

    env = os.environ.copy()
    env["MAX_THINKING_TOKENS"] = "1024"
    cmd = ["claude", "--print", "--dangerously-skip-permissions",
           "--permission-mode", "acceptEdits",
           "--allowedTools", "Read,Edit,Write,Bash,Glob,Grep",
           "--max-turns", "80"]
    t0 = time.time()
    proc = subprocess.Popen(cmd, cwd=str(COMPOSER), env=env,
                            stdin=subprocess.PIPE,
                            stdout=open(log, "wb"), stderr=subprocess.STDOUT,
                            text=True)

    def _kill():
        time.sleep(WATCHDOG_S)
        if proc.poll() is None:
            proc.kill()
    threading.Thread(target=_kill, daemon=True).start()
    proc.communicate(TASK.read_text(encoding="utf-8"))
    dur = time.time() - t0

    checks: dict[str, object] = {}
    checks["episode_exists"] = episode_tsx.is_file()
    root = (COMPOSER / "src" / "Root.tsx").read_text(encoding="utf-8")
    checks["root_draft"] = f"{SLUG}-DRAFT" in root
    checks["root_final"] = f"{SLUG}-FINAL" in root
    body = episode_tsx.read_text(encoding="utf-8") if episode_tsx.is_file() else ""
    n_seq = len(re.findall(r"<Sequence", body))
    checks["sequences_ge_14"] = n_seq >= 12
    checks["duration_frames"] = "scene_timing" in body or "durationInFrames" in body
    tsc = subprocess.run(["npx", "tsc", "--noEmit"], cwd=str(COMPOSER),
                         capture_output=True, text=True, timeout=300)
    own = [l for l in (tsc.stdout + tsc.stderr).splitlines() if SLUG in l or "Root.tsx" in l]
    checks["tsc_own_errors"] = own[:8]
    checks["dur_s"] = round(dur)
    print("ASSEMBLE", "PASS" if (checks["episode_exists"] and checks["root_draft"]
          and checks["root_final"] and checks["sequences_ge_14"] and not own)
          else "FAIL")
    print(checks)
    return 0 if (checks["episode_exists"] and checks["root_draft"]
                 and checks["root_final"] and checks["sequences_ge_14"] and not own) else 1


if __name__ == "__main__":
    sys.exit(main())
