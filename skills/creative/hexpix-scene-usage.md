# Hexpix Scene Usage for OpenMontage

> Verified 2026-10-07 end-to-end on `cx/gpt-5.6-luna-image` (text2img) and
> `cx/gpt-image-2.5-sunburst` (identity-preserving edit), 1536×1024.
> Tool: `tools/graphics/hexpix_scene.py` (`hexpix_scene`, registered) — modes
> `analyze` (decode an existing marked image) and `generate` (full chain).
> Scripts: `scripts/hexpix_decode.py` (region QA), `scripts/hexpix_extract.py` (sprite + path decode).
> Doctrine reference: `docs/ORCHESTRATION_DOCTRINE.md` §4/§4b/§4c.

## What it is

Encode machine-readable geometry **into the generated image itself** using saturated
hue markers, then decode pixel-accurate coordinates with OpenCV. The TSX overlay
layer reads geometry from the decode — no hand-guessed coordinates, no "arrow
pointing at the wrong wall".

Solves the focal-visual accuracy problem (§4 of the doctrine): hero visuals are gen
images, but arrows / labels / moving objects must land **exactly** on features the
gen model invented. Hexpix makes the image tell you where those features are.

## When to Use

- **Path-following motion** — boat along a river, army along a road, data along a
  pipe. Object follows a polyline measured from the actual image.
- **Region-locked overlay** — arrows, circles, highlight boxes, labels that must sit
  on specific gen-image features (map rings, building roofs, gates).
- **Object extraction for re-composite** — cut an object out as a clean RGBA sprite
  over a clean background, then animate it freely in TSX.
- Do NOT use for thin directional paths (arrows, dotted lines) — see Limits.

## The three verified recipes

### Recipe A — single-pass marker embed (2 gen calls/scene)

Best when markers can live in the art as colored-ink accents.

1. **Gen with markers in the prompt** (2-stage phrasing works best):
   "lay out the scene normally, THEN apply accents": target object = **flat
   silhouette in a saturated pure hue**; target path/region = **saturated fill**
   (e.g. river water all teal). Keep the rest of the palette muted ink.
2. **Decode** with `hexpix_extract.py` → polyline (path) / bbox + RGBA sprite (object).
3. **Remove the object** from the background via gen-edit (Recipe C step 3) if the
   object must move. If markers stay, they read as intentional colored-ink accents
   (vision-verified: do not break ink-wash style).

### Recipe B — 2-pass clean base (3 gen calls/scene)

Best when the base art must stay marker-free at generation time, or the same base
gets re-encoded with different markers later.

1. **Pass 1 — gen base** with NO mention of markers (pure art direction).
2. **Pass 2 — gen-edit markers in** (identity-preserving model): "recolor X to
   #HEX, keep everything else pixel-identical". Markers land as colored-ink
   accents; the base composition is untouched.
3. Continue as Recipe A (decode, then remove object if needed).

### Recipe C — object removal (required for moving objects)

**NEVER inpaint manually.** Nine variants tested (TELEA / NS / box / exact-mask /
texture-blend) — all left visible artifacts caught by vision-check. The only clean
path is a gen-edit pass with an identity-preserving model:

> "Remove the <object> completely. Fill with the same <surrounding>, matching
> texture exactly. Keep EVERYTHING else EXACTLY identical."

Verified: clean fill, no artifacts, whole scene preserved.

## Marker spec rules (measured)

- **Hue pairs ≥60° apart** in decode space, or gates bleed into each other.
- **Saturated flat fills only.** Model color drift is ±25° — decode with an HSV
  band gate, never exact-hex matching.
- **Regions, not lines.** "Stripe/thin path" prompts get rendered as solid blobs.
  Encode paths as wide bands (a river, a road); decode the centerline.
- Positional clauses ("left half", "bottom-right corner", "on the north gate roof")
  are honored reliably — use them to pin markers semantically.
- Marker hexes that worked: teal `#1FA9A0`, violet `#C77DD8`, magenta `#FF00FF`,
  cyan `#00FFFF`, gold `#FFD700`, orange `#FF6600`.

## Decode usage

**Preferred: the registered `hexpix_scene` tool** (analyze mode). The standalone
scripts remain for quick shell use.

```python
from tools.graphics.hexpix_scene import HexpixScene
HexpixScene().execute({
  "mode": "analyze",                      # or "generate" for the full chain
  "image_path": "marked.png",
  "output_dir": "projects/<id>/assets/images/",
  "regions": [
    {"name": "river", "hue": "teal", "kind": "path", "sat_min": 0.25},
    {"name": "boat",  "hue": "violet", "kind": "sprite", "sat_min": 0.15,
     "fill": "the same teal water, matching texture and ripples"},
  ],
})
# writes geometry.json (bbox/centroid/polyline, normalized variants) + RGBA sprites
# generate mode adds: base_prompt (optional clean pass) / marker_prompt /
# remove_objects (gen-edit removal via the identity-preserving model)
```

Standalone script form (spec hue in OpenCV units 0–179 = degrees ÷ 2):

```bash
python3 scripts/hexpix_extract.py <marked_image.png> <spec.json> <out_prefix>
```

Output JSON: per-region `pixels`, `bbox`, `sprite` path (RGBA cut), `polyline`
(PCA-axis bin centroids, ~12–36 points), `_background` (inpainted fallback — prefer
Recipe C over this).

### Hue unit gotcha (cost a debug cycle)

`hexpix_extract.py` gates on OpenCV HSV where **H is 0–179 = degrees ÷ 2**.
Writing `[155,185]` for teal (degrees) silently returns `found:false` everywhere.
`#1FA9A0` → `[78,100]`; `#C77DD8` → `[135,158]`. **Always halve before writing the spec.**

### Sprite cut: inverse mask, not marker mask

The pure marker-hue mask **misses dark edges** of the object (boat hull outline,
figure details). If the object sits inside a marked region (boat on teal water),
cut with the **inverse** region mask inside the object's bbox: non-region = object.
Measured: clean sprite, 55–73% transparent, keeps person + hat + basket.

## Animating along the decoded polyline

Arc-length parameterized sampling (drop-in for TSX `interpolate()` or Python):

```python
segs = np.linalg.norm(np.diff(poly, axis=0), axis=1)
cum  = np.concatenate([[0], np.cumsum(segs)]); L = cum[-1]
def sample(t):                       # t in [0,1] along the path
    d = t * L; k = max(0, min(len(segs)-1, int(np.searchsorted(cum, d))-1))
    p0, p1 = poly[k], poly[k+1]
    return p0 + (p1-p0) * ((d-cum[k]) / segs[k])
```

Composite the sprite centered at `sample(t)`, speech-lock `t` to narration timing.
Clamp paste position at image edges (sprite clips at borders near t→1).

## Verified outcomes (what "accurate" means here)

- Marker placement follows **semantic** prompts (inner ring, moat, north gate) —
  structure (nested bboxes, coincident centroids) holds.
- Path-following: object on the path at every sampled t (vision-verified at
  t = 0.25 / 0.55 / 0.85, no bank landings, no seams).
- Region overlays land on the measured bbox/centroid — exact pixels, not estimates.

## Limits (measured — do not retry these)

- **Stealth/invisible markers fail.** Asked for faint tints, the model renders
  saturation <0.05 that blends into sepia; no hue band separates. The feasible
  "hidden" is Recipe B: markers exist only in the edit layer and read as art
  accents to the eye, machine-readable to the decoder.
- **Thin paths fail** (rendered as blobs). Encode as wide bands.
- **Exact hex is not guaranteed** (±25° drift). HSV band gate only.
- Old fragments beyond retention 404 permanently — irrelevant here, but don't
  expect re-decode of deleted sources.

## Cost

- Recipe A: 2 gen calls/scene (marked gen + object removal).
- Recipe B: 3 gen calls/scene (clean base + marker edit + object removal).
- Decode + sprite cut: local, <5 s.

**Gateway drift note (2026-10-07 evening):** the 9router catalog rotates;
`cx/gpt-image-2.5-sunburst` / `-flare` returned 502 "Account may not be entitled"
even though they worked hours earlier. `cx/gpt-5.6-luna-image` (T2I) unaffected.
Recipe A (single-pass) is the outage-safe path; when an edit model is required,
probe it with a cheap 1024×1024 edit call before batching scenes.

## Pipeline placement

Assets stage (gen + decode + removal) → outputs (`sprite.png`, `bg.png`,
`geometry.json` with polylines/bboxes normalized) land in
`projects/<id>/assets/images/` → compose stage TSX consumes them; overlay motion is
speech-locked per doctrine §4 rule 2.
