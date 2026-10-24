#!/usr/bin/env python
"""STEP4 france-riots-20261023: public scene_timing.json (fps30).

duration_frames = ceil((voice_seconds + 0.8) * 30); scenes contiguous
(start cumulative, end_frame inclusive = start + dur - 1, end_seconds =
(end_frame + 1)/30). total frames = last end_frame + 1.
"""
import sys
sys.dont_write_bytecode = True
from pathlib import Path
import json
import math

ROOT = Path('/Users/tuyennguyen/project/OpenMontage')
PROJ = ROOT / 'projects/france-riots-20261023'
PUBLIC = ROOT / 'remotion-composer/public/france-riots-20261023'
FPS = 30
TAIL_PAD = 0.8

ORDER = [f's{i:02d}' for i in range(1, 14)]
SECTION = {f's{i:02d}': f'S{i}' for i in range(1, 14)}


def write(path, data):
    path.parent.mkdir(parents=True, exist_ok=True)
    tmp = path.with_suffix(path.suffix + '.tmp')
    tmp.write_text(json.dumps(data, ensure_ascii=False, indent=2,
                              allow_nan=False) + '\n', encoding='utf-8')
    tmp.replace(path)


def main():
    batch = json.loads((PROJ / 'audio/tts_batch_durations.json').read_text(
        encoding='utf-8'))
    scenes, start_frame = [], 0
    for sid in ORDER:
        voice = batch[sid]['voice_seconds']
        dur_frames = math.ceil((voice + TAIL_PAD) * FPS)
        start_seconds = start_frame / FPS
        end_frame = start_frame + dur_frames - 1
        end_seconds = (end_frame + 1) / FPS
        scenes.append({
            'scene_id': sid, 'section_id': SECTION[sid],
            'duration_frames': dur_frames,
            'start_frame': start_frame, 'end_frame': end_frame,
            'start_seconds': round(start_seconds, 6),
            'end_seconds': round(end_seconds, 6),
            'duration_seconds': round(end_seconds - start_seconds, 6),
            'voice_seconds': voice})
        start_frame += dur_frames
    total_frames = scenes[-1]['end_frame'] + 1
    write(PUBLIC / 'scene_timing.json', {
        'fps': FPS, 'tail_pad_seconds': TAIL_PAD,
        'total_frames': total_frames,
        'total_duration_seconds': round(total_frames / FPS, 6),
        'scenes': scenes})
    print(json.dumps({'total_frames': total_frames,
                      'total_seconds': round(total_frames / FPS, 6),
                      'scenes': [{k: s[k] for k in ('scene_id', 'section_id',
                                                    'duration_frames',
                                                    'voice_seconds',
                                                    'end_seconds')}
                                 for s in scenes]}, ensure_ascii=False))


if __name__ == '__main__':
    main()
