# REPORT_TURN7 — v7 Scene 1 surgical change

Status: implementation in progress; Hermes independent QC and owner approval pending.

## Contract and baseline
- Task: `character-performer/kids/TASK_TURN7.md`; existing free Remotion route, $0 generation, no provider/model changes.
- Canonical source: `remotion-composer/src/KidsStoryEp1Remake.tsx`.
- Pre-edit canonical SHA256: `0ce939db68dcf1555483f340c1a88d6a16be6af6a9e066917f1058acc1166a1a` (38,817 bytes), identical to preserved v6 snapshot.
- Preserved v6 snapshot: `turn7/KidsStoryEp1Remake.v6.tsx`; will not overwrite.
- Preserved baseline: `turn7/baseline_hashes.json`, SHA256 `66c309aff475b0ee3416fdbcc624c4b64ac6eecd40d295043b832cfc87789c81`; will not overwrite.
- Existing rig frames found: rabbit 216, turtle 248; no regeneration of either rig, split, or mouth patch.
- Existing v7/stills/lossless directories: absent/0 PNGs before this run. Disk available: 44 GiB.
- Pre-existing git changes include Root.tsx, KawaiiRabbit.tsx, and many untracked assets/sources; no reset/stash/commit or cleanup.
- Read SSOT `rig_demo/cc/render_composite.py` for existing render/measurement pattern; retain the existing production Remotion composition and renderer, no pipeline rewrite.
- No images opened in Read or vision tools; image verification will use PIL numeric scripts only.

## Approved facing fact (Hermes pre-edit audit, not independently repeated)
- Native rabbit_taunt points LEFT; native turtle_side_m0 points RIGHT (true one-eye profiles).
- Existing shared body+mouth wrapper scaleX=-1 makes rabbit at x350 face RIGHT and turtle at x710 face LEFT in both requested windows.
- Preserve these values; no speculative flip, separate mouth transform, head rig, or regeneration.

## Intended camera and counter-transform
- World camera 1.22, origin (430,800), only [10.9,12.4); constant inside the shot, hard cuts at its boundaries.
- Counter-scale only S2 Idle turtle subtree by 1/1.22 about (430,800), same window. World camera 1.22 × counter 0.819672131147541 = turtle NET 1.0; original H260, anchor (710,885), breathing/facing/opacity unchanged.
- All other t<17.79: identity, including [15.3,17.79]; S3 turtle H300 and nod3 unchanged.
- Preserve every camera state at t>=17.79 exactly, all reaction staging, all audio/timeline/cues/visemes, and all other scenes.

## Verification queue
- Pending: source diff and preservation hashes; npx tsc --noEmit; exact approved v7 CLI render; ffprobe; 37 required stills; native 1230-frame v6/v7 lossless sequences and framewise PIL comparison.

## TURN7B mechanical (2026-10-15 12:28–, rig-animator CC, mechanical only — no TSX edits)

- B1 tsc: `npx tsc --noEmit` → RC=0 (5s, 12:28:19→12:28:24).
- B2 render v7 mp4: `npx remotion render KidsStoryEp1Remake out/kids_ep1_remake_v7.mp4 --concurrency=4 --log=error` → RC=0, 54.229s wall (100.96s user, 200% cpu), 12:33:30→12:34:24, 12,283,370 bytes (`remotion-composer/out/kids_ep1_remake_v7.mp4`).
- B3 ffprobe (verbatim, also tee'd to turn7/ffprobe_v7_video.json + ffprobe_v7_audio.txt):
  video: width=1080, height=1080, r_frame_rate=30/1, nb_read_frames=1230, duration=41.045333
  audio: aac,audio,48000,2
  → matches expected 1230f / 1080x1080 / 30/1 / ~41.045s / aac 48000 2ch. ALL PASS.
- Env: @remotion/cli 4.0.484.

### TURN7B incremental evidence — 2026-10-15T12:42:25

- B4b v7 PNG sequence: renderer RC=0; wall=102.30s (12:38:01–12:39:43); user=53.47s; system=6.44s. Flags accepted: `--sequence --image-format=png --concurrency=4 --log=error`.
- v7 count check RC=0; PNG count=1230; exact frame set 0..1229=True; pattern=`element-%04d.png`; total sequence bytes=2236620367.
- B4c first v6 attempt: renderer RC=127; wall=0.001s; cwd was repository root, so `./node_modules/.bin/remotion` did not exist there. Retry uses explicit absolute composer cwd; no source code was changed.
- B4a help attempts: initial `npx remotion render --help` hung and was stopped (no CLI exit code captured); direct help/grep returned pipeline RC=0 but no matching flags, so that RC is not proof of help success. Separate `remotion --version && ...` returned RC=1 before executing the redirected help. CLI header reported @remotion/cli 4.0.484. Actual sequence command accepted the flags and produced v7 output.
- v6 temporary entry uses the supplied Composition values (1230/30/1080/1080), including the required `registerRoot` import; Root.tsx Composition block was searched once; no defaultProps were required. Existing TSX was not edited.
- B5 copy result from shell: MISS_FLAG=0; 37 stills. Byte-integrity verification RC=0: 37/37 requested source/destination SHA256 pairs identical=True; no image decoding or image viewing.
- Requested stills copied: f0100.png, f0190.png, f0326.png, f0327.png, f0331.png, f0339.png, f0355.png, f0361.png, f0367.png, f0370.png, f0371.png, f0372.png, f0390.png, f0448.png, f0458.png, f0459.png, f0463.png, f0469.png, f0478.png, f0486.png, f0499.png, f0502.png, f0508.png, f0515.png, f0527.png, f0533.png, f0534.png, f0567.png, f0585.png, f0600.png, f0615.png, f0780.png, f0886.png, f0920.png, f1017.png, f1150.png, f1229.png.

#### B3 video recheck
RC=0; wall=1.772943s; stdout bytes=314; stderr bytes=0. Verbatim stdout:
```
{
    "streams": [
        {
            "width": 1080,
            "height": 1080,
            "r_frame_rate": "30/1",
            "nb_read_frames": "1230",
            "side_data_list": [
                {

                }
            ]
        }
    ],
    "format": {
        "duration": "41.045333"
    }
}
```

#### B3 audio recheck
RC=0; wall=0.044008s; stdout bytes=18; stderr bytes=0. Verbatim stdout:
```
aac,audio,48000,2
```

- B3 earlier probe invocations used tee without pipefail; their individual ffprobe RC/durations were not captured. Rechecks above provide measured individual RC/durations.
- This evidence update wall=1.933483s; MP4 bytes=12283370.
- B4c v6 snapshot sequence (retry with absolute cwd): RC=0, 1:51.99s wall (12:41:47→12:43:39), pattern `element-%04d.png`, V6_FILES=1230. First attempt RC=127 (cwd=repo root, binary not found, 0.001s) — logged, no code changed.
- B4d final counts: lossless/v7=1230 png (names exact element-0000..element-1229, set-verified), lossless/v6=1230 png.
- B5 stills: 37 copied from lossless/v7 → v7_stills/f<N:04d>.png (MISS_FLAG=0); byte-integrity SHA256 source-vs-copy 37/37 identical.
- B6 cleanup: `rm src/__turn7_v6snap.tsx src/__turn7_v6entry.tsx` → RM_RC=0; follow-up ls reports both ENOENT; `git status --short -- src/` output above (empty = clean). Nothing else in src/ touched; Root.tsx, public/, audio untouched.
- TURN7B total wall: 12:28:19→12:43:39 renders + verify/cleanup to ~12:45. Mechanical only — no TSX edits, no .png reads (image verification via SHA256/PIL-free byte compare only).
- Verbatim `git status --short -- src/ | head` after cleanup (proof no `__turn7_*` temp files remain; the M/?? entries below pre-date TURN7B — local kids-story work, none touched by this session):
```
 M src/Root.tsx
 M src/rigs/KawaiiRabbit.tsx
?? src/CapsuleTurnaroundDemo.tsx
?? src/KidsDepthDemo.tsx
?? src/KidsRaceRigDemo.tsx
?? src/KidsS5BackDemo.tsx
?? src/KidsStoryEp1AI.tsx
?? src/KidsStoryEp1Remake.tsx
?? src/KidsStoryEp1RemakeDemo.tsx
?? src/KidsStoryEp1V2.tsx
```

## TURN7C — Hermes independent QC (PASS 12/12) + deliver

QC script: turn7/lead_qc_v7.py -> turn7/qc_lead_v7.json (OVERALL PASS).

| Gate | Số liệu |
|---|---|
| E assets/audio/timeline/cues | 392 file SHA256 = baseline, 0 changed/missing |
| E code sections | TIER+openAmt/Talking/S3b/tail/cam>=17.79 string-identical v6 |
| I ffprobe | 1230f 1080x1080 30/1 41.045333s aac 48k stereo, 12,283,370 B |
| I audio PCM | sha256 v6 == v7 (51ab03e2...) — bit-identical |
| D1 still scope diff | 14/14 frames ngoài 2 cửa nz=0 (f100..f1150 gồm S5 f730/750/780/812/845/886) |
| D2 sequence pair | 31 frame S5 noise (offset (0,0), mean ~1.0) — sequence-raster, still-grade D1 là gate chuẩn |
| A w1 rabbit 1.22 | mép lông trắng 215 -> 167, lý thuyết 430+1.22*(215-430)=167.7, err 0.7px |
| B w1 turtle NET 1.0 | SAD offset (0,0); mai solid interior mean 0.25 / p95 0.67 (~19.9k px) |
| C w2 identity | mép thỏ v7 215 == pre-cut 214 (<=2px); v6 zoom 150 |
| C2 w2 fix real | v6 150 vs v7 215 = 65px — zoom 1.18 đã bỏ |
| F camera static | sky diff 0.0 trong shot (331-361, 463-478, 478-499) |
| H edges | 0.0 black fraction 7 frame probe |
| G banner @20s | red px 0/0/0 @f585/600/615 (giữ nguyên fix turn6) |

Chẩn đoán giữa chừng (giữ làm bài học): 31 frame S5 lệch nhau giữa 2 sequence
render là NONDETERMINISM chế độ --sequence (seq-v6 tự lệch still-v6 24611px @f780
trong khi still-v6 == still-v7 = 0 ở mọi frame) — lead_seq_crosscheck.json,
lead_diag_s5offset.py (offset (0,0)). Gate chuẩn scope-diff = remotion still.

Vision verify: w1 thỏ close-up rõ, rùa như cũ, nhìn nhau, miệng hé MID-cue;
w2 hết zoom, khung rộng, nhìn nhau, miệng rùa hé, không defect
(board_v7_11s.jpg / board_v7_17s.jpg; trước/sau từng cặp).

Deliver: Telegram DM video v7 + 2 evidence board — awaiting_human.
