// V2 — motion upgrade over EpisodeFull (element-local only; static-camera
// standing rule preserved). Deltas: top progress bar (all scenes), count-up
// headline numbers (s06/s11), bar grow-up (s11), anatomy fill (s12),
// self-drawing timeline + active-node pulse (s13), quote pop + active glow
// (s09), icon pops + fly-box glow (s14), s05 wording fix (lãi cộng dồn).
// SSOT timing/elements/captions unchanged.
import React from 'react';
import {
  AbsoluteFill,
  Audio,
  Easing,
  Sequence,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
} from 'remotion';
import {C, FONT, SOURCE} from './theme';
import {
  SCENE_TIMING,
  EPISODE_TOTAL_FRAMES,
  FPS,
  FullSceneId,
  el,
  elText,
  Spoken,
  captionAt,
} from './timing';
import music from '../../public/vietjet-20261023/music_metadata.json';

const pos = (x: number, y: number, w: number): React.CSSProperties => ({
  position: 'absolute',
  left: x,
  top: y,
  width: w,
});

/** Count-up number synced to an element reveal (element-local animation). */
const CountUp: React.FC<{
  at: number;
  to: number;
  dur?: number;
  decimals?: number;
  style?: React.CSSProperties;
}> = ({at, to, dur = 42, decimals = 1, style}) => {
  const frame = useCurrentFrame();
  const p = interpolate(frame - at, [0, dur], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.cubic),
  });
  return (
    <div style={style}>{(to * p).toFixed(decimals).replace('.', ',')}</div>
  );
};

const Text: React.FC<{
  s: FullSceneId;
  id: string;
  y: number;
  size?: number;
  x?: number;
  w?: number;
  style?: React.CSSProperties;
}> = ({s, id, y, size = 40, x = 70, w = 860, style}) => (
  <Spoken
    at={el(s, id).start_frame_local}
    style={{
      ...pos(x, y, w),
      fontSize: size,
      lineHeight: 1.25,
      fontWeight: 700,
      overflowWrap: 'break-word',
      whiteSpace: 'pre-line',
      ...style,
    }}
  >
    {elText(s, id)}
  </Spoken>
);

const Chip: React.FC<{
  s: FullSceneId;
  id: string;
  y: number;
  h?: number;
  size?: number;
  accentColor?: string;
  style?: React.CSSProperties;
}> = ({s, id, y, h = 120, size = 36, accentColor = C.coral, style}) => (
  <Text
    s={s}
    id={id}
    y={y}
    size={size}
    style={{
      boxSizing: 'border-box',
      minHeight: h,
      padding: '20px 26px',
      background: C.panel,
      borderLeft: `5px solid ${accentColor}`,
      borderRadius: 12,
      ...style,
    }}
  />
);

const SCENES_WITH_TITLE: Set<FullSceneId> = new Set([
  's01', 's02', 's03', 's04', 's05', 's07', 's08',
]);

const Header: React.FC<{s: FullSceneId}> = ({s}) => {
  if (s === 's17') return null;
  if (s === 's16') {
    return (
      <div
        style={{
          ...pos(70, 260, 860),
          display: 'inline-flex',
          alignItems: 'center',
        }}
      >
        <span
          style={{
            background: C.coral,
            color: C.bg,
            fontWeight: 900,
            fontSize: 30,
            letterSpacing: 3,
            padding: '8px 24px',
            borderRadius: 8,
          }}
        >
          {elText(s, 'badge')}
        </span>
      </div>
    );
  }
  return (
    <>
      <div
        style={{
          ...pos(70, 260, 860),
          color: C.coral,
          fontWeight: 800,
          fontSize: 26,
          letterSpacing: 2,
        }}
      >
        {elText(s, 'badge')}
      </div>
      {SCENES_WITH_TITLE.has(s) && (
        <Text s={s} id="title" y={320} size={50} style={{lineHeight: 1.2}} />
      )}
    </>
  );
};

// --- Scene Bodies -------------------------------------------------------------

// s01: hook
const S01: React.FC = () => {
  const s = 's01';
  return (
    <>
      <Chip s={s} id="chip1" y={580} size={36} accentColor={C.amber} />
      <Text
        s={s}
        id="sub"
        y={740}
        size={32}
        style={{color: C.blue, fontWeight: 600}}
      />
    </>
  );
};

// s02: GỐC RỄ
const S02: React.FC = () => {
  const s = 's02';
  return (
    <>
      <Spoken
        at={el(s, 'title').start_frame_local}
        style={{...pos(690, 280, 240), textAlign: 'right'}}
      >
        <svg width="220" height="90" viewBox="0 0 220 90">
          <text x="130" y="20" fill={C.blue} fontSize="18" fontWeight="600">
            MINH HỌA
          </text>
          <path
            d="M20 55 L90 45 L150 25 L165 28 L125 50 L195 48 L205 40 L210 50 L195 55 L125 58 L85 85 L70 82 L90 60 L20 58 Z"
            fill={C.panel}
            stroke={C.blue}
            strokeWidth="2"
          />
        </svg>
      </Spoken>
      <Chip s={s} id="chip1" y={540} size={38} h={130} accentColor={C.amber} />
      <Chip s={s} id="chip2" y={710} size={36} h={130} accentColor={C.coral} />
    </>
  );
};

// s03: CƠ CHẾ 1/4
const S03: React.FC = () => {
  const s = 's03';
  return (
    <>
      <Spoken
        at={el(s, 'chip1').start_frame_local}
        style={{...pos(70, 520, 860)}}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: C.panel,
            padding: '18px 24px',
            borderRadius: 12,
            border: `2px dashed ${C.blue}`,
          }}
        >
          <div style={{fontSize: 28, fontWeight: 700, color: C.white}}>
            Ngân hàng cho thuê
          </div>
          <div style={{fontSize: 32, color: C.coral}}>→ BÁN NỢ →</div>
          <div style={{fontSize: 28, fontWeight: 700, color: C.amber}}>
            FitzWalter (Anh)
          </div>
        </div>
      </Spoken>
      <Chip s={s} id="chip1" y={640} size={34} h={130} />
      <Chip s={s} id="chip2" y={800} size={34} h={120} accentColor={C.blue} />
    </>
  );
};

// s04: CƠ CHẾ 2/4 + 3/4
const S04: React.FC = () => {
  const s = 's04';
  return (
    <>
      <Chip s={s} id="chip1" y={520} size={36} h={110} accentColor={C.amber} />
      <Chip s={s} id="chip2" y={660} size={34} h={130} />
      <Chip s={s} id="chip3" y={820} size={34} h={120} accentColor={C.blue} />
    </>
  );
};

// s05: CƠ CHẾ 4/4
const S05: React.FC = () => {
  const s = 's05';
  return (
    <>
      <Spoken
        at={el(s, 'title').start_frame_local}
        style={{...pos(70, 520, 860)}}
      >
        <div
          style={{
            background: C.panel,
            padding: '24px',
            borderRadius: 12,
            borderLeft: `5px solid ${C.amber}`,
          }}
        >
          <div style={{fontSize: 30, color: C.amber, fontWeight: 800}}>
            Lãi cộng dồn + chi phí pháp lý
          </div>
          <div
            style={{
              fontSize: 26,
              color: C.blue,
              marginTop: 8,
              lineHeight: 1.3,
            }}
          >
            Thời gian giải quyết kéo dài → con số bồi thường phình to theo thời
            gian
          </div>
        </div>
      </Spoken>
      <Chip s={s} id="chip1" y={710} size={36} h={130} accentColor={C.coral} />
    </>
  );
};

// s06: stat card TƯƠNG PHẢN trực diện
const S06: React.FC = () => {
  const s = 's06';
  return (
    <>
      <Spoken at={el(s, 'stat1').start_frame_local} style={pos(70, 360, 860)}>
        <div
          style={{
            background: C.panel,
            border: `3px solid ${C.amber}`,
            borderRadius: 16,
            padding: '32px 36px',
            boxSizing: 'border-box',
          }}
        >
          <div
            style={{
              fontSize: 24,
              color: C.amber,
              fontWeight: 800,
              letterSpacing: 2,
            }}
          >
            TỔNG 3 BẢN ÁN — TRẦN ĐÓNG BĂNG
          </div>
          <div
            style={{
              fontSize: 84,
              fontWeight: 900,
              color: C.amber,
              lineHeight: 1.1,
              marginTop: 10,
              display: 'flex',
              alignItems: 'baseline',
            }}
          >
            <CountUp at={el(s, 'stat1').start_frame_local} to={251.6} />
            <span style={{fontSize: 40, fontWeight: 700, marginLeft: 16}}>
              triệu USD
            </span>
          </div>
          <div
            style={{
              fontSize: 28,
              color: C.white,
              marginTop: 8,
              fontWeight: 600,
            }}
          >
            (TRẦN lệnh đóng băng toàn cầu)
          </div>
        </div>
      </Spoken>

      <Spoken
        at={el(s, 'stat2').start_frame_local}
        style={{...pos(70, 680, 860), textAlign: 'center'}}
      >
        <span
          style={{
            fontSize: 28,
            color: C.coral,
            fontWeight: 900,
            letterSpacing: 4,
          }}
        >
          SO VỚI THỰC TẾ ĐÃ TRẢ
        </span>
      </Spoken>

      <Spoken at={el(s, 'stat2').start_frame_local} style={pos(70, 740, 860)}>
        <div
          style={{
            background: C.panel,
            border: `2px solid ${C.blue}`,
            borderRadius: 16,
            padding: '24px 32px',
            boxSizing: 'border-box',
          }}
        >
          <div
            style={{
              fontSize: 22,
              color: C.blue,
              fontWeight: 700,
              letterSpacing: 1,
            }}
          >
            THỰC TẾ CHI TRẢ (2025)
          </div>
          <div
            style={{
              fontSize: 54,
              fontWeight: 800,
              color: C.white,
              lineHeight: 1.15,
              marginTop: 8,
            }}
          >
            ~2 triệu USD
          </div>
          <div
            style={{
              fontSize: 26,
              color: C.blue,
              marginTop: 6,
              fontWeight: 600,
            }}
          >
            {elText(s, 'stat2')}
          </div>
        </div>
      </Spoken>
    </>
  );
};

// s07: 12/2024
const S07: React.FC = () => {
  const s = 's07';
  return (
    <>
      <Chip s={s} id="chip1" y={520} size={36} h={140} accentColor={C.coral} />
      <Chip s={s} id="chip2" y={690} size={36} h={130} accentColor={C.blue} />
    </>
  );
};

// s08: WFO
const S08: React.FC = () => {
  const s = 's08';
  return (
    <>
      <Spoken
        at={el(s, 'title').start_frame_local}
        style={{...pos(70, 480, 860)}}
      >
        <div
          style={{
            background: C.panel,
            border: `2px solid ${C.blue}`,
            borderRadius: 12,
            padding: '16px 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <span style={{fontSize: 24, color: C.blue, fontWeight: 700}}>
            SCHEMATIC WFO · TÒA THƯƠNG MẠI ANH
          </span>
          <span
            style={{
              background: C.amber,
              color: C.bg,
              fontSize: 20,
              fontWeight: 900,
              padding: '4px 12px',
              borderRadius: 6,
            }}
          >
            MINH HỌA
          </span>
        </div>
      </Spoken>
      <Chip s={s} id="chip1" y={570} size={36} h={110} accentColor={C.amber} />
      <Chip
        s={s}
        id="chip2"
        y={710}
        size={36}
        h={150}
        style={{fontStyle: 'italic'}}
      />
    </>
  );
};

// s09: LỜI THẨM PHÁN (3 bilingual quote cards + note)
const S09: React.FC = () => {
  const s = 's09';
  const frame = useCurrentFrame();
  const quotes = [
    {id: 'q1', en: 'wholly illusory', vi: 'hoàn toàn ảo', y: 440},
    {id: 'q2', en: 'bizarre', vi: 'quái đản', y: 590},
    {id: 'q3', en: 'won’t pay', vi: 'không chịu trả', y: 740},
  ];
  const activeIdx = quotes
    .map((q) => el(s, q.id).start_frame_local)
    .reduce((acc, rf, i) => (frame >= rf ? i : acc), -1);
  return (
    <>
      <div
        style={{
          ...pos(70, 370, 860),
          fontSize: 24,
          color: C.coral,
          fontWeight: 800,
          letterSpacing: 2,
        }}
      >
        TRÍCH DẪN THẨM PHÁN SAINI TẠI PHIÊN ĐIỀU TRẦN:
      </div>
      {quotes.map((q, i) => {
        const at = el(s, q.id).start_frame_local;
        const pop = spring({
          frame: frame - at,
          fps: FPS,
          config: {damping: 14, stiffness: 130, mass: 0.7},
        });
        const isActive = i === activeIdx;
        return (
          <Spoken key={q.id} at={at} style={pos(70, q.y, 860)}>
            <div
              style={{
                background: C.panel,
                borderLeft: `5px solid ${isActive ? C.amber : C.coral}`,
                borderRadius: 12,
                padding: '20px 26px 20px 58px',
                boxSizing: 'border-box',
                position: 'relative',
                transform: `scale(${0.92 + 0.08 * pop})`,
                transformOrigin: 'left center',
                boxShadow: isActive ? `0 0 26px ${C.amber}55` : 'none',
              }}
            >
              <span
                style={{
                  position: 'absolute',
                  left: 10,
                  top: -4,
                  fontSize: 62,
                  lineHeight: 1,
                  color: isActive ? C.amber : C.coral,
                  fontWeight: 900,
                  fontFamily: 'Georgia, serif',
                }}
              >
                &ldquo;
              </span>
              <span
                style={{
                  fontSize: 34,
                  color: isActive ? C.amber : C.coral,
                  fontWeight: 800,
                  fontStyle: 'italic',
                }}
              >
                {q.en}
              </span>
              <span
                style={{
                  fontSize: 32,
                  color: C.white,
                  fontWeight: 700,
                  marginLeft: 16,
                }}
              >
                — {q.vi}
              </span>
            </div>
          </Spoken>
        );
      })}
      <Text
        s={s}
        id="note"
        y={920}
        size={30}
        style={{
          color: C.blue,
          fontStyle: 'italic',
          background: '#19253A88',
          padding: '14px 20px',
          borderRadius: 8,
          boxSizing: 'border-box',
        }}
      />
    </>
  );
};

// s10: PHẢN BÁC CỦA VIETJET
const S10: React.FC = () => {
  const s = 's10';
  return (
    <>
      <Chip s={s} id="chip1" y={480} size={36} h={150} accentColor={C.blue} />
      <Chip s={s} id="chip2" y={660} size={36} h={110} accentColor={C.blue} />
      <Chip s={s} id="chip3" y={800} size={36} h={110} accentColor={C.blue} />
    </>
  );
};

// s11: CHART bar zero-based (TRIỆU USD)
const S11: React.FC = () => {
  const s = 's11';
  const frame = useCurrentFrame();
  const bars = [
    {id: 'b1', val: 7.4, label: '7,4', desc: 'Nợ gốc thuê', x: 80},
    {id: 'b2', val: 18.8, label: '18,8', desc: 'Bản án 1', x: 245},
    {id: 'b3', val: 181.5, label: '181,5', desc: 'Bản án 2', x: 410},
    {id: 'b4', val: 18.3, label: '18,3', desc: 'Lãi/phí', x: 575},
    {id: 'b5', val: 251.6, label: '251,6', desc: 'TRẦN ĐÓNG BĂNG', x: 740, isMax: true},
  ];
  const maxVal = 251.6;
  const maxH = 430;
  const baseY = 980;

  return (
    <>
      <div style={{...pos(70, 440, 860), fontSize: 26, color: C.blue}}>
        Đơn vị: Triệu USD · Tỷ lệ thực tế 0 → 251,6
      </div>
      {/* Baseline */}
      <div
        style={{
          ...pos(70, baseY, 860),
          height: 2,
          background: C.blue,
        }}
      />
      <div
        style={{
          ...pos(70, baseY + 6, 60),
          fontSize: 24,
          color: C.blue,
        }}
      >
        0
      </div>

      {bars.map((b) => {
        const at = el(s, b.id).start_frame_local;
        const grow = spring({
          frame: frame - at,
          fps: FPS,
          config: {damping: 200, stiffness: 110, mass: 0.9},
        });
        const h = Math.max(12, Math.round((b.val / maxVal) * maxH * grow));
        const topY = baseY - h;
        return (
          <Spoken
            key={b.id}
            at={at}
            fromY={0}
            style={pos(b.x, topY - 70, 130)}
          >
            {/* Value label */}
            <div
              style={{
                textAlign: 'center',
                fontSize: b.isMax ? 32 : 28,
                fontWeight: 800,
                color: b.isMax ? C.amber : C.white,
              }}
            >
              <CountUp at={at} to={b.val} />
            </div>
            {/* Bar */}
            <div
              style={{
                width: 110,
                height: h,
                margin: '8px auto 0',
                background: b.isMax ? C.amber : C.panel,
                border: `2px solid ${b.isMax ? C.amber : C.blue}`,
                borderRadius: '6px 6px 0 0',
                boxSizing: 'border-box',
              }}
            />
            {/* Sub-label under baseline */}
            <div
              style={{
                position: 'absolute',
                top: h + 80,
                left: -10,
                width: 150,
                textAlign: 'center',
                fontSize: 22,
                color: b.isMax ? C.amber : C.blue,
                fontWeight: b.isMax ? 800 : 600,
                lineHeight: 1.2,
              }}
            >
              {b.desc}
            </div>
          </Spoken>
        );
      })}

      <Text
        s={s}
        id="note"
        y={1100}
        size={28}
        style={{
          color: C.coral,
          fontStyle: 'italic',
          textAlign: 'center',
        }}
      />
    </>
  );
};

// s12: CHART anatomy 251,6
const S12: React.FC = () => {
  const s = 's12';
  const frame = useCurrentFrame();
  return (
    <>
      {/* Persisting qualification banner */}
      <Spoken at={el(s, 'qual').start_frame_local} style={pos(70, 440, 860)}>
        <div
          style={{
            background: '#F5B94A22',
            border: `2px dashed ${C.amber}`,
            borderRadius: 8,
            padding: '12px 20px',
            textAlign: 'center',
            color: C.amber,
            fontSize: 26,
            fontWeight: 800,
            letterSpacing: 2,
          }}
        >
          {elText(s, 'qual')}
        </div>
      </Spoken>

      {/* Segmented bar — fills left→right as each part is spoken */}
      <div
        style={{
          ...pos(70, 520, 860),
          height: 60,
          background: C.panel,
          borderRadius: 8,
          overflow: 'hidden',
          display: 'flex',
          border: `2px solid ${C.blue}`,
          boxSizing: 'border-box',
        }}
      >
        {[
          {
            id: 'p1',
            w: 65.5,
            bg: 'repeating-linear-gradient(135deg,#FF7F6E44 0px,#FF7F6E44 8px,#FF7F6E88 8px,#FF7F6E88 16px)',
            edge: `2px solid ${C.coral}`,
            text: '~164,8',
            fs: 24,
            color: C.white,
          },
          {
            id: 'p2',
            w: 6.6,
            bg: 'repeating-linear-gradient(135deg,#F5B94A44 0px,#F5B94A44 8px,#F5B94A88 8px,#F5B94A88 16px)',
            edge: `2px solid ${C.amber}`,
            text: '16,7',
            fs: 18,
            color: C.white,
          },
          {
            id: 'p3',
            w: 27.9,
            bg: C.panel,
            edge: 'none',
            text: 'Phần còn lại',
            fs: 24,
            color: C.blue,
          },
        ].map((sg) => {
          const at = el(s, sg.id).start_frame_local;
          const grow = spring({
            frame: frame - at,
            fps: FPS,
            config: {damping: 200, stiffness: 100, mass: 0.9},
          });
          return (
            <div
              key={sg.id}
              style={{
                width: `${sg.w * grow}%`,
                height: '100%',
                background: sg.bg,
                borderRight: sg.edge,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: sg.fs,
                fontWeight: 800,
                color: sg.color,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
              }}
            >
              {sg.text}
            </div>
          );
        })}
      </div>

      <Chip s={s} id="p1" y={610} size={34} h={110} accentColor={C.coral} />
      <Chip s={s} id="p2" y={740} size={34} h={100} accentColor={C.amber} />
      <Chip s={s} id="p3" y={860} size={32} h={140} accentColor={C.blue} />
    </>
  );
};

// s13: TIMELINE HORIZONTAL
const S13: React.FC = () => {
  const s = 's13';
  const frame = useCurrentFrame();
  const nodes = [
    {id: 't1', date: '2018', label: 'Nhận 4 máy bay', isAmber: false},
    {id: 't2', date: '2021', label: 'Mất hợp đồng', isAmber: false},
    {id: 't3', date: '2022', label: 'Thu hồi 4 chiếc', isAmber: false},
    {id: 't4', date: '2024', label: 'Bản án 1', isAmber: false},
    {id: 't5', date: '12/2024', label: 'Giao dịch AHL', isAmber: false},
    {id: 't6', date: '15/10/26', label: 'WFO 251,6M', isAmber: true},
  ];
  const ids = ['t1', 't2', 't3', 't4', 't5', 't6'];
  const reveals = ids.map((id) => el(s, id).start_frame_local);
  const currentIdx = reveals.reduce(
    (acc, rf, i) => (frame >= rf ? i : acc),
    -1,
  );
  const current = currentIdx >= 0 ? ids[currentIdx] : undefined;
  const fillFrac = ids
    .slice(0, 5)
    .reduce(
      (sum, _, i) =>
        sum +
        spring({
          frame: frame - (reveals[i] + 6),
          fps: FPS,
          config: {damping: 200, stiffness: 90},
        }) /
          5,
      0,
    );

  return (
    <>
      {/* Timeline track + self-drawing fill */}
      <div
        style={{
          position: 'absolute',
          left: 90,
          top: 660,
          width: 820,
          height: 4,
          background: C.border,
        }}
      />
      <div
        style={{
          position: 'absolute',
          left: 90,
          top: 660,
          width: Math.round(820 * fillFrac),
          height: 4,
          background: C.coral,
        }}
      />

      {nodes.map((n, i) => {
        const xPos = 90 + (i * 820) / 5;
        const isUpper = i % 2 === 0;
        const color = n.isAmber ? C.amber : C.white;
        const isActive = i === currentIdx;
        return (
          <Spoken
            key={n.id}
            at={reveals[i]}
            fromY={0}
            style={{
              position: 'absolute',
              left: xPos,
              top: 660,
              width: 0,
            }}
          >
            {/* Pulse ring on the active node */}
            {isActive && (
              <div
                style={{
                  position: 'absolute',
                  left: -19,
                  top: -18,
                  width: 40,
                  height: 40,
                  borderRadius: '50%',
                  border: `3px solid ${color}`,
                  opacity: 0.35 + 0.3 * Math.sin(frame / 5),
                }}
              />
            )}
            {/* Dot */}
            <div
              style={{
                position: 'absolute',
                left: -9,
                top: -8,
                width: 20,
                height: 20,
                borderRadius: '50%',
                background: color,
                border: `3px solid ${C.bg}`,
              }}
            />
            {/* Label alternated above/below */}
            <div
              style={{
                position: 'absolute',
                left: -65,
                top: isUpper ? -140 : 35,
                width: 130,
                textAlign: 'center',
              }}
            >
              <div style={{fontSize: 28, fontWeight: 900, color}}>{n.date}</div>
              <div
                style={{
                  fontSize: 22,
                  color: C.blue,
                  marginTop: 6,
                  lineHeight: 1.2,
                }}
              >
                {n.label}
              </div>
            </div>
          </Spoken>
        );
      })}

      {current && (
        <div
          style={{
            ...pos(70, 890, 860),
            fontSize: 34,
            color: current === 't6' ? C.amber : C.white,
            borderLeft: `5px solid ${current === 't6' ? C.amber : C.coral}`,
            padding: '22px 28px',
            boxSizing: 'border-box',
            background: C.panel,
            borderRadius: 12,
            fontWeight: 700,
          }}
        >
          {elText(s, current)}
        </div>
      )}
    </>
  );
};

// s14: PHẠM VI ĐÓNG BĂNG
const S14: React.FC = () => {
  const s = 's14';
  const frame = useCurrentFrame();
  const items = [
    {id: 'i1', icon: '✈', label: '~300 máy bay đặt trước'},
    {id: 'i2', icon: '💵', label: 'Tiền cọc PDP'},
    {id: 'i3', icon: '⚙', label: 'Động cơ máy bay'},
    {id: 'i4', icon: '🎫', label: 'Tiền vé đại lý'},
  ];
  return (
    <>
      <div style={{...pos(70, 450, 860), display: 'flex', flexWrap: 'wrap', gap: 20}}>
        {items.map((it) => {
          const at = el(s, it.id).start_frame_local;
          const pop = spring({
            frame: frame - at,
            fps: FPS,
            config: {damping: 15, stiffness: 140, mass: 0.7},
          });
          return (
            <Spoken
              key={it.id}
              at={at}
              style={{
                width: 410,
                boxSizing: 'border-box',
              }}
            >
              <div
                style={{
                  background: C.panel,
                  border: `2px solid ${C.coral}`,
                  borderRadius: 12,
                  padding: '20px 22px',
                  minHeight: 110,
                  display: 'flex',
                  alignItems: 'center',
                  boxSizing: 'border-box',
                  transform: `scale(${0.85 + 0.15 * pop})`,
                }}
              >
                <span style={{fontSize: 40, marginRight: 16}}>{it.icon}</span>
                <span style={{fontSize: 28, fontWeight: 700, color: C.white}}>
                  {elText(s, it.id)}
                </span>
              </div>
            </Spoken>
          );
        })}
      </div>

      <Spoken at={el(s, 'box').start_frame_local} style={pos(70, 740, 860)}>
        <div
          style={{
            background: '#1E3A5F',
            border: `3px solid ${C.blue}`,
            borderRadius: 16,
            padding: '30px 32px',
            boxSizing: 'border-box',
            textAlign: 'center',
            boxShadow: `0 0 ${Math.round(
              16 + 10 * (0.5 + 0.5 * Math.sin(frame / 8)),
            )}px ${C.blue}66`,
          }}
        >
          <div style={{fontSize: 44, fontWeight: 900, color: C.white}}>
            ✈ VẪN BAY BÌNH THƯỜNG
          </div>
          <div
            style={{
              fontSize: 32,
              fontWeight: 700,
              color: C.blue,
              marginTop: 10,
            }}
          >
            — không phải lệnh cấm bay
          </div>
          <div
            style={{
              fontSize: 24,
              color: C.white,
              marginTop: 12,
              opacity: 0.9,
            }}
          >
            Lệnh WFO nhắm vào tài sản và dòng tiền, không dừng hoạt động khai
            thác
          </div>
        </div>
      </Spoken>
    </>
  );
};

// s15: ẢNH HƯỞNG
const S15: React.FC = () => {
  const s = 's15';
  return (
    <>
      <Chip s={s} id="c1" y={460} size={34} h={130} accentColor={C.amber} />
      <Chip s={s} id="c2" y={610} size={34} h={130} accentColor={C.blue} />
      <Chip s={s} id="c3" y={760} size={34} h={130} accentColor={C.coral} />
    </>
  );
};

// s16: NHẬN ĐỊNH
const S16: React.FC = () => {
  const s = 's16';
  return (
    <>
      <Text
        s={s}
        id="line1"
        y={380}
        size={46}
        style={{
          lineHeight: 1.35,
          paddingLeft: 24,
          borderLeft: `6px solid ${C.coral}`,
          boxSizing: 'border-box',
        }}
      />
      <Text
        s={s}
        id="line2"
        y={580}
        size={40}
        style={{color: C.amber, lineHeight: 1.35}}
      />
      <Text
        s={s}
        id="line3"
        y={820}
        size={44}
        style={{color: C.blue, fontStyle: 'italic'}}
      />
    </>
  );
};

// s17: CTA
const S17: React.FC = () => {
  const s = 's17';
  return (
    <>
      <div style={{...pos(70, 480, 860), textAlign: 'center'}}>
        <Spoken at={el(s, 'title').start_frame_local}>
          <div
            style={{
              fontSize: 72,
              fontWeight: 900,
              color: C.coral,
              letterSpacing: 4,
            }}
          >
            {elText(s, 'title')}
          </div>
          <div
            style={{
              width: 140,
              height: 5,
              background: C.coral,
              margin: '24px auto',
            }}
          />
        </Spoken>
        <Spoken at={el(s, 'sub').start_frame_local}>
          <div style={{fontSize: 44, fontWeight: 700, color: C.white}}>
            {elText(s, 'sub')}
          </div>
          <div
            style={{
              fontSize: 28,
              color: C.blue,
              marginTop: 20,
              fontWeight: 600,
            }}
          >
            Nhấn theo dõi để cập nhật diễn biến pháp lý tiếp theo
          </div>
        </Spoken>
      </div>
    </>
  );
};

// --- Dispatcher ---------------------------------------------------------------

const Body: React.FC<{s: FullSceneId}> = ({s}) => {
  switch (s) {
    case 's01':
      return <S01 />;
    case 's02':
      return <S02 />;
    case 's03':
      return <S03 />;
    case 's04':
      return <S04 />;
    case 's05':
      return <S05 />;
    case 's06':
      return <S06 />;
    case 's07':
      return <S07 />;
    case 's08':
      return <S08 />;
    case 's09':
      return <S09 />;
    case 's10':
      return <S10 />;
    case 's11':
      return <S11 />;
    case 's12':
      return <S12 />;
    case 's13':
      return <S13 />;
    case 's14':
      return <S14 />;
    case 's15':
      return <S15 />;
    case 's16':
      return <S16 />;
    case 's17':
      return <S17 />;
  }
};

// --- Caption Engine (proven france-riots adaptive 2-line) ---------------------

const Caption: React.FC<{s: FullSceneId}> = ({s}) => {
  const f = useCurrentFrame();
  const active = captionAt(s, f / FPS);
  if (!active) return null;

  const words = active.chunk_text.split(/\s+/);
  const pages: string[] = [];
  let chunk = '';
  for (const word of words) {
    if ((chunk + ' ' + word).trim().length > 80) {
      pages.push(chunk);
      chunk = word;
    } else {
      chunk = (chunk + ' ' + word).trim();
    }
  }
  if (chunk) pages.push(chunk);

  const index = Math.min(
    pages.length - 1,
    Math.floor(
      Math.max(0, f / FPS - active.start) /
        Math.max(0.01, (active.end - active.start) / pages.length),
    ),
  );
  const text = pages[index];
  const size = text.length > 68 ? 34 : text.length > 48 ? 39 : 46;

  const tokens = text.split(' ');
  let best = 1;
  for (let i = 1; i < tokens.length; i++) {
    if (
      Math.abs(tokens.slice(0, i).join(' ').length - tokens.slice(i).join(' ').length) <
      Math.abs(tokens.slice(0, best).join(' ').length - tokens.slice(best).join(' ').length)
    ) {
      best = i;
    }
  }
  const lines =
    text.length > 36
      ? [tokens.slice(0, best).join(' '), tokens.slice(best).join(' ')]
      : [text];

  return (
    <div
      style={{
        ...pos(70, 1240, 860),
        height: 210,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        textAlign: 'center',
        fontSize: size,
        lineHeight: 1.3,
        fontWeight: 700,
      }}
    >
      {lines.map((line, i) => (
        <div key={i}>{line}</div>
      ))}
    </div>
  );
};

// --- Scene Frame --------------------------------------------------------------

const Scene: React.FC<{s: FullSceneId; start: number; hud: boolean}> = ({
  s,
  start,
  hud,
}) => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill>
      {/* Retention progress bar */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          height: 8,
          width: `${(100 * (start + f)) / EPISODE_TOTAL_FRAMES}%`,
          background: C.coral,
          zIndex: 60,
        }}
      />
      <Header s={s} />
      <Body s={s} />
      <Caption s={s} />
      <div
        style={{
          ...pos(70, 1488, 860),
          fontSize: 24,
          lineHeight: 1.3,
          color: C.blue,
        }}
      >
        {SOURCE}
      </div>
      {hud && (
        <div
          style={{
            ...pos(70, 1570, 860),
            fontSize: 24,
            color: C.coral,
            fontFamily: 'monospace',
          }}
        >
          {s} · global {start + f} · {((start + f) / FPS).toFixed(2)}s · local {f}
        </div>
      )}
    </AbsoluteFill>
  );
};

// --- Main Composition ---------------------------------------------------------

export const VietjetFullV2: React.FC<{hud?: boolean}> = ({hud = false}) => (
  <AbsoluteFill style={{background: C.bg, color: C.white, fontFamily: FONT}}>
    <Audio
      src={staticFile('vietjet-20261023/' + music.public_bed_filename)}
      volume={music.composition_volume * music.gain_linear}
    />
    {SCENE_TIMING.map((sc) => (
      <Sequence
        key={sc.scene_id}
        from={sc.start_frame}
        durationInFrames={sc.scene_frames}
      >
        <Audio src={staticFile(`vietjet-20261023/voice_${sc.scene_id}.wav`)} />
        <Scene s={sc.scene_id} start={sc.start_frame} hud={hud} />
      </Sequence>
    ))}
  </AbsoluteFill>
);
