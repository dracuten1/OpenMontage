"""v4: flood-segment the real mouth from v_mouthA (non-skin BFS from mouth
center) -> crisp alpha blob; tiers by geometric scaling; eyes = PIL-drawn lids
on locally-sampled skin (v1 approach, QC-clean)."""
import json
from collections import deque
from PIL import Image, ImageDraw, ImageFilter

base = Image.open("assets/adv_scene.png").convert("RGB")
meta = json.load(open("assets/adv_meta.json"))
m = meta["mouth"]; e = meta["eyes"]
A = Image.open("assets/v_mouthA.png").convert("RGB")
if A.size != base.size: A = A.resize(base.size, Image.LANCZOS)

pad = 18
r0,r1,r2,r3 = m[0]-pad, m[1]-pad, m[2]+pad, m[3]+pad
V = A.crop((r0,r1,r2,r3)); W,H = V.size
vpx = list(V.getdata())
def vp(x,y): return vpx[y*W+x]

# skin = median of patch corners (4x4 avg each)
def boxavg(x0,y0,x1,y1):
    px=[vp[x,y] for x in range(x0,x1) for y in range(y0,y1)]
    n=len(px); return tuple(sum(c[i] for c in px)//n for i in range(3))
corners=[boxavg(0,0,5,5),boxavg(W-5,0,W,5),boxavg(0,H-5,5,H),boxavg(W-5,H-5,W,H)]
skin=corners[0]
def dist(a,b): return abs(a[0]-b[0])+abs(a[1]-b[1])+abs(a[2]-b[2])

# BFS from mouth center over non-skin pixels
cx,cy = (m[0]-r0+m[2]-r0)//2, (m[1]-r1+m[3]-r1)//2
seen=set(); q=deque([(cx,cy)]); seen.add((cx,cy))
SKIN_D = 60
while q:
    x,y=q.popleft()
    for dx,dy in ((1,0),(-1,0),(0,1),(0,-1)):
        nx,ny=x+dx,y+dy
        if 0<=nx<W and 0<=ny<H and (nx,ny) not in seen and dist(vp(nx,ny),skin)>SKIN_D:
            seen.add((nx,ny)); q.append((nx,ny))

hole = Image.new("RGBA",(W,H),(0,0,0,0)); hp=hole.load()
for (x,y) in seen: hp[x,y]=vp[x,y]+(255,)
# 1px feather
hole.putalpha(hole.split()[3].filter(ImageFilter.GaussianBlur(0.8)))
hole.save("assets/patches/mouth_3.png")

# smaller tiers: scale the SAME hole around its centroid
bb = hole.getbbox(); cxm,cym=(bb[0]+bb[2])//2,(bb[1]+bb[3])//2
for tier,f in ((2,0.62),(1,0.38)):
    w2,h2=max(2,int((bb[2]-bb[0])*f)),max(2,int((bb[3]-bb[1])*f))
    small=hole.resize((w2,h2),Image.LANCZOS)
    canvas=Image.new("RGBA",(W,H),(0,0,0,0))
    canvas.paste(small,(cxm-w2//2,cym-h2//2),small)
    canvas.save(f"assets/patches/mouth_{tier}.png")
Image.new("RGBA",(10,10),(0,0,0,0)).save("assets/patches/mouth_0.png")

# eyes: PIL lids on sampled skin (v1, QC-verified)
ep=8; er0,er1,er2,er3=e[0]-ep,e[1]-ep,e[2]+ep,e[3]+ep
E=base.crop((er0,er1,er2,er3)); EW,EH=E.size; epix=E.load()
fore=[epix[x,EH//6] for x in range(4,EW-4,7)]
sk2=tuple(sum(c[i] for c in fore)//len(fore) for i in range(3))
dk=tuple(int(v*0.25) for v in sk2)
P=Image.new("RGBA",(EW,EH),(0,0,0,0)); d=ImageDraw.Draw(P)
d.rectangle((0,5,EW,EH),fill=sk2+(255,))
for ex_ in (0.27,0.73):
    x0=ex_*EW
    d.arc((x0-EW*0.14,EH*0.30,x0+EW*0.14,EH*0.80),20,160,fill=dk+(255,),width=5)
P.save("assets/patches/eyes_closed.png")
print("v4 patches: hole bbox",bb,"| mouth px:",len(seen))
