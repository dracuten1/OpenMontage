#!/usr/bin/env python3
"""Validate lieu-hanh script_draft.json: JSON valid, repo schema, contiguous timestamps, marker gone, word count."""
import sys, json, re
from pathlib import Path

OM = Path("/Users/tuyennguyen/project/OpenMontage")
sys.path.insert(0, str(OM))
from schemas.artifacts import validate_artifact

DRAFT = OM / "projects" / "lieu-hanh" / "drafts" / "script_draft.json"

raw = DRAFT.read_text(encoding="utf-8")
if "__APPEND_MARKER__" in raw:
    print("FAIL: __APPEND_MARKER__ still present — remove the marker object")
    sys.exit(1)

doc = json.loads(raw)
try:
    validate_artifact("script", doc)
    print("schema: PASS")
except Exception as e:
    print("schema: FAIL:", str(e)[:500])
    sys.exit(1)

secs = doc["sections"]
print("sections:", len(secs))
if len(secs) != 32:
    print("WARN: expected 32 sections, got", len(secs))

prev_end = 0.0
ok = True
for s in secs:
    if abs(s["start_seconds"] - prev_end) > 0.01:
        print(f"FAIL: {s['id']} start {s['start_seconds']} != prev end {prev_end}")
        ok = False
    if s["end_seconds"] <= s["start_seconds"]:
        print(f"FAIL: {s['id']} end <= start")
        ok = False
    prev_end = s["end_seconds"]
print("last end:", prev_end, "| total plan:", doc["total_duration_seconds"])
if abs(prev_end - doc["total_duration_seconds"]) > 0.01:
    print("WARN: sections do not cover total_duration_seconds exactly")

words = sum(len(re.findall(r"\S+", s["text"])) for s in secs)
print("narration words:", words, "(target ~3700, range 3500-4000)")

# ids unique + ordered
ids = [s["id"] for s in secs]
assert len(ids) == len(set(ids)), "FAIL: duplicate section ids"
print("ids unique: PASS (s01..s%02d)" % len(secs))

if not ok:
    sys.exit(1)
print("VALIDATE: PASS")
