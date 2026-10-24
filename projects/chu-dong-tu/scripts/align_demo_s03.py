import json
from faster_whisper import WhisperModel

m = WhisperModel("small", device="cpu", compute_type="int8")
segs, info = m.transcribe("projects/chu-dong-tu/assets/audio/demo_s03.wav", language="vi", word_timestamps=True)
words = []
for s in segs:
    for w in s.words or []:
        words.append({"w": w.word.strip(), "s": round(w.start, 3), "e": round(w.end, 3)})
json.dump(words, open("projects/chu-dong-tu/assets/audio/demo_s03_words.json", "w"), ensure_ascii=False, indent=1)
print("words:", len(words), "span:", words[0]["s"], "->", words[-1]["e"])
