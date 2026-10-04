# Test Packs — OpenMontage (ad-hoc, read-only acceptance)

No pack scripts are stored in the repo (read-only engagement). Packs are inline command
groups dispatched to workers; definitions live in the RESULTS report for the run.
| Pack | Type | Scope | Last Run | Status |
|------|------|-------|----------|--------|
| media_integrity_acceptance | acceptance | ffprobe gate, decode integrity, audio clarity ×3 windows on renders/final.mp4 | 2026-10-03 | PASS |
| artifacts_checkpoints_acceptance | acceptance | 7 artifact schema gates + 6 checkpoint gates + approval flags | 2026-10-03 | PASS |
| sync_consistency_acceptance | acceptance | cuts contiguity, narration sync ±0.5s, asset refs, cue order, render_report vs actual | 2026-10-03 | PASS |
| frames_stagedmedia_acceptance | acceptance | scene_{1..5}_mid.png non-black, staged narration/music, image byte-match | 2026-10-03 | PASS |
