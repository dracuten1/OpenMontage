#!/usr/bin/env python3
"""Independent v7 QC: exact encoder-free scope diff + measured scale gates + FIX5 regression."""
import hashlib
import json
import re
import subprocess
from pathlib import Path
import numpy as np
from PIL import Image

R = Path('/Users/tuyennguyen/project/OpenMontage')
D = R/'character-performer/kids/turn7'
V6 = R/'remotion-composer/out/kids_ep1_remake_v6.mp4'
V7 = R/'remotion-composer/out/kids_ep1_remake_v7.mp4'
S = R/'remotion-composer/src/KidsStoryEp1Remake.tsx'
results = {'version':'v7','gates':{}}
G = results['gates']

def run(args):
    p = subprocess.run(args, capture_output=True, text=True)
    if p.returncode:
        raise RuntimeError(f'{args}: {p.stderr[-2000:]}')
    return p.stdout

def sha(p): return hashlib.sha256(Path(p).read_bytes()).hexdigest()
def arr(p): return np.asarray(Image.open(p).convert('RGB'))
def gate(name, passed, **data):
    clean = json.loads(json.dumps(data, default=int))
    G[name] = {'pass': bool(passed), **clean}
    print(('PASS ' if passed else 'FAIL '), name, json.dumps(clean, ensure_ascii=False)[:400])

def seq(folder, f):
    return folder/f'element-{f:04d}.png'

# ---- E. assets / audio / timeline / cues bit-identical; code sections ----
manifest = json.loads((D/'baseline_hashes.json').read_text())
changed = []; missing = []
for rel, digest in manifest.items():
    if rel == 'remotion-composer/src/KidsStoryEp1Remake.tsx':
        continue
    p = R/rel
    if not p.exists():
        missing.append(rel)
    elif sha(p) != digest:
        changed.append(rel)
gate('E_fix5_assets_audio_timeline_cues_bit_identical', not changed and not missing,
     files_checked=len(manifest)-1, changed=changed, missing=missing)

source = S.read_text(); baseline = (D/'KidsStoryEp1Remake.v6.tsx').read_text()
def section(text, start, end=None):
    body = text.split(start, 1)[1]
    return body.split(end, 1)[0] if end else body
sec = {
 'mouth_tier': section(source, 'const TIER:', '// ---- sprite registration') == section(baseline, 'const TIER:', '// ---- sprite registration'),
 'talking': section(source, 'const Talking:', '// ---- zZz') == section(baseline, 'const Talking:', '// ---- zZz'),
 's3b': section(source, '      {/* S3 (bg3_duel)', '      {/* S4 START') == section(baseline, '      {/* S3 (bg3_duel)', '      {/* S4 START'),
 'tail': source.split('      {/* S4 START', 1)[1] == baseline.split('      {/* S4 START', 1)[1],
 'camera_ge_17.79': section(source, 'if (t >= 33.9)', 'if (t >= 17.79)') == section(baseline, 'if (t >= 33.9)', 'if (t >= 17.79)'),
}
gate('E_mouth70ms_s3b_five_scenes_tail_code_identical', all(sec.values()), sections=sec, mouth_fade_ms=70, patch_only=True)

# ---- I. ffprobe ----
meta = json.loads(run(['ffprobe','-v','error','-count_frames','-show_streams','-show_format','-of','json',str(V7)]))
v = next(s for s in meta['streams'] if s['codec_type']=='video'); a = next(s for s in meta['streams'] if s['codec_type']=='audio')
probe = {'frames': int(v['nb_read_frames']), 'w': v['width'], 'h': v['height'], 'fps': v['r_frame_rate'],
         'dur': float(meta['format']['duration']), 'vcodec': v['codec_name'], 'acodec': a['codec_name'],
         'asr': a['sample_rate'], 'ach': a['channels'], 'bytes': V7.stat().st_size}
gate('I_ffprobe', probe['frames']==1230 and probe['w']==1080 and probe['h']==1080 and probe['fps']=='30/1'
     and abs(probe['dur']-41.045333)<.01 and probe['ach']==2, **probe)
audio = {tag: run(['ffmpeg','-v','error','-i',str(p),'-map','0:a:0','-c:a','pcm_s16le','-f','hash','-hash','sha256','-']).strip().split('=')[-1]
         for tag, p in [('v6',V6),('v7',V7)]}
gate('I_audio_pcm_bit_identical', audio['v6']==audio['v7'], pcm_sha=audio)

# ---- D. scope diff ----
# D1 (SSOT, strict): still-CLI pairs v6snap-vs-v7 — must be bit-identical
#     OUTSIDE the 2 windows (grammar of turn5/turn6 QC; measured in
#     lead_still_diff.py — sequence mode has per-run raster noise on the S5
#     turtle, sealed by lead_seq_crosscheck.py: seq-v6 deviates from
#     still-v6 while still-v6 == still-v7 everywhere).
still = json.loads((D/'still_diff.json').read_text())
outside_still = {int(f): r['nz'] for f, r in still.items() if not (327 <= int(f) < 372 or 459 <= int(f) < 534)}
gate('D1_still_scope_diff_outside_windows_zero', all(v == 0 for v in outside_still.values()),
     frames=sorted(outside_still), nz=outside_still, note='remotion still per-frame, encoder-free')

# D2 (informational): sequence-mode pair — position-identical (SAD offset
#     (0,0) proven in lead_diag_s5offset.py), value noise <= ~1 mean abs on
#     the S5 turtle only; NOT a code change (see D1 + crosscheck).
V6S = D/'lossless/v6'; V7S = D/'lossless/v7'
outside_bad = []; inside_changed = 0
in_win = lambda f: (327 <= f < 372) or (459 <= f < 534)
for f in range(1230):
    d = np.abs(arr(seq(V6S, f)).astype(np.int16) - arr(seq(V7S, f)).astype(np.int16))
    nz = int(np.count_nonzero(d))
    if in_win(f):
        inside_changed += nz > 0
    elif nz:
        outside_bad.append({'frame': f, 'changed_px': nz})
seq_noise_frames = [b['frame'] for b in outside_bad]
all_s5 = all(22.79*30 <= f < 29.55*30 for f in seq_noise_frames)
gate('D2_sequence_pair_report', all_s5,
     seq_frames_with_noise=len(outside_bad), max_px=max([b['changed_px'] for b in outside_bad], default=0),
     all_inside_s5_walk=all_s5, inside_frames_changed=inside_changed,
     note='sequence raster noise, offset (0,0), still-grade D1 is the pass gate')

# ---- measured scale gates ----
# Rabbit white-fur bbox (calibrated): window-1 left edge must match camera
# 1.22 @430,800 EXACTLY: x' = 430 + 1.22*(x-430).
def fur_left(im, box):
    x0, y0, x1, y1 = box
    z = im[y0:y1, x0:x1].astype(float)
    r, g, b = z[..., 0], z[..., 1], z[..., 2]
    m = (r > 205) & (g > 205) & (b > 200) & (np.abs(r-g) < 28)
    cols = np.where(m.sum(axis=0) > 8)[0]
    return int(cols[0])+x0 if len(cols) else None

RB = (150, 540, 640, 930)
def sad_offset(im_a, im_b, box, pad=18):
    x0, y0, x1, y1 = box
    tpl = im_b[y0+4:y1-4, x0+4:x1-4].astype(np.int16)
    best = (1e18, None)
    for dy in range(-pad, pad+1):
        for dx in range(-pad, pad+1):
            yy0, yy1, xx0, xx1 = y0+4+dy, y1-4+dy, x0+4+dx, x1-4+dx
            if yy0 < 0 or xx0 < 0 or yy1 > im_a.shape[0] or xx1 > im_a.shape[1]:
                continue
            s = float(np.abs(im_a[yy0:yy1, xx0:xx1].astype(np.int16) - tpl).mean())
            if s < best[0]:
                best = (s, (dx, dy))
    return best

def rgb(p): return np.asarray(Image.open(p).convert('RGB'))

# A: window-1 rabbit zoomed by exactly 1.22 about (430,800)
A = {}
for f in [331, 361]:
    x6 = fur_left(rgb(seq(V6S, f)), RB); x7 = fur_left(rgb(seq(V7S, f)), RB)
    theory = 430 + 1.22*(x6-430)
    A[f] = {'v6': x6, 'v7': x7, 'theory': round(theory, 1), 'err_px': round(abs(x7-theory), 2)}
gate('A_window1_rabbit_close_1.22_exact', all(a['err_px'] <= 2 for a in A.values()),
     measured=A, transform='x7 = 430 + 1.22*(x6-430)')

# B: window-1 turtle NET identity — SAD offset (0,0) + solid-dome pixel diff
TT = (600, 600, 880, 880)
def erode(mask, it=2):
    m = mask.copy()
    for _ in range(it):
        m = m & np.roll(m, 1, 0) & np.roll(m, -1, 0) & np.roll(m, 1, 1) & np.roll(m, -1, 1)
    return m
DOME = (560, 640, 870, 790)
def dome_mask(im, box=DOME):
    x0, y0, x1, y1 = box
    z = im[y0:y1, x0:x1].astype(float)
    r, g, b = z[..., 0], z[..., 1], z[..., 2]
    gold = (r > 185) & (g > 140) & (b < 140) & (r > b*1.5) & (g < r*1.02)
    return erode(gold, 3)
B = {}
for f in [327, 331, 361]:
    s, off = sad_offset(rgb(seq(V6S, f)), rgb(seq(V7S, f)), TT)
    a = rgb(seq(V6S, f)).astype(np.int16); b7 = rgb(seq(V7S, f)).astype(np.int16)
    m = dome_mask(b7)
    x0, y0 = DOME[:2]; h, w = m.shape
    dm = np.abs(a[y0:y0+h, x0:x0+w] - b7[y0:y0+h, x0:x0+w]).mean(axis=2)[m]
    B[f] = {'offset': off, 'sad': round(s, 2), 'dome_px': int(m.sum()),
            'dome_mean': round(float(dm.mean()), 3), 'dome_p95': round(float(np.percentile(dm, 95)), 2)}
gate('B_window1_turtle_net_identity',
     all(b['offset'] == (0, 0) and b['dome_mean'] < 1.0 for b in B.values()),
     measured=B, note='offset (0,0) + solid-dome interior diff; gaps/edges excluded (bg zooms there by design)')

# C: window-2 identity camera — v7 rabbit bbox equals pre-window f450 bbox
r450 = fur_left(rgb(seq(V7S, 450)), RB)
C = {}
for f in [463, 486, 508]:
    x7 = fur_left(rgb(seq(V7S, f)), RB)
    x6 = fur_left(rgb(seq(V6S, f)), RB)
    C[f] = {'v7': x7, 'pre_450': r450, 'v6_zoomed': x6, 'v7_eq_pre': abs(x7-r450) <= 2}
gate('C_window2_identity_camera', all(c['v7_eq_pre'] for c in C.values()), measured=C)

# C2: v6 HAD 1.18 zoom in window 2 (rabbit bbox differs) and v7 does not
C2 = {f: {'v6': c['v6_zoomed'], 'v7': c['v7'], 'diff_v6_v7': abs(c['v6_zoomed']-c['v7'])} for f, c in C.items()}
gate('C2_window2_zoom_removed_vs_v6', all(c['diff_v6_v7'] > 20 for c in C2.values()), measured=C2,
     note='v6 zoomed rabbit edge vs v7 identity edge, >20px apart')

# ---- F. camera static within shots (sky patch; avoid bg crossfades 3.65-4.15/16.9-17.4) ----
sky = {}
for lo, hi in [(331, 361), (463, 478), (478, 499)]:
    sky[f'{lo}->{hi}'] = float(np.abs(arr(seq(V7S, lo))[:90, 60:260].astype(float)-arr(seq(V7S, hi))[:90, 60:260].astype(float)).mean())
gate('F_camera_static_within_shots', all(v == 0 for v in sky.values()), sky_mean_diff=sky)

# ---- H. no black raster edges ----
edges = {}
for f in [327, 355, 371, 459, 463, 499, 533]:
    z = arr(seq(V7S, f))
    per = np.concatenate([z[:3].reshape(-1,3), z[-3:].reshape(-1,3), z[:,:3].reshape(-1,3), z[:,-3:].reshape(-1,3)])
    edges[str(f)] = float((per.max(axis=1) < 8).mean())
gate('H_no_black_edges', max(edges.values()) < .01, black_frac=edges)

# ---- G. banner still gone @20s (v7 mp4) ----
banner = {}
for f in [585, 600, 615]:
    out = D/f'proof/v7_f{f:04d}.png'
    out.parent.mkdir(exist_ok=True)
    run(['ffmpeg','-y','-v','error','-i',str(V7),'-vf',f'select=eq(n\\,{f})','-frames:v','1',str(out)])
    z = arr(out)[180:268, 240:850].astype(float)
    banner[str(f)] = int(((z[...,0]>120)&(z[...,0]>z[...,1]*1.55)&(z[...,0]>z[...,2]*1.55)).sum())
gate('G_banner_removed_20s_preserved', max(banner.values()) < 2000, red_px=banner)

results['pass'] = all(g['pass'] for g in G.values())
(D/'qc_lead_v7.json').write_text(json.dumps(results, indent=2, ensure_ascii=False))
print('OVERALL:', 'PASS' if results['pass'] else 'FAIL')
