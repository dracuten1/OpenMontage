#!/usr/bin/env python3
"""TURTLE BUOC 3 — build .blend tu out/parts (full-canvas, aligned nhu m0).

Khac rabbit: parts KHONG crop/di chuyen — moi layer la canvas 1535x1024 dung
vi tri goc → pivot_part == pivot_puppet (diem co dinh 775,512), scale 1,
delta 0. Bones: root/hips(shell) + head_b + tail_b + 4 leg bones (IK).
z-order: far_hind < far_front < tail < shell < head < near_hind < near_front
< mouth < eyelid (mouth/eyelid parent head_b).
Verify f1: render bbox == assembly bbox [49,96,1503,928], cx ≈ 775.
"""
import bpy, addon_utils, json, math, os, time
import numpy as np
from mathutils import Vector, Matrix

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'out')
PARTS = os.path.join(OUT, 'parts')
META = json.load(open(os.path.join(OUT, 'parts_meta.json')))
P = META['parts']

CANVAS_W, CANVAS_H = 1535.0, 1024.0
PIV = (775.0, 512.0)  # pivot chung, canvas px

# (obj, png, bone, z) — y_layer = (9-z)*0.01
SPRITES = [
    ('leg_far_hind',  'parts/leg_far_hind.png',  'hips',            0),
    ('leg_far_front', 'parts/leg_far_front.png', 'hips',            1),
    ('tail',          'parts/tail.png',          'tail_b',          2),
    ('shell',         'parts/shell.png',         'hips',            3),
    ('head',          'parts/head.png',          'head_b',          4),
    ('leg_near_hind', 'parts/leg_near_hind.png', 'hips',            5),
    ('leg_near_front','parts/leg_near_front.png','hips',            6),
    ('mouth',         'parts/mouth_open.png',    'head_b',          7),
    ('eyelid',        'parts/eyelid.png',        'head_b',          8),
]

t0 = time.time()
bpy.ops.wm.read_factory_settings(use_empty=True)
addon_utils.enable('coa_tools2')

scn = bpy.context.scene
scn.render.fps = 24
scn.render.resolution_x, scn.render.resolution_y = 1536, 1024
scn.render.film_transparent = True
scn.render.image_settings.file_format = 'PNG'
scn.render.image_settings.color_mode = 'RGBA'
try:
    scn.render.engine = 'BLENDER_EEVEE_NEXT'
    ENGINE = 'BLENDER_EEVEE_NEXT'
except TypeError:
    scn.render.engine = 'BLENDER_EEVEE'
    ENGINE = 'BLENDER_EEVEE'

bpy.ops.coa_tools2.create_sprite_object()
arm = bpy.context.active_object
coll = next((c for c in bpy.data.collections if arm.name in c.objects), None)
if coll is None:
    coll = bpy.data.collections.new('COA')
    scn.collection.children.link(coll)
    for o in list(scn.collection.objects):
        if o == arm:
            scn.collection.objects.unlink(arm)
            coll.objects.link(arm)
scn.coa_tools2.active_collection = coll.name

# ---------- bones (canvas px, y-xuống; px() -> BU) ----------
bpy.context.view_layer.objects.active = arm
bpy.ops.object.mode_set(mode='EDIT')
eb = arm.data.edit_bones


def px(x, y):
    return Vector((x * 0.01, 0.0, y * 0.01))


def bone(name, h, t, parent=None):
    b = eb.new(name)
    b.head, b.tail, b.roll = px(*h), px(*t), 0.0
    if parent:
        b.parent = eb[parent]
    b.use_connect = False


bone('root',            (775, 980), (778, 900))
bone('hips',            (775, 860), (778, 560), 'root')
bone('head_b',          (950, 630), (1060, 540), 'hips')
bone('tail_b',          (195, 612), (120, 590), 'hips')
bone('leg_near_front_b',(930, 650), (933, 880), 'hips')
bone('leg_far_front_b', (1190, 700), (1193, 850), 'hips')
bone('leg_near_hind_b', (250, 690), (253, 860), 'hips')
bone('leg_far_hind_b',  (500, 790), (503, 858), 'hips')
bpy.ops.object.mode_set(mode='OBJECT')

# ---------- import sprites ----------
t_imp = time.time()
placed, WANTS = {}, {}
for name, rel, bone_name, zidx in SPRITES:
    png = os.path.join(OUT, rel)
    before = set(bpy.data.objects.keys())
    bpy.context.view_layer.objects.active = arm
    bpy.ops.coa_tools2.import_sprite(path=png, parent=arm.name)
    new = [o for o in bpy.data.objects if o.name not in before]
    ob = new[0] if new else bpy.context.active_object
    ob.name = name

    pw, ph = PIV
    W, H = CANVAS_W, CANVAS_H
    me = ob.data
    quad = [(-pw * 0.01, 0.0, -ph * 0.01),
            ((W - pw) * 0.01, 0.0, -ph * 0.01),
            ((W - pw) * 0.01, 0.0, (H - ph) * 0.01),
            (-pw * 0.01, 0.0, (H - ph) * 0.01)]
    me.clear_geometry()
    me.from_pydata(quad, [], [(0, 1, 2, 3)])
    if me.uv_layers.active is None:
        me.uv_layers.new()
    ob.modifiers.clear()

    y_layer = (9 - zidx) * 0.01
    ob.location = (PIV[0] * 0.01, y_layer, PIV[1] * 0.01)
    ob.rotation_euler = (0.0, 0.0, 0.0)
    ob.scale = (1.0, 1.0, 1.0)
    ob.parent = arm
    ob.parent_type = 'BONE'
    ob.parent_bone = bone_name
    WANTS[name] = Matrix.Translation(ob.location)

    mat = bpy.data.materials.new(f'M_{name}')
    mat.use_nodes = True
    nt = mat.node_tree
    nt.nodes.clear()
    outn = nt.nodes.new('ShaderNodeOutputMaterial')
    mix = nt.nodes.new('ShaderNodeMixShader')
    trans = nt.nodes.new('ShaderNodeBsdfTransparent')
    emi = nt.nodes.new('ShaderNodeEmission')
    tex = nt.nodes.new('ShaderNodeTexImage')
    tex.image = bpy.data.images.load(png)
    nt.links.new(tex.outputs['Color'], emi.inputs['Color'])
    if name in ('mouth', 'eyelid'):
        mn = nt.nodes.new('ShaderNodeMath')
        mn.operation = 'MULTIPLY'
        mn.name = 'AlphaKey'
        nt.links.new(tex.outputs['Alpha'], mn.inputs[0])
        mn.inputs[1].default_value = 0.0
        nt.links.new(mn.outputs[0], mix.inputs['Fac'])
    else:
        nt.links.new(tex.outputs['Alpha'], mix.inputs['Fac'])
    nt.links.new(trans.outputs['BSDF'], mix.inputs[1])
    nt.links.new(emi.outputs['Emission'], mix.inputs[2])
    nt.links.new(mix.outputs['Shader'], outn.inputs['Surface'])
    mat.use_backface_culling = False
    try:
        mat.surface_render_method = 'BLENDED'
    except Exception:
        pass
    me.materials.clear()
    me.materials.append(mat)
    placed[name] = ob
    me.update()
t_import = time.time() - t_imp

for ob in placed.values():
    ob.matrix_parent_inverse = Matrix.Identity(4)
bpy.context.view_layer.update()
for name, ob in placed.items():
    PA_inv = ob.matrix_world.copy().inverted() @ ob.matrix_basis
    ob.matrix_basis = WANTS[name] @ PA_inv
bpy.context.view_layer.update()


def set_uv(vflip):
    for name, ob in placed.items():
        uv = ob.data.uv_layers.active
        us = [(0, 1), (1, 1), (1, 0), (0, 0)] if not vflip else [(0, 0), (1, 0), (1, 1), (0, 1)]
        for i, u in enumerate(us):
            uv.data[i].uv = u


# ---------- IK targets 4 chan ----------
bpy.context.view_layer.objects.active = arm
bpy.ops.object.mode_set(mode='POSE')
for bname in ('leg_far_hind_b', 'leg_far_front_b', 'leg_near_hind_b', 'leg_near_front_b'):
    tname = bname.replace('_b', '_target')
    tail = arm.matrix_world @ arm.data.bones[bname].tail_local
    e = bpy.data.objects.new(tname, None)
    scn.collection.objects.link(e)
    e.location = tail
    e.empty_display_size = 0.3
    c = arm.pose.bones[bname].constraints.new('IK')
    c.target = e
    c.chain_count = 1
bpy.ops.object.mode_set(mode='OBJECT')

# ---------- camera ----------
cd = bpy.data.cameras.new('Cam')
cd.type = 'ORTHO'
cd.ortho_scale = 10.24
cd.sensor_fit = 'VERTICAL'
cam = bpy.data.objects.new('Cam', cd)
scn.collection.objects.link(cam)
cam.location = (7.675, -30.0, 5.12)
cam.rotation_euler = (math.pi / 2, 0, 0)
scn.camera = cam

# ---------- verify f=1 ----------
exp, ec = META['assembly_bbox'], META['assembly_centroid']


def render_check(tag):
    scn.frame_set(1)
    scn.render.filepath = os.path.join(OUT, f'build_check_{tag}.png')
    bpy.ops.render.render(write_still=True)
    img = bpy.data.images.load(scn.render.filepath, check_existing=False)
    arr = np.array(img.pixels).reshape(1024, 1536, 4)
    am = arr[:, :, 3] > 0.1
    ys, xs = np.nonzero(am)
    if len(xs) == 0:
        return None, None, [9999] * 4, 9999.0
    rb = [int(xs.min()), int(ys.min()), int(xs.max()), int(ys.max())]
    diffs = [abs(rb[i] - exp[i]) for i in range(4)]
    return rb, float(xs.mean()), diffs, sum(diffs)


set_uv(False)
rb_a, cxa, diffs_a, score_a = render_check('A')
best_flip = False
if not all(d <= 8 for d in diffs_a):
    set_uv(True)
    rb_b, cxb, diffs_b, score_b = render_check('B')
    if score_b < score_a:
        best_flip = True
        rb, rcx, diffs = rb_b, cxb, diffs_b
    else:
        set_uv(False)
        rb, rcx, diffs = rb_a, cxa, diffs_a
else:
    rb, rcx, diffs = rb_a, cxa, diffs_a
ok_bbox = all(d <= 8 for d in diffs)
ok_mirror = abs(rcx - ec[0]) <= 12.0
ok = ok_bbox and ok_mirror

axes = {}
for bn in arm.data.bones.keys():
    axes[bn] = {'z_axis_y': round(arm.data.bones[bn].z_axis.y, 3),
                'x_axis_x': round(arm.data.bones[bn].x_axis.x, 3)}

# FIX-0 (bai hoc rabbit): moi pose bone QUATERNION -> key euler chet
for pb in arm.pose.bones:
    pb.rotation_mode = 'XYZ'

bpy.ops.wm.save_as_mainfile(filepath=os.path.join(OUT, 'turtle_rig.blend'))

rig_meta = {'engine': ENGINE, 'uv_vflip': best_flip, 'render_bbox': rb, 'expected_bbox': exp, 'diffs': diffs,
            'render_cx': round(rcx, 1), 'expected_cx': ec[0],
            'verify_bbox': bool(ok_bbox), 'verify_mirror': bool(ok_mirror),
            'n_sprites': len(SPRITES), 'n_bones': len(arm.data.bones),
            't_import_s': round(t_import, 2), 't_total_s': round(time.time() - t0, 2),
            'bone_axes': axes}
json.dump(rig_meta, open(os.path.join(OUT, 'rig_meta.json'), 'w'), indent=1)
print('[build]', json.dumps({k: v for k, v in rig_meta.items() if k != 'bone_axes'}))
print('BUILD_OK' if ok else 'BUILD_FAIL')
raise SystemExit(0 if ok else 2)
