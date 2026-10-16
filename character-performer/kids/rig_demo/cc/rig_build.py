#!/usr/bin/env python3
"""BUOC 3 — build .blend: COA sprites + bones + IK + camera + material, verify frame f=1."""
import bpy, addon_utils, json, math, os, time
import numpy as np
from mathutils import Vector, Matrix

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'out')
CLEAN = os.path.join(OUT, 'parts_clean')
PATCH = os.path.join(OUT, 'patches')
META = json.load(open(os.path.join(OUT, 'clean_meta.json')))
P = META['parts']

# (obj_name, png, meta_key, bone, z_idx)  — pivots/scale/delta lay tu clean_meta
SPRITES = [
    ('head',     'parts_clean/head.png',          'head',     'head_b',     4),
    ('ear_far',  'parts_clean/ear_tilt.png',      'ear_tilt', 'ear_far_b',  5),
    ('ear_near', 'parts_clean/ear_tilt.png',      'ear_near', 'ear_near_b', 7),
    ('body',     'parts_clean/body.png',          'body',     'hips',       2),
    ('arm_far',  'parts_clean/arm_far.png',       'arm_far',  'arm_far_b',  1),
    ('arm_near', 'parts_clean/arm_near.png',      'arm_near', 'arm_near_b', 6),
    ('leg_far',  'parts_clean/leg_left.png',      'leg_left',  'leg_far_b',  0),
    ('leg_near', 'parts_clean/leg_left.png',      'leg_right', 'leg_near_b', 3),
    ('mouth',    'patches/mouth_open.png',        'head',     'head_b',     8),
    ('eyelid',   'patches/eyelid.png',            'head',     'head_b',     9),
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

# ---------- sprite object ----------
bpy.ops.coa_tools2.create_sprite_object()
arm = bpy.context.active_object  # 'SpriteObject'
# COA headless: active_collection rong -> KeyError trong link_object
coll = next((c for c in bpy.data.collections if arm.name in c.objects), None)
if coll is None:
    coll = bpy.data.collections.new('COA')
    scn.collection.children.link(coll)
    for o in list(sn_collection := scn.collection.objects):
        if o == arm:
            scn.collection.objects.unlink(arm)
            coll.objects.link(arm)
scn.coa_tools2.active_collection = coll.name

# ---------- bones ----------
bpy.context.view_layer.objects.active = arm
bpy.ops.object.mode_set(mode='EDIT')
eb = arm.data.edit_bones


def px(x, y):
    return Vector((x * 0.01, 0.0, y * 0.01))  # z=+y: camera tren nay render z-flip → mirror toan bo geometry


def bone(name, h, t, parent=None):
    b = eb.new(name)
    b.head, b.tail, b.roll = px(*h), px(*t), 0.0
    if parent:
        b.parent = eb[parent]
    b.use_connect = False


def bone_up(name, h, ang_deg, L, parent=None):
    a = math.radians(ang_deg)
    bone(name, h, (h[0] + 100 * L * math.sin(a), h[1] - 100 * L * math.cos(a)), parent)


def bone_down(name, h, ang_deg, L, parent=None):
    a = math.radians(ang_deg)
    bone(name, h, (h[0] + 100 * L * math.sin(a), h[1] + 100 * L * math.cos(a)), parent)


bone('root', (700, 980), (703, 900))
bone('hips', (765, 800), (768, 600), 'root')
bone('spine', (765, 780), (768, 500), 'hips')
bone('head_b', (770, 470), (740, 380), 'spine')
bone_up('ear_far_b', (820, 245), -25, 3.0, 'head_b')
bone_up('ear_near_b', (872, 252), -8, 3.2, 'head_b')
bone_down('arm_far_b', (798, 565), 20, 2.2, 'spine')
bone_down('arm_near_b', (845, 588), 25, 2.1, 'spine')
bone('leg_far_b', (700, 798), (703, 988), 'hips')
bone('leg_near_b', (830, 798), (833, 988), 'hips')
bpy.ops.object.mode_set(mode='OBJECT')

# ---------- import sprites ----------
t_imp = time.time()
placed, WANTS = {}, {}
for name, rel, mkey, bone_name, zidx in SPRITES:
    png = os.path.join(OUT, rel)
    before = set(bpy.data.objects.keys())
    bpy.context.view_layer.objects.active = arm
    bpy.ops.coa_tools2.import_sprite(path=png, parent=arm.name)
    new = [o for o in bpy.data.objects if o.name not in before]
    ob = new[0] if new else bpy.context.active_object
    ob.name = name

    rec = P[mkey]
    piv_part, piv_pup = rec['pivot_part'], rec['pivot_puppet']
    scale, delta = rec['scale'], rec.get('delta_deg', 0.0) or 0.0
    me = ob.data
    # TOPOLOGY THU CONG (mesh COA headless: MASK modifier + UV khong deterministic):
    # quad = full canvas 1536x1024 quanh pivot, 4 vert, UV gan sau (calibrate V-flip)
    pw, ph = piv_part
    W, H = 1536.0, 1024.0
    quad = [(-pw * 0.01, 0.0, -ph * 0.01),          # TL canvas (0,0)
            ((W - pw) * 0.01, 0.0, -ph * 0.01),     # TR (1536,0)
            ((W - pw) * 0.01, 0.0, (H - ph) * 0.01),  # BR (1536,1024)
            (-pw * 0.01, 0.0, (H - ph) * 0.01)]   # BL (0,1024)
    me.clear_geometry()
    me.from_pydata(quad, [], [(0, 1, 2, 3)])
    if me.uv_layers.active is None:
        me.uv_layers.new()
    ob.modifiers.clear()  # bo MASK modifier cua COA

    y_layer = (9 - zidx) * 0.01  # DAO y: eyelid gan camera nhat (camera nam phia -Y nhin +Y)
    ob.location = (piv_pup[0] * 0.01, y_layer, piv_pup[1] * 0.01)
    ob.rotation_euler = (0.0, -math.radians(delta), 0.0)  # -delta: z-mirror flip dau ry
    ob.scale = (scale, 1.0, scale)
    ob.parent = arm
    ob.parent_type = 'BONE'
    ob.parent_bone = bone_name
    WANTS[name] = (Matrix.Translation(ob.location)
                   @ Matrix.Rotation(ob.rotation_euler.y, 4, 'Y')
                   @ Matrix.Diagonal((scale, 1.0, scale, 1.0)).to_4x4())

    # material flat: Emission + Transparent mix (keyable cho mouth/eyelid)
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

# ---------- normalize world = want (mpi bi COA/depsgraph rebake — gan basis truc tiep) ----------
for ob in placed.values():
    ob.matrix_parent_inverse = Matrix.Identity(4)
bpy.context.view_layer.update()
for name, ob in placed.items():
    # PA = basis^-1 @ world  =>  basis_moi = want @ PA^-1
    PA_inv = ob.matrix_world.copy().inverted() @ ob.matrix_basis
    ob.matrix_basis = WANTS[name] @ PA_inv
bpy.context.view_layer.update()


def set_uv(vflip):
    """UV: A) v=1 o top (py0); B) vflip=True -> v=0 o top."""
    for name, ob in placed.items():
        uv = ob.data.uv_layers.active
        us = [(0, 1), (1, 1), (1, 0), (0, 0)] if not vflip else [(0, 0), (1, 0), (1, 1), (0, 1)]
        for i, u in enumerate(us):
            uv.data[i].uv = u

# ---------- IK targets ----------
bpy.context.view_layer.objects.active = arm
bpy.ops.object.mode_set(mode='POSE')
for bname, tname in (('leg_far_b', 'leg_far_target'), ('leg_near_b', 'leg_near_target')):
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
cam.location = (7.68, -30.0, 5.12)    # z-mirror: canvas Z 0..+10.24
cam.rotation_euler = (math.pi / 2, 0, 0)
scn.camera = cam

# ---------- verify f=1 (tu calibrate huong V cua UV) ----------
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

# ---------- bone axis signs (cho animate) ----------
axes = {}
for bn in arm.data.bones.keys():
    axes[bn] = {'z_axis_y': round(arm.data.bones[bn].z_axis.y, 3),
                'x_axis_x': round(arm.data.bones[bn].x_axis.x, 3)}

bpy.ops.wm.save_as_mainfile(filepath=os.path.join(OUT, 'rabbit_rig.blend'))

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
