#!/usr/bin/env python3
"""Send S2E04 deliverables to owner Telegram DM 615761638.
- Uses BOT token read from agent-skills tg-send.py on disk (never logged).
- sendMessage WITHOUT parse_mode (memory: '- ' bullets break Markdown parse).
- sendDocument for video (Bot API caps 50MB).
Verifies ok=True + message_id for EVERY send; prints message ids.
"""
import json, re, sys, urllib.request, pathlib

TG = pathlib.Path("/Users/tuyennguyen/project/agent-skills/productivity/telegram-send-file/scripts/tg-send.py")
src = TG.read_text(encoding="utf-8")
m = re.search(r'BOT_TOKEN\s*=\s*"([^"]+)"', src)
assert m, "BOT_TOKEN not found in tg-send.py"
TOKEN = m.group(1)
CHAT = 615761638
API = f"https://api.telegram.org/bot{TOKEN}"

def post(method, payload=None, files=None):
    if files:
        import uuid
        b = uuid.uuid4().hex
        body, headers = [], {}
        for k, v in (payload or {}).items():
            body.append(f'--{b}\r\nContent-Disposition: form-data; name="{k}"\r\n\r\n{v}\r\n'.encode())
        for name, fname, data, ctype in files:
            body.append(f'--{b}\r\nContent-Disposition: form-data; name="{name}"; filename="{fname}"\r\nContent-Type: {ctype}\r\n\r\n'.encode())
            body.append(data)
            body.append(f"\r\n--{b}--\r\n".encode())
        data = b"".join(body)
        headers["Content-Type"] = f"multipart/form-data; boundary={b}"
        req = urllib.request.Request(f"{API}/{method}", data=data, headers=headers)
    else:
        data = json.dumps(payload).encode()
        req = urllib.request.Request(f"{API}/{method}", data=data, headers={"Content-Type": "application/json"})
    with urllib.request.urlopen(req, timeout=600) as r:
        return json.loads(r.read().decode())

def must_ok(label, resp):
    ok = resp.get("ok") is True
    mid = resp.get("result", {}).get("message_id")
    print(f"{label}: ok={ok} message_id={mid}")
    if not ok:
        print(json.dumps(resp, ensure_ascii=False)[:400])
        sys.exit(1)
    return mid

def send_text(text):
    return must_ok("description", post("sendMessage", {"chat_id": CHAT, "text": text}))

def send_video(path, caption=None):
    p = pathlib.Path(path)
    payload = {"chat_id": CHAT}
    if caption:
        payload["caption"] = caption[:1000]
    with open(p, "rb") as f:
        data = f.read()
    return must_ok(f"video {p.name} ({len(data)//1024//1024}MB)", post("sendDocument", payload, files=[("document", p.name, data, "video/mp4")]))

def send_file(path):
    p = pathlib.Path(path)
    with open(p, "rb") as f:
        data = f.read()
    return must_ok(f"file {p.name}", post("sendDocument", {"chat_id": CHAT}, files=[("document", p.name, data, "application/octet-stream")]))

if __name__ == "__main__":
    mode = sys.argv[1]
    if mode == "text":
        send_text(pathlib.Path(sys.argv[2]).read_text(encoding="utf-8"))
    elif mode == "video":
        send_video(sys.argv[2], sys.argv[3] if len(sys.argv) > 3 else None)
    elif mode == "file":
        send_file(sys.argv[2])
