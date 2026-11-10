# case02-fail-ml-shape

Synthetic regression fixture mirroring the mua-lu-trung-bo-2026-11-09 failure
shape: full-frame t2i hero/background_texture layers, UI card-stack data_viz
components (imported + referenced from each scene file so single-token claims
resolve to card bodies), all 4 contract sections absent, `anchor:`
placeholders.

`anchor:` leaf count pinned at **3**, deliberately spread across three
DIFFERENT shapes so a fixed-field scan under-counts:
1. `scenes[0].sfx_cues[0].trigger_frame` (`anchor:449`)
2. `scenes[4].layers[0].motion.enter.start_frame` (`anchor:Ba giờ`)
3. top-level UNKNOWN key `production_notes` (`anchor:đối chiếu chuẩn`)
