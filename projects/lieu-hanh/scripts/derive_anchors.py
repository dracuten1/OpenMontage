#!/usr/bin/env python3
"""Derive speech-lock anchors «...» into artifacts/scene_plan.json overlay_notes.

For each section: split transcript words into sentences (punctuation); group sentences
into k contiguous chunks (k = #scenes of that section) weighted by scene est duration;
anchor of scene i = 2-4 first spoken words of the first sentence of its chunk (words
taken VERBATIM from the transcript => guaranteed engine match). Boundary words are
always sentence starts => speech-locked, no proportional timing."""
import json, re, sys
from pathlib import Path

OM = Path("/Users/tuyennguyen/project/OpenMontage")
P = OM / "projects" / "lieu-hanh"
sys.path.insert(0, str(P / "scripts"))
from phrase_lock_lh import js_norm, word_tokens

sp = json.loads((P / "drafts" / "scene_plan.json").read_text(encoding="utf-8"))
words_all = json.loads((P / "assets" / "audio" / "transcripts" / "narration_words.json").read_text(encoding="utf-8"))

scenes = [s for s in sp["scenes"] if isinstance(s, dict)]
meta = {m["id"]: m for m in sp["metadata"]["section_timing_estimates"]}

def sentences(words):
    """list of [start_idx, end_idx] inclusive, split on sentence punctuation."""
    out = []
    start = 0
    for i, w in enumerate(words):
        if re.search(r"[.!?…]", w["word"]):
            out.append((start, i))
            start = i + 1
    if start < len(words):
        out.append((start, len(words) - 1))
    return out

changed = 0
by_section = {}
for s in scenes:
    by_section.setdefault(s["script_section_id"], []).append(s)

for sec, sec_scenes in by_section.items():
    words = words_all[sec]
    sents = sentences(words)
    if not sents:
        print(f"WARN {sec}: no sentences")
        continue
    total_words = len(words)
    ests = [float(s.get("end_seconds", 0)) - float(s.get("start_seconds", 0)) for s in sec_scenes]
    est_sum = sum(ests) or 1.0
    # target word boundaries between chunks
    k = len(sec_scenes)
    targets = []
    acc = 0.0
    for e in ests[:-1]:
        acc += e
        targets.append(int(round(total_words * acc / est_sum)))
    # assign sentences to chunks: sentence i belongs to chunk c if its start word >= boundary
    bounds = []
    for t in targets:
        # first sentence whose start >= t
        pick = next((si for si, (a, b) in enumerate(sents) if a >= t), len(sents) - 1)
        bounds.append(pick)
    # ensure strictly increasing
    for i in range(1, len(bounds)):
        if bounds[i] <= bounds[i - 1]:
            bounds[i] = bounds[i - 1] + 1
    groups = []
    prev = 0
    for b in list(bounds) + [len(sents)]:
        groups.append(sents[prev:b])
        prev = b
    # pad/merge empties: a chunk must have >=1 sentence
    for i in range(len(groups)):
        if not groups[i]:
            # steal one from the next non-empty
            for j in range(i + 1, len(groups)):
                if groups[j]:
                    groups[i] = [groups[j].pop(0)]
                    break
    # still-empty chunks (too few sentences): split the last long sentence of the
    # previous non-empty chunk in half — anchor lands on a real mid-sentence word
    for i in range(len(groups)):
        if groups[i]:
            continue
        for j in range(i - 1, -1, -1):
            if not groups[j]:
                continue
            for si in range(len(groups[j]) - 1, -1, -1):
                a, b = groups[j][si]
                if b - a + 1 >= 8:
                    mid = a + (b - a + 1) // 2
                    groups[j] = groups[j][:si] + [(a, mid - 1)]
                    groups[i] = [(mid, b)]
                    break
            if groups[i]:
                break
    for sc, grp in zip(sec_scenes, groups):
        if not grp:
            continue
        a, b = grp[0]
        # anchor: first 2-4 words of the sentence that normalize non-empty
        toks = []
        j = a
        while j <= b and len(toks) < 3:
            ts = word_tokens(words[j]["word"])
            if ts:
                toks.append(words[j]["word"])
            j += 1
        phrase = " ".join(toks).strip()
        phrase = re.sub(r"[«»]", "", phrase).strip()
        if not phrase:
            continue
        anchor = f"«{phrase}»"
        on = sc.get("overlay_notes") or ""
        if anchor not in on:
            sc["overlay_notes"] = (on + (" " if on and not on.endswith((" ", "\n")) else "") + anchor).strip()
            changed += 1

# promote to artifacts with anchors embedded
sp["metadata"]["anchor_derivation"] = {
    "method": "sentence-start phrase anchors, verbatim transcript words, chunk split weighted by scene est duration (boundaries always sentence starts)",
    "engine": "phrase_lock_lh (S2E01/S2E02/S2E03 d-012 parity)",
}
(P / "artifacts").mkdir(exist_ok=True)
(P / "artifacts" / "scene_plan.json").write_text(json.dumps(sp, ensure_ascii=False, indent=1), encoding="utf-8")
print(f"anchors added to {changed} scenes; artifacts/scene_plan.json written")
# quick check: every scene has >=1 anchor
missing = [s["id"] for s in scenes if "«" not in (s.get("overlay_notes") or "")]
print("scenes without anchor:", missing if missing else "none")
