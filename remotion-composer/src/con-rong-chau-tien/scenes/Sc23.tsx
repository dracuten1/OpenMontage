import React from "react";
import { C, FONT, SceneProps, ease } from "../theme";
import { Paper, LabBadge, Reveal, CountUp, SpringPop, SourceTag, useFrac } from "../common";

// Sc23 - McColl et al. 2018 (Science): 26 genome cổ, tổ tiên kép, ~32-53% Hòabìnhian (mô hình ước tính).
// Order (narration s12 first half): McColl / Science / 26 genome -> không một mô hình đơn tuyến ->
// tổ tiên kép: Hòabìnhian (~32-53%) + nông dân phương Bắc.

export const Sc23: React.FC<SceneProps> = () => {
  const { frame, dur, p } = useFrac();
  const pulse = 0.5 + 0.5 * Math.sin((frame / dur) * Math.PI * 12);

  const BAR_X = 64;
  const BAR_W = 1792;
  const lo = 0.32;
  const hi = 0.53;
  // bar fill animates 0 -> 0.32 solid, then 0.32 -> 0.53 hatched band (range)
  const fillLo = ease(p(0.5, 0.64));
  const fillHi = ease(p(0.62, 0.74));

  return (
    <Paper variant="lab">
      <LabBadge />

      {/* study card */}
      <Reveal startFrac={0.03} endFrac={0.11} dy={20} style={{ position: "absolute", left: 64, top: 128 }}>
        <div style={{ fontFamily: FONT.body, fontWeight: 700, fontSize: 30, letterSpacing: 5, color: C.teal }}>CÔNG TRÌNH THỨ HAI TRÊN SCIENCE</div>
        <div style={{ fontFamily: FONT.display, fontWeight: 800, fontSize: 84, color: C.white, marginTop: 12, lineHeight: 1.1 }}>
          McColl et al., Science (2018)
        </div>
      </Reveal>

      {/* 26 stat */}
      <div style={{ position: "absolute", left: 64, top: 310, display: "flex", alignItems: "center", gap: 34 }}>
        <Reveal startFrac={0.1} endFrac={0.18}>
          <CountUp
            to={26}
            startFrac={0.1}
            endFrac={0.24}
            style={{ fontFamily: FONT.display, fontWeight: 800, fontSize: 210, lineHeight: 1, color: C.teal, textShadow: "0 0 36px rgba(127,209,200,0.35)" }}
          />
        </Reveal>
        <Reveal startFrac={0.14} endFrac={0.22}>
          <div style={{ fontFamily: FONT.body, fontWeight: 700, fontSize: 48, color: C.white, lineHeight: 1.2 }}>
            bộ genome cổ
            <br />
            Đông Nam Á
          </div>
        </Reveal>
      </div>

      {/* rejects single model */}
      <Reveal startFrac={0.26} endFrac={0.36} dy={20} style={{ position: "absolute", left: 800, top: 330, width: 1056 }}>
        <div
          style={{
            border: `2px solid ${C.warn}`,
            borderRadius: 12,
            background: "rgba(200,85,61,0.1)",
            padding: "22px 34px",
          }}
        >
          <div style={{ fontFamily: FONT.body, fontWeight: 700, fontSize: 30, letterSpacing: 4, color: C.warn }}>BÁC BỎ</div>
          <div style={{ fontFamily: FONT.display, fontWeight: 700, fontSize: 50, color: C.white, marginTop: 6, lineHeight: 1.2 }}>
            mô hình đơn tuyến
          </div>
        </div>
      </Reveal>

      {/* dual ancestry label */}
      <Reveal startFrac={0.4} endFrac={0.5} dy={14} style={{ position: "absolute", left: 64, top: 540 }}>
        <div style={{ fontFamily: FONT.display, fontWeight: 700, fontSize: 54, color: C.white }}>
          Dân số mang dấu ấn <span style={{ color: C.teal }}>tổ tiên kép</span>
        </div>
      </Reveal>

      {/* ancestry bar */}
      <div style={{ position: "absolute", left: BAR_X, top: 660, width: BAR_W }}>
        <div
          style={{
            position: "relative",
            height: 84,
            background: C.card,
            border: `2px solid ${C.border}`,
            borderRadius: 10,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              height: "100%",
              width: `${lo * 100 * fillLo}%`,
              background: C.teal,
              opacity: 0.9,
            }}
          />
          <div
            style={{
              position: "absolute",
              left: `${lo * 100}%`,
              top: 0,
              height: "100%",
              width: `${(hi - lo) * 100 * fillHi}%`,
              backgroundImage: `repeating-linear-gradient(135deg, rgba(127,209,200,0.75) 0px, rgba(127,209,200,0.75) 10px, rgba(127,209,200,0.25) 10px, rgba(127,209,200,0.25) 20px)`,
              backgroundPositionX: frame * 0.6,
            }}
          />
          <div
            style={{
              position: "absolute",
              left: `${hi * 100}%`,
              top: 0,
              bottom: 0,
              width: `${(1 - hi) * 100}%`,
              background: "rgba(232,220,200,0.12)",
              opacity: ease(p(0.74, 0.82)),
            }}
          />
        </div>
        {/* labels under bar */}
        <Reveal startFrac={0.52} endFrac={0.6} dy={10} style={{ position: "absolute", left: 0, top: 104 }}>
          <div style={{ fontFamily: FONT.body, fontWeight: 700, fontSize: 38, color: C.teal }}>Thợ săn hái lượm Hòabìnhian</div>
          <div style={{ fontFamily: FONT.display, fontWeight: 800, fontSize: 64, color: C.white, marginTop: 4 }}>
            <SpringPop startFrac={0.62} from={0.85} style={{ display: "inline-block", transformOrigin: "left center" }}>
              ~32–53%
            </SpringPop>
          </div>
        </Reveal>
        <Reveal startFrac={0.76} endFrac={0.84} dy={10} style={{ position: "absolute", right: 0, top: 104, textAlign: "right" }}>
          <div style={{ fontFamily: FONT.body, fontWeight: 700, fontSize: 38, color: C.cream }}>Các làn sóng nông dân phương Bắc</div>
        </Reveal>
      </div>

      {/* caveat badge */}
      <SpringPop startFrac={0.86} from={0.8} style={{ position: "absolute", left: 64, top: 918, transformOrigin: "left center" }}>
        <div
          style={{
            display: "inline-block",
            border: `2px solid ${C.amber}`,
            borderRadius: 8,
            padding: "10px 24px",
            background: "rgba(217,164,65,0.12)",
            fontFamily: FONT.body,
            fontWeight: 700,
            fontSize: 30,
            color: C.amber,
            boxShadow: `0 0 ${12 + 10 * pulse}px rgba(217,164,65,0.25)`,
          }}
        >
          Một số mô hình ước tính — nguồn phụ
        </div>
      </SpringPop>

      <SourceTag text="McColl et al., Science (2018)" />
    </Paper>
  );
};
