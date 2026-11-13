# Evidence-controlled path components reach file writes unvalidated

Date: 2026-11-13
Repo: OpenMontage (Phase 4C review, uncommitted tree)

## Pattern
QC/restore tooling reads trust-boundary input (evidence JSON produced by earlier
rounds, shipped in cloned worktrees) and interpolates its path-shaped fields
(`packet_path`, `scene_id`) directly into write/read targets. No containment clamp.
Repo idiom `_contained_path()` (`tools/qc/scene_packet.py:52-56`) exists but was not
reused in the new module.

## Verified exploit shape (PoC'd by review worker, /tmp only)
- fallback path from evidence (`packet_path_for`) used as atomic write target
  when canonical packet absent (exact post-re-mint scenario) -> arbitrary
  user-writable file overwrite, exit 0; non-JSON victims fully replaced.
- raw `scene_id` into filename formats -> embedded `../` traversal; prefix-glued
  names (`packet_{sid}`) neutralize leading `../` only.

## Rule for future reviews
Any module consuming evidence/manifest JSON with path-bearing fields must clamp
every derived read/write path under its root dir (resolve + relative_to) and
validate ids (`^[A-Za-z0-9._-]+$`, no `..`). Prefix-glued filenames are NOT
containment. Check the fallback branch, not just the canonical path segment.

## Related worker findings (Phase 4C)
- All-drift restore exit 0; "missing evidence" conflates not-sealable scenes;
  kill-switch env leaking across CLI boundaries (mint flag governing restore skip).
- Symlink flip fallback copyfile writes THROUGH the link and clobbers prior
  round target — unlink first or copy-to-tmp + os.replace.

## Round-2 addendum: episode-root inference by name-walkup
`infer_packet_episode_dir` walked up through BOTH `packets` and `episode` name
components -> landed on project root; real nested layout keeps its ref tree
(artifacts/, assets/) under `packets/episode/`, so every hash check failed ->
preserve set empty -> purge-all with default flags (reproduced on
projects/test-production-hardening-20261109-0114). A test modeling the layout
with refs at the PROJECT root passed and hid the gap. Lesson: when inferring a
root for hash verification, probe by REF RESOLUTION (first ancestor where the
packet's reviewed_hashes targets exist), never by directory-name pattern; and
fixtures must copy the real layout's ref placement, not just its dir shape.

## Round-3 closure (final)
Ref-resolution probe (packet dir -> ancestors, first root where every
reviewed_hashes ref exists; name-walkup only as fallback) verified on live tree
+ /tmp PoC: nested layout now preserved correctly, flat layouts green, C1 clamp
intact. Outstanding follow-ups (non-blocking): relative `..` keys in
reviewed_hashes bypass the read-side clamp (probe existence oracle +
false-preserved; fix = one-line key filter rejecting absolute/`.`/`..` parts at
boundary); stale-intact duplicate first-preserved-wins; :410 relative-key clamp
accepted residual.
