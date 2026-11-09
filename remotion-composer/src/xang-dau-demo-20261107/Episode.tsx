import React from 'react';
import {
  AbsoluteFill,
  Audio,
  Easing,
  Img,
  Sequence,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
} from 'remotion';
import { assertInBounds, assertRailSafe, barSlots, DEFAULT_LAYOUT_PROFILE, type SceneLayout } from '../components/layoutGuard';
import { SceneLayoutValidated } from '../components/SceneLayoutValidated';
import { resolveSemanticEvent, type SemanticEvent } from '../components/semanticEvents';

/* ============================================================
   xang-dau-demo-20261107 — editorial motion graphics demo
   Scaffold bởi lead (Ep.06 scaffold-first pattern); scene bodies
   fill bởi CC theo TASK. Style: archival halftone cutouts +
   Remotion-native data layer + camera drift + tactile SFX.
   ============================================================ */

const FONT =
  'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif';
const MONO = 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace';
const BASE = 'xang-dau-demo-20261107/';

const C = {
  red: '#D90429',
  yellow: '#FFBE0B',
  ink: '#F8F9FA',
  dim: '#9AA3AE',
  soft: '#C7CDD6',
  panel: '#1A2029',
  panel2: '#1E2530',
  border: '#3A424E',
  barIdle: '#3A424E',
};

/* ---------- layout guard (prevent — owner 11-07 review S2) ----------
 * Mọi vị trí bar/label/gridline DERIVED + assert ở MODULE SCOPE:
 * frame đầu tiên render fail ngay nếu phần tử vượt card hoặc tràn rail
 * sau camera drift. Xem components/layoutGuard.ts. */
const DATA_DRIFT = 1.02; // data layer: owner yêu cầu hạ 1.08 -> 1.02 (chart vẫn drift nhẹ)
const CUT_DRIFT = 1.04; // cutout layer (giữ parallax bg < cutout < data)
const DATA_CAM_MAX = DATA_DRIFT * 1.1; // 1.122
const CUT_CAM_MAX = CUT_DRIFT * 1.1; // 1.144

/* S2 chart card (design px) */
const CARD2 = { x: 70, y: 480, w: 780, h: 560 }; // right design = 850
const PLOT2 = { baseline: 470, h: 380, vMin: 20000, vMax: 24000, gridW: 700 };
const BARS2 = barSlots({
  containerX: CARD2.x,
  containerW: CARD2.w,
  margin: 30,
  count: 2,
  gap: 60,
  maxBarW: 240,
});
const BAR2_LOCAL = BARS2.map((b) => ({ left: b.left - CARD2.x, width: b.width }));
const BAR2_H_OLD = PLOT2.h * ((23231 - PLOT2.vMin) / (PLOT2.vMax - PLOT2.vMin)); // 307
const BAR2_H_NEW = PLOT2.h * ((21156 - PLOT2.vMin) / (PLOT2.vMax - PLOT2.vMin)); // 110
const GRID2_V = [21000, 22000, 23000, 24000];
const GRID2_TOP = (v: number): number =>
  PLOT2.baseline - ((v - PLOT2.vMin) / (PLOT2.vMax - PLOT2.vMin)) * PLOT2.h;

/* --- asserts: chạy ngay khi import (fail-fast frame đầu) --- */
// S2: mọi absolute của card phải nằm gọn trong card 780x560
assertInBounds({ id: 's2-title', left: 110, top: 6, w: 660, h: 52, containerW: CARD2.w, containerH: CARD2.h });
assertRailSafe({ id: 's2-title', rightDesign: CARD2.x + 110 + 660, camMax: DATA_CAM_MAX });
GRID2_V.forEach((v) =>
  assertInBounds({ id: `s2-grid-${v / 1000}k`, left: 0, top: GRID2_TOP(v), w: PLOT2.gridW, h: 2, containerW: CARD2.w, containerH: CARD2.h })
);
assertInBounds({ id: 's2-baseline', left: 0, top: PLOT2.baseline, w: PLOT2.gridW, h: 3, containerW: CARD2.w, containerH: CARD2.h });
assertInBounds({ id: 's2-bar-old', left: BAR2_LOCAL[0].left, top: PLOT2.baseline - BAR2_H_OLD, w: BAR2_LOCAL[0].width, h: BAR2_H_OLD, containerW: CARD2.w, containerH: CARD2.h });
assertInBounds({ id: 's2-bar-new', left: BAR2_LOCAL[1].left, top: PLOT2.baseline - BAR2_H_NEW, w: BAR2_LOCAL[1].width, h: BAR2_H_NEW, containerW: CARD2.w, containerH: CARD2.h });
assertInBounds({ id: 's2-value-old', left: BAR2_LOCAL[0].left, top: PLOT2.baseline - BAR2_H_OLD - 70, w: BAR2_LOCAL[0].width, h: 54, containerW: CARD2.w, containerH: CARD2.h });
assertInBounds({ id: 's2-value-new', left: BAR2_LOCAL[1].left, top: PLOT2.baseline - BAR2_H_NEW - 70, w: BAR2_LOCAL[1].width, h: 54, containerW: CARD2.w, containerH: CARD2.h });
assertInBounds({ id: 's2-label-old', left: BAR2_LOCAL[0].left, top: 486, w: BAR2_LOCAL[0].width, h: 34, containerW: CARD2.w, containerH: CARD2.h });
assertInBounds({ id: 's2-label-new', left: BAR2_LOCAL[1].left, top: 486, w: BAR2_LOCAL[1].width, h: 34, containerW: CARD2.w, containerH: CARD2.h });
assertInBounds({ id: 's2-axis-note', left: 0, top: 524, w: 480, h: 26, containerW: CARD2.w, containerH: CARD2.h });
assertInBounds({ id: 's2-delta-chip', left: (CARD2.w - 420) / 2, top: 200, w: 420, h: 64, containerW: CARD2.w, containerH: CARD2.h });
assertInBounds({ id: 's2-highlighter', left: 130, top: 272, w: 520, h: 10, containerW: CARD2.w, containerH: CARD2.h });
assertInBounds({ id: 's2-citation', left: 130, top: 1042, w: 560, h: 50, containerW: 1080, containerH: 1920 });
assertRailSafe({ id: 's2-citation', rightDesign: 690, camMax: DATA_CAM_MAX });
// S2: card + nhãn phải không tràn rail sau drift (850 × 1.122 = 887.8 ≤ 940)
assertRailSafe({ id: 's2-card', rightDesign: CARD2.x + CARD2.w, camMax: DATA_CAM_MAX });
// S1: headline (maxWidth 760) + pump cutout
assertRailSafe({ id: 's1-headline', rightDesign: 115 + 760, camMax: DATA_CAM_MAX });
assertRailSafe({ id: 's1-pump', rightDesign: 850, camMax: CUT_CAM_MAX });
// S3: cash cutout (right 200, w 480 -> 400..880) + cột số liệu trái
assertRailSafe({ id: 's3-cash', rightDesign: 880, camMax: CUT_CAM_MAX });
assertRailSafe({ id: 's3-number-col', rightDesign: 115 + 620, camMax: DATA_CAM_MAX });
// S4: disclaimer (maxWidth 700 -> 890) + card
assertRailSafe({ id: 's4-disclaimer', rightDesign: 890, camMax: DATA_CAM_MAX });
assertRailSafe({ id: 's4-card', rightDesign: 860, camMax: DATA_CAM_MAX });

/* Validated layout contract for S1 (F6 enforcement) */
export const S1_LAYOUT: SceneLayout = {
  id: 's1',
  state: 'active',
  profile: DEFAULT_LAYOUT_PROFILE,
  onset: 0,
  end: 203,
  activeFrames: [1, 50, 100],
  extremaFrames: [0, 203],
  settleFrame: 41,
  elements: [
    {
      id: 's1_headline',
      left: 150,
      top: 300,
      w: 650,
      h: 120,
      state: 'active',
      contentId: 'headline_text',
      dataId: 'ron95_reduction',
      unit: 'vnd_per_liter',
      sourceId: 'script_s1',
      cueId: 'cue_0',
      startFrame: 0,
      endFrame: 203,
      text: 'Xăng RON95 vừa giảm hơn 2.000 đồng mỗi lít.',
    },
  ],
  intentionalOverlaps: [],
};

/* Semantic event for S1 pump visual and audible cues (F7 enforcement) */
export const S1_PUMP_EVENT: SemanticEvent = {
  scene_id: 's1',
  event_id: 'evt_s1_whoosh',
  word_span: [0, 2],
  visual_onset_frame: 8,
  contact_peak_ms: 260,
  audible_attack_ms: 260,
  sfx_asset: 'swoosh-quick.mp3',
  gain: 0.398,
  duration_tail_frames: 10,
};

export const S1_PUMP_RESOLVED = resolveSemanticEvent(S1_PUMP_EVENT, 30, 48000, 0);

/* Timing (scene_timing.json — lead verified) */
interface SecDef {
  id: 's1' | 's2' | 's3' | 's4';
  start: number;
  dur: number;
  secStart: number;
}
const TIMING: SecDef[] = [
  { id: 's1', start: 0, dur: 197, secStart: 0.0 },
  { id: 's2', start: 203, dur: 240, secStart: 6.767 },
  { id: 's3', start: 443, dur: 229, secStart: 14.767 },
  { id: 's4', start: 672, dur: 203, secStart: 22.4 },
];
const TOTAL_FRAMES = 874;
const FPS = 30;

/* Anchor frames SCENE-LOCAL (scene_elements.json — ASR-locked, 13/13) */
const ANCHOR: Record<string, number> = {
  s1_pump: 8,
  s1_headline: 23,
  s1_badge: 83,
  s2_title: 8,
  s2_bar_old: 44,
  s2_bar_new: 90,
  s2_delta: 160,
  s3_cutout: 8,
  s3_label: 35,
  s3_number: 76,
  s3_math: 103,
  s4_disclaimer: 22,
  s4_cta: 101,
};
const A = (id: string, fallback: number): number =>
  ANCHOR[id] !== undefined ? ANCHOR[id] : fallback;

/* Captions {key: [[startSec,endSec,text]]} — global seconds, lead quy đổi từ captions.json */
const CAPTIONS: Record<string, [number, number, string][]> = {
  s1: [
    [0.0, 2.45, 'Xăng RON95 giảm hơn 2.000 đồng mỗi lít'],
    [2.45, 5.72, 'Sau 3 giờ chiều 5/11, đổ xăng rẻ hơn hẳn tuần trước'],
  ],
  s2: [
    [6.77, 9.1, 'Trần giá xăng RON95 hạ từ 23.231'],
    [9.1, 11.4, 'xuống 21.156 đồng mỗi lít'],
    [11.4, 13.72, 'Mức giảm: 2.075 đồng mỗi lít'],
  ],
  s3: [
    [14.77, 16.97, 'Với bình 50 lít,'],
    [16.97, 19.17, 'mỗi lần đổ để dành hơn 100 nghìn đồng'],
    [19.17, 21.33, 'Bằng đúng mức giảm 2.075 đồng/lít × 50 lít'],
  ],
  s4: [
    [22.4, 24.33, 'Giá trần liên Bộ —'],
    [24.33, 26.27, 'giá bán lẻ có thể chênh nhẹ theo vùng'],
    [26.27, 27.33, 'Theo dõi Ký Chủ Điểm Tin'],
    [27.33, 28.09, 'để cập nhật tin nhanh mỗi ngày'],
  ],
};

export interface Props {
  hud?: boolean;
  showCaptions?: boolean;
  scale720?: boolean;
}

/* ---------- helpers ---------- */

/** Damped editorial pop-in: opacity fade + translateY dương -> 0 + scale nhẹ */
const usePopIn = (frame: number, trigger: number, damping = 20, stiffness = 140) => {
  const spr = spring({ frame: frame - trigger, fps: FPS, config: { damping, stiffness } });
  const opacity = interpolate(frame, [trigger, trigger + 8], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const translateY = interpolate(spr, [0, 1], [36, 0]);
  const scale = interpolate(spr, [0, 1], [0.94, 1.0]);
  return { opacity, translateY, scale };
};

/** Posterize frame cho cutout layers (13fps tactile) */
const posterize = (frame: number): number => Math.floor(frame / (30 / 13)) * (30 / 13);

/** 23.231 style format */
const fmtVN = (n: number): string => Math.round(n).toLocaleString('vi-VN');

/** Camera drift scale tại frame trong scene (parallax multiplier riêng từng lớp) */
const camScale = (frame: number, dur: number, mult = 1.0): number =>
  interpolate(frame, [0, dur], [1.0 * mult, 1.1 * mult], {
    easing: Easing.bezier(0.22, 1, 0.36, 1),
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

const pct = (p: number): string => `${(p * 100).toFixed(1)}%`;

/* ---------- shared chrome ---------- */

const Grain: React.FC = () => (
  <AbsoluteFill style={{ zIndex: 89, pointerEvents: 'none' }}>
    <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
      <filter id="grain">
        <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves={2} seed={7} />
        <feColorMatrix type="saturate" values="0" />
      </filter>
      <rect width="100%" height="100%" filter="url(#grain)" opacity={0.1} />
    </svg>
  </AbsoluteFill>
);

const Vignette: React.FC = () => (
  <AbsoluteFill
    style={{
      zIndex: 88,
      pointerEvents: 'none',
      background:
        'radial-gradient(ellipse at center, rgba(0,0,0,0) 55%, rgba(0,0,0,0.35) 100%)',
    }}
  />
);

const Kicker: React.FC = () => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [6, 16], [0, 1], { extrapolateRight: 'clamp' });
  return (
    <div
      style={{
        position: 'absolute',
        top: 190,
        left: 115,
        zIndex: 60,
        opacity,
        background: C.red,
        color: '#FFFFFF',
        fontFamily: FONT,
        fontWeight: 800,
        fontSize: 30,
        letterSpacing: 2,
        padding: '10px 22px',
        borderRadius: 8,
      }}
    >
      TIN NHANH · GIÁ XĂNG
    </div>
  );
};

const CtaPill: React.FC = () => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [30, 40], [0, 1], { extrapolateRight: 'clamp' });
  return (
    <div
      style={{
        position: 'absolute',
        top: 1220,
        left: 0,
        right: 0,
        zIndex: 60,
        display: 'flex',
        justifyContent: 'center',
        opacity,
      }}
    >
      <div
        style={{
          background: C.panel2,
          border: `1.5px solid ${C.red}`,
          borderRadius: 999,
          padding: '10px 28px',
          fontFamily: FONT,
          fontWeight: 700,
          fontSize: 30,
          color: C.ink,
        }}
      >
        KÝ CHỦ ĐIỂM TIN · THEO DÕI
      </div>
    </div>
  );
};

const Subtitles: React.FC<{ sec: SecDef }> = ({ sec }) => {
  const frame = useCurrentFrame();
  const t = sec.secStart + frame / FPS;
  const cues = CAPTIONS[sec.id] ?? [];
  const cur = cues.find(([s, e]) => t >= s && t < e);
  if (!cur) return null;
  const [, , text] = cur;
  return (
    <div
      style={{
        position: 'absolute',
        top: 1470,
        left: 0,
        right: 0,
        height: 90,
        zIndex: 70,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'flex-start',
        padding: '0 100px',
      }}
    >
      <div
        style={{
          fontFamily: FONT,
          fontWeight: 800,
          fontSize: text.length > 66 ? 58 : 63,
          color: '#FFFFFF',
          textAlign: 'center',
          maxWidth: 880,
          lineHeight: 1.15,
          textShadow: '0 2px 8px #000, 0 0 4px #000',
        }}
      >
        {text}
      </div>
    </div>
  );
};

const Hud: React.FC<{ sec: SecDef }> = ({ sec }) => {
  const frame = useCurrentFrame();
  return (
    <div
      style={{
        position: 'absolute',
        bottom: 24,
        left: 24,
        zIndex: 100,
        fontFamily: MONO,
        fontSize: 30,
        color: '#FFFFFF',
        background: 'rgba(0,0,0,0.55)',
        padding: '8px 14px',
        borderRadius: 8,
      }}
    >
      {`S${sec.id[1]} f${sec.start + frame} ${((sec.start + frame) / FPS).toFixed(1)}s [${frame}/${sec.dur}]`}
    </div>
  );
};

const Backplate: React.FC<{ frame: number; dur: number }> = ({ frame, dur }) => (
  <AbsoluteFill style={{ zIndex: 0 }}>
    <Img
      src={staticFile(BASE + 'backplate.png')}
      style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.9 }}
    />
  </AbsoluteFill>
);

/** SFX một phát tại frame scene-local */
const Sfx: React.FC<{ at: number; file: string; volume: number }> = ({ at, file, volume }) => (
  <Sequence from={at} durationInFrames={45}>
    <Audio src={staticFile('sfx/' + file)} volume={volume} />
  </Sequence>
);

/* ---------- scenes (bodies FILL bởi CC — giữ mọi wrapper/scale/SFX sẵn) ---------- */

const AiBadge: React.FC<{ y: number }> = ({ y }) => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [20, 30], [0, 1], { extrapolateRight: 'clamp' });
  return (
    <div
      style={{
        position: 'absolute',
        top: y,
        left: 115,
        zIndex: 62,
        opacity,
        fontFamily: FONT,
        fontSize: 24,
        color: C.dim,
        background: 'rgba(0,0,0,0.45)',
        padding: '4px 12px',
        borderRadius: 6,
      }}
    >
      Hình minh họa: AI
    </div>
  );
};

const SceneS1: React.FC<{ sec: SecDef }> = ({ sec }) => {
  const frame = useCurrentFrame();
  const qf = posterize(frame);
  const cam = camScale(frame, sec.dur);
  const camCut = camScale(qf, sec.dur, 1.04);
  // FILL_S1_BODY: pump cutout + headline typewriter + badge hiệu lực
  return (
    <SceneLayoutValidated scene={S1_LAYOUT}>
      <AbsoluteFill style={{ background: '#0B0E14' }}>
        <AbsoluteFill style={{ transform: `scale(${cam})` }}>
          <Backplate frame={frame} dur={sec.dur} />
        </AbsoluteFill>
        <AbsoluteFill style={{ zIndex: 20, transform: `scale(${camCut})` }}>
          {(() => {
            const t = qf - S1_PUMP_RESOLVED.visualCueFrame;
            const spr = spring({ frame: t, fps: FPS, config: { damping: 18, stiffness: 140 } });
            const opacity = interpolate(t, [0, 10], [0, 1], {
              extrapolateLeft: 'clamp',
              extrapolateRight: 'clamp',
            });
            const tx = interpolate(spr, [0, 1], [-160, 0]);
            const ty = interpolate(spr, [0, 1], [40, 0]);
            return (
              <div
                style={{
                  position: 'absolute',
                  left: '50%',
                  marginLeft: -310,
                  top: 600,
                  width: 620,
                  opacity,
                  transform: `translateX(${tx}px) translateY(${ty}px) rotate(-2.5deg)`,
                  filter: 'drop-shadow(12px 14px 18px rgba(0,0,0,0.65))',
                }}
              >
                <Img src={staticFile(BASE + 'pump_cutout_cut.png')} style={{ width: '100%' }} />
              </div>
            );
          })()}
        </AbsoluteFill>
        <AbsoluteFill style={{ zIndex: 40, transform: `scale(${camScale(frame, sec.dur, DATA_DRIFT)})` }}>
          {(() => {
            const anchor = A('s1_headline', 23);
            const n = Math.floor(
              interpolate(frame, [anchor, anchor + 36], [0, 21], {
                extrapolateLeft: 'clamp',
                extrapolateRight: 'clamp',
              })
            );
            const badgePop = usePopIn(frame, A('s1_badge', 83), 20, 140);
            const line1 = 'XĂNG GIẢM'.slice(0, Math.min(n, 10));
            const line2 = n > 10 ? '2.075 Đ/LÍT'.slice(0, n - 10) : '';
            const cursor =
              n < 21 ? (
                <span
                  style={{
                    display: 'inline-block',
                    width: 38,
                    height: 76,
                    background: C.red,
                    opacity: Math.floor(frame / 8) % 2 === 0 ? 1 : 0,
                  }}
                />
              ) : null;
            return (
              <React.Fragment>
                <div
                  style={{
                    position: 'absolute',
                    top: 370,
                    left: 115,
                    maxWidth: 760,
                    fontFamily: FONT,
                    fontWeight: 900,
                    fontSize: 84,
                    lineHeight: 1.1,
                  }}
                >
                  <div style={{ color: C.ink }}>
                    {line1}
                    {n <= 10 ? cursor : null}
                  </div>
                  <div style={{ color: C.red }}>
                    {line2}
                    {n > 10 && n < 21 ? cursor : null}
                  </div>
                </div>
                <div
                  style={{
                    position: 'absolute',
                    top: 640,
                    left: 115,
                    background: C.red,
                    color: '#FFFFFF',
                    fontFamily: FONT,
                    fontWeight: 800,
                    fontSize: 34,
                    padding: '10px 22px',
                    borderRadius: 8,
                    opacity: badgePop.opacity,
                    transform: `translateY(${badgePop.translateY}px) scale(${badgePop.scale})`,
                  }}
                >
                  TỪ 15H · 5/11/2026
                </div>
              </React.Fragment>
            );
          })()}
        </AbsoluteFill>
        <Kicker />
        <CtaPill />
        <AiBadge y={1170} />
        <Sfx at={S1_PUMP_RESOLVED.sfxCue.frame} file={S1_PUMP_RESOLVED.sfxCue.asset} volume={S1_PUMP_RESOLVED.sfxCue.gain} />
        <Sfx at={A('s1_pump', 8) + 47} file="pop.mp3" volume={0.316} />
        <Sfx at={A('s1_badge', 83)} file="transition-snap.mp3" volume={0.251} />
      </AbsoluteFill>
    </SceneLayoutValidated>
  );
};

const SceneS2: React.FC<{ sec: SecDef }> = ({ sec }) => {
  const frame = useCurrentFrame();
  const cam = camScale(frame, sec.dur);
  // FILL_S2_BODY: chart 2 cột + exclusive highlight + delta chip + citation
  return (
    <AbsoluteFill style={{ background: '#0B0E14' }}>
      <AbsoluteFill style={{ transform: `scale(${cam})` }}>
        <Backplate frame={frame} dur={sec.dur} />
      </AbsoluteFill>
      <AbsoluteFill style={{ zIndex: 40, transform: `scale(${camScale(frame, sec.dur, DATA_DRIFT)})` }}>
          {(() => {
            const titlePop = usePopIn(frame, A('s2_title', 8));
            const anchorOld = A('s2_bar_old', 44);
            const anchorNew = A('s2_bar_new', 90);
            const deltaAnchor = A('s2_delta', 160);
            const deltaPop = usePopIn(frame, deltaAnchor, 20, 140);
            const hlW = interpolate(frame, [deltaAnchor + 2, deltaAnchor + 16], [0, 520], {
              extrapolateLeft: 'clamp',
              extrapolateRight: 'clamp',
            });
            const citOp = interpolate(frame, [62, 74], [0, 1], {
              extrapolateLeft: 'clamp',
              extrapolateRight: 'clamp',
            });
            const grid = GRID2_V;
            return (
              <React.Fragment>
              <div style={{ position: 'absolute', left: CARD2.x, top: CARD2.y, width: CARD2.w, height: CARD2.h }}>
                <div
                  style={{
                    position: 'absolute',
                    top: 6,
                    left: 110,
                    width: 660,
                    height: 52,
                    fontFamily: MONO,
                    fontWeight: 700,
                    fontSize: 44,
                    color: C.ink,
                    opacity: titlePop.opacity,
                    transform: `translateY(${titlePop.translateY}px) scale(${titlePop.scale})`,
                  }}
                >
                  TRẦN GIÁ RON95 (Đ/LÍT)
                </div>
                {grid.map((v) => {
                  const y = GRID2_TOP(v);
                  return (
                    <div
                      key={v}
                      style={{ position: 'absolute', top: y, left: 0, width: PLOT2.gridW, height: 1, background: C.border }}
                    />
                  );
                })}
                <div style={{ position: 'absolute', top: PLOT2.baseline, left: 0, width: PLOT2.gridW, height: 3, background: C.ink }} />
                <div style={{ position: 'absolute', top: 524, left: 0, fontFamily: MONO, fontSize: 24, color: C.dim }}>
                  Trục: 20.000 – 24.000 đ/lít
                </div>
                {(() => {
                  const hOld = interpolate(frame, [anchorOld, anchorOld + 36], [0, BAR2_H_OLD], {
                    extrapolateLeft: 'clamp',
                    extrapolateRight: 'clamp',
                  });
                  const vOld = interpolate(frame, [anchorOld, anchorOld + 36], [0, 23231], {
                    extrapolateLeft: 'clamp',
                    extrapolateRight: 'clamp',
                  });
                  const opOld = frame < anchorOld ? 0 : frame < 90 ? 1 : frame < 172 ? 0.52 : 1;
                  const glowOld = frame >= anchorOld && frame < 90;
                  return (
                    <div style={{ position: 'absolute', left: BAR2_LOCAL[0].left, width: BAR2_LOCAL[0].width, bottom: CARD2.h - PLOT2.baseline, opacity: opOld }}>
                      <div
                        style={{
                          position: 'absolute',
                          bottom: 0,
                          left: 0,
                          width: '100%',
                          height: hOld,
                          background: C.barIdle,
                          borderRadius: '8px 8px 0 0',
                          border: glowOld ? '2px solid #F8F9FA' : undefined,
                          boxShadow: glowOld ? '0 0 24px rgba(248,249,250,0.35)' : undefined,
                          boxSizing: 'border-box',
                        }}
                      />
                      <div
                        style={{
                          position: 'absolute',
                          bottom: hOld + 16,
                          left: 0,
                          width: '100%',
                          textAlign: 'center',
                          fontFamily: MONO,
                          fontWeight: 700,
                          fontSize: 54,
                          color: C.ink,
                        }}
                      >
                        {fmtVN(vOld)}
                      </div>
                    </div>
                  );
                })()}
                <div
                  style={{
                    position: 'absolute',
                    top: 486,
                    left: BAR2_LOCAL[0].left,
                    width: BAR2_LOCAL[0].width,
                    textAlign: 'center',
                    fontFamily: FONT,
                    fontSize: 30,
                    color: C.soft,
                  }}
                >
                  KỲ TRƯỚC
                </div>
                {(() => {
                  const hNew = interpolate(frame, [anchorNew, anchorNew + 36], [0, BAR2_H_NEW], {
                    extrapolateLeft: 'clamp',
                    extrapolateRight: 'clamp',
                  });
                  const vNew = interpolate(frame, [anchorNew, anchorNew + 36], [0, 21156], {
                    extrapolateLeft: 'clamp',
                    extrapolateRight: 'clamp',
                  });
                  const opNew = frame < anchorNew ? 0 : 1;
                  const glowNew = frame >= anchorNew && frame < 172;
                  return (
                    <div style={{ position: 'absolute', left: BAR2_LOCAL[1].left, width: BAR2_LOCAL[1].width, bottom: CARD2.h - PLOT2.baseline, opacity: opNew }}>
                      <div
                        style={{
                          position: 'absolute',
                          bottom: 0,
                          left: 0,
                          width: '100%',
                          height: hNew,
                          background: C.yellow,
                          borderRadius: '8px 8px 0 0',
                          boxShadow: glowNew ? '0 0 28px rgba(255,190,11,0.45)' : undefined,
                        }}
                      />
                      <div
                        style={{
                          position: 'absolute',
                          bottom: hNew + 16,
                          left: 0,
                          width: '100%',
                          textAlign: 'center',
                          fontFamily: MONO,
                          fontWeight: 700,
                          fontSize: 54,
                          color: C.ink,
                        }}
                      >
                        {fmtVN(vNew)}
                      </div>
                    </div>
                  );
                })()}
                <div
                  style={{
                    position: 'absolute',
                    top: 486,
                    left: BAR2_LOCAL[1].left,
                    width: BAR2_LOCAL[1].width,
                    textAlign: 'center',
                    fontFamily: FONT,
                    fontSize: 30,
                    color: C.soft,
                  }}
                >
                  TỪ 15H · 5/11
                </div>
                <div style={{ position: 'absolute', top: 200, left: 0, right: 0, display: 'flex', justifyContent: 'center' }}>
                  <div
                    style={{
                      background: C.yellow,
                      color: '#1A1A1A',
                      fontFamily: FONT,
                      fontWeight: 800,
                      fontSize: 44,
                      padding: '12px 28px',
                      borderRadius: 12,
                      opacity: deltaPop.opacity,
                      transform: `translateY(${deltaPop.translateY}px) scale(${deltaPop.scale})`,
                    }}
                  >
                    −2.075 Đ/LÍT
                  </div>
                </div>
                <div
                  style={{
                    position: 'absolute',
                    top: 272,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    height: 10,
                    width: hlW,
                    background: C.yellow,
                  }}
                />
              </div>
                <div
                  style={{
                    position: 'absolute',
                    top: 1042,
                    left: 130,
                    fontFamily: MONO,
                    fontSize: 27,
                    color: C.dim,
                    border: '1px solid #3A424E',
                    padding: '8px 16px',
                    borderRadius: 8,
                    opacity: citOp,
                  }}
                >
                  NGUỒN: LIÊN BỘ CT-TC · 5/11/2026
                </div>
              </React.Fragment>
            );
          })()}
        </AbsoluteFill>
      <Kicker />
      <CtaPill />
      <Sfx at={A('s2_bar_old', 44)} file="pop.mp3" volume={0.355} />
      <Sfx at={A('s2_bar_new', 90)} file="pop.mp3" volume={0.355} />
      <Sfx at={A('s2_delta', 160)} file="transition-snap.mp3" volume={0.398} />
    </AbsoluteFill>
  );
};

const SceneS3: React.FC<{ sec: SecDef }> = ({ sec }) => {
  const frame = useCurrentFrame();
  const qf = posterize(frame);
  const cam = camScale(frame, sec.dur);
  const camCut = camScale(qf, sec.dur, 1.04);
  // FILL_S3_BODY: cash cutout + count-up + label + math chip
  return (
    <AbsoluteFill style={{ background: '#0B0E14' }}>
      <AbsoluteFill style={{ transform: `scale(${cam})` }}>
        <Backplate frame={frame} dur={sec.dur} />
      </AbsoluteFill>
      <AbsoluteFill style={{ zIndex: 20, transform: `scale(${camCut})` }}>
          {(() => {
            const t = qf - A('s3_cutout', 8);
            const spr = spring({ frame: t, fps: FPS, config: { damping: 20, stiffness: 135 } });
            const opacity = interpolate(t, [0, 10], [0, 1], {
              extrapolateLeft: 'clamp',
              extrapolateRight: 'clamp',
            });
            const tx = interpolate(spr, [0, 1], [160, 0]);
            const ty = interpolate(spr, [0, 1], [-30, 0]);
            return (
              <div
                style={{
                  position: 'absolute',
                  right: 200,
                  top: 560,
                  width: 480,
                  opacity,
                  transform: `translateX(${tx}px) translateY(${ty}px) rotate(2deg)`,
                  filter: 'drop-shadow(12px 14px 18px rgba(0,0,0,0.65))',
                }}
              >
                <Img src={staticFile(BASE + 'cash_cutout_cut.png')} style={{ width: '100%' }} />
              </div>
            );
          })()}
        </AbsoluteFill>
        <AbsoluteFill style={{ zIndex: 40, transform: `scale(${camScale(frame, sec.dur, DATA_DRIFT)})` }}>
          {(() => {
            const p = interpolate(frame, [A('s3_number', 76), A('s3_number', 76) + 30], [0, 104000], {
              extrapolateLeft: 'clamp',
              extrapolateRight: 'clamp',
            });
            const labelPop = usePopIn(frame, A('s3_label', 35), 20, 140);
            const numPop = usePopIn(frame, A('s3_number', 76), 22, 140);
            const mathOp = interpolate(frame, [A('s3_math', 103), A('s3_math', 103) + 12], [0, 1], {
              extrapolateLeft: 'clamp',
              extrapolateRight: 'clamp',
            });
            return (
              <div
                style={{
                  position: 'absolute',
                  left: 115,
                  top: 520,
                  width: 620,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 24,
                  alignItems: 'flex-start',
                }}
              >
                <div
                  style={{
                    fontFamily: FONT,
                    fontSize: 34,
                    fontWeight: 700,
                    color: C.ink,
                    opacity: labelPop.opacity,
                    transform: `translateY(${labelPop.translateY}px) scale(${labelPop.scale})`,
                  }}
                >
                  TIẾT KIỆM / BÌNH 50 LÍT
                </div>
                <div
                  style={{
                    fontFamily: MONO,
                    fontSize: 96,
                    fontWeight: 800,
                    color: C.yellow,
                    whiteSpace: 'nowrap',
                    opacity: numPop.opacity,
                    transform: `translateY(${numPop.translateY}px) scale(${numPop.scale})`,
                  }}
                >
                  ≈{fmtVN(p)} Đ
                </div>
                <div
                  style={{
                    fontFamily: MONO,
                    fontSize: 28,
                    color: C.soft,
                    border: '1px dashed #4A5563',
                    padding: 10,
                    borderRadius: 8,
                    opacity: mathOp,
                  }}
                >
                  2.075 đ/lít × 50 lít
                </div>
              </div>
            );
          })()}
        </AbsoluteFill>
      <Kicker />
      <CtaPill />
      <AiBadge y={1170} />
      <Sfx at={A('s3_cutout', 8)} file="swoosh-quick.mp3" volume={0.316} />
      <Sfx at={A('s3_number', 76)} file="pop.mp3" volume={0.398} />
    </AbsoluteFill>
  );
};

const SceneS4: React.FC<{ sec: SecDef }> = ({ sec }) => {
  const frame = useCurrentFrame();
  const cam = camScale(frame, sec.dur, 1.08 / 1.1); // drift nhẹ hơn 1.0->~1.083
  // FILL_S4_BODY: disclaimer chip + CTA card
  return (
    <AbsoluteFill style={{ background: '#0B0E14' }}>
      <AbsoluteFill style={{ transform: `scale(${cam})` }}>
        <Backplate frame={frame} dur={sec.dur} />
      </AbsoluteFill>
      <AbsoluteFill style={{ zIndex: 40, transform: `scale(${camScale(frame, sec.dur, DATA_DRIFT)})` }}>
          {(() => {
            const disPop = usePopIn(frame, A('s4_disclaimer', 22), 20, 140);
            const ctaPop = usePopIn(frame, A('s4_cta', 101), 22, 140);
            const p = 0.5 + 0.5 * Math.sin(frame / 8);
            return (
              <React.Fragment>
                <div
                  style={{
                    position: 'absolute',
                    top: 500,
                    left: 0,
                    right: 0,
                    display: 'flex',
                    justifyContent: 'center',
                  }}
                >
                  <div
                    style={{
                      maxWidth: 700,
                      fontFamily: MONO,
                      fontSize: 30,
                      color: C.soft,
                      background: C.panel2,
                      border: '1px dashed #4A5563',
                      padding: '12px 24px',
                      borderRadius: 10,
                      textAlign: 'center',
                      opacity: disPop.opacity,
                      transform: `translateY(${disPop.translateY}px)`,
                    }}
                  >
                    GIÁ TRẦN LIÊN BỘ — GIÁ BÁN LẺ CÓ THỂ CHÊNH LỆCH THEO VÙNG
                  </div>
                </div>
                <div
                  style={{
                    position: 'absolute',
                    top: 640,
                    left: 0,
                    right: 0,
                    height: 420,
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}
                >
                  <div
                    style={{
                      background: C.panel,
                      border: '2px solid #D90429',
                      borderRadius: 24,
                      padding: 48,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: 24,
                      opacity: ctaPop.opacity,
                      transform: `translateY(${ctaPop.translateY}px) scale(${ctaPop.scale})`,
                    }}
                  >
                    <div
                      style={{
                        fontFamily: FONT,
                        fontSize: 30,
                        fontWeight: 800,
                        color: C.red,
                        letterSpacing: 6,
                      }}
                    >
                      TIN NHANH MỖI NGÀY
                    </div>
                    <div
                      style={{
                        fontFamily: FONT,
                        fontWeight: 900,
                        fontSize: 72,
                        color: C.ink,
                      }}
                    >
                      KÝ CHỦ ĐIỂM TIN
                    </div>
                    <div
                      style={{
                        background: C.red,
                        color: '#FFFFFF',
                        fontFamily: FONT,
                        fontWeight: 800,
                        fontSize: 44,
                        borderRadius: 999,
                        padding: '14px 48px',
                        boxShadow: `0 0 ${Math.round(20 + 20 * p)}px rgba(217,4,41,${(0.15 + 0.2 * p).toFixed(2)})`,
                      }}
                    >
                      THEO DÕI
                    </div>
                  </div>
                </div>
              </React.Fragment>
            );
          })()}
        </AbsoluteFill>
      <Sfx at={A('s4_disclaimer', 22)} file="transition-snap.mp3" volume={0.251} />
      <Sfx at={A('s4_cta', 101)} file="pop.mp3" volume={0.447} />
    </AbsoluteFill>
  );
};

/* ---------- root episode ---------- */

const SCENES: Record<string, React.FC<{ sec: SecDef }>> = {
  s1: SceneS1,
  s2: SceneS2,
  s3: SceneS3,
  s4: SceneS4,
};

export const EpisodeXangDau: React.FC<Props> = ({ hud = false, showCaptions = true, scale720 = false }) => {
  const frame = useCurrentFrame();
  const fadeIn = interpolate(frame, [0, 10], [0, 1], { extrapolateRight: 'clamp' });
  const fadeOut = interpolate(frame, [TOTAL_FRAMES - 10, TOTAL_FRAMES], [1, 0], {
    extrapolateLeft: 'clamp',
  });
  const dim = Math.min(fadeIn, fadeOut);
  const bgmVol = Math.max(
    0,
    interpolate(frame, [0, 15], [0, 0.07], { extrapolateRight: 'clamp' }) -
      interpolate(frame, [TOTAL_FRAMES - 25, TOTAL_FRAMES], [0, 0.07], {
        extrapolateLeft: 'clamp',
      })
  );
  const stage: React.ReactNode = (
    <AbsoluteFill style={{ background: '#0B0E14' }}>
      {TIMING.map((sec) => {
        const Comp = SCENES[sec.id];
        return (
          <Sequence key={sec.id} from={sec.start} durationInFrames={sec.dur} name={sec.id}>
            <Comp sec={sec} />
            <Audio src={staticFile(BASE + 'voice_' + sec.id + '.wav')} />
            {showCaptions ? <Subtitles sec={sec} /> : null}
            {hud ? <Hud sec={sec} /> : null}
          </Sequence>
        );
      })}
      <Grain />
      <Vignette />
      <AbsoluteFill style={{ background: '#000', opacity: 1 - dim, zIndex: 95, pointerEvents: 'none' }} />
      <Audio src={staticFile(BASE + 'bgm.mp3')} volume={bgmVol} />
    </AbsoluteFill>
  );
  if (!scale720) return stage;
  return (
    <AbsoluteFill style={{ background: '#000' }}>
      <div
        style={{
          width: 1080,
          height: 1920,
          transform: 'scale(0.6667)',
          transformOrigin: 'top left',
          position: 'absolute',
          top: 0,
          left: 0,
        }}
      >
        {stage}
      </div>
    </AbsoluteFill>
  );
};

export default EpisodeXangDau;

