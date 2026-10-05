// S14 -- Gói hành động tuần này + kết màn. Centered gold-framed 3-step checklist, then closing line + disclaimer.
// Speech-locked: header "Gói", row n on "Một"/"Hai"/"Ba", row title on its first spoken word, detail chip + tick
// when the sentence completes, closing line right after the last spoken word ("bạn").
import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { SceneFrame } from "../components";
import { C, FONT, SPRING, toneFill, toneText, type Tone } from "../theme";
import { Spoken, frameOf, frameOfEnd } from "../timing";

const S = "s14" as const;
const fHead = frameOf(S, "Gói");
const f1 = frameOf(S, "Một");
const f1Title = frameOf(S, "so");
const f1Detail = frameOf(S, "12");
const f1Tick = frameOfEnd(S, "kiệm");
const f2 = frameOf(S, "Hai");
const f2Title = frameOf(S, "tuyệt");
const f2Detail = frameOf(S, "giảm");
const f2Tick = frameOfEnd(S, "3%");
const f3 = frameOf(S, "Ba");
const f3Title = frameOf(S, "dành");
const f3Detail = frameOf(S, "công");
const f3Tick = frameOfEnd(S, "bạn");
const fClose = f3Tick + 2;

const GOLD = "#E3B94A"; // 9.9:1 on bg
const GOLD_DIM = "#B8912F";

const Tick: React.FC<{ at: number; tone: Tone }> = ({ at, tone }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = spring({ frame: frame - at, fps, config: SPRING });
  const draw = interpolate(frame, [at, at + 12], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const done = frame >= at;
  return (
    <svg width="64" height="64" viewBox="0 0 64 64" style={{ flexShrink: 0 }}>
      <rect x="4" y="4" width="56" height="56" rx="14" fill={done ? toneFill(tone) : "none"} fillOpacity={done ? Math.min(1, p) : 0} stroke={toneFill(tone)} strokeWidth="5" />
      <path d="M17 34 L28 45 L47 21" fill="none" stroke={C.onAmber} strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="60" strokeDashoffset={60 * (1 - draw)} />
    </svg>
  );
};

const Row: React.FC<{
  n: string; at: number; titleAt: number; detailAt: number; tickAt: number; tone: Tone;
  title: string; detail: string; accent?: string;
}> = ({ n, at, titleAt, detailAt, tickAt, tone, title, detail, accent }) => (
  <Spoken at={at} fromX={-60} fromY={0}>
    <div
      style={{
        display: "flex", alignItems: "center", gap: 28, padding: "0 32px", height: 148, boxSizing: "border-box", borderRadius: 24,
        background: C.surface, border: `1px solid ${C.border}`, borderLeft: `10px solid ${toneFill(tone)}`, fontFamily: FONT,
      }}
    >
      <div style={{ width: 68, height: 68, borderRadius: 34, background: toneFill(tone), color: tone === "violet" ? C.onFill : C.onAmber, fontSize: 40, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        {n}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ minHeight: 48 }}>
          <Spoken at={titleAt} fromY={10}>
            <div style={{ fontSize: 42, fontWeight: 800, color: C.text, lineHeight: 1.15 }}>
              {title}
              {accent ? <span style={{ color: toneText(tone) }}> {accent}</span> : null}
            </div>
          </Spoken>
        </div>
        <div style={{ minHeight: 40, marginTop: 6 }}>
          <Spoken at={detailAt} fromY={8}>
            <div style={{ fontSize: 32, fontWeight: 500, color: C.textSoft, lineHeight: 1.2 }}>{detail}</div>
          </Spoken>
        </div>
      </div>
      <Tick at={tickAt} tone={tone} />
    </div>
  </Spoken>
);

const S14: React.FC = () => {
  const frame = useCurrentFrame();
  const shrink = interpolate(frame, [fClose, fClose + 18], [1, 0.97], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <SceneFrame sceneId={S} glow="rgba(227,185,74,0.16)">
      <div style={{ position: "absolute", inset: 0, opacity: 1 }}>
        {/* gold frame */}
        <div style={{ position: "absolute", inset: -12, border: `2px solid ${GOLD_DIM}`, borderRadius: 36, opacity: 0.6 }} />
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", height: "100%" }}>
          <div style={{ height: 70, display: "flex", alignItems: "center" }}>
            <Spoken at={fHead} fromY={-16}>
              <div style={{ fontFamily: FONT, fontSize: 44, fontWeight: 800, letterSpacing: 3, color: GOLD }}>GÓI HÀNH ĐỘNG TUẦN NÀY</div>
            </Spoken>
          </div>
          <div style={{ width: 1440, display: "flex", flexDirection: "column", gap: 18, marginTop: 14, transform: `scale(${shrink})`, transformOrigin: "50% 0" }}>
            <Row
              n="1" at={f1} titleAt={f1Title} detailAt={f1Detail} tickAt={f1Tick} tone="green"
              title="So sánh lãi suất" accent="12 tháng"
              detail="Chênh 1,9 điểm % trên 100 triệu là gần 2 triệu đồng/năm"
            />
            <Row
              n="2" at={f2} titleAt={f2Title} detailAt={f2Detail} tickAt={f2Tick} tone="amber"
              title="Không mua đuổi vàng"
              detail="Sau tuần giảm 3%: xác định mục tiêu dài hạn, khoản dự phòng"
            />
            <Row
              n="3" at={f3} titleAt={f3Title} detailAt={f3Detail} tickAt={f3Tick} tone="violet"
              title="Dành 30 phút thử một công cụ AI"
              detail="Dùng đúng cho công việc của bạn"
            />
          </div>
          <div style={{ flex: 1 }} />
        </div>
      </div>
      {/* closing line + disclaimer, anchored above the caption band */}
      <div style={{ position: "absolute", left: 0, right: 0, bottom: 26, display: "flex", flexDirection: "column", alignItems: "center", fontFamily: FONT, opacity: 1 }}>
        <Spoken at={fClose} fromY={22}>
          <div style={{ fontSize: 52, fontWeight: 800, letterSpacing: 1, color: GOLD, textAlign: "center" }}>CHỦ ĐỘNG TÀI CHÍNH - VỮNG VÀNG TƯƠNG LAI</div>
        </Spoken>
        <Spoken at={fClose + 6} fromY={8}>
          <div style={{ marginTop: 8, fontSize: 28, fontWeight: 500, color: C.textSoft, textAlign: "center" }}>
            Nội dung chỉ mang tính tham khảo, không phải lời khuyên đầu tư.
          </div>
        </Spoken>
      </div>
    </SceneFrame>
  );
};

export default S14;
