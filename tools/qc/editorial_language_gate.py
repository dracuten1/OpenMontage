"""Editorial-language pre-render gate (news-editorial-motion lane).

Fail-closed structural gate for the news editorial lane. Judges the scene
manifest + composition source of an ``animated-explainer`` project against the
editorial 2D motion-graphic language:

- R1 ``contract-sections``      — manifest carries the 4 contract sections
  (present = non-empty string/JSON object/array; booleans and numbers count as
  ABSENT — ``"physics": false`` does not satisfy R1).
- R2 ``graphic-native-required`` — every CONTENT scene carries >=1 GENUINE
  graphic-native layer (cutout / native chart / annotation). Name-binding
  rules (review round 2, MAJOR 1): a single-token ``pipeline.component`` claim
  must APPEAR IN THE MAPPED SCENE SOURCE TEXT and resolve to exactly one
  declaration in the mapped source + its local import closure; zero or
  ambiguous resolution is BLOCKED (no fall-through). The role+method fallback
  is granted ONLY to identifier-less layers AND only when the mapped scene
  source itself carries native-graphic markers — never on tree-level markers.
- R3 ``photo-frame-dominance`` — (a) ANY ``hero``-role layer is blocked,
  whatever its pipeline method (INTENTIONAL OVER-BLOCK: non-t2i hero is still
  blocked fail-closed); (b) raster-photo signal includes methods ``t2i``,
  ``i2i``, ``web_plus_i2i``, ``photo_asset``, ``web_asset``, ``sprite``,
  ``rig_frame`` OR method/prompt lexicon ``photo|dslr|render|realistic|cinematic``.
  ``t2i_chroma_key`` is a cutout, never photo; ``web_plus_i2i`` with
  ``remove_bg: true`` is cutout, otherwise photo; ``remotion_native`` never
  photo. Any raster-photo layer at >=85% canvas is dominant regardless of role.
  (c) A raster-photo layer whose area cannot be computed from the manifest
  (transform w or h missing/unusable) in a NON-CLOSING scene is treated as
  DOMINATING (BLOCKED) UNLESS that same scene contains at least one GENUINE
  graphic-native element per the scene-bound R2 credit procedure. Rationale:
  an unmeasurable photo that carries the scene is a backdrop; a photo
  alongside genuine graphics is a backplate texture / cutout subject. A scene
  with only a photo and NO genuine graphic-native blocks (fail-closed).
- R4 ``unresolved-anchor`` — scan ALL string leaves recursively to arbitrary
  depth; any token matching ``\banchor:`` anywhere in a leaf is a hit (left
  word boundary: ``pianchor:`` does not match). Routing is by LEAF KEY
  (prose-key ruling, final fix round): a hit ANYWHERE UNDER a prose key —
  ``notes``, ``narrative_beat``, ``label``, ``description``, ``title``,
  ``text_content`` (subtree ancestry: ``/notes/timing_lock`` is under
  ``notes``) — or under one of the 4 CONTRACT sections (the contract prose
  documents the anchor convention itself) is ADVISORY; EVERY other hit
  (frame-valued placeholders like ``start_frame: "anchor:42"``, mid-string
  tokens under scene keys, unknown top-level keys) is BLOCKED.

Activation (dual, design A.5 row-5 pick (c)):
  auto   — manifest ``style_playbook == "editorial-explainer-manifest"`` OR
           manifest ``lane == "news-editorial-motion"``, else project.json
           ``style_playbook`` EEM AND ``pipeline_type == "animated-explainer"``;
  forced — explicit ``--force-editorial`` (CLI) for reference projects and
           testing/audit runs. Production compose NEVER passes force.

- **Audit-only manifest override:** CLI ``--manifest`` may select an alternate
  manifest for explicit offline audits/tests. Production/compose code NEVER
  passes ``--manifest`` or a manifest override; production uses the shared
  root-then-artifacts resolver. Non-declaring projects SKIP; SKIP is NOT PASS,
  writes no report, and prints an explicit ``SKIPPED`` line (exit 0 retained for
  CLI compatibility; consumers must inspect stdout/report state).

Per-finding status is ``pass`` / ``blocked``; ADVISORY outcomes additionally
appear as status ``revise`` findings in the qc report ``findings[]`` plus a
``warnings[]`` entry (m1 acceptance vocabulary — final fix round). The
EvidenceRecord status remains ``pass``/``blocked`` ONLY: a REVISE record would
flip ``can_render()`` false in lib/production_validation.py and false-fail the
reference fixture, so revise never reaches the validation framework.

Registration: the gate name lives in the lane-conditional pool
``LANE_CONDITIONAL_PRE_RENDER_SCENE_GATES`` (lib/production_validation.py) and
is enforced per-scene only when the compose caller passes the UNION
required-gate set. It is NOT in the canonical required sets — kids / animation
/ character lanes are byte-identical.

This producer is the first code-produced ``EvidenceRecord`` in the repo
(prior evidence artifacts were agent-authored); flagged for reviewer attention.
"""

from __future__ import annotations

import argparse
import json
import logging
import os
import re
import sys
import tempfile
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any

REPO_ROOT = Path(__file__).resolve().parents[2]
if str(REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(REPO_ROOT))

from lib.production_provenance import hash_file, hash_json_data

GATE_EDITORIAL_LANGUAGE = "editorial-language"
STYLE_PLAYBOOK_EDITORIAL = "editorial-explainer-manifest"
LANE_NEWS_EDITORIAL = "news-editorial-motion"
EDITORIAL_PIPELINE_TYPE = "animated-explainer"

CONTRACT_SECTIONS = ("speech_lock_contract", "camera_rig", "physics", "global_overlays")
GRAPHIC_NATIVE_ROLES = {"document_cutout", "data_viz", "evidence_annotation"}
CUTOUT_GENUINE_METHODS = {"t2i_chroma_key", "web_plus_i2i"}
CLOSING_SIGNATURE_ROLES = {"background", "background_texture", "editorial_typography", "attribution"}
CLOSING_CAP = 1
PHOTO_AREA_FRAC_THRESHOLD = 0.85
PHOTO_METHODS = {"t2i", "i2i", "web_plus_i2i", "photo_asset", "web_asset", "sprite", "rig_frame"}
CUTOUT_METHODS = {"t2i_chroma_key"}
ANCHOR_TOKEN = re.compile(r"\banchor:", re.IGNORECASE)
PROSE_ADVISORY_KEYS = {"notes", "narrative_beat", "label", "description", "title", "text_content"}
# R4 advisory routing set (final fix round): prose keys PLUS the 4 contract
# sections — the contract prose (speech_lock_contract) legitimately documents
# the anchor-placeholder convention, so a mention there is advisory, not a
# live placeholder. Every other key (scene frame fields, unknown keys) BLOCKS.
ADVISORY_KEYS = PROSE_ADVISORY_KEYS | set(CONTRACT_SECTIONS)
PHOTOREAL_LEXICON = re.compile(r"photo|dslr|render|realistic|cinematic", re.IGNORECASE)
IDENTIFIER_TOKEN = re.compile(r"^[A-Za-z_$][A-Za-z0-9_$]*$")
AXIS_DIVISION_MARKER = re.compile(r"/\s*maxValue\b")
BAR_SLOT_MARKER = re.compile(r"barSlots\s*\(")
GRID_MARKER = re.compile(r"\bGRID")
DECLARATION_MARKER = re.compile(r"^(?:export\s+)?(?:const|function)\s+([A-Za-z_$][A-Za-z0-9_$]*)", re.MULTILINE)
FLEX_DISPLAY_MARKER = re.compile(r"display\s*:\s*[\"'`]?flex")

RULE_CONTRACT = "contract-sections"
RULE_GRAPHIC_NATIVE = "graphic-native-required"
RULE_PHOTO_DOMINANCE = "photo-frame-dominance"
RULE_ANCHOR = "unresolved-anchor"

# Failure codes (E.6 catalog). Rule-level codes for the 4 rules:
EL_CONTRACT_SECTION_MISSING = "EL-CONTRACT-SECTION-MISSING"
EL_GRAPHIC_NATIVE_MISSING = "EL-GRAPHIC-NATIVE-MISSING"
EL_PHOTO_FRAME_DOMINANCE = "EL-PHOTO-FRAME-DOMINANCE"
EL_UNRESOLVED_ANCHOR = "EL-UNRESOLVED-ANCHOR"


class EditorialGateInvocationError(Exception):
    """Invocation-class failure (CLI exit 2 / compose M7 catch): abort BEFORE rules."""


@dataclass
class Finding:
    rule: str
    scene_id: str | None
    status: str  # "pass" | "blocked" | "revise" (revise = advisory, m1)
    code: str
    message: str

    def to_dict(self) -> dict[str, Any]:
        return {
            "rule": self.rule,
            "scene_id": self.scene_id,
            "status": self.status,
            "code": self.code,
            "message": self.message,
        }


@dataclass
class GateReport:
    project: str
    lane: str
    activated: bool
    findings: list[Finding] = field(default_factory=list)
    warnings: list[str] = field(default_factory=list)
    stats: dict[str, Any] = field(default_factory=dict)
    scene_ids: list[str] = field(default_factory=list)
    composition_root: str | None = None
    manifest_input_hashes: dict[str, str] = field(default_factory=dict)

    @property
    def blocked(self) -> list[Finding]:
        return [f for f in self.findings if f.status == "blocked"]

    @property
    def passed(self) -> bool:
        return self.activated and not self.blocked

    def to_qc_dict(self) -> dict[str, Any]:
        return {
            "project": self.project,
            "lane": self.lane,
            "activated": self.activated,
            "pass": self.passed,
            "errors": [f"{f.code}: {f.message}" for f in self.blocked],
            "warnings": list(self.warnings),
            "stats": dict(self.stats),
            "findings": [f.to_dict() for f in self.findings],
        }


# ---------------------------------------------------------------------------
# Shared helpers (single source of truth for lane detection — amendment minor)
# ---------------------------------------------------------------------------

def read_json_if_valid(path: Path) -> dict[str, Any] | None:
    """Parsed JSON object, or None when the file is absent OR unreadable.

    Distinguishing absent vs corrupt is the caller's job (is_file()) — the
    compose-side residue warning (M6) fires only when BOTH files exist but
    failed to parse, so projects that legitimately carry no manifest are not
    warned on every compose.
    """
    try:
        if not path.is_file():
            return None
        raw = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, ValueError, UnicodeDecodeError):
        return None
    return raw if isinstance(raw, dict) else None


def resolve_manifest_path(project_dir: Path, override: Path | None = None) -> Path:
    """ONE shared manifest resolver (review round 2, MINOR 13) used by BOTH the
    CLI and the compose wiring: explicit override, else ``<project>/
    scene_manifest.json``, else ``<project>/artifacts/scene_manifest.json``
    (the layout ``episode_gate.py`` also probes). Falls back to the root path
    so error messages stay stable when neither exists."""
    project_dir = Path(project_dir)
    if override is not None:
        return Path(override)
    root_manifest = project_dir / "scene_manifest.json"
    if root_manifest.is_file():
        return root_manifest
    artifacts_manifest = project_dir / "artifacts" / "scene_manifest.json"
    if artifacts_manifest.is_file():
        return artifacts_manifest
    return root_manifest


def detect_editorial_lane(manifest: dict[str, Any] | None, project_json: dict[str, Any] | None) -> bool:
    """Single source of truth for editorial lane auto-detection (E.2).

    True iff either input declares style_playbook == 'editorial-explainer-manifest' or
    lane == 'news-editorial-motion'; both keys are checked in both manifest and
    project.json. Unreadable (None) inputs simply satisfy no branch.
    """
    if isinstance(manifest, dict):
        if manifest.get("style_playbook") == STYLE_PLAYBOOK_EDITORIAL:
            return True
        if manifest.get("lane") == LANE_NEWS_EDITORIAL:
            return True
    if isinstance(project_json, dict):
        if (project_json.get("style_playbook") == STYLE_PLAYBOOK_EDITORIAL
                or project_json.get("lane") == LANE_NEWS_EDITORIAL):
            return True
    return False


def _manifest_declares_editorial(manifest: dict[str, Any] | None) -> bool:
    if not isinstance(manifest, dict):
        return False
    return (manifest.get("style_playbook") == STYLE_PLAYBOOK_EDITORIAL
            or manifest.get("lane") == LANE_NEWS_EDITORIAL)


# ---------------------------------------------------------------------------
# Manifest structural scans
# ---------------------------------------------------------------------------

def _iter_string_leaves(node: Any, path: str = "") -> list[tuple[str, Any, str]]:
    """Recursive (path, value, scene_id-context) scan — scene context filled by caller."""
    leaves: list[tuple[str, Any, str]] = []
    if isinstance(node, dict):
        for key, val in node.items():
            leaves.extend(_iter_string_leaves(val, f"{path}/{key}"))
    elif isinstance(node, list):
        for idx, val in enumerate(node):
            leaves.extend(_iter_string_leaves(val, f"{path}[{idx}]"))
    else:
        leaves.append((path, node, ""))
    return leaves


def _iter_string_leaves_with_scenes(manifest: dict[str, Any]) -> list[tuple[str, Any, str]]:
    """String leaves of the whole manifest, attributed to their scene when inside scenes[]."""
    out: list[tuple[str, Any, str]] = []
    scenes = manifest.get("scenes")
    scene_entries: list[tuple[str, Any]] = []
    if isinstance(scenes, list):
        scene_ids = []
        for idx, scene in enumerate(scenes):
            sid = None
            if isinstance(scene, dict):
                sid = scene.get("scene_id") or scene.get("id")
            scene_ids.append(str(sid) if sid else f"scene[{idx}]")
        for idx, scene in enumerate(scenes):
            scene_entries.append((f"/scenes[{idx}]", scene))
    # everything except scenes[]
    shallow = {k: v for k, v in manifest.items() if k != "scenes"}
    for path, val, _sid in _iter_string_leaves(shallow):
        out.append((path, val, ""))
    for prefix, scene in scene_entries:
        sid = ""
        if isinstance(scene, dict):
            sid = str(scene.get("scene_id") or scene.get("id") or "")
        for path, val, _sid2 in _iter_string_leaves(scene):
            out.append((f"{prefix}{path}", val, sid))
    return out


def _non_empty(value: Any) -> bool:
    """R1 presence: only non-empty strings / JSON objects / arrays count.
    Booleans and numbers are ABSENT — ``"physics": false`` / ``0`` must not
    satisfy a contract-section requirement (review round 2, MINOR 5)."""
    if isinstance(value, bool) or isinstance(value, (int, float)):
        return False
    if isinstance(value, str):
        return bool(value.strip())
    if isinstance(value, (dict, list)):
        return len(value) > 0
    return value is not None


# ---------------------------------------------------------------------------
# Composition source tree (B.0 / M4: recursive walk INCLUDING lib/)
# ---------------------------------------------------------------------------

def _composition_root(project_dir: Path, manifest: dict[str, Any], override: Path | None = None) -> Path:
    if override is not None:
        return Path(override)
    project_id = str(manifest.get("project_id") or project_dir.name)
    return REPO_ROOT / "remotion-composer" / "src" / project_id


def _walk_source_tree(root: Path) -> tuple[dict[str, str], list[str]]:
    """Return ({relpath: text}, [relpath-with-read-errors]) for *.tsx/*.ts under root."""
    texts: dict[str, str] = {}
    bad: list[str] = []
    if not root.is_dir():
        return texts, bad
    for pattern in ("*.tsx", "*.ts"):
        for path in sorted(root.rglob(pattern)):
            if not path.is_file():
                continue
            rel = str(path.relative_to(root))
            try:
                texts[rel] = path.read_text(encoding="utf-8")
            except (OSError, UnicodeDecodeError):
                bad.append(rel)
    return texts, bad


def _declaration_span(text: str, name: str) -> str | None:
    """Slice of a top-level declaration body: from the declaration keyword to the
    next top-level declaration (or EOF). Per M4 the verdict is per declaration
    BODY, never per file."""
    pattern = re.compile(
        r"^(?:export\s+)?(?:const|function)\s+" + re.escape(name) + r"\b",
        re.MULTILINE,
    )
    match = pattern.search(text)
    if not match:
        return None
    nxt = None
    for other in DECLARATION_MARKER.finditer(text, match.end()):
        # skip destructured/property-looking hits inside the body: require keyword at line start
        nxt = other.start()
        break
    return text[match.start(): nxt] if nxt else text[match.start():]


def _genuine_structure_markers(body: str) -> bool:
    """Numeric axis mapping or bar-slot/grid construction (B.3)."""
    if BAR_SLOT_MARKER.search(body):
        return True
    if GRID_MARKER.search(body):
        return True
    if "maxValue" in body and (AXIS_DIVISION_MARKER.search(body) or "plotHeight" in body):
        return True
    return False


def _card_stack_markers(body: str) -> bool:
    """Presentation card divs — flex display stacks without axis math (B.3)."""
    return bool(FLEX_DISPLAY_MARKER.search(body))


def _parse_scene_registry(tree_texts: dict[str, str], root: Path) -> dict[str, str]:
    """SCENE_COMPONENTS record -> {scene_id: relpath} resolved via import bindings."""
    registry: dict[str, str] = {}
    for rel, text in tree_texts.items():
        if "SCENE_COMPONENTS" not in text:
            continue
        imports: dict[str, str] = {}
        for m in re.finditer(
            r"import\s*\{\s*([A-Za-z_$][\w$]*)\s*\}\s*from\s*[\"']([^\"']+)[\"']", text
        ):
            imports[m.group(1)] = m.group(2)
        span_match = re.search(r"SCENE_COMPONENTS[^=]*=\s*\{", text)
        if not span_match:
            continue
        # take the balanced-brace span of the record (bounded scan)
        depth = 0
        start = text.find("{", span_match.start())
        if start < 0:
            continue
        end = start
        for i in range(start, min(len(text), start + 20000)):
            if text[i] == "{":
                depth += 1
            elif text[i] == "}":
                depth -= 1
                if depth == 0:
                    end = i
                    break
        record = text[start: end]
        for m in re.finditer(r"[\"']([\w\-]+)[\"']\s*:\s*([A-Za-z_$][\w$]*)", record):
            scene_id, component = m.group(1), m.group(2)
            if not any(ch.isdigit() for ch in scene_id):
                continue
            import_path = imports.get(component)
            if not import_path:
                continue
            candidate = (root / import_path).resolve() if import_path.startswith(".") else (root.parent / import_path).resolve()
            if not candidate.is_file() and candidate.suffix not in {".tsx", ".ts"}:
                tsx_candidate = candidate.with_suffix(".tsx")
                if tsx_candidate.is_file():
                    candidate = tsx_candidate
            try:
                rel_resolved = str(candidate.resolve().relative_to(root.resolve()))
            except ValueError:
                continue
            registry[scene_id] = rel_resolved
        if registry:
            break
    return registry


def _scene_number(scene_id: str) -> int | None:
    digits = re.findall(r"\d+", scene_id)
    return int(digits[-1]) if digits else None


def _map_scene_to_source(
    scene: dict[str, Any],
    scene_id: str,
    root: Path,
    tree_texts: dict[str, str],
    registry: dict[str, str],
) -> tuple[str | None, Finding | None]:
    """Resolver order per design C: override > file-per-scene convention > single-file inline."""
    override = scene.get("composition_source")
    if isinstance(override, str) and override.strip():
        target = (root / override).resolve()
        try:
            target.relative_to(root.resolve())
        except ValueError:
            return None, Finding(RULE_GRAPHIC_NATIVE, scene_id, "blocked", "EL-SOURCE-OVERRIDE-MISSING",
                                 f"composition_source override escapes composition root: {override}")
        if not target.is_file():
            return None, Finding(RULE_GRAPHIC_NATIVE, scene_id, "blocked", "EL-SOURCE-OVERRIDE-MISSING",
                                 f"composition_source override does not exist: {override}")
        return str(target.relative_to(root.resolve())), None

    scenes_dir = (root / "scenes").resolve()
    root_resolved = root.resolve()
    scene_num = _scene_number(scene_id)
    if scene_num is not None:
        exact = scenes_dir / f"S{scene_num:02d}.tsx"
        variants = sorted(p for p in scenes_dir.glob(f"S{scene_num:02d}_*.tsx") if p != exact)
        candidates = ([exact] if exact.is_file() else []) + variants
        if len(candidates) > 1:
            named = ", ".join(str(c.relative_to(root_resolved)) for c in candidates)
            return None, Finding(RULE_GRAPHIC_NATIVE, scene_id, "blocked", "EL-MAP-AMBIGUOUS",
                                 f"scene maps to multiple composition files: {named}")
        if len(candidates) == 1:
            mapped_rel = str(candidates[0].relative_to(root_resolved))
            registry_rel = registry.get(scene_id)
            if registry_rel is not None and registry_rel != mapped_rel:
                return None, Finding(RULE_GRAPHIC_NATIVE, scene_id, "blocked", "EL-MAP-AMBIGUOUS",
                                     f"scene registry maps {scene_id} to {registry_rel} but convention maps it to {mapped_rel}")
            return mapped_rel, None

    # single-file inline mode: exactly one root .tsx declaring a SCENES record
    inline_candidates: list[str] = []
    for rel, text in tree_texts.items():
        if "/" not in rel and rel.endswith(".tsx") and re.search(r"\bSCENES\b", text):
            inline_candidates.append(rel)
    if len(inline_candidates) > 1:
        named = ", ".join(sorted(inline_candidates))
        return None, Finding(RULE_GRAPHIC_NATIVE, scene_id, "blocked", "EL-MAP-AMBIGUOUS",
                             f"multiple single-file composition candidates: {named}")
    if len(inline_candidates) == 1:
        return inline_candidates[0], None

    if registry.get(scene_id):
        return registry[scene_id], None

    return None, Finding(RULE_GRAPHIC_NATIVE, scene_id, "blocked", "EL-MAP-UNRESOLVED",
                         f"cannot map scene {scene_id} to a composition source (no scenes/S<NN>.tsx, "
                         f"no single-file SCENES record, no registry entry)")


def _parse_scenes_record(text: str) -> dict[str, str]:
    """Parse ``const SCENES: Record<...> = { s1: SceneS1, ... }`` -> {key: component}."""
    match = re.search(r"\bSCENES\b[^=]*=\s*\{", text)
    if not match:
        return {}
    start = text.find("{", match.start())
    depth = 0
    end = start
    for i in range(start, min(len(text), start + 20000)):
        if text[i] == "{":
            depth += 1
        elif text[i] == "}":
            depth -= 1
            if depth == 0:
                end = i
                break
    record = text[start: end]
    pairs: dict[str, str] = {}
    for m in re.finditer(r"([A-Za-z_$][\w$]*)\s*:\s*([A-Za-z_$][\w$]*)", record):
        pairs[m.group(1)] = m.group(2)
    return pairs


# ---------------------------------------------------------------------------
# Graphic-native verdict (amended B, C2a/C2b)
# ---------------------------------------------------------------------------

def _import_closure(tree_texts: dict[str, str], mapped_rel: str, root: Path) -> dict[str, str]:
    """Mapped scene source + its transitive RELATIVE imports within the
    composition root (review round 2, MAJOR 1 remedy 3): identifiers resolve
    only here — never tree-wide."""
    closure: dict[str, str] = {}
    seen: set[str] = set()
    queue: list[str] = [mapped_rel] if mapped_rel in tree_texts else []
    root_resolved = root.resolve()
    while queue:
        rel = queue.pop(0)
        if rel in seen or rel not in tree_texts:
            continue
        seen.add(rel)
        closure[rel] = tree_texts[rel]
        importer_dir = (root / rel).parent
        for m in re.finditer(r"from\s+[\"'](\.[^\"']+)[\"']", tree_texts[rel]):
            spec = m.group(1)
            base = (importer_dir / spec).resolve()  # relative to the importing FILE's dir
            candidates = [base]
            if base.suffix == "":
                candidates += [base.with_suffix(".tsx"), base.with_suffix(".ts"), base / "index.tsx"]
            for cand in candidates:
                if cand.suffix not in {".tsx", ".ts"} or not cand.is_file():
                    continue
                try:
                    rel2 = str(cand.resolve().relative_to(root_resolved))
                except ValueError:
                    continue  # imports escaping the composition root are out of scope
                if rel2 not in seen:
                    queue.append(rel2)
                break
    return closure


def _has_native_graphic_markers(text: str) -> bool:
    """Numeric-axis / bar-slot / grid markers (review round 2, MAJOR 1 remedy 3):
    the role+method fallback requires these IN THE MAPPED SCENE SOURCE — never
    tree-level."""
    return bool(BAR_SLOT_MARKER.search(text) or GRID_MARKER.search(text)
                or "maxValue" in text or "plotHeight" in text)


def _layer_verdict(
    layer: dict[str, Any],
    mapped_text: str,
    closure_texts: dict[str, str],
) -> tuple[bool, str, str]:
    """(genuine, code-if-not, reason). Amended B (C2a/C2b) + review round 2
    (MAJOR 1): single-token claims are name-bound to the mapped scene source
    and resolve only in the mapped source + its local import closure; zero or
    ambiguous resolution is BLOCKED with no fall-through; the role+method
    fallback exists ONLY for identifier-less layers and only when the mapped
    source itself carries native-graphic markers."""
    role = str(layer.get("role") or "")
    pipeline = layer.get("pipeline") if isinstance(layer.get("pipeline"), dict) else {}
    method = str(pipeline.get("method") or "")
    component = pipeline.get("component")
    component = str(component) if isinstance(component, str) else ""

    # step 1 — cutout manifest credit (C2a)
    if role == "document_cutout" and method in CUTOUT_GENUINE_METHODS:
        if method != "web_plus_i2i" or pipeline.get("remove_bg") is True:
            return True, "", "cutout chroma-key/remove-bg pipeline credit"

    # step 2 — single-token identifier resolution (C2b + MAJOR 1 name binding)
    identifier = component if (component and IDENTIFIER_TOKEN.fullmatch(component)) else None
    if identifier:
        if not re.search(r"\b" + re.escape(identifier) + r"\b", mapped_text):
            return False, "EL-GRAPHIC-NATIVE-UNKNOWN", (
                f"component {identifier!r} is not referenced by the mapped scene source — "
                f"an unmounted claim cannot carry the graphic-native rule (fail-closed)")
        declarations: list[tuple[str, str]] = []
        for rel, text in closure_texts.items():
            span = _declaration_span(text, identifier)
            if span is not None:
                declarations.append((rel, span))
        if len(declarations) == 1:
            rel, body = declarations[0]
            if _genuine_structure_markers(body):
                return True, "", f"{identifier} declares genuine chart structure in {rel}"
            if _card_stack_markers(body):
                return False, "EL-GRAPHIC-NATIVE-UNKNOWN", (
                    f"{identifier} resolves to a presentation card-stack body in {rel} "
                    f"(flex display, no axis math / bar-slot construction) — vetoed")
            return False, "EL-GRAPHIC-NATIVE-UNKNOWN", (
                f"{identifier} resolves to a declaration body in {rel} with no genuine "
                f"graphic-native structure (no axis math, no bar-slot/grid construction)")
        if len(declarations) == 0:
            # zero-resolution single-token claims no longer fall through to the
            # role+method credit (MAJOR 1 remedy 2)
            return False, "EL-GRAPHIC-NATIVE-UNKNOWN", (
                f"component {identifier!r} resolves to no declaration in the mapped "
                f"source or its local imports — an unresolvable claim cannot carry "
                f"the graphic-native rule (fail-closed)")
        named = ", ".join(sorted(rel for rel, _ in declarations))
        return False, "EL-IDENT-AMBIGUOUS", (
            f"identifier {identifier} declared in multiple bodies ({named}) — ambiguous "
            f"claims cannot carry the graphic-native rule (fail-closed)")

    # step 4 — role+method fallback credit (C2b + MAJOR 1 remedy 3): ONLY for
    # identifier-less layers, and only when the mapped scene source itself
    # carries native-graphic markers (never tree-level).
    if role in {"data_viz", "evidence_annotation"} and method == "remotion_native":
        if _has_native_graphic_markers(mapped_text):
            return True, "", "role+method credit (remotion_native; mapped scene source carries native-graphic markers)"
        return False, "EL-GRAPHIC-NATIVE-UNKNOWN", (
            f"role+method fallback denied: mapped scene source carries no native-graphic "
            f"markers (role={role!r}, method={method!r})")

    if component:
        return False, "EL-GRAPHIC-NATIVE-UNKNOWN", (
            f"component {component!r} is not a single resolvable token and "
            f"role+method fallback does not apply (role={role!r}, method={method!r})")
    return False, "EL-GRAPHIC-NATIVE-UNKNOWN", (
        f"no graphic-native credit: role={role!r} method={method!r} has no cutout credit, "
        f"no component identifier, and no role+method fallback")


# ---------------------------------------------------------------------------
# Analyzer
# ---------------------------------------------------------------------------

def analyze_project(
    project_dir: Path,
    manifest_override: Path | None = None,
    force_editorial: bool = False,
    composition_root_override: Path | None = None,
) -> GateReport:
    """Analyze one project. ``composition_root_override`` is an audit/test seam —
    the CLI and compose wiring never pass it (production always resolves
    ``remotion-composer/src/<project_id>/``)."""
    project_dir = Path(project_dir)
    manifest_path = resolve_manifest_path(project_dir, manifest_override)
    slug = project_dir.name
    findings: list[Finding] = []
    warnings: list[str] = []
    stats: dict[str, Any] = {}

    manifest_raw = read_json_if_valid(manifest_path)
    project_json_raw = read_json_if_valid(project_dir / "project.json")

    activated = bool(force_editorial) or detect_editorial_lane(manifest_raw, project_json_raw)
    lane = "unknown"
    if isinstance(manifest_raw, dict):
        lane = str(manifest_raw.get("lane") or (
            STYLE_PLAYBOOK_EDITORIAL if manifest_raw.get("style_playbook") == STYLE_PLAYBOOK_EDITORIAL else "unknown"
        ))

    if manifest_path.is_file() and manifest_raw is None:
        # exists but unparseable — invocation error, abort BEFORE rules (E.5 exit 2)
        raise EditorialGateInvocationError(
            f"EL-MANIFEST-UNPARSEABLE: {manifest_path} is not valid UTF-8 JSON")

    if not activated:
        return GateReport(project=slug, lane=lane, activated=False, findings=[], warnings=[],
                          stats={"scenes": 0}, scene_ids=[])

    if manifest_raw is None:
        findings.append(Finding(RULE_CONTRACT, None, "blocked", "EL-MANIFEST-MISSING",
                                f"scene manifest not found: {manifest_path}"))
        return GateReport(project=slug, lane=lane, activated=True, findings=findings,
                          warnings=warnings, stats={"scenes": 0}, scene_ids=[])

    manifest = manifest_raw

    # M3 — EL-LANE-MISMATCH: ONLY when the manifest itself declares an editorial key
    # AND the declared pipeline type contradicts the editorial pipeline.
    if _manifest_declares_editorial(manifest) and isinstance(project_json_raw, dict):
        declared_pipeline = str(project_json_raw.get("pipeline_type", EDITORIAL_PIPELINE_TYPE))
        if declared_pipeline != EDITORIAL_PIPELINE_TYPE:
            findings.append(Finding(RULE_CONTRACT, None, "blocked", "EL-LANE-MISMATCH",
                                    f"manifest declares editorial lane but project.json "
                                    f"pipeline_type is {declared_pipeline!r}, expected "
                                    f"{EDITORIAL_PIPELINE_TYPE!r}"))

    # canvas (R3 denominator): strictly positive numbers (MINOR 6 — bool True
    # is not a dimension, zero/negative canvases are invalid)
    canvas = manifest.get("canvas") if isinstance(manifest.get("canvas"), dict) else {}
    canvas_w = canvas.get("width")
    canvas_h = canvas.get("height")
    canvas_ok = (isinstance(canvas_w, (int, float)) and not isinstance(canvas_w, bool)
                 and isinstance(canvas_h, (int, float)) and not isinstance(canvas_h, bool)
                 and canvas_w > 0 and canvas_h > 0)
    if not canvas_ok:
        findings.append(Finding(RULE_PHOTO_DOMINANCE, None, "blocked", "EL-CANVAS-INVALID",
                                "canvas.width/height missing or non-numeric — photo-dominance "
                                "denominator unevaluable (fail-closed)"))

    scenes = manifest.get("scenes")
    if not isinstance(scenes, list) or not scenes:
        findings.append(Finding(RULE_GRAPHIC_NATIVE, None, "blocked", "EL-SCENES-EMPTY",
                                "scenes array is empty or absent"))
        report = GateReport(project=slug, lane=lane, activated=True, findings=findings,
                            warnings=warnings, stats={"scenes": 0}, scene_ids=[])
        return report

    scene_ids = []
    for idx, scene in enumerate(scenes):
        sid = scene.get("scene_id") if isinstance(scene, dict) else None
        scene_ids.append(str(sid) if sid else f"scene[{idx}]")

    # closing classification (A.2, array order; no index field exists — amendment
    # minor). CLOSING := (position == last scene) AND signature subset AND
    # editorial_typography present. Scenes claiming signature at NON-last
    # positions stay CONTENT; >=2 claimants raise the cap breach.
    signature_positions = []
    for idx, scene in enumerate(scenes):
        roles = {str(l.get("role")) for l in (scene.get("layers") or []) if isinstance(l, dict) and l.get("role")}
        # Signature claimants preserve cap semantics; exemption additionally requires typography on last scene.
        if roles and roles <= CLOSING_SIGNATURE_ROLES:
            signature_positions.append(idx)
    closing_positions: set[int] = set()
    if len(signature_positions) > CLOSING_CAP:
        named = ", ".join(scene_ids[i] for i in signature_positions)
        findings.append(Finding(RULE_GRAPHIC_NATIVE, None, "blocked", "EL-CLOSING-CAP-BREACH",
                                f"{len(signature_positions)} scenes claim the closing signature "
                                f"(cap {CLOSING_CAP}): {named}"))
    if (len(scenes) - 1) in signature_positions:
        last_roles = {str(l.get("role")) for l in (scenes[-1].get("layers") or []) if isinstance(l, dict) and l.get("role")}
        if "editorial_typography" in last_roles:
            closing_positions.add(len(scenes) - 1)  # last scene, signature subset, and carries type

    content_positions = [i for i in range(len(scenes)) if i not in closing_positions]
    stats["scenes"] = len(scenes)
    stats["content_scenes"] = len(content_positions)
    stats["closing_scenes"] = len(closing_positions)

    # R1 — contract sections
    for section in CONTRACT_SECTIONS:
        if _non_empty(manifest.get(section)):
            findings.append(Finding(RULE_CONTRACT, None, "pass", EL_CONTRACT_SECTION_MISSING,
                                    f"contract section {section!r} present"))
        else:
            findings.append(Finding(RULE_CONTRACT, None, "blocked", EL_CONTRACT_SECTION_MISSING,
                                    f"contract section {section!r} missing or empty"))

    # composition source tree (B.0 / M4)
    comp_root = _composition_root(project_dir, manifest, composition_root_override)
    tree_texts: dict[str, str] = {}
    bad_sources: list[str] = []
    if comp_root.is_dir():
        tree_texts, bad_sources = _walk_source_tree(comp_root)
    else:
        findings.append(Finding(RULE_GRAPHIC_NATIVE, None, "blocked", "EL-SOURCE-ROOT-MISSING",
                                f"composition source root missing: {comp_root}"))
    stats["composition_files"] = len(tree_texts)
    registry = _parse_scene_registry(tree_texts, comp_root) if tree_texts else {}

    # R2 — per content scene
    heroes = 0
    r2_reasons: list[str] = []
    genuine_scene_ids: set[str] = set()
    for idx in content_positions:
        scene = scenes[idx]
        sid = scene_ids[idx]
        if not comp_root.is_dir():
            continue  # episode-level EL-SOURCE-ROOT-MISSING already emitted
        source_rel, map_failure = _map_scene_to_source(scene, sid, comp_root, tree_texts, registry)
        if map_failure is not None:
            findings.append(map_failure)
            r2_reasons.append(f"{sid}: {map_failure.code}")
            continue
        source_text = tree_texts.get(source_rel)
        if source_text is None:
            if source_rel in bad_sources:
                findings.append(Finding(RULE_GRAPHIC_NATIVE, sid, "blocked", "EL-SOURCE-UNPARSEABLE",
                                        f"composition source {source_rel} is not valid UTF-8"))
            else:
                findings.append(Finding(RULE_GRAPHIC_NATIVE, sid, "blocked", "EL-SOURCE-UNPARSEABLE",
                                        f"composition source {source_rel} unreadable/empty"))
            r2_reasons.append(f"{sid}: EL-SOURCE-UNPARSEABLE")
            continue
        layers = [l for l in (scene.get("layers") or []) if isinstance(l, dict)]
        credited: list[str] = []
        failures: list[tuple[str, str]] = []
        vetoed: list[str] = []
        genuine_data_viz = 0
        closure_texts = _import_closure(tree_texts, source_rel, comp_root)
        for layer in layers:
            role = str(layer.get("role") or "")
            if role not in GRAPHIC_NATIVE_ROLES:
                continue
            genuine, code, reason = _layer_verdict(layer, source_text, closure_texts)
            if genuine:
                credited.append(f"{role}:{reason}")
                if role == "data_viz":
                    genuine_data_viz += 1
            else:
                comp_name = (layer.get("pipeline") or {}).get("component")
                desc = (f"{role} layer"
                        + (f" (component {comp_name!r})" if comp_name else "")
                        + f": {reason}")
                failures.append((code, desc))
                if comp_name:
                    # keep per-layer rejections visible even when the scene
                    # passes via another genuine layer (MAJOR 3 / MAJOR 1 pins)
                    vetoed.append(f"{comp_name}: {reason}")
        if credited:
            genuine_scene_ids.add(sid)
            message = "genuine graphic-native layer(s): " + "; ".join(credited)
            if vetoed:
                # keep per-layer vetoes visible even when the scene passes via
                # another genuine layer (review round 2, MAJOR 3 pin)
                message += " | vetoed: " + "; ".join(vetoed)
            findings.append(Finding(RULE_GRAPHIC_NATIVE, sid, "pass", EL_GRAPHIC_NATIVE_MISSING,
                                    message))
            if genuine_data_viz == 0:
                # m1 advisory vocabulary: revise finding + warnings[] entry,
                # never a blocked finding, never a REVISE EvidenceRecord.
                message = (f"advisory: content scene {sid} carries graphic-native "
                           f"layer(s) but no data_viz (EL-DATA-VIZ-ADVISORY)")
                warnings.append(message)
                findings.append(Finding(RULE_GRAPHIC_NATIVE, sid, "revise",
                                        "EL-DATA-VIZ-ADVISORY", message))
        else:
            detail = "; ".join(msg for _code, msg in failures) or "no graphic-native-role layers declared"
            code = failures[0][0] if failures else "EL-GRAPHIC-NATIVE-UNKNOWN"
            findings.append(Finding(RULE_GRAPHIC_NATIVE, sid, "blocked", EL_GRAPHIC_NATIVE_MISSING,
                                    f"no genuine graphic-native layer in content scene: {detail}"))
            r2_reasons.append(f"{sid}: {code}")

    # R3 — per scene raster-photo dominance.
    # (a) ANY hero-role layer is intentionally over-blocked even when non-photo.
    # (b) Raster photo methods/lexicon are role-agnostic at >=85% canvas.
    # (c) Unmeasurable photo (no usable w/h) in a NON-CLOSING scene blocks
    # UNLESS the same scene carries genuine graphic-native credit per the
    # scene-bound R2 procedure (`genuine_scene_ids`) — a photo alongside
    # genuine graphics is a backplate texture / cutout subject; a scene with
    # only a photo and no genuine graphic-native blocks (fail-closed).
    for idx, scene in enumerate(scenes):
        sid = scene_ids[idx]
        if not canvas_ok:
            break
        reasons: list[str] = []
        layers = [l for l in (scene.get("layers") or []) if isinstance(l, dict)]
        photo_without_area: list[str] = []
        photo_without_area_exempt: list[str] = []
        for layer in layers:
            role = str(layer.get("role") or "")
            pipeline = layer.get("pipeline") if isinstance(layer.get("pipeline"), dict) else {}
            method = str(pipeline.get("method") or "")
            prompt_blob = " ".join(str(pipeline.get(k) or "") for k in ("prompt", "prompt_digest"))
            if method in CUTOUT_METHODS or method == "remotion_native":
                photo_signal = False
            elif method == "web_plus_i2i" and pipeline.get("remove_bg") is True:
                photo_signal = False
            else:
                photo_signal = method in PHOTO_METHODS or bool(PHOTOREAL_LEXICON.search(method + " " + prompt_blob))
            if role == "hero":
                heroes += 1
                reasons.append(f"photo-as-hero layer {layer.get('layer_id')!r} (intentional fail-closed over-block)")
            if not photo_signal:
                continue
            transform = layer.get("transform") if isinstance(layer.get("transform"), dict) else {}
            w, h = transform.get("w"), transform.get("h")
            measurable = (isinstance(w, (int, float)) and not isinstance(w, bool) and w > 0
                          and isinstance(h, (int, float)) and not isinstance(h, bool) and h > 0)
            if not measurable:
                # Genuine-credit exemption (final fix round): the scene-bound R2
                # verdict is the ONLY exemption — no role-based backplate carve-out.
                if sid not in genuine_scene_ids:
                    photo_without_area.append(str(layer.get("layer_id") or role or "<unnamed>"))
                else:
                    photo_without_area_exempt.append(str(layer.get("layer_id") or role or "<unnamed>"))
                continue
            area_frac = (w * h) / (canvas_w * canvas_h)
            if area_frac >= PHOTO_AREA_FRAC_THRESHOLD:
                reasons.append(
                    f"photo layer {layer.get('layer_id')!r} (role {role!r}) covers {area_frac:.2%} "
                    f"of canvas (threshold {PHOTO_AREA_FRAC_THRESHOLD:.2f})")
        if idx not in closing_positions and photo_without_area:
            reasons.append(
                "unmeasurable raster photo layer(s) " + ", ".join(photo_without_area)
                + " in non-closing scene (no usable w/h, no genuine graphic-native "
                "credit in the scene); treated as dominating (fail-closed)")
        elif idx not in closing_positions and photo_without_area_exempt:
            stats.setdefault("unmeasurable_photo_exempt_scenes", []).append(sid)
        if reasons:
            findings.append(Finding(RULE_PHOTO_DOMINANCE, sid, "blocked", EL_PHOTO_FRAME_DOMINANCE,
                                    "; ".join(reasons)))
        else:
            findings.append(Finding(RULE_PHOTO_DOMINANCE, sid, "pass", EL_PHOTO_FRAME_DOMINANCE,
                                    "no dominant raster photo surface"))
    stats["heroes"] = heroes

    # R4 — recursive arbitrary-depth scan; token may occur anywhere in a leaf
    # (left word boundary via \banchor:). Classification is by PATH ANCESTRY
    # (prose-key ruling, final fix round):
    #  - hit under a prose key (notes / narrative_beat / label / description /
    #    title / text_content)              -> ADVISORY: revise finding + warnings[]
    #  - EVERY other hit (frame-valued placeholder leaves like
    #    start_frame: "anchor:42", mid-string tokens under scene keys, unknown
    #    top-level keys)                    -> BLOCKED finding
    anchor_hits: list[tuple[str, str, str, bool]] = []
    for path, value, sid in _iter_string_leaves_with_scenes(manifest):
        if not isinstance(value, str) or not ANCHOR_TOKEN.search(value):
            continue
        leaf_segments = [seg.split("[", 1)[0] for seg in path.split("/") if seg]
        advisory = any(seg in ADVISORY_KEYS for seg in leaf_segments)
        anchor_hits.append((path, value, sid, advisory))
    blocked_anchor = [(p, v, s) for p, v, s, adv in anchor_hits if not adv]
    # Pinned census counts BLOCKED leaves only (xang-dau=0, mua-lu=re-pinned).
    stats["anchor_leaves"] = len(blocked_anchor)
    stats["blocked_anchor_leaves"] = len(blocked_anchor)
    stats["advisory_anchor_leaves"] = len(anchor_hits) - len(blocked_anchor)
    for path, value, sid, advisory in anchor_hits:
        preview = value if len(value) <= 80 else value[:77] + "..."
        message = (f"{'advisory ' if advisory else ''}anchor placeholder token "
                   f"at {path}: {preview!r}")
        if advisory:
            # prose-key mention — non-blocking: revise finding + warnings[] entry
            warnings.append(f"advisory: {message}")
            findings.append(Finding(RULE_ANCHOR, sid or None, "revise",
                                    EL_UNRESOLVED_ANCHOR, message))
        else:
            findings.append(Finding(RULE_ANCHOR, sid or None, "blocked",
                                    EL_UNRESOLVED_ANCHOR, message))
    if not blocked_anchor:
        findings.append(Finding(RULE_ANCHOR, None, "pass", EL_UNRESOLVED_ANCHOR,
                                "no unresolved anchor: tokens"))

    stats["blocked_findings"] = len([f for f in findings if f.status == "blocked"])
    stats["passed_findings"] = len([f for f in findings if f.status == "pass"])
    stats["revise_findings"] = len([f for f in findings if f.status == "revise"])

    # input hashes: manifest + every walked composition source (stale-fingerprint
    # check). Keys are project-relative paths (``..``-segments allowed) so
    # validate_pre_render resolves them against project_dir unchanged.
    input_hashes: dict[str, str] = {}
    m_hash = hash_file(manifest_path)
    if m_hash:
        input_hashes[os.path.relpath(manifest_path.resolve(), project_dir.resolve())] = m_hash
    for rel in sorted(tree_texts):
        f_hash = hash_file(comp_root / rel)
        if f_hash:
            input_hashes[os.path.relpath((comp_root / rel).resolve(), project_dir.resolve())] = f_hash

    return GateReport(project=slug, lane=lane, activated=True, findings=findings,
                      warnings=warnings, stats=stats, scene_ids=scene_ids,
                      composition_root=(str(comp_root) if comp_root.is_dir() else None),
                      manifest_input_hashes=input_hashes)


# ---------------------------------------------------------------------------
# Producer (E.3): evidence artifact + qc report + EvidenceRecord
# ---------------------------------------------------------------------------

def _atomic_write_json(path: Path, payload: dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    fd, tmp_name = tempfile.mkstemp(dir=str(path.parent), prefix=path.name, suffix=".tmp")
    try:
        with os.fdopen(fd, "w", encoding="utf-8") as handle:
            json.dump(payload, handle, ensure_ascii=False, indent=2)
            handle.write("\n")
        os.replace(tmp_name, path)
    except BaseException:
        try:
            os.unlink(tmp_name)
        except OSError:
            pass
        raise


def build_gate_artifacts(
    report: GateReport,
    project_dir: Path,
    write_outputs: bool = True,
) -> tuple[dict[str, Any], Any]:
    """Turn a GateReport into (qc_report_dict, EvidenceRecord). No
    composition-root override exists on this path (review round 2, MINOR 7):
    the producer record always reflects the production composition resolution.
    Tests that need the audit seam call ``analyze_project`` directly and pass
    its report here."""
    qc = report.to_qc_dict()
    if not report.activated:
        return qc, None

    evidence_rel = "artifacts/editorial_language_evidence.json"
    qc_rel = "qc/editorial_language.json"

    evidence_detail = {
        "gate": GATE_EDITORIAL_LANGUAGE,
        "project": report.project,
        "lane": report.lane,
        "manifest": "scene_manifest.json",
        "composition_root": report.composition_root,
        "scene_ids": list(report.scene_ids),
        "content_scenes": report.stats.get("content_scenes"),
        "closing_scenes": report.stats.get("closing_scenes"),
        "findings": [f.to_dict() for f in report.findings],
        "warnings": list(report.warnings),
        "stats": dict(report.stats),
        "input_files": dict(report.manifest_input_hashes),
    }

    from lib.production_validation import EvidenceRecord, ValidationStatus

    blocked = report.blocked
    fingerprint_payload = {
        "project": report.project,
        "lane": report.lane,
        "scene_ids": list(report.scene_ids),
        "findings": [f.to_dict() for f in report.findings],
        "stats": dict(report.stats),
    }

    if write_outputs:
        _atomic_write_json(Path(project_dir) / evidence_rel, evidence_detail)
        _atomic_write_json(Path(project_dir) / qc_rel, qc)
        evidence_hash = hash_file(Path(project_dir) / evidence_rel)
        if not evidence_hash:
            raise EditorialGateInvocationError(
                "EL-PRODUCER-CRASHED: refusing to emit a zero-byte evidence artifact "
                "(would hash-match trivially)")

    record = EvidenceRecord(
        gate_name=GATE_EDITORIAL_LANGUAGE,
        scope="pre_render",
        status=ValidationStatus.BLOCKED if blocked else ValidationStatus.PASS,
        severity="critical" if blocked else "info",
        evidence_paths=[evidence_rel],
        scene_coverage=sorted(report.scene_ids),
        expected_scenes=sorted(report.scene_ids),
        fingerprint=hash_json_data(fingerprint_payload),
        issues=[f"{f.code}: {f.message}" for f in blocked],
        metadata={
            "input_hashes": dict(report.manifest_input_hashes),
            "lane": "editorial",
            "style_playbook": STYLE_PLAYBOOK_EDITORIAL if report.lane == STYLE_PLAYBOOK_EDITORIAL else report.lane,
            "advisories": list(report.warnings),
            "stats": dict(report.stats),
        },
        artifact_hashes={evidence_rel: hash_file(Path(project_dir) / evidence_rel)} if write_outputs else {},
    )
    return qc, record


def run_editorial_language_gate(
    project_dir: Path,
    force: bool = False,
    write_outputs: bool = True,
    manifest_override: Path | None = None,
) -> tuple[dict[str, Any], Any]:
    """Analyze + write artifacts + build the EvidenceRecord (production producer
    path — NO composition-root override, MINOR 7).

    Returns (qc_report_dict, EvidenceRecord-or-None). The record is None when
    the gate is not activated (non-editorial project, no force flag).

    Raises EditorialGateInvocationError for invocation-class failures
    (unparseable manifest) — CLI maps to exit 2, the compose caller catches
    into an EL-PRODUCER-CRASHED BLOCKED record (M7).
    """
    report = analyze_project(project_dir, manifest_override=manifest_override, force_editorial=force)
    return build_gate_artifacts(report, project_dir, write_outputs=write_outputs)


# ---------------------------------------------------------------------------
# CLI (E.5)
# ---------------------------------------------------------------------------

def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(
        prog="editorial_language_gate",
        description="Editorial-language pre-render gate (news-editorial-motion lane).",
    )
    parser.add_argument("--project", required=True, help="projects/<slug> directory")
    parser.add_argument("--force-editorial", action="store_true",
                        help="force activation regardless of declaration (reference/testing runs)")
    parser.add_argument("--manifest", default=None, help="optional scene_manifest.json override path")
    args = parser.parse_args(argv)

    project_dir = Path(args.project)
    if not project_dir.is_dir():
        print(f"ERROR: project directory not found: {project_dir}", file=sys.stderr)
        return 2
    manifest_override = Path(args.manifest) if args.manifest else None
    if manifest_override is not None and not manifest_override.is_file():
        print(f"ERROR: --manifest override not found: {manifest_override}", file=sys.stderr)
        return 2

    try:
        qc, _record = run_editorial_language_gate(
            project_dir, force=bool(args.force_editorial), write_outputs=True,
            manifest_override=manifest_override,
        )
    except EditorialGateInvocationError as exc:
        print(f"ERROR: {exc}", file=sys.stderr)
        return 2
    except Exception as exc:  # producer crash — CLI exit 2, partial output never accepted
        print(f"ERROR: EL-PRODUCER-CRASHED: {exc}", file=sys.stderr)
        return 2

    if not qc.get("activated"):
        print(f"SKIPPED — {qc.get('project')} is not an editorial project "
              f"(style_playbook/lane not declared); no report file written; "
              f"audit with --force-editorial")
        return 0

    blocked = [f for f in qc.get("findings", []) if f.get("status") == "blocked"]
    revise = [f for f in qc.get("findings", []) if f.get("status") == "revise"]
    print(f"[editorial-language] {qc.get('project')} lane={qc.get('lane')} "
          f"scenes={qc.get('stats', {}).get('scenes')} "
          f"blocked={len(blocked)} revise={len(revise)} "
          f"warnings={len(qc.get('warnings', []))}")
    if blocked:
        print("FAIL — editorial language gate rejected")
        for f in blocked:
            scene = f.get("scene_id") or "episode"
            print(f"  - {scene}: {f.get('code')}: {f.get('message')}")
        return 1
    print("RESULT: PASS"
          + (f" ({len(revise)} advisory revise finding(s) in warnings[])" if revise else ""))
    return 0


if __name__ == "__main__":
    sys.exit(main())
