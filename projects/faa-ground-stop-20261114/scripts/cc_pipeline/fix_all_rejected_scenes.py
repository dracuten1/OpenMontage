#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""Iterative writer-repair loop for rejected scenes (faa-ground-stop-20261114).

Enforces strict governance:
- Complete design tokens provided to writer
- Writer fixes reviewer issues verbatim
- Mechanical grep-gate checked before reviewer
- Independent reviewer runs via direct router API (§7.1 fresh context)
- Approved packets materialized via integrate_scene_packet
"""
from __future__ import annotations

import json
import os
import re
import subprocess
import sys
import time
import urllib.request
from pathlib import Path

REPO = Path(__file__).resolve().parents[4]
sys.path.insert(0, str(REPO))
sys.path.insert(0, str(Path(__file__).resolve().parent))

from grep_gate import check_scene_file  # noqa: E402
import reviewer_direct_api as rda  # noqa: E402

EPISODE = (REPO / "remotion-composer/src/faa-ground-stop-20261114").resolve()
COMPOSER = REPO / "remotion-composer"

settings = json.load(open(os.path.expanduser("~/.claude/settings.json")))
envv = settings.get("env", {})
BASE_URL = envv.get("ANTHROPIC_BASE_URL", "http://localhost:4321").rstrip("/")
TOKEN = envv.get("ANTHROPIC_AUTH_TOKEN", "")
MODEL = "agentic-video"

DESIGN_TOKENS_DOC = """
THEME TOKENS AVAILABLE (from './theme'):
COLORS:
  slate: "#12161F", panel: "rgba(28, 36, 46, 0.94)", panelDeep: "rgba(18, 22, 31, 0.92)",
  ink: "#0D1116", inkDim: "rgba(185, 194, 204, 0.72)", paper: "#F2F5F9", text: "#F2F5F9",
  textLight: "#F2F5F9", white: "#FFFFFF", muted: "#B9C2CC", textMuted: "#B9C2CC",
  accent: "#F7C204", amber: "#F7C204", accentAmber: "#F7C204",
  danger: "#D90429", crimson: "#D90429", accentRed: "#D90429", ok: "#7CE38B",
  line: "rgba(215, 222, 232, 0.28)", accentLine: "rgba(247, 194, 4, 0.55)"
  (DO NOT USE colors that are not in this list, e.g. DO NOT use highlight, surface, textSecondary).

FONTS:
  body, sans, display, title, heading, serif: "'Be Vietnam Pro', 'Segoe UI', system-ui, sans-serif"
  mono, kicker: "'JetBrains Mono', 'SF Mono', Menlo, monospace"
  (DO NOT use FONTS.label).

SAFE:
  kickerTop: 240, contentTop: 330, contentBottom: 1440, lastBlockMin: 1300,
  gapMin: 18, marginX: 60, rightRail: 140, maxW: 880, heroTop: 400

SCENE SHELL COMPONENTS (from './lib/SceneShell'):
  SceneShell ({ children })
  SlateBackdrop ({ opacity?: number })
  HeroImg ({ img?: string, name?: string, top?: number, size?: number, style?: React.CSSProperties })
  KickerChip ({ text?: string, label?: string, frame?: number })
  BrandTag ({ frame?: number, label?: string })
  SceneTitle ({ text?: string, title?: string, frame?: number, top?: number })
  CutoutLayer ({ src: string, enterFrame: number, width: number, left: number | string, top: number | string, rotate?: number, shadow?: boolean })
  HighlighterTitle ({ title: string, enterFrame: number, wipeFrame?: number, accent?: string, color?: string, fontSize?: number })
"""

SCENE_INITIAL_ISSUES = {
    4: [
        "Layout uses absolute positioning instead of required flex-column stacking (contract 5)",
        "Last content block ends at ~y1180, missing required y1300–1440 range (contract 5)",
        "Cutout s4_planes_row at y690 occluded behind opaque chart card (top 430, minHeight 560) and chip (top 1040)",
    ],
    5: [
        "Leftover probe code at lines 20-24 (_probeSafe, _probeCutVal) causes TypeScript typecheck failure.",
        "Content not structured as single flex-column stack across y330–1440; fact rows and cutout use separate absolute divs risking text wrap overlap.",
        "Fact rows width (1080 - SAFE.left - SAFE.right) extends past mandated x<=940 right boundary when SAFE.right is 60.",
    ],
    8: [
        "Content lacks vertical distribution; Block D ends at ~y1250, failing required range y1300–1440.",
        "Container uses 'right: SAFE.marginX' setting right edge to x=1010, violating limit x<=940.",
        "HISTORY_ROWS row 3 dur text '≥2H · HỒI TỪNG BƯỚC ĐẾN 23H ET' not in script verbatim.",
    ],
    9: [
        "Layout overflow: Budget chip top 1316 + height ~210px ends at y1526. Violates y1300-1440 bottom boundary.",
        "Script mismatch: Timeline dot 4 displays '11/2026 GROUND STOP TOÀN QUỐC' at frame 456 (word 'Quốc hội'). Script has no Ground Stop or 11/2026 claim in Scene 9. Timeline dots must match audio cues exactly.",
        "Inverted timeline layout and active index: DOTS[0] is Reagan (cue 208) and DOTS[1] is Newark (cue 100). Newark appears at frame 100 under blank gap; Reagan fills top slot later at frame 208. activeIdx dim logic inverts, dimming Reagan during Reagan narration.",
    ],
    10: [
        "Row 2 content violates contract §7: 'SFO: BAY ĐI HAWAII + Á LẠI TỪ TỐI QUA' not in voiceover script. Audio speaks about du học sinh and transit passengers from frame 218.",
        "Typo in row 3 value: 'CHÁP NỐI' violates verbatim script contract ('chắp nối').",
        "Layout violation §5: content flex column ends at ~y880 instead of y1300–1440, and collides with CutoutLayer placed at y690–1330.",
    ],
    12: [
        "Criterion 2: Missing import from './timing'. const FPS = 30 declared locally instead of imported from shared contract.",
        "Criterion 5: Flex-column stacking missing. Absolute positioning used. HeroImg (y690–1330) overlaps CtaPill (y1110–1160). Content empty across y330–690.",
        "Criterion 5: CtaPill ends at y1160. Last block must end within y1300–1440.",
        "Criterion 5: CtaPill right edge exceeds x<=940.",
    ],
}


def call_writer(prompt: str) -> str:
    body = json.dumps({
        "model": MODEL,
        "max_tokens": 4096,
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
    with urllib.request.urlopen(req, timeout=420) as r:
        data = json.loads(r.read().decode("utf-8", "replace"))
    text = "".join(b.get("text", "") for b in (data.get("content") or []) if isinstance(b, dict))
    m = re.search(r"```tsx\n(.*?)```", text, re.DOTALL) or re.search(r"```typescript\n(.*?)```", text, re.DOTALL)
    if not m:
        raise ValueError(f"No codeblock found: {text[:200]}")
    return m.group(1).strip()


def check_tsc(fname: str) -> list[str]:
    res = subprocess.run(
        ["npx", "tsc", "--noEmit"],
        cwd=str(COMPOSER),
        capture_output=True,
        text=True,
    )
    if res.returncode == 0:
        return []
    errs = [l for l in res.stdout.splitlines() if fname in l]
    return errs


def repair_scene(snum: int, issues: list[str]) -> bool:
    sid = f"scene-{snum}"
    fname = f"S{snum:02d}.tsx"
    scene_file = EPISODE / "scenes" / fname
    words_file = EPISODE / f"artifacts/words_{sid}.json"
    words_compact = EPISODE / f"artifacts/words_{sid}_compact.json"
    src = words_compact if words_compact.is_file() else words_file
    words_code = src.read_text(encoding="utf-8") if src.is_file() else "{}"

    current_issues = list(issues)

    for attempt in range(1, 4):
        print(f"\n--- [{sid}] WRITER ATTEMPT {attempt} ---", flush=True)
        current_code = scene_file.read_text(encoding="utf-8")
        prompt = f"""You are the Remotion TSX scene writer for OpenMontage.
Fix ALL reviewer issues for `scenes/{fname}`. Return ONLY complete valid TSX inside ```tsx ... ```.

## REVIEWER ISSUES TO FIX:
{json.dumps(current_issues, indent=2, ensure_ascii=False)}

## DESIGN TOKENS AND API CONTRACT:
{DESIGN_TOKENS_DOC}

## CURRENT CODE (`scenes/{fname}`):
```tsx
{current_code}
```

## WORDS & TIMING (`artifacts/words_{sid}.json`):
```json
{words_code}
```

## HARD CONSTRAINTS:
1. Export DEFAULT React component.
2. Must import from './theme', './timing', './lib/SceneShell'. DO NOT declare FPS locally; import FPS from './timing'.
3. Import Remotion utilities from 'remotion' (interpolate, spring, useCurrentFrame, useVideoConfig, AbsoluteFill, etc.).
4. ZERO CSS `transition:`, ZERO `staticFile(`, ZERO `<Img`.
5. Flex-column stacking inside SceneShell. Content distributed across y330–1440.
6. The VERY LAST content block MUST end within y1300–1440 (e.g. use an absolute container at bottom or flex spacer so the footer lands around y1320-1380).
7. Right edge of ALL elements must stay <= 940px (e.g. left: 70, width: 860).
8. Use ONLY colors and fonts from DESIGN TOKENS. DO NOT invent tokens like COLORS.highlight, COLORS.surface, etc.
9. Spring damping >= 20; translateY positive -> 0.
10. All numbers and Vietnamese text labels MUST match voiceover narration and claims exactly.

Return ONLY the TSX block.
"""
        t0 = time.time()
        try:
            new_code = call_writer(prompt)
        except Exception as e:
            print(f"[{sid}] writer call failed: {e}", flush=True)
            time.sleep(3)
            continue
        print(f"[{sid}] writer produced {len(new_code)} bytes in {time.time()-t0:.1f}s", flush=True)

        # Save to file
        os.chmod(scene_file, 0o644)
        scene_file.write_text(new_code + "\n", encoding="utf-8")

        # 1. Grep-gate check
        gate_errs = check_scene_file(scene_file)
        if gate_errs:
            print(f"[{sid}] grep-gate failed: {gate_errs}", flush=True)
            current_issues = [f"Mechanical grep-gate violation: {e}" for e in gate_errs]
            continue

        # 2. TSC check
        tsc_errs = check_tsc(fname)
        if tsc_errs:
            print(f"[{sid}] tsc failed: {tsc_errs[:2]}", flush=True)
            current_issues = [f"TypeScript compiler error: {e}" for e in tsc_errs[:3]]
            continue

        print(f"[{sid}] grep-gate PASS + tsc PASS. Invoking independent reviewer...", flush=True)

        # 3. Independent Reviewer call
        verdict_scene_id, status = rda.review_scene(sid)
        print(f"[{sid}] reviewer status: {status}", flush=True)
        if status == "integrated":
            return True
        elif "rejected:" in status:
            rev_issues = status.split("rejected:")[1].strip().split("; ")
            current_issues = rev_issues
        else:
            time.sleep(2)

    return False


def main() -> int:
    scenes_to_fix = [4, 5, 8, 9, 10, 12]
    print(f"Starting repair for {len(scenes_to_fix)} scenes: {scenes_to_fix}", flush=True)
    success = []
    failed = []

    for snum in scenes_to_fix:
        ok = repair_scene(snum, SCENE_INITIAL_ISSUES[snum])
        if ok:
            success.append(snum)
            print(f"===> SCENE {snum} FIXED AND INTEGRATED!\n", flush=True)
        else:
            failed.append(snum)
            print(f"===> SCENE {snum} FAILED REPAIR.\n", flush=True)

    print(f"\nRepair loop complete. Succeeded: {success}, Failed: {failed}")
    return 0 if not failed else 1


if __name__ == "__main__":
    sys.exit(main())
