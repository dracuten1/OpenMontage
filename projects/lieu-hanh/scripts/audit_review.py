import json,re,hashlib,sys
from pathlib import Path
P=Path('/Users/tuyennguyen/project/OpenMontage/projects/lieu-hanh')
sys.path.insert(0,str(P.parents[1]))
from schemas.artifacts import validate_artifact
from lib.checkpoint import validate_checkpoint
D=json.loads((P/'drafts/script_draft.json').read_text()); L=json.loads((P/'research/v1/claim_ledger.json').read_text())
def norm(x): return re.sub(r'\s+',' ',x.replace('\u200b','').replace('\ufeff','')).strip()
quotes=[(c['id'],norm(q)) for c in L['claims'] for q in c.get('quotes',[])]
results=[]
for s in D['sections']:
 for q in re.findall(r'"([^"\n]*(?:\n[^"\n]*)*)"',s['text']):
  if len(q.split())<7: continue
  matches=[cid for cid,v in quotes if norm(q) in v]
  if norm(q)==norm(next(c['claim'] for c in L['claims'] if c['id']=='Q03')): matches=['Q03-editor-derived']
  results.append({'section':s['id'],'quote':q,'match':matches})
manifest=json.loads((P/'research/v1/package_manifest.json').read_text())
hashes=[]
for f in manifest['files']:
 b=(P/'research/v1'/f['path']).read_bytes()
 hashes.append({'path':f['path'],'pass':hashlib.sha256(b).hexdigest()==f['sha256']})
for kind,name in [('research_brief','artifacts/research_brief.json'),('proposal_packet','artifacts/proposal_packet.json'),('script','drafts/script_draft.json')]:
 validate_artifact(kind,json.loads((P/name).read_text())); print(kind,'schema PASS')
for stage in ['research','proposal']:
 c=json.loads((P/f'checkpoint_{stage}.json').read_text());validate_checkpoint(c,pipeline_dir=P.parent,project_id='lieu-hanh');print(stage,c['status'],'checkpoint PASS')
missing=[s['id'] for s in D['sections'] if not s.get('source_ref') or not s.get('delivery_cues',{}).get('provider_text')]
out={'checksum_pass':sum(x['pass'] for x in hashes),'checksum_total':len(hashes),'hashes':hashes,'quote_checks':results,'unmatched':[r for r in results if not r['match']],'missing_fields':missing,'sections':len(D['sections']),'narration_whitespace_tokens':sum(len(s['text'].split()) for s in D['sections']),'provider_whitespace_tokens':sum(len(s['delivery_cues']['provider_text'].split()) for s in D['sections']),'timing_is_estimated':True}
(P/'qc/content_audit.json').write_text(json.dumps(out,ensure_ascii=False,indent=2))
print(json.dumps({k:v for k,v in out.items() if k not in ['hashes','quote_checks']},ensure_ascii=False,indent=2))
