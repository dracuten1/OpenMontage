"""v3: alpha-masked mouth openings — paste ONLY the dark hole pixels,
zero skin, no seam. Base closed lips stay visible beneath."""
import json
from PIL import Image, ImageFilter

base = Image.open("assets/adv_scene.png").convert("RGB")
meta = json.load(open("assets/adv_meta.json"))
m = meta["mouth"]
var = {k: Image.open(f"assets/{k}.png").convert("RGB") for k in ["v_mouthA","v_mouthB","v_mouthD"]}
for k,v in var.items():
    if v.size != base.size: var[k] = v.resize(base.size, Image.LANCZOS)

def lum(px): return 0.299*px[0]+0.587*px[1]+0.114*px[2]

def hole_patch(vname, thr=28, gain=2.2, pad=14):
    bx0,by0,bx1,by1 = m
    r0,r1,r2,r3 = bx0-pad,by0-pad,bx1+pad,by1+pad
    B = base.crop((r0,r1,r2,r3)); V = var[vname].crop((r0,r1,r2,r3))
    Bp = list(B.getdata()); Vp = list(V.getdata())
    out = Image.new("RGBA", B.size, (0,0,0,0))
    Op = []
    for i in range(len(Bp)):
        d = lum(Bp[i]) - lum(Vp[i])   # >0 = variant darker
        if d > thr:
            a = min(255, int((d - thr) * gain * 4))
            c = Vp[i]
            Op.append((c[0],c[1],c[2],a))
        else:
            Op.append((0,0,0,0))
    out.putdata(Op)
    # feather alpha 1px to kill hard extraction edge
    a = out.split()[3].filter(ImageFilter.GaussianBlur(1.2))
    out.putalpha(a)
    return out

# tier1 = slight, 2 = half, 3 = wide
hole_patch("v_mouthD").save("assets/patches/mouth_1.png")
hole_patch("v_mouthB").save("assets/patches/mouth_2.png")
hole_patch("v_mouthA").save("assets/patches/mouth_3.png")
# mouth_0 = transparent (closed base lips already in scene)
Image.new("RGBA",(10,10),(0,0,0,0)).save("assets/patches/mouth_0.png")
print("v3 hole patches done")
