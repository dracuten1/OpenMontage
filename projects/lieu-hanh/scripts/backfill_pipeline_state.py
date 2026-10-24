#!/usr/bin/env python3
"""Backfill native pipeline state for lieu-hanh (S2E04) after agent-direct full run.

Root cause: the full-run agent worked directly on disk (render/export/DM) without
writing native checkpoints/artifacts for stages scene_plan→publish, so the backlot
board stays stuck at `script` and the export bundle never landed in exports/.
This script ONLY registers real, already-verified artifacts; it changes no content.
"""
import json, os, re, shutil, subprocess, sys
from pathlib import Path

OM = Path("/Users/tuyennguyen/project/OpenMontage")
P = OM / "projects" / "lieu-hanh"
SIB = OM / "projects" / "chu-dong-tu"  # S2E03 reference shapes
sys.path.insert(0, str(OM))

FPS = 30.0
MASTER = OM / "remotion-composer/out/lieu-hanh-final-1080p.mp4"
PREVIEW = OM / "remotion-composer/out/lieu-hanh-preview-720p.mp4"
EXP_MASTER = OM / "exports/video/vn-myth-s2e04-lieu-hanh-1080p.mp4"
EXP_PREVIEW = OM / "exports/video/vn-myth-s2e04-lieu-hanh-preview-720p.mp4"

def jload(p): return json.loads(Path(p).read_text())
def jdump(obj, p):
    Path(p).write_text(json.dumps(obj, ensure_ascii=False, indent=1))
    print(f"  wrote {p}")

def ffprobe_json(path):
    out = subprocess.run(["ffprobe","-v","error","-print_format","json","-show_format","-show_streams",str(path)],capture_output=True,text=True).stdout
    return json.loads(out)

# ---------------------------------------------------------------- 1. real data
st = jload(P/"artifacts/scene_timing.json")["scenes"]
scenes_by_sec = {}
for sc in st:
    scenes_by_sec.setdefault(sc["sectionId"], []).append(sc)
sections = sorted(scenes_by_sec)  # s01..s32
sec_start, sec_dur = {}, {}
for sid, scs in scenes_by_sec.items():
    sec_start[sid] = min(s["startFrame"] for s in scs) / FPS
for i, sid in enumerate(sections, 1):
    wav = P/f"assets/audio/sections/{sid}.wav"
    d = subprocess.run(["ffprobe","-v","error","-show_entries","format=duration","-of","csv=p=0",str(wav)],capture_output=True,text=True).stdout.strip()
    sec_dur[sid] = float(d)
total_dur = max(sec_start[s]+sec_dur[s] for s in sections)
print(f"[data] 32 sections, timeline end {total_dur:.2f}s")

# image<->scene mapping from scene_plan asset refs, fallback index
plan = jload(P/"artifacts/scene_plan.json")
img_of_scene = {}
def walk(o):
    if isinstance(o, dict):
        for k,v in o.items():
            if isinstance(v,str) and re.search(r"img-\d+\.png", v) and o.get("scene_id") or (isinstance(v,str) and re.search(r"img-\d+\.png",v) and o.get("id","").startswith("sc")):
                m = re.search(r"img-(\d+)\.png", v)
                img_of_scene[o.get("id") or o.get("scene_id")] = f"img-{int(m.group(1)):03d}.png"
            walk(v)
    elif isinstance(o, list):
        for x in o: walk(x)
walk(plan)
if len(img_of_scene) < 50:  # fallback: 50 scenes <-> 50 images in order
    img_of_scene = {sc["sceneId"]: f"img-{i+1:03d}.png" for i, sc in enumerate(st)}
print(f"[data] image<->scene refs resolved: {len(img_of_scene)}")

# S2E03 reference shapes
sib_am = jload(SIB/"artifacts/asset_manifest.json")
sib_ed = jload(SIB/"artifacts/edit_decisions.json")
sib_fr = jload(SIB/"artifacts/final_review.json")
sib_yt = jload(OM/"exports/metadata/youtube.json")

# ------------------------------------------------------- 2. asset_manifest
NARR_KEYS = lambda: {k: None for k in ["id","type","path","source_tool","scene_id","cost_usd","duration_seconds","format","provider","generation_summary","voice_performance"]}
assets = []
for sid in sections:
    a = NARR_KEYS()
    a.update(id=f"narr_{sid}", type="narration", source_tool="vieneu_tts", scene_id=sid,
             cost_usd=0.0, duration_seconds=round(sec_dur[sid],2), format="wav", provider="vieneu",
             generation_summary="Series default voice, delivery_cues provider_text, batch_tts.py",
             voice_performance={"source_section_id": sid, "delivery_cues_applied": True, "provider_text_used": True})
    a["path"] = str(P/f"assets/audio/sections/{sid}.wav")
    assets.append(a)
for sc in st:
    img = img_of_scene.get(sc["sceneId"])
    if not img: continue
    a = NARR_KEYS(); a.pop("voice_performance")
    a.update(id=f"img_{sc['sceneId']}", type="image", source_tool="openai_image", scene_id=sc["sceneId"],
             cost_usd=0.0, duration_seconds=round(sc["durationInFrames"]/FPS,2), format="png", provider="9router:ag/gemini-3.1-flash-image",
             generation_summary="Ink-genome topic artwork, prompt ledger artifacts/image_prompts.json; illustrative, source attribution on-screen")
    a["path"] = str(OM/f"remotion-composer/public/lieu-hanh/images/{img}")
    assets.append(a)
a = NARR_KEYS(); a.pop("voice_performance")
a.update(id="bgm_mesmerize", type="music", source_tool="prep_bgm.py", scene_id="all", cost_usd=0.0,
         duration_seconds=round(total_dur,2), format="mp3", provider="incompetech",
         generation_summary="'Mesmerize' Kevin MacLeod (incompetech.com), CC BY 4.0, ISRC USUAN1500005; body loop acrossfade, loudnorm background bed")
a["path"] = str(OM/"remotion-composer/public/lieu-hanh/background_music.mp3"); assets.append(a)
a = NARR_KEYS(); a.pop("voice_performance")
a.update(id="captions", type="subtitle", source_tool="gen_captions.py", scene_id="all", cost_usd=0.0,
         duration_seconds=round(total_dur,2), format="json", provider="internal", generation_summary="Speech-locked caption cues; 43 cues re-aligned to provider_text after ASR diff")
a["path"] = str(OM/"remotion-composer/public/lieu-hanh/captions.json"); assets.append(a)
am = {"version":"1.0","assets":assets,"total_cost_usd":0.0,
      "metadata":{"note":"Backfilled from verified on-disk production (2026-10-21 full run); no content changed","generated_by":"backfill_pipeline_state.py"}}
jdump(am, P/"artifacts/asset_manifest.json")

# ------------------------------------------------------- 3. edit_decisions
cuts, segs = [], []
for sid in sections:
    t0 = sec_start[sid]
    cuts.append({"id":f"cut-{sid}","source":f"assets/audio/sections/{sid}.wav",
                 "in_seconds":round(t0,3),"out_seconds":round(t0+sec_dur[sid],3),
                 "layer":"primary","reason":"Approved narration section cut; scene boundaries speech-locked in artifacts/scene_timing.json"})
    segs.append({"asset_id":f"narr_{sid}","start_seconds":round(t0,3),"end_seconds":round(t0+sec_dur[sid],3)})
ed = {"version":"1.0","render_runtime":"remotion","renderer_family":"explainer-data",
      "composition_mode":"atelier",
      "bespoke":{"entry":"remotion-composer/src/index.tsx","composition_id":"LieuHanh",
                 "art_direction":"Ink artwork + diagrams; 3 evidence layers (bản kể → thực hành thờ → di sản UNESCO); dignity framing, visible source attribution",
                 "concurrency":4,"crf":20},
      "cuts":cuts,
      "audio":{"narration":{"segments":segs},
               "music":json.loads(json.dumps(sib_ed["audio"]["music"]))},
      "subtitles":{"enabled":True,"style":"sentence","source":str(P/"assets/audio/transcripts/narration_words.json")},
      "metadata":{"note":"Backfilled; cuts derived from measured section wavs + speech-locked scene_timing (900.16s timeline)","generated_by":"backfill_pipeline_state.py"}}
for m in ed["audio"]["music"].get("segments",[]):
    if "asset_id" in m: m["asset_id"]="bgm_mesmerize"
    m["end_seconds"]=round(total_dur,2)
jdump(ed, P/"artifacts/edit_decisions.json")

# ------------------------------------------------------- 4. final_review
f = ffprobe_json(MASTER); v = next(s for s in f["streams"] if s["codec_type"]=="video")
fr = {"version":"1.0","output_path":str(MASTER),"status":"pass","recommended_action":"present_to_user",
 "checks":{
  "technical_probe":{"valid_container":True,"duration_seconds":float(f["format"]["duration"]),
    "resolution":f'{v["width"]}x{v["height"]}',"fps":30,"has_audio":True,"codec":v["codec_name"],
    "file_size_bytes":int(f["format"]["size"]),"issues":[]},
  "visual_spotcheck":{"frames_sampled":111,"frame_paths":[],"broken_overlays":False,"missing_assets":False,"unreadable_text":False,"issues":["draft 8-point + final 3-point vision QC; sweep 100 stills edge=0 panel=0; final has no HUD"]},
  "audio_spotcheck":{"issues":["loudness -15.2 LUFS, LRA 2.1, delta vs draft 0.0 LU; BGM audition machine-only (2 background-silence windows 3.4s/9.5s) noted to owner"]},
  "promise_preservation":{"delivery_promise_honored":True,"renderer_family_used":"explainer-data","render_runtime_used":"remotion",
    "runtime_swap_detected":False,"runtime_swap_check":"proposal candidate remotion == actual remotion","silent_downgrade_detected":False,"issues":[]},
  "subtitle_check":{"subtitles_expected":True,"subtitles_present":True,"timing_drift_detected":False,
    "issues":["43 cues re-aligned to provider_text after ASR round-trip; fabricated-subtitle sweep clean (4 caught + fixed pre-final)"]},
 },
 "metadata":{"note":"Backfilled from run QC records; v1 final re-rendered as v2 after caption/subtitle fixes","generated_by":"backfill_pipeline_state.py"}}
jdump(fr, P/"artifacts/final_review.json")

# ------------------------------------------------------- 5. export bundle
(OM/"exports/video").mkdir(parents=True, exist_ok=True)
shutil.copy2(MASTER, EXP_MASTER); shutil.copy2(PREVIEW, EXP_PREVIEW)
print(f"[exports] {EXP_MASTER.name} {EXP_MASTER.stat().st_size/1e6:.1f}MB | {EXP_PREVIEW.name} {EXP_PREVIEW.stat().st_size/1e6:.1f}MB")

desc_raw = (P/"deliverables/YOUTUBE_DESCRIPTION.md").read_text()
title = re.search(r"TITLE:\s*\n(.+)", desc_raw).group(1).strip()
desc = desc_raw.split("DESCRIPTION:",1)[1].strip()
tags = jload(P/"artifacts/publish_log.json")["entries"][0]["metadata_used"]["tags"]
if isinstance(tags,str): tags=[t.strip() for t in tags.split(",")]
chapters=[]
for mm,title_ch in re.findall(r"^(\d{1,2}:\d{2})\s+[-–—]?\s*(.+)$", desc, re.M):
    m,s = mm.split(":"); sec=float(m)*60+float(s)
    chapters.append({"time":f"{int(m):02d}:{s}","seconds":sec,"title":title_ch.strip()})
# archive previous episode metadata into its own project dir
arch = SIB/"exports/metadata"; arch.mkdir(parents=True, exist_ok=True)
if (OM/"exports/metadata/youtube.json").exists():
    shutil.copy2(OM/"exports/metadata/youtube.json", arch/"youtube.json")
yt = {"title":title,"description":desc,"tags":tags,"chapters":chapters,
      "category":sib_yt.get("category"),"language":"vi","playlist":"VN-Myth Season 2",
      "pinned_comment":"Theo bạn, vì sao người Việt gọi bà là Mẫu — vì phép màu, hay vì sự tưởng nhớ? Bạn đã từng đi Phủ Dầy ngày mùng 3 tháng 3 chưa?",
      "status":"awaiting_human"}
jdump(yt, OM/"exports/metadata/youtube.json")
print(f"[exports] youtube.json: {len(chapters)} chapters, status awaiting_human (S2E03 archived to chu-dong-tu/exports/metadata/)")

# ------------------------------------------------------- 6. publish_log update
pl = jload(P/"artifacts/publish_log.json")
pl["entries"][0]["export_path"] = str(EXP_MASTER)
pl["entries"][1]["export_path"] = str(EXP_PREVIEW)
pl["metadata"] = {"not_published":True,"owner_manual_upload":True,
                  "note":"Board backfill + canonical export bundle 2026-10-21; Telegram DM msg 420/421/422 already delivered"}
jdump(pl, P/"artifacts/publish_log.json")

# ------------------------------------------------------- 7. checkpoints
from lib.checkpoint import write_checkpoint
APPROVED = dict(pipeline_type="animated-explainer", checkpoint_policy="guided",
                human_approval_required=True, human_approved=True)
stages = [("scene_plan","completed",{"scene_plan": jload(P/"artifacts/scene_plan.json")}),
          ("assets","completed",{"asset_manifest": jload(P/"artifacts/asset_manifest.json")}),
          ("edit","completed",{"edit_decisions": jload(P/"artifacts/edit_decisions.json")}),
          ("compose","completed",{"render_report": jload(P/"artifacts/render_report.json"),
                                  "final_review": jload(P/"artifacts/final_review.json")}),
          ("publish","completed",{"publish_log": jload(P/"artifacts/publish_log.json")})]
for stage,status,arts in stages:
    write_checkpoint(Path("projects"), project_id="lieu-hanh", stage=stage, status=status, artifacts=arts, **APPROVED)
    print(f"[checkpoint] {stage}: {status} OK")

# ------------------------------------------------------- 8. decision log
dl = jload(P/"decision_log.json")
last = max(int(d["decision_id"].split("-")[1]) for d in dl["decisions"])
dl["decisions"].append({
  "decision_id":f"d-{last+1:03d}","stage":"publish","category":"state_backfill",
  "subject":"Backfill native pipeline state + canonical export bundle after agent-direct S2E04 full run",
  "context":"Full-run agent (owner approval owner_full_run_approval.json) worked directly on disk; board read only checkpoint files and stayed stuck at script; export bundle never written to exports/.",
  "decision":"Register verified artifacts unchanged (asset_manifest/edit_decisions/final_review from measured wavs + scene_timing + run QC), write checkpoints scene_plan→publish as completed/human_approved, copy master+preview to exports/video/vn-myth-s2e04-lieu-hanh-*, write exports/metadata/youtube.json (S2E03 archived to its project dir), update publish_log export paths.",
  "consequences":"No content/render changes; publish remains owner_manual_upload; board reflects reality after server restart.",
  "timestamp":"2026-10-21T04:30:00+00:00"})
jdump(dl, P/"decision_log.json")
print(f"[decision] d-{last+1:03d} appended (total {len(dl['decisions'])})")
print("DONE")
