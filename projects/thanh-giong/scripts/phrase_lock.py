#!/usr/bin/env python
"""d-012 speech-lock core — SSOT shared by gen_scene_timing.py / audit_anchors_runtime.py.

ENGINE PARITY CONTRACT (mirrors remotion-composer/src/son-tinh-thuy-tinh/anchors.ts wordStart):
- norm: replace /[«»“”"'’.,;:!?…()\\[\\]{}—–-]/g with SPACE, collapse whitespace, trim, lower.
- skip normalized-empty words; one input word may normalize to MULTIPLE tokens (H'Mông -> h|mông).
- single-token target (no space after norm): EXACT word equality only — never joined.
- multi-token target: filtered token strings n[]; for EVERY start i (occurrences may OVERLAP):
  join n[i..j] with single spaces while str.length(joined) < str.length(target) (CHARACTER length,
  exactly like the engine) and j+1 < len(n); match iff joined === target.
  => 'a a' over words [a,a,a]: occ1 = words 0-1, occ2 = words 1-2 (starts at the SECOND a).
- occ is 1-based within section, counted in scan order over all possible i.
- engine wordStart returns the ORIGINAL first matched word .start; span end = last joined word .end
  (engine has no end concept; extension used by the audit for retention checks).
- common.tsx useA raw fraction = (Math.round(wordStart*30) - sceneStartFrame) / sceneDurationFrames.

RESOLUTION (deterministic, NO proportional fallback anywhere):
A) first anchors: scenes in plan order; per-section cursor; a scene's first anchor is the
   anchor whose earliest occurrence-after-cursor starts EARLIEST in time (overlay anchor lists
   are not always spoken-order). Iterated to a fixed point: the cursor advances past ALL of the
   previous scene's assigned anchors, so a later scene never claims an occurrence spoken inside
   an earlier scene's span (seam pairs like sc052/sc053 «cùng một công việc»/«Một công việc»).
B) windows: start(N+1) = firstAnchor(N+1) - LEAD, integer frames, contiguous; scene 1 = 0;
   video end = TOTAL_FRAMES.
C) every plan anchor & A() call resolves to an occurrence INSIDE its scene window; explicit
   occs are deliberate and kept when in-window; a default occ that lands outside -> codemod row.
D) post-pass: a trailing anchor END overflow pushes the boundary to ceil((end+PAD)*30), capped
   at the next scene's first spoken frame (raw fraction >= 0 preserved, never clamped).
E) anchors spoken outside their window (interleaved scene pairs) = REAL content conflicts:
   enumerated exactly, never silently reassigned, never proportionally faked.
"""
from __future__ import annotations

import json
import math
import re
from dataclasses import dataclass, field
from pathlib import Path

PROJECT = Path("/Users/tuyennguyen/project/OpenMontage/projects/thanh-giong")
SRC = Path("/Users/tuyennguyen/project/OpenMontage/remotion-composer/src/thanh-giong")
FPS = 30
# TOTAL_FRAMES = ceil((narration_full + 2.0s tail) * 30) — động từ audio thật (pattern S2E01: 933s → 28050f)
import wave as _wave
def _total_frames() -> int:
    wav = Path("/Users/tuyennguyen/project/OpenMontage/remotion-composer/public/thanh-giong/narration_full.wav")
    if wav.exists():
        with _wave.open(str(wav), "rb") as w:
            dur = w.getnframes() / w.getframerate()
        return math.ceil((dur + 2.0) * FPS)
    return math.ceil(872.0 * FPS)   # pre-audio fallback ~870s budget
TOTAL_FRAMES = _total_frames()
LEAD = 0.32                   # scene starts 0.32s before its first spoken anchor
PAD = 0.05                    # pad when pushing a boundary past a trailing anchor end
END_TOL = 0.2                 # audit tolerance for anchor END vs scene end
START_TOL = 0.2               # audit tolerance for anchor START before scene start

# S2E02: retention ground truth sẽ dẫn xuất từ transcript (protectionEnd không cap);
# không có lead-measured requirements S2E01 — danh sách rỗng cho đến khi owner duyệt frame thật.
RETENTION_REQUIREMENTS: list[dict] = []

_PUNCT_RE = re.compile("[" + "«»“”\\\"'’.,;:!?…()\\[\\]{}—–-" + "]")
_WS_RE = re.compile(r"\s+")
_SENT_RE = re.compile(r"[.!?…]")


class ResolutionError(Exception):
    """Explicit deterministic failure — never silently degraded to proportional timing."""


def js_norm(s: str) -> str:
    """EXACT parity with anchors.ts normalization."""
    return _WS_RE.sub(" ", _PUNCT_RE.sub(" ", s)).strip().lower()


def word_tokens(word: str) -> list[str]:
    n = js_norm(word)
    return n.split(" ") if n else []


def phrase_tokens(phrase: str) -> list[str]:
    n = js_norm(phrase)
    if not n:
        raise ResolutionError(f"phrase normalizes to empty: {phrase!r}")
    return n.split(" ")


def js_round(x: float) -> int:
    """Math.round parity (half up for positives) — NOT python banker's round."""
    return math.floor(x + 0.5)


@dataclass(frozen=True)
class Span:
    occ: int          # 1-based within section
    start_word: int
    end_word: int
    start: float      # global seconds — original first word .start
    end: float        # global seconds — last matched word .end

    def as_dict(self) -> dict:
        return {"occ": self.occ, "startWord": self.start_word, "endWord": self.end_word,
                "start": round(self.start, 3), "end": round(self.end, 3)}


def find_occurrences(words: list[dict], phrase: str) -> list[Span]:
    """EXACT mirror of anchors.ts wordStart scanning (verified against source):
    single-token target -> exact word equality; multi-token -> character-length
    greedy join over filtered (non-empty) tokens, scanning EVERY start index so
    occurrences may overlap. occ is 1-based in scan order."""
    target = phrase_tokens(phrase)
    tgt = " ".join(target)                    # engine compares CHARACTER lengths on the joined string
    occ = 0
    out: list[Span] = []
    if len(target) == 1:                      # engine single-token path: exact word equality
        for i, w in enumerate(words):
            if js_norm(w["word"]) == tgt:
                occ += 1
                out.append(Span(occ, i, i, w["start"], w["end"]))
        return out
    n: list[str] = []                        # filtered token strings (empty norms skipped)
    idx: list[int] = []
    for i, w in enumerate(words):
        t = js_norm(w["word"])
        if t:
            n.append(t)
            idx.append(i)
    for i in range(len(n)):
        joined = n[i]
        j = i
        while len(joined) < len(tgt) and j + 1 < len(n):
            j += 1
            joined += " " + n[j]
        if joined == tgt:                    # overlap allowed: scan advances i by 1
            occ += 1
            out.append(Span(occ, idx[i], idx[j], words[idx[i]]["start"], words[idx[j]]["end"]))
    return out


def anchors_of(scene: dict) -> list[str]:
    """All «...» anchors declared in overlay_notes (plan order)."""
    return re.findall(r"«([^»]+)»", scene.get("overlay_notes", "") or "")


# --- actual A() call scan (source of truth = TSX source, rescanned every run) ----------

_CALL_RE = re.compile(r'\bA\(\s*"([^"]+)"\s*(?:,\s*(\d+)\s*)?\)')
_EXPORT_RE = re.compile(r"export const (Sc\d+)\b")


def scan_scene_exports() -> dict[str, str]:
    """sceneId -> file declaring `export const ScXXX`."""
    found: dict[str, str] = {}
    for f in sorted(SRC.glob("scenes-*.tsx")):
        for m in _EXPORT_RE.finditer(f.read_text()):
            found.setdefault("sc" + m.group(1)[2:], f.name)
    return found


def scan_scene_calls() -> dict[str, list[dict]]:
    """Actual A("phrase", occ?) calls per scene, scanned from `export const ScXXX` bodies.
    occ defaults to 1 when omitted (engine semantics). Declaration order != spoken order."""
    calls: dict[str, list[dict]] = {}
    for f in sorted(SRC.glob("scenes-*.tsx")):
        text = f.read_text()
        for m in _EXPORT_RE.finditer(text):
            sid = "sc" + m.group(1)[2:]
            nxt = text.find("export const", m.end())
            body = text[m.start(): nxt if nxt != -1 else len(text)]
            for c in _CALL_RE.finditer(body):
                calls.setdefault(sid, []).append({
                    "phrase": c.group(1),
                    "occ": int(c.group(2)) if c.group(2) else 1,
                    "explicit": bool(c.group(2)),
                    "file": f.name,
                })
    return calls


# --- resolution -------------------------------------------------------------------------

@dataclass
class Item:
    phrase: str
    occ: int
    span: Span
    source: str                      # "plan" | "call"


@dataclass
class SceneRes:
    id: str
    section: str
    first_anchor: Item | None = None
    anchors: list = field(default_factory=list)   # plan anchors, spoken order
    calls: list = field(default_factory=list)     # actual A() resolutions
    failures: list = field(default_factory=list)  # explicit failure descriptions


def _pick_in_window(occs: list[Span], w0: float, w1: float) -> Span | None:
    for o in occs:
        if o.start >= w0 - START_TOL and o.end <= w1 + END_TOL:
            return o
    return None


def resolve(scenes: list[dict], words_by_sec: dict, calls_by_scene: dict[str, list[dict]],
            max_iter: int = 4):
    """Deterministic resolution to a fixed point. Returns
    (res, sf, first_span, occ_fixes, failures). Status/conflicts are computed later from the
    FINAL windows (finalize_timing) — a single source of truth."""
    all_ids = [s["id"] for s in scenes]
    scene_by_id = {s["id"]: s for s in scenes}
    anchor_lists = {s["id"]: anchors_of(s) for s in scenes}
    occ_cache: dict[tuple[str, str], list[Span]] = {}

    def occs_of(sec: str, phrase: str) -> list[Span]:
        key = (sec, phrase)
        if key not in occ_cache:
            occ_cache[key] = find_occurrences(words_by_sec[sec], phrase)
        return occ_cache[key]

    last_end_word: dict[str, dict[str, int]] = {}   # iter memo: section -> scene -> last word
    failures: list[str] = []
    occ_fixes: list[dict] = []
    sf: dict[str, int] = {}                          # stays empty only if every first anchor failed
    res: dict[str, SceneRes] = {sid: SceneRes(sid, scene_by_id[sid]["script_section_id"])
                                for sid in all_ids}

    for it in range(max_iter):
        cursors: dict[str, int] = {}
        first_span: dict[str, Span] = {}
        # A) greedy first anchors; cursor advances past the PREVIOUS scene's last assigned
        #    anchor (all of them, from the previous iteration) so seams cannot be stolen.
        sec_cursor_scene: dict[str, int] = {}
        for sid in all_ids:
            sec = res[sid].section
            words = words_by_sec.get(sec) or []
            if not words:
                continue
            base = cursors.get(sec, 0)
            prev_scene = sec_cursor_scene.get(sec)
            if prev_scene is not None and it > 0:
                base = max(base, last_end_word[f"{it-1}:{sec}"].get(prev_scene, base - 1) + 1)
            best: tuple[float, str, Span] | None = None
            for ph in anchor_lists[sid]:
                occs = occs_of(sec, ph)
                cand = next((o for o in occs if o.start_word >= base), None)
                if cand is None:
                    continue
                if best is None or (cand.start, ph) < (best[0], best[1]):
                    best = (cand.start, ph, cand)
            if best is None:
                # NO silent fallback to an earlier occurrence (occ before cursor): explicit
                # failure — cursors must not ignore missing anchors.
                res[sid].failures.append(
                    f"{sid}: no anchor occurrence at/after section cursor in {sec} — "
                    f"anchors {[list(a for a in anchor_lists[sid])]} all exhausted/absent")
                continue
            _, ph, sp = best
            first_span[sid] = sp
            res[sid].first_anchor = Item(ph, sp.occ, sp, "plan")
            cursors[sec] = sp.end_word + 1
            sec_cursor_scene[sec] = sid

        if not first_span:
            break
        # B) provisional windows
        order = [sid for sid in all_ids if sid in first_span]
        sf: dict[str, int] = {order[0]: 0}
        for prev, sid in zip(order, order[1:]):
            sf[sid] = max(js_round((first_span[sid].start - LEAD) * FPS), sf[prev] + 1)

        # C) assign every anchor & call to an occurrence (window containment)
        new_last: dict[str, dict[str, int]] = {}
        for sec in {res[s].section for s in all_ids}:
            new_last[sec] = {}
        for i, sid in enumerate(order):
            r = res[sid]
            words = words_by_sec.get(r.section) or []
            if not words:
                r.failures = [f"{sid}: no transcript words for section {r.section}"]
                continue
            w0 = sf[sid] / FPS
            w1 = (sf[order[i + 1]] if i + 1 < len(order) else TOTAL_FRAMES) / FPS
            r.anchors, r.calls, r.failures = [], [], []

            for ph in anchor_lists[sid]:
                try:
                    occs = occs_of(r.section, ph)
                except ResolutionError as e:
                    r.failures.append(f"{sid} «{ph}»: {e}")
                    continue
                if r.first_anchor and ph == r.first_anchor.phrase and not [
                        a for a in r.anchors if a.phrase == ph]:
                    r.anchors.append(r.first_anchor)
                    continue
                pick = _pick_in_window(occs, w0, w1)
                if pick is None:
                    # all occurrences outside the window (or none): explicit failure with the
                    # real spans — never silently clamp to a nearest/out-of-window occurrence
                    spans = "; ".join(f"#{o.occ} {o.start:.2f}-{o.end:.2f}" for o in occs[:6])
                    r.failures.append(
                        f"{sid} «{ph}»: no occurrence inside window [{w0:.2f},{w1:.2f}] "
                        f"in {r.section}" + (f" — occurrences: {spans}" if occs
                                             else " — phrase absent from section"))
                    continue
                r.anchors.append(Item(ph, pick.occ, pick, "plan"))
            r.anchors.sort(key=lambda a: a.span.start)
            new_last[r.section][sid] = max((a.span.end_word for a in r.anchors), default=-1)

            seen: dict[str, int] = {}
            for c in calls_by_scene.get(sid, []):
                key = js_norm(c["phrase"])
                k = seen.get(key, 0)
                seen[key] = k + 1
                try:
                    occs = occs_of(r.section, c["phrase"])
                except ResolutionError as e:
                    r.failures.append(f'{sid} A("{c["phrase"]}"): {e}')
                    continue
                if not occs:
                    r.failures.append(f'{sid} A("{c["phrase"]}"): phrase absent from {r.section}')
                    continue
                cur = occs[c["occ"] - 1] if c["occ"] <= len(occs) else None
                in_win = cur if cur and cur.start >= w0 - START_TOL and cur.end <= w1 + END_TOL else None
                if in_win is not None:
                    r.calls.append(Item(c["phrase"], c["occ"], in_win, "call"))
                    same = [a for a in r.anchors if js_norm(a.phrase) == key]
                    if same and k < len(same) and same[k].span != in_win:
                        same[k].occ, same[k].span = in_win.occ, in_win
                    continue
                pick = _pick_in_window(occs, w0, w1)
                if pick is None or pick.start < w0 - START_TOL:
                    # literal occ semantics: report the span the LITERAL occ resolves to; if
                    # the occ does not exist that is an explicit failure, never occ[0]
                    if cur is None:
                        r.failures.append(
                            f'{sid} A("{c["phrase"]}", occ {c["occ"]}): unresolved — only '
                            f'{len(occs)} occurrence(s) in {r.section}')
                        continue
                    r.calls.append(Item(c["phrase"], c["occ"], cur, "call"))
                    r.failures.append(
                        f'{sid} A("{c["phrase"]}", occ {c["occ"]}): spoken {cur.start:.2f}-'
                        f'{cur.end:.2f}s outside window [{w0:.2f},{w1:.2f}] — content conflict')
                    continue
                r.calls.append(Item(c["phrase"], pick.occ, pick, "call"))
                if pick is not cur:
                    old = f'A("{c["phrase"]}"' + (f', {c["occ"]}' if c["explicit"] else "") + ")"
                    occ_fixes.append({
                        "scene": sid, "file": c["file"], "phrase": c["phrase"],
                        "oldCall": old, "newCall": f'A("{c["phrase"]}", {pick.occ})',
                        "oldOcc": c["occ"], "newOcc": pick.occ,
                        "oldSpan": cur.as_dict() if cur else None,
                        "newSpan": pick.as_dict(),
                        "reason": "occ resolves outside scene window; in-window occurrence selected"})
            new_last[r.section][sid] = max(
                [a.span.end_word for a in r.anchors] + [c.span.end_word for c in r.calls],
                default=new_last[r.section].get(sid, -1))

        stable = (it > 0 and last_end_word.get(f"{it-1}:ALL") == new_last)
        last_end_word[f"{it}:ALL"] = new_last
        for sec in new_last:
            last_end_word[f"{it}:{sec}"] = new_last[sec]
        if stable:
            break

    failures = [f for sid in all_ids for f in res[sid].failures]
    return res, sf, first_span, occ_fixes, failures


# --- timing -----------------------------------------------------------------------------

def sentence_end(words: list[dict], end_word: int) -> float:
    """TRUE end of the spoken sentence containing the anchor's last word — derived from
    real punctuation, NEVER capped at scene end (capping here produced fake retention
    passes: sc010's sentence ran 0.287s into sc011). If no sentence punctuation remains
    in the section, the section's last word end is the sentence end."""
    for k in range(end_word, len(words)):
        if _SENT_RE.search(words[k]["word"]):
            return words[k]["end"]
    return words[-1]["end"] if words else 0.0


def finalize_timing(scenes: list[dict], res: dict, sf: dict, first_span: dict,
                    words_by_sec: dict):
    """Post-pass D + final rows. All status/conflicts derive from the FINAL windows.
    Retention push: scene end must cover the TRUE sentence end (protectionEnd, uncapped)
    of its last anchor. want = ceil(pe*30) with pad 0 (a pad invents conflicts at the
    ceiling); push is capped at the next scene's first SPOKEN frame — if even that is not
    enough the sentence is genuinely cut and a retention_cut conflict is logged (never
    silently clamped, never faked by capping protectionEnd)."""
    order = [s["id"] for s in scenes if s["id"] in sf]
    sf = dict(sf)
    pushes: list[dict] = []
    for i, sid in enumerate(order):
        r = res[sid]
        items = r.anchors if r.anchors else r.calls
        if not items:
            continue
        max_item = max(items, key=lambda a: a.span.end)
        maxend = max_item.span.end
        pe = sentence_end(words_by_sec[r.section], max_item.span.end_word)
        nxt = order[i + 1] if i + 1 < len(order) else None
        boundary = sf[nxt] if nxt else TOTAL_FRAMES
        want = 0
        if boundary / FPS < maxend + PAD:                 # last anchor END: 0-tolerance aim
            want = math.ceil((maxend + PAD) * FPS)
        if boundary / FPS < pe:                            # sentence retention, pad 0
            want = max(want, math.ceil(pe * FPS))
        if want <= boundary:
            continue
        if nxt:
            limit = js_round(first_span[nxt].start * FPS)
            push_to = min(want, limit)
            if push_to > boundary:
                pushes.append({"scene": sid, "boundaryAfter": nxt, "from": boundary,
                               "to": push_to, "trailingAnchor": max_item.phrase,
                               "trailingEnd": round(maxend, 3),
                               "protectionEnd": round(pe, 3),
                               "reason": "anchorEnd" if boundary / FPS < maxend + PAD
                                         and math.ceil((maxend + PAD) * FPS) >= want
                                         else "sentenceRetention"})
                sf[nxt] = push_to
        # last scene: TOTAL_FRAMES is hard — overflow stays a logged conflict below

    timing: list[dict] = []
    conflicts: list[dict] = []
    retention_rows: dict[str, dict] = {}
    for i, sid in enumerate(order):
        end_f = sf[order[i + 1]] if i + 1 < len(order) else TOTAL_FRAMES
        dur = end_f - sf[sid]
        if dur < 1:
            raise ResolutionError(f"{sid}: non-positive duration ({dur} frames)")
        r = res[sid]
        start_sec, end_sec = sf[sid] / FPS, end_f / FPS

        def row(it: Item, kind: str) -> dict:
            pe = sentence_end(words_by_sec[r.section], it.span.end_word)  # uncapped
            frac = (js_round(it.span.start * FPS) - sf[sid]) / dur
            status = "ok"
            if frac < 0 or it.span.start < start_sec - START_TOL:
                status = "out_early"
            elif frac > 1 or it.span.end > end_sec + END_TOL:
                status = "out_late"
            return {"kind": kind, "phrase": it.phrase, "occ": it.occ,
                    "start": round(it.span.start, 3), "end": round(it.span.end, 3),
                    "protectionEnd": round(pe, 3), "rawFraction": round(frac, 4),
                    "status": status}

        rows_a = [row(a, "plan") for a in r.anchors]
        rows_c = [row(c, "call") for c in r.calls]
        for rr in rows_a + rows_c:
            if rr["status"] != "ok":
                conflicts.append({
                    "scene": sid, "type": rr["status"], "kind": rr["kind"],
                    "phrase": rr["phrase"], "occ": rr["occ"],
                    "span": {"start": rr["start"], "end": rr["end"]},
                    "rawFraction": rr["rawFraction"],
                    "window": [round(start_sec, 2), round(end_sec, 2)]})
        maxend = max([a.span.end for a in r.anchors + r.calls], default=0.0)
        items = r.anchors if r.anchors else r.calls
        pe_scene = sentence_end(words_by_sec[r.section],
                                max(items, key=lambda a: a.span.end).span.end_word) \
            if items else end_sec
        retention_rows[sid] = {"protectionEnd": round(pe_scene, 3),
                               "sceneEnd": round(end_sec, 3),
                               "marginSec": round(end_sec - pe_scene, 3),
                               "ok": end_sec >= pe_scene - END_TOL}
        if not retention_rows[sid]["ok"]:
            conflicts.append({"scene": sid, "type": "retention_cut",
                              "protectionEnd": round(pe_scene, 3),
                              "sceneEnd": round(end_sec, 3),
                              "cutSec": round(pe_scene - end_sec, 3),
                              "note": "sentence of last anchor extends past scene end and "
                                      "cannot be pushed before next scene's first spoken "
                                      "word — real content conflict"})
        timing.append({
            "sceneId": sid, "sectionId": r.section,
            "startFrame": sf[sid], "durationInFrames": dur,
            "firstAnchor": r.first_anchor.phrase if r.first_anchor else None,
            "firstAnchorStart": round(first_span[sid].start, 3),
            "maxAnchorEnd": round(maxend, 3),
            "overflowSec": round(max(0.0, maxend - end_sec), 3),
            "retention": retention_rows[sid],
            "anchors": rows_a, "calls": rows_c,
        })
    # structural note for unresolvable trailing overflows (kept as conflicts, never clamped)
    for t in timing:
        if t["overflowSec"] > END_TOL:
            conflicts.append({"scene": t["sceneId"], "type": "trailing_overflow",
                              "overflowSec": t["overflowSec"],
                              "maxAnchorEnd": t["maxAnchorEnd"],
                              "window": [round(t["startFrame"] / FPS, 2),
                                         round((t["startFrame"] + t["durationInFrames"]) / FPS, 2)]})
    # cross-check lead-measured retention ground truth against the transcript-derived pe
    retention_checks = []
    by_id = {t["sceneId"]: t for t in timing}
    for req in RETENTION_REQUIREMENTS:
        t = by_id.get(req["scene"])
        if t is None:
            retention_checks.append({**req, "verified": False,
                                     "error": "scene missing from timing"})
            continue
        pe = t["retention"]["protectionEnd"]
        entry = {**req, "computedProtectionEnd": pe,
                 "measuredMatch": abs(pe - req["expectEndSec"]) <= 0.05,
                 "sceneEnd": t["retention"]["sceneEnd"],
                 "marginSec": t["retention"]["marginSec"],
                 "retained": t["retention"]["ok"]}
        nxt = [n for n in by_id if by_id[n]["startFrame"] >= t["startFrame"] + t["durationInFrames"]]
        if nxt:
            nsid = min(nxt, key=lambda n: by_id[n]["startFrame"])
            entry["nextScene"] = nsid
            entry["nextStartSec"] = round(by_id[nsid]["startFrame"] / FPS, 3)
            if req.get("nextSpokenSec") is not None:
                entry["nextSpokenMeasured"] = round(first_span[nsid].start, 3)
                entry["nextSpokenMatch"] = abs(first_span[nsid].start
                                               - req["nextSpokenSec"]) <= 0.05
        retention_checks.append(entry)
    return timing, pushes, conflicts, retention_rows, retention_checks


# --- io helpers -------------------------------------------------------------------------

def load_project() -> tuple[list[dict], dict, dict[str, list[dict]]]:
    sp = json.loads((PROJECT / "artifacts" / "scene_plan.json").read_text())
    scenes = sorted((s for s in sp["scenes"] if isinstance(s, dict)), key=lambda s: s["id"])
    words = json.loads((PROJECT / "assets/audio/transcripts/narration_words.json").read_text())
    calls = scan_scene_calls()
    return scenes, words, calls
