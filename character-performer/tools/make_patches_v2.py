"""v2 patches: crop mouth/eye regions from img2img variants — identical palette, no drawn oval."""
import json
from PIL import Image, ImageDraw, ImageFilter

base = Image.open("assets/adv_scene.png").convert("RGBA")
meta = json.load(open("assets/adv_meta.json"))
m = meta["mouth"]; e = meta["eyes"]
# img2img output may be resized (1024x1024 kept); verify + auto-align via diff search
var = {k: Image.open(f"assets/{k}.png").convert("RGBA") for k in ["v_mouthA","v_mouthB","v_mouthD","v_eyes"]}
for k,v in var.items():
    if v.size != base.size: var[k] = v.resize(base.size, Image.LANCZOS)

def align_crop(v, box, pad=18):
    """crop region from variant. img2img shifts a few px — find best offset by
    matching the surrounding band (ring around the box) between base and variant."""
    bx0,by0,bx1,by1 = box
    r0,r1,r2,r3 = bx0-pad*3,by0-pad*3,bx1+pad*3,by1+pad*3  # ring for matching
    best, boff = 1e18, (0,0)
    B = base.crop((r0,r1,r2,r3)).convert("RGB")
    for dy in range(-8,9,2):
        for dx in range(-8,9,2):
            V = v.crop((r0+dx,r1+dy,r2+dx,r3+dy)).convert("RGB")
            d = sum(abs(a-b) for pb,pv in zip(B.getdata(), V.getdata()) for a,b in zip(pb,pv))
            if d < best: best, boff = d, (dx,dy)
    dx,dy = boff
    return v.crop((bx0-pad+dx, by0-pad+dy, bx1+pad+dx, by1+pad+dy))

# mouth patches: tier0 = closed (from base), 1=v_mouthD, 2=v_mouthB, 3=v_mouthA
base.crop((m[0]-18,m[1]-18,m[2]+18,m[3]+18)).save("assets/patches/mouth_0.png")
align_crop(var["v_mouthD"], m).save("assets/patches/mouth_1.png")
align_crop(var["v_mouthB"], m).save("assets/patches/mouth_2.png")
align_crop(var["v_mouthA"], m).save("assets/patches/mouth_3.png")
align_crop(var["v_eyes"], e).save("assets/patches/eyes_closed.png")
print("v2 patches done")
