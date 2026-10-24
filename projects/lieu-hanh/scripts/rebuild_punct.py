#!/usr/bin/env python3
"""Rebuild narration_words.json with punctuation + canonical spelling from the script's
provider_text (S2E03 pattern: canonical-aligned transcript). Timestamps stay from real
audio; only each word's string is replaced by its matched provider token (which carries
sentence punctuation). Unmatched whisper words keep their own string.

This makes sentence_end() in phrase_lock reflect the REAL script sentences, so scene
boundaries land on true sentence ends (panels retained through final spoken sentence)."""
import json, re, sys, unicodedata
from difflib import SequenceMatcher
from pathlib import Path

OM = Path("/Users/tuyennguyen/project/OpenMontage")
P = OM / "projects" / "lieu-hanh"

def norm(text):
    text = unicodedata.normalize("NFD", text.lower().replace("đ", "d").replace("Đ", "d"))
    return "".join(c for c in text if c.isalnum() and not unicodedata.combining(c))

script = json.loads((P / "artifacts" / "script.json").read_text(encoding="utf-8"))
words_all = json.loads((P / "assets" / "audio" / "transcripts" / "narration_words.json").read_text(encoding="utf-8"))

out = {}
stats = {"sections": 0, "matched": 0, "unmatched": 0, "sentences_before": 0, "sentences_after": 0}
SENT = re.compile(r"[.!?…]")
for s in script["sections"]:
    sid = s["id"]
    words = words_all[sid]
    prov = [w for w in s["delivery_cues"]["provider_text"].split() if norm(w)]
    stats["sentences_before"] += sum(1 for w in words if SENT.search(w["word"]))
    a = [norm(w["word"]) for w in words]
    b = [norm(w) for w in prov]
    m = SequenceMatcher(None, a, b, autojunk=False)
    new_words = []
    matched = 0
    for tag, i0, i1, j0, j1 in m.get_opcodes():
        if tag == "equal":
            for k in range(i1 - i0):
                new_words.append({"word": prov[j0 + k], "start": words[i0 + k]["start"], "end": words[i0 + k]["end"]})
                matched += 1
        elif tag == "replace":
            la, lb = i1 - i0, j1 - j0
            if la == lb:
                for k in range(la):
                    new_words.append({"word": prov[j0 + k], "start": words[i0 + k]["start"], "end": words[i0 + k]["end"]})
                    matched += 1
            else:
                # align by best-ratio pairing, spill remainder to nearest
                k = 0
                while k < min(la, lb):
                    new_words.append({"word": prov[j0 + k], "start": words[i0 + k]["start"], "end": words[i0 + k]["end"]})
                    matched += 1
                    k += 1
                if la > lb:  # extra whisper words: attach to last provider token
                    for k2 in range(i0 + k, i1):
                        new_words.append({"word": words[k2]["word"], "start": words[k2]["start"], "end": words[k2]["end"]})
                else:  # extra provider tokens: interpolate silently-zero-span words
                    prev_end = new_words[-1]["end"] if new_words else 0.0
                    for j2 in range(j0 + k, j1):
                        new_words.append({"word": prov[j2], "start": prev_end, "end": prev_end})
        elif tag == "delete":
            for k2 in range(i0, i1):
                new_words.append(words[k2])  # keep whisper word as-is
        elif tag == "insert":
            prev_end = new_words[-1]["end"] if new_words else 0.0
            for j2 in range(j0, j1):
                new_words.append({"word": prov[j2], "start": prev_end, "end": prev_end})
    # monotonic guard
    for i in range(1, len(new_words)):
        if new_words[i]["start"] < new_words[i - 1]["start"]:
            new_words[i]["start"] = new_words[i - 1]["start"]
        if new_words[i]["end"] < new_words[i]["start"]:
            new_words[i]["end"] = new_words[i]["start"]
    stats["matched"] += matched
    stats["unmatched"] += len(new_words) - matched
    stats["sentences_after"] += sum(1 for w in new_words if SENT.search(w["word"]))
    out[sid] = new_words
    stats["sections"] += 1

(P / "assets" / "audio" / "transcripts" / "narration_words.json").write_text(
    json.dumps(out, ensure_ascii=False, indent=1), encoding="utf-8")
print(json.dumps(stats))
print("narration_words.json rebuilt (provider spelling + punctuation, real timestamps)")
