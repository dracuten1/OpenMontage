#!/usr/bin/env python3
"""Build diff-realigned Vietnamese captions -> public/dam-san/captions.srt + captions.json."""
import difflib
import json
import re
from pathlib import Path

OM = Path("/Users/tuyennguyen/project/OpenMontage")
P = OM / "projects" / "dam-san"
PUB = OM / "remotion-composer" / "public" / "dam-san"

script = json.loads((P / "artifacts" / "script.json").read_text(encoding="utf-8"))
words_global = json.loads((PUB / "narration_words.json").read_text(encoding="utf-8"))
MAXC = 92


def words_from_text(text: str) -> list[str]:
    return re.findall(r"\S+", text)


def fmt(ts: float) -> str:
    h = int(ts // 3600)
    m = int(ts % 3600 // 60)
    sec = int(ts % 60)
    ms = int(round((ts - int(ts)) * 1000))
    if ms == 1000:
        sec += 1
        ms = 0
    return f"{h:02d}:{m:02d}:{sec:02d},{ms:03d}"


def main() -> None:
    cues = []
    for s in script["sections"]:
        sid = s["id"]
        text = s["text"]
        spoken = words_global.get(sid, [])
        if not spoken:
            print("WARN no words:", sid)
            continue
        want = words_from_text(text)
        got = [w["word"] for w in spoken]
        sm = difflib.SequenceMatcher(None, got, want, autojunk=False)
        merged = []
        for tag, i1, i2, j1, j2 in sm.get_opcodes():
            if tag == "equal":
                for k in range(i2 - i1):
                    merged.append({"word": want[j1 + k], "start": spoken[i1 + k]["start"], "end": spoken[i1 + k]["end"]})
            elif tag == "insert":
                if j2 > j1 and merged:
                    t0 = merged[-1]["end"]
                    for k in range(j2 - j1):
                        merged.append({"word": want[j1 + k], "start": round(t0 + k * 0.12, 3), "end": round(t0 + (k + 1) * 0.12, 3)})
            else:
                span = [w for w in spoken[i1:i2]]
                if span and j2 > j1:
                    t0, t1 = span[0]["start"], span[-1]["end"]
                    step = (t1 - t0) / max(1, (j2 - j1))
                    for k in range(j2 - j1):
                        merged.append({"word": want[j1 + k], "start": round(t0 + k * step, 3), "end": round(t0 + (k + 1) * step, 3)})
                elif j2 > j1 and merged:
                    t0 = merged[-1]["end"]
                    for k in range(j2 - j1):
                        merged.append({"word": want[j1 + k], "start": round(t0 + k * 0.22, 3), "end": round(t0 + (k + 1) * 0.22, 3)})

        cur, cs, ce = [], None, None

        def flush() -> None:
            nonlocal cur, cs, ce
            if not cur:
                return
            txt = " ".join(w["word"] for w in cur).strip()
            if txt:
                cues.append({"text": txt, "start": cs, "end": ce})
            cur, cs, ce = [], None, None

        for w in merged:
            if cs is None:
                cs = w["start"]
            cur.append(w)
            ce = w["end"]
            txt = " ".join(x["word"] for x in cur)
            if len(txt) >= MAXC:
                m = None
                for mch in re.finditer(r"[,;:.!?…—]", txt[:-6]):
                    m = mch
                if m and m.end() > MAXC * 0.45:
                    head = txt[: m.end()].strip()
                    h_cnt = min(len(words_from_text(head)), len(cur)) or 1
                    rest_words = cur[h_cnt:]
                    cues.append({"text": head, "start": cs, "end": cur[h_cnt - 1]["end"]})
                    cur = rest_words
                    cs = cur[0]["start"] if cur else None
                    ce = cur[-1]["end"] if cur else None
                else:
                    flush()
        flush()

    st_json = json.loads((P / "artifacts" / "scene_timing.json").read_text(encoding="utf-8"))["sections"]
    TOTAL = st_json[-1]["end"]
    prev = 0.0
    clean = []
    for c in cues:
        st = max(round(c["start"], 3), prev + 0.001)
        en = max(st + 0.3, round(c["end"], 3))
        if en > TOTAL - 0.05:
            en = TOTAL - 0.05
        if st >= en:
            continue
        clean.append({"text": c["text"], "start": st, "end": en})
        prev = en
    cues = clean

    srt = [f"{i}\n{fmt(c['start'])} --> {fmt(c['end'])}\n{c['text']}\n" for i, c in enumerate(cues, 1)]
    (PUB / "captions.srt").write_text("\n".join(srt), encoding="utf-8")
    (PUB / "captions.json").write_text(json.dumps(cues, ensure_ascii=False), encoding="utf-8")
    mx = max(len(c["text"]) for c in cues)
    print(f"captions: {len(cues)} cues, max {mx} chars, dur {fmt(cues[-1]['end'])}")


if __name__ == "__main__":
    main()
