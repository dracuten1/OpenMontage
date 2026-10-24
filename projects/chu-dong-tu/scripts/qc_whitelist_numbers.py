"""Gate C whitelist số — v2: chỉ text node hiển thị (loại CSS/style/transform)."""
import re
from pathlib import Path

SRC = Path("/Users/tuyennguyen/project/OpenMontage/remotion-composer/src/chu-dong-tu")
CSS = re.compile(r"px|rgba|rgb\(|opacity|translate|scale|blur|rotate|fontSize|font-size|letterSpacing|fontWeight|border|shadow|top:|left:|right:|bottom:|width|height|margin|padding|grid|flex|transform|d=\"M|viewBox|stroke|fill=|path|clip|scroll|0 0|zIndex")
ALLOWED_PHRASES = [
    "1492", "1493", "10–12 tháng Hai", "10-12 tháng Hai", "11/2", "02/02/2023",
    "153/QĐ-BVHTTDL", "01/03/2023", "9 làng", "chín làng", "3 năm một lần", "ba năm một lần",
    "2023", "7–9 tháng 4", "Hùng Vương thứ 6", "Tứ bất tử",
]
hits = []
for f in sorted(SRC.glob("scenes-*.tsx")):
    for ln, line in enumerate(f.read_text().split("\n"), 1):
        for m in re.finditer(r">([^<>{}]*\d[^<>{}]*)<", line):
            s = m.group(1).strip()
            if not s or CSS.search(s):
                continue
            hits.append((f.name, ln, s[:90]))
ok = []
for fn, ln, s in hits:
    clean = re.sub(r"\s+", " ", s)
    verdict = any(a in clean for a in ALLOWED_PHRASES) or re.fullmatch(r"[–\-/.,\s\dQĐBVHTTL]*", clean)
    print(("OK  " if verdict else "CHECK"), f"{fn}:{ln} | {clean}")
    ok.append(verdict)
print(f"\ntotal display-number text nodes: {len(hits)} | outside-whitelist: {sum(1 for v in ok if not v)}")
