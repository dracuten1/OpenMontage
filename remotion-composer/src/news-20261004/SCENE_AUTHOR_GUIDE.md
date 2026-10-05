# SCENE_AUTHOR_GUIDE -- news-20261004 (Bản tin tài chính thực chiến)

You own ONLY your `scenes/Sxx.tsx` files (default export `React.FC`, no props). Do not edit shared files; if a primitive is
missing, build it locally in your scene. Visual spec: `projects/news-20261004/artifacts/scene_plan.json` (scene `id`).
Figures: ONLY `projects/news-20261004/research_digest.json`. Fonts/colours: `theme.ts` (Be Vietnam Pro, full Vietnamese).

## Speech-locked rule (owner standing rule, non-negotiable)
- Every animated element fires when its word is SPOKEN (+-0.3s), in narration order. Never use fractions of duration.
- `useCurrentFrame()` inside a scene is SCENE-LOCAL (Sequence already offsets). All helpers return scene-local values.
- Read your words first: `public/news-20261004/words.json` -> `{ s09: [{word,start,end}, ...] }` (start/end in scene seconds).
- `timing.ts`: `frameOf(id, "gdp" | "lãi suất" | 12 | /^9,95/, occurrence=1, offsetFrames=0)` -> frame of word START
  (multi-word strings match consecutive words; punctuation/case/accents normalised; throws listing all words if no match).
  Also `frameOfEnd`, `findWordSec`, `findWordEndSec`, `getWords`, `useSpoken`, `getSceneTiming`, `<Spoken at={frame}>` reveal wrapper.
- Compute frames at module level or at top of component: `const f = frameOf("s09", "143,5");` then `<StatCard at={f} .../>`.

## Components (`import { ... } from "../components"`; theme from `"../theme"`)
- `SceneFrame {sceneId, glow?, captions=true, fadeIn/fadeOut, grid}`: wrap EVERYTHING. Content box = 1728x816 at (96,64);
  bottom 200px is the Captions band. Absolutely-positioned extras: `bottom >= 150` collides with SourceTag.
- `Captions {sceneId}` (auto inside SceneFrame; pass `captions={false}` only if a full-bleed hero needs it).
- `HeadlineText {text, at, maxLines=2, fontSize=96, accent?, accentColor?, uppercase?}` auto-fit Vietnamese headline.
- `StatCard {at,label,value,decimals,prefix,suffix,unit,tone,note,width,size}` + `CountUp {at,to,from,decimals,duration,prefix,suffix}`.
- `ZeroBasedBarChart {data:[{label,value,at,tone,sub}], unit, decimals, max?, orientation, width,height, title}` axis always starts at 0.
- `IllustrationFrame {name:'img_gdp'|'img_fuel'|'img_savings'|'img_gold'|'img_ai_jobs', at, width,height, scrim}` Ken-Burns + badge "Hình minh họa".
- `Badge {text,at,tone}`, `SourceTag {text}` (bottom-left), `LowerThird {title,subtitle,at,until}`.
- `tone`: blue | green (growth) | red (warning/loss) | amber (caution) | violet (AI) | neutral. `fmtVi(n,dec)` -> "1.234,5".
- Images: `staticFile("news-20261004/<name>.png")` (5 PNG). Audio is global; do NOT add `<Audio>` in scenes.

## Content rules
- All on-screen text Vietnamese. Forbidden anywhere on screen: TradingAgents, Hermes, OpenMontage, Claude, "AI agent".
- Generated images are concept illustrations: always visibly labeled (IllustrationFrame badge) and never present numbers as image content.
- Charts: only digest numbers, zero-based axis, units and labels on every value; no inferred/interpolated data, no candles.
- Contrast (WCAG AA): body/labels use `C.text`, `C.textSoft`, `C.muted` or toneText colours on `C.bg/C.surface`. Never `C.border`/fills as text colour.
  Min sizes @1080p: body 36px, labels 28px (22px only for axis ticks / badges). Check new colours with `contrastRatio(fg,bg) >= 4.5`.
- Distinct composition per scene (scene_plan "narrative_role"), no repeated hero layout; keep motion purposeful (spring, no overshoot > 3%).
- Keep text inside the safe box; verify no overflow at the busiest frame.

## Still probe (from repo root or composer dir)
`cd /Users/tuyennguyen/project/OpenMontage/remotion-composer && npx remotion still src/index.tsx News20261004 /tmp/probe_s09.png --frame=1900`
(`--frame` is GLOBAL = scene start_frame + local frame; helper `toGlobalFrame("s09", 130)` in timing.ts). Probe each key reveal frame
(`start_frame + frameOf(...) + 10`) plus the last word. `npx tsc --noEmit -p .` must stay clean. NEVER run a full `remotion render`.

## Scene -> global frame offsets (30 fps, total 3361)
| scene | global start | frames | words |
|---|---|---|---|
| s01 | 0 | 291 (audio ends local f267) | 31 |
| s02 | 291 | 126 (audio ends local f102) | 16 |
| s03 | 417 | 279 (audio ends local f255) | 29 |
| s04 | 696 | 130 (audio ends local f106) | 16 |
| s05 | 826 | 329 (audio ends local f305) | 31 |
| s06 | 1155 | 129 (audio ends local f105) | 18 |
| s07 | 1284 | 304 (audio ends local f280) | 34 |
| s08 | 1588 | 116 (audio ends local f92) | 17 |
| s09 | 1704 | 287 (audio ends local f263) | 32 |
| s10 | 1991 | 131 (audio ends local f107) | 16 |
| s11 | 2122 | 327 (audio ends local f303) | 36 |
| s12 | 2449 | 308 (audio ends local f284) | 40 |
| s13 | 2757 | 283 (audio ends local f259) | 41 |
| s14 | 3040 | 321 (audio ends local f297) | 44 |

Authoritative: `public/news-20261004/scene_timing.json`.
