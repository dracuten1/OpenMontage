import React from 'react';
import {AbsoluteFill, Audio, Sequence, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import scenarios from '../../public/crypto-tradingagents-20261020/scenarios_btc.json';

const UP = scenarios.up;

const C = {bg: '#081422', panel: '#0c1d30', ink: '#edf4ff', muted: '#9bb0c8', history: '#83a9ce', up: '#63e3b3', down: '#ff9086', amber: '#f3d28a'};

const SCENES = [
  {id: 's1', from: 0, dur: 72},
  {id: 's2', from: 72, dur: 186},
  {id: 's3', from: 258, dur: 123},
  {id: 's4', from: 381, dur: 137},
  {id: 's5', from: 518, dur: 289},
  {id: 's6', from: 807, dur: 222},
  {id: 's7', from: 1029, dur: 321},
];

const sc = (id: string) => SCENES.find((s) => s.id === id) as {id: string; from: number; dur: number};

const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
const prog = (f: number, startS: number, endS: number) => clamp01((f - startS * 30) / ((endS - startS) * 30));
const shown = (f: number, s: number) => (f >= s * 30 ? 1 : 0);

const CHIP: React.CSSProperties = {
  display: 'inline-block', fontSize: 36, fontWeight: 700, letterSpacing: 3, color: C.amber,
  border: `2px solid ${C.amber}`, padding: '10px 22px', borderRadius: 999,
};

type SceneDef = {id: string; from: number; dur: number};

const SceneFrame: React.FC<{scene: SceneDef; debugHud?: boolean; children?: (ctx: {local: number; global: number; dur: number}) => React.ReactNode}> = ({scene, debugHud, children}) => (
  <Sequence from={scene.from} durationInFrames={scene.dur}>
    <SceneInner scene={scene} debugHud={debugHud}>{children}</SceneInner>
  </Sequence>
);
const SceneInner: React.FC<{scene: SceneDef; debugHud?: boolean; children?: (ctx: {local: number; global: number; dur: number}) => React.ReactNode}> = ({scene, debugHud, children}) => {
  const local = useCurrentFrame();
  const {fps} = useVideoConfig();
  const gf = scene.from + local;
  return (<>
    {children ? children({local, global: gf, dur: scene.dur}) : null}
    {debugHud ? (<div style={{position: 'absolute', left: 68, top: 1856, fontSize: 24, fontFamily: 'monospace', color: C.amber}}>{`S${scene.id.slice(1)} f${gf} ${(gf / fps).toFixed(1)}s [${local}/${scene.dur}]`}</div>) : null}
  </>);
};

export const FullDraft: React.FC<{debugHud?: boolean}> = ({debugHud = true}) => (
  <AbsoluteFill style={{backgroundColor: C.bg, fontFamily: 'Arial, sans-serif'}}>
    <Audio src={staticFile('crypto-tradingagents-20261020/narration_draft_full.wav')} />
    <SceneFrame scene={sc('s1')} debugHud={debugHud}>{() => <SceneS1 />}</SceneFrame>
    <SceneFrame scene={sc('s2')} debugHud={debugHud}>{() => <SceneS2 />}</SceneFrame>
    <SceneFrame scene={sc('s3')} debugHud={debugHud}>{({local}) => (
        <AbsoluteFill>
          <div style={{...CHIP, position: 'absolute', left: 68, top: 120, opacity: shown(local, 0.2)}}>QUAN SÁT</div>
          <div style={{position: 'absolute', left: 68, right: 68, top: 300, height: 560, padding: 40, backgroundColor: C.panel, borderRadius: 22}}>
            <div style={{fontSize: 36, fontWeight: 700, color: C.ink, opacity: shown(local, 0.14)}}>RSI-14 · KHUNG NGÀY</div>
            <div style={{position: 'absolute', left: 40, right: 40, bottom: 40, fontSize: 22, color: C.muted}}>RSI-14 Wilder · khung ngày · 19/10/2026 UTC · giá trị từ báo cáo phân tích</div>
          </div>
          <svg style={{position: 'absolute', left: 0, top: 0}} width={1080} height={1920} viewBox="0 0 1080 1920">
            <line x1={140} y1={580} x2={940} y2={580} stroke="#23374c" strokeWidth={3} />
            <circle cx={140 + (48.06 / 100) * 800} cy={580} r={14} fill={C.amber} opacity={shown(local, 2.3)} />
          </svg>
          <div style={{position: 'absolute', left: 140 + (48.06 / 100) * 800, top: 466, transform: 'translateX(-50%)', fontSize: 72, fontWeight: 800, color: C.amber, opacity: shown(local, 2.3)}}>48,06</div>
          <div style={{...CHIP, position: 'absolute', left: 140 + (48.06 / 100) * 800, top: 628, transform: 'translateX(-50%)', fontSize: 30, color: C.muted, border: `2px solid ${C.muted}`, opacity: shown(local, 3.54)}}>VÙNG TRUNG TÍNH</div>
          <div style={{position: 'absolute', left: 68, right: 68, top: 1600, fontSize: 38, fontWeight: 600, color: C.ink, opacity: shown(local, 2.3)}}>RSI-14 khung ngày: 48,06 — trung tính</div>
        </AbsoluteFill>
      )}</SceneFrame>
    <SceneFrame scene={sc('s4')} debugHud={debugHud}>{({local}) => (
        <AbsoluteFill>
          <div style={{...CHIP, position: 'absolute', left: 68, top: 120, opacity: shown(local, 0.2)}}>NHẬN ĐỊNH</div>
          <div style={{position: 'absolute', left: 68, right: 68, top: 300, padding: 44, backgroundColor: C.panel, borderRadius: 22, display: 'flex', flexDirection: 'column', gap: 30}}>
            <div style={{fontSize: 44, fontWeight: 700, color: C.ink, opacity: shown(local, 0.4)}}>GIÁ GIỮA HAI ĐƯỜNG</div>
            <div style={{fontSize: 44, fontWeight: 700, color: C.ink, opacity: shown(local, 1.08)}}>ĐỘNG LƯỢNG CHƯA NGHIÊNG RÕ</div>
            <div style={{fontSize: 44, fontWeight: 700, color: C.amber, opacity: shown(local, 2.4)}}>ĐỐI CHIẾU ĐIỀU KIỆN ĐÓNG NẾN NGÀY</div>
            <div style={{fontSize: 30, color: C.muted, marginTop: 44, opacity: shown(local, 3.72)}}>KHÔNG ĐOÁN HƯỚNG</div>
          </div>
          <div style={{position: 'absolute', left: 68, right: 68, top: 1600, fontSize: 38, fontWeight: 600, color: C.ink, opacity: shown(local, 2.4)}}>Phân loại bằng điều kiện đóng nến ngày</div>
        </AbsoluteFill>
      )}</SceneFrame>
    <SceneFrame scene={sc('s5')} debugHud={debugHud}>{() => <AbsoluteFill>{(() => {
      // S5/S6 chart geometry: full-canvas SVG (S3 pattern) — panel rect at canvas
      // (68,480,944,880), chart scale y(v)=1420-((v-75612.5)/10990.4)*800, x=92+896t.
      const yOf = (v: number) => 1420 - ((v - 75612.5) / (86602.9 - 75612.5)) * 800;
      const xOf = (t: number) => 92 + 896 * t;
      const pts = (a: {t: number; v: number}[]) => a.map((p) => `${xOf(p.t)},${yOf(p.v)}`).join(' ');
      const split = xOf(0.45);
      const S5: React.FC = () => {
        const local = useCurrentFrame();
        const draw = (988 - split) * prog(local, 2.75, 6.53);
        return (<>
          <div style={{position: 'absolute', left: 68, right: 68, top: 120, textAlign: 'center', fontSize: 28, fontWeight: 700, color: C.amber}}>KỊCH BẢN CÓ ĐIỀU KIỆN — KHÔNG GÁN XÁC SUẤT</div>
          <div style={{position: 'absolute', left: 68, right: 68, top: 170, textAlign: 'center', fontSize: 40, fontWeight: 800, color: C.ink, opacity: shown(local, 0.3)}}>BTC · THEO DÕI 2 MỐC</div>
          <div style={{position: 'absolute', left: 68, top: 1450, fontSize: 30, fontWeight: 700, color: C.up, opacity: shown(local, 1.69)}}>A · ĐÓNG NGÀY &gt;82.208 · CHƯA VƯỢT 83.245</div>
          <div style={{position: 'absolute', left: 68, right: 68, top: 1650, fontSize: 40, fontWeight: 600, color: C.ink, opacity: shown(local, 2.75)}}>Theo dõi vùng 82.556–83.245 USD</div>
          <svg style={{position: 'absolute', left: 0, top: 0}} width={1080} height={1920} viewBox="0 0 1080 1920">
            <defs>
              <clipPath id="s5-hist"><rect x={0} y={0} width={split} height={1920} /></clipPath>
              <mask id="s5-draw"><rect x={split} y={0} width={draw} height={1920} fill="#fff" /></mask>
            </defs>
            <rect x={68} y={480} width={944} height={880} rx={22} fill={C.panel} />
            <polyline points={pts(UP.history)} fill="none" stroke={C.history} strokeWidth={3.5} opacity={0.9} clipPath="url(#s5-hist)" />
            <line x1={split} y1={500} x2={split} y2={1360} stroke="#52667e" strokeWidth={2} strokeDasharray="3 8" />
            <text x={92} y={510} fontSize={24} fontWeight={700} fill={C.history} opacity={shown(local, 0.05)}>QUAN SÁT · GIÁ THẬT 60 NẾN</text>
            <text x={988} y={510} textAnchor="end" fontSize={24} fontWeight={700} fill={C.amber} opacity={shown(local, 0.05)}>KỊCH BẢN · ĐƯỜNG CÓ ĐIỀU KIỆN</text>
            <circle cx={split} cy={yOf(81853.5390625)} r={7} fill={C.ink} opacity={shown(local, 0)} />
            <rect x={split} y={yOf(83244.91)} width={988 - split} height={yOf(82556.03) - yOf(83244.91)} fill={C.up} fillOpacity={0.12} opacity={shown(local, 2.75)} />
            <text x={984} y={yOf(83244.91) - 14} textAnchor="end" fontSize={26} fontWeight={700} fill={C.up} opacity={shown(local, 3.4)}>VÙNG THAM CHIẾU 82.556–83.245</text>
            <polyline points={pts(UP.path)} fill="none" stroke={C.up} strokeWidth={5} strokeDasharray="10 9" mask="url(#s5-draw)" />
            <line x1={92} y1={yOf(81482.05)} x2={988} y2={yOf(81482.05)} stroke={C.amber} strokeWidth={2} strokeDasharray="8 8" opacity={shown(local, 7.15)} />
            <g opacity={shown(local, 7.15)}>
              <rect x={88} y={yOf(81482.05) - 52} width={520} height={38} fill={C.bg} opacity={0.85} />
              <text x={92} y={yOf(81482.05) - 24} fontSize={26} fontWeight={700} fill={C.amber}>A VÔ HIỆU · ĐÓNG NGÀY &lt;81.482</text>
            </g>
          </svg>
        </>);
      };
      return <S5 />;
    })()}</AbsoluteFill>}</SceneFrame>
    <SceneFrame scene={sc('s6')} debugHud={debugHud}>{() => <AbsoluteFill>{(() => {
      // S6 rebuilds the S5 chart layout fresh (same geometry, see S5 comment) with
      // scenario A dimmed to 0.5 and scenario B drawn on top.
      const yOf = (v: number) => 1420 - ((v - 75612.5) / (86602.9 - 75612.5)) * 800;
      const xOf = (t: number) => 92 + 896 * t;
      const pts = (a: {t: number; v: number}[]) => a.map((p) => `${xOf(p.t)},${yOf(p.v)}`).join(' ');
      const split = xOf(0.45);
      const S6: React.FC = () => {
        const local = useCurrentFrame();
        const drawA = (988 - split) * prog(local, 2.75, 6.53);
        const drawB = (988 - split) * prog(local, 2.42, 5.18);
        return (<>
          <div style={{position: 'absolute', left: 68, right: 68, top: 120, textAlign: 'center', fontSize: 28, fontWeight: 700, color: C.amber}}>KỊCH BẢN CÓ ĐIỀU KIỆN — KHÔNG GÁN XÁC SUẤT</div>
          <div style={{position: 'absolute', left: 68, right: 68, top: 170, textAlign: 'center', fontSize: 40, fontWeight: 800, color: C.ink, opacity: shown(local, 0.3)}}>BTC · THEO DÕI 2 MỐC</div>
          <div style={{position: 'absolute', left: 68, top:  1450, fontSize: 30, fontWeight:  700, color: C.down, opacity: shown(local, 0.98)}}>B · ĐÓNG NGÀY &lt;81.482</div>
          <div style={{position: 'absolute', left: 68, right: 68, top: 1650, fontSize: 40, fontWeight: 600, color: C.ink, opacity: shown(local, 2.42)}}>Theo dõi mốc 80.056 USD</div>
          <svg style={{position: 'absolute', left: 0, top: 0}} width={1080} height={1920} viewBox="0 0 1080 1920">
            <defs>
              <clipPath id="s6-hist"><rect x={0} y={0} width={split} height={1920} /></clipPath>
              <mask id="s6-drawA"><rect x={split} y={0} width={drawA} height={1920} fill="#fff" /></mask>
              <mask id="s6-drawB"><rect x={split} y={0} width={drawB} height={1920} fill="#fff" /></mask>
            </defs>
            <rect x={68} y={480} width={944} height={880} rx={22} fill={C.panel} />
            <polyline points={pts(scenarios.down.history)} fill="none" stroke={C.history} strokeWidth={3.5} opacity={0.9} clipPath="url(#s6-hist)" />
            <line x1={split} y1={500} x2={split} y2={1360} stroke="#52667e" strokeWidth={2} strokeDasharray="3 8" />
            <text x={92} y={510} fontSize={24} fontWeight={700} fill={C.history} opacity={shown(local, 0.05)}>QUAN SÁT · GIÁ THẬT 60 NẾN</text>
            <text x={988} y={510} textAnchor="end" fontSize={24} fontWeight={700} fill={C.amber} opacity={shown(local, 0.05)}>KỊCH BẢN · ĐƯỜNG CÓ ĐIỀU KIỆN</text>
            <circle cx={split} cy={yOf(81853.5390625)} r={7} fill={C.ink} opacity={1} />
            <g opacity={0.5}>
              <rect x={split} y={yOf(83244.91)} width={988 - split} height={yOf(82556.03) - yOf(83244.91)} fill={C.up} fillOpacity={0.12} opacity={1} />
              <text x={984} y={yOf(83244.91) - 14} textAnchor="end" fontSize={26} fontWeight={700} fill={C.up} opacity={1}>VÙNG THAM CHIẾU 82.556–83.245</text>
              <polyline points={pts(UP.path)} fill="none" stroke={C.up} strokeWidth={5} strokeDasharray="10 9" mask="url(#s6-drawA)" />
              <line x1={92} y1={yOf(81482.05)} x2={988} y2={yOf(81482.05)} stroke={C.amber} strokeWidth={2} strokeDasharray="8 8" opacity={1} />
              <g opacity={1}>
                <rect x={88} y={yOf(81482.05) - 52} width={520} height={38} fill={C.bg} opacity={0.85} />
                <text x={92} y={yOf(81482.05) - 24} fontSize={26} fontWeight={700} fill={C.amber}>A VÔ HIỆU · ĐÓNG NGÀY &lt;81.482</text>
              </g>
            </g>
            <line x1={92} y1={yOf(80056)} x2={988} y2={yOf(80056)} stroke={C.down} strokeWidth={2} opacity={shown(local, 2.42)} />
            <text x={984} y={yOf(80056) - 14} textAnchor="end" fontSize={26} fontWeight={700} fill={C.down} opacity={shown(local, 3.0)}>B · BOLLINGER DƯỚI 80.056</text>
            <polyline points={pts(scenarios.down.path)} fill="none" stroke={C.down} strokeWidth={5} strokeDasharray="10 9" mask="url(#s6-drawB)" />
            <line x1={92} y1={yOf(82208.12)} x2={988} y2={yOf(82208.12)} stroke={C.amber} strokeWidth={2} strokeDasharray="8 8" opacity={shown(local, 5.56)} />
            <g opacity={shown(local, 5.56)}>
              <rect x={88} y={yOf(82208.12) - 52} width={520} height={38} fill={C.bg} opacity={0.85} />
              < text x={92} y={yOf(82208.12) - 54} fontSize={26} fontWeight={700} fill={C.amber}>B VÔ HIỆU · ĐÓNG NGÀY &gt;82.208</text>
            </g>
          </svg>
        </>);
      };
      return <S6 />;
    })()}</AbsoluteFill>}</SceneFrame>
    <SceneFrame scene={sc('s7')} debugHud={debugHud}>{({local}) => <AbsoluteFill>{(() => {
      // S7 summary chart: SVG panel at (68,260,944,650); y(v)=590-((v-75612.5)/10990.4)*470,
      // x(t)=24+896t; history squeezed into t<0.45, both scenario paths dashed after split.
      const yOf7 = (v: number) => 590 - ((v - 75612.5) / (86602.9 - 75612.5)) * 470;
      const xOf7 = (t: number) => 24 + 896 * t;
      const hist7 = UP.history.map((p) => `${xOf7(p.t / 0.45)},${yOf7(p.v)}`).join(' ');
      const pathA7 = UP.path.map((p) => `${xOf7(p.t)},${yOf7(p.v)}`).join(' ');
      const pathB7 = scenarios.down.path.map((p) => `${xOf7(p.t)},${yOf7(p.v)}`).join(' ');
      return (<>
        <svg style={{position: 'absolute', left: 68, top: 260}} width={944} height={650} viewBox="0 0 944 650">
          <rect x={0} y={0} width={944} height={650} rx={22} fill={C.panel} />
          <polyline points={hist7} fill="none" stroke={C.history} strokeWidth={3} opacity={0.9} />
          <polyline points={pathA7} fill="none" stroke={C.up} strokeWidth={4} strokeDasharray="8 7" />
          <polyline points={pathB7} fill="none" stroke={C.down} strokeWidth={4} strokeDasharray="8 7" />
          <circle cx={xOf7(0.45)} cy={yOf7(81853.54)} r={6} fill={C.ink} />
          <line x1={24} y1={yOf7(81482.05)} x2={920} y2={yOf7(81482.05)} stroke={C.amber} strokeWidth={1.5} strokeDasharray="6 6" />
          <text x={30} y={yOf7(81482.05) - 8} fontSize={20} fontWeight={700} fill={C.amber}>A VÔ HIỆU · ĐÓNG NGÀY &lt;81.482</text>
          <line x1={24} y1={yOf7(82208.12)} x2={920} y2={yOf7(82208.12)} stroke={C.amber} strokeWidth={1.5} strokeDasharray="6 6" />
          <text x={30} y={yOf7(82208.12) + 24} fontSize={20} fontWeight={700} fill={C.amber}>B VÔ HIỆU · ĐÓNG NGÀY &gt;82.208</text>
          <rect x={xOf7(0.45)} y={yOf7(83244.91)} width={920 - xOf7(0.45)} height={yOf7(82556.03) - yOf7(83244.91)} fill={C.up} fillOpacity={0.12} />
          <text x={916} y={yOf7(83244.91) - 10} textAnchor="end" fontSize={22} fontWeight={700} fill={C.up}>A · 82.556–83.245</text>
          <line x1={24} y1={yOf7(80056)} x2={920} y2={yOf7(80056)} stroke={C.down} strokeWidth={1.5} />
          <text x={916} y={yOf7(80056) - 10} textAnchor="end" fontSize={22} fontWeight={700} fill={C.down}>B · 80.056</text>
          <text x={24} y={40} fontSize={20} fontWeight={700} fill={C.history}>QUAN SÁT · GIÁ THẬT</text>
          <text x={920} y={40} textAnchor="end" fontSize={20} fontWeight={700} fill={C.amber}>KỊCH BẢN · CÓ ĐIỀU KIỆN</text>
        </svg>
        <div style={{position: 'absolute', left: 68, right: 68, top: 980}}>
          <div style={{fontSize: 40, fontWeight: 700, color: C.ink, lineHeight: 1.3, opacity: shown(local, 0.34)}}>Lưu checklist nếu bạn muốn đối chiếu khi điều kiện thay đổi.</div>
          <div style={{fontSize: 40, fontWeight: 700, color: C.ink, lineHeight: 1.3, marginTop: 26, opacity: shown(local, 3.04)}}>Bạn muốn mình giải thích điều kiện nào?</div>
        </div>
        <div style={{position: 'absolute', left: 68, right: 68, top: 1420, fontSize: 30, color: C.amber, lineHeight: 1.45, opacity: shown(local, 4.56)}}>
          <div>Crypto có thể biến động mạnh và gây mất vốn.</div>
          <div>Đây là phân tích có điều kiện,</div>
          <div>không phải khuyến nghị đầu tư.</div>
        </div>
        <div style={{position: 'absolute', left: 68, right: 68, top: 1660, fontSize: 22, color: C.muted, opacity: 1}}>
          <div>Lịch sử: Yahoo Finance · 1d · đến 19/10/2026 UTC</div>
          <div>Fetch lịch sử: 20/10/2026 11:32 UTC · USD</div>
          <div>RSI-14 Wilder · khung ngày · 19/10/2026 UTC</div>
        </div>
      </>);
    })()}</AbsoluteFill>}</SceneFrame>
  </AbsoluteFill>
);

const SceneS1: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill>
      <div style={{position: 'absolute', top: 400, left: 0, right: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 36}}>
        <div style={{...CHIP, opacity: shown(f, 0.1)}}>QUAN SÁT</div>
        <div style={{fontSize: 64, fontWeight: 800, color: C.ink, letterSpacing: 2, opacity: shown(f, 0.5)}}>
          BITCOIN GIỮA HAI ĐƯỜNG
        </div>
        <div style={{fontSize: 34, color: C.muted, letterSpacing: 4, opacity: shown(f, 0.9)}}>
          THEO DÕI 2 KỊCH BẢN
        </div>
      </div>
      <div style={{position: 'absolute', left: 68, right: 68, top: 1600, fontSize: 38, fontWeight: 600, color: C.ink, opacity: shown(f, 0.3)}}>Bitcoin giữa hai đường trung bình</div>
      <div style={{position: 'absolute', top: 1700, left: 68, right: 68, fontSize: 22, color: C.muted, lineHeight: 1.6}}>
        <div>Crypto có thể biến động mạnh và gây mất vốn.</div>
        <div>Đây là phân tích có điều kiện, không phải khuyến nghị đầu tư.</div>
      </div>
    </AbsoluteFill>
  );
};

const SceneS2: React.FC = () => {
  const local = useCurrentFrame();
  const history = UP.history;
  const values = history.map((p) => p.v);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const points = history.map((p) => [24 + 880 * (p.t / 0.45), 400 - ((p.v - min) / (max - min)) * 340]);
  const last = points[points.length - 1];
  return (
    <AbsoluteFill>
      <div style={{...CHIP, position: 'absolute', left: 68, top: 120}}>QUAN SÁT</div>
      <div style={{position: 'absolute', left: 68, top: 220, opacity: shown(local, 3.7 - 2.4)}}>
        <span style={{fontSize: 96, fontWeight: 800, color: C.ink}}>81.854</span>
        <span style={{fontSize: 40, color: C.muted, marginLeft: 24}}>USD</span>
      </div>
      <div style={{position: 'absolute', left: 68, top: 360, fontSize: 34, color: C.muted, opacity: shown(local, 6.0 - 2.4)}}>
        TRÊN SMA50 · DƯỚI EMA10
      </div>
      <svg style={{position: 'absolute', left: 68, top: 480}} width={944} height={420} viewBox="0 0 944 420">
        <defs>
          <clipPath id="s2-history-reveal">
            <rect x={24} y={0} width={880 * prog(local, 0.18, 1.0)} height={420} />
          </clipPath>
        </defs>
        <polyline points={points.map(([x, y]) => `${x},${y}`).join(' ')} stroke={C.history} strokeWidth={4} fill="none" opacity={0.9} clipPath="url(#s2-history-reveal)" />
        <circle cx={last[0]} cy={last[1]} r={7} fill={C.ink} opacity={shown(local, 1.0)} />
      </svg>
      <div style={{position: 'absolute', left: 68, right: 68, top: 1600, fontSize: 38, fontWeight: 600, color: C.ink, opacity: shown(local, 1.3)}}>Nến ngày 19/10 đóng ở 81.854 USD</div>
      <div style={{position: 'absolute', left: 68, right: 68, top: 1660, fontSize: 38, fontWeight: 600, color: C.ink, opacity: shown(local, 3.6)}}>Trên SMA50 · dưới EMA10</div>
      <div style={{position: 'absolute', left: 68, right: 68, top: 932, fontSize: 22, color: C.muted, lineHeight: 1.5}}>
        Yahoo Finance · 1d · nến 19/10/2026 UTC · fetch 20/10/2026 11:32 UTC · USD
      </div>
    </AbsoluteFill>
  );
};

/* __APPEND_SCENES_BELOW__ */
