"""Versioned scene-packet schema and enforceable integration gate.

The CLI validates structure plus integration using packet-carried tokens for
local checks only; production director tokens must be supplied out-of-band to
integrate_scene_packet. The integration gate always requires and verifies both
tokens, frozen inputs, writer outputs, and reviewer findings.
"""
from __future__ import annotations
import argparse, json, os, re, sys
from pathlib import Path
REPO_ROOT=Path(__file__).resolve().parents[2]
if str(REPO_ROOT) not in sys.path: sys.path.insert(0,str(REPO_ROOT))
from lib.production_provenance import hash_file

SCHEMA_VERSION = 1
REQUIRED = {'packet_type','schema_version','scene_id','claims','narration','word_alignment','assets','style_contract','neighbor_context','allowed_io','frozen_inputs','writer','writer_token','reviewer','reviewer_token','integration_status'}
OUTPUT_OBJECTS=('narration','word_alignment','style_contract')

def validate_packet(packet):
    errors=[]
    if not isinstance(packet,dict): return ['packet must be an object']
    missing=REQUIRED-packet.keys()
    if missing: errors.append('missing fields: '+', '.join(sorted(missing)))
    if packet.get('packet_type')!='openmontage.scene-packet': errors.append('packet_type must be openmontage.scene-packet')
    if packet.get('schema_version') != SCHEMA_VERSION: errors.append(f"unsupported schema_version: {packet.get('schema_version')!r}; expected {SCHEMA_VERSION}")
    for key in ('scene_id','writer_token','reviewer_token'):
        if key in packet and not isinstance(packet[key],str): errors.append(f'{key} must be a string')
    for key in ('claims','narration','word_alignment','style_contract','neighbor_context','writer','reviewer'):
        if key in packet and not isinstance(packet[key],dict): errors.append(f'{key} must be an object')
    if 'frozen_inputs' in packet and not isinstance(packet['frozen_inputs'],dict): errors.append('frozen_inputs must be an object mapping path to sha256')
    if 'allowed_io' in packet and (not isinstance(packet['allowed_io'],list) or not all(isinstance(x,str) for x in packet['allowed_io'])): errors.append('allowed_io must be an array of paths')
    if 'assets' in packet:
        assets=packet['assets']
        if not isinstance(assets,list) or not assets: errors.append('assets must be a non-empty array')
        elif any(not isinstance(a,dict) or not isinstance(a.get('ref'),str) or not a.get('ref') or not isinstance(a.get('sha256'),str) or not a.get('sha256') or not isinstance(a.get('rights'),str) or not a.get('rights') for a in assets): errors.append('each asset requires non-empty ref, sha256, and rights')
    ctx=packet.get('neighbor_context')
    if isinstance(ctx,dict):
        unknown_keys=set(ctx.keys())-{'prev','next'}
        if unknown_keys: errors.append(f'neighbor_context unknown keys: {", ".join(sorted(unknown_keys))}; only prev and next are allowed')
        for side in ('prev','next'):
            if side in ctx and (not isinstance(ctx[side],str) or not ctx[side].strip()): errors.append(f'neighbor_context.{side} must be a non-empty string when present')
    for key in OUTPUT_OBJECTS:
        obj=packet.get(key)
        if isinstance(obj,dict) and ('ref' not in obj or 'sha256' not in obj): errors.append(f'{key} requires ref and sha256')
    return errors

def _contained_path(raw, root):
    p=Path(raw); resolved=(root/p).resolve() if not p.is_absolute() else p.resolve()
    try: resolved.relative_to(root.resolve()); return resolved
    except ValueError: return None

def integrate_scene_packet(packet, *, packet_path=None, writer_token=None, reviewer_token=None, io_operations=None, episode_packets=None):
    errors=validate_packet(packet)
    if errors: return {'valid':False,'reasons':[{'code':'schema_invalid','message':x} for x in errors]}
    reasons=[]
    root=Path(packet_path).resolve().parent if packet_path else Path.cwd().resolve()
    frozen=packet['frozen_inputs']
    frozen_hashes={}
    for name, expected in frozen.items():
        resolved=_contained_path(name,root)
        if resolved is None:
            reasons.append({'code':'frozen_input_path_escape','message':f'frozen input outside episode root: {name}'}); continue
        digest=hash_file(resolved); frozen_hashes[resolved]=digest
        if not digest or digest != expected: reasons.append({'code':'frozen_input_mismatch','message':f'frozen input changed or missing: {name}'})
    out_refs=[]
    for field in OUTPUT_OBJECTS:
        ref=packet[field]['ref']; expected=packet[field]['sha256']; out_refs.append((ref,expected))
    for asset in packet['assets']: out_refs.append((asset['ref'],asset['sha256']))
    for ref,expected in out_refs:
        resolved=_contained_path(ref,root)
        if resolved is None:
            reasons.append({'code':'output_path_escape','message':f'writer output outside episode root: {ref}'}); continue
        actual=hash_file(resolved)
        if not actual or actual != expected: reasons.append({'code':'output_hash_mismatch','message':f'writer output hash mismatch or missing: {ref}'})
        if resolved not in frozen_hashes or frozen_hashes.get(resolved) != expected:
            reasons.append({'code':'output_not_frozen','message':f'writer output absent from frozen_inputs or frozen hash differs: {ref}'})
    if not writer_token or writer_token != packet.get('writer_token') or writer_token != packet['writer'].get('token'):
        reasons.append({'code':'writer_token_invalid','message':'writer token missing or mismatched'})
    reviewer=packet['reviewer']; verdict=reviewer.get('verdict')
    if not reviewer_token or reviewer_token != packet.get('reviewer_token') or reviewer_token != reviewer.get('token'):
        reasons.append({'code':'reviewer_token_invalid','message':'reviewer token missing or mismatched'})
    if verdict != 'approved': reasons.append({'code':'review_rejected','message':'reviewer sign-off missing or verdict rejected'})
    rid=reviewer.get('instance_id'); wid=packet['writer'].get('instance_id')
    wt=packet['writer'].get('token') or packet.get('writer_token')
    rt=reviewer.get('token') or packet.get('reviewer_token')
    if not rid or not wid or rid == wid:
        reasons.append({'code':'reviewer_not_independent','message':'writer and reviewer require distinct, non-empty instance ids'})
    elif not wt or not rt or wt == rt:
        reasons.append({'code':'reviewer_not_independent','message':'reviewer token matches writer token; review must be independent'})
    findings=reviewer.get('findings_ref'); expected_findings=reviewer.get('findings_hash')
    if not isinstance(findings,str) or not isinstance(expected_findings,str) or not findings or not expected_findings:
        reasons.append({'code':'findings_hash_invalid','message':'reviewer findings_ref and findings_hash are required'})
    else:
        findings_path=_contained_path(findings,root); actual=hash_file(findings_path) if findings_path else ''
        if not actual or actual != expected_findings: reasons.append({'code':'findings_hash_mismatch','message':'reviewer findings hash mismatch or file missing'})
        if findings_path not in frozen_hashes or frozen_hashes.get(findings_path) != expected_findings: reasons.append({'code':'findings_not_frozen','message':'reviewer findings absent from frozen_inputs or hash differs'})
    allowed=[]
    for item in packet['allowed_io']:
        resolved=_contained_path(item,root)
        if resolved is None: reasons.append({'code':'allowed_io_path_escape','message':f'allowed_io path outside episode root: {item}'})
        else: allowed.append(resolved)
    sid=str(packet.get('scene_id') or '')
    other_sids=set()
    for other in episode_packets or []:
        if isinstance(other, dict):
            other_id = other.get('scene_id')
            if other_id and str(other_id) != sid:
                other_sids.add(str(other_id))
        elif isinstance(other, str) and other and other != sid:
            other_sids.add(other)

    for op in io_operations or []:
        target=_contained_path(op.get('path',''),root)
        is_target_allowed=False
        if target is not None and any(target==a or a in target.parents for a in allowed):
            is_target_allowed=True
            rel_t=None
            try: rel_t=target.relative_to(root.resolve()).as_posix()
            except ValueError: pass
            if rel_t and sid:
                base_t=os.path.basename(rel_t)
                if base_t.startswith("packet_") and base_t != f"packet_{sid}.json":
                    is_target_allowed=False
                elif base_t.endswith("_findings.json") and base_t != f"{sid}_findings.json":
                    is_target_allowed=False
                elif rel_t.startswith('scene/') and not (rel_t.startswith(f'scene/{sid}/') or rel_t == f'scene/{sid}' or rel_t.count('/') == 1):
                    is_target_allowed=False
                elif other_sids:
                    for other_sid in other_sids:
                        if re.search(rf"(?:^|[_\-.#/]){re.escape(other_sid)}(?:[_\-.#/]|$)", rel_t):
                            is_target_allowed=False
                            break
        if not is_target_allowed:
            reasons.append({'code':'io_outside_allowlist','message':f"IO outside allowed_io: {op.get('path')}"})
    for other in episode_packets or []:
        if other is not packet and other.get('scene_id') == packet.get('scene_id'):
            reasons.append({'code':'scene_id_collision','message':f"duplicate scene_id: {packet.get('scene_id')}"}); break
    return {'valid':not reasons,'reasons':reasons}

def load_packet(path):
    p=Path(path)
    if not p.is_file(): raise FileNotFoundError(f'file not found: {path}')
    try: return json.loads(p.read_text(encoding='utf-8'))
    except (json.JSONDecodeError,UnicodeDecodeError) as e: raise ValueError(f'malformed packet file: {e}') from e
    except OSError as e: raise RuntimeError(str(e)) from e

def main(argv=None):
    parser=argparse.ArgumentParser(description='Validate scene packet'); parser.add_argument('packet'); args=parser.parse_args(argv)
    try: packet=load_packet(args.packet)
    except FileNotFoundError as e: print(f'ERROR — {e}',file=sys.stderr); return 2
    except (ValueError,RuntimeError) as e: print(f'FAIL — malformed packet: {e}'); return 1
    except Exception as e: print(f'ERROR — {e}',file=sys.stderr); return 2
    errors=validate_packet(packet)
    if errors:
        print('FAIL — scene packet invalid')
        for e in errors: print(f'- {e}')
        return 1
    result=integrate_scene_packet(packet,packet_path=args.packet,writer_token=packet.get('writer_token'),reviewer_token=packet.get('reviewer_token'))
    if not result['valid']:
        print('FAIL — scene integration rejected')
        for r in result['reasons']: print(f"- {r['code']}: {r['message']}")
        return 1
    print('PASS — scene packet valid and integrated'); return 0
if __name__=='__main__': sys.exit(main())
