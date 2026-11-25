#!/usr/bin/env python3
"""harvest_photos.py — Reusable Wikimedia Commons archival photo harvester for OpenMontage.

Replaces per-project harvest_photos.py scripts:
- Queries Wikimedia Commons API with polite User-Agent and clean CC/PD license filters
- Enforces minimum long edge (>= 800px) and verifies image decode via PIL
- Computes SHA-256 and saves both to projects/<slug>/assets/images/<fname> and
  remotion-composer/public/<slug>/images/<fname>
- Writes/merges projects/<slug>/assets/images/provenance.json (with vision_verified=False
  until inspected via read_file, plus sha256 binding for source_photo_gate.py)
"""
from __future__ import annotations

import argparse
import datetime
import hashlib
import json
import re
import sys
import time
import urllib.parse
import urllib.request
from pathlib import Path
from typing import Any

from PIL import Image, UnidentifiedImageError

REPO_ROOT = Path(__file__).resolve().parents[2]
DEFAULT_UA = {"User-Agent": "OpenMontage/3.0 (editorial archival media fetcher)"}
MIN_LONG_EDGE_PX = 800
BAD_LICENSE_TOKENS = ("fair use", "non-free", "copyrighted", "all rights reserved")


def _clean_html(raw: str) -> str:
    return re.sub(r"<[^>]+>", "", raw or "").strip()


def _extract_year(extmeta: dict[str, Any], title: str) -> str:
    for key in ("DateTimeOriginal", "DateTime"):
        val = _clean_html((extmeta.get(key) or {}).get("value", ""))
        m = re.search(r"(19\d{2}|20\d{2})", val)
        if m:
            return m.group(1)
    m_title = re.search(r"(19\d{2}|20\d{2})", title)
    return m_title.group(1) if m_title else str(datetime.date.today().year)


def search_wikimedia(query: str, *, limit: int = 12, opener=urllib.request.urlopen) -> dict[str, Any]:
    url = (
        "https://commons.wikimedia.org/w/api.php?action=query&generator=search"
        f"&gsrsearch={urllib.parse.quote(query + ' filetype:bitmap')}"
        f"&gsrnamespace=6&gsrlimit={limit}&prop=imageinfo"
        "&iiprop=url|extmetadata|size|mime&iiurlwidth=1600&format=json"
    )
    req = urllib.request.Request(url, headers=DEFAULT_UA)
    with opener(req, timeout=25) as resp:
        return json.loads(resp.read().decode("utf-8"))


def rank_candidates(
    data: dict[str, Any],
    keywords: list[str],
    *,
    min_width: int = 800,
    min_height: int = 500,
) -> list[tuple[dict[str, Any], dict[str, Any], dict[str, Any], str]]:
    pages = (data.get("query", {}).get("pages") or {}).values()
    ranked: list[tuple[int, dict[str, Any], dict[str, Any], dict[str, Any], str]] = []
    kw_lower = [k.strip().lower() for k in keywords if k.strip()]
    for page in pages:
        ii = (page.get("imageinfo") or [{}])[0]
        w, h = int(ii.get("width") or 0), int(ii.get("height") or 0)
        if max(w, h) < MIN_LONG_EDGE_PX or w < min_width or h < min_height:
            continue
        mime = str(ii.get("mime") or "").lower()
        if mime and mime not in {"image/jpeg", "image/png", "image/webp"}:
            continue
        title = str(page.get("title") or "")
        title_lower = title.lower()
        if kw_lower and not any(k in title_lower for k in kw_lower):
            continue
        extmeta = ii.get("extmetadata") or {}
        lic = _clean_html((extmeta.get("LicenseShortName") or extmeta.get("UsageTerms") or {}).get("value", ""))
        if not lic or lic == "?":
            continue
        lic_lower = lic.lower()
        if any(bad in lic_lower for bad in BAD_LICENSE_TOKENS) or "nc" in lic_lower:
            continue
        ranked.append((w * h, page, ii, extmeta, lic))
    ranked.sort(key=lambda row: row[0], reverse=True)
    return [(p, ii, em, lic) for _, p, ii, em, lic in ranked]


def parse_item_spec(raw: str) -> dict[str, Any]:
    parts = [p.strip() for p in raw.split("|")]
    if len(parts) < 2 or not parts[0] or not parts[1]:
        raise ValueError(f"Invalid --item spec {raw!r}; expected 'filename.jpg|q1;q2|kw1,kw2'")
    queries = [q.strip() for q in parts[1].split(";") if q.strip()]
    keywords = [k.strip() for k in parts[2].split(",") if k.strip()] if len(parts) >= 3 else []
    return {"file": parts[0], "queries": queries, "keywords": keywords}


def harvest_photos(
    project_dir: Path | str,
    items: list[dict[str, Any]],
    *,
    public_images_dir: Path | None = None,
    opener=urllib.request.urlopen,
    sleep_fn=time.sleep,
) -> dict[str, Any]:
    project_root = Path(project_dir).resolve()
    slug = project_root.name
    img_dir = project_root / "assets" / "images"
    img_dir.mkdir(parents=True, exist_ok=True)
    pub_img_dir = public_images_dir or (REPO_ROOT / "remotion-composer" / "public" / slug / "images")
    pub_img_dir.mkdir(parents=True, exist_ok=True)

    prov_path = img_dir / "provenance.json"
    existing: dict[str, dict[str, Any]] = {}
    if prov_path.is_file():
        try:
            loaded = json.loads(prov_path.read_text(encoding="utf-8"))
            if isinstance(loaded, list):
                for row in loaded:
                    if isinstance(row, dict) and row.get("file"):
                        existing[str(row["file"])] = row
        except Exception:
            pass

    downloaded_entries: list[dict[str, Any]] = []
    failures: list[str] = []

    for item in items:
        fname = Path(str(item["file"])).name
        queries = list(item.get("queries") or [])
        keywords = list(item.get("keywords") or [])
        visual_type = str(item.get("visual_type") or "photograph")
        ok = False

        for query in queries:
            try:
                data = search_wikimedia(query, opener=opener)
            except Exception as exc:
                failures.append(f"{fname} ({query}): search error {exc}")
                sleep_fn(0.5)
                continue
            candidates = rank_candidates(data, keywords)
            for page, ii, extmeta, lic in candidates[:3]:
                url = ii.get("thumburl") or ii.get("url")
                if not url:
                    continue
                dst = img_dir / fname
                try:
                    req = urllib.request.Request(url, headers=DEFAULT_UA)
                    with opener(req, timeout=40) as resp:
                        raw_bytes = resp.read()
                    dst.write_bytes(raw_bytes)
                    with Image.open(dst) as im:
                        im.verify()
                    with Image.open(dst) as im2:
                        w, h = im2.size
                    if max(w, h) < MIN_LONG_EDGE_PX:
                        dst.unlink(missing_ok=True)
                        continue
                except (OSError, UnidentifiedImageError, ValueError) as exc:
                    dst.unlink(missing_ok=True)
                    failures.append(f"{fname} ({url}): download/decode error {exc}")
                    continue

                (pub_img_dir / fname).write_bytes(raw_bytes)
                digest = hashlib.sha256(raw_bytes).hexdigest()
                artist = _clean_html((extmeta.get("Artist") or {}).get("value", "")) or "Wikimedia Commons contributor"
                year = _extract_year(extmeta, str(page.get("title") or ""))
                page_title = str(page.get("title") or "")
                rel_file = f"assets/images/{fname}"
                entry = {
                    "file": rel_file,
                    "sha256": digest,
                    "source": "Wikimedia Commons",
                    "title": page_title,
                    "page": "https://commons.wikimedia.org/wiki/" + urllib.parse.quote(page_title.replace(" ", "_")),
                    "file_url": ii.get("url"),
                    "license": lic,
                    "author": artist,
                    "credit_line": f"Wikimedia Commons / {artist} ({lic})",
                    "taken": year,
                    "visual_type": visual_type,
                    "subject_match_note": f"Pending vision check: {page_title}",
                    "downloaded": datetime.date.today().isoformat(),
                    "vision_verified": False,
                    "width": w,
                    "height": h,
                }
                existing[rel_file] = entry
                downloaded_entries.append(entry)
                ok = True
                break
            if ok:
                break
            sleep_fn(0.5)
        if not ok:
            failures.append(f"{fname}: no qualifying CC/PD Wikimedia Commons candidate found")

    merged = list(existing.values())
    prov_path.write_text(json.dumps(merged, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    return {
        "project": slug,
        "provenance_path": str(prov_path),
        "downloaded": len(downloaded_entries),
        "total_entries": len(merged),
        "failures": failures,
        "entries": downloaded_entries,
    }


def main(argv: list[str] | None = None) -> int:
    ap = argparse.ArgumentParser(description="Harvest license-clean archival photos from Wikimedia Commons.")
    ap.add_argument("--project", required=True, help="projects/<slug> directory")
    ap.add_argument("--spec", default=None, help="JSON file containing list of {file, queries, keywords}")
    ap.add_argument("--item", action="append", default=[], help="Inline spec 'fname.jpg|query1;query2|kw1,kw2'")
    args = ap.parse_args(argv)

    items: list[dict[str, Any]] = []
    if args.spec:
        loaded = json.loads(Path(args.spec).read_text(encoding="utf-8"))
        if not isinstance(loaded, list):
            print("ERROR: --spec JSON must be an array", file=sys.stderr)
            return 2
        items.extend(loaded)
    for raw in args.item:
        items.append(parse_item_spec(raw))
    if not items:
        ap.error("Provide --spec or at least one --item")

    result = harvest_photos(args.project, items)
    print(json.dumps(result, ensure_ascii=False, indent=2))
    return 0 if result["downloaded"] == len(items) else 1


if __name__ == "__main__":
    sys.exit(main())
