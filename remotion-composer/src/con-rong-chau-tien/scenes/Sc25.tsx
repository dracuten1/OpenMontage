import React from "react";
import { C, FONT, SceneProps, ease } from "../theme";
import { Paper, LabBadge, Reveal, CountUp, SpringPop, SourceTag, useFrac } from "../common";

// Sc25 - 609 mtDNA, 399 haplotype, 135 haplogroup, 5 ngữ hệ (Nguyễn Thúy Dương et al. 2018).
// Order (narration s13 first half): dòng truyền người mẹ -> Nguyễn Thúy Dương / Scientific Reports ->
// 609 hệ gen ty thể, 5 ngữ hệ -> 399 haplotype -> 135 haplogroup.

const Metric: React.FC<{
  to: number;
  label: string;
  sub: string;
  startFrac: number;
  x: number;
}> = ({ to, label, sub, startFrac, x }) => {
  const { frame, dur } = useFrac();
  const bob = Math.sin((frame / dur) * Math.PI * 8 + x * 0.01) * 4;
  return (
    <div style={{ position: "absolute", left: x, top: 470, width: 560, transform: `translateY(${bob}px)` }}>
      <SpringPop startFrac={startFrac} from={0.82} style={{ transformOrigin: "center top" }}>
        <div
          style={{
            height: 340,
            boxSizing: "border-box",
            background: C.card,
            border: `2px solid ${C.teal}`,
            borderRadius: 16,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 0 36px rgba(127,209,200,0.12)",
          }}
        >
          <CountUp
            to={to}
            startFrac={startFrac}
            endFrac={startFrac + 0.14}
            style={{ fontFamily: FONT.display, fontWeight: 800, fontSize: 168, lineHeight: 1, color: C.teal }}
          />
          <div style={{ fontFamily: FONT.mono, fontWeight: 500, fontSize: 40, color: C.white, marginTop: 14 }}>{label}</div>
          <div style={{ fontFamily: FONT.body, fontSize: 30, color: C.cream, marginTop: 8 }}>{sub}</div>
        </div>
      </SpringPop>
    </div>
  );
};

export const Sc25: React.FC<SceneProps> = () => {
  const { frame, dur, p } = useFrac();
  // maternal-line motif: flowing line of small nodes under the title
  const nodes = Array.from({ length: 24 });
  return (
    <Paper variant="lab">
      <LabBadge />

      <Reveal startFrac={0.03} endFrac={0.11} dy={-20} style={{ position: "absolute", left: 64, top: 128 }}>
        <div style={{ fontFamily: FONT.body, fontWeight: 700, fontSize: 30, letterSpacing: 5, color: C.teal }}>DÒNG TRUYỀN NGƯỜI MẸ</div>
        <div style={{ fontFamily: FONT.display, fontWeight: 800, fontSize: 86, color: C.white, marginTop: 10, lineHeight: 1.1 }}>
          Hệ gen ty thể (mtDNA) tại Việt Nam
        </div>
      </Reveal>

      {/* citation */}
      <Reveal startFrac={0.12} endFrac={0.2} dy={16} style={{ position: "absolute", left: 64, top: 322 }}>
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 24,
            border: `2px solid ${C.teal}`,
            background: C.card,
            borderRadius: 10,
            padding: "14px 30px",
          }}
        >
          <div style={{ fontFamily: FONT.display, fontWeight: 700, fontSize: 40, color: C.white }}>
            Nguyễn Thúy Dương et al., Scientific Reports (2018)
          </div>
        </div>
      </Reveal>

      {/* motif line */}
      <svg width={1920} height={60} viewBox="0 0 1920 60" style={{ position: "absolute", left: 0, top: 410 }}>
        {nodes.map((_, i) => {
          const t = ease(p(0.18 + i * 0.006, 0.26 + i * 0.006));
          const x = 64 + i * 76.5;
          const y = 30 + Math.sin(i * 0.7 + (frame / dur) * Math.PI * 10) * 9;
          return <circle key={i} cx={x} cy={y} r={7} fill={i % 3 === 0 ? C.teal : C.cream} opacity={t * 0.8} />;
        })}
      </svg>

      <Metric to={609} label="mtDNA hoàn chỉnh" sub="5 ngữ hệ · 609 cá thể" startFrac={0.22} x={64} />
      <Metric to={399} label="haplotype" sub="ghi nhận được" startFrac={0.46} x={680} />
      <Metric to={135} label="haplogroup" sub="khác nhau" startFrac={0.66} x={1296} />

      <Reveal startFrac={0.34} endFrac={0.42} dy={10} style={{ position: "absolute", left: 64, top: 850 }}>
        <div style={{ fontFamily: FONT.body, fontWeight: 500, fontSize: 36, color: C.cream }}>
          Viện Hàn lâm Khoa học và Công nghệ Việt Nam
        </div>
      </Reveal>

      <SourceTag text="doi:10.1038/s41598-018-29989-0" />
    </Paper>
  );
};
