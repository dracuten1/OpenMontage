"""Final-only QC: probe/decode, loudness and 3 frame pairs; no TTS/ASR/source changes."""
import hashlib
import json
import math
import re
import subprocess
import sys
from datetime import datetime, timezone
from fractions import Fraction
from pathlib import Path

P = Path('/Users/tuyennguyen/project/OpenMontage/projects/chu-dong-tu')
R = P / 'renders'
FILES = {
    'approved_draft': R / 's2e03_draft_hud_720p_50mb.mp4',
    'final_1080p': R / 's2e03_final_1080p.mp4',
    'final_720p': R / 's2e03_final_720p.mp4',
}
OUT = P / 'qc/final_frames'
OUT.mkdir(parents=True, exist_ok=True)

def run(args):
    return subprocess.run(args, capture_output=True, text=True, check=True)

def sha256(path):
    h = hashlib.sha256()
    with path.open('rb') as f:
        for chunk in iter(lambda: f.read(4 * 1024 * 1024), b''):
            h.update(chunk)
    return h.hexdigest()

def probe(path):
    d = json.loads(run(['ffprobe', '-v', 'error', '-count_frames', '-show_streams', '-show_format', '-of', 'json', str(path)]).stdout)
    video = next(s for s in d['streams'] if s['codec_type'] == 'video')
    audio = next(s for s in d['streams'] if s['codec_type'] == 'audio')
    return {
        'path': str(path), 'sha256': sha256(path), 'duration_seconds': float(d['format']['duration']),
        'size_bytes': path.stat().st_size, 'resolution': [video['width'], video['height']],
        'fps': float(Fraction(video['avg_frame_rate'])), 'fps_fraction': video['avg_frame_rate'],
        'frames': int(video['nb_read_frames']), 'declared_frames': int(video['nb_frames']),
        'video_duration_seconds': float(video['duration']), 'codec': video['codec_name'],
        'audio_codec': audio['codec_name'], 'audio_sample_rate': int(audio['sample_rate']),
        'audio_channels': audio['channels'], 'audio_bitrate': int(audio.get('bit_rate', 0)),
    }

def loudness(path, name):
    # Analysis only. Original audio is never rewritten or normalized here.
    o = run(['ffmpeg', '-hide_banner', '-nostdin', '-i', str(path), '-map', '0:a:0', '-vn', '-sn', '-dn',
             '-af', 'loudnorm=I=-16:TP=-1.5:LRA=11:print_format=json', '-f', 'null', '-'])
    (P / f'qc/final_loudness_{name}.log').write_text(o.stderr)
    blocks = re.findall(r'\{\s*"input_i"[\s\S]*?\}', o.stderr)
    if not blocks:
        raise RuntimeError(f'No loudnorm measurement for {path}')
    metrics = json.loads(blocks[-1])
    measurement = {k: float(metrics[k]) for k in ['input_i', 'input_tp', 'input_lra', 'input_thresh']}
    if not all(math.isfinite(v) for v in measurement.values()):
        raise RuntimeError(f'Non-finite loudness: {measurement}')
    return measurement

rep = {'version': '1.0', 'episode': 'S2E03 Chử Đồng Tử', 'session_id': '20261019_020840_82fb79',
       'checked_at': datetime.now(timezone.utc).isoformat(), 'composition': 'ChuDongTuDraft',
       'final_props': {'draftHud': False, 'withMusic': True}, 'no_asr_or_anchor_rerun': True,
       'files': {}, 'checks': {}, 'vision': {'status': 'pending', 'points': []}}
for name, path in FILES.items():
    if not path.is_file():
        raise FileNotFoundError(str(path))
    rep['files'][name] = probe(path)
    rep['files'][name]['loudness'] = loudness(path, name)
    print(name, json.dumps(rep['files'][name], ensure_ascii=False), flush=True)
base_lufs = rep['files']['approved_draft']['loudness']['input_i']
for name, dimensions in [('final_1080p', [1920, 1080]), ('final_720p', [1280, 720])]:
    d = rep['files'][name]
    delta = abs(d['loudness']['input_i'] - base_lufs)
    d['loudness_delta_lu_vs_approved_draft'] = round(delta, 4)
    rep['checks'][name] = {
        'duration_within_0_1s': abs(d['duration_seconds'] - 869.312) <= 0.1,
        'frames_26078': d['frames'] == 26078 and d['declared_frames'] == 26078,
        'fps_30': d['fps'] == 30, 'resolution_correct': d['resolution'] == dimensions,
        'has_audio': d['audio_codec'] == 'aac', 'loudness_delta_le_0_5lu': delta <= 0.5,
    }
rep['checks']['preview_le_50MB'] = rep['files']['final_720p']['size_bytes'] <= 50_000_000

from PIL import Image, ImageChops, ImageDraw, ImageFont, ImageStat
try:
    font = ImageFont.truetype('/System/Library/Fonts/Menlo.ttc', 20)
except OSError:
    font = ImageFont.load_default()
for tag, seconds in [('early', 30), ('mid', 435), ('late', 860)]:
    imgs = []
    for name, path in FILES.items():
        out = OUT / f'{tag}_{name}.png'
        run(['ffmpeg', '-hide_banner', '-nostdin', '-v', 'error', '-y', '-ss', str(seconds), '-i', str(path),
             '-vf', 'scale=1280:720:flags=lanczos', '-frames:v', '1', str(out)])
        imgs.append((name, out, Image.open(out).convert('RGB')))
    sheet = Image.new('RGB', (1280, 3 * 755), '#151515')
    draw = ImageDraw.Draw(sheet)
    for i, (name, out, im) in enumerate(imgs):
        draw.text((12, i * 755 + 6), f'{seconds}s / f{seconds * 30} - {name}', fill='#ffffff', font=font)
        sheet.paste(im, (0, i * 755 + 35))
    contact = OUT / f'{tag}_compare.png'
    sheet.save(contact)
    # Content-only metrics exclude the HUD band at the bottom of the approved draft.
    content = (0, 0, 1280, 640)
    diffs = {}
    for name, out, im in imgs[1:]:
        diff = ImageChops.difference(imgs[0][2].crop(content), im.crop(content))
        diffs[name] = {'mean_absolute_rgb_0_255': round(sum(ImageStat.Stat(diff).mean) / 3, 4)}
    rep['vision']['points'].append({'tag': tag, 'seconds': seconds, 'frame': seconds * 30,
                                  'compare_path': str(contact), 'frame_paths': {n: str(o) for n, o, _ in imgs},
                                  'content_diff_excluding_hud_band': diffs})
rep['technical_pass'] = all(all(x.values()) if isinstance(x, dict) else x for x in rep['checks'].values())
rep['status'] = 'pending_vision' if rep['technical_pass'] else 'fail'
(P / 'qc/final_qc.json').write_text(json.dumps(rep, ensure_ascii=False, indent=2))
print('TECHNICAL_PASS', rep['technical_pass'], 'VISION_PENDING', flush=True)
if not rep['technical_pass']:
    sys.exit(1)
