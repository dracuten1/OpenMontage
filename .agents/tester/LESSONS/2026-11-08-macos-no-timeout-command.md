# macOS: no `timeout`/`gtimeout` — use Python subprocess wrapper

**Date:** 2026-11-08
**Context:** OpenMontage diagnosis run — worker could not execute the mandated
`timeout 300 <cmd>` wrapper: `/bin/sh: timeout: command not found` (exit 127).
`gtimeout` (coreutils) also absent. Host is macOS; GNU coreutils not installed.

**Fix (command-level timeout layer, no repo files written):**

```bash
.venv/bin/python -c "
import subprocess,sys
cmd=[sys.executable,'-m','pytest','<args>']
try:
    r=subprocess.run(cmd,timeout=300); print('EXIT',r.returncode); sys.exit(r.returncode)
except subprocess.TimeoutExpired:
    print('RESULT: TIMEOUT'); sys.exit(124)
"
```

- `subprocess.run(..., timeout=N)` kills the child on expiry and raises
  `TimeoutExpired` → exit 124 preserved, matching the `timeout` contract.
- Satisfies Layer 1 (command-level) of the dual-layer timeout rule when the
  shell `timeout` binary is unavailable.

**Rule for dispatch messages to this repo:** never assume `timeout`/`gtimeout`
exists on this host; embed the Python wrapper form in the strict template.
