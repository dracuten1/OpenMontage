import json, re, sys, unicodedata
from pathlib import Path

words = json.loads(Path("projects/chu-dong-tu/assets/audio/demo_s03_words.json").read_text())

def strip_d(s):
    s = unicodedata.normalize("NFD", s)
    s = "".join(c for c in s if not unicodedata.combining(c))
    s = s.replace("đ", "d").replace("Đ", "D")
    return s.lower()

def toks(s):
    s = re.sub(r"[«»“”\"'()\[\],.?!…:;-]", " ", s)
    return [strip_d(t) for t in s.split() if t]

asr = words  # list of {w,s,e}
at = [strip_d(re.sub(r"[^\w\s]", "", x["w"])) for x in asr]

CUES = [
    "Trước khi hỏi vì sao người ta thờ, phải biết người ấy nghèo đến mức nào.",
    "Bản kể chép lại gia cảnh ấy bằng vài dòng rất gọn.",
    "«Cha từ, con hiếu, nhà gặp hỏa hoạn, của cải sạch không,",
    "chỉ còn lại một khố vải duy nhất, cha con ra vào thay nhau mà mặc.»",
    "Một vụ cháy. Của cải sạch không.",
    "Cha và con, hai người, thay nhau mặc một chiếc khố duy nhất.",
    "Rồi người cha lâm bệnh.",
    "Trước khi mất, ông dặn con ...",
    "«Cha chết cứ để trần mà chôn,",
    "giữ khố lại cho con, để khỏi xấu hổ.»",
    "Để trần mà chôn —",
    "đổi lấy cho con một lớp che thân khi ra khỏi nhà.",
    "Nhưng người con không nỡ làm theo,",
    "liệm khố rồi đem chôn.",
]
Q1 = "một khố vải duy nhất, cha con ra vào thay nhau mà mặc"
Q2A = "Cha chết cứ để trần mà chôn"
Q2B = "giữ khố lại cho con, để khỏi xấu hổ"

script_tokens = []  # (cue_idx, tok)
for ci, cue in enumerate(CUES):
    for t in toks(cue):
        script_tokens.append((ci, t))
n, m = len(script_tokens), len(at)
print("script tokens:", n, "| asr tokens:", m)

# Needleman-Wunsch (match=2, sub=-1, gap=-1) — score tối đa giữ thứ tự
import numpy as np
SC = np.zeros((n + 1, m + 1), dtype=np.int32)
TB = np.zeros((n + 1, m + 1), dtype=np.int8)  # 0 diag, 1 up, 2 left
for i in range(1, n + 1):
    SC[i][0] = SC[i-1][0] - 1; TB[i][0] = 1
for j in range(1, m + 1):
    SC[0][j] = SC[0][j-1] - 1; TB[0][j] = 2
for i in range(1, n + 1):
    for j in range(1, m + 1):
        d = SC[i-1][j-1] + (2 if script_tokens[i-1][1] == at[j-1] else -1)
        u = SC[i-1][j] - 1
        l = SC[i][j-1] - 1
        best = max(d, u, l)
        SC[i][j] = best
        TB[i][j] = 0 if best == d else (1 if best == u else 2)

# trace back, ghi asr index cho từng script token (aligned hoặc None)
asr_of = [None] * n
i, j = n, m
while i > 0 or j > 0:
    if i > 0 and j > 0 and TB[i][j] == 0:
        asr_of[i-1] = j-1
        i, j = i-1, j-1
    elif i > 0 and (j == 0 or TB[i][j] == 1):
        i -= 1
    else:
        j -= 1

matched = sum(1 for k, a in enumerate(asr_of) if a is not None and script_tokens[k][1] == at[a])
print(f"token exact(stripped) match: {matched}/{n} = {matched/n:.0%}")

# cue boundaries: first/last script token của cue có asr align (fill từ lân cận nếu None)
def cue_span(ci):
    idxs = [k for k in range(n) if script_tokens[k][0] == ci]
    al = [asr_of[k] for k in idxs if asr_of[k] is not None]
    if not al:
        # fill từ token kề trước/sau cùng hàng
        for k in range(idxs[0] - 1, -1, -1):
            if asr_of[k] is not None:
                al = [asr_of[k]]; break
    for k in range(idxs[-1] + 1, n):
        if asr_of[k] is not None:
            al = al + [asr_of[k]]; break
    return min(al), max(al)

cues_out = []
for ci in range(len(CUES)):
    a, b = cue_span(ci)
    s, e = asr[a]["s"], asr[b]["e"]
    cues_out.append({"start": round(s + 1.0, 2), "dur": round(e - s + 0.30, 2)})
    print(f"cue {ci:2d}  asr[{a}:{b}]  {s+1.0:6.2f} +{e-s+0.3:5.2f}")

def phrase_span(phrase):
    p = toks(phrase)
    L = len(p)
    for k in range(n - L + 1):
        if [t for _, t in script_tokens[k:k+L]] == p:
            al = [asr_of[x] for x in range(k, k + L) if asr_of[x] is not None]
            if al:
                return round(asr[min(al)]["s"] + 1.0, 2), round(asr[max(al)]["e"] + 1.0, 2)
    return None

quotes = {}
for name, ph in [("q1", Q1), ("q2a", Q2A), ("q2b", Q2B)]:
    sp = phrase_span(ph)
    if sp is None:
        print(name, "NOT FOUND"); sys.exit(1)
    quotes[name] = list(sp)
    print(name, "->", sp)

Path("projects/chu-dong-tu/assets/audio/demo_s03_cues.json").write_text(
    json.dumps({"cues": cues_out, "quotes": quotes, "match_pct": round(100 * matched / n)},
               ensure_ascii=False, indent=1))
print("WROTE demo_s03_cues.json")
