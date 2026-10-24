#!/usr/bin/env python
"""Đọc anchor_audit_strict.json — in chi tiết các call fail (schema pass/overflowSec)."""
import json

d = json.load(open("/Users/tuyennguyen/project/OpenMontage/projects/thanh-giong/artifacts/anchor_audit_strict.json"))
for s in d["scenes"]:
    if s.get("pass", True):
        continue
    print(s["sceneId"], "win", s["window"], "maxOver", s.get("maxOverflowSec"))
    for c in s.get("calls", []):
        if c.get("spanOk", True) and c.get("fractionOk", True):
            continue
        print("   ", json.dumps(c, ensure_ascii=False)[:260])
