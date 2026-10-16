"""FIX3 — reload mouth_open.png (PIL-drawn) + re-render f110..216 (talk) từ out/rabbit_rig.blend.
Plane patch giữ nguyên vị trí FIX2 (canvas mapping 1:1). EEVEE 1536x1024 transparent."""
import bpy, os, time

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'out')
FR = os.path.join(OUT, 'frames')

bpy.ops.wm.open_mainfile(filepath=os.path.join(OUT, 'rabbit_rig.blend'))
img = next(i for i in bpy.data.images if 'mouth_open' in (i.filepath or '') or 'mouth_open' in i.name)
img.reload()
print('[fix3] reload image:', img.name, 'packed:', bool(img.packed_file))

scn = bpy.context.scene
scn.frame_start, scn.frame_end = 110, 216
scn.render.filepath = os.path.join(FR, 'f')  # -> f0110.png .. f0216.png
print('[fix3] engine:', scn.render.engine, 'res:', scn.render.resolution_x, scn.render.resolution_y,
      'transparent:', scn.render.film_transparent, 'range:', scn.frame_start, scn.frame_end)

t0 = time.time()
bpy.ops.render.render(animation=True)
print('[fix3] rendered f110..216 in %.1fs' % (time.time() - t0))
print('FIX3_RENDER_DONE')
