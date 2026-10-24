import importlib.util
import json
from pathlib import Path
import shutil

import pytest

REPO = Path(__file__).resolve().parents[3]
SCRIPT = Path(__file__).with_name('closeout_v2.py')


def test_missing_render_does_not_change_project(tmp_path):
    assert SCRIPT.exists(), 'deferred closeout script is missing'
    spec = importlib.util.spec_from_file_location('closeout_v2', SCRIPT)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    project = tmp_path / 'projects' / 'france-riots-20261023'
    project.mkdir(parents=True)
    sentinel = project / 'checkpoint_publish.json'
    sentinel.write_text('original')
    with pytest.raises(FileNotFoundError):
        module.closeout(tmp_path, project)
    assert sentinel.read_text() == 'original'
    assert not (project / 'history').exists()


def test_isolated_closeout_keeps_draft_and_schema_contracts(tmp_path, monkeypatch):
    assert SCRIPT.exists(), 'deferred closeout script is missing'
    spec = importlib.util.spec_from_file_location('closeout_v2', SCRIPT)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    source = REPO / 'projects/france-riots-20261023'
    project = tmp_path / 'projects' / source.name
    project.mkdir(parents=True)
    for file in source.glob('checkpoint_*.json'):
        shutil.copy2(file, project / file.name)
    shutil.copy2(source / 'project.json', project / 'project.json')
    shutil.copytree(source / 'artifacts', project / 'artifacts')
    public = tmp_path / 'remotion-composer/public' / source.name
    public.parent.mkdir(parents=True)
    public.symlink_to(REPO / 'remotion-composer/public' / source.name, target_is_directory=True)
    src = tmp_path / 'remotion-composer/src' / source.name
    src.parent.mkdir(parents=True)
    src.symlink_to(REPO / 'remotion-composer/src' / source.name, target_is_directory=True)
    render = project / 'renders/france-riots-v2-draft-hud.mp4'
    render.parent.mkdir()
    render.write_bytes(b'isolated fixture; probe supplied below')
    original = (project / 'checkpoint_assets.json').read_bytes()
    real_probe = module.probe
    def probe(path):
        if path == render:
            timing = json.loads((public / 'v2/scene_timing.json').read_text())
            return {'format': {'duration': str(timing['total_frames']/30)}, 'streams': [
                {'codec_type': 'video', 'codec_name': 'h264', 'width': 1080,
                 'height': 1920, 'avg_frame_rate': '30/1'},
                {'codec_type': 'audio', 'codec_name': 'aac'}]}
        return real_probe(path)
    monkeypatch.setattr(module, 'probe', probe)
    module.closeout(tmp_path, project)
    from schemas.artifacts import validate_artifact
    from lib.checkpoint import validate_checkpoint
    for stage, name in module.STAGES.items():
        artifact = json.loads((project / 'artifacts' / f'{name}.json').read_text())
        validate_artifact(name, artifact)
        cp = json.loads((project / f'checkpoint_{stage}.json').read_text())
        validate_checkpoint(cp)
        assert cp['pipeline_type'] == 'hybrid'
    publish = json.loads((project / 'checkpoint_publish.json').read_text())
    assert publish['status'] == 'awaiting_human'
    assert publish['human_approved'] is False
    assert publish['artifacts']['publish_log']['entries'][0]['status'] == 'pending_review'
    review = json.loads((project / 'artifacts/final_review.json').read_text())
    validate_artifact('final_review', review)
    assert review['status'] == 'revise'
    assert 'mix_intelligible' not in review['checks']['audio_spotcheck']
    backups = list((project / 'history').glob('closeout-v2-*/checkpoint_assets.json'))
    assert backups and backups[0].read_bytes() == original
    manifest = json.loads((project / 'artifacts/asset_manifest.json').read_text())
    assert len([a for a in manifest['assets'] if a['type'] == 'narration']) == 21
    assert all('/public/' in a['path'] for a in manifest['assets'] if a['type'] == 'narration')
