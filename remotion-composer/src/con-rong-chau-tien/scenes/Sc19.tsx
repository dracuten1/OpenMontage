// sc-19 — Đối chiếu: phân tầng (Khun Borom) vs bình đẳng (bọc trăm trứng Việt).
// Narration order: đặt cạnh nhau -> không phân tầng, không khoét lỗ trước lỗ sau (cột trái) -> trăm con cùng một bọc, cùng nở một ngày, bình đẳng (cột phải).
// Câu chốt "triết lý bình đẳng hiếm hoi" là câu cuối của section -> hiện ở cuối sc-20.
import React from "react";
import { C, FONT, SceneProps, ease } from "../theme";
import { Paper, Reveal, SourceTag, useFrac } from "../common";

export const Sc19: React.FC<SceneProps> = () => {
  const { frame, p } = useFrac();
  const left = ease(p(0.05, 0.16));
  const right = ease(p(0.36, 0.5));
  const foot = ease(p(0.8, 0.9));
  const glow = 0.5 + 0.5 * Math.sin(frame / 14);
  const sep = ease(p(0.34, 0.44));

  return (
    <Paper>
      <div style={{ position: "absolute", top: 56, left: 64, right: 64, textAlign: "center" }}>
        <Reveal startFrac={0.01} endFrac={0.07}>
          <div style={{ fontFamily: FONT.body, fontWeight: 700, fontSize: 30, letterSpacing: 5, color: C.amber }}>ĐẶT CẠNH NHAU</div>
        </Reveal>
      </div>

      <div style={{ position: "absolute", top: 130, left: 64, right: 64, display: "flex", justifyContent: "space-between" }}>
        {/* LEFT: muted, stratified */}
        <div
          style={{
            width: 800,
            height: 700,
            padding: "36px 44px",
            background: C.card,
            border: `2px solid ${C.border}`,
            borderRadius: 20,
            opacity: left,
            transform: `translateX(${(1 - left) * -60}px)`,
            filter: `saturate(0.55)`,
          }}
        >
          <div style={{ fontFamily: FONT.body, fontWeight: 700, fontSize: 30, letterSpacing: 3, color: C.mute }}>QUẢ BẦU KHUN BOROM</div>
          {/* stacked tiers */}
          <div style={{ marginTop: 28, display: "flex", flexDirection: "column", gap: 0 }}>
            {[
              { t: "Lỗ trước", s: "", w: 640, d: 0.12 },
              { t: "Lỗ sau", s: "", w: 500, d: 0.2 },
            ].map((row, i) => (
              <Reveal key={row.t} startFrac={row.d} endFrac={row.d + 0.08}>
                <div
                  style={{
                    width: row.w,
                    marginBottom: 18,
                    padding: "14px 28px",
                    background: i === 0 ? "#3A322A" : "#2D2721",
                    borderLeft: `8px solid ${C.mute}`,
                    borderRadius: 8,
                  }}
                >
                  <div style={{ fontFamily: FONT.display, fontWeight: 700, fontSize: 52, color: C.white }}>{row.t}</div>
                </div>
              </Reveal>
            ))}
          </div>
          <Reveal startFrac={0.26} endFrac={0.34}>
            <div style={{ marginTop: 22, fontFamily: FONT.body, fontWeight: 700, fontSize: 42, color: C.cream, borderTop: `2px solid ${C.border}`, paddingTop: 20 }}>
              Phân chia thứ bậc, đẳng cấp
            </div>
          </Reveal>
        </div>

        {/* RIGHT: glowing, equal */}
        <div
          style={{
            width: 900 - 40,
            height: 700,
            padding: "36px 44px",
            background: "linear-gradient(160deg, #2E2619, #241F1A)",
            border: `3px solid ${C.amber}`,
            borderRadius: 20,
            opacity: right,
            transform: `translateX(${(1 - right) * 70}px) scale(${0.94 + 0.06 * right})`,
            boxShadow: `0 0 ${40 + glow * 40}px rgba(217,164,65,${0.28 * right + 0.1 * glow})`,
            position: "relative",
            overflow: "hidden",
          }}
        >
          <div style={{ fontFamily: FONT.body, fontWeight: 700, fontSize: 30, letterSpacing: 3, color: C.amber }}>BỌC TRĂM TRỨNG VIỆT</div>
          {/* 100 equal dots in one egg shape */}
          <svg width={780} height={250} viewBox="0 0 780 250" style={{ display: "block", margin: "10px auto 0" }}>
            <ellipse cx={390} cy={125} rx={330} ry={112} fill="rgba(217,164,65,0.08)" stroke={C.amber} strokeWidth={4} />
            {Array.from({ length: 100 }).map((_, i) => {
              const col = i % 20;
              const row = Math.floor(i / 20);
              const x = 120 + col * 28.5;
              const y = 50 + row * 36;
              const inside = ((x - 390) / 320) ** 2 + ((y - 125) / 105) ** 2 < 1;
              const t = ease(p(0.4 + (i / 100) * 0.1, 0.46 + (i / 100) * 0.1));
              const tw = 0.8 + 0.2 * Math.sin(frame / 8 + i * 0.7);
              return <circle key={i} cx={x} cy={y} r={inside ? 8 : 0} fill="#F7D98B" opacity={t * tw} />;
            })}
          </svg>
          <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 4 }}>
            <Reveal startFrac={0.52} endFrac={0.6}>
              <div style={{ fontFamily: FONT.display, fontWeight: 700, fontSize: 52, color: C.white }}>Cùng một bọc trứng</div>
            </Reveal>
            <Reveal startFrac={0.62} endFrac={0.7}>
              <div style={{ fontFamily: FONT.display, fontWeight: 700, fontSize: 52, color: C.white }}>Cùng nở một ngày</div>
            </Reveal>
            <Reveal startFrac={0.72} endFrac={0.8}>
              <div style={{ fontFamily: FONT.display, fontWeight: 800, fontSize: 64, color: C.amber, textShadow: `0 0 ${16 + glow * 16}px rgba(217,164,65,0.55)` }}>
                BÌNH ĐẲNG
              </div>
            </Reveal>
          </div>
        </div>
      </div>

      {/* centre separator */}
      <div
        style={{
          position: "absolute",
          left: 958,
          top: 150,
          width: 4,
          height: 660 * sep,
          background: `linear-gradient(to bottom, ${C.amber}, rgba(217,164,65,0))`,
        }}
      />

      <div style={{ position: "absolute", left: 64, right: 64, bottom: 110, textAlign: "center", opacity: foot, transform: `translateY(${(1 - foot) * 30}px)` }}>
        <div style={{ fontFamily: FONT.body, fontWeight: 700, fontSize: 40, color: C.white }}>
          Bình đẳng như nhau <span style={{ color: C.amber }}>trước tạo hóa</span>
        </div>
      </div>
      <SourceTag text="Truyền thuyết Khun Borom · Truyện Hồng Bàng" />
    </Paper>
  );
};
