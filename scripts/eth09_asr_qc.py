#!/usr/bin/env python3
"""eth09 ASR QC round-trip: transcribe voice_sXX.wav, evaluate structure (digits + similarity),
auto re-gen FAILED sections once, rebuild narration_full if needed, then emit:
- assets/audio/transcripts/sXX.json (canonical_text + words w/ timestamps)
- assets/audio/transcripts/narration_words.json {s01:[{word,start,end}], ...} GLOBAL timeline
- assets/audio/subtitles.srt (+ assets/subtitles.srt) from display text on ASR time-slots
"""
import json, os, re, subprocess, sys, time, wave
from difflib import SequenceMatcher

ROOT = "/Users/tuyennguyen/project/OpenMontage"
PROJ = f"{ROOT}/projects/eth-tradingagents-20261009"
AUD = f"{PROJ}/assets/audio"
TTS_PY = "/Users/tuyennguyen/project/vietnamese-tts/.venv/bin/python"
TTS_CLI = "/Users/tuyennguyen/project/vietnamese-tts/vieneu_cli.py"
GAP = 0.65
sys.path.insert(0, ROOT)
from tools.analysis.transcriber import Transcriber  # noqa: E402

# expected digit sequences in ASR output (digits-concat OR number-word-mapped)
EXP = {
    "s01": {"need": ["2492", "27", "76"], "min": 3},
    "s02": {"need": ["2471", "2406"], "min": 2, "alt": {"2406": ["2406", "208"]}},
    "s03": {"need": ["118"], "min": 1},
    "s04": {"need": ["37"], "min": 1},
    "s05": {"need": ["2008", "25"], "min": 2, "alt": {"2008": ["2008", "208"]}},
    "s06": {"need": ["80500", "83050", "042", "154", "2492"], "min": 3},
    "s07": {"need": ["2400", "2450"], "min": 2, "alt": {"2400": ["2400", "24"], "2450": ["2450", "245"]}},
    "s08": {"need": ["2551", "2634"], "min": 2, "alt": {"2551": ["2551", "2550"]}},
    "s09": {"need": ["2128", "2400"], "min": 2, "alt": {"2400": ["2400", "24"]}},
    "s10": {"need": ["2400"], "min": 1, "alt": {"2400": ["2400", "24"]}},
}
NUMMAP = {"không": "0", "khong": "0", "linh": "0", "lẻ": "0", "một": "1", "mot": "1", "hai": "2",
          "ba": "3", "tư": "4", "tu": "4", "bốn": "4", "bon": "4", "năm": "5", "nam": "5", "sáu": "6",
          "sau": "6", "bảy": "7", "bay": "7", "tám": "8", "tam": "8", "chín": "9", "chin": "9",
          "mốt": "1", "mươi": "", "muoi": "", "mười": "10"}

script = json.load(open(f"{PROJ}/artifacts/script.json"))
sections = {s["id"]: s for s in script["sections"]}


def wav_dur(p):
    with wave.open(p, "rb") as w:
        return w.getnframes() / float(w.getframerate())


def norm_tok(t):
    t = t.lower().strip()
    t = re.sub(r"[.,:;!?%\"'()\[\]—–-]+$", "", t)
    t = re.sub(r"^[.,:;!?%\"'()\[\]—–-]+", "", t)
    return t


def strip_num_sep(t):
    return re.sub(r"(?<=\d)[.,](?=\d)", "", t)


def mapped_digits(words_norm):
    out = []
    for w in words_norm:
        w = strip_num_sep(w)
        if w.isdigit():
            out.append(w)
        elif w in NUMMAP and NUMMAP[w] != "":
            out.append(NUMMAP[w])
    return "".join(out)


def asr_words_of(res_data):
    words = []
    for seg in res_data.get("segments", []):
        for w in seg.get("words", []) or []:
            tok = w.get("word", w.get("text", ""))
            try:
                st, en = float(w.get("start", 0)), float(w.get("end", 0))
            except Exception:
                continue
            if tok and tok.strip():
                words.append({"word": tok.strip(), "start": st, "end": en})
    return words


def evaluate(sid, asr_text, provider_text):
    a_toks = [norm_tok(strip_num_sep(x)) for x in asr_text.split()]
    p_toks = [norm_tok(x) for x in provider_text.split()]
    a_toks = [x for x in a_toks if x]
    p_toks = [x for x in p_toks if x]
    ratio = SequenceMatcher(None, a_toks, p_toks).ratio()
    digits = mapped_digits(a_toks)
    exp = EXP[sid]
    found, missing = [], []
    for seq in exp["need"]:
        alts = [seq] + exp.get("alt", {}).get(seq, [])
        if any(a in digits for a in alts):
            found.append(seq)
        else:
            missing.append(seq)
    ok = len(found) >= exp["min"] and ratio >= 0.30
    return {"word_similarity": round(ratio, 3), "digits_found": found, "digits_missing": missing,
            "digits_stream": digits[:80], "verdict": "PASS" if ok else "FAIL"}


def align(src_toks, asr_words, total_dur):
    """Return [(start,end)] per src token from ASR word slots (raw-local seconds)."""
    a_norm = [norm_tok(strip_num_sep(w["word"])) for w in asr_words]
    sm = SequenceMatcher(None, a_norm, src_toks, autojunk=False)
    times = [None] * len(src_toks)
    for tag, i1, i2, j1, j2 in sm.get_opcodes():
        if tag == "equal":
            for jj in range(j1, j2):
                ii = i1 + (jj - j1)
                if ii < len(asr_words):
                    times[jj] = (asr_words[ii]["start"], asr_words[ii]["end"])
    # interpolate unmatched
    med = 0.28
    durs = sorted([e - s for s, e in (t for t in times if t)]) or [med]
    med = durs[len(durs) // 2]
    known = [(j, t) for j, t in enumerate(times) if t]
    if not known:
        step = total_dur / max(1, len(src_toks))
        return [(j * step, (j + 1) * step) for j in range(len(src_toks))]
    for j in range(len(src_toks)):
        if times[j]:
            continue
        prev_end = times[j - 1][1] if j > 0 and times[j - 1] else 0.0
        nxt = next((t for t in known if t[0] > j), None)
        nxt_start = nxt[1][0] if nxt else total_dur
        lo, hi = prev_end, max(prev_end + med, nxt_start)
        # spread remaining unmatched-before-nxt
        span = hi - lo
        cnt = 1 + sum(1 for t in times[j:nxt[0]] if not t) if nxt else 1
        step = span / max(1, cnt)
        idx = 0
        for jj in range(j, nxt[0] if nxt else len(src_toks)):
            if not times[jj]:
                times[jj] = (lo + idx * step, lo + (idx + 1) * step)
                idx += 1
    return times


def srt_ts(t):
    ms = int(round(t * 1000))
    h, ms = divmod(ms, 3600000)
    m, ms = divmod(ms, 60000)
    s, ms = divmod(ms, 1000)
    return f"{h:02d}:{m:02d}:{s:02d},{ms:03d}"


def rebuild_narration():
    """Reconcat + atempo from current voice wavs; update tts_batch_summary.json."""
    ids = list(sections.keys())
    _, SR, CH, SW = None, 48000, 1, 2
    with wave.open(f"{AUD}/voice_{ids[0]}.wav", "rb") as w:
        SR, CH, SW = w.getframerate(), w.getnchannels(), w.getsampwidth()
    silence = b"\x00" * (int(GAP * SR) * CH * SW)
    raw = f"{AUD}/narration_full_raw.wav"
    durs, offs, cur = {}, {}, 0.0
    with wave.open(raw, "wb") as outw:
        outw.setnchannels(CH); outw.setsampwidth(SW); outw.setframerate(SR)
        for i, sid in enumerate(ids):
            with wave.open(f"{AUD}/voice_{sid}.wav", "rb") as w:
                frames = w.readframes(w.getnframes())
            durs[sid] = len(frames) / (SR * CH * SW)
            offs[sid] = cur
            outw.writeframes(frames)
            cur += durs[sid]
            if i < len(ids) - 1:
                outw.writeframes(silence)
                cur += GAP
    raw_total = cur
    k = 1.0 / 1.15 if raw_total > 130.0 else 1.0
    final = f"{AUD}/narration_full.wav"
    if k != 1.0:
        subprocess.run(["ffmpeg", "-y", "-v", "error", "-i", raw, "-filter:a", "atempo=1.15", final], check=True)
        os.remove(raw)
    else:
        os.replace(raw, final)
    summ = json.load(open(f"{AUD}/tts_batch_summary.json"))
    summ["time_scale"] = round(k, 6)
    summ["tempo_applied"] = k != 1.0
    summ["atempo"] = 1.15 if k != 1.0 else 1.0
    summ["total_duration_seconds"] = round(raw_total * k, 3)
    summ["section_offsets_final"] = {sid: round(offs[sid] * k, 3) for sid in ids}
    for sec in summ["sections"]:
        sec["duration_seconds"] = round(durs[sec["id"]] * k, 3)
        sec["raw_duration_seconds"] = round(durs[sec["id"]], 3)
        sec["duration_after_tempo"] = round(durs[sec["id"]] * k, 3)
    json.dump(summ, open(f"{AUD}/tts_batch_summary.json", "w"), indent=1, ensure_ascii=False)
    return k, summ["section_offsets_final"]


# ---- main ----
tr = Transcriber()
regenerated = set()
report = {}
transcripts = {}
for sid, s in sections.items():
    provider_text = s["delivery_cues"]["provider_text"]
    for attempt in (1, 2):
        res = tr.execute({"input_path": f"{AUD}/voice_{sid}.wav", "language": "vi"})
        if not getattr(res, "success", True):
            print(f"{sid}: ASR ERROR {getattr(res, 'error', '')[:200]}"); sys.exit(1)
        data = res.data if hasattr(res, "data") else res
        words = asr_words_of(data)
        asr_text = " ".join(seg.get("text", "") for seg in data.get("segments", [])).strip()
        m = evaluate(sid, asr_text, provider_text)
        NOREGEN = "--noregen" in sys.argv
        if m["verdict"] == "PASS" or attempt == 2 or NOREGEN:
            if m["verdict"] != "PASS":
                m["verdict"] = "FAIL(final)" if sid in regenerated else "FAIL"
            break
        print(f"{sid}: FAIL attempt1 -> re-gen: missing={m['digits_missing']} ratio={m['word_similarity']}")
        subprocess.run([TTS_PY, TTS_CLI, "--text", provider_text, "--output", f"{AUD}/voice_{sid}.wav"],
                       capture_output=True, text=True, timeout=300)
        regenerated.add(sid)
    transcripts[sid] = {"section_id": sid, "canonical_text": provider_text,
                        "display_text": s["text"], "asr_text": asr_text, "words": words,
                        "match": m, "regenerated": sid in regenerated}
    report[sid] = {**m, "regenerated": sid in regenerated}
    print(f"{sid}: {m['verdict']} ratio={m['word_similarity']} found={m['digits_found']} missing={m['digits_missing']}")

k, offsets = (None, None)
if regenerated:
    print("rebuilding narration_full + summary after re-gen:", sorted(regenerated))
    k, offsets = rebuild_narration()
summ = json.load(open(f"{AUD}/tts_batch_summary.json"))
k = summ["time_scale"]
offsets = summ["section_offsets_final"]

# ---- transcripts + narration_words + srt ----
os.makedirs(f"{AUD}/transcripts", exist_ok=True)
narration_words = {}
srt_lines, cue_idx = [], 1

def build_display_timeline(sid, words, dur_raw):
    disp_toks = [norm_tok(x) for x in sections[sid]["text"].split()]
    disp_toks = [x for x in disp_toks if x]
    times = align(disp_toks, words, dur_raw)
    return list(zip(disp_toks, times))

for sid, s in sections.items():
    tr_ = transcripts[sid]
    dur_raw = wav_dur(f"{AUD}/voice_{sid}.wav")
    off = offsets[sid]
    # narration_words: provider tokens on ASR slots, scaled to final timeline
    p_toks = [norm_tok(x) for x in s["delivery_cues"]["provider_text"].split()]
    p_toks = [x for x in p_toks if x]
    times = align(p_toks, tr_["words"], dur_raw)
    narration_words[sid] = [{"word": tok, "start": round(off + a * k, 3), "end": round(off + b * k, 3)}
                            for tok, (a, b) in zip(p_toks, times)]
    tr_["words"] = [{"word": w["word"], "start": round(w["start"], 3), "end": round(w["end"], 3)}
                    for w in tr_["words"]]
    json.dump(tr_, open(f"{AUD}/transcripts/{sid}.json", "w"), indent=1, ensure_ascii=False)
    # srt from display text timeline (global)
    dtl = build_display_timeline(sid, tr_["words"], dur_raw)
    glob = [(tok, off + a * k, off + b * k) for tok, (a, b) in dtl]
    cue, c_start, c_end = [], None, None
    for tok, gs, ge in glob:
        if c_start is None:
            c_start, c_end, cue = gs, ge, [tok]
            continue
        gap_break = (gs - c_end) >= 0.35 and len(cue) >= 2
        len_break = len(cue) >= 6
        dur_break = (ge - c_start) >= 3.0 and len(cue) >= 2
        if gap_break or len_break or dur_break:
            srt_lines += [str(cue_idx), f"{srt_ts(c_start)} --> {srt_ts(min(c_end, c_start+3.5))}", " ".join(cue), ""]
            cue_idx += 1
            c_start, c_end, cue = gs, ge, [tok]
        else:
            c_end = max(c_end, ge)
            cue.append(tok)
    if cue:
        srt_lines += [str(cue_idx), f"{srt_ts(c_start)} --> {srt_ts(c_end)}", " ".join(cue), ""]
        cue_idx += 1

json.dump(narration_words, open(f"{AUD}/transcripts/narration_words.json", "w"), indent=1, ensure_ascii=False)
for p in (f"{AUD}/subtitles.srt", f"{PROJ}/assets/subtitles.srt"):
    open(p, "w").write("\n".join(srt_lines))

n_pass = sum(1 for r in report.values() if r["verdict"].startswith("PASS"))
worst = min(report.items(), key=lambda kv: kv[1]["word_similarity"])
print(f"\nSUMMARY: PASS {n_pass}/10 | regen={sorted(regenerated)} | worst={worst[0]} ratio={worst[1]['word_similarity']}")
print(f"narration_words sections={list(narration_words)} | srt cues={cue_idx} | time_scale={k}")
