#!/usr/bin/env python
"""Sinh scene index S2E02 (pattern d-011): mỗi scene 1 dòng — S# · frame range · time range · dur ·
kind · nội dung chính · narration snippet (anchors đầu cảnh)."""
import json
import re
from pathlib import Path

P = Path("/Users/tuyennguyen/project/OpenMontage/projects/thanh-giong")
OUT = Path("/Users/tuyennguyen/project/vn-myth-series/episodes/S2E02-thanh-giong/scene_index_s2e02.md")

sp = json.loads((P / "artifacts" / "scene_plan.json").read_text())
timing = json.loads((P / "artifacts" / "scene_timing.json").read_text())
script = json.loads((P / "artifacts" / "script.json").read_text())
total_f = timing["scenes"][-1]["startFrame"] + timing["scenes"][-1]["durationInFrames"]
texts = {s["id"]: s["text"] for s in script["sections"]}
scenes_by_id = {s["id"]: s for s in sp["scenes"]}

def mmss(sec: float) -> str:
    m = int(sec // 60)
    s = sec - m * 60
    return f"{m}:{s:04.1f}"

def anchors_of(scene) -> list[str]:
    m = re.search(r"anchors?:\s*(.+)", scene.get("overlay_notes", "") or "")
    return re.findall(r"«([^»]+)»", m.group(1)) if m else []

def first_words(sec_id: str, n: int = 9) -> str:
    ws = texts[sec_id].split()
    return " ".join(ws[:n]) + ("…" if len(ws) > n else "")

lines = [
    "# Scene Index — VN-Myth S2E02 Thánh Gióng (DRAFT-HUD review)",
    "",
    "Dùng kèm bản draft có HUD (`S{scene} f{frame} {s}s [{in}/{total}]` góc dưới trái).",
    "Phản hồi mẫu: `S23 f6500 chữ quá nhỏ`.",
    f"Tổng: {len(timing['scenes'])} scenes · {total_f} frames · {total_f/30:.1f}s @ 30fps 1080p.",
    "",
    "| S# | Frames | Time | Dur | Kind | Nội dung chính | Narration đầu cảnh |",
    "|---|---|---|---|---|---|---|",
]
for t in timing["scenes"]:
    sc = scenes_by_id[t["sceneId"]]
    n = int(re.search(r"\d+", t["sceneId"]).group())
    f_in = t["startFrame"]
    f_out = t["startFrame"] + t["durationInFrames"] - 1
    t_in = f_in / 30
    t_out = (f_out + 1) / 30
    dur = t["durationInFrames"] / 30
    kind = f"{sc['type']}/{sc.get('movement', '')}" if sc.get("movement") else sc["type"]
    desc = re.sub(r"\s+", " ", sc.get("description", "")).strip()
    if len(desc) > 72:
        desc = desc[:70].rstrip() + "…"
    anch = anchors_of(sc)
    snip = f"«{anch[0]}»" if anch else first_words(sc["script_section_id"], 6)
    extra = f" +{len(anch)-1}a" if len(anch) > 1 else ""
    lines.append(
        f"| S{n} | f{f_in}–f{f_out} | {mmss(t_in)}–{mmss(t_out)} | {dur:.1f}s | {kind} | {desc} | {snip}{extra} |"
    )

lines += [
    "",
    "## Section map (narration)",
    "",
]
for s in script["sections"]:
    ws = len(s["text"].split())
    lines.append(f"- **{s['id']}** · {s.get('label', '')} · {ws} từ — {first_words(s['id'], 12)}")

OUT.write_text("\n".join(lines) + "\n")
print(f"written {OUT} — {len(timing['scenes'])} scenes")
