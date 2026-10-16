#!/usr/bin/env python3
"""Deliver v7 + evidence boards to Telegram DM (awaiting_human)."""
import json
import re
import sys
import urllib.request
import uuid
from pathlib import Path

R = Path('/Users/tuyennguyen/project/OpenMontage')
D = R/'character-performer/kids/turn7'
V7 = R/'remotion-composer/out/kids_ep1_remake_v7.mp4'

TOKEN = None
for env in [Path('/Users/tuyennguyen/project/hermes-agent/.env'), Path.home()/'.hermes/.env']:
    if env.exists():
        m = re.search(r'TELEGRAM_BOT_TOKEN\s*=\s*["\']?([\w:.-]+)', env.read_text())
        if m:
            TOKEN = m.group(1)
            break
if not TOKEN:
    sys.exit('TELEGRAM_BOT_TOKEN not found')
CHAT = None
cd = Path.home()/'.hermes/channel_directory.json'
if cd.exists():
    data = json.loads(cd.read_text())
    for v in (data if isinstance(data, list) else data.get('channels', data.get('entries', []))):
        if '615761638' in json.dumps(v):
            CHAT = v.get('chat_id') or v.get('id') or '615761638'
if not CHAT:
    CHAT = '615761638'

API = f'https://api.telegram.org/bot{TOKEN}'

def post(method, fields, file_field=None, file_path=None):
    b = uuid.uuid4().hex
    body = []
    for k, v in fields.items():
        body.append(f'--{b}\r\nContent-Disposition: form-data; name="{k}"\r\n\r\n{v}\r\n'.encode())
    if file_field:
        body.append(f'--{b}\r\nContent-Disposition: form-data; name="{file_field}"; filename="{Path(file_path).name}"\r\nContent-Type: application/octet-stream\r\n\r\n'.encode())
        body.append(Path(file_path).read_bytes() + b'\r\n')
    body.append(f'--{b}--\r\n'.encode())
    req = urllib.request.Request(f'{API}/{method}', data=b''.join(body),
                                 headers={'Content-Type': f'multipart/form-data; boundary={b}'})
    with urllib.request.urlopen(req, timeout=180) as r:
        return json.loads(r.read())

qc = json.loads((D/'qc_lead_v7.json').read_text())
msg = [
    '🎞 Ep.01 remake — v7 (feedback v6: nhìn nhau khi thoại + không phóng to rùa)',
    '',
    '1) Eye contact 2 cửa thoại Scene 1: probe trước/sau xác nhận thỏ nhìn phải ↔ rùa nhìn trái ở cả 2 cửa (cặp profile fix9 đã đúng hướng — giữ nguyên, không lật).',
    '2) Camera: close-up THỎ 1.22x @10.9-12.4s (đo err 0.7px); rùa counter-scale NET 1.0 — không bị phóng to (offset (0,0), mai diff 0.25). Zoom RÙA 1.18x @15.3-17.8s → camera 1.0 (khung rộng trở lại).',
    f"3) QC độc lập 12/12 PASS: ngoài 2 cửa sửa diff 0.0000 (still 14/14 frame, gồm S5); audio PCM + timeline + cues + 392 assets bit-identical; MID-cue miệng khớp (code mouth identity).",
    '4) ffprobe: 1230f · 41.045s · 1080² · 30fps · aac stereo · 12.28MB.',
    '',
    '⏳ awaiting_human — veto cứ nói, lặp lại đúng 2 cửa này.',
]
res = post('sendVideo', {'chat_id': CHAT, 'caption': '\n'.join(msg)}, 'video', V7)
print('video message_id', res['result']['message_id'])
for board in ['board_v7_11s.jpg', 'board_v7_17s.jpg']:
    res = post('sendPhoto', {'chat_id': CHAT, 'caption': f'Evidence board: {board}'}, 'photo', D/board)
    print(board, 'message_id', res['result']['message_id'])
