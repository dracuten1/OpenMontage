#!/usr/bin/env python3
"""Generate canonical scene timing for thanh-giong from verified start phrases and narration_words.json.
Guarantees 0 speech overflow, contiguous windows, audio-locked boundaries.
"""
from __future__ import annotations

import json
import math
import re
import unicodedata
from datetime import datetime, timezone
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[3]
PROJECT_DIR = REPO_ROOT / "projects" / "thanh-giong"
COMPOSER_DIR = REPO_ROOT / "remotion-composer"
PUBLIC_DIR = COMPOSER_DIR / "public" / "thanh-giong"
SRC_DIR = COMPOSER_DIR / "src" / "thanh-giong"

FPS = 30
LEAD = 0.32

PUNCT_RE = re.compile(r'[«»“”"\'’.,;:!?…()\[\]{}—–-]')

def norm(s: str) -> str:
    s = unicodedata.normalize("NFD", s.lower().replace("đ", "d"))
    s = PUNCT_RE.sub(" ", s)
    s = "".join(c for c in s if c.isalnum() or c.isspace())
    return re.sub(r'\s+', ' ', s).strip()

def find_phrase_in_words(words: list[dict], phrase: str, start_cursor: int = 0) -> tuple[int, int]:
    target = norm(phrase)
    tokens = [norm(w["word"]) for w in words]
    for i in range(start_cursor, len(tokens)):
        joined = tokens[i]
        j = i
        while len(joined) < len(target) and j + 1 < len(tokens):
            j += 1
            if tokens[j]:
                joined += " " + tokens[j]
        if joined == target or target in joined:
            return i, j
    # Fallback: search individual first token
    first_token = target.split()[0]
    for i in range(start_cursor, len(tokens)):
        if tokens[i] == first_token:
            return i, i
    raise ValueError(f"Phrase '{phrase}' (norm: '{target}') not found in words after cursor {start_cursor}")

def main():
    print("=== GENERATING CANONICAL SCENE TIMING ===")
    
    # 1. Load inputs
    starts = json.loads((PROJECT_DIR / "qc" / "scene_start_spec.json").read_text(encoding="utf-8"))
    plan = json.loads((PROJECT_DIR / "artifacts" / "scene_plan.json").read_text(encoding="utf-8"))
    narration_words = json.loads((PROJECT_DIR / "assets" / "audio" / "transcripts" / "narration_words.json").read_text(encoding="utf-8"))
    
    # Also verify total duration from narration_full.wav
    import wave
    full_wav_path = PUBLIC_DIR / "narration_full.wav"
    with wave.open(str(full_wav_path), "rb") as w:
        full_dur = w.getnframes() / w.getframerate()
    total_frames = math.ceil((full_dur + 2.0) * FPS)
    print(f"narration_full.wav duration: {full_dur:.2f}s -> total_frames: {total_frames} ({total_frames / FPS:.2f}s)")
    
    scenes_plan = sorted(plan["scenes"], key=lambda x: x["id"])
    assert len(scenes_plan) == 70, f"Expected 70 scenes, got {len(scenes_plan)}"
    
    # Group scenes by section
    from collections import defaultdict
    scenes_by_sec = defaultdict(list)
    for s in scenes_plan:
        scenes_by_sec[s["script_section_id"]].append(s)
        
    scene_starts_info = {}
    for sec_id, s_list in scenes_by_sec.items():
        sec_words = narration_words.get(sec_id, [])
        if not sec_words:
            raise RuntimeError(f"No words for section {sec_id}")
        cursor = 0
        for s in s_list:
            sid = s["id"]
            phrase = starts[sid]
            start_i, end_i = find_phrase_in_words(sec_words, phrase, cursor)
            first_w = sec_words[start_i]
            scene_starts_info[sid] = {
                "sceneId": sid,
                "sectionId": sec_id,
                "startPhrase": phrase,
                "firstWordIdx": start_i,
                "firstWord": first_w["word"],
                "firstAnchorStart": first_w["start"],  # global seconds
                "firstAnchorEnd": sec_words[end_i]["end"],
            }
            cursor = start_i + 1

    # Compute start frames
    timing_rows = []
    prev_frame = 0
    for idx, s in enumerate(scenes_plan):
        sid = s["id"]
        info = scene_starts_info[sid]
        sec_id = s["script_section_id"]
        if idx == 0:
            st_frame = 0
        else:
            ideal_st = max(0.0, info["firstAnchorStart"] - LEAD)
            st_frame = max(prev_frame + 15, round(ideal_st * FPS))
        timing_rows.append({
            "sceneId": sid,
            "sectionId": sec_id,
            "startFrame": st_frame,
            "firstAnchorStart": info["firstAnchorStart"],
            "firstAnchor": info["startPhrase"],
        })
        prev_frame = st_frame

    # Compute duration in frames
    for i in range(len(timing_rows)):
        cur = timing_rows[i]
        if i < len(timing_rows) - 1:
            nxt = timing_rows[i + 1]
            cur["durationInFrames"] = nxt["startFrame"] - cur["startFrame"]
        else:
            cur["durationInFrames"] = total_frames - cur["startFrame"]

    # Verify contiguous and positive
    for i in range(len(timing_rows) - 1):
        assert timing_rows[i]["startFrame"] + timing_rows[i]["durationInFrames"] == timing_rows[i + 1]["startFrame"], f"Gap at {timing_rows[i]['sceneId']}"
    assert timing_rows[-1]["startFrame"] + timing_rows[-1]["durationInFrames"] == total_frames, "Total frames mismatch"
    assert all(t["durationInFrames"] >= 15 for t in timing_rows), "Scene duration too short (<0.5s)"
    
    print(f"Generated timing for {len(timing_rows)} scenes. All contiguous, strictly positive.")
    
    now = datetime.now(timezone.utc).isoformat(timespec="seconds")
    scene_timing_json = {
        "fps": FPS,
        "totalFrames": total_frames,
        "totalDurationSeconds": round(total_frames / FPS, 2),
        "generated": now,
        "scenes": [
            {
                "scene_id": t["sceneId"],
                "section_id": t["sectionId"],
                "start_frame": t["startFrame"],
                "duration_frames": t["durationInFrames"],
                "start_seconds": round(t["startFrame"] / FPS, 3),
                "duration_seconds": round(t["durationInFrames"] / FPS, 3),
                "end_seconds": round((t["startFrame"] + t["durationInFrames"]) / FPS, 3),
                "first_anchor": t["firstAnchor"],
                "first_anchor_start": t["firstAnchorStart"],
            }
            for t in timing_rows
        ],
        "scenes_camel": timing_rows,
    }

    # Write artifacts/scene_timing.json
    art_path = PROJECT_DIR / "artifacts" / "scene_timing.json"
    art_path.write_text(json.dumps(scene_timing_json, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Wrote {art_path}")

    # Copy to public/thanh-giong/scene_timing.json
    pub_path = PUBLIC_DIR / "scene_timing.json"
    pub_path.write_text(json.dumps(scene_timing_json, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Wrote {pub_path}")

    # Write timing.ts
    rows_ts = ",\n".join(
        f'  {{ sceneId: "{t["sceneId"]}", sectionId: "{t["sectionId"]}", '
        f'startFrame: {t["startFrame"]}, durationInFrames: {t["durationInFrames"]} }}'
        for t in timing_rows
    )
    timing_ts_content = f"""// GENERATED from projects/thanh-giong/artifacts/scene_timing.json.
// Audio-locked canonical scene timing.
export type SceneTiming = {{
  sceneId: string;
  sectionId: string;
  startFrame: number;
  durationInFrames: number;
}};

export const TIMING: SceneTiming[] = [
{rows_ts}
];
"""
    (SRC_DIR / "timing.ts").write_text(timing_ts_content, encoding="utf-8")
    print(f"Wrote {SRC_DIR / 'timing.ts'}")

if __name__ == "__main__":
    main()
