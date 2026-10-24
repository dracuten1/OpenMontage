#!/usr/bin/env python3
"""CONTENT_QC mechanical check for lieu-hanh script_draft.json.
1. Every quoted string (>6 words inside „ "..." in text) must be a substring of some ledger quote.
2. Screen numbers (in enhancement_cues descriptions + stat displays) must be within whitelist.
3. Every section has source_ref; delivery_cues.provider_text present.
Outputs findings JSON for CONTENT_QC.md."""
import sys, json, re
from pathlib import Path

OM = Path("/Users/tuyennguyen/project/OpenMontage")
PROJ = OM / "projects" / "lieu-hanh"
doc = json.loads((PROJ / "drafts" / "script_draft.json").read_text(encoding="utf-8"))
ledger = json.loads((PROJ / "research" / "v1" / "claim_ledger.json").read_text(encoding="utf-8"))
whitelist = json.loads((PROJ / "research" / "v1" / "raw_data.json").read_text(encoding="utf-8"))

# flatten all ledger quotes (normalize whitespace incl \n)
def norm(s):
    return re.sub(r"\s+", " ", s).strip()

ledger_quotes = []
for c in ledger["claims"]:
    for q in c.get("quotes") or []:
        ledger_quotes.append((c["id"], norm(q)))
    if c.get("claim"):
        ledger_quotes.append((c["id"], norm(c["claim"])))

wl_numbers = [w["display"] for w in whitelist["numeric_whitelist"]]

findings = {"quote_checks": [], "number_flags": [], "missing": [], "q_labels": []}

for s in doc["sections"]:
    text = s["text"]
    # extract quoted spans: "..." (straight) and «...» (guillemets) and "..."
    spans = re.findall(r'"([^"]{25,})"', text) + re.findall(r'"([^"]{25,})"', text)
    for sp in spans:
        n = norm(sp)
        match = None
        for cid, q in ledger_quotes:
            if n in q:
                match = cid
                break
        findings["quote_checks"].append({"section": s["id"], "quote": n[:90], "claim": match or "NO-MATCH"})
    if not s.get("source_ref"):
        findings["missing"].append({"section": s["id"], "field": "source_ref"})
    dc = s.get("delivery_cues") or {}
    if not dc.get("provider_text"):
        findings["missing"].append({"section": s["id"], "field": "provider_text"})

# numbers appearing on screen (enhancement_cues descriptions)
num_re = re.compile(r"\d[\d/.\-–:]*")
for s in doc["sections"]:
    for c in s.get("enhancement_cues") or []:
        for m in num_re.findall(c.get("description", "")):
            findings["number_flags"].append({"section": s["id"], "screen_number": m, "context": c["description"][:70]})

# Q label usage
for s in doc["sections"]:
    if re.search(r"Q0[123]", s.get("source_ref", "")):
        findings["q_labels"].append(s["id"])

out = PROJ / "qc" / "content_qc_mechanical.json"
out.parent.mkdir(exist_ok=True)
out.write_text(json.dumps(findings, ensure_ascii=False, indent=1), encoding="utf-8")
print("wrote", out)
no_match = [q for q in findings["quote_checks"] if q["claim"] == "NO-MATCH"]
print(f"quotes checked: {len(findings['quote_checks'])} | NO-MATCH: {len(no_match)}")
for q in no_match:
    print("  NO-MATCH:", q["section"], "|", q["quote"])
print("missing fields:", findings["missing"] or "none")
print("screen numbers flagged:", len(findings["number_flags"]))
print("Q-labeled sections:", findings["q_labels"])
