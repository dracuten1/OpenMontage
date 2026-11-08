import hashlib
from tools.qc.scene_packet import SCHEMA_VERSION, validate_packet, integrate_scene_packet

def make(tmp_path):
    f=tmp_path/'frozen.txt'; f.write_text('stable')
    out=tmp_path/'scene'; out.mkdir(exist_ok=True)
    refs={}
    for name,content in [('audio.wav','audio'),('words.json','words'),('style.json','style'),('asset.png','asset'),('findings.json','findings')]:
        path=out/name; path.write_text(content); refs[name]=hashlib.sha256(path.read_bytes()).hexdigest()
    frozen={str(f):hashlib.sha256(f.read_bytes()).hexdigest()}; frozen.update({str(out/name):digest for name,digest in refs.items()})
    return {'packet_type':'openmontage.scene-packet','schema_version':SCHEMA_VERSION,'scene_id':'s1','claims':{'facts':['approved']},'narration':{'ref':'scene/audio.wav','sha256':refs['audio.wav']},'word_alignment':{'ref':'scene/words.json','sha256':refs['words.json']},'assets':[{'ref':'scene/asset.png','sha256':refs['asset.png'],'rights':'licensed'}],'style_contract':{'ref':'scene/style.json','sha256':refs['style.json']},'neighbor_context':{'prev':'previous scene','next':'next scene'},'allowed_io':['scene'],'frozen_inputs':frozen,'writer':{'instance_id':'w','timestamp':'now','token':'wt'},'writer_token':'wt','reviewer':{'instance_id':'r','timestamp':'now','verdict':'approved','findings_hash':refs['findings.json'],'findings_ref':'scene/findings.json','token':'rt'},'reviewer_token':'rt','integration_status':'pending'}

def test_valid_happy_path(tmp_path):
    p=make(tmp_path); assert validate_packet(p)==[]
    assert integrate_scene_packet(p,packet_path=tmp_path/'packet.json',writer_token='wt',reviewer_token='rt')['valid']

def test_schema_missing_bad_types_version(tmp_path):
    p=make(tmp_path); del p['claims']; assert any('missing fields' in x for x in validate_packet(p))
    p=make(tmp_path); p['scene_id']=4; assert any('scene_id' in x for x in validate_packet(p))
    p=make(tmp_path); p['schema_version']=9; assert any('unsupported' in x for x in validate_packet(p))
    p=make(tmp_path); p['frozen_inputs']=[]; assert any('frozen_inputs must be an object' in x for x in validate_packet(p))
    p=make(tmp_path); p['assets']=[]; assert any('non-empty' in x for x in validate_packet(p))
    p=make(tmp_path); p['neighbor_context']['prev']=' '; assert any('non-empty' in x for x in validate_packet(p))

def test_each_rejection_and_adversarial(tmp_path):
    p=make(tmp_path); p['frozen_inputs'][str(tmp_path/'frozen.txt')]='0'*64
    assert 'frozen_input_mismatch' in [x['code'] for x in integrate_scene_packet(p,packet_path=tmp_path/'p',writer_token='wt',reviewer_token='rt')['reasons']]
    p=make(tmp_path); assert 'writer_token_invalid' in [x['code'] for x in integrate_scene_packet(p,packet_path=tmp_path/'p',writer_token='forged',reviewer_token='rt')['reasons']]
    p=make(tmp_path); p['reviewer']['token']='forged'; assert 'reviewer_token_invalid' in [x['code'] for x in integrate_scene_packet(p,packet_path=tmp_path/'p',writer_token='wt',reviewer_token='forged')['reasons']]
    p=make(tmp_path); p['reviewer']['instance_id']='w'; assert 'reviewer_not_independent' in [x['code'] for x in integrate_scene_packet(p,packet_path=tmp_path/'p',writer_token='wt',reviewer_token='rt')['reasons']]
    p=make(tmp_path); p['reviewer']['verdict']='rejected'; assert 'review_rejected' in [x['code'] for x in integrate_scene_packet(p,packet_path=tmp_path/'p',writer_token='wt',reviewer_token='rt')['reasons']]
    p=make(tmp_path); result=integrate_scene_packet(p,packet_path=tmp_path/'p',writer_token='wt',reviewer_token='rt',io_operations=[{'path':'../../escape'}]); assert 'io_outside_allowlist' in [x['code'] for x in result['reasons']]
    p=make(tmp_path); result=integrate_scene_packet(p,packet_path=tmp_path/'packet.json',writer_token='wt',reviewer_token='rt',io_operations=[{'path':'scene/new.txt'}]); assert result['valid']
    p=make(tmp_path); (tmp_path/'scene/audio.wav').write_text('mutated'); codes=[x['code'] for x in integrate_scene_packet(p,packet_path=tmp_path/'packet.json',writer_token='wt',reviewer_token='rt')['reasons']]; assert 'output_hash_mismatch' in codes
    p=make(tmp_path); (tmp_path/'scene/findings.json').write_text('mutated'); codes=[x['code'] for x in integrate_scene_packet(p,packet_path=tmp_path/'packet.json',writer_token='wt',reviewer_token='rt')['reasons']]; assert 'findings_hash_mismatch' in codes
    p=make(tmp_path); other=make(tmp_path); assert 'scene_id_collision' in [x['code'] for x in integrate_scene_packet(p,packet_path=tmp_path/'p',writer_token='wt',reviewer_token='rt',episode_packets=[p,other])['reasons']]
    p=make(tmp_path); outside=tmp_path.parent/'outside-scene'; outside.mkdir(exist_ok=True); link=tmp_path/'link'; link.symlink_to(outside,target_is_directory=True); p['allowed_io']=['link']; codes=[x['code'] for x in integrate_scene_packet(p,packet_path=tmp_path/'packet.json',writer_token='wt',reviewer_token='rt',io_operations=[{'path':'link/file'}])['reasons']]; assert 'allowed_io_path_escape' in codes
    p=make(tmp_path); p['frozen_inputs']={str(tmp_path.parent/'outside.txt'):'0'*64}; assert 'frozen_input_path_escape' in [x['code'] for x in integrate_scene_packet(p,packet_path=tmp_path/'packet.json',writer_token='wt',reviewer_token='rt')['reasons']]

def test_freeze_mutation_rejected(tmp_path):
    p=make(tmp_path); (tmp_path/'frozen.txt').write_text('changed')
    res=integrate_scene_packet(p,packet_path=tmp_path/'packet.json',writer_token='wt',reviewer_token='rt')
    assert not res['valid']
    assert 'frozen_input_mismatch' in [r['code'] for r in res['reasons']]


def test_reviewer_token_equality_rejected(tmp_path):
    p=make(tmp_path)
    p['writer']['instance_id']='writer-1'
    p['reviewer']['instance_id']='reviewer-2'
    p['writer_token']='shared-token'
    p['writer']['token']='shared-token'
    p['reviewer_token']='shared-token'
    p['reviewer']['token']='shared-token'
    res=integrate_scene_packet(p,packet_path=tmp_path/'packet.json',writer_token='shared-token',reviewer_token='shared-token')
    assert 'reviewer_not_independent' in [r['code'] for r in res['reasons']]


def test_load_packet_binary_junk(tmp_path):
    import pytest
    from tools.qc.scene_packet import load_packet
    junk=tmp_path/'junk.json'; junk.write_bytes(b'\x80\xff\xfe\x00\x01\x88')
    with pytest.raises(ValueError): load_packet(junk)


def test_schema_invalid_code(tmp_path):
    res=integrate_scene_packet({'invalid':'packet'},packet_path=tmp_path/'packet.json',writer_token='wt',reviewer_token='rt')
    assert not res['valid']
    assert any(r['code']=='schema_invalid' for r in res['reasons'])


def test_scene_packet_cli_exit_codes(tmp_path):
    import subprocess, sys, json
    p=make(tmp_path); packet_file=tmp_path/'packet.json'; packet_file.write_text(json.dumps(p))
    proc0=subprocess.run([sys.executable,'tools/qc/scene_packet.py',str(packet_file)],capture_output=True,text=True)
    assert proc0.returncode==0
    inv_file=tmp_path/'inv.json'; p_inv=dict(p); p_inv['schema_version']=99; inv_file.write_text(json.dumps(p_inv))
    proc1=subprocess.run([sys.executable,'tools/qc/scene_packet.py',str(inv_file)],capture_output=True,text=True)
    assert proc1.returncode==1
    junk_file=tmp_path/'junk.json'; junk_file.write_bytes(b'\x80\xff\xfe\x00')
    proc1_junk=subprocess.run([sys.executable,'tools/qc/scene_packet.py',str(junk_file)],capture_output=True,text=True)
    assert proc1_junk.returncode==1
    proc2=subprocess.run([sys.executable,'tools/qc/scene_packet.py',str(tmp_path/'nonexistent.json')],capture_output=True,text=True)
    assert proc2.returncode==2


def test_output_missing_from_frozen_set_rejected(tmp_path):
    p=make(tmp_path); p['frozen_inputs'].pop(str(tmp_path/'scene/audio.wav'))
    assert 'output_not_frozen' in [r['code'] for r in integrate_scene_packet(p,packet_path=tmp_path/'packet.json',writer_token='wt',reviewer_token='rt')['reasons']]

def test_output_fresh_mutation_rejected(tmp_path):
    p=make(tmp_path); (tmp_path/'scene/audio.wav').write_text('changed')
    assert 'output_hash_mismatch' in [r['code'] for r in integrate_scene_packet(p,packet_path=tmp_path/'packet.json',writer_token='wt',reviewer_token='rt')['reasons']]

def test_neighbor_context_semantics(tmp_path):
    p=make(tmp_path); p['neighbor_context']={}; assert validate_packet(p)==[]
    p=make(tmp_path); p['neighbor_context']={'prev':''}; assert any('non-empty string' in e for e in validate_packet(p))
    p=make(tmp_path); p['neighbor_context']={'prev':'ok'}; assert validate_packet(p)==[]
    p=make(tmp_path); p['neighbor_context']={'bogus':'x'}; assert any('neighbor_context unknown keys' in e for e in validate_packet(p))

def test_findings_not_frozen(tmp_path):
    p=make(tmp_path); p['frozen_inputs'].pop(str(tmp_path/'scene/findings.json'))
    codes=[r['code'] for r in integrate_scene_packet(p,packet_path=tmp_path/'packet.json',writer_token='wt',reviewer_token='rt')['reasons']]
    assert 'findings_not_frozen' in codes

def test_output_path_escape(tmp_path):
    p=make(tmp_path); p['narration']['ref']='../../escaped.wav'
    codes=[r['code'] for r in integrate_scene_packet(p,packet_path=tmp_path/'packet.json',writer_token='wt',reviewer_token='rt')['reasons']]
    assert 'output_path_escape' in codes

def test_findings_hash_checks(tmp_path):
    p=make(tmp_path); (tmp_path/'scene/findings.json').write_text('corrupted')
    codes=[r['code'] for r in integrate_scene_packet(p,packet_path=tmp_path/'packet.json',writer_token='wt',reviewer_token='rt')['reasons']]
    assert 'findings_hash_mismatch' in codes
    p2=make(tmp_path); p2['reviewer']['findings_ref']=''
    codes2=[r['code'] for r in integrate_scene_packet(p2,packet_path=tmp_path/'packet.json',writer_token='wt',reviewer_token='rt')['reasons']]
    assert 'findings_hash_invalid' in codes2

def test_schema_and_output_refs_require_hash_shape(tmp_path):
    p=make(tmp_path); p['assets'][0].pop('rights')
    assert any('rights' in e for e in validate_packet(p))
    p=make(tmp_path); p['narration'].pop('sha256')
    assert any('narration requires ref and sha256' in e for e in validate_packet(p))
