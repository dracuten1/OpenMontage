// S09 -- Tin 4 evidence: SJC 143,5 trieu, vang the gioi giam hon 3%, then a full-width red loss box 3,9 -> 8,5 trieu/luong.
// Stacked data tiers: two price cards on top, loss warning box across the bottom.
import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { CountUp, SceneFrame } from "../components";
import { C, FONT } from "../theme";
import { Spoken, frameOf } from "../timing";

const F = {
  sjc: frameOf("s09", "sjc"), // ~18
  v1435: frameOf("s09", "143,5"), // ~41
  ban: frameOf("s09", "bán"), // ~85
  world: frameOf("s09", "thế giới"), // ~118
  giam: frameOf("s09", "giảm"), // ~126
  v3: frameOf("s09", "3%"), // ~135
  ai: frameOf("s09", "ai"), // ~150
  tuan: frameOf("s09", "2"), // ~175
  lo: frameOf("s09", "lỗ"), // ~210
  v39: frameOf("s09", "3,9"), // ~219
  v85: frameOf("s09", "8,5"), // ~235
};

const Card: React.FC<{
  flex: number; borderColor: string; at: number; label: string; labelColor?: string; children: React.ReactNode; note?: React.ReactNode;
}> = ({ flex, borderColor, at, label, labelColor = C.textSoft, children, note }) => (
  // fixed-flex slot so the layout does not reflow when the sibling card appears
  <div style={{ flex, display: "flex" }}>
  <Spoken at={at} fromY={26} fromScale={0.96} style={{ flex: 1, display: "flex" }}>
    <div
      style={{
        flex: 1, boxSizing: "border-box", padding: "22px 34px", borderRadius: 24, background: C.surface, border: `1px solid ${C.border}`,
        borderTop: `6px solid ${borderColor}`, display: "flex", flexDirection: "column", justifyContent: "center",
      }}
    >
      <div style={{ fontSize: 34, fontWeight: 700, color: labelColor }}>{label}</div>
      <div style={{ marginTop: 10, display: "flex", alignItems: "baseline", gap: 14, fontWeight: 800, lineHeight: 1 }}>{children}</div>
      <div style={{ marginTop: 12, height: 36, fontSize: 30, fontWeight: 600, color: C.muted }}>{note}</div>
    </div>
  </Spoken>
  </div>
);

const S09: React.FC = () => {
  const frame = useCurrentFrame();
  // single warning pulse on the loss box when "lo" is spoken (no strobing)
  const pulse = interpolate(frame - F.lo, [0, 8, 22], [0, 1, 0.35], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <SceneFrame sceneId="s09" glow="rgba(251,191,36,0.14)">
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 24, fontFamily: FONT, paddingBottom: 14 }}>
        {/* tier 1: two price cards */}
        <div style={{ height: 270, display: "flex", gap: 28 }}>
          <Card flex={1.3} borderColor={C.amberFill} at={F.sjc} label="Vàng miếng SJC" labelColor={C.amber} note={frame >= F.ban ? "Giá bán ra, chốt tuần" : " "}>
            <span style={{ fontSize: 128, color: C.amber }}>
              {frame >= F.v1435 ? <CountUp at={F.v1435} to={143.5} decimals={1} duration={22} /> : <span style={{ opacity: 0 }}>0</span>}
            </span>
            <span style={{ fontSize: 34, fontWeight: 600, color: C.textSoft }}>triệu đồng/lượng</span>
          </Card>
          <Card flex={1} borderColor={C.redFill} at={F.world} label="Vàng thế giới" note={frame >= F.v3 ? "Trong tuần vừa qua" : " "}>
            <span style={{ fontSize: 40, fontWeight: 700, color: C.red, opacity: frame >= F.giam ? 1 : 0 }}>▼ giảm hơn</span>
            <span style={{ fontSize: 128, color: C.red }}>
              {frame >= F.v3 ? <CountUp at={F.v3} to={3} duration={16} suffix="%" /> : <span style={{ opacity: 0 }}>0</span>}
            </span>
          </Card>
        </div>

        {/* tier 2: loss warning box, full width */}
        <div style={{ flex: 1, display: "flex" }}>
        <Spoken at={F.ai} fromY={30} fromScale={0.97} style={{ flex: 1, display: "flex" }}>
          <div
            style={{
              flex: 1, boxSizing: "border-box", borderRadius: 28, padding: "26px 44px", background: "rgba(127,29,29,0.28)",
              border: `4px solid ${C.redFill}`, boxShadow: `0 0 ${60 * pulse}px rgba(239,68,68,${0.55 * pulse})`,
              display: "flex", flexDirection: "column", justifyContent: "center",
            }}
          >
            <div style={{ display: "flex", alignItems: "baseline", gap: 18, fontSize: 44, fontWeight: 700, color: C.text, height: 60, whiteSpace: "nowrap" }}>
              <span>Ai mua vàng</span>
              <Spoken at={F.tuan} fromY={14}>
                <span style={{ color: C.amber }}>2 đến 4 tuần trước</span>
              </Spoken>
              <Spoken at={F.lo} fromY={14}>
                <span style={{ color: C.red, fontWeight: 800 }}>đang lỗ</span>
              </Spoken>
            </div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 22, marginTop: 8, fontWeight: 800, color: C.red, lineHeight: 1.05, whiteSpace: "nowrap" }}>
              <span style={{ fontSize: 190, fontVariantNumeric: "tabular-nums" }}>
                {frame >= F.v39 ? <CountUp at={F.v39} to={3.9} decimals={1} duration={14} /> : <span style={{ opacity: 0 }}>0,0</span>}
              </span>
              <span style={{ fontSize: 56, fontWeight: 700, color: C.textSoft, opacity: frame >= F.v85 - 4 ? 1 : 0 }}>đến</span>
              <span style={{ fontSize: 190, fontVariantNumeric: "tabular-nums", opacity: frame >= F.v85 ? 1 : 0 }}>
                <CountUp at={F.v85} to={8.5} decimals={1} duration={16} />
              </span>
              <span style={{ fontSize: 40, fontWeight: 600, color: C.textSoft, opacity: frame >= F.v85 ? 1 : 0 }}>triệu đồng/lượng</span>
            </div>
          </div>
        </Spoken>
        </div>
      </div>
    </SceneFrame>
  );
};

export default S09;
