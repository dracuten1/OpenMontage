# Archive 2026-10-15 — legacy rigs/sprites Ep.01 (post-v7 cleanup)

Nội dung KHÔNG được comp KidsStoryEp1Remake (v7) tham chiếu. Muốn khôi phục: `mv <file> <path gốc>` theo bảng.

| nguồn | đích |
|---|---|
| remake/rig_rabbit_run | character-performer/kids/_archive/2026-10-15/rig_rabbit_run |
| remake/rig_turtle_walk | character-performer/kids/_archive/2026-10-15/rig_turtle_walk |
| remake/bg_d5_back_v1_banner.png | character-performer/kids/_archive/2026-10-15/remake/bg_d5_back_v1_banner.png |
| remake/schematic_d5_back.png | character-performer/kids/_archive/2026-10-15/remake/schematic_d5_back.png |
| dialogue | character-performer/kids/_archive/2026-10-15/dialogue |
| k_bgm.wav | character-performer/kids/_archive/2026-10-15/mascot_demo/k_bgm.wav |
| k_narration.wav | character-performer/kids/_archive/2026-10-15/mascot_demo/k_narration.wav |
| k_narration_v2.wav | character-performer/kids/_archive/2026-10-15/mascot_demo/k_narration_v2.wav |
| k_base.png | character-performer/kids/_archive/2026-10-15/mascot_demo/k_base.png |
| k_bg_clean.png | character-performer/kids/_archive/2026-10-15/mascot_demo/k_bg_clean.png |
| k_blink.png | character-performer/kids/_archive/2026-10-15/mascot_demo/k_blink.png |
| k_v0.png | character-performer/kids/_archive/2026-10-15/mascot_demo/k_v0.png |
| k_v2.png | character-performer/kids/_archive/2026-10-15/mascot_demo/k_v2.png |
| k_v3.png | character-performer/kids/_archive/2026-10-15/mascot_demo/k_v3.png |
| k_mouthcues.json | character-performer/kids/_archive/2026-10-15/mascot_demo/k_mouthcues.json |
| k_mouthcues_v2.json | character-performer/kids/_archive/2026-10-15/mascot_demo/k_mouthcues_v2.json |
| depth_demo/bg_far.png | character-performer/kids/_archive/2026-10-15/depth_demo/bg_far.png |
| depth_demo/rabbit_sleep.png | character-performer/kids/_archive/2026-10-15/depth_demo/rabbit_sleep.png |
| depth_demo/strip_mid.png | character-performer/kids/_archive/2026-10-15/depth_demo/strip_mid.png |
| depth_demo/tree_sleep.png | character-performer/kids/_archive/2026-10-15/depth_demo/tree_sleep.png |
| depth_demo/turtle_base.png | character-performer/kids/_archive/2026-10-15/depth_demo/turtle_base.png |
| ep1_ai/rabbit_run1.png | character-performer/kids/_archive/2026-10-15/ep1_ai/rabbit_run1.png |
| ep1_ai/rabbit_run2.png | character-performer/kids/_archive/2026-10-15/ep1_ai/rabbit_run2.png |
| ep1_ai/rabbit_shock.png | character-performer/kids/_archive/2026-10-15/ep1_ai/rabbit_shock.png |
| ep1_ai/rabbit_shock_m0.png | character-performer/kids/_archive/2026-10-15/ep1_ai/rabbit_shock_m0.png |
| ep1_v2/bg5_nap.png | character-performer/kids/_archive/2026-10-15/ep1_v2/bg5_nap.png |
| ep1_v2/bg6_walk.png | character-performer/kids/_archive/2026-10-15/ep1_v2/bg6_walk.png |
| ep1_v2/bg7_sunset.png | character-performer/kids/_archive/2026-10-15/ep1_v2/bg7_sunset.png |
| sprite_lib/rabbit/rabbit_front_talk_mO.png | character-performer/kids/_archive/2026-10-15/sprite_lib/rabbit_front_talk_mO.png |
| sprite_lib/rabbit/rabbit_side_talk_mO.png | character-performer/kids/_archive/2026-10-15/sprite_lib/rabbit_side_talk_mO.png |
| sprite_lib/rabbit/rabbit_wake_shock.png | character-performer/kids/_archive/2026-10-15/sprite_lib/rabbit_wake_shock.png |
| sprite_lib/rabbit/rabbit_sleeping.png | character-performer/kids/_archive/2026-10-15/sprite_lib/rabbit_sleeping.png |
| sprite_lib/turtle/turtle_front_talk_mO.png | character-performer/kids/_archive/2026-10-15/sprite_lib/turtle_front_talk_mO.png |
| sprite_lib/turtle/turtle_walk_talk_mO.png | character-performer/kids/_archive/2026-10-15/sprite_lib/turtle_walk_talk_mO.png |
| scenes | character-performer/kids/_archive/2026-10-15/scenes |
| sprites | character-performer/kids/_archive/2026-10-15/sprites |
| remotion-composer/public/kids_ep1v5 | character-performer/kids/_archive/2026-10-15/kids_ep1v5 |
| remotion-composer/public/kids_ep1v8 | character-performer/kids/_archive/2026-10-15/kids_ep1v8 |
## Restored sau verify (build-time imports của các comp cũ trong Root.tsx)
- k_mouthcues.json, k_mouthcues_v2.json → về public (import tĩnh bởi KidsRabbitCode/Demo/Layered)
- kids_ep1v5/, kids_ep1v8/ → về public (import tĩnh bởi KidsStoryEp1V5/V8)
- dialogue/*.json (9 file cues+timeline) → cp về public (import tĩnh; chỉ json, wav 36M vẫn archive)

## Verify 2026-10-15
- remotion still KidsStoryEp1Remake f360/f600/f1229: OK
- f600 vs turn7/lossless/v7/element-0600.png: mean abs diff = 0.0 (bit-identical)
