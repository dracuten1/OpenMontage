import React from 'react';
import {
  AbsoluteFill,
  Audio,
  Img,
  Sequence,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
} from 'remotion';
import timing from '../../public/vnindex-tut-30diem-20261102/scene_timing.json';
import captionsData from '../../public/vnindex-tut-30diem-20261102/captions.json';
import sceneElementsData from '../../public/vnindex-tut-30diem-20261102/scene_elements.json';

const FONT = 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif';
const MONO_FONT = 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace';
const BASE = 'vnindex-tut-30diem-20261102/';

interface CaptionCue {
  chunk_text: string;
  start: number;
  end: number;
}

interface CaptionGroup {
  key: string;
  value: CaptionCue[];
}

const captionsMap: Record<string, CaptionCue[]> = {};
for (const item of captionsData as CaptionGroup[]) {
  captionsMap[item.key] = item.value;
}

/* Anchor frames from ASR words (scene-local); fallback = default */
const elementFrames: Record<string, number> = (sceneElementsData as { frames: Record<string, number> }).frames;
const A = (id: string, fallback: number): number =>
  elementFrames[id] !== undefined ? elementFrames[id] : fallback;

/* Vietnamese number format: 1.710,72 / 18.577 / 30,90 */
const vn = (n: number, dec = 0): string => {
  const s = n.toFixed(dec);
  const parts = s.split('.');
  const gi = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return parts[1] ? `${gi},${parts[1]}` : gi;
};

/* Percent format bỏ số 0 dư: 6.1 -> "6,1" / 4.19 -> "4,19" / 4.8 -> "4,8" */
const vnp = (n: number): string =>
  n
    .toFixed(2)
    .replace(/0+$/, '')
    .replace(/\.$/, '')
    .replace('.', ',');

export interface Props {
  hud?: boolean;
  showCaptions?: boolean;
}

/* Spring-based staggered pop-in (damping 14, stiffness 110) */
const usePopIn = (frame: number, triggerFrame: number, fps = 30) => {
  const spr = spring({
    frame: frame - triggerFrame,
    fps,
    config: { damping: 14, stiffness: 110 },
  });
  const opacity = interpolate(frame, [triggerFrame, triggerFrame + 8], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const translateY = interpolate(spr, [0, 1], [30, 0]);
  const scale = interpolate(spr, [0, 1], [0.94, 1.0]);
  return { opacity, translateY, scale };
};

const useCountUp = (frame: number, triggerFrame: number, dur = 50) =>
  interpolate(frame, [triggerFrame, triggerFrame + dur], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

/* Common Background with Grid & Ambient Light */
const CommonBackground: React.FC<{ accentColor?: string; bgImage?: string }> = ({
  accentColor = 'rgba(239, 68, 68, 0.22)',
  bgImage,
}) => {
  const frame = useCurrentFrame();
  const bgScale = interpolate(frame, [0, 500], [1.0, 1.05], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  return (
    <AbsoluteFill style={{ backgroundColor: '#0A0F1E' }}>
      {bgImage && (
        <div style={{ position: 'absolute', inset: 0, opacity: 0.16, overflow: 'hidden' }}>
          <Img
            src={staticFile(BASE + bgImage)}
            style={{ width: '100%', height: '100%', objectFit: 'cover', transform: `scale(${bgScale})` }}
          />
        </div>
      )}
      <div
        style={{
          position: 'absolute',
          top: '22%',
          left: '8%',
          width: 880,
          height: 880,
          borderRadius: 9999,
          background: `radial-gradient(circle, ${accentColor} 0%, transparent 70%)`,
          filter: 'blur(110px)',
          pointerEvents: 'none',
        }}
      />
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage:
            'linear-gradient(to right, rgba(255,255,255,0.035) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.035) 1px, transparent 1px)',
          backgroundSize: '72px 72px',
        }}
      />
    </AbsoluteFill>
  );
};

/* Top Header (Safe Zone y >= 160) */
const TopHeader: React.FC<{ tag: string; title: string; tagColor?: string; borderColor?: string }> = ({
  tag,
  title,
  tagColor = '#F87171',
  borderColor = 'rgba(239, 68, 68, 0.65)',
}) => {
  return (
    <div
      style={{
        position: 'absolute',
        top: 160,
        left: 70,
        right: 140,
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        zIndex: 50,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div
          style={{
            background: 'rgba(255, 255, 255, 0.08)',
            border: `1.5px solid ${borderColor}`,
            borderRadius: 999,
            padding: '6px 18px',
            fontSize: 20,
            fontWeight: 800,
            color: tagColor,
            textTransform: 'uppercase',
            letterSpacing: 2,
            fontFamily: MONO_FONT,
          }}
        >
          {tag}
        </div>
        <div
          style={{
            height: 2,
            flex: 1,
            background: `linear-gradient(to right, ${borderColor}, transparent)`,
          }}
        />
      </div>
      <h2
        style={{
          margin: 0,
          fontSize: 38,
          fontWeight: 900,
          color: '#FFFFFF',
          lineHeight: 1.25,
          textShadow: '0 2px 16px rgba(0,0,0,0.8)',
          letterSpacing: -0.5,
        }}
      >
        {title}
      </h2>
    </div>
  );
};

/* Hero Illustration Card (width 800-840, radius 20, neon) */
const HeroIllustrationCard: React.FC<{
  imageName: string;
  sourceBadge: string;
  height?: number;
  glowColor?: string;
  kenBurns?: boolean;
}> = ({
  imageName,
  sourceBadge,
  height = 400,
  glowColor = 'rgba(239, 68, 68, 0.35)',
  kenBurns = true,
}) => {
  const frame = useCurrentFrame();
  const scale = kenBurns
    ? interpolate(frame, [0, 500], [1.0, 1.05], {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
      })
    : 1.0;

  return (
    <div
      style={{
        width: '100%',
        height,
        borderRadius: 20,
        overflow: 'hidden',
        position: 'relative',
        boxShadow: `0 16px 40px rgba(0, 0, 0, 0.8), 0 0 34px ${glowColor}`,
        border: '2px solid rgba(255, 255, 255, 0.18)',
        backgroundColor: '#0F172A',
      }}
    >
      <Img
        src={staticFile(BASE + imageName)}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          transform: `scale(${scale})`,
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: 12,
          right: 14,
          background: 'rgba(5, 10, 24, 0.85)',
          backdropFilter: 'blur(8px)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          borderRadius: 8,
          padding: '4px 12px',
          color: '#E2E8F0',
          fontSize: 14,
          fontWeight: 700,
          fontFamily: MONO_FONT,
          letterSpacing: 0.5,
        }}
      >
        {sourceBadge}
      </div>
    </div>
  );
};

/* Subscription CTA Banner (TikTok-safe band y ~1165-1205 = bottom:715; native caption dead zone starts y>=1440) */
const SubscribeBanner: React.FC = () => {
  const frame = useCurrentFrame();
  const pulse = 1 + Math.sin(frame / 18) * 0.02;
  return (
    <div
      style={{
        position: 'absolute',
        bottom: 762,
        left: 70,
        right: 140,
        display: 'flex',
        justifyContent: 'center',
        zIndex: 80,
        pointerEvents: 'none',
      }}
    >
      <div
        style={{
          background: 'linear-gradient(135deg, rgba(220, 38, 38, 0.35), rgba(234, 88, 12, 0.3))',
          border: '1.5px solid rgba(248, 113, 113, 0.7)',
          borderRadius: 14,
          padding: '10px 26px',
          transform: `scale(${pulse})`,
          boxShadow: '0 6px 24px rgba(220, 38, 38, 0.35)',
        }}
      >
        <span style={{ fontSize: 28, fontWeight: 900, color: '#FECACA', letterSpacing: 0.5 }}>
          🔔 THEO DÕI KÝ CHỦ ĐIỂM TIN
        </span>
      </div>
    </div>
  );
};

/* ============ SCENE 1: Cover / Thumbnail Card + Hook ============ */
const Scene1: React.FC = () => {
  const frame = useCurrentFrame();
  const fCard = A('s01_card', 10);
  const fCount = A('s01_count', 30);
  const fSub = A('s01_sub', 75);
  const popCard = usePopIn(frame, fCard);
  const popSub = usePopIn(frame, fSub);

  const pDrop = useCountUp(frame, fCount, 55);
  const drop = pDrop * 30.9;
  const closeVal = 1741.62 - drop;

  return (
    <AbsoluteFill>
      <CommonBackground bgImage="scene1_cover.png" accentColor="rgba(239, 68, 68, 0.32)" />

      <div
        style={{
          position: 'absolute',
          top: 250,
          left: 70,
          right: 140,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 18,
          zIndex: 40,
        }}
      >
        {/* Cover Card */}
        <div
          style={{
            background: 'linear-gradient(135deg, rgba(24, 10, 16, 0.96), rgba(10, 8, 20, 0.98))',
            border: '2.5px solid rgba(248, 113, 113, 0.85)',
            borderRadius: 28,
            padding: '22px 26px',
            width: '100%',
            boxSizing: 'border-box',
            boxShadow: '0 20px 50px rgba(0, 0, 0, 0.9), 0 0 46px rgba(239, 68, 68, 0.3)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
            gap: 12,
            ...popCard,
          }}
        >
          <div
            style={{
              background: 'rgba(239, 68, 68, 0.16)',
              border: '1px solid #EF4444',
              borderRadius: 999,
              padding: '6px 20px',
              color: '#FCA5A5',
              fontSize: 18,
              fontWeight: 800,
              fontFamily: MONO_FONT,
              letterSpacing: 2,
            }}
          >
            KÝ CHỦ ĐIỂM TIN · 02/11/2026
          </div>

          <h1
            style={{
              margin: 0,
              fontSize: 64,
              fontWeight: 900,
              color: '#FFFFFF',
              lineHeight: 1.18,
              maxWidth: 840,
              textShadow: '0 4px 20px rgba(0,0,0,0.85)',
            }}
          >
            VN-INDEX TỤT <span style={{ color: '#F87171' }}>30 ĐIỂM</span>:
            <br />
            BÃO MARGIN QUÉT SÀN
          </h1>

          <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
            <div
              style={{
                background: 'rgba(239, 68, 68, 0.14)',
                border: '1.5px solid rgba(239, 68, 68, 0.8)',
                borderRadius: 14,
                padding: '6px 18px',
                fontFamily: MONO_FONT,
              }}
            >
              <span style={{ fontSize: 30, fontWeight: 900, color: '#F87171' }}>-{vn(drop, 2)}</span>
              <span style={{ fontSize: 16, color: '#FCA5A5', fontWeight: 700 }}> điểm</span>
            </div>
            <div
              style={{
                background: 'rgba(255, 255, 255, 0.06)',
                border: '1.5px solid rgba(255, 255, 255, 0.35)',
                borderRadius: 14,
                padding: '6px 18px',
                fontFamily: MONO_FONT,
              }}
            >
              <span style={{ fontSize: 30, fontWeight: 900, color: '#E2E8F0' }}>{vn(closeVal, 2)}</span>
              <span style={{ fontSize: 16, color: '#94A3B8', fontWeight: 700 }}> (-1,77%)</span>
            </div>
          </div>
        </div>

        {/* Sub strip */}
        <div
          style={{
            background: 'rgba(15, 23, 42, 0.9)',
            border: '1.5px solid rgba(251, 191, 36, 0.55)',
            borderRadius: 14,
            padding: '8px 22px',
            ...popSub,
          }}
        >
          <span style={{ fontSize: 22, fontWeight: 800, color: '#FDE68A' }}>
            Có lúc mất gần 50 điểm · Ngân hàng đỏ lửa
          </span>
        </div>

        <div style={{ width: '100%', ...popSub }}>
          <HeroIllustrationCard
            imageName="scene1_cover.png"
            sourceBadge="Hình minh họa: AI / Biểu đồ mô phỏng"
            height={380}
            glowColor="rgba(239, 68, 68, 0.35)"
          />
        </div>
      </div>
    </AbsoluteFill>
  );
};

/* ============ SCENE 2: Dữ liệu thị trường phiên 02/11 ============ */
const INTRADAY_POINTS: Array<[number, number]> = [
  [0, 1741.6], [8, 1739.2], [18, 1736.4], [28, 1730.5], [38, 1718.2],
  [50, 1700.4], [58, 1692.7], [70, 1704.1], [82, 1710.7], [100, 1710.72],
];

const Scene2: React.FC = () => {
  const frame = useCurrentFrame();
  const fTable = A('s02_table', 12);
  const fChart = A('s02_chart', 120);
  const fClose = A('s02_close', 260);
  const fBreadth = A('s02_breadth', 400);
  const popTable = usePopIn(frame, fTable);
  const popChart = usePopIn(frame, fChart);
  const popBreadth = usePopIn(frame, fBreadth);

  const pClose = useCountUp(frame, fClose, 50);
  const closeVal = 1741.62 - pClose * 30.9;

  // intraday draw-on (left -> right)
  const drawW = interpolate(frame, [fChart, fChart + 55], [0, 780], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const CW = 780;
  const CH = 300;
  const PAD = 30;
  const xOf = (t: number) => 42 + (t / 100) * (CW - 82);
  const yOf = (v: number) => PAD + ((1750 - v) / 70) * (CH - 2 * PAD);
  const pts = INTRADAY_POINTS.map(([t, v]) => `${xOf(t).toFixed(1)},${yOf(v).toFixed(1)}`).join(' ');

  return (
    <AbsoluteFill>
      <CommonBackground bgImage="scene2_intraday.png" accentColor="rgba(59, 130, 246, 0.22)" />
      <TopHeader tag="PHIÊN 02/11/2026" title="VN-INDEX CHỐT GIẢM 30,90 ĐIỂM" tagColor="#60A5FA" borderColor="rgba(59, 130, 246, 0.65)" />

      <div
        style={{
          position: 'absolute',
          top: 280,
          left: 70,
          right: 140,
          display: 'flex',
          flexDirection: 'column',
          gap: 14,
          zIndex: 40,
        }}
      >
        {/* Bang so lieu chinh */}
        <div
          style={{
            background: 'rgba(15, 23, 42, 0.95)',
            border: '1.5px solid rgba(59, 130, 246, 0.6)',
            borderRadius: 22,
            padding: '16px 22px',
            boxShadow: '0 12px 30px rgba(0,0,0,0.6)',
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
            ...popTable,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 20, fontWeight: 900, color: '#93C5FD' }}>VN-INDEX</span>
            <span style={{ fontSize: 26, fontWeight: 900, color: '#F87171', fontFamily: MONO_FONT }}>
              -30,90 (-1,77%)
            </span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 20, fontWeight: 900, color: '#93C5FD' }}>VN30</span>
            <span style={{ fontSize: 26, fontWeight: 900, color: '#F87171', fontFamily: MONO_FONT }}>
              -41,63 (-2,24%)
            </span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 18, fontWeight: 800, color: '#E2E8F0' }}>
              Đóng cửa <span style={{ fontFamily: MONO_FONT, color: '#FFFFFF' }}>{vn(closeVal, 2)}</span>
            </span>
            <span style={{ fontSize: 15, color: '#94A3B8', fontFamily: MONO_FONT }}>
              Nguồn: HOSE · Báo Đầu Tư
            </span>
          </div>
        </div>

        {/* Intraday chart (mo phong) */}
        <div
          style={{
            background: 'rgba(10, 16, 32, 0.96)',
            border: '1.5px solid rgba(239, 68, 68, 0.55)',
            borderRadius: 22,
            padding: '12px 16px 8px',
            position: 'relative',
            ...popChart,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
            <span style={{ fontSize: 16, fontWeight: 800, color: '#FCA5A5' }}>DIỄN BIẾN TRONG NGÀY</span>
            <span
              style={{
                fontSize: 13,
                fontWeight: 700,
                color: '#FCD34D',
                fontFamily: MONO_FONT,
                background: 'rgba(251, 191, 36, 0.12)',
                border: '1px solid rgba(251, 191, 36, 0.5)',
                borderRadius: 8,
                padding: '2px 10px',
              }}
            >
              Mô phỏng diễn biến
            </span>
          </div>
          <svg width="100%" viewBox={`0 0 ${CW} ${CH}`} style={{ display: 'block' }}>
            <defs>
              <clipPath id="drawClip">
                <rect x="0" y="0" width={drawW} height={CH} />
              </clipPath>
            </defs>
            {/* grid lines */}
            {[1750, 1730, 1710, 1690].map((v) => (
              <g key={v}>
                <line x1="42" y1={yOf(v)} x2={CW - 20} y2={yOf(v)} stroke="rgba(255,255,255,0.07)" strokeWidth="1" />
                <text x="6" y={yOf(v) + 5} fill="#64748B" fontSize="14" fontFamily="monospace">
                  {vn(v)}
                </text>
              </g>
            ))}
            {/* 1700 psyc line */}
            <line x1="42" y1={yOf(1700)} x2={CW - 20} y2={yOf(1700)} stroke="rgba(251, 191, 36, 0.75)" strokeWidth="2" strokeDasharray="8 7" />
            <text x={CW - 170} y={yOf(1700) - 8} fill="#FBBF24" fontSize="15" fontWeight="700">
              Mốc tâm lý 1.700
            </text>
            {/* price line */}
            <g clipPath="url(#drawClip)">
              <polyline points={pts} fill="none" stroke="#EF4444" strokeWidth="4" strokeLinejoin="round" strokeLinecap="round" />
              <circle cx={xOf(58)} cy={yOf(1692.7)} r="7" fill="#EF4444" stroke="#FFF" strokeWidth="2" />
              <circle cx={xOf(100)} cy={yOf(1710.72)} r="7" fill="#F87171" stroke="#FFF" strokeWidth="2" />
            </g>
            <text x={xOf(58) - 90} y={yOf(1692.7) + 26} fill="#FCA5A5" fontSize="15" fontWeight="700">
              Đáy ~1.692 (-gần 50 điểm)
            </text>
            <text x={xOf(100) - 150} y={yOf(1710.72) - 14} fill="#E2E8F0" fontSize="15" fontWeight="700">
              Đóng cửa 1.710,72
            </text>
            {/* x labels */}
            {[
              [0, '9:00'], [33, '11:00'], [66, '13:30'], [100, '14:45'],
            ].map(([t, l]) => (
              <text key={l as string} x={xOf(t as number) - 18} y={CH - 4} fill="#64748B" fontSize="13" fontFamily="monospace">
                {l as string}
              </text>
            ))}
          </svg>
        </div>

        {/* Do rong thi truong */}
        <div
          style={{
            background: 'rgba(15, 23, 42, 0.95)',
            border: '1.5px solid rgba(239, 68, 68, 0.5)',
            borderRadius: 18,
            padding: '12px 20px',
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
            ...popBreadth,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 17, fontWeight: 800, color: '#F87171' }}>281 MÃ GIẢM GIÁ</span>
            <span style={{ fontSize: 17, fontWeight: 800, color: '#34D399' }}>MÃ TĂNG</span>
          </div>
          <div style={{ display: 'flex', gap: 6, height: 30 }}>
            <div style={{ width: '86%', background: 'linear-gradient(90deg, #DC2626, #F87171)', borderRadius: 8 }} />
            <div style={{ width: '13%', background: 'linear-gradient(90deg, #059669, #34D399)', borderRadius: 8 }} />
          </div>
          <div style={{ fontSize: 15, color: '#94A3B8' }}>
            Sắc đỏ áp đảo — số mã giảm <b style={{ color: '#F87171' }}>gấp hơn 6 lần</b> số mã tăng
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

/* ============ SCENE 3: Tâm điểm xả hàng — Ngân hàng ============ */
const Scene3: React.FC = () => {
  const frame = useCurrentFrame();
  const fHead = A('s03_head', 12);
  const fVpb = A('s03_vpb', 60);
  const fVcb = A('s03_vcb', 130);
  const fBid = A('s03_bid', 190);
  const fGroup = A('s03_group', 280);
  const popHead = usePopIn(frame, fHead);
  const popVpb = usePopIn(frame, fVpb);
  const popVcb = usePopIn(frame, fVcb);
  const popBid = usePopIn(frame, fBid);
  const popGroup = usePopIn(frame, fGroup);

  const rows = [
    { t: 'VPB', pct: 6.1, pop: popVpb, big: true },
    { t: 'VCB', pct: 4.8, pop: popVcb, big: false },
    { t: 'BID', pct: 4.19, pop: popBid, big: false },
  ];

  return (
    <AbsoluteFill>
      <CommonBackground bgImage="scene3_banks.png" accentColor="rgba(239, 68, 68, 0.3)" />
      <TopHeader tag="TÂM ĐIỂM XẢ HÀNG" title="NGÂN HÀNG ĐỎ LỬA" tagColor="#F87171" borderColor="rgba(239, 68, 68, 0.7)" />

      <div
        style={{
          position: 'absolute',
          top: 280,
          left: 70,
          right: 140,
          display: 'flex',
          flexDirection: 'column',
          gap: 14,
          zIndex: 40,
        }}
      >
        <div
          style={{
            background: 'rgba(45, 10, 15, 0.95)',
            border: '1.5px solid rgba(239, 68, 68, 0.7)',
            borderRadius: 18,
            padding: '12px 20px',
            ...popHead,
          }}
        >
          <span style={{ fontSize: 20, fontWeight: 800, color: '#FEE2E2' }}>
            🔥 Nhóm trụ cột của thị trường bị xả mạnh nhất
          </span>
        </div>

        {rows.map((r) => (
          <div
            key={r.t}
            style={{
              background: 'rgba(15, 23, 42, 0.95)',
              border: '1.5px solid rgba(248, 113, 113, 0.55)',
              borderRadius: 20,
              padding: r.big ? '16px 24px' : '12px 24px',
              display: 'flex',
              alignItems: 'center',
              gap: 20,
              ...r.pop,
            }}
          >
            <span
              style={{
                fontSize: r.big ? 40 : 32,
                fontWeight: 900,
                color: '#FFFFFF',
                fontFamily: MONO_FONT,
                width: 150,
              }}
            >
              {r.t}
            </span>
            <div style={{ flex: 1 }}>
              <div style={{ width: `${(r.pct / 6.1) * 100}%`, height: 22, background: 'linear-gradient(90deg, #DC2626, #F87171)', borderRadius: 8 }} />
            </div>
            <span
              style={{
                fontSize: r.big ? 42 : 34,
                fontWeight: 900,
                color: '#EF4444',
                fontFamily: MONO_FONT,
              }}
            >
              -{vnp(r.pct)}%
            </span>
          </div>
        ))}

        <div
          style={{
            background: 'rgba(15, 23, 42, 0.95)',
            border: '1.5px solid rgba(148, 163, 184, 0.5)',
            borderRadius: 18,
            padding: '10px 20px',
            ...popGroup,
          }}
        >
          <span style={{ fontSize: 19, fontWeight: 800, color: '#CBD5E1', fontFamily: MONO_FONT }}>
            MBB · CTG · STB · ACB · LPB
          </span>
          <span style={{ fontSize: 19, fontWeight: 800, color: '#F87171' }}> đồng loạt giảm 2% – 4%</span>
        </div>

        <div
          style={{
            background: 'linear-gradient(135deg, rgba(69, 10, 10, 0.95), rgba(127, 29, 29, 0.85))',
            border: '2px solid rgba(239, 68, 68, 0.9)',
            borderRadius: 18,
            padding: '12px 22px',
            textAlign: 'center',
            boxShadow: '0 0 30px rgba(239, 68, 68, 0.35)',
            ...popGroup,
          }}
        >
          <span style={{ fontSize: 22, fontWeight: 900, color: '#FEE2E2' }}>
            Trung bình ngành NH: gần <span style={{ color: '#F87171' }}>-3%</span> — lực kéo chỉ số lao dốc
          </span>
        </div>
      </div>
    </AbsoluteFill>
  );
};

/* ============ SCENE 4: Nguyên nhân — Domino call margin ============ */
const Scene4: React.FC = () => {
  const frame = useCurrentFrame();
  const fS1 = A('s04_s1', 12);
  const fS2 = A('s04_s2', 110);
  const fS3 = A('s04_s3', 210);
  const fS4 = A('s04_s4', 300);
  const fLoop = A('s04_loop', 400);
  const fHero = A('s04_hero', 55);

  const steps = [
    { n: '1', icon: '📉', text: 'GIÁ GIẢM liên tục sau chuỗi phiên rung lắc', pop: usePopIn(frame, fS1), border: 'rgba(239, 68, 68, 0.65)', color: '#F87171' },
    { n: '2', icon: '⚠️', text: 'Tài khoản đòn bẩy (margin) chạm ngưỡng an toàn', pop: usePopIn(frame, fS2), border: 'rgba(249, 115, 22, 0.65)', color: '#FB923C' },
    { n: '3', icon: '📨', text: 'CTCK phát lệnh gọi ký quỹ (call margin)', pop: usePopIn(frame, fS3), border: 'rgba(251, 191, 36, 0.65)', color: '#FBBF24' },
    { n: '4', icon: '🔨', text: 'Bán giải chấp TỰ ĐỘNG — xả hàng dây chuyền', pop: usePopIn(frame, fS4), border: 'rgba(239, 68, 68, 0.8)', color: '#EF4444' },
  ];

  const popLoop = usePopIn(frame, fLoop);
  const popHero = usePopIn(frame, fHero);

  return (
    <AbsoluteFill>
      <CommonBackground bgImage="scene4_avalanche.png" accentColor="rgba(249, 115, 22, 0.25)" />
      <TopHeader tag="NGUYÊN NHÂN" title="HIỆU ỨNG TUYẾT LỞ CALL MARGIN" tagColor="#FB923C" borderColor="rgba(249, 115, 22, 0.65)" />

      <div
        style={{
          position: 'absolute',
          top: 280,
          left: 70,
          right: 140,
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
          zIndex: 40,
        }}
      >
        {steps.map((s) => (
          <div key={s.n} style={{ display: 'flex', flexDirection: 'column', ...s.pop }}>
            <div
              style={{
                background: 'rgba(15, 23, 42, 0.95)',
                border: `1.5px solid ${s.border}`,
                borderRadius: 18,
                padding: '12px 20px',
                display: 'flex',
                alignItems: 'center',
                gap: 16,
              }}
            >
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 12,
                  background: 'rgba(255, 255, 255, 0.06)',
                  border: `1.5px solid ${s.border}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 24,
                  flexShrink: 0,
                }}
              >
                {s.icon}
              </div>
              <div style={{ fontSize: 20, fontWeight: 800, color: '#E2E8F0', lineHeight: 1.3 }}>
                <span style={{ color: s.color, fontFamily: MONO_FONT, marginRight: 10 }}>{s.n}.</span>
                {s.text}
              </div>
            </div>
            {s.n !== '4' && (
              <div style={{ textAlign: 'center', fontSize: 22, color: 'rgba(248, 113, 113, 0.8)', lineHeight: 1 }}>▼</div>
            )}
          </div>
        ))}

        <div
          style={{
            background: 'rgba(69, 10, 10, 0.9)',
            border: '1.5px dashed rgba(239, 68, 68, 0.8)',
            borderRadius: 16,
            padding: '10px 18px',
            textAlign: 'center',
            ...popLoop,
          }}
        >
          <span style={{ fontSize: 19, fontWeight: 800, color: '#FCA5A5' }}>
            ↻ Quay vòng lại: càng bán → giá càng giảm → thêm lệnh margin mới nổ
          </span>
        </div>

        <div style={{ ...popHero }}>
          <HeroIllustrationCard
            imageName="scene4_avalanche.png"
            sourceBadge="Hình minh họa: AI / Domino giải chấp"
            height={280}
            glowColor="rgba(249, 115, 22, 0.3)"
          />
        </div>
      </div>
    </AbsoluteFill>
  );
};

/* ============ SCENE 5: Nhận định 1 — Nghịch lý bán chéo ============ */
const Scene5: React.FC = () => {
  const frame = useCurrentFrame();
  const fBadge = A('s05_badge', 10);
  const fLeft = A('s05_left', 150);
  const fRight = A('s05_right', 260);
  const fLoop = A('s05_loop', 380);
  const popBadge = usePopIn(frame, fBadge);
  const popLeft = usePopIn(frame, fLeft);
  const popRight = usePopIn(frame, fRight);
  const popLoop = usePopIn(frame, fLoop);

  const arrowSlide = interpolate(frame, [fRight, fRight + 25], [0, 26], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill>
      <CommonBackground bgImage="scene5_crosssell.png" accentColor="rgba(34, 211, 238, 0.22)" />
      <TopHeader tag="NHẬN ĐỊNH" title="NGHỊCH LÝ BÁN CHÉO CỔ PHIẾU TỐT" tagColor="#22D3EE" borderColor="rgba(34, 211, 238, 0.65)" />

      <div
        style={{
          position: 'absolute',
          top: 280,
          left: 70,
          right: 140,
          display: 'flex',
          flexDirection: 'column',
          gap: 14,
          zIndex: 40,
        }}
      >
        <div
          style={{
            alignSelf: 'flex-start',
            background: 'linear-gradient(135deg, rgba(8, 51, 68, 0.95), rgba(8, 34, 50, 0.95))',
            border: '2px solid rgba(34, 211, 238, 0.85)',
            borderRadius: 12,
            padding: '6px 18px',
            boxShadow: '0 0 24px rgba(34, 211, 238, 0.3)',
            ...popBadge,
          }}
        >
          <span style={{ fontSize: 19, fontWeight: 900, color: '#67E8F9', letterSpacing: 1 }}>
            [ NHẬN ĐỊNH ]
          </span>
        </div>

        {/* So do ban cheo */}
        <div style={{ display: 'flex', alignItems: 'stretch', gap: 10 }}>
          <div
            style={{
              flex: 1,
              background: 'rgba(15, 23, 42, 0.95)',
              border: '1.5px solid rgba(148, 163, 184, 0.6)',
              borderRadius: 20,
              padding: '16px 16px',
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
              ...popLeft,
            }}
          >
            <div style={{ fontSize: 34, textAlign: 'center' }}>🧊</div>
            <div style={{ fontSize: 18, fontWeight: 900, color: '#94A3B8', textAlign: 'center' }}>MÃ ĐẦU CƠ</div>
            <div style={{ fontSize: 16, color: '#CBD5E1', textAlign: 'center', lineHeight: 1.35 }}>
              Kẹt hàng, giảm sâu
              <br />
              <b style={{ color: '#F87171' }}>bán không được</b>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minWidth: 130 }}>
            <div
              style={{
                background: 'rgba(239, 68, 68, 0.15)',
                border: '1.5px solid rgba(239, 68, 68, 0.85)',
                borderRadius: 999,
                padding: '4px 14px',
                marginBottom: 4,
                ...popRight,
              }}
            >
              <span style={{ fontSize: 15, fontWeight: 900, color: '#FCA5A5' }}>BÁN CHÉO</span>
            </div>
            <div style={{ fontSize: 34, color: '#F87171', lineHeight: 1, transform: `translateX(${arrowSlide}px)` }}>
              ➜
            </div>
          </div>

          <div
            style={{
              flex: 1,
              background: 'rgba(15, 23, 42, 0.95)',
              border: '1.5px solid rgba(59, 130, 246, 0.7)',
              borderRadius: 20,
              padding: '16px 16px',
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
              ...popRight,
            }}
          >
            <div style={{ fontSize: 34, textAlign: 'center' }}>🏦</div>
            <div style={{ fontSize: 18, fontWeight: 900, color: '#93C5FD', textAlign: 'center' }}>MÃ NGÂN HÀNG</div>
            <div style={{ fontSize: 16, color: '#CBD5E1', textAlign: 'center', lineHeight: 1.35 }}>
              Thanh khoản cao nhất
              <br />
              <b style={{ color: '#F87171' }}>bị ép bán ra</b>
            </div>
          </div>
        </div>

        <div
          style={{
            background: 'rgba(15, 23, 42, 0.95)',
            border: '1.5px solid rgba(34, 211, 238, 0.5)',
            borderRadius: 18,
            padding: '12px 20px',
            ...popRight,
          }}
        >
          <span style={{ fontSize: 18, color: '#E2E8F0', lineHeight: 1.4 }}>
            CTCK chỉ còn đường bán <b style={{ color: '#93C5FD' }}>VPB · VCB · BID · MBB</b> — cổ phiếu thanh khoản
            dồi dào nhất danh mục — để <b style={{ color: '#FCA5A5' }}>thu tiền bù ký quỹ</b>
          </span>
        </div>

        <div
          style={{
            background: 'rgba(69, 10, 10, 0.9)',
            border: '1.5px dashed rgba(239, 68, 68, 0.8)',
            borderRadius: 16,
            padding: '10px 18px',
            textAlign: 'center',
            ...popLoop,
          }}
        >
          <span style={{ fontSize: 19, fontWeight: 800, color: '#FCA5A5' }}>
            ↻ Càng bán → chỉ số càng giảm → kích hoạt thêm lệnh margin mới
          </span>
        </div>
      </div>
    </AbsoluteFill>
  );
};

/* ============ SCENE 6: Dòng tiền bắt đáy — 18.577 tỷ & nến rút chân ============ */
const Scene6: React.FC = () => {
  const frame = useCurrentFrame();
  const fNum = A('s06_num', 40);
  const fPct = A('s06_pct', 160);
  const fHammer = A('s06_hammer', 260);
  const fNote = A('s06_note', 380);
  const popNum = usePopIn(frame, fNum);
  const popPct = usePopIn(frame, fPct);
  const popHammer = usePopIn(frame, fHammer);
  const popNote = usePopIn(frame, fNote);

  const pLiq = useCountUp(frame, fNum, 60);
  const liq = pLiq * 18577;
  const barW = pLiq * 100;

  // hammer candle geometry (v range 1685-1750)
  const HW = 420;
  const HH = 330;
  const hy = (v: number) => 30 + ((1750 - v) / 65) * (HH - 60);
  const yOpen = hy(1741.62);
  const yClose = hy(1710.72);
  const yLow = hy(1692.7);
  const y1700 = hy(1700);

  return (
    <AbsoluteFill>
      <CommonBackground bgImage="scene6_bottomfishing.png" accentColor="rgba(251, 191, 36, 0.24)" />
      <TopHeader tag="DÒNG TIỀN BẮT ĐÁY" title="18.577 TỶ ĐỒNG & NẾN RÚT CHÂN" tagColor="#FBBF24" borderColor="rgba(251, 191, 36, 0.65)" />

      <div
        style={{
          position: 'absolute',
          top: 280,
          left: 70,
          right: 140,
          display: 'flex',
          flexDirection: 'column',
          gap: 14,
          zIndex: 40,
        }}
      >
        {/* Thanh khoan card */}
        <div
          style={{
            background: 'rgba(15, 23, 42, 0.95)',
            border: '1.5px solid rgba(251, 191, 36, 0.6)',
            borderRadius: 22,
            padding: '16px 22px',
            display: 'flex',
            alignItems: 'center',
            gap: 20,
            ...popNum,
          }}
        >
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 17, fontWeight: 800, color: '#94A3B8', marginBottom: 4 }}>
              THANH KHOẢN TOÀN SÀN HOSE (02/11)
            </div>
            <div style={{ fontSize: 44, fontWeight: 900, color: '#FBBF24', fontFamily: MONO_FONT, lineHeight: 1.1 }}>
              {vn(liq, 0)}
              <span style={{ fontSize: 22, color: '#FDE68A' }}> tỷ đồng</span>
            </div>
            <div style={{ width: '100%', height: 16, background: 'rgba(255,255,255,0.07)', borderRadius: 8, marginTop: 8, overflow: 'hidden' }}>
              <div style={{ width: `${barW}%`, height: '100%', background: 'linear-gradient(90deg, #D97706, #FBBF24)', borderRadius: 8 }} />
            </div>
          </div>
          <div
            style={{
              background: 'rgba(16, 185, 129, 0.14)',
              border: '2px solid rgba(16, 185, 129, 0.85)',
              borderRadius: 16,
              padding: '10px 16px',
              textAlign: 'center',
              ...popPct,
            }}
          >
            <div style={{ fontSize: 34, fontWeight: 900, color: '#34D399', fontFamily: MONO_FONT }}>+26%</div>
            <div style={{ fontSize: 14, color: '#A7F3D0', fontWeight: 700 }}>vs phiên trước</div>
          </div>
        </div>

        {/* Hammer candle + note */}
        <div style={{ display: 'flex', gap: 14 }}>
          <div
            style={{
              flex: 1.15,
              background: 'rgba(10, 16, 32, 0.96)',
              border: '1.5px solid rgba(239, 68, 68, 0.55)',
              borderRadius: 22,
              padding: '10px 14px',
              ...popHammer,
            }}
          >
            <div style={{ fontSize: 15, fontWeight: 800, color: '#FCA5A5', marginBottom: 2 }}>NẾN PHIÊN 02/11 — RÚT CHÂN TỪ ĐÁY</div>
            <svg width="100%" viewBox={`0 0 ${HW} ${HH}`} style={{ display: 'block' }}>
              {/* 1700 zone (label bên trái, tránh đè chữ bracket phải) */}
              <line x1="14" y1={y1700} x2={HW - 14} y2={y1700} stroke="rgba(251, 191, 36, 0.7)" strokeWidth="2" strokeDasharray="7 6" />
              <text x="18" y={y1700 - 7} fill="#FBBF24" fontSize="14" fontWeight="700">Vùng 1.700</text>
              {/* candle */}
              <line x1="150" y1={yOpen} x2="150" y2={yLow} stroke="#EF4444" strokeWidth="5" />
              <rect x="105" y={yOpen} width="90" height={Math.max(yClose - yOpen, 4)} fill="#DC2626" rx="4" />
              {/* recovery bracket */}
              <line x1="215" y1={yLow} x2="215" y2={yClose} stroke="#10B981" strokeWidth="4" strokeLinecap="round" />
              <line x1="205" y1={yLow} x2="225" y2={yLow} stroke="#10B981" strokeWidth="4" strokeLinecap="round" />
              <line x1="205" y1={yClose} x2="225" y2={yClose} stroke="#10B981" strokeWidth="4" strokeLinecap="round" />
              <text x="238" y={(yLow + yClose) / 2 + 5} fill="#34D399" fontSize="17" fontWeight="800">
                Rút chân 18 điểm
              </text>
              <text x="238" y={(yLow + yClose) / 2 + 27} fill="#A7F3D0" fontSize="14">
                lực cầu bắt đáy
              </text>
              {/* labels */}
              <text x="18" y={yOpen + 5} fill="#FCA5A5" fontSize="14" fontFamily="monospace">Mở 1.741,62</text>
              <text x="18" y={yClose + 5} fill="#E2E8F0" fontSize="14" fontFamily="monospace">Đóng 1.710,72</text>
              <text x="18" y={yLow + 16} fill="#F87171" fontSize="14" fontFamily="monospace">Đáy 1.692,7</text>
            </svg>
          </div>

          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div
              style={{
                background: 'rgba(6, 40, 23, 0.95)',
                border: '1.5px solid rgba(16, 185, 129, 0.65)',
                borderRadius: 18,
                padding: '14px 18px',
                ...popHammer,
              }}
            >
              <div style={{ fontSize: 18, fontWeight: 900, color: '#34D399', marginBottom: 6 }}>💰 DÒNG TIỀN HẤP THỤ</div>
              <div style={{ fontSize: 16, color: '#E2E8F0', lineHeight: 1.4 }}>
                Cầu bắt đáy nhập cuộc quanh vùng <b>1.700</b>, hút hàng bị <b style={{ color: '#F87171' }}>ép bán giá rẻ</b>
              </div>
            </div>
            <div
              style={{
                background: 'rgba(15, 23, 42, 0.95)',
                border: '1.5px solid rgba(148, 163, 184, 0.5)',
                borderRadius: 18,
                padding: '12px 18px',
                ...popNote,
              }}
            >
              <div style={{ fontSize: 15, color: '#94A3B8', lineHeight: 1.4 }}>
                Khối ngoại vẫn <b style={{ color: '#F87171' }}>bán ròng 516 tỷ đồng</b> trên HOSE (MBB, VCB, ACB, STB)
              </div>
            </div>
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

/* ============ SCENE 7: Nhận định 2 — Bài học sinh tồn ============ */
const Scene7: React.FC = () => {
  const frame = useCurrentFrame();
  const fBadge = A('s07_badge', 10);
  const fR1 = A('s07_r1', 60);
  const fR2 = A('s07_r2', 180);
  const fQuote = A('s07_quote', 300);
  const popBadge = usePopIn(frame, fBadge);
  const popR1 = usePopIn(frame, fR1);
  const popR2 = usePopIn(frame, fR2);
  const popQuote = usePopIn(frame, fQuote);
  const popHero = usePopIn(frame, fBadge);

  return (
    <AbsoluteFill>
      <CommonBackground bgImage="scene7_survival.png" accentColor="rgba(16, 185, 129, 0.22)" />
      <TopHeader tag="NHẬN ĐỊNH 2" title="BÀI HỌC SINH TỒN CHO NGƯỜI ĐI LÀM" tagColor="#34D399" borderColor="rgba(16, 185, 129, 0.65)" />

      <div
        style={{
          position: 'absolute',
          top: 280,
          left: 70,
          right: 140,
          display: 'flex',
          flexDirection: 'column',
          gap: 14,
          zIndex: 40,
        }}
      >
        <div
          style={{
            alignSelf: 'flex-start',
            background: 'linear-gradient(135deg, rgba(6, 40, 23, 0.95), rgba(6, 30, 20, 0.95))',
            border: '2px solid rgba(16, 185, 129, 0.85)',
            borderRadius: 12,
            padding: '6px 18px',
            boxShadow: '0 0 24px rgba(16, 185, 129, 0.3)',
            ...popBadge,
          }}
        >
          <span style={{ fontSize: 19, fontWeight: 900, color: '#6EE7B7', letterSpacing: 1 }}>
            [ NHẬN ĐỊNH ]
          </span>
        </div>

        <div
          style={{
            background: 'rgba(45, 10, 15, 0.95)',
            border: '2px solid rgba(239, 68, 68, 0.75)',
            borderRadius: 20,
            padding: '16px 22px',
            display: 'flex',
            gap: 16,
            alignItems: 'center',
            ...popR1,
          }}
        >
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: 14,
              background: 'rgba(239, 68, 68, 0.16)',
              border: '1.5px solid rgba(239, 68, 68, 0.8)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 26,
              fontWeight: 900,
              color: '#F87171',
              flexShrink: 0,
            }}
          >
            1
          </div>
          <div>
            <div style={{ fontSize: 21, fontWeight: 900, color: '#F87171' }}>KHÔNG full margin khi thị trường rung lắc</div>
            <div style={{ fontSize: 17, color: '#E2E8F0', lineHeight: 1.35 }}>
              Đòn bẩy ép bạn bán đúng ở đáy — chết vì margin trước khi cơ hội mở ra
            </div>
          </div>
        </div>

        <div
          style={{
            background: 'rgba(6, 40, 23, 0.95)',
            border: '2px solid rgba(16, 185, 129, 0.75)',
            borderRadius: 20,
            padding: '16px 22px',
            display: 'flex',
            gap: 16,
            alignItems: 'center',
            ...popR2,
          }}
        >
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: 14,
              background: 'rgba(16, 185, 129, 0.16)',
              border: '1.5px solid rgba(16, 185, 129, 0.8)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 26,
              fontWeight: 900,
              color: '#34D399',
              flexShrink: 0,
            }}
          >
            2
          </div>
          <div>
            <div style={{ fontSize: 21, fontWeight: 900, color: '#34D399' }}>GIỮ TIỀN MẶT PHÒNG THỦ</div>
            <div style={{ fontSize: 17, color: '#E2E8F0', lineHeight: 1.35 }}>
              Cổ phiếu đầu ngành chiết khấu sâu chỉ đến khi người khác bị ép bán — người cầm tiền mới nhặt được
            </div>
          </div>
        </div>

        <div
          style={{
            background: 'linear-gradient(135deg, rgba(69, 26, 3, 0.95), rgba(120, 53, 15, 0.6))',
            border: '1.5px solid rgba(251, 191, 36, 0.7)',
            borderRadius: 18,
            padding: '13px 22px',
            textAlign: 'center',
            ...popQuote,
          }}
        >
          <span style={{ fontSize: 20, fontWeight: 900, color: '#FDE68A', fontStyle: 'italic' }}>
            ❝ Tuyết lở margin vừa là cơn bão, vừa là tấm chiết khấu cho người kiên nhẫn ❞
          </span>
        </div>

        <div style={{ ...popHero }}>
          <HeroIllustrationCard
            imageName="scene7_survival.png"
            sourceBadge="Hình minh họa: AI / Khiên tiền mặt"
            height={280}
            glowColor="rgba(16, 185, 129, 0.3)"
          />
        </div>
      </div>
    </AbsoluteFill>
  );
};

/* ============ SCENE 8: CTA & Outro ============ */
const Scene8: React.FC = () => {
  const frame = useCurrentFrame();
  const fCard = A('s08_card', 12);
  const fCta = A('s08_cta', 90);
  const popCard = usePopIn(frame, fCard);
  const popCta = usePopIn(frame, fCta);
  const popHero = usePopIn(frame, fCard);

  return (
    <AbsoluteFill>
      <CommonBackground bgImage="scene8_cta.png" accentColor="rgba(239, 68, 68, 0.26)" />
      <TopHeader tag="KÝ CHỦ ĐIỂM TIN" title="NHỊP ĐẬP THỊ TRƯỜNG TÀI CHÍNH" tagColor="#F87171" borderColor="rgba(239, 68, 68, 0.65)" />

      <div
        style={{
          position: 'absolute',
          top: 280,
          left: 70,
          right: 140,
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
          zIndex: 40,
        }}
      >
        <div
          style={{
            background: 'rgba(15, 23, 42, 0.95)',
            border: '1.5px solid rgba(251, 191, 36, 0.65)',
            borderRadius: 20,
            padding: '18px 24px',
            display: 'flex',
            alignItems: 'center',
            gap: 18,
            ...popCard,
          }}
        >
          <div style={{ fontSize: 42 }}>🔖</div>
          <div>
            <div style={{ fontSize: 24, fontWeight: 900, color: '#FDE68A' }}>LƯU LẠI BÀI HỌC NÀY</div>
            <div style={{ fontSize: 18, color: '#E2E8F0', lineHeight: 1.35 }}>
              Đối chiếu ở lần thị trường rung lắc tiếp theo
            </div>
          </div>
        </div>

        <div style={{ ...popHero }}>
          <HeroIllustrationCard
            imageName="scene8_cta.png"
            sourceBadge="Hình minh họa: AI / Studio Ký Chủ Điểm Tin"
            height={340}
            glowColor="rgba(239, 68, 68, 0.32)"
          />
        </div>

        <div
          style={{
            background: 'linear-gradient(135deg, rgba(220, 38, 38, 0.3), rgba(234, 88, 12, 0.25))',
            border: '2px solid rgba(248, 113, 113, 0.8)',
            borderRadius: 20,
            padding: '16px 24px',
            textAlign: 'center',
            boxShadow: '0 10px 30px rgba(220, 38, 38, 0.3)',
            ...popCta,
          }}
        >
          <div style={{ fontSize: 24, fontWeight: 900, color: '#FFFFFF' }}>
            📲 THEO DÕI KÝ CHỦ ĐIỂM TIN
          </div>
          <div style={{ fontSize: 17, color: '#FECACA', fontWeight: 700, marginTop: 4 }}>
            Không bỏ lỡ nhịp đập thị trường tài chính!
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

/* Scene Wrapper */
const SceneWrapper: React.FC<{
  scene: (typeof timing.sections)[0];
  index: number;
  hud?: boolean;
  showCaptions?: boolean;
}> = ({ scene, index, hud, showCaptions }) => {
  const frame = useCurrentFrame();
  const globalFrame = scene.start_frame + frame;
  const globalSec = (globalFrame / 30).toFixed(2);

  const cues = captionsMap[scene.section_id] || [];
  const sceneTime = scene.start_seconds + frame / 30;
  const cue = cues.find((c) => sceneTime >= c.start && sceneTime <= c.end);

  let SceneContent = Scene1;
  if (scene.section_id === 's02') SceneContent = Scene2;
  if (scene.section_id === 's03') SceneContent = Scene3;
  if (scene.section_id === 's04') SceneContent = Scene4;
  if (scene.section_id === 's05') SceneContent = Scene5;
  if (scene.section_id === 's06') SceneContent = Scene6;
  if (scene.section_id === 's07') SceneContent = Scene7;
  if (scene.section_id === 's08') SceneContent = Scene8;

  return (
    <AbsoluteFill>
      <SceneContent />

      {/* Subscription Banner (TikTok-safe y ~1165-1205, above subtitle band) */}
      {index > 0 && <SubscribeBanner />}

      {/* Dynamic Subtitle in TikTok-safe band (y ~1215-1345, clear of native caption zone y>=1440) */}
      {showCaptions && cue && (
        <div
          style={{
            position: 'absolute',
            bottom: 575,
            left: 70,
            right: 140,
            display: 'flex',
            justifyContent: 'center',
            pointerEvents: 'none',
            zIndex: 90,
          }}
        >
          <div
            style={{
              background: 'rgba(5, 10, 24, 0.95)',
              border: '2px solid rgba(248, 113, 113, 0.85)',
              borderRadius: 20,
              padding: '10px 26px',
              color: '#FFFFFF',
              fontSize: cue.chunk_text.length > 44 ? 42 : 46,
              fontWeight: 800,
              lineHeight: 1.35,
              textAlign: 'center',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.85)',
              maxWidth: 880,
            }}
          >
            {cue.chunk_text}
          </div>
        </div>
      )}

      {/* Debug HUD (draft only) */}
      {hud && (
        <div
          style={{
            position: 'absolute',
            bottom: 30,
            left: 40,
            background: 'rgba(0, 0, 0, 0.85)',
            border: '1.5px solid #EF4444',
            borderRadius: 10,
            padding: '8px 16px',
            color: '#F87171',
            fontFamily: MONO_FONT,
            fontSize: 22,
            fontWeight: 700,
            zIndex: 999,
          }}
        >
          S{index + 1} f{globalFrame} {globalSec}s [{frame}/{scene.duration_frames}]
        </div>
      )}
    </AbsoluteFill>
  );
};

/* Master Export Episode Component */
export const VNIndexMarginEpisode: React.FC<Props> = ({ hud = false, showCaptions = true }) => {
  return (
    <AbsoluteFill style={{ fontFamily: FONT }}>
      {/* Narration */}
      <Audio src={staticFile(BASE + 'narration_full.wav')} volume={1.0} />

      {/* BGM ducked under voice */}
      <Audio src={staticFile(BASE + 'bgm.mp3')} volume={0.11} />

      {/* Sequential Scenes */}
      {timing.sections.map((sec, idx) => (
        <Sequence
          key={sec.section_id}
          from={sec.start_frame}
          durationInFrames={sec.duration_frames}
        >
          <SceneWrapper
            scene={sec}
            index={idx}
            hud={hud}
            showCaptions={showCaptions}
          />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};
