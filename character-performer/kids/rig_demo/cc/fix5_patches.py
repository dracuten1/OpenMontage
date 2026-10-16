#!/usr/bin/env python3
"""FIX5 A — patches become COPIES OF THE HEAD MESH (no manual placement, no targets).

1. DELETE old objects 'mouth'/'eyelid' + their materials (M_mouth/M_eyelid) and
   old patch image datablocks. PATCH_DELTA-era placement is gone for good
   (cc/fix_render_prep.py is neutralized as a no-op stub).
2. For each patch: ob = head.copy() with its OWN mesh + OWN material
   (M_mouth2/M_eyelid2, same tex->emission + AlphaKey node tree, new image
   datablocks at out/patches/*.png); matrix_parent_inverse copied VERBATIM from
   head; matrix_basis copied then ONLY translation.y set to y_layer
   (mouth 0.01, eyelid 0.00). Parent/bone binding identical to head.
   -> patch follows head 100% automatically.
3. Z-order check: camera sits at -Y looking +Y, so SMALLER y renders ON TOP.
   Required on-screen order: eyelid ABOVE mouth ABOVE head.
"""
import bpy, json, os, shutil, sys, time
from mathutils import Vector

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'out')
BLEND = os.path.join(OUT, 'rabbit_rig.blend')
PATCH_DIR = os.path.join(OUT, 'patches')

# (name, png, material, y_layer)
PATCHES = [('mouth', 'mouth_open.png', 'M_mouth2', 0.01),
           ('eyelid', 'eyelid.png', 'M_eyelid2', 0.00)]


def make_patch_material(mat_name, png_path):
    """Same node tree as rig_build patch materials: tex -> emission, AlphaKey multiply."""
    mat = bpy.data.materials.new(mat_name)
    mat.use_nodes = True
    nt = mat.node_tree
    nt.nodes.clear()
    outn = nt.nodes.new('ShaderNodeOutputMaterial')
    mix = nt.nodes.new('ShaderNodeMixShader')
    trans = nt.nodes.new('ShaderNodeBsdfTransparent')
    emi = nt.nodes.new('ShaderNodeEmission')
    tex = nt.nodes.new('ShaderNodeTexImage')
    tex.image = bpy.data.images.load(png_path)
    nt.links.new(tex.outputs['Color'], emi.inputs['Color'])
    mn = nt.nodes.new('ShaderNodeMath')
    mn.operation = 'MULTIPLY'
    mn.name = 'AlphaKey'
    nt.links.new(tex.outputs['Alpha'], mn.inputs[0])
    mn.inputs[1].default_value = 0.0
    nt.links.new(mn.outputs[0], mix.inputs['Fac'])
    nt.links.new(trans.outputs['BSDF'], mix.inputs[1])
    nt.links.new(emi.outputs['Emission'], mix.inputs[2])
    nt.links.new(mix.outputs['Shader'], outn.inputs['Surface'])
    mat.use_backface_culling = False
    try:
        mat.surface_render_method = 'BLENDED'
    except Exception:
        pass
    return mat


def run():
    if not bpy.app.background:
        print('FIX5_PATCHES_FAIL must run headless')
        sys.exit(2)
    t0 = time.time()
    report = {'blend': BLEND, 'patches': {}, 'ok': False}
    try:
        shutil.copy2(BLEND, BLEND + '.bak_pre_fix5')
        bpy.ops.wm.open_mainfile(filepath=BLEND)
        scn = bpy.context.scene
        head = bpy.data.objects['head']
        cam = scn.camera
        head_basis_y = float(head.matrix_basis.translation.y)
        report['head'] = {
            'parent': head.parent.name if head.parent else None,
            'parent_type': head.parent_type, 'parent_bone': head.parent_bone,
            'matrix_basis_translation_y': head_basis_y,
            'camera_location_y': float(cam.location.y) if cam else None,
        }

        # 1) delete old patch objects + materials + images, purge orphans
        #    (idempotent: also removes FIX5 head-copies on re-run)
        for name in ('mouth', 'eyelid'):
            ob = bpy.data.objects.get(name)
            if ob is not None:
                bpy.data.objects.remove(ob, do_unlink=True)
        for mat_name in ('M_mouth', 'M_eyelid', 'M_mouth2', 'M_eyelid2'):
            mat = bpy.data.materials.get(mat_name)
            if mat is not None:
                bpy.data.materials.remove(mat)
        for img in [i for i in list(bpy.data.images)
                    if i.name.startswith(('mouth_open', 'eyelid'))]:
            bpy.data.images.remove(img)
        bpy.data.orphans_purge(do_recursive=True)
        report['deleted'] = {'objects': ['mouth', 'eyelid'],
                             'materials': ['M_mouth', 'M_eyelid', 'M_mouth2', 'M_eyelid2'],
                             'images': ['mouth_open*', 'eyelid*']}

        # 2) z-order + layer heights. Camera at -Y looking +Y -> smaller y = on top.
        # Required on-screen order: eyelid ABOVE mouth ABOVE head.
        # The spec layer values (mouth 0.01, eyelid 0.00) are the rig's WORLD layer
        # heights (original design: head world y 0.05). Two traps found empirically:
        #  (a) writing a world-height delta straight into matrix_basis.translation.y
        #      SHEARS the quad diagonally (FIX1-renormalized mpi is a general matrix;
        #      ~25px screen slide per BU of basis-y) — the patch slides off-screen.
        #  (b) tiny relative basis offsets keep position but give only ~2e-5 BU world
        #      separation, which EEVEE depth-sorts unreliably (lid vanished behind
        #      head in full scene).
        # Fix: transform the pure world-Y delta through the inverse chain
        # dbasis = (P@mpi)^-1 . (0, target - head_world_y, 0)  -> world y hits the
        # spec heights EXACTLY with zero x/z slide; separations 0.04/0.05 BU.
        cam_y = report['head']['camera_location_y']
        if cam_y is None or cam_y >= 0:
            raise RuntimeError('unexpected camera (not at -Y): %s' % (cam_y,))
        bpy.context.view_layer.update()
        chain = head.matrix_world @ head.matrix_basis.inverted()      # M = P @ mpi
        chain_inv = chain.inverted()
        head_world_y = float(head.matrix_world.translation.y)
        targets = {'mouth': 0.01, 'eyelid': 0.00}
        if not (targets['eyelid'] < targets['mouth'] < head_world_y):
            targets = {'mouth': head_world_y - 0.01, 'eyelid': head_world_y - 0.02}
        head_basis_t = head.matrix_basis.translation.copy()
        layers = {}
        for n, t in targets.items():
            db = chain_inv.to_3x3() @ Vector((0.0, t - head_world_y, 0.0))
            layers[n] = head_basis_t + db
        report['layers'] = {
            'head_world_y': head_world_y,
            'world_targets': targets,
            'basis_translation': {k: [round(v, 6) for v in layers[k]] for k in layers},
            'note': 'basis translation = head basis + M^-1*(0, world_delta, 0); world y == '
                    'spec layer heights 0.01/0.00, no x/z slide, 0.04/0.05 BU separations'}

        # 3) create head-copy patches
        for name, png, mat_name, _y in PATCHES:
            png_path = os.path.join(PATCH_DIR, png)
            if not os.path.exists(png_path):
                raise RuntimeError('missing patch png: %s' % png_path)
            ob = head.copy()
            ob.data = head.data.copy()
            ob.name = name
            for coll in list(head.users_collection):
                if ob.name not in coll.objects:
                    coll.objects.link(ob)
            # parent/bone binding identical to head (copy() keeps it; re-assert)
            ob.parent = head.parent
            ob.parent_type = head.parent_type
            ob.parent_bone = head.parent_bone
            # VERBATIM parent inverse; basis copy, then ONLY the world-Y layer delta
            # applied through the inverse chain (see layers note above)
            ob.matrix_parent_inverse = head.matrix_parent_inverse.copy()
            mb = head.matrix_basis.copy()
            mb.translation = layers[name]
            ob.matrix_basis = mb
            if ob.animation_data is not None:
                ob.animation_data_clear()
            ob.hide_render = False
            ob.hide_viewport = False
            mat = make_patch_material(mat_name, png_path)
            ob.data.materials.clear()
            ob.data.materials.append(mat)
            report['patches'][name] = {
                'type': 'head.copy()', 'mesh': ob.data.name,
                'material': mat_name, 'image': png,
                'parent': ob.parent.name if ob.parent else None,
                'parent_type': ob.parent_type, 'parent_bone': ob.parent_bone,
                'matrix_basis_translation_y': float(ob.matrix_basis.translation.y),
                'matrix_parent_inverse_equals_head': (
                    [list(r) for r in ob.matrix_parent_inverse] ==
                    [list(r) for r in head.matrix_parent_inverse]),
            }
        bpy.context.view_layer.update()

        # post-conditions
        for name, _, mat_name, _y in PATCHES:
            ob = bpy.data.objects[name]
            if ob.data == head.data:
                raise RuntimeError('%s shares head mesh datablock' % name)
            if len(ob.data.materials) != 1 or ob.data.materials[0].name != mat_name:
                raise RuntimeError('%s material binding wrong' % name)
            if not any(n.type == 'MATH' and n.name == 'AlphaKey'
                       for n in ob.data.materials[0].node_tree.nodes):
                raise RuntimeError('%s material missing AlphaKey node' % name)
            wy = float(ob.matrix_world.translation.y)
            if abs(wy - targets[name]) > 1e-4:
                raise RuntimeError('%s world y %.6f != target %.2f' % (name, wy, targets[name]))
            report['patches'][name]['world_y'] = wy
        report['ok'] = True
        bpy.ops.wm.save_as_mainfile(filepath=BLEND)
        report['saved'] = True
    except Exception as e:
        report['error'] = '%s: %s' % (type(e).__name__, e)
        report['ok'] = False
    report['elapsed_s'] = round(time.time() - t0, 2)
    print('[fix5_patches]', json.dumps(report))
    print('FIX5_PATCHES_OK' if report['ok'] else 'FIX5_PATCHES_FAIL')
    code = 0 if report['ok'] else 2
    sys.stdout.flush(); sys.stderr.flush()
    os._exit(code)


if __name__ == '__main__':
    run()
