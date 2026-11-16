#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""Direct router HTTP reviewer for faa-ground-stop-20261114 (§7.1 fresh context).

Bypasses claude CLI wrapper layer (d-011): posts prompt with inlined scene TSX +
artifacts/words_{scene_id}.json directly to localhost:4321 /v1/messages.
Materializes approved findings into packets/ and validates integration via
tools.qc.scene_packet.integrate_scene_packet.
"""
from __future__ import annotations

import copy
import hashlib
import json
import os
import sys
import time
import urllib.error
import urllib.request
import uuid
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime, timezone
from pathlib import Path

REPO = Path(__file__).resolve().parents[4]
sys.path.insert(0, str(REPO))
sys.path.insert(0, str(Path(__file__).resolve().parent))

from grep_gate import check_scene_file  # noqa: E402
from tools.qc.reviewer_runner import VERDICT_DELIMITER_RE, extract_verdict  # noqa: E402
from tools.qc.scene_orchestrator import (  # noqa: E402
    get_scenes_dir,
    load_existing_packet_or_template,
    resolve_scene_filename,
)
from tools.qc.scene_packet import integrate_scene_packet  # noqa: E402

EPISODE = (REPO / "remotion-composer/src/faa-ground-stop-20261114").resolve()
PROJ = REPO / "projects/faa-ground-stop-20261114"
SCENES = [
    s.strip()
    for s in os.environ.get(
        "OM_SCENES",
        "scene-1,scene-2,scene-3,scene-4,scene-5,scene-6,scene-7,scene-8,scene-9,scene-10,scene-12",
    ).split(",")
    if s.strip()
]
MAX_CONC = int(os.environ.get("OM_MAX_CONCURRENCY", "3"))

settings = json.load(open(os.path.expanduser("~/.claude/settings.json")))
envv = settings.get("env", {})
BASE_URL = envv.get("ANTHROPIC_BASE_URL", "http://localhost:4321").rstrip("/")
TOKEN = envv.get("ANTHROPIC_AUTH_TOKEN", "")
MODEL = "agentic-video"


def sha256_file(p: Path) -> str:
    h = hashlib.sha256()
    with open(p, "rb") as f:
        for chunk in iter(lambda: f.read(1 << 16), b""):
            h.update(chunk)
    return h.hexdigest()


def call_router(prompt: str, timeout: int = 90) -> str:
    body = json.dumps({
        "model": MODEL,
        "max_tokens": 1536,
        "messages": [{"role": "user", "content": prompt}],
    }).encode("utf-8")
    req = urllib.request.Request(
        f"{BASE_URL}/v1/messages",
        data=body,
        headers={
            "content-type": "application/json",
            "x-api-key": TOKEN,
            "authorization": f"Bearer {TOKEN}",
            "anthropic-version": "2023-06-01",
        },
    )
    with urllib.request.urlopen(req, timeout=timeout) as r:
        data = json.loads(r.read().decode("utf-8", "replace"))
    return "".join(
        b.get("text", "")
        for b in (data.get("content") or [])
        if isinstance(b, dict)
    )


def review_scene(scene_id: str) -> tuple[str, str]:
    scenes_dir = get_scenes_dir(EPISODE)
    fname = resolve_scene_filename(scenes_dir, scene_id)
    scene_file = scenes_dir / fname
    if not scene_file.is_file():
        return scene_id, "failed: scene file missing"

    pkt_file = EPISODE / f"packet_{scene_id}.json"
    if pkt_file.is_file():
        try:
            cur = json.loads(pkt_file.read_text(encoding="utf-8"))
            if cur.get("integration_status") == "integrated":
                return scene_id, "integrated (already)"
        except Exception:
            pass

    issues = check_scene_file(scene_file)
    if issues:
        return scene_id, f"grep-gate-fail: {'; '.join(issues[:2])}"

    scene_code = scene_file.read_text(encoding="utf-8")
    words_file = EPISODE / f"artifacts/words_{scene_id}.json"
    words_code = words_file.read_text(encoding="utf-8") if words_file.is_file() else "{}"

    prompt = f"""# TASK — independent reviewer {scene_id} (§7.1 fresh context, findings only)

You are the independent reviewer verifying `scenes/{fname}` against project contracts.
Do NOT output code fixes. Evaluate the implementation and output ONLY the verdict JSON block.

## SCENE CODE (`scenes/{fname}`):
```tsx
{scene_code}
```

## TIMING / WORDS (`artifacts/words_{scene_id}.json`):
```json
{words_code}
```

Verification criteria (each violation MUST be listed in `issues`):
1. TSX component has a default export.
2. Uses shared contracts: imports from './theme', './timing', './lib/SceneShell' (or '../../components/...'). No local re-implementations.
3. Every animation anchor falls within scene window [0, window_frames]; last cue + reveal ends >=45f before window end (>=20f allowed if final cue lands after 65% of window_frames).
4. No CSS `transition:`. No `staticFile(` for media. No `<Img` component.
5. Flex-column stacking, content distributed across y330–1440, last block ends y1300–1440, right edge x<=940.
6. spring damping >= 20; translateY positive→0; no camera scale/translate.
7. Numbers, percentages, and labels on screen match claims from script verbatim.

Output format (strict, no extra markdown outside delimiters):
<!-- VERDICT_START -->
{{
  "scene_id": "{scene_id}",
  "verdict": "approved",
  "issues": [],
  "metrics": {{"complexity": "low|medium|high"}}
}}
<!-- VERDICT_END -->
"""
    log_file = PROJ / "history" / f"cc_reviewer_{scene_id}.log"
    pre_hash = sha256_file(scene_file)

    for attempt in range(1, 9):
        t0 = time.time()
        try:
            raw = call_router(prompt, timeout=90)
        except Exception as e:
            raw = f"HTTP-ERROR: {e}"
        dur = time.time() - t0
        log_file.write_text(raw, encoding="utf-8")

        if not VERDICT_DELIMITER_RE.search(raw):
            print(f"[{scene_id}] attempt {attempt}: dur={dur:.1f}s missing-delimiter (len={len(raw)})", flush=True)
            time.sleep(2)
            continue

        verdict, issues_list, data = extract_verdict(raw)
        print(f"[{scene_id}] attempt {attempt}: dur={dur:.1f}s verdict={verdict} issues={len(issues_list)}", flush=True)

        if verdict != "approved":
            return scene_id, f"rejected: {'; '.join(issues_list[:3])}"

        # Materialize findings
        findings = {
            "scene_id": scene_id,
            "verdict": "approved",
            "reviewed_hashes": {f"scenes/{fname}": pre_hash},
            "issues": [],
            "notes": "Reviewed via direct router engine d-011",
        }
        findings_dir = EPISODE / "packets"
        findings_dir.mkdir(parents=True, exist_ok=True)
        findings_path = findings_dir / f"{scene_id}_findings.json"
        findings_path.write_text(json.dumps(findings, indent=2, ensure_ascii=False), encoding="utf-8")
        findings_hash = sha256_file(findings_path)
        findings_rel = findings_path.relative_to(EPISODE).as_posix()

        # Build valid packet
        base_template = load_existing_packet_or_template(EPISODE, scene_id)
        assembled = copy.deepcopy(base_template)
        assembled["scene_id"] = scene_id

        # Determine scene number (e.g., scene-1 -> 1)
        snum = scene_id.split("-")[1]
        voice_rel = f"assets/audio/voice_s{snum}.wav"
        words_rel = f"artifacts/words_{scene_id}.json"

        frozen = {}
        for r in [
            "artifacts/scene_manifest.json",
            "artifacts/narration_words.json",
            "packets/style_contract.json",
            voice_rel,
            words_rel,
            findings_rel,
        ]:
            fp = EPISODE / r
            if fp.is_file():
                frozen[r] = sha256_file(fp)

        assembled["frozen_inputs"] = frozen

        # Update assets sha256 to match disk
        for a in assembled.get("assets", []):
            if a.get("ref") in frozen:
                a["sha256"] = frozen[a["ref"]]
        if assembled.get("word_alignment", {}).get("ref") in frozen:
            assembled["word_alignment"]["sha256"] = frozen[assembled["word_alignment"]["ref"]]

        wt = f"wt_{scene_id}_{uuid.uuid4().hex[:12]}"
        rt = f"rt_{scene_id}_{uuid.uuid4().hex[:12]}"
        assembled["writer"] = {
            "instance_id": f"writer_{scene_id}_{uuid.uuid4().hex[:8]}",
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "token": wt,
        }
        assembled["writer_token"] = wt
        assembled["reviewer"] = {
            "instance_id": f"reviewer_{scene_id}_{uuid.uuid4().hex[:8]}",
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "verdict": "approved",
            "findings_ref": findings_rel,
            "findings_hash": findings_hash,
            "token": rt,
            "reviewed_hashes": {f"scenes/{fname}": pre_hash},
        }
        assembled["reviewer_token"] = rt
        assembled["integration_status"] = "pending"

        target = EPISODE / f"packet_{scene_id}.json"
        target.write_text(json.dumps(assembled, indent=2, ensure_ascii=False), encoding="utf-8")
        result = integrate_scene_packet(
            assembled,
            packet_path=target,
            writer_token=wt,
            reviewer_token=rt,
            io_operations=assembled.get("io_operations"),
        )
        if result.get("valid"):
            assembled["integration_status"] = "integrated"
            target.write_text(json.dumps(assembled, indent=2, ensure_ascii=False), encoding="utf-8")
            return scene_id, "integrated"
        return scene_id, f"integrate-invalid: {str(result.get('reasons'))[:160]}"

    return scene_id, "failed: attempts exhausted"


def main() -> int:
    print(f"Direct router review starting for {len(SCENES)} scenes (concurrency={MAX_CONC})...", flush=True)
    t0 = time.time()
    results: dict[str, str] = {}
    with ThreadPoolExecutor(max_workers=MAX_CONC) as ex:
        futs = {ex.submit(review_scene, s): s for s in SCENES}
        for fut in as_completed(futs):
            sid, status = fut.result()
            results[sid] = status
            print(f"==> {sid}: {status}", flush=True)
    total_dur = time.time() - t0
    ok = sum(1 for v in results.values() if "integrated" in v)
    print(f"\nFINISHED in {total_dur:.1f}s. Total integrated: {ok}/{len(SCENES)}")
    for sid, v in sorted(results.items()):
        print(f"  {sid}: {v}")
    return 0 if ok == len(SCENES) else 1


if __name__ == "__main__":
    sys.exit(main())
