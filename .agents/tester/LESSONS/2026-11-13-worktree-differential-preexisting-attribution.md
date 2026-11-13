# 2026-11-13 — Pre-existing-failure attribution without stash (concurrent-reader-safe)

Engagement: Phase 4C restore-seals verification (see
RESULTS/2026-11-13-phase4c-restore-seals-verification.md).

**Pattern:** when a claim says "these N failures are pre-existing, not caused by my diff",
prove it by differential, not assumption. On this run, other workers were concurrently
READ-ONLY on the same tree — `git stash -u` would yank the files out from under them
(new untracked files vanish mid-run). Safe alternative:

```
git worktree add --detach /tmp/om-<run>-head HEAD
cd /tmp/om-<run>-head && /abs/path/to/main/repo/.venv/bin/python -m pytest <the failing node ids>
git worktree remove --force /tmp/om-<run>-head
```

**Gotchas learned:**
- Use the main repo's venv python by ABSOLUTE path; verify via assertion output paths that
  nothing resolved back into the main tree (`/private/tmp/om-.../...` observed — clean).
- A fresh HEAD worktree lacks untracked/ignored working-tree artifacts, so docs-vs-disk
  tests trip on DIFFERENT missing files than in the main tree. Same failure class still
  proves pre-existing; state the caveat honestly and check the class + file overlap with
  the change set instead of demanding identical assertion text.
- Verify the failing tests reference areas untouched by the change set (read the failure
  output; quote the JSON path / gitignored asset path) — that is the second, independent leg
  of attribution.
- Discovery of failure identity without a whole-tree run: grep tests/ by the claim's subject
  matter (inventory/docs JSON/mp4/render keywords) → run candidate files individually.
  This run: claim described the failures well enough that 2 candidates reproduced exactly.

**Also learned:** ad-hoc "neighbor run" claims (e.g. "134 passed") without an exact command
are not reproducible — derive natural candidate sets, report each with counts, mark AMBIGUOUS
rather than fabricating a match. Ask the claimant for the exact command.
