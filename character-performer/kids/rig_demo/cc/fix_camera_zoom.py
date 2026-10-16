#!/usr/bin/env python3
"""FIX1b — fit camera theo content sweep da do: z [-2.756, 10.350] (13.11m).
ortho 13.9 + center z 3.80 => visible z [-3.05, 10.85] (margin ~0.3m moi canh).
Composite crop+resize-to-Ht la scale/translation invariant nen output khong doi."""
import bpy, os

OUT = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'out')
bpy.ops.wm.open_mainfile(filepath=os.path.join(OUT, 'rabbit_rig.blend'))
cam = bpy.data.objects['Cam']
print('[zoom] ortho_scale:', cam.data.ortho_scale, '->', 13.9,
      '| loc.z:', round(cam.location.z, 3), '->', 3.80)
cam.data.ortho_scale = 13.9
cam.location.z = 3.80
bpy.ops.wm.save_as_mainfile(filepath=os.path.join(OUT, 'rabbit_rig.blend'))
print('ZOOM_OK')
