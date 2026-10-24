import React from 'react';
import {AbsoluteFill, Audio, staticFile, useCurrentFrame} from 'remotion';
import scenarios from '../../public/crypto-tradingagents-20261020/scenarios_btc.json';

type Point = {t: number; v: number};
const C = {bg: '#081422', panel: '#0c1d30', ink: '#edf4ff', muted: '#9bb0c8', history: '#83a9ce', up: '#63e3b3', down: '#ff9086', amber: '#f3d28a'};
const anchors = {history: [0, 2.7], a: [6.34, 10.32], aInvalid: 11.18, b: [17, 20.24], bInvalid: 20.7};
const xOf = (t: number) => 24 + t * 896;
const yOf = (v: number) => 110 + (84000 - v) / 4300 * 560;
const pathOf = (points: Point[]) => points.map((p, i) => `${i ? 'L' : 'M'}${xOf(p.t).toFixed(3)},${yOf(p.v).toFixed(3)}`).join(' ');
const progress = (f: number, start: number, end: number) => Math.max(0, Math.min(1, (f - start * 30) / ((end - start) * 30)));
const captions: [number, number, string][] = [
  [0, 2.7, 'Hai kịch bản cho Bitcoin · nến ngày 19/10 đã đóng'],
  [3.1, 6.34, 'Đóng ngày trên EMA10 · 82.208 USD'],
  [6.34, 10.32, 'Theo dõi vùng 82.556–83.245 USD'],
  [10.66, 15.28, 'Vô hiệu nếu đóng ngày dưới SMA50 · 81.482 USD'],
  [15.7, 20.24, 'Đóng ngày dưới SMA50 → theo dõi 80.056 USD'],
  [20.7, 22.72, 'Vô hiệu nếu đóng ngày trở lại trên EMA10'],
  [22.72, 24.64, 'Kịch bản có điều kiện · không gán xác suất'],
];

export const Demo: React.FC<{debugHud?: boolean}> = ({debugHud = true}) => {
  const f = useCurrentFrame();
  const shown = (seconds: number) => f >= seconds * 30 ? 1 : 0;
  const a = progress(f, ...anchors.a as [number, number]);
  const b = progress(f, ...anchors.b as [number, number]);
  const history = progress(f, ...anchors.history as [number, number]);
  const split = xOf(0.45);
  const caption = captions.find(([start, end]) => f >= start * 30 && f < end * 30)?.[2] ?? '';
  const paths = [
    {id: 'a', d: pathOf(scenarios.up.path), color: C.up, p: a},
    {id: 'b', d: pathOf(scenarios.down.path), color: C.down, p: b},
  ];
  return <AbsoluteFill style={{background: C.bg, color: C.ink, fontFamily: 'Arial, sans-serif'}}>
    <Audio src={staticFile('crypto-tradingagents-20261020/narration_full.wav')} volume={1}/>
    <div style={{position: 'absolute', left: 68, top: 120, color: C.amber, fontSize: 36, fontWeight: 700, letterSpacing: 3}}>KỊCH BẢN</div>
    <div style={{position: 'absolute', left: 68, top: 180, fontSize: 64, fontWeight: 800, letterSpacing: -2}}>BTC · THEO DÕI 2 MỐC</div>
    <div style={{position: 'absolute', left: 68, top: 263, fontSize: 30, color: C.muted}}>ĐÓNG NẾN NGÀY · 19/10/2026 UTC</div>
    <div style={{position: 'absolute', left: 68, right: 68, top: 317, fontSize: 28, lineHeight: 1.3, color: C.amber}}>
      KỊCH BẢN CÓ ĐIỀU KIỆN — KHÔNG GÁN XÁC SUẤT
    </div>
    <svg viewBox="0 0 944 820" width={944} height={820} style={{position: 'absolute', left: 68, top: 400, overflow: 'hidden'}}>
      <defs>
        <clipPath id="plot"><rect x={24} y={110} width={896} height={560}/></clipPath>
        <clipPath id="history-reveal"><rect x={24} y={110} width={896 * 0.45 * history} height={560}/></clipPath>
        {paths.map(({id, d, p}) => <mask key={id} id={`draw-${id}`} maskUnits="userSpaceOnUse" x={0} y={0} width={944} height={820}>
          <path d={d} fill="none" stroke="white" strokeWidth={12} pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - p}/>
        </mask>)}
      </defs>
      <rect width={944} height={706} rx={22} fill={C.panel}/>
      <text x={24} y={37} fill={C.muted} fontSize={26}>LỊCH SỬ GIÁ · NGỮ CẢNH</text>
      <text x={920} y={37} textAnchor="end" fill={C.muted} fontSize={26}>ĐƯỜNG KỊCH BẢN · KHÔNG DỰ BÁO</text>
      <text x={24} y={80} fill={C.ink} fontSize={30} fontWeight={700}>ĐÓNG NGÀY 81.854 USD</text>
      <text x={920} y={80} textAnchor="end" fill={C.muted} fontSize={23}>Thu phóng trục giá · lịch sử được cắt khung</text>
      {[{v: 80056, label: '80.056'}, {v: 81482.05, label: '81.482'}, {v: 82208.12, label: '82.208'}, {v: 83244.91, label: '83.245'}].map(({v, label}) => <g key={label}>
        <line x1={24} x2={920} y1={yOf(v)} y2={yOf(v)} stroke="#23374c" strokeWidth={1}/>
        <text x={920} y={yOf(v) + 29} textAnchor="end" fill={C.muted} fontSize={24}>{label}</text>
      </g>)}
      <line x1={split} x2={split} y1={110} y2={670} stroke="#52667e" strokeDasharray="3 8"/>
      <g clipPath="url(#plot)">
        <g clipPath="url(#history-reveal)"><path d={pathOf(scenarios.up.history)} fill="none" stroke={C.history} strokeOpacity={0.65} strokeWidth={3.5}/></g>
        <g opacity={a}>
          <rect x={split} y={yOf(scenarios.up.target.hi)} width={920 - split} height={yOf(scenarios.up.target.lo) - yOf(scenarios.up.target.hi)} fill={C.up} fillOpacity={0.12}/>
          <line x1={split} x2={920} y1={yOf(scenarios.up.target.lo)} y2={yOf(scenarios.up.target.lo)} stroke={C.up} strokeOpacity={0.6}/>
        </g>
        <line x1={split} x2={920} y1={yOf(80056)} y2={yOf(80056)} stroke={C.down} strokeWidth={2} opacity={b}/>
        {paths.map(({id, d, color}) => <path key={id} d={d} fill="none" stroke={color} strokeWidth={5} strokeDasharray="10 9" mask={`url(#draw-${id})`}/>)}
      </g>
      <g opacity={shown(2.7)}><circle cx={split} cy={yOf(81853.54)} r={7} fill={C.ink}/></g>
      <g opacity={a} fill={C.up}>
        <text x={920} y={yOf(83244.91) - 52} textAnchor="end" fontSize={28} fontWeight={700}>A · VÙNG THAM CHIẾU</text>
        <text x={920} y={yOf(83244.91) - 16} textAnchor="end" fontSize={32} fontWeight={700}>82.556–83.245</text>
      </g>
      <g opacity={b} fill={C.down}>
        <text x={920} y={yOf(80056) - 52} textAnchor="end" fontSize={28} fontWeight={700}>B · BOLLINGER DƯỚI</text>
        <text x={920} y={yOf(80056) - 16} textAnchor="end" fontSize={32} fontWeight={700}>THEO DÕI 80.056</text>
      </g>
      {[{key: 'A', level: scenarios.up.invalid.level, start: anchors.aInvalid, text: 'A VÔ HIỆU · <81.482'}, {key: 'B', level: scenarios.down.invalid.level, start: anchors.bInvalid, text: 'B VÔ HIỆU · >82.208'}].map(({key, level, start, text}) => <g key={key} opacity={shown(start)}>
        <line x1={24} x2={920} y1={yOf(level)} y2={yOf(level)} stroke={C.amber} strokeWidth={2} strokeDasharray="8 8"/>
        <rect x={24} y={yOf(level) - 42} width={342} height={42} rx={7} fill="#302d28"/>
        <text x={36} y={yOf(level) - 12} fill={C.amber} fontSize={27} fontWeight={700}>{text}</text>
      </g>)}
      <text x={24} y={740} fill={C.muted} fontSize={24}>GIÁ ĐÓNG NGÀY · 60 NẾN</text>
      <text x={920} y={740} textAnchor="end" fill={C.muted} fontSize={24}>NÉT ĐỨT = ĐƯỜNG CÓ ĐIỀU KIỆN</text>
      <text x={24} y={784} fill={C.amber} fontSize={25}>VÔ HIỆU: điều kiện đóng nến ngày, không phải giá trong phiên</text>
    </svg>
    <div style={{position: 'absolute', left: 68, right: 68, top: 1250, opacity: shown(3.1)}}>
      <div style={{fontSize: 40, color: C.up, fontWeight: 700}}>A · HỒI KỸ THUẬT</div>
      <div style={{fontSize: 32, lineHeight: 1.3}}>Đóng ngày &gt;82.208, chưa vượt 83.245</div>
      <div style={{fontSize: 32, lineHeight: 1.3, color: C.muted}}>
        <span style={{opacity: shown(6.34)}}>Theo dõi 82.556–83.245</span>
        <span style={{opacity: shown(11.18)}}> · vô hiệu &lt;81.482</span>
      </div>
    </div>
    <div style={{position: 'absolute', left: 68, right: 68, top: 1400, opacity: shown(15.7)}}>
      <div style={{fontSize: 40, color: C.down, fontWeight: 700}}>B · THỦNG HỖ TRỢ</div>
      <div style={{fontSize: 32, lineHeight: 1.3}}>Đóng ngày &lt;81.482</div>
      <div style={{fontSize: 32, lineHeight: 1.3, color: C.muted}}>
        <span style={{opacity: shown(17)}}>Theo dõi 80.056</span>
        <span style={{opacity: shown(20.7)}}> · vô hiệu &gt;82.208</span>
      </div>
    </div>
    <div style={{position: 'absolute', left: 68, right: 68, top: 1540, height: 105, borderTop: '1px solid #304156', paddingTop: 12, fontSize: 40, lineHeight: 1.12, fontWeight: 600}}>{caption}</div>
    <div style={{position: 'absolute', left: 68, right: 68, top: 1658, fontSize: 26, lineHeight: 1.3, color: C.muted}}>
      Crypto có thể biến động mạnh và gây mất vốn.<br/>
      Đây là phân tích có điều kiện, không phải<br/>
      khuyến nghị đầu tư.
    </div>
    <div style={{position: 'absolute', left: 68, right: 68, top: 1770, fontSize: 22, lineHeight: 1.4, color: C.muted}}>
      <div>Lịch sử: Yahoo Finance · 1d · đến 19/10/2026 UTC</div>
      <div>Fetch lịch sử: 20/10/2026 11:32 UTC · USD</div>
      <div>Mốc kịch bản: phân tích ngày 19/10/2026 UTC · số làm tròn USD</div>
    </div>
    {debugHud && <div style={{position: 'absolute', left: 68, top: 1850, fontSize: 24, fontFamily: 'monospace', color: C.amber}}>{`S1 f${f} ${(f / 30).toFixed(1)}s [${f}/800]`}</div>}
  </AbsoluteFill>;
};
