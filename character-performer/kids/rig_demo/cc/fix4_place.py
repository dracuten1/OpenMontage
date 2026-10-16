#!/usr/bin/env python3
"""FIX4 A: numerical solo-patch placement at production frame 147."""
import json
import math
import os
from pathlib import Path
import subprocess
import sys
import time

import bpy
from bpy_extras.object_utils import world_to_camera_view
from mathutils import Vector

ROOT = Path('/Users/tuyennguyen/project/OpenMontage/character-performer/kids/rig_demo')
OUT = ROOT / 'out'
BLEND = OUT / 'rabbit_rig.blend'
SOLO = OUT / 'solo_fix4'
REPORT = OUT / 'fix4_patch_verify.json'
PYTHON = Path('/Users/tuyennguyen/project/OpenMontage/.venv/bin/python')
FRAME = 147
RESOLUTION = (1536, 1024)
TARGETS = {'mouth': (870.0, 547.0), 'eyelid': (855.0, 487.0)}
BU_PER_PIXEL = 0.01
TOLERANCE = 8.0
MAX_ROUNDS = 3
PATCH_SHAPE_ANALYSIS = {
    'source': 'cc/make_patches.py (static geometry, no image read)',
    'mouth_open.png': {
        'alpha_content': 'mouth bean only: ellipse 64x46 + 7px outline + tongue 40x16 '
                         '(contained); no skin cover, no square/disk',
        'texture_bbox_center': [955, 427],
        'bean_center': [955, 427],
        'bbox_center_equals_bean_center': True,
        'note': 'rotate(10deg, expand) about layer center keeps bean centered; '
                'alpha bbox center is the bean center'},
    'eyelid.png': {
        'alpha_content': 'fur lid ellipse 64x26 + upper arc (7px, +3 outset) + 3 lashes',
        'eye_ellipse_center': [985, 442],
        'texture_bbox_center_approx': [985, 434.5],
        'bbox_center_offset_vs_eye_center_px': [0.0, -7.5],
        'bbox_center_equals_eye_center': False,
        'note': 'lashes/arc extend upward; alpha bbox center sits ~7.5px above the '
                'eye ellipse center (horizontal symmetric). Owner targets and Bnow '
                'are measured with the same alpha-bbox convention, so bbox-center '
                'alignment is used unchanged; offset logged here'},
}

RENDERABLE_TYPES = {'MESH' , 'CURVE', 'SURFACE', 'META', 'FONT', 'VOLUME',
                    'POINTCLOUD', 'GREASEPENCIL'}

ALPHA_CODE = '''import json,sys
from PIL import Image
with Image.open(sys.argv[1]) as im:
    b=im.getchannel("A").getbbox()
    print(json.dumps({"bbox":list(b) if b else None,
        "center":[(b[0]+b[2])/2,(b[1]+b[3])/2] if b else None,
        "resolution":list(im.size)}))
'''


def alpha_stats(path):
    try:
        from PIL import Image
    except ImportError:
        result = subprocess.run([str(PYTHON), '-c', ALPHA_CODE, str(path)],
                                capture_output=True, text=True, check=True)
        stats = json.loads(result.stdout)
    else:
        with Image.open(path) as image:
            bbox = image.getchannel('A').getbbox()
            stats = {'bbox': list(bbox) if bbox else None,
                     'center': [(bbox[0] + bbox[2]) / 2,
                                (bbox[1] + bbox[3]) / 2] if bbox else None,
                     'resolution': list(image.size)}
    if stats['bbox'] is None:
        raise RuntimeError(f'Empty alpha bbox: {path.name}')
    if tuple(stats['resolution']) != RESOLUTION:
        raise RuntimeError(f'Unexpected solo resolution: {stats["resolution"]}')
    stats['path'] = str(path)
    return stats


def values(owner, names):
    return {name: getattr(owner, name) for name in names}


def set_values(owner, state):
    for name, value in state.items():
        setattr(owner, name, value)


def transform_state(ob):
    return {'location': list(ob.location), 'scale': list(ob.scale),
            'rotation_mode': ob.rotation_mode,
            'rotation_euler': list(ob.rotation_euler),
            'rotation_quaternion': list(ob.rotation_quaternion),
            'rotation_axis_angle': list(ob.rotation_axis_angle),
            'parent_inverse': [list(row) for row in ob.matrix_parent_inverse],
            'parent': ob.parent, 'parent_type': ob.parent_type,
            'parent_bone': ob.parent_bone,
            'materials': tuple(ob.data.materials) if ob.type == 'MESH' else None}


class MeasurementState:
    def __init__(self, scene):
        self.scene = scene
        self.frame = (scene.frame_current, scene.frame_subframe)
        self.hide = {ob: ob.hide_render for ob in scene.objects}
        self.transforms = {ob: transform_state(ob) for ob in scene.objects}
        self.camera = scene.camera
        self.camera_matrix = self.camera.matrix_world.copy()
        self.camera_settings = values(self.camera.data,
                                      ('type', 'ortho_scale', 'shift_x', 'shift_y',
                                       'sensor_fit', 'sensor_width', 'sensor_height'))
        self.render = values(scene.render,
                             ('filepath', 'engine', 'resolution_x', 'resolution_y',
                              'resolution_percentage', 'film_transparent',
                              'use_file_extension', 'use_compositing', 'use_sequencer'))
        self.image = values(scene.render.image_settings,
                            ('file_format', 'color_mode', 'color_depth'))
        self.color = values(scene.view_settings,
                            ('view_transform', 'look', 'exposure', 'gamma',
                             'use_curve_mapping'))
        self.display = scene.display_settings.display_device
        self.object_actions = {
            ob: (ob.animation_data.action, ob.animation_data.action_slot,
                 ob.animation_data.use_nla)
            for ob in scene.objects if ob.animation_data}
        self.alpha = []
        for name in TARGETS:
            ob = bpy.data.objects[name]
            if ob.type != 'MESH' or ob.parent_type != 'BONE' or ob.parent_bone != 'head_b':
                raise RuntimeError(f'{name} is not the expected head_b-parented plane')
            mat = bpy.data.materials[f'M_{name}']
            node = next(n for n in mat.node_tree.nodes
                        if n.type == 'MATH' and n.name == 'AlphaKey'
                        and n.operation == 'MULTIPLY')
            socket = node.inputs[1]
            ad = mat.node_tree.animation_data
            driver_path = socket.path_from_id('default_value')
            self.alpha.append({'socket': socket, 'value': socket.default_value,
                               'ad': ad, 'action': ad.action if ad else None,
                               'slot': ad.action_slot if ad else None,
                               'use_nla': ad.use_nla if ad else None,
                               'drivers': [(fc, fc.mute) for fc in ad.drivers
                                           if fc.data_path == driver_path] if ad else []})
        self.untouched_axis = {}

    def enable(self):
        for state in self.alpha:
            if state['ad']:
                state['ad'].action = None
                state['ad'].use_nla = False
            for curve, _ in state['drivers']:
                curve.mute = True
            state['socket'].default_value = 1.0
        self.scene.render.film_transparent = True
        self.scene.render.use_compositing = False
        self.scene.render.use_sequencer = False
        self.scene.render.use_file_extension = True
        self.scene.render.image_settings.file_format = 'PNG'
        self.scene.render.image_settings.color_mode = 'RGBA'

    def restore(self):
        for ob, hidden in self.hide.items():
            ob.hide_render = hidden
        for state in self.alpha:
            ad = state['ad']
            if ad:
                ad.action = state['action']
                if state['slot'] is not None:
                    ad.action_slot = state['slot']
                ad.use_nla = state['use_nla']
            for curve, muted in state['drivers']:
                curve.mute = muted
            state['socket'].default_value = state['value']
        set_values(self.scene.render.image_settings, self.image)
        set_values(self.scene.render, self.render)
        self.scene.frame_set(self.frame[0], subframe=self.frame[1])
        bpy.context.view_layer.update()
        unchanged = True
        for ob, original in self.transforms.items():
            now = transform_state(ob)
            if ob.name in TARGETS:
                keep = self.untouched_axis.get(ob.name, 1)
                unchanged = unchanged and now['location'][keep] == original['location'][keep]
                del now['location']
                original = {k: v for k, v in original.items() if k != 'location'}
            unchanged = unchanged and now == original
        checks = {
            'hide_render': all(ob.hide_render == hidden for ob, hidden in self.hide.items()),
            'alpha_animation': all(
                not state['ad'] or (state['ad'].action == state['action']
                and state['ad'].action_slot == state['slot']
                and state['ad'].use_nla == state['use_nla']) for state in self.alpha),
            'alpha_values_and_drivers': all(
                state['socket'].default_value == state['value']
                and all(fc.mute == muted for fc, muted in state['drivers'])
                for state in self.alpha),
            'object_actions': all(
                (ob.animation_data.action, ob.animation_data.action_slot,
                 ob.animation_data.use_nla) == action
                for ob, action in self.object_actions.items()),
            'render': values(self.scene.render, self.render.keys()) == self.render,
            'image': values(self.scene.render.image_settings, self.image.keys()) == self.image,
            'color': values(self.scene.view_settings, self.color.keys()) == self.color
                     and self.scene.display_settings.display_device == self.display,
            'camera': self.scene.camera == self.camera
                      and self.camera.matrix_world == self.camera_matrix
                      and values(self.camera.data, self.camera_settings.keys()) == self.camera_settings,
            'frame': (self.scene.frame_current, self.scene.frame_subframe) == self.frame,
            'other_placements_patch_scale_material_parent_inverse': unchanged,
        }
        return checks


def error_of(sample, target):
    return [target[i] - sample['center'][i] for i in range(2)]


def within(error):
    return all(abs(value) <= TOLERANCE for value in error)


def solo_render(scene, state, ob, suffix):
    scene.frame_set(FRAME)
    for alpha in state.alpha:
        alpha['socket'].default_value = 1.0
    for other in scene.objects:
        if other.type in RENDERABLE_TYPES:
            other.hide_render = other != ob
    bpy.context.view_layer.update()
    path = SOLO / f'{ob.name}_f{FRAME:04d}_{suffix}.png'
    scene.render.filepath = str(path)
    bpy.ops.render.render(write_still=True)
    return alpha_stats(path)


def camera_pixel(scene, ob):
    depsgraph = bpy.context.evaluated_depsgraph_get()
    point = ob.evaluated_get(depsgraph).matrix_world.translation
    projected = world_to_camera_view(scene, scene.camera, point)
    return Vector((projected.x * RESOLUTION[0],
                   (1.0 - projected.y) * RESOLUTION[1]))


AXIS_NAMES = ('X', 'Y', 'Z')
CAP_BU = 4.0  # per-axis movement cap keeps the plane inside the ortho frustum


def screen_response(scene, ob):
    """Measured RAW screen px per +0.01 BU on each .location axis (pose-aware)."""
    start = ob.location.copy()
    bpy.context.view_layer.update()
    origin = camera_pixel(scene, ob)
    columns = {}
    try:
        for axis in range(3):
            ob.location = start
            ob.location[axis] += BU_PER_PIXEL
            bpy.context.view_layer.update()
            shift = camera_pixel(scene, ob) - origin
            columns[axis] = [float(shift.x), float(shift.y)]
    finally:
        ob.location = start
        bpy.context.view_layer.update()
    return columns


def choose_axes(columns):
    """Best-conditioned .location axis pair; depth-like axis stays untouched."""
    best = None
    for a in range(3):
        for b in range(a + 1, 3):
            det = columns[a][0] * columns[b][1] - columns[a][1] * columns[b][0]
            if best is None or abs(det) > abs(best[2]):
                best = (a, b, det)
    a, b, det = best
    if not math.isfinite(det) or abs(det) < 0.05:
        raise RuntimeError(f'no well-conditioned .location axis pair (|det|={abs(det):.4f})')
    depth = min(columns, key=lambda ax: math.hypot(*columns[ax]))
    return (a, b), det, depth


def solve_pair(cols_a, cols_b, error, damping=0.05):
    """Damped least squares on the chosen axis pair; steps in 0.01 BU units."""
    a, c = cols_a
    b, d = cols_b
    jtj = [[a * a + c * c, a * b + c * d], [a * b + c * d, b * b + d * d]]
    lam = damping * max(jtj[0][0] + jtj[1][1], 1e-9)
    m00, m01, m11 = jtj[0][0] + lam, jtj[0][1], jtj[1][1] + lam
    det = m00 * m11 - m01 * m01
    jte = [a * error[0] + c * error[1], b * error[0] + d * error[1]]
    return ((jte[0] * m11 - jte[1] * m01) / det,
            (m00 * jte[1] - m01 * jte[0]) / det)


def dominant(col):
    dim = 0 if abs(col[0]) >= abs(col[1]) else 1
    return dim, (1.0 if col[dim] > 0 else -1.0)


def fit_patch(scene, state, name, result):
    ob = bpy.data.objects[name]
    target = TARGETS[name]
    before = solo_render(scene, state, ob, 'before')
    columns = screen_response(scene, ob)
    pair, det, depth_axis = choose_axes(columns)
    state.untouched_axis[name] = depth_axis
    result.update({'target': list(target), 'bbox_before': before['bbox'],
                   'center_before': before['center'],
                   'location_before': list(ob.location), 'before': before,
                   'runtime_axes': {
                       'location_axes': [AXIS_NAMES[i] for i in pair],
                       'depth_axis_untouched': AXIS_NAMES[depth_axis],
                       'screen_px_per_0_01BU': {AXIS_NAMES[i]: columns[i] for i in columns},
                       'pair_determinant_per_0_01BU': det},
                   'corrections': [], 'iterations': 0})
    dim_a, sign_a = dominant(columns[pair[0]])
    dim_b, sign_b = dominant(columns[pair[1]])
    if dim_b == dim_a:
        dim_b = 1 - dim_a
        sign_b = 1.0 if columns[pair[1]][dim_b] > 0 else -1.0
    current = before
    pending_reverse = None
    for iteration in range(1, MAX_ROUNDS + 1):
        error = error_of(current, target)
        if within(error):
            break
        previous_location = ob.location.copy()
        if pending_reverse is not None:
            delta = pending_reverse
            pending_reverse = None
            kind = 'undo_then_reverse_previous'
        elif iteration == 1:
            delta = Vector((0.0, 0.0, 0.0))
            delta[pair[0]] = sign_a * error[dim_a] * BU_PER_PIXEL
            delta[pair[1]] += sign_b * error[dim_b] * BU_PER_PIXEL
            kind = 'nominal_0_01_BU_trial_sign'
        else:
            steps = solve_pair(columns[pair[0]], columns[pair[1]], error)
            delta = Vector((0.0, 0.0, 0.0))
            delta[pair[0]] = max(-CAP_BU, min(CAP_BU, steps[0] * BU_PER_PIXEL))
            delta[pair[1]] += max(-CAP_BU, min(CAP_BU, steps[1] * BU_PER_PIXEL))
            kind = 'runtime_jacobian_after_simple_move'
        predicted = [columns[pair[0]][i] * delta[pair[0]] / BU_PER_PIXEL
                     + columns[pair[1]][i] * delta[pair[1]] / BU_PER_PIXEL
                     for i in range(2)]
        ob.location = previous_location + delta
        bpy.context.view_layer.update()
        measured = solo_render(scene, state, ob, f'round{iteration:02d}')
        next_error = error_of(measured, target)
        actual = [measured['center'][i] - current['center'][i] for i in range(2)]
        correction = {'round': iteration, 'kind': kind,
                      'location_before': list(previous_location),
                      'signed_delta_location_BU': list(delta),
                      'location_after': list(ob.location),
                      'bbox_before': current['bbox'], 'bbox_after': measured['bbox'],
                      'center_before': current['center'], 'center_after': measured['center'],
                      'signed_error_before_px': error, 'signed_error_after_px': next_error,
                      'predicted_screen_delta_px': predicted, 'measured_screen_delta_px': actual}
        result['corrections'].append(correction)
        result['iterations'] = iteration
        doubled = [i for i in range(2) if abs(error[i]) > TOLERANCE
                   and error[i] * next_error[i] > 0
                   and abs(next_error[i]) >= 1.65 * abs(error[i])]
        if doubled:
            # Undo to the previous location; reverse from there, never compound.
            ob.location = previous_location
            bpy.context.view_layer.update()
            correction['doubled_error_axes'] = ['x' if i == 0 else 'y' for i in doubled]
            correction['undone_to_location'] = list(previous_location)
            pending_reverse = -delta
            continue
        current = measured
    result['location_after'] = list(ob.location)
    result['last_iteration_measurement'] = current

def run():
    started = time.monotonic()
    report = {'frame': FRAME, 'resolution': list(RESOLUTION),
              'coordinate_system': 'RAW camera PNG, top-left origin, no composite or flip',
              'blend': str(BLEND), 'tolerance_px': TOLERANCE,
              'nominal_BU_per_pixel': BU_PER_PIXEL, 'alpha_threshold_u8': 0,
              'max_correction_rounds': MAX_ROUNDS, 'saved': False, 'ok': False,
              'patch_shape_analysis': PATCH_SHAPE_ANALYSIS,
              'patches': {name: {'target': list(target), 'iterations': 0, 'ok': False}
                          for name, target in TARGETS.items()}}
    state = None
    failure = None
    start_locations = {}
    try:
        if not bpy.app.background:
            raise RuntimeError('Run in a new headless Blender process, not live Blender')
        if not OUT.is_dir():
            raise RuntimeError(f'Missing output directory: {OUT}')
        SOLO.mkdir(exist_ok=True)
        bpy.ops.wm.open_mainfile(filepath=str(BLEND))
        scene = bpy.context.scene
        if scene.camera is None or scene.camera.data.type != 'ORTHO':
            raise RuntimeError('Expected existing production orthographic camera')
        if ((scene.render.resolution_x, scene.render.resolution_y) != RESOLUTION
                or scene.render.resolution_percentage != 100
                or scene.render.use_border):
            raise RuntimeError('Existing production camera must render full 1536x1024')
        scene.frame_set(scene.frame_current, subframe=scene.frame_subframe)
        state = MeasurementState(scene)
        state.enable()
        start_locations = {name: bpy.data.objects[name].location.copy()
                           for name in TARGETS}
        scene.frame_set(FRAME)
        bpy.context.view_layer.update()
        report['active_object_actions'] = {
            ob.name: ad[0].name for ob, ad in state.object_actions.items() if ad[0]}
        if not report['active_object_actions']:
            raise RuntimeError('Production object/armature actions are not active')
        report['camera'] = {'name': scene.camera.name, 'engine': scene.render.engine,
                            'ortho_scale': scene.camera.data.ortho_scale}
        for name in TARGETS:
            fit_patch(scene, state, name, report['patches'][name])
        # Independently render both patches AGAIN, after both final placements.
        for name, target in TARGETS.items():
            sample = solo_render(scene, state, bpy.data.objects[name], 'verify')
            signed_error = error_of(sample, target)
            report['patches'][name].update({
                'bbox_after': sample['bbox'], 'center_after': sample['center'],
                'location_after': list(bpy.data.objects[name].location),
                'final_verification': sample, 'signed_axis_errors_px': signed_error,
                'axis_errors_px': [abs(value) for value in signed_error],
                'ok': within(signed_error)})
        if not all(patch['ok'] for patch in report['patches'].values()):
            raise RuntimeError('Solo verification did not converge within three correction rounds')
    except Exception as error:
        failure = error
    finally:
        if failure is not None and start_locations:
            # Safety rule: on any failure, restore patch locations; never partial save.
            for name, start in start_locations.items():
                ob = bpy.data.objects.get(name)
                if ob is not None and ob.location != start:
                    ob.location = start
            bpy.context.view_layer.update()
            report['location_rollback_on_failure'] = {
                name: list(loc) for name, loc in start_locations.items()}
        if state:
            try:
                report['restored'] = state.restore()
                if not all(report['restored'].values()):
                    raise RuntimeError('Measurement state did not restore exactly; refusing save')
            except Exception as error:
                failure = error
    if failure is None:
        try:
            saved = bpy.ops.wm.save_as_mainfile(filepath=str(BLEND))
            if 'FINISHED' not in saved:
                raise RuntimeError('Blender did not finish saving verified placements')
            report['saved'] = True
            report['ok'] = all(patch['ok'] for patch in report['patches'].values())
        except Exception as error:
            failure = error
    if failure:
        report['error'] = f'{type(failure).__name__}: {failure}'
        report['ok'] = False
    report['elapsed_s'] = round(time.monotonic() - started, 3)
    REPORT.write_text(json.dumps(report, indent=2) + '\n')
    rounds = ','.join(f'{name}:{item["iterations"]}' for name, item in report['patches'].items())
    print(f'FIX4_PLACE_{"OK" if report["ok"] else "FAIL"} f={FRAME} '
          f'res=1536x1024 rounds={rounds} t={report["elapsed_s"]:.2f}s', flush=True)
    if failure:
        print(f'[fix4-place] {report["error"][:240]}', flush=True)
        sys.stdout.flush()
        sys.stderr.flush()
        os._exit(2)


if __name__ == '__main__':
    run()
