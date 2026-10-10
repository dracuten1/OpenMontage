"""Build mouth/eye overlay patches from the frozen scene + vision bbox coords."""
import json
from PIL import Image, ImageDraw

SCENE = "assets/adv_scene.png"
img = Image.open(SCENE).convert("RGBA")
W, H = img.size
meta = json.load(open("assets/adv_meta.json"))  # vision bboxes
m = meta["mouth"]; e = meta["eyes"]

def crop(b, pad=8):
    return img.crop((b[0]-pad, b[1]-pad, b[2]+pad, b[3]+pad))

# --- sample colors from the actual image (keeps patch style native) ---
def avg(box):
    px = img.crop(box).resize((1,1), Image.LANCZOS).getpixel((0,0))[:3]
    return px
skin    = avg((e[0], e[1]-40, e[2], e[1]-20))          # forehead
lipline = avg((m[0], (m[1]+m[3])//2, m[2], (m[1]+m[3])//2+2))  # mouth center line

def darken(c, f):  return tuple(int(v*f) for v in c)
mouth_fill = darken(lipline, 0.45)
mouth_line = darken(lipline, 0.25)

mw, mh = m[2]-m[0], m[3]-m[1]
cx, cy = (m[0]+m[2])//2, (m[1]+m[3])//2

def mouth_open(tier):
    """tier: 0 closed,1 small,2 mid,3 big -> ellipse over closed mouth"""
    p = crop(m, 10).copy()
    d = ImageDraw.Draw(p)
    pw, ph = p.size
    # ellipse size relative to mouth bbox
    rx = {1:0.30, 2:0.38, 3:0.44}[tier] * pw
    ry = {1:0.18, 2:0.30, 3:0.42}[tier] * ph * (1.8 if tier==3 else 1.2)
    x0,y0,x1,y1 = pw/2-rx, ph/2-ry*0.4, pw/2+rx, ph/2+ry*0.6  # jaw opens downward
    d.ellipse((x0,y0,x1,y1), fill=mouth_fill+(255,), outline=mouth_line+(255,), width=3)
    if tier == 3:  # teeth hint (flat style): light band top
        d.ellipse((x0+4, y0+2, x1-4, y0+(y1-y0)*0.38), fill=(245,240,230,255))
        d.ellipse((x0, y0, x1, y1), outline=mouth_line+(255,), width=3)
    return p

crop(m, 10).save("assets/patches/mouth_0.png")
for t, name in [(1,"mouth_1"),(2,"mouth_2"),(3,"mouth_3")]:
    mouth_open(t).save(f"assets/patches/{name}.png")

# --- closed eyes: skin fill + curved lash lines ---
p = crop(e, 8).copy()
d = ImageDraw.Draw(p)
pw, ph = p.size
d.rectangle((0, 6, pw, ph), fill=skin+(255,))   # skin over eyeballs (keep brows: skip top 6px)
lash = darken(skin, 0.25)
for ex in (0.27, 0.73):  # two curved closed lids
    exx = ex*pw
    d.arc((exx-pw*0.14, ph*0.35, exx+pw*0.14, ph*0.75), 20, 160, fill=lash+(255,), width=5)
p.save("assets/patches/eyes_closed.png")

json.dump({"canvas":[W,H], "mouth_bbox":m, "eyes_bbox":e,
           "patch_pad":10, "patch_pad_eyes":8,
           "skin":skin, "lipline":lipline},
          open("assets/patches/patches.json","w"), indent=1)
print("patches:", {f: Image.open('assets/patches/'+f).size for f in
      ['mouth_0.png','mouth_1.png','mouth_2.png','mouth_3.png','eyes_closed.png']})
