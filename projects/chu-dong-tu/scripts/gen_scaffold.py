"""Scaffold compose: Episode.tsx + scenes-a..f.tsx stubs + spec_<group>.json (từ plan).
Stubs render được (Paper + title) để tsc/render pass ngay; CC workers thay từng Sc bằng scene thật."""
import json
import re
from pathlib import Path

REPO = Path("/Users/tuyennguyen/project/OpenMontage")
PROJ = REPO / "projects" / "chu-dong-tu"
SRC = REPO / "remotion-composer" / "src" / "chu-dong-tu"
plan = json.loads((PROJ / "artifacts" / "scene_plan.json").read_text())
scenes = sorted(plan["scenes"], key=lambda s: s["id"])
assert len(scenes) == 63

GROUPS = {"a": (1, 11), "b": (12, 21), "c": (22, 32), "d": (33, 42), "e": (43, 52), "f": (53, 63)}

STUB = """// S2E03 chu-dong-tu scenes group {G} — SCAFFOLD STUBS (CC worker sẽ thay từng Sc bằng scene thật).
// ĐỪNG xóa export nào; chỉ thay body từng component theo spec_{G}.json.
import React from "react";
import {{ AbsoluteFill }} from "remotion";
import {{ Paper, Reveal, useA, useFrac }} from "./common";
import {{ SceneProps }} from "./theme";

{BODIES}
"""

BODY = """export const Sc{n3}: React.FC<SceneProps> = () => {{
  const {{ p }} = useFrac();
  return (
    <AbsoluteFill style={{{{ backgroundColor: "#101418" }}}}>
      <Paper variant="myth" />
      <div style={{{{ position: "absolute", top: 400, width: "100%", textAlign: "center", color: "#e8d9b0", fontSize: 30, opacity: p(0, 12) }}}}>
        STUB sc{n3}
      </div>
    </AbsoluteFill>
  );
}};
"""

for g, (lo, hi) in GROUPS.items():
    bodies = []
    for i in range(lo, hi + 1):
        bodies.append(BODY.format(n3=f"{i:03d}", G=g))
    (SRC / f"scenes-{g}.tsx").write_text(STUB.format(G=g, BODIES="".join(bodies)))
    print(f"scenes-{g}.tsx: Sc{lo:03d}–Sc{hi:03d}")

EPISODE = """// VN-Myth S2E03 "Chử Đồng Tử" — episode assembly.
// One Sequence per scene from TIMING (generated from artifacts/scene_timing.json),
// each wrapped with AnchorProvider (speech-lock anchors) + SceneDurProvider.
// Audio: narration_full.wav @1.0; background_music.mp3 envelope 0→0.32 (30f ramp-in),
// hold 0.32, fade to 0 over the last 90 frames — interpolated on absolute frame.
import React from "react";
import { AbsoluteFill, Audio, Sequence, staticFile, useVideoConfig } from "remotion";
import * as groupA from "./scenes-a";
import * as groupB from "./scenes-b";
import * as groupC from "./scenes-c";
import * as groupD from "./scenes-d";
import * as groupE from "./scenes-e";
import * as groupF from "./scenes-f";
import { AnchorProvider, SceneDurProvider } from "./common";
import { TIMING } from "./timing";
import { SceneProps } from "./theme";
import { DraftHud } from "./draft-hud";

type SceneComponent = React.FC<SceneProps>;

const keyOf = (exportName: string): string | null => {
  const m = /^Sc(\\d{2,})$/.exec(exportName);
  return m ? `sc${m[1].padStart(3, "0")}` : null;
};

const SCENES: Record<string, SceneComponent> = {};
for (const group of [groupA, groupB, groupC, groupD, groupE, groupF]) {
  for (const [name, Comp] of Object.entries(group)) {
    const sceneId = keyOf(name);
    if (sceneId && typeof Comp === "function") {
      SCENES[sceneId] = Comp as SceneComponent;
    }
  }
}

/** total composition length from TIMING */
export const CHU_DONG_TU_FRAMES = TIMING.reduce(
  (acc, t) => Math.max(acc, t.startFrame + t.durationInFrames),
  0
);

export type EpisodeProps = {
  withMusic?: boolean;
  /** DRAFT-HUD: chỉ bật ở composition ChuDongTuDraft (duyệt draft). Default OFF. */
  draftHud?: boolean;
};

export const ChuDongTuEpisode: React.FC<EpisodeProps> = ({ withMusic = true, draftHud = false }) => {
  const { durationInFrames } = useVideoConfig();
  return (
    <AbsoluteFill style={{ backgroundColor: "#000000" }}>
      {TIMING.map((t) => {
        const Scene = SCENES[t.sceneId];
        if (!Scene) return null;
        return (
          <Sequence
            key={t.sceneId}
            from={t.startFrame}
            durationInFrames={t.durationInFrames}
            name={t.sceneId}
          >
            <AnchorProvider sectionId={t.sectionId} startFrame={t.startFrame}>
              <SceneDurProvider durationInFrames={t.durationInFrames}>
                <Scene durationInFrames={t.durationInFrames} />
              </SceneDurProvider>
            </AnchorProvider>
          </Sequence>
        );
      })}
      <Audio src={staticFile("chu-dong-tu/narration_full.wav")} volume={1} />
      {withMusic ? (
        <Audio
          src={staticFile("chu-dong-tu/background_music.mp3")}
          volume={(f) => {
            const fadeIn = Math.min(1, f / 30);
            const fadeOut = Math.min(1, (durationInFrames - f) / 90);
            return 0.32 * Math.min(fadeIn, fadeOut);
          }}
        />
      ) : null}
      {draftHud ? <DraftHud /> : null}
    </AbsoluteFill>
  );
};
"""
(SRC / "Episode.tsx").write_text(EPISODE)
print("Episode.tsx written")

# specs per group
stext = {s["id"]: s["text"] for s in json.loads((PROJ / "artifacts" / "script.json").read_text())["sections"]}
LOGS = PROJ / "logs" / "parts"
LOGS.mkdir(parents=True, exist_ok=True)
for g, (lo, hi) in GROUPS.items():
    spec = {"group": g, "scenes": []}
    for sc in scenes:
        n = int(sc["id"][2:])
        if not (lo <= n <= hi):
            continue
        spec["scenes"].append({
            "sceneId": sc["id"],
            "exportName": f"Sc{n:03d}",
            "sectionId": sc["script_section_id"],
            "type": sc["type"],
            "description": sc["description"],
            "anchors": re.findall(r"«([^»]+)»", sc.get("overlay_notes", "") or ""),
            "narration": stext[sc["script_section_id"]],
            "assets": sc.get("required_assets", []),
            "shot_intent": sc.get("shot_intent", ""),
            "texture": sc.get("texture_keywords", []),
        })
    (LOGS / f"spec_{g}.json").write_text(json.dumps(spec, ensure_ascii=False, indent=1))
    print(f"spec_{g}.json: {len(spec['scenes'])} scenes")
