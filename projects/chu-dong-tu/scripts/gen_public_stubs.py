#!/usr/bin/env python
"""Stub 37 file public bị thiếu của các project archived — để bundle Remotion build lại được.
KHÔNG khôi phục từ git (tránh đụng thay đổi lane khác). Stub 1 phần tử, hợp lệ, chỉ thỏa import.
Composition của các project đó KHÔNG được render với stub."""
import json
from pathlib import Path

PUB = Path("/Users/tuyennguyen/project/OpenMontage/remotion-composer/public")

FILES = """bach-viet-bien-mat/transcripts/narration_words.json
btc-tradingagents-20261008/captions.json
btc-tradingagents-20261008/scene_timing.json
btc-tradingagents-20261008/words.json
co-loa-no-than/transcripts/narration_words.json
crypto-tradingagents-20261013-mtf/scene_timing.json
crypto-tradingagents-20261013-mtf/words.json
crypto-tradingagents-20261013/scene_timing.json
crypto-tradingagents-20261013/words.json
crypto-tradingagents-20261014/captions_speechlocked.json
crypto-tradingagents-20261014/scene_timing.json
crypto-tradingagents-20261014/words.json
crypto-tradingagents-20261015/captions.json
crypto-tradingagents-20261015/scene_timing.json
crypto-tradingagents-20261015/words.json
crypto-tradingagents-20261016/scene_timing.json
crypto-tradingagents-20261016/words.json
eth-tradingagents-20261009/captions.json
eth-tradingagents-20261009/scene_timing.json
eth-tradingagents-20261009/words.json
eth-tradingagents-20261010/captions.json
eth-tradingagents-20261010/scene_timing.json
eth-tradingagents-20261010/words.json
gh5-20261006/captions.json
gh5-20261006/scene_timing.json
gh5-20261006/words.json
gh6-20261007/captions.json
gh6-20261007/scene_timing.json
gh6-20261007/words.json
news-20261006/scene_timing.json
news-20261006/words.json
news-20261015/scene_timing.json
news-20261015/words.json
news-daily-20261016/scene_timing.json
news-daily-20261016/words.json
vua-hung-trong-dong/transcripts/narration_words.json
xi-vu-ba-toc/transcripts/narration_words.json""".split()

META = "_stub_note: file gốc bị xóa khi dọn archive trên branch latest (trước 2026-10-19); stub tạo lại để bundle build. KHÔNG render composition project này với stub — khôi phục từ git history nếu cần render lại."

def stub_for(rel):
    name = rel.split("/")[-1]
    if name == "scene_timing.json":
        return [{"sceneId": "stub-00", "startFrame": 0, "durationInFrames": 1, "label": "STUB", "_stub_note": META}]
    if name == "words.json":
        return [{"word": "stub", "start": 0.0, "end": 0.01, "_stub_note": META}]
    if name in ("captions.json", "captions_speechlocked.json"):
        return [{"start": 0.0, "end": 0.01, "text": "STUB", "_stub_note": META}]
    if name == "narration_words.json":
        return {"_stub_note": META}
    return {"_stub_note": META}

made = 0
for rel in FILES:
    p = PUB / rel
    if p.exists():
        continue
    p.parent.mkdir(parents=True, exist_ok=True)
    p.write_text(json.dumps(stub_for(rel), ensure_ascii=False, indent=2) + "\n")
    made += 1
print(f"stubbed {made}/{len(FILES)}")
