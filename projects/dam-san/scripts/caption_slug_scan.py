#!/usr/bin/env python3
"""Scan remotion-composer/src/dam-san/ to guarantee zero foreign episode slug references."""
import sys
from pathlib import Path

SRC = Path("/Users/tuyennguyen/project/OpenMontage/remotion-composer/src/dam-san")
FORBIDDEN = ["de-dat-de-nuoc", "banh-chung", "son-tinh", "thanh-giong", "lieu-hanh", "chu-dong-tu"]
bad = []
for p in sorted(SRC.rglob("*.ts*")):
    txt = p.read_text(encoding="utf-8")
    for f in FORBIDDEN:
        if f in txt:
            bad.append((str(p), f))
if bad:
    print("FAIL foreign slugs found:", bad)
    sys.exit(1)
print(f"PASS caption/slug scan across {len(list(SRC.rglob('*.ts*')))} TSX/TS files (0 foreign slug refs)")
