"""v6: paste variant pixels (hole + real skin ring around it, no flat fill).
Mask = hole dilated 10px. Base closed lips fully replaced by variant's own
shaded skin -> no seams possible."""
import json
from collections import deque
from PIL import Image, ImageFilter

base = Image.open("assets/adv_scene.png").convert("RGB")
meta = json.load(open("assets/adv_meta.json"))
m = meta["mouth"]
A = Image.open("assets/v_mouthA.png").convert("RGB")
B2 = Image.open("assets/v_mouthB.png").convert("RGB")
D2 = Image.open("assets/v_mouthD.png").convert("RGB")
for im in (A,B2,D2):
    if im.size != base.size: im.resize(base.size, Image.LANCZOS)

PAD = 10
r0,r1 = m[0]-PAD, m[1]-PAD
W,H = (m[2]-m[0])+PAD*2, (m[3]-m[1])+PAD*2
V = A.crop((r0,r1,r0+W,r1+H))
vpx = list(V.getdata())
def vp(x,y): return vpx[y*W+x]

def avg(px): return tuple(sum(c[i] for c in px)//len(px) for i in range(3))
skin = avg([vp(x,y) for x in range(0,4) for y in range(H//4,3*H//4)] +
           [vp(x,y) for x in range(W-4,W) for y in range(H//4,3*H//4)])
def dist(a,b): return abs(a[0]-b[0])+abs(a[1]-b[1])+abs(a[2]-b[2])

cx,cy = W//2,H//2
seen=set(); q=deque([(cx,cy)]); seen.add((cx,cy))
while q:
    x,y=q.popleft()
    for dx,dy in ((1,0),(-1,0),(0,1),(0,-1)):
        nx,ny=x+dx,y+dy
        if 0<=nx<W and 0<=ny<H and (nx,ny) not in seen and dist(vp(nx,ny),skin)>55:
            seen.add((nx,ny)); q.append((nx,ny))

# dilate hole mask by 10px (ring of real variant skin covers old lip outline)
mask = Image.new("L",(W,H),0); mpx=[]
for i in range(W*H):
    mpx.append(255 if (i%W,i//W) in seen else 0)
mask.putdata(mpx)
for _ in range(10):
    mask = mask.filter(ImageFilter.MaxFilter(3))
mask = mask.filter(ImageFilter.GaussianBlur(1.2))

# big tier: variant A pixels through mask
tier3 = Image.new("RGBA",(W,H),(0,0,0,0))
tier3.paste(V,(0,0),mask)

# smaller tiers: crop hole-neighborhood from B/D variants and scale
def small_tier(src, f):
    bb = mask.getbbox()
    cxm,cym = (bb[0]+bb[2])//2,(bb[1]+bb[3])//2
    Sc = src.crop((r0,r1,r0+W,r1+H))
    w2,h2 = max(4,int((bb[2]-bb[0])*f)), max(4,int((bb[3]-bb[1])*f))
    region = Sc.crop((cxm-w2//2, cym-h2//2-(h2//6), cxm+w2//2, cym+h2//2-(h2//6)))
    mregion = mask.crop((cxm-w2//2, cym-h2//2-(h2//6), cxm+w2//2, cym+h2//2-(h2//6)))
    c = Image.new("RGBA",(W,H),(0,0,0,0))
    c.paste(region,(cxm-w2//2, cym-h2//2-(h2//6)), mregion)
    return c

small_tier(D2,0.55).save("assets/patches/mouth_1.png")
small_tier(B2,0.78).save("assets/patches/mouth_2.png")
tier3.save("assets/patches/mouth_3.png")
Image.new("RGBA",(10,10),(0,0,0,0)).save("assets/patches/mouth_0.png")
print("v6 done | hole px", len(seen), "| mask bbox", mask.getbbox())
