"""v5: aligned pad (10 = composer mouthPad) + skin underlay erasing base lips
+ segmented hole on top. One PNG per tier, exact placement."""
import json
from collections import deque
from PIL import Image, ImageDraw, ImageFilter

base = Image.open("assets/adv_scene.png").convert("RGB")
meta = json.load(open("assets/adv_meta.json"))
m = meta["mouth"]
A = Image.open("assets/v_mouthA.png").convert("RGB")
if A.size != base.size: A = A.resize(base.size, Image.LANCZOS)

PAD = 10  # MUST equal mouthPad prop in the composition
r0,r1 = m[0]-PAD, m[1]-PAD
W = (m[2]-m[0]) + PAD*2; H = (m[3]-m[1]) + PAD*2
V = A.crop((r0,r1,r0+W,r1+H)); B = base.crop((r0,r1,r0+W,r1+H))
vpx = list(V.getdata()); bpx = list(B.getdata())
def vp(x,y): return vpx[y*W+x]
def bp(x,y): return bpx[y*W+x]

# skin from LEFT and RIGHT edges (cheeks), not corners
def avg(px): return tuple(sum(c[i] for c in px)//len(px) for i in range(3))
skin = avg([vp(x,y) for x in range(0,4) for y in range(H//4, 3*H//4)] +
           [vp(x,y) for x in range(W-4,W) for y in range(H//4, 3*H//4)])
def dist(a,b): return abs(a[0]-b[0])+abs(a[1]-b[1])+abs(a[2]-b[2])

# BFS hole over non-skin
cx,cy = W//2, H//2
seen=set(); q=deque([(cx,cy)]); seen.add((cx,cy))
while q:
    x,y=q.popleft()
    for dx,dy in ((1,0),(-1,0),(0,1),(0,-1)):
        nx,ny=x+dx,y+dy
        if 0<=nx<W and 0<=ny<H and (nx,ny) not in seen and dist(vp(nx,ny),skin)>55:
            seen.add((nx,ny)); q.append((nx,ny))

hole = Image.new("RGBA",(W,H),(0,0,0,0))
hpx=[]
for i in range(W*H):
    x,y=i%W,i//W
    hpx.append(vp(x,y)+(255,) if (x,y) in seen else (0,0,0,0))
hole.putdata(hpx)
hole.putalpha(hole.split()[3].filter(ImageFilter.GaussianBlur(0.6)))

def tier_canvas(f):
    c = Image.new("RGBA",(W,H),(0,0,0,0)); d = ImageDraw.Draw(c)
    # skin underlay: erase base closed lips (bbox +2px), rounded + feathered
    d.rounded_rectangle((PAD-2, PAD-2, W-PAD+2, H-PAD+2), radius=6, fill=skin+(255,))
    c.putalpha(c.split()[3].filter(ImageFilter.GaussianBlur(1.5)))
    if f == 1.0:
        c = Image.alpha_composite(c, hole)
    else:
        bb = hole.getbbox(); cxm,cym=(bb[0]+bb[2])//2,(bb[1]+bb[3])//2
        w2,h2 = max(2,int((bb[2]-bb[0])*f)), max(2,int((bb[3]-bb[1])*f))
        # smaller tiers sit slightly higher (jaw opens down from upper lip)
        small = hole.resize((w2,h2),Image.LANCZOS)
        c.alpha_composite(small,(cxm-w2//2, cym-h2//2 - (h2//6)))
    return c

tier_canvas(0.38).save("assets/patches/mouth_1.png")
tier_canvas(0.62).save("assets/patches/mouth_2.png")
tier_canvas(1.00).save("assets/patches/mouth_3.png")
Image.new("RGBA",(10,10),(0,0,0,0)).save("assets/patches/mouth_0.png")
print("v5: hole px", len(seen), "| skin", skin, "| W,H", W, H)
