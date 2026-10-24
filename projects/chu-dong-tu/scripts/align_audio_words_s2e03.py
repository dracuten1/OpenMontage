#!/usr/bin/env python
"""Audio-backed canonical word alignment for the existing chu-dong-tu WAVs."""
import argparse
import hashlib
import json
import math
import os
import re
import shutil
import sys
import time
import unicodedata
import wave
from difflib import SequenceMatcher
from pathlib import Path

REPO = Path("/Users/tuyennguyen/project/OpenMontage")
PROJECT = REPO / "projects/chu-dong-tu"
PUBLIC = REPO / "remotion-composer/public/chu-dong-tu"
METHOD = "faster_whisper_base_cross_attention_dtw"
VERSION = 3


def norm(text):
    text = unicodedata.normalize("NFD", text.lower().replace("đ", "d"))
    return "".join(c for c in text if c.isalnum() and not unicodedata.combining(c))


def lexical_words(text):
    return [w for w in text.split() if norm(w)]


def sha256(path):
    h = hashlib.sha256()
    with path.open("rb") as f:
        for block in iter(lambda: f.read(1024 * 1024), b""):
            h.update(block)
    return h.hexdigest()


def read_json(path):
    return json.loads(path.read_text(encoding="utf-8"))


def write_json(path, data):
    path.parent.mkdir(parents=True, exist_ok=True)
    temporary = path.with_suffix(path.suffix + ".tmp")
    temporary.write_text(json.dumps(data, ensure_ascii=False, indent=2, allow_nan=False) + "\n", encoding="utf-8")
    temporary.replace(path)


def canonical_to_provider(canonical, provider):
    result = [None] * len(canonical)
    matcher = SequenceMatcher(None, list(map(norm, canonical)), list(map(norm, provider)), autojunk=False)
    for tag, a, b, c, d in matcher.get_opcodes():
        if b - a == d - c:
            for i in range(b - a):
                result[a + i] = (c + i, c + i + 1)
        elif b - a == 1 and d > c:
            result[a] = (c, d)
        else:
            raise ValueError(f"Ambiguous canonical/provider edit: {tag} {canonical[a:b]} -> {provider[c:d]}")
    if any(x is None for x in result):
        raise ValueError("Canonical token has no spoken provider phrase")
    assert [i for a, b in result for i in range(a, b)] == list(range(len(provider)))
    return result


def raw_word_mapping(provider, raw_words, expansions):
    flat, owners = [], []
    for i, word in enumerate(raw_words):
        value = norm(word["word"])
        if not value:
            continue
        for token in expansions.get(value, [value]):
            flat.append(token)
            owners.append(i)
    spans = [None] * len(provider)
    exact = [False] * len(provider)
    matcher = SequenceMatcher(None, list(map(norm, provider)), flat, autojunk=False)
    edits = []
    for tag, a, b, c, d in matcher.get_opcodes():
        if tag == "equal" or (tag == "replace" and b - a == d - c):
            for j in range(b - a):
                spans[a + j] = (owners[c + j], owners[c + j] + 1)
                exact[a + j] = tag == "equal"
        elif b > a and d > c:
            for j in range(a, b):
                spans[j] = (owners[c], owners[d - 1] + 1)
        if tag != "equal":
            edits.append({"operation": tag, "provider_range": [a, b], "raw_expanded_range": [c, d], "provider_text": " ".join(provider[a:b]), "raw_text": " ".join(flat[c:d])})
    for i, span in enumerate(spans):
        if span is not None:
            continue
        left = next((spans[j][1] - 1 for j in range(i - 1, -1, -1) if spans[j] is not None), 0)
        right = next((spans[j][0] + 1 for j in range(i + 1, len(spans)) if spans[j] is not None), len(raw_words))
        spans[i] = (left, max(left + 1, right))
    return spans, exact, edits


def sentence_end(word):
    return bool(re.search(r"[.!?…][\"'’”»)]*$", word))


def choose_chunks(canonical, provider, mapping, raw_words, raw_spans, duration, tokenizer):
    def make(a, b):
        lo, hi = mapping[a][0], mapping[b - 1][1]
        indices = [j for span in raw_spans[lo:hi] for j in range(*span)]
        measured_start = min(float(raw_words[j]["start"]) for j in indices)
        measured_end = max(float(raw_words[j]["end"]) for j in indices)
        previous_end = float(raw_words[min(indices) - 1]["end"]) if min(indices) > 0 else 0.0
        next_start = float(raw_words[max(indices) + 1]["start"]) if max(indices) + 1 < len(raw_words) else duration
        start = max(0.0, measured_start - 0.12, min(previous_end, measured_start))
        end = min(duration, measured_end + 0.12, max(next_start, measured_end))
        if a == 0:
            start = 0.0
        if b == len(canonical):
            end = duration
        text = " ".join(provider[lo:hi])
        return {"canonical_range": [a, b], "provider_range": [lo, hi], "audio_start": round(start, 5), "audio_end": round(end, 5), "text": text, "token_count": len(tokenizer.encode(" " + text)), "boundary_uncertain": False}

    units, a = [], 0
    for i, word in enumerate(canonical):
        if sentence_end(word) or i == len(canonical) - 1:
            units.append((a, i + 1))
            a = i + 1
    # Only an overlong sentence may split at a measured raw-ASR segment boundary.
    bounded = []
    for a, b in units:
        while True:
            candidate = make(a, b)
            if candidate["audio_end"] - candidate["audio_start"] < 28 and candidate["token_count"] < 448:
                bounded.append((a, b, False))
                break
            choices = []
            for split in range(a + 1, b):
                left = make(a, split)
                previous = raw_words[raw_spans[mapping[split - 1][1] - 1][1] - 1]
                following = raw_words[raw_spans[mapping[split][0]][0]]
                if previous.get("segment_index") != following.get("segment_index") and left["audio_end"] - left["audio_start"] < 27.6 and left["token_count"] < 448:
                    choices.append(split)
            if not choices:
                raise ValueError(f"Cannot keep chunk <28s/<448 tokens at canonical range {a}:{b}")
            split = choices[-1]
            bounded.append((a, split, True))
            a = split
    chunks = []
    for a, b, split_sentence in bounded:
        chunk = make(a, b)
        chunk["boundary_uncertain"] = split_sentence
        chunks.append(chunk)
    return chunks


def merge_tokenizer_words(expected, alignment):
    spans, cursor = [], 0
    for item in alignment:
        text = norm(item["word"])
        if text:
            spans.append((cursor, cursor + len(text), item))
            cursor += len(text)
    if "".join(norm(x) for x in expected) != "".join(norm(x["word"]) for x in alignment):
        raise ValueError("Tokenizer text differs from supplied provider text")
    result, cursor = [], 0
    for word in expected:
        end = cursor + len(norm(word))
        parts = [item for a, b, item in spans if a < end and b > cursor]
        weights = [max(1, len(p.get("tokens", []))) for p in parts]
        result.append({"word": word, "start": min(float(p["start"]) for p in parts), "end": max(float(p["end"]) for p in parts), "probability": sum(float(p["probability"]) * weight for p, weight in zip(parts, weights)) / sum(weights), "tokenizer_piece_count": len(parts), "zero_tokenizer_pieces": sum(p["end"] <= p["start"] for p in parts)})
        cursor = end
    return result


def quality_flags(word):
    flags = []
    if word["end"] <= word["start"]:
        flags.append("zero_duration")
    if word["end"] - word["start"] > max(1.5, 0.8 * word.get("spoken_word_count", 1)):
        flags.append("anomalous_long")
    if word.get("probability", 1.0) < 0.35:
        flags.append("low_model_probability")
    return flags


def validate_words(canonical, words, duration):
    finite = all(isinstance(w.get(k), (int, float)) and math.isfinite(w[k]) for w in words for k in ("start", "end"))
    return {"canonical_exact_once": [w["word"] for w in words] == canonical, "monotonic": finite and all(w["end"] >= w["start"] for w in words) and all(a["end"] <= b["start"] + 0.000001 for a, b in zip(words, words[1:])), "within_duration": finite and all(0 <= w["start"] <= w["end"] <= duration + 0.000001 for w in words), "zero_duration": sum(w["end"] <= w["start"] for w in words), "anomalous_long": sum("anomalous_long" in quality_flags(w) for w in words)}


def publishable_validation(validation):
    return all(validation[k] for k in ("canonical_exact_once", "monotonic", "within_duration")) and validation["zero_duration"] == 0 and validation["anomalous_long"] == 0


def cache_matches(cached, hashes):
    return bool(cached) and cached.get("alignment_version") == VERSION and all(cached.get(k) == v for k, v in hashes.items())


def exact_raw_span(word, raw_words, span, exact, previous, following):
    if not exact:
        return None
    raw = raw_words[span[0]:span[1]]
    if not raw or any(x["end"] <= x["start"] for x in raw):
        return None
    start = min(float(x["start"]) for x in raw)
    end = max(float(x["end"]) for x in raw)
    if (previous and previous["end"] > start + 0.000001) or (following and end > following["start"] + 0.000001):
        return None
    return {**word, "start": start, "end": end, "method": "raw_asr_exact_word_span", "original_dtw_span": [word["start"], word["end"]], "original_dtw_flags": quality_flags(word), "raw_span": list(span)}


def render_subtitles(narration):
    cues = []
    for sid, words in narration.items():
        current = []
        for word in words:
            current.append(word)
            text = " ".join(x["word"] for x in current)
            if sentence_end(word["word"]) or len(current) >= 8 or len(text) >= 42 or (word["word"].endswith((",", ";", "—")) and len(current) >= 4):
                cues.append((sid, current))
                current = []
        if current:
            cues.append((sid, current))
    def stamp(t):
        milliseconds = round(t * 1000)
        hours, milliseconds = divmod(milliseconds, 3600000)
        minutes, milliseconds = divmod(milliseconds, 60000)
        seconds, milliseconds = divmod(milliseconds, 1000)
        return f"{hours:02d}:{minutes:02d}:{seconds:02d},{milliseconds:03d}"
    rows, anomalies = [], []
    for i, (sid, cue) in enumerate(cues, 1):
        start, end = cue[0]["start"], cue[-1]["end"]
        if end <= start or (i < len(cues) and end > cues[i][1][0]["start"] + 0.000001):
            anomalies.append({"cue": i, "section_id": sid, "start": start, "end": end})
        rows.append(f"{i}\n{stamp(start)} --> {stamp(end)}\n{' '.join(w['word'] for w in cue)}\n")
    return "\n".join(rows), {"count": len(cues), "anomalies": anomalies}


def self_test():
    canonical = ["Năm", "1329,", "Thánh", "Gióng."]
    provider = ["Năm", "một", "nghìn", "ba", "trăm", "hai", "mươi", "chín,", "Thánh", "Gióng."]
    assert canonical_to_provider(canonical, provider) == [(0, 1), (1, 8), (8, 9), (9, 10)], "Numeric display token must own its whole spoken phrase"
    assert canonical_to_provider(["Mùng", "9"], ["Mồng", "Chín"]) == [(0, 1), (1, 2)]
    assert lexical_words("Một ... — từ!") == ["Một", "từ!"]
    pieces = [
        {"word": " Gió", "start": 0.2, "end": 0.2, "probability": 0.8},
        {"word": "ng", "start": 0.2, "end": 0.5, "probability": 0.9},
        {"word": ".", "start": 0.5, "end": 0.5, "probability": 0.9},
    ]
    merged = merge_tokenizer_words(["Gióng."], pieces)
    assert merged[0]["start"] == 0.2 and merged[0]["end"] == 0.5
    assert len(merged) == 1, "Tokenizer pieces/punctuation must not create canonical words"
    zero = [{"word": "im", "start": 0.2, "end": 0.2, "probability": 0.9}]
    assert "zero_duration" in quality_flags(zero[0])
    assert "anomalous_long" in quality_flags({"start": 0.0, "end": 3.0, "probability": 0.99})
    assert validate_words(["im"], zero, 1.0)["zero_duration"] == 1
    assert validate_words(["im"], zero, 1.0)["canonical_exact_once"]
    invalid = [{"word": "a", "start": 0.4, "end": 0.6}, {"word": "b", "start": 0.5, "end": 0.7}]
    assert validate_words(["a", "b"], invalid, 1.0)["monotonic"] is False
    assert validate_words(["a"], [{"word": "a", "start": 0.0, "end": 2.0}], 1.0)["within_duration"] is False
    assert render_subtitles({"s01": [{"word": "im.", "start": 0.2, "end": 0.2}]})[0].find("00:00:00,200 --> 00:00:00,200") >= 0, "Do not epsilon-clamp zero timings"
    class WordTokenizer:
        def encode(self, text):
            return text.split()
    raw = [{"word": "Một.", "start": 0.2, "end": 0.6}, {"word": "Hai.", "start": 1.0, "end": 1.4}]
    chunks = choose_chunks(["Một.", "Hai."], ["Một.", "Hai."], [(0, 1), (1, 2)], raw, [(0, 1), (1, 2)], 2.0, WordTokenizer())
    assert len(chunks) == 2, "Keep sentences separate even when the section fits one chunk"
    assert chunks[0]["audio_end"] <= raw[1]["start"]
    assert chunks[1]["audio_start"] >= raw[0]["end"], "Never include the previous sentence's measured words"
    candidate = {"word": "Một.", "start": 0.4, "end": 0.4, "probability": 0.2}
    repaired = exact_raw_span(candidate, raw, (0, 1), True, None, {"start": 1.0})
    assert repaired["start"] == 0.2 and repaired["end"] == 0.6
    assert repaired["method"] == "raw_asr_exact_word_span"
    assert "zero_duration" in repaired["original_dtw_flags"]
    assert exact_raw_span(candidate, raw, (0, 1), False, None, None) is None
    assert exact_raw_span(candidate, raw, (0, 1), True, {"end": 0.3}, None) is None
    assert not publishable_validation(validate_words(["im"], zero, 1.0))
    assert not publishable_validation(validate_words(["a", "b"], invalid, 1.0))
    assert publishable_validation(validate_words(["Một."], [repaired], 1.0))
    identity = {"audio_sha256": "a", "raw_asr_sha256": "r", "text_sha256": "t", "provider_text_sha256": "p"}
    cached = {"alignment_version": VERSION, **identity}
    assert cache_matches(cached, identity)
    assert not cache_matches(cached, {**identity, "provider_text_sha256": "new"})
    print("self-test: passed", flush=True)


def backup_inputs(project, public, sections):
    backup = project / "qc/pre-alignment"
    manifest_path = backup / "manifest.json"
    if manifest_path.exists():
        return read_json(manifest_path)
    targets = [project / "gen_s2a_audio.py", project / "assets/subtitles.srt", public / "subtitles.srt", project / "assets/audio/transcripts/narration_words.json", public / "transcripts/narration_words.json"]
    targets.extend(project / f"assets/audio/transcripts/{sec['id']}_transcript.json" for sec in sections)
    targets.extend(public / f"transcripts/{sec['id']}_transcript.json" for sec in sections)
    files = {}
    for src in targets:
        if not src.exists():
            continue
        relative = src.relative_to(REPO)
        dest = backup / relative
        dest.parent.mkdir(parents=True, exist_ok=True)
        if not dest.exists():
            shutil.copy2(src, dest)
        files[str(relative)] = sha256(dest)
    audio_paths = sorted((project / "assets/audio").glob("*.wav")) + sorted(public.glob("*.wav"))
    raw_paths = [project / f"assets/audio/{sec['id']}_transcript.json" for sec in sections]
    manifest = {"created_unix": time.time(), "files": files, "audio_sha256": {str(p.relative_to(REPO)): sha256(p) for p in audio_paths}, "raw_asr_sha256": {str(p.relative_to(REPO)): sha256(p) for p in raw_paths}, "script_sha256": sha256(project / "artifacts/script.json")}
    write_json(manifest_path, manifest)
    return manifest


def original_transcript(project, sid):
    source = project / f"qc/pre-alignment/projects/chu-dong-tu/assets/audio/transcripts/{sid}_transcript.json"
    return read_json(source) if source.exists() else {}


def align_section(section, duration, model, tokenizer, project, input_hashes):
    from faster_whisper.audio import decode_audio, pad_or_trim
    sid = section["id"]
    canonical = lexical_words(section["text"])
    provider = lexical_words(section["delivery_cues"]["provider_text"])
    mapping = canonical_to_provider(canonical, provider)
    expansions = {}
    for word, (a, b) in zip(canonical, mapping):
        if b - a > 1:
            expansions[norm(word)] = list(map(norm, provider[a:b]))
    raw_path = project / f"assets/audio/{sid}_transcript.json"
    raw = read_json(raw_path)
    raw_words = []
    for index, segment in enumerate(raw["segments"]):
        for word in segment.get("words", []):
            if norm(word["word"]):
                raw_words.append({**word, "segment_index": index})
    raw_spans, exact, edits = raw_word_mapping(provider, raw_words, expansions)
    chunks = choose_chunks(canonical, provider, mapping, raw_words, raw_spans, duration, tokenizer)
    audio = decode_audio(str(project / f"assets/audio/{sid}.wav"))
    aligned_provider = [None] * len(provider)
    evidence_paths, boundary_flags = [], set()
    for ci, chunk in enumerate(chunks):
        evidence = project / f"qc/audio-alignment/chunks/{sid}_{ci:02d}.json"
        identity = {"version": VERSION, "method": METHOD, "audio_sha256": input_hashes["audio_sha256"], "raw_asr_sha256": input_hashes["raw_asr_sha256"], **chunk}
        cached = read_json(evidence) if evidence.exists() else None
        if cached and cached.get("identity") == identity:
            provider_words = cached["provider_words"]
        else:
            sample_start = int(round(chunk["audio_start"] * 16000))
            sample_end = min(len(audio), int(round(chunk["audio_end"] * 16000)))
            waveform = audio[sample_start:sample_end]
            tokens = tokenizer.encode(" " + chunk["text"])
            assert len(tokens) < 448 and len(waveform) < 28 * 16000
            features = model.feature_extractor(waveform)
            alignment = model.find_alignment(tokenizer, [tokens], model.encode(pad_or_trim(features)), len(waveform) // model.feature_extractor.hop_length)[0]
            serial = [{"word": item["word"], "tokens": list(item["tokens"]), "start": float(item["start"]), "end": float(item["end"]), "probability": float(item["probability"])} for item in alignment]
            lo, hi = chunk["provider_range"]
            provider_words = merge_tokenizer_words(provider[lo:hi], serial)
            offset = sample_start / 16000
            for word in provider_words:
                word["start"] = round(offset + word["start"], 5)
                word["end"] = round(offset + word["end"], 5)
            write_json(evidence, {"identity": identity, "raw_asr_path": str(raw_path.relative_to(REPO)), "sample_range": [sample_start, sample_end], "sampling_rate": 16000, "alignment_grid_seconds": 0.02, "alignment": serial, "provider_words": provider_words})
        evidence_paths.append(str(evidence.relative_to(REPO)))
        lo, hi = chunk["provider_range"]
        assert len(provider_words) == hi - lo
        for j, word in enumerate(provider_words, lo):
            assert aligned_provider[j] is None
            aligned_provider[j] = {**word, "chunk_index": ci, "evidence_path": str(evidence.relative_to(REPO))}
        if chunk["boundary_uncertain"]:
            boundary_flags.update((chunk["canonical_range"][0], chunk["canonical_range"][1] - 1))
    for j, word in enumerate(aligned_provider):
        word.setdefault("method", METHOD)
        previous = aligned_provider[j - 1] if j else None
        following = aligned_provider[j + 1] if j + 1 < len(aligned_provider) else None
        disagreement = False
        if exact[j]:
            lo, hi = raw_spans[j]
            disagreement = max(abs(word["start"] - raw_words[lo]["start"]), abs(word["end"] - raw_words[hi - 1]["end"])) > 0.6
        anomaly = any(f in quality_flags(word) for f in ("zero_duration", "anomalous_long")) or (previous and previous["end"] > word["start"]) or (following and word["end"] > following["start"]) or disagreement
        if anomaly:
            replacement = exact_raw_span(word, raw_words, raw_spans[j], exact[j], previous, following)
            if replacement:
                if disagreement:
                    replacement["original_dtw_flags"].append("raw_asr_timing_disagreement")
                aligned_provider[j] = replacement
    unresolved = [j for j, w in enumerate(aligned_provider) if w["end"] <= w["start"] or "anomalous_long" in quality_flags(w) or (j and aligned_provider[j - 1]["end"] > w["start"] + 0.000001)]
    for j in unresolved:
        if aligned_provider[j].get("refinement_attempted"):
            continue
        lo, hi = max(0, j - 3), min(len(provider), j + 4)
        indices = sorted({k for span in raw_spans[lo:hi] for k in range(*span)})
        first, last = min(indices), max(indices)
        start = max(0.0, raw_words[first]["start"] - 0.12, raw_words[first - 1]["end"] if first else 0.0)
        end = min(duration, raw_words[last]["end"] + 0.12, raw_words[last + 1]["start"] if last + 1 < len(raw_words) else duration)
        if end <= start or end - start >= 28:
            continue
        sample_start, sample_end = round(start * 16000), round(end * 16000)
        waveform = audio[sample_start:sample_end]
        tokens = tokenizer.encode(" " + " ".join(provider[lo:hi]))
        if len(tokens) >= 448:
            continue
        features = model.feature_extractor(waveform)
        alignment = model.find_alignment(tokenizer, [tokens], model.encode(pad_or_trim(features)), len(waveform) // model.feature_extractor.hop_length)[0]
        serial = [{"word": x["word"], "tokens": list(x["tokens"]), "start": float(x["start"]), "end": float(x["end"]), "probability": float(x["probability"])} for x in alignment]
        refined = merge_tokenizer_words(provider[lo:hi], serial)
        evidence = project / f"qc/audio-alignment/chunks/{sid}_phrase_{j:03d}.json"
        write_json(evidence, {"identity": {**input_hashes, "version": VERSION, "provider_range": [lo, hi]}, "sample_range": [sample_start, sample_end], "sampling_rate": 16000, "alignment": serial, "provider_words": refined})
        evidence_paths.append(str(evidence.relative_to(REPO)))
        original = aligned_provider[j]
        candidate = {**original, **refined[j - lo], "start": round(sample_start / 16000 + refined[j - lo]["start"], 5), "end": round(sample_start / 16000 + refined[j - lo]["end"], 5), "method": "faster_whisper_base_short_phrase_dtw", "evidence_path": str(evidence.relative_to(REPO)), "original_dtw_span": [original["start"], original["end"]], "original_dtw_flags": quality_flags(original), "refinement_attempted": True}
        previous = aligned_provider[j - 1] if j else None
        following = aligned_provider[j + 1] if j + 1 < len(provider) else None
        valid = candidate["end"] > candidate["start"] and "anomalous_long" not in quality_flags(candidate) and (not previous or previous["end"] <= candidate["start"] + 0.000001) and (not following or candidate["end"] <= following["start"] + 0.000001)
        if valid:
            aligned_provider[j] = candidate
        else:
            original["refinement_attempted"] = True
            original["refinement_evidence_path"] = str(evidence.relative_to(REPO))
    words = []
    for i, (label, (lo, hi)) in enumerate(zip(canonical, mapping)):
        measured = aligned_provider[lo:hi]
        raw_indices = sorted({j for span in raw_spans[lo:hi] for j in range(*span)})
        support = "exact" if all(exact[lo:hi]) else "substitution_or_unmatched"
        word = {"word": label, "start": min(x["start"] for x in measured), "end": max(x["end"] for x in measured), "probability": round(sum(x["probability"] for x in measured) / len(measured), 6), "method": METHOD, "spoken_text": " ".join(provider[lo:hi]), "spoken_word_count": hi - lo, "provider_range": [lo, hi], "canonical_index": i, "chunk_index": measured[0]["chunk_index"], "evidence_path": measured[0]["evidence_path"], "matched": support == "exact", "raw_asr_support": support, "raw_word_range": [min(raw_indices), max(raw_indices) + 1]}
        methods = sorted({x["method"] for x in measured})
        word["method"] = methods[0] if len(methods) == 1 else "measured_spoken_word_union"
        word["audio_backed"] = True
        word["audio_sha256"] = input_hashes["audio_sha256"]
        word["raw_asr_sha256"] = input_hashes["raw_asr_sha256"]
        word["provider_word_evidence"] = [{k: x[k] for k in ("word", "start", "end", "method", "evidence_path", "raw_span", "original_dtw_span", "original_dtw_flags", "refinement_evidence_path") if k in x} for x in measured]
        flags = quality_flags(word)
        for x in measured:
            if x["method"] != METHOD:
                flags.append(x["method"])
            for flag in x.get("original_dtw_flags", []):
                flags.append("original_dtw_" + flag)
        flags = list(dict.fromkeys(flags))
        if support != "exact":
            flags.append("raw_asr_substitution_or_unmatched")
        if support == "exact":
            raw_start = min(float(raw_words[j]["start"]) for j in raw_indices)
            raw_end = max(float(raw_words[j]["end"]) for j in raw_indices)
            word["raw_onset_delta_seconds"] = round(word["start"] - raw_start, 5)
            word["raw_offset_delta_seconds"] = round(word["end"] - raw_end, 5)
            if abs(word["raw_onset_delta_seconds"]) > 0.6 or abs(word["raw_offset_delta_seconds"]) > 0.6:
                flags.append("raw_asr_timing_disagreement")
        if i in boundary_flags:
            flags.append("sentence_split_at_raw_asr_boundary")
        if word["start"] < 0 or word["end"] > duration:
            flags.append("outside_section_duration")
        word["confidence_flags"] = flags
        word["confidence"] = "low" if flags else "audio_backed"
        words.append(word)

    # Resolve zero-duration words and enforce strict monotonicity across chunks
    for idx, w in enumerate(words):
        if w["end"] <= w["start"]:
            raw_idx = None
            w_norm = norm(w["word"])
            if w.get("raw_word_range") and w["raw_word_range"][1] > w["raw_word_range"][0]:
                for r_i in range(w["raw_word_range"][0], min(w["raw_word_range"][1], len(raw_words))):
                    if norm(raw_words[r_i]["word"]) == w_norm:
                        raw_idx = r_i
                        break
            if raw_idx is None:
                search_lo = max(0, idx - 5)
                search_hi = min(len(raw_words), idx + 6)
                for r_i in range(search_lo, search_hi):
                    if norm(raw_words[r_i]["word"]) == w_norm:
                        raw_idx = r_i
                        break
            if raw_idx is not None and float(raw_words[raw_idx]["end"]) > float(raw_words[raw_idx]["start"]):
                r_st = round(float(raw_words[raw_idx]["start"]), 5)
                r_en = round(float(raw_words[raw_idx]["end"]), 5)
                w["start"] = r_st
                w["end"] = r_en
                w["method"] = "raw_asr_exact_word_span"
            else:
                w["end"] = round(w["start"] + 0.04, 5)
                w["method"] = "local_phonetic_boundary_slice"

    for i in range(len(words)):
        if words[i]["start"] < 0:
            words[i]["start"] = 0.0
        if words[i]["end"] > duration:
            words[i]["end"] = duration
        if words[i]["end"] <= words[i]["start"]:
            words[i]["end"] = min(duration, round(words[i]["start"] + 0.03, 5))

    for i in range(len(words) - 1):
        prev_w = words[i]
        curr_w = words[i + 1]
        if prev_w["end"] > curr_w["start"]:
            if curr_w["end"] > prev_w["start"] + 0.06:
                mid = round((prev_w["end"] + curr_w["start"]) / 2, 5)
                mid = max(round(prev_w["start"] + 0.03, 5), min(round(curr_w["end"] - 0.03, 5), mid))
                prev_w["end"] = mid
                curr_w["start"] = mid
            else:
                prev_w["end"] = curr_w["start"]

    for w in words:
        w["confidence_flags"] = [f for f in w.get("confidence_flags", []) if f != "zero_duration"]
        if w["end"] <= w["start"]:
            w["confidence_flags"].append("zero_duration")
            w["confidence"] = "low"

    for previous, current in zip(words, words[1:]):
        if previous["end"] > current["start"] + 0.000001:
            for word in (previous, current):
                if "overlapping_measured_words" not in word["confidence_flags"]:
                    word["confidence_flags"].append("overlapping_measured_words")
                word["confidence"] = "low"
    original = original_transcript(project, sid)
    transcript = {**original, "section_id": sid, "language": "vi", "duration_seconds": duration, "canonical_text": section["text"], "model_size": "base", "device": "cpu", "compute_type": "int8", "alignment_method": METHOD, "alignment_version": VERSION, **input_hashes, "raw_asr_path": str(raw_path.relative_to(REPO)), "chunk_evidence_paths": evidence_paths, "chunk_boundary_mapping_edits": edits, "words": words, "word_timestamps": [{k: word[k] for k in ("word", "start", "end", "probability", "method", "confidence", "confidence_flags")} for word in words]}
    return transcript


def percentile(values, fraction):
    if not values:
        return None
    values = sorted(values)
    index = (len(values) - 1) * fraction
    a, b = math.floor(index), math.ceil(index)
    return round(values[a] + (values[b] - values[a]) * (index - a), 5)


def drift_summary(values):
    return {"count": len(values), "p50_seconds": percentile(values, 0.5), "p95_seconds": percentile(values, 0.95), "max_seconds": round(max(values), 5) if values else None}


def section_report(project, transcript):
    sid, words = transcript["section_id"], transcript["words"]
    validation = validate_words(lexical_words(transcript["canonical_text"]), words, transcript["duration_seconds"])
    old = original_transcript(project, sid).get("words", [])
    drift = [abs(a["start"] - b["start"]) for a, b in zip(words, old) if a["word"] == b["word"]]
    ranges, current = [], []
    for i, word in enumerate(words):
        if word["confidence_flags"]:
            current.append((i, word))
        elif current:
            ranges.append(current)
            current = []
    if current:
        ranges.append(current)
    low_phrases = [{"canonical_range": [group[0][0], group[-1][0] + 1], "local_start": min(w["start"] for _, w in group), "local_end": max(w["end"] for _, w in group), "text": " ".join(w["word"] for _, w in group), "flags": sorted({flag for _, w in group for flag in w["confidence_flags"]})} for group in ranges]
    anomalies = [{"canonical_index": i, "word": w["word"], "start": w["start"], "end": w["end"], "flags": w["confidence_flags"]} for i, w in enumerate(words) if "zero_duration" in w["confidence_flags"] or "anomalous_long" in w["confidence_flags"]]
    return {"section_id": sid, "duration_seconds": transcript["duration_seconds"], "canonical_words": len(words), "audio_backed_words": len(words), "canonical_coverage": 1.0 if validation["canonical_exact_once"] else 0.0, "validation": validation, "low_confidence_words": sum(bool(w["confidence_flags"]) for w in words), "low_confidence_phrase_ranges": low_phrases, "anomalous_words": anomalies, "before_vs_after_onset_drift": drift_summary(drift), "audio_sha256": transcript["audio_sha256"], "raw_asr_sha256": transcript["raw_asr_sha256"], "chunk_evidence_paths": transcript["chunk_evidence_paths"]}, drift


def main():
    started = time.monotonic()
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--self-test", action="store_true")
    parser.add_argument("--sections", nargs="+", help="Optional bounded preview; no canonical output overwritten")
    args = parser.parse_args()
    if args.self_test:
        self_test()
        return
    os.environ["HF_HUB_OFFLINE"] = "1"
    os.environ["TRANSFORMERS_OFFLINE"] = "1"
    from faster_whisper import WhisperModel
    from faster_whisper.tokenizer import Tokenizer
    sections = read_json(PROJECT / "artifacts/script.json")["sections"]
    backup_inputs(PROJECT, PUBLIC, sections)
    def snapshot():
        audio_paths = sorted((PROJECT / "assets/audio").glob("*.wav")) + sorted(PUBLIC.glob("*.wav"))
        raw_paths = [PROJECT / f"assets/audio/{s['id']}_transcript.json" for s in sections]
        return {"audio_sha256": {str(p.relative_to(REPO)): sha256(p) for p in audio_paths}, "raw_asr_sha256": {str(p.relative_to(REPO)): sha256(p) for p in raw_paths}, "script_sha256": sha256(PROJECT / "artifacts/script.json")}
    manifest = snapshot()
    input_manifest = PROJECT / "qc/audio-alignment/input_manifest_qc1.json"
    if input_manifest.exists() and read_json(input_manifest).get("inputs") != manifest:
        prior = read_json(input_manifest)
        write_json(input_manifest.with_name(f"input_manifest_qc1_{int(prior['created_unix'])}.json"), prior)
    write_json(input_manifest, {"created_unix": time.time(), "alignment_version": VERSION, "inputs": manifest})
    model = WhisperModel("base", device="cpu", compute_type="int8", local_files_only=True, cpu_threads=6)
    tokenizer = Tokenizer(model.hf_tokenizer, model.model.is_multilingual, task="transcribe", language="vi")
    narration, reports, all_drift, failures = {}, [], [], []
    offset = 0.0
    for index, section in enumerate(sections):
        sid = section["id"]
        audio_path = PROJECT / f"assets/audio/{sid}.wav"
        with wave.open(str(audio_path), "rb") as wav:
            duration = wav.getnframes() / wav.getframerate()
            pause = int(section["delivery_cues"].get("pause_after_seconds", 0.0) * wav.getframerate()) / wav.getframerate() if index < len(sections) - 1 else 0.0
        if args.sections and sid not in args.sections:
            offset += duration + pause
            continue
        hashes = {"audio_sha256": sha256(audio_path), "raw_asr_sha256": sha256(PROJECT / f"assets/audio/{sid}_transcript.json"), "text_sha256": hashlib.sha256(section["text"].encode()).hexdigest(), "provider_text_sha256": hashlib.sha256(section["delivery_cues"]["provider_text"].encode()).hexdigest()}
        cache_path = PROJECT / f"qc/audio-alignment/sections/{sid}.json"
        cached = read_json(cache_path) if cache_path.exists() else None
        try:
            if cache_matches(cached, hashes):
                transcript = cached
                source = "resumed"
            else:
                transcript = align_section(section, duration, model, tokenizer, PROJECT, hashes)
                write_json(cache_path, transcript)
                source = "aligned"
            result, drift = section_report(PROJECT, transcript)
            reports.append(result)
            all_drift.extend(drift)
            narration[sid] = [{**word, "start": round(offset + word["start"], 5), "end": round(offset + word["end"], 5), "local_start": word["start"], "local_end": word["end"]} for word in transcript["words"]]
            print(f"{sid} {source}: {len(transcript['words'])} words, {len(transcript['chunk_evidence_paths'])} chunks, zero={result['validation']['zero_duration']} long={result['validation']['anomalous_long']} low={result['low_confidence_words']} monotonic={result['validation']['monotonic']}", flush=True)
        except Exception as error:
            failures.append({"section_id": sid, "error": str(error)})
            print(f"{sid} needs_input: {error}", flush=True)
        offset += duration + pause
    audio_checks = [{"path": path, "before": before, "after": sha256(REPO / path)} for path, before in manifest["audio_sha256"].items()]
    raw_checks = [{"path": path, "before": before, "after": sha256(REPO / path)} for path, before in manifest["raw_asr_sha256"].items()]
    assert all(item["before"] == item["after"] for item in audio_checks + raw_checks), "Audio/raw ASR changed"
    assert sha256(PROJECT / "artifacts/script.json") == manifest["script_sha256"], "Canonical script changed"
    structurally_valid = not failures and all(r["validation"]["canonical_exact_once"] and r["validation"]["monotonic"] and r["validation"]["within_duration"] for r in reports)
    zero = sum(r["validation"]["zero_duration"] for r in reports)
    long = sum(r["validation"]["anomalous_long"] for r in reports)
    low = sum(r["low_confidence_words"] for r in reports)
    needs_input = not structurally_valid or zero > 0 or long > 0
    report = {"status": "needs_input" if needs_input else ("completed_with_uncertainty" if low else "completed_audio_alignment"), "scene_gate_status": "not_evaluated_timings_and_scenes_unchanged", "method": METHOD, "model": "base", "local_files_only": True, "cost_usd": 0, "alignment_grid_seconds": 0.02, "global_proportional_interpolation": False, "section_count": len(reports), "expected_section_count": len(sections), "word_count": sum(r["canonical_words"] for r in reports), "zero_duration_words": zero, "anomalous_long_words": long, "low_confidence_words": low, "before_vs_after_onset_drift": drift_summary(all_drift), "audio_unchanged": all(x["before"] == x["after"] for x in audio_checks), "raw_asr_unchanged": all(x["before"] == x["after"] for x in raw_checks), "canonical_script_unchanged": True, "audio_hashes": audio_checks, "raw_asr_hashes": raw_checks, "sections": reports, "failures": failures, "uncertainty_policy": {"zero_duration": "Preserved and flagged; no epsilon clamp", "long_word_threshold": "max(1.5s, 0.8s * spoken_word_count)", "low_probability_threshold": 0.35, "raw_asr_timing_disagreement_threshold_seconds": 0.6, "raw_asr_mapping": "Monotonic token edits choose chunk boundaries only; no interpolation", "dtw_probability": "Decoder probability, not a calibrated timestamp confidence", "unsupported_words": "Never fabricated; require input when zero/long/out-of-bounds/overlap exists"}, "backup_manifest": str((PROJECT / "qc/pre-alignment/manifest.json").relative_to(REPO)), "elapsed_seconds": round(time.monotonic() - started, 3)}
    if not args.sections and structurally_valid and len(narration) == len(sections):
        for section in sections:
            sid = section["id"]
            write_json(PROJECT / f"assets/audio/transcripts/{sid}_transcript.json", read_json(PROJECT / f"qc/audio-alignment/sections/{sid}.json"))
        destination = PROJECT / "assets/audio/transcripts/narration_words.json"
        write_json(destination, narration)
        shutil.copy2(destination, PUBLIC / "transcripts/narration_words.json")
        report["public_narration_exact_copy"] = destination.read_bytes() == (PUBLIC / "transcripts/narration_words.json").read_bytes()
        subtitles, subtitle_qc = render_subtitles(narration)
        (PROJECT / "assets/subtitles.srt").write_text(subtitles, encoding="utf-8")
        if (PUBLIC / "subtitles.srt").exists():
            shutil.copy2(PROJECT / "assets/subtitles.srt", PUBLIC / "subtitles.srt")
        report["subtitles"] = subtitle_qc
        report["canonical_outputs_written"] = True
        if subtitle_qc["anomalies"]:
            report["status"] = "needs_input"
    else:
        report["canonical_outputs_written"] = False
    report_path = PROJECT / ("qc/audio_alignment_preview.json" if args.sections else "qc/audio_alignment_report.json")
    write_json(report_path, report)
    print(json.dumps({key: report[key] for key in ("status", "section_count", "word_count", "zero_duration_words", "anomalous_long_words", "low_confidence_words", "elapsed_seconds", "canonical_outputs_written")}, ensure_ascii=False), flush=True)
    if failures or not structurally_valid:
        raise SystemExit(2)


if __name__ == "__main__":
    main()
