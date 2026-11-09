# Hermes Video Skills Handoff — Proposed Targeted Updates + Caller Migration Inventory

> **⚠️ STATUS: PROPOSALS ONLY. To be executed by Hermes via skill_manage after reading each actual skill — NOT executed by this job.**
> Nothing in this document states a Hermes-side change as done. Every item below is a proposal Hermes must
> independently verify against the actual installed skill before editing.

| Field | Value |
|---|---|
| Authoring job | W5, ENS (Worker), 2026-11-09 |
| Repo | `/Users/tuyennguyen/project/OpenMontage`, branch `editorial-hardening-20261108` |
| Authoritative plan | `docs/plans/2026-11-09-video-skills-agent-team-sync.md` — **Task 5, lines 86–100** (responsibility map) |
| Canonical repo contract | `docs/ORCHESTRATION_DOCTRINE.md` — single orchestration authority for every skill below |
| Supporting plans | `docs/plans/2026-11-08-editorial-production-hardening.md`, `docs/plans/2026-11-09-hardening-review-findings.md` |
| Scope guards | Default Hermes profile only (`/Users/tuyennguyen/.hermes/skills/`, per plan line 16); no other profiles; no scheduler-integration claim accepted (plan line 22: existing doctrine/skill scheduler-integration claims are "not independently accepted") |
| This job's access | Repo artifacts ONLY. This job never read or wrote `~/.hermes/**`. All `~/.hermes/...` paths cited below are **Hermes-owned paths for HERMES to inspect**, cited verbatim from repo documents. |

## How to read this document

- **What changes / Why** are proposals grounded in plan Task 5 + doctrine sections. Hermes must re-validate each against the actual skill body before any `skill_manage` call.
- **Canonical reference**: every video-production skill must point to `docs/ORCHESTRATION_DOCTRINE.md` as the single orchestration authority and must NOT copy orchestration rules locally (plan lines 89–97, doctrine §8.5: sửa doctrine tại ENS repo rồi sync **một chiều ENS → mirrors** — mirrors carry no opposing authority and the doctrine wins on conflict; the earlier "sync 2 chiều" framing is stale).
- **Contract version note**: doctrine now carries a **machine-readable contract metadata block** at the top of `docs/ORCHESTRATION_DOCTRINE.md` (`contract_version: 2.0`, `last_sync: 2026-11-09`, `source_of_truth` = this file, `sync_order` with ENS repo contract as primary, 7 `required_phases`, `success_semantics: strict`, `publication_policy: delivery_separate_from_render_acceptance) plus §8 (production contract — phases, strict success, freeze, legacy compat, publication). Skill updates must reference `docs/ORCHESTRATION_DOCTRINE.md` **by path + this versioned metadata (`contract_version 2.0` / `last_sync 2026-11-09`) + §-anchor**. §"How to read" original note that metadata was pending Task 2 is superseded by this state; §-anchors and the changelog remain valid navigation aids.
- **Honesty note**: plan line 22 records that doctrine and the editorial skill now claim scheduler integration; these claims are **not independently accepted** by this handoff. Skill text must not repeat them as fact.

---

## 1. Proposed targeted skill updates (per plan Task 5 responsibility map)

### 1.1 `video-producer`

**What changes (proposed):**
- Slim to a **thin entry/router**: request/brief/approval handling, team lifecycle, backend selection, delivery checklist (plan line 89).
- Replace any embedded orchestration/threshold content with a reference to `docs/ORCHESTRATION_DOCTRINE.md`.
- Preserve the two contracts the repo references from this skill (see §2 caller inventory): **Thumbnail-as-Scene-1 Contract (SSOT)** and **Visual Presentation Contract** — keep them in the skill; they are domain policy, not orchestration duplication.
- Keep delivery checklist including the rule that publish/delivery authorization is separate from render acceptance (doctrine §3 area / plan Task 2: "Publish/delivery authorization is separate from render acceptance; no automatic publication based on QC PASS").

**Why:** plan line 89 assigns exactly this responsibility set; plan line 99 forbids duplicated orchestration. AGENT_GUIDE.md (repo) hard-depends on this skill's named sections (lines 51, 57), so section titles must survive any edit or AGENT_GUIDE.md breaks.

**Canonical reference:** `docs/ORCHESTRATION_DOCTRINE.md` (§0 session split, §1 probe gates, §2 Hermes-orchestrator rule; team mode §0b).

### 1.2 `openmontage-video`

**What changes (proposed):**
- Operational OM adapter only: **actual verified commands, gates, resume/recovery, evidence, limits** (plan line 90). No parallel copy of the creative handbook.
- Audit the skill's referenced `references/claude-code-orchestration.md` (Hermes-owned path; doctrine frames it as a **subordinate mirror** synced one-way ENS → mirrors per §8.5, no longer a parallel source of truth): per plan acceptance line 100, **no stale default to Claude implementation when current OM assignment is ENS**. Update routing/assignment statements so OM production is assigned to ENS with explicit, current statements; keep any still-accurate Claude-path documentation clearly labeled as historical/explicit alternative, not the default.
- State honest capability status for each documented command: implemented-unverified vs independently-verified (plan Task 1 classification), with revision/command/evidence where verified.

**Why:** plan line 90 + acceptance line 100; doctrine §0–§2 are the contract the adapter must execute (probe gates A/B/C, Hermes-terminal rule, fix_request loop, team mode §0b).

**Canonical reference:** `docs/ORCHESTRATION_DOCTRINE.md` (whole file; §0/§0b/§1/§2, changelog). Cross-check with `docs/plans/2026-11-08-editorial-production-hardening.md` for gate identities.

### 1.3 `news-video-pipeline`

**What changes (proposed):**
- Keep **news research / facts / channel-specific execution policy** as the skill's domain content (plan line 91).
- Remove any embedded production-gate/team orchestration; **inherit the production gate/team contract by reference** to `docs/ORCHESTRATION_DOCTRINE.md`.
- Channel policy (aspect/safe-zone/channel specifics) must cite **one referenced source**, not locally copied dimensions (plan line 99) — see §3 checks.

**Why:** plan line 91 defines the split: domain research/format stays, orchestration is inherited.

**Canonical reference:** `docs/ORCHESTRATION_DOCTRINE.md` (phases §, gates §1) + plan Task 2 contract phases (brief/script/facts → … → delivery).

### 1.4 `crypto-analysis-video` + `crypto-video-content` — **consolidation comparison FIRST**

**Proposed order of operations (Hermes runs this comparison before any edit/removal):**
1. **Enumerate callers/references of both skills** in the default profile and in active routing context (news/crypto/editorial lanes, plan Task 7.5). Record who invokes which, and by what trigger text. This census is a precondition — the plan explicitly orders "compare callers/references first" (plan line 92).
2. **Overlap assessment:** identify orchestration content duplicated across the two skills; that overlap consolidates **into the existing umbrella** (which of the two is the umbrella must be decided from the census — this handoff does not presume it; plan says "existing umbrella", i.e. no new umbrella skill may be created, plan line 99).
3. **Retain specialized content:** research format, TradingAgents research requirement (**explicitly retained**, plan line 92; the sealed-research production run `eth-tradingagents-20261003` is the repo-side precedent), crypto-specific format/channel policy.
4. **Compatibility stubs:** the consolidated-away skill remains as a stub that routes to the umbrella until caller migration is **proven** (plan line 92: "compatibility stubs until caller migration proven"). Stub states the new route; carries no duplicated orchestration.
5. **TradingAgents requirement retained** in whichever skill survives as the crypto entry.

**What changes (proposed, conditional on census):** consolidate overlapping orchestration into the existing umbrella; convert the other into a compatibility stub; both reference doctrine; research/format specialization stays with its owner skill.

**Why:** plan lines 92 + 99 (consolidate into existing umbrella, migrate callers before removal, stubs until proven).

**Canonical reference:** `docs/ORCHESTRATION_DOCTRINE.md` (single authority for the retained orchestration); specialized research references stay as domain citations (e.g. TradingAgents research lane docs where they exist in-repo).

### 1.5 `research-pipeline`

**What changes (proposed):**
- Scope to **facts/citation handoff into frozen scene claims** (plan line 93). Output artifacts must be consumable as sealed scene-packet claims (facts/script freeze + claims/sources binding, plan Task 2).
- Remove any video-orchestration behavior — it is "not another video orchestrator" (plan line 93).
- Document that its outputs become frozen packet inputs: later mutations invalidate dependent verdicts/renders (doctrine/plan Task 2 dependency-freeze rule).

**Why:** plan line 93; Task 2's freeze-everything contract needs the facts handoff to be packet-compatible.

**Canonical reference:** `docs/ORCHESTRATION_DOCTRINE.md` + `docs/plans/2026-11-08-editorial-production-hardening.md` (packet contents: approved scene claims/narration, audio/events, asset rights/hashes).

### 1.6 `vietnamese-tts-local`

**What changes (proposed):**
- **Actual-audio-first timing**: durations come from real audio, never estimates (plan line 94).
- **Alignment provenance**: record ASR/alignment source and revision with the audio (plan line 94; doctrine Gate A requires TTS probe + faster-whisper ASR round-trip before S1 PASS).
- **Pronunciation/display distinction**: spoken-form vs display-form lexicon entries kept separate (plan line 94; doctrine §3 phoneme_dict caveat and terminology policy).
- **Regeneration invalidation**: re-TTS invalidates downstream alignment, timing locks, reviews and renders (plan line 94; editorial hardening's timing re-lock behavior — desynced edits are mechanically blocked at edit→compose checkpoints; `refresh_manifest`-style recovery is the documented re-TTS path).

**Repo-side counterpart (reference, not edit):** `tools/audio/vieneu_tts.py` wraps the external runner `~/project/vietnamese-tts/vieneu_cli.py` (48 kHz ONNX CPU, preset voices, inline cues). The skill must reference the actual tool contract, including honest limits (repo stays torch-free; model weights live in the runner project).

**Why:** plan line 94 + doctrine §1 Gate A + §3.

**Canonical reference:** `docs/ORCHESTRATION_DOCTRINE.md` (§1 Gate A, §3 lexicon/terminology policy).

### 1.7 `faceless-explainer`, `media-use`, delivery skills — **resolve canonical location FIRST**

**What changes (proposed):**
- **Do not invent missing skill paths.** Hermes must resolve each skill's installed canonical location in the default profile **before** any edit or reference (plan line 95).
- Repo-side evidence for routing (for Hermes' comparison, not as proof of Hermes-side presence):
  - `media-use`: referenced by vendored HyperFrames skills (`.agents/skills/hyperframes/SKILL.md` routes to `/media-use`; `.agents/skills/motion-graphics/SKILL.md` Step 2 wraps `media-use resolve`; `.agents/skills/website-to-video/SKILL.md` requires `/media-use` before sourcing) and by repo skills (`skills/core/hyperframes.md` line 22, `skills/meta/animation-runtime-selector.md` line 69, `skills/meta/bespoke-composition.md` line 118). In-repo location: `.agents/skills/media-use/` (resolve verb, project cache + global cache + HeyGen catalog).
  - `faceless-explainer`: appears in-repo **only as a HyperFrames plugin route** (`/faceless-explainer` in `.agents/skills/hyperframes/SKILL.md` routing table, lines 58/71/111–115; `.agents/skills/hyperframes/PROVENANCE.md` line 39 lists it among HyperFrames layer skills). **If** Hermes' default profile has no standalone `faceless-explainer` skill, the correct outcome per plan is **no edit** — the routing already lives in the HyperFrames umbrella skill (§1.9).
  - Delivery skills: resolve what is actually installed; route them to the doctrine delivery phase (publish/delivery authorization separate from render acceptance, plan Task 2). Add references **only when actually present/relevant** (plan line 95).

**Why:** plan line 95 verbatim; audit-routing duty.

**Canonical reference:** `docs/ORCHESTRATION_DOCTRINE.md` (delivery phase; publish authorization rule).

### 1.8 `tiktok-upload`

**What changes (proposed):**
- Gate the skill on **two independent preconditions** (plan line 96):
  1. **Verified accepted artifact + hash** — the exact artifact hash that passed independent QC/acceptance, not "a render completed".
  2. **Explicit publication authorization for this job** — an explicit owner statement covering this artifact and this destination. **Render PASS never implies upload permission** (plan line 96; plan Task 2: "no automatic publication based on QC PASS").
- Skill text must state the negative rule explicitly so no caller can read PASS as authorization.
- Record authorization + artifact hash in the run's evidence trail (auditable publication record).

**Repo-side context (reference, not edit):** `tools/publishers/export_bundle.py` is deliberately local-only ("no account, no upload, no cost") — the repo has **no** TikTok publisher; `tiktok-upload` appears to be routed Hermes-side only. Any future repo-side networked publisher is out of scope for this handoff (export_bundle.py header explicitly defers it).

**Why:** plan lines 42 (Task 2), 96 (Task 5), 144 (Definition of done: "no push/deploy/publication … authorized by this plan").

**Canonical reference:** `docs/ORCHESTRATION_DOCTRINE.md` (publish/delivery authorization separation) + `docs/plans/2026-11-08-editorial-production-hardening.md` (acceptance vs delivery separation).

### 1.9 HyperFrames skills

**What changes (proposed):**
- **Retain explicit user/backend routing** — the repo HARD RULE stands (AGENT_GUIDE.md lines 142–152): when both Remotion and HyperFrames are available, present both before locking `render_runtime`; silent default-picking is forbidden; single-runtime machines proceed but must say so and record `rejected_because: "runtime not available on this machine"`.
- Keep **native HyperFrames instructions** (vendored upstream skills at `.agents/skills/hyperframes/`, heygen-com/hyperframes v0.7.17 per `skills/INDEX.md` line 318 + `.agents/skills/hyperframes/PROVENANCE.md`); do not rewrite imported libraries wholesale (plan line 76).
- **Adapter-specific status only: NO untested OM/Remotion parity guarantee.** Each HyperFrames skill states what it verifies on the HyperFrames path and must not claim equivalence with OM/Remotion gates or outputs (plan line 97).
- HyperFrames runs still write canonical artifacts + checkpoints (AGENT_GUIDE.md line 252) — keep that requirement visible in routing text.
- Migration/remotion-to-hyperframes skills keep their migration framing with honest status of what has actually been exercised.

**Why:** plan lines 9 ("Other renderer backends remain explicit adapters, not assumed parity"), 97, 100 ("Backend choice remains explicit rather than globally banning otherwise valid tools").

**Canonical reference:** `docs/ORCHESTRATION_DOCTRINE.md` for shared production gates **where actually wired**; otherwise the skill states explicitly that full OM gate parity is not established. Cross-reference `skills/core/hyperframes.md` (Layer 2 routing) and `skills/meta/animation-runtime-selector.md` (repo-side selection policy).

---

## 2. Caller migration inventory

### 2.1 Known repo-side callers (verified by grep on this branch, 2026-11-09)

| # | Caller (repo path) | Skill referenced (Hermes-owned path, cited verbatim) | What it depends on | Proposed caller change |
|---|---|---|---|---|
| C1 | `AGENT_GUIDE.md` line 51 | `/Users/tuyennguyen/.hermes/skills/media/video-producer/SKILL.md` → section **Thumbnail-as-Scene-1 Contract (SSOT)** | Section title + contract content (thumbnail as Scene 1; delivery = video + copyable description) | If §1.1 restructures the skill, section titles/anchors MUST survive, or AGENT_GUIDE.md must be updated in the same migration step. Migrate caller first (update AGENT_GUIDE.md path/anchor), then remove/rename anything in the skill. |
| C2 | `AGENT_GUIDE.md` line 57 | `/Users/tuyennguyen/.hermes/skills/media/video-producer/SKILL.md` → section **Yêu cầu về Visual & Hình ảnh (Visual Presentation Contract)** | Section title + visual contract content | Same rule as C1. |
| C3 | `docs/ORCHESTRATION_DOCTRINE.md` framing note above the metadata block (formerly line 7; shifted by the inserted JSON block) | `~/.hermes/skills/openmontage-video/references/claude-code-orchestration.md` | **Updated state:** doctrine now frames this Hermes-side file as a **subordinate mirror** synced one-way ENS → mirrors (§8.5: ENS primary, mirrors carry no opposing authority, doctrine wins on conflict; Claude-Code standalone = legacy/secondary, not default). Former "Nguồn sự thật song song" / parallel-SSOT framing removed | **RESOLVED repo-side** (doctrine framing now current, supports plan acceptance line 100). Remaining Hermes-side duty per §8.5: mirror syncs FROM doctrine, never edits doctrine back; the mirror's own text must not claim parallel authority — covered by §1.2's openmontage-video update |
| C4 | Vendored HyperFrames router `.agents/skills/hyperframes/SKILL.md` (lines 34, 58, 71, 111–115) + `PROVENANCE.md` (lines 30, 39, 53) | `/media-use`, `/faceless-explainer`, `/motion-graphics`, `/website-to-video`, `/product-launch-video`, `/pr-to-video`, `/embedded-captions`, `/general-video` routes | Repo-side vendored routing table mirrors the HyperFrames umbrella's command set | Repo vendored copies are ENS-owned; Hermes consolidations that change command names/routes must be mirrored in repo `.agents/skills/hyperframes/` + `skills/INDEX.md` in the same migration step, or routes silently dangle. Migration order: Hermes changes route → repo mirrors route → verify both → only then stub/remove old route. |
| C5 | `skills/core/hyperframes.md` (line 22), `skills/meta/animation-runtime-selector.md` (line 69), `skills/meta/bespoke-composition.md` (line 118), `.agents/skills/motion-graphics/SKILL.md`, `.agents/skills/website-to-video/SKILL.md` | `.agents/skills/media-use/` (repo copy) and the `media-use resolve` workflow | Repo skills depend on the resolve verb and its path | If Hermes-side media-use changes shape, repo references stay valid only while the resolve verb contract is stable. Keep verb contract unchanged during consolidation; document any extension additively. |
| C6 | `tools/video/video_compose.py` + `tools/video/hyperframes_compose.py` (runtime-aware router; PROJECT_CONTEXT.md lines 73–75, 83, 85) | Backend selection contract (Remotion / HyperFrames / FFmpeg) | `render_runtime` routing and `get_info()["render_engines"]` | No Hermes change may assume a runtime ordering or parity that the router does not implement (§1.9). Repo tool untouched by this handoff. |
| C7 | Editorial lane entry (`.agents/skills/editorial-explainer-manifest/` + `skills/pipelines/explainer/*` directors) | Doctrine contract (repo-side); Hermes skills are the outer routing layer for owner-initiated editorial runs | News/crypto/editorial lane routing is exercised by plan Task 7.5 ("Reopen fresh Hermes routing context: news/crypto/editorial route to correct existing skills and same team contract without importing worker logs") | Hermes routing updates (§1.1–1.5) must keep all three lanes routing to existing skills — never to a new umbrella — and must not import worker logs/context between lanes. |

### 2.2 Known gaps in the caller census (honest status)

- **Task 1 inventory — now present:** `docs/video-contract-inventory.json` and `docs/video-capability-status.md` (plan Task 1 outputs) now exist in `docs/`. The table above was compiled from repo-side grep evidence before those files landed and is still NOT the full caller census the plan requires; the Task 1 inventory is the authoritative caller census and should be consulted in addition to §2.1.
- **Hermes-side callers:** this job has no access to `~/.hermes/**`. Caller lists inside the Hermes profile (agent definitions, triggers, schedules) are **Hermes-owned inspection items**. The scheduled-video caller enumeration belongs to plan Task 1 step 2.
- **Crypto lane callers:** no repo-side file names `crypto-analysis-video` or `crypto-video-content` — the crypto lane appears to be routed Hermes-side only. This strengthens the §1.4 requirement that **Hermes performs the caller census itself before consolidating**.

### 2.3 Sequencing rules (plan lines 92, 99, 129, 135)

1. **Migrate callers BEFORE removal.** Every removal/consolidation is preceded by: caller census → caller updates verified → old skill stubbed (compatibility stub routing to the surviving skill) → stub kept until migration is proven in a fresh routing context (plan Task 7.5).
2. **No new overlapping umbrella.** Consolidation targets an *existing* skill. Creating a new umbrella skill to absorb crypto/news overlap is out of bounds.
3. **Compatibility stubs until caller migration proven.** Stub = route + trigger words preserved; zero duplicated orchestration; explicit "moved to X" statement.
4. **Staged activation.** Per plan Task 7.6, Hermes skill changes activate only after: capability-status evidence published, controlled sample verified, fresh routing context reopened (news/crypto/editorial correct). Until then, migrated entry points stay marked unsupported/legacy rather than implied-supported (plan Task 7.7).
5. **Scoped commits, per logical migration** (plan line 135): never broad `git add`; capture pre-change hashes; rollback via scoped inverse patch. This applies to repo-side caller edits (C1–C5); Hermes-side rollback follows Hermes' own skill versioning.
6. **In-flight episodes** keep their recorded contract revision; resume requires explicit migration/revalidation, never silent policy switch (plan line 135).

---

## 3. Verification steps Hermes must run — **ALL PROPOSED**

### 3.1 Proposed `skill_manage` command forms

> These are command *forms* for Hermes to adapt to its actual `skill_manage` interface after loading skill-authoring guidance. This job has not executed any of them and does not know Hermes' exact CLI signatures.

| Intent | Proposed form (adapt to actual CLI) |
|---|---|
| Add a reference (preferred over copying) | `skill_manage add-reference <skill> --to docs/ORCHESTRATION_DOCTRINE.md --anchor <§>` — verify the reference form exists; if only full-edit exists, prefer minimal `edit` that inserts one reference line |
| Edit one skill | `skill_manage edit <skill>` — **only after** `skill_manage read <skill>` (or equivalent) and loading skill-authoring guidance |
| Add a stub skill | `skill_manage add <stub-name>` with body = route statement + original triggers; no orchestration content |
| Remove a skill (LAST step only) | `skill_manage remove <skill>` — gated on §2.3 rule 1 (migration proven). Prefer leaving the stub over removal until Task 7.5's fresh-routing check passes |
| Inspect without edit | read/show/reference-listing forms — safe, run freely |

**Prohibited:** bulk edits across skills in one call; edits to non-default profiles; edits based on remembered skill content instead of a fresh read.

### 3.2 Post-change checks (per skill, before declaring a migration step done)

1. **Aliases resolve.** Every alias/trigger that previously reached the edited skill still resolves — to the same skill, or to its documented stub/successor. No silently dead trigger.
2. **Triggers intact.** Original trigger phrases preserved verbatim on surviving skills and stubs (stub carries the moved trigger list).
3. **Minimal execution path in SKILL.md.** SKILL.md keeps a short main path only; topic depth moved into `references/` split by topic (plan line 99: "Break large skills into existing `references/` by topic; keep triggers and minimal execution path in SKILL.md").
4. **Single-source aspect/safe-zone/channel policy.** Exactly ONE referenced source of truth for aspect ratios, safe zones, channel policy; no stale copied dimensions anywhere in the skill tree (plan line 99). Grep the edited skill for hardcoded dimensions/policy numbers — each hit is either the referenced source itself or a defect.
5. **Explicit per-job approval overrides preserved.** Any existing mechanism that lets a specific job override a default (approval, backend choice, format) survives unchanged (plan line 99 "Preserve delivery requirements and any explicit per-job approval overrides").
6. **Backend choice explicit.** After edits, no skill globally bans or silently defaults a backend; user/backend routing stays explicit (plan line 100; AGENT_GUIDE.md HARD RULE lines 142–152 for the repo mirror).
7. **Contract reference present and current.** Each edited video-production skill references `docs/ORCHESTRATION_DOCTRINE.md`; no skill carries a duplicated contradictory threshold (plan Task 2 acceptance).
8. **No stale Claude default.** openmontage-video (and any skill stating the OM implementation assignment) reflects ENS as the current assignment; Claude-path content is explicitly historical/alternative if retained (plan acceptance line 100).

### 3.3 Honest-status requirements (definition-of-done, plan lines 143–144)

- Skills describe **only verified commands/behavior with clear limits**. Unverified content must be labeled implemented-unverified or removed — not stated as proven.
- **No stale default to Claude implementation when current OM assignment is ENS** (plan line 100). Backend/executor choice stated explicitly, current, and per-context.
- **Scheduler-integration claims stay "not independently accepted"** (plan line 22). Skills must not assert scheduler integration as established fact until independently accepted; phrase as proposal/status-pending where the topic arises.
- Unsupported renderer adapters **block explicitly or identify nonproduction mode** (plan line 84); no implied parity (plan line 9, §1.9).
- Each skill's stated capability status uses the plan Task 1 vocabulary: implemented-unverified / independently-verified (with revision + command + evidence) / blocked / unsupported.

---

## 4. Constraints for Hermes execution

1. **Default profile only.** All changes under the default profile skills root (plan line 16: `/Users/tuyennguyen/.hermes/skills/`). No other Hermes profile is touched (also `docs/plans/2026-11-08-editorial-production-hardening.md` line 83: "Do not edit ~/.hermes/profiles/*").
2. **`skill_manage` only, after reading each actual skill** and after loading Hermes' skill-authoring guidance (plan line 88). Never edit from memory of a skill's content.
3. **Do not invent missing skill paths.** `faceless-explainer`, `media-use`, delivery skills: resolve the installed canonical location FIRST; add a reference only when actually present/relevant; if absent, record "not present — routing already owned by X" as the audit outcome instead of creating a path (plan line 95).
4. **No new umbrella skills.** Consolidation goes into an existing skill (§2.3 rule 2).
5. **Removal is last and gated** on proven caller migration + fresh-routing verification (§2.3, §3.1).
6. **Repo stays ENS-owned.** Hermes does not edit repo files as part of skill synchronization; repo-side caller fixes (C1–C5 mirrors, doctrine line 7) are ENS tasks coordinated with the active ENS owner (plan line 134 ownership split). Where a Hermes consolidation changes a repo-visible route, the ENS mirror update is sequenced per §2.3 rule 1 — both sides record the migration.
7. **No publication, deploy, or push authorized by this handoff or the plan** (plan line 144). `tiktok-upload` remains gated on §1.8's two preconditions regardless of any render result.
8. **Repo artifacts this handoff cites but does not touch:** `remotion-composer/` (untouched), all existing dirty/untracked state preserved, no test projects created.
9. **Honest diff review.** When Hermes reviews the resulting changes (plan Task 7.2), green unit counts alone are insufficient; session provenance and artifacts are the evidence.

---

## Appendix A — Plan-vs-repo discrepancies found while writing this handoff

| # | Discrepancy | Evidence | Disposition in this handoff |
|---|---|---|---|
| D1 | Task 1 outputs (`docs/video-contract-inventory.json`, `docs/video-capability-status.md`) referenced by the plan were absent at original handoff time (both exist now — see disposition) | `docs/` listing at handoff | **RESOLVED since original handoff:** both files now exist in `docs/` (verified 2026-11-09); §2.2 updated accordingly. §2.1 census remains grep-based and explicitly partial; the Task 1 inventory is the authoritative caller census |
| D2 | Doctrine framed OM production as "qua Claude Code" and named a Hermes-side Claude-orchestration file as parallel SSOT, while the plan requires ENS as the current OM assignment | `docs/ORCHESTRATION_DOCTRINE.md` framing note (formerly lines 5–7) vs plan line 100 | **RESOLVED since original handoff:** doctrine now states ENS orchestration is the primary authority and the Hermes-side file (`~/.hermes/skills/openmontage-video/references/claude-code-orchestration.md`) a subordinate mirror with one-way ENS → mirrors sync; sync order codified in §8.5 (Claude-Code standalone = legacy/secondary, not default); §7 mapping updated accordingly. "Parallel SSOT" framing removed. Residual work is Hermes-side only: §1.2's openmontage-video text must reflect the subordinate-mirror/ENS-primary status |
| D3 | Doctrine lacked machine-readable contract/version metadata at original handoff time | doctrine grep at original handoff (version/contract hits unrelated) | **RESOLVED since original handoff:** doctrine now carries a machine-readable metadata block (`contract_version: 2.0`, `last_sync: 2026-11-09`, `source_of_truth`, `sync_order`, 7 `required_phases`, `success_semantics: strict`, `publication_policy`) plus §8. Reference the contract as `docs/ORCHESTRATION_DOCTRINE.md` `contract_version 2.0` / `last_sync 2026-11-09` + §-anchor; §"How to read" updated accordingly |
| D4 | Doctrine and editorial skill claim scheduler integration that the plan has not independently accepted | plan line 22 | §3.3 forbids restating those claims as established; stays "not independently accepted" |
| D5 | `faceless-explainer` has no standalone repo skill — only a HyperFrames plugin route | `.agents/skills/hyperframes/SKILL.md` lines 58/71/111–115; `PROVENANCE.md` line 39 | §1.7: resolve-first rule applies with extra force — if absent Hermes-side, correct outcome is no edit |
| D6 | `crypto-analysis-video` / `crypto-video-content` / `tiktok-upload` have zero repo-side name references in code/docs/skills trees; **`news-video-pipeline` is the exception** — it IS named repo-side in `projects/france-riots-20261023/**` (16 files: briefs, checkpoints, history) as the news-lane contract | original repo-wide grep (docs/, tools/, lib/, skills/, *.md) + re-grep 2026-11-09 including `projects/france-riots-20261023/**` | These lanes are Hermes-routed; census is Hermes-owned (§2.2). Scope guard: the "zero references" claim holds only outside project artifact trees, and only for the three non-news names. Repo-side tiktok upload does not exist (`tools/publishers/export_bundle.py` is local-only by design) |
| D7 | `AGENT_GUIDE.md` hard-references two `video-producer` section titles by name | lines 51, 57 | §1.1 + C1/C2: section titles must survive edits or callers must migrate in the same step |

## Appendix B — Hermes-owned paths cited (for HERMES to inspect; this job never accessed them)

- `/Users/tuyennguyen/.hermes/skills/` — default-profile skills root (plan line 16)
- `/Users/tuyennguyen/.hermes/skills/media/video-producer/SKILL.md` — cited by `AGENT_GUIDE.md` lines 51, 57
- `~/.hermes/skills/openmontage-video/references/claude-code-orchestration.md` — cited by `docs/ORCHESTRATION_DOCTRINE.md` line 24 (preamble §authority, formerly line 7 prior to contract metadata block)
- All per-skill installed locations listed in plan Task 5 lines 89–97 — to be resolved by Hermes under the default profile
