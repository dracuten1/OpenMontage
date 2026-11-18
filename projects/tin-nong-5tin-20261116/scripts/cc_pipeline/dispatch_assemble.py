#!/usr/bin/env python
# PATCHED 18/11/2026: agy CLI thay claude (owner directive). Khong co --allowedTools/--max-turns trong agy; scope enforcement = wrapper verify (file that + grep gates) + task text.
# -*- coding: utf-8 -*-
"""Dispatch CC assemble session (Episode.tsx + Root.tsx + tsc) — self-locating (tự đúng slug theo __file__).
Usage: .venv/bin/python projects/<slug>/scripts/cc_pipeline/dispatch_assemble.py
"""
from __future__ import annotations
import json, os, re, subprocess, sys, threading, time
from pathlib import Path

REPO = Path(__file__).resolve().parents[4]  # repo root (self-locating, copy-trap fix 2026-11-18)
COMPOSER = REPO / "remotion-composer"
PROJ_ROOT = Path(__file__).resolve().parents[2]  # projects/<slug>
SLUG = PROJ_ROOT.name
assert (PROJ_ROOT / "scene_manifest.json").is_file(), (
    f"self-location failed: {PROJ_ROOT} has no scene_manifest.json — this file "
    "must live at projects/<slug>/scripts/cc_pipeline/ (copy the whole dir into "
    "the NEW project, it re-targets itself via __file__)")
EP = COMPOSER / "src" / SLUG
N_SCENES = len(json.loads((PROJ_ROOT / "assets" / "scene_timing.json")
                          .read_text(encoding="utf-8"))["sections"])
TASK = PROJ_ROOT / "history" / "CC_TASK_ASSEMBLE.md"
WATCHDOG_S = 1500

TASK_MD = """# TASK — CC assemble session: Episode.tsx + Root.tsx registration — __SLUG__

You are the assemble engineer (doctrine §7.1 final integration step). Episode dir:
`remotion-composer/src/__SLUG__` (cwd = remotion-composer). Scenes
`scenes/S01.tsx` … `scenes/S__NN__.tsx` already exist (default-export components Scene1..Scene__N__,
no props). timing.ts exports `SCENES`, `SCENE_ORDER`, `sceneRange`, `FPS`, `TOTAL_FRAMES`.

## Output files (ONLY these two + tsc fixes in own files)
1. Create `src/__SLUG__/Episode.tsx`:
   - `export const EpisodeTinNong3Tin112: React.FC<{ showHud?: boolean }> = ({ showHud = false }) => ...`
   - AbsoluteFill root, backgroundColor from theme COLORS.slate.
   - One `<Sequence>` per scene in SCENE_ORDER order: `from={t.start_frame}` `durationInFrames={t.duration_frames}`,
     with props-less `<SceneN />` inside. HUD: when showHud, render a small bottom-left text overlay
     per sequence: `S{n} f{localFrame} {localSeconds}s` — use a component reading useCurrentFrame() inside the Sequence.
   - Caption band: each scene already renders its own captions? NO — scenes do NOT render captions.
     Episode loads `public/__SLUG__/captions.json` (staticFile) ONCE via delayRender/continueRender
     or import at top-level with `staticFile`, builds a map section sN → caption list (seconds are scene-local),
     and passes `captions` prop to scenes? — Scenes have no props. Instead: render a single
     `<CaptionLayer captions={...}>` per scene Sequence computing scene-local time.
     SIMPLEST CORRECT: inside each Sequence, render `<SceneCaption secId="sN" />` where SceneCaption
     (defined in Episode.tsx) reads useCurrentFrame() (scene-local), finds the active caption from the
     loaded captions.json for that section, and renders it in the same style as lib/SceneShell CaptionLayer
     (top y1215, height 130, centered, bg rgba(11,14,20,0.86), border line, fontSize 34).
     Import CaptionLayer from `./src/__SLUG__/lib/SceneShell` if its props fit
     ({captions: {text,start,end}[]}) — it already reads useCurrentFrame() internally, so
     `<CaptionLayer captions={capsForSection} />` inside the Sequence is the preferred reuse.
   - `export const TOTAL_FRAMES` re-export from ./timing.
2. AUDIO inside the SAME composition (Remotion <Audio>, absolute imports from 'remotion'):
   - Per scene Sequence: `<Audio src={staticFile(`__SLUG__/audio/voice_s${n}.wav`)} />`
     (n = 1..__N__; voice duration ≈ scene window minus 0.8s tail — do NOT stretch).
   - Global BGM: `<Audio src={staticFile('__SLUG__/bgm.mp3')} loop volume={(f) => 0.12} />`
     spanning the whole composition (file copied to public/<slug>/bgm.mp3). Loop REQUIRED
     (bgm.mp3 is ~27s vs ~140s composition — without loop the render has a silent tail).
   - Block-transition SFX: use `../../public/sfx/` files via staticFile('sfx/<file>') — check existing
     `remotion-composer/public/sfx/` filenames with Glob first. Add a short whoosh/paper-slide SFX
     (volume 0.35) at the start_frame of scene-6, scene-10 and scene-15 Sequences (block boundaries).
3. Edit `src/Root.tsx`: add ONE import block for the episode + TWO `<Composition>` entries following the
   existing tai-chinh pattern:
   - id `__SLUG__-DRAFT`: component EpisodeTinNong3Tin112, 1080x1920@30,
     durationInFrames={tinNong3TinTotalFrames}, defaultProps={{ showHud: true }}
   - id `__SLUG__-FINAL`: same, defaultProps={{ showHud: false }}
3. Run `npx tsc --noEmit` from remotion-composer. FIX errors ONLY in
   src/__SLUG__/Episode.tsx and src/Root.tsx (import names/types).
   Errors elsewhere: report, do NOT edit.
4. Do NOT render. Do NOT create test files. Max 80 turns.

## Chunked writing rule
First Write <=60 lines, then Edit-append <=70 lines at `// __APPEND__` tail until complete.
"""
TASK_MD = (TASK_MD
           .replace("__SLUG__", SLUG)
           .replace("__NN__", f"{N_SCENES:02d}")
           .replace("__N__", str(N_SCENES)))

def main() -> int:
    (PROJ_ROOT / "history").mkdir(exist_ok=True)
    TASK.write_text(TASK_MD, encoding="utf-8")
    log = PROJ_ROOT / "history" / "cc_assemble.log"
    episode_tsx = EP / "Episode.tsx"
    episode_tsx.unlink(missing_ok=True)

    env = os.environ.copy()
    env["MAX_THINKING_TOKENS"] = "1024"
    cmd = ["agy", "--print", "--dangerously-skip-permissions",
           "--effort", "high"]
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
    uses_map = "SCENE_ORDER.map" in body or "SCENE_ORDER" in body
    checks[f"sequences_ge_{N_SCENES}"] = (n_seq >= N_SCENES) or (uses_map and "durationInFrames" in body and "voice_s" in body)
    checks["duration_frames"] = "scene_timing" in body or "durationInFrames" in body
    tsc = subprocess.run(["npx", "tsc", "--noEmit"], cwd=str(COMPOSER),
                         capture_output=True, text=True, timeout=300)
    own = [l for l in (tsc.stdout + tsc.stderr).splitlines() if SLUG in l or "Root.tsx" in l]
    checks["tsc_own_errors"] = own[:8]
    checks["dur_s"] = round(dur)
    ok = (checks["episode_exists"] and checks["root_draft"] and checks["root_final"]
          and checks[f"sequences_ge_{N_SCENES}"] and not own)
    print("ASSEMBLE", "PASS" if ok else "FAIL")
    print(checks)
    return 0 if ok else 1


if __name__ == "__main__":
    sys.exit(main())
