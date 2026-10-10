// VN-Myth Ep.05 scenes sc012–sc023 — HỒI MỘT: người Hán nhìn xuống phương Nam,
// từ điển cổ 百越, so sánh «người phương Đông», lưới 6 nét (diagram chủ lực),
// tranh mực cổ thư (ảnh gen BASE + overlay), chốt Hồi 1.
import React from "react";
import {
  Chip,
  DrumGlyph,
  InkDraw,
  InkImageScene,
  Lamp,
  MAP_LAMPS,
  MapCanvas,
  MapLabel,
  Paper,
  Reveal,
  SixCell,
  SpringPop,
  TextCard,
  ease,
  useA,
  useFrac,
} from "./common";
import { C, FONT, SceneProps } from "./theme";

// Lưới 6 nét dùng chung sc018/sc020/sc022 (2×3, 520×320 cells)
const CELL_XY: [number, number][] = [
  [200, 210],
  [760, 210],
  [1320, 210],
  [200, 570],
  [760, 570],
  [1320, 570],
];

const CellIconHair: React.FC = () => (
  <g fill="none" stroke={C.cream} strokeWidth={4} strokeLinecap="round">
    <circle cx={46} cy={34} r={18} />
    <path d="M 30 48 L 24 84 M 40 52 L 40 88 M 62 48 L 68 84" />
  </g>
);
const CellIconTattoo: React.FC = () => (
  <g fill="none" stroke={C.cream} strokeWidth={4} strokeLinecap="round">
    <path d="M 14 56 Q 30 40 46 56 Q 62 72 78 56" />
    <path d="M 14 72 Q 30 56 46 72 Q 62 88 78 72" />
  </g>
);
const CellIconArm: React.FC = () => (
  <g fill="none" stroke={C.cream} strokeWidth={4} strokeLinecap="round">
    <path d="M 12 46 L 74 34 L 78 46 L 16 58 Z" />
    <path d="M 40 52 L 34 82" stroke={C.warn} strokeWidth={6} />
  </g>
);
const CellIconHouse: React.FC = () => (
  <g fill="none" stroke={C.cream} strokeWidth={4} strokeLinecap="round">
    <path d="M 22 40 L 46 22 L 70 40" />
    <path d="M 28 40 L 64 40 L 64 62 L 28 62 Z" />
    <path d="M 34 62 L 30 86 M 58 62 L 62 86" />
  </g>
);
const CellIconBoat: React.FC = () => (
  <g fill="none" stroke={C.cream} strokeWidth={4} strokeLinecap="round">
    <path d="M 14 56 Q 46 76 78 56 L 68 68 L 24 68 Z" fill={C.card} />
    <path d="M 46 56 L 46 22 M 46 28 L 64 38 L 46 44" />
  </g>
);
const SixCellDefs: { hanzi: string; label: string; note?: string; icon: React.ReactNode }[] = [
  { hanzi: "斷髮", label: "cắt tóc", icon: <CellIconHair /> },
  { hanzi: "紋身", label: "xăm mình", icon: <CellIconTattoo /> },
  { hanzi: "契臂", label: "khắc cánh tay (thề máu)", note: "khó dịch nhất", icon: <CellIconArm /> },
  { hanzi: "巢居", label: "nhà sàn", icon: <CellIconHouse /> },
  { hanzi: "使舟", label: "đi thuyền", icon: <CellIconBoat /> },
  { hanzi: "銅鼓", label: "đúc trống đồng", icon: <span /> },
];

const SixGrid: React.FC<{ lit: number[]; gridAt: number }> = ({ lit, gridAt }) => {
  const { p } = useFrac();
  const frameT = ease(p(gridAt, gridAt + 0.08));
  return (
    <Paper>
      <div style={{ position: "absolute", inset: 0, opacity: frameT }}>
        <Reveal startFrac={gridAt} endFrac={gridAt + 0.06}>
          <div
            style={{
              position: "absolute",
              top: 68,
              left: 0,
              right: 0,
              textAlign: "center",
              fontFamily: FONT.body,
              fontWeight: 700,
              fontSize: 34,
              letterSpacing: 4,
              color: C.amber,
            }}
          >
            «DẤU HIỆU NHẬN DIỆN» — TỪ ĐIỂN CỔ GHI 6 NÉT
          </div>
        </Reveal>
        {SixCellDefs.map((d, i) => (
          <SixCell
            key={i}
            hanzi={d.hanzi}
            label={d.label}
            note={d.note}
            lit={lit[i] ?? 0}
            x={CELL_XY[i][0]}
            y={CELL_XY[i][1]}
            icon={d.icon}
          />
        ))}
      </div>
    </Paper>
  );
};

// sc012 — NGƯỜI VẼ BẢN ĐỒ: POV nhìn xuống phương Nam
export const Sc012: React.FC<SceneProps> = () => {
  const A = useA();
  const a1 = 0.02; // «Người vẽ bản đồ…» (clamped)
  const a2 = A("như"); // «như nhìn xuống một cõi mờ sương»
  return (
    <MapCanvas dim={0.42}>
      <div
        style={{
          position: "absolute",
          inset: 40,
          border: `2px solid ${C.cream}66`,
          borderRadius: 6,
          pointerEvents: "none",
        }}
      />
      <Reveal startFrac={a1} endFrac={a1 + 0.08}>
        <div
          style={{
            position: "absolute",
            top: 92,
            left: 0,
            right: 0,
            textAlign: "center",
            fontFamily: FONT.display,
            fontWeight: 700,
            fontSize: 62,
            color: C.white,
            textShadow: "0 2px 12px rgba(0,0,0,0.9)",
          }}
        >
          Người vẽ bản đồ — không phải người trong bản đồ.
        </div>
      </Reveal>
      <Reveal startFrac={a2} endFrac={a2 + 0.08}>
        <div
          style={{
            position: "absolute",
            bottom: 96,
            left: 0,
            right: 0,
            textAlign: "center",
            fontFamily: FONT.body,
            fontSize: 40,
            color: C.cream,
            background: "rgba(20,17,13,0.74)",
            padding: "14px 30px",
          }}
        >
          nhìn xuống phương Nam — như nhìn xuống một cõi mờ sương.
        </div>
      </Reveal>
    </MapCanvas>
  );
};

// sc013 — CHUYỂN HỒI MỘT
export const Sc013: React.FC<SceneProps> = () => {
  const A = useA();
  const a1 = A("người", 6); // «người Hán, khi viết hai chữ Bách Việt»
  return (
    <Paper>
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Reveal startFrac={0.04} endFrac={0.12}>
          <div style={{ fontFamily: FONT.mono, fontSize: 30, letterSpacing: 6, color: C.amber }}>
            HỒI MỘT
          </div>
        </Reveal>
        <SpringPop startFrac={0.1} style={{ marginTop: 24 }}>
          <div style={{ fontFamily: FONT.display, fontWeight: 800, fontSize: 108, color: C.white }}>
            Người Hán nhìn xuống phương Nam
          </div>
        </SpringPop>
        {/* nét mực Trường Giang ngang */}
        <InkDraw
          d="M 120 0 Q 480 -60 960 0 Q 1440 60 1800 0"
          startFrac={a1}
          endFrac={a1 + 0.14}
          viewBox="0 0 1920 120"
          width={1400}
          height={120}
          stroke={C.amber}
          strokeWidth={6}
          style={{ marginTop: 40, transform: "scale(0.8)" }}
        />
        <Reveal startFrac={a1 + 0.12} endFrac={a1 + 0.2}>
          <div style={{ fontFamily: FONT.body, fontSize: 36, color: C.mute, marginTop: 28 }}>
            khi viết hai chữ Bách Việt — họ thấy gì?
          </div>
        </Reveal>
      </div>
    </Paper>
  );
};

// sc014 — QUOTE TỪ ĐIỂN CỔ: 百越
export const Sc014: React.FC<SceneProps> = () => {
  const A = useA();
  const a1 = A("định"); // «định nghĩa của từ điển cổ»
  const a2 = A("tổng"); // «tổng xưng các tộc Việt tản mát»
  return (
    <Paper variant="museum">
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 110,
          padding: "0 140px",
        }}
      >
        <SpringPop startFrac={a1} from={0.7}>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontFamily: FONT.hanzi, fontWeight: 700, fontSize: 240, color: C.white, lineHeight: 1 }}>
              百越
            </div>
            <div style={{ fontFamily: FONT.mono, fontSize: 30, color: C.amber, marginTop: 16 }}>
              bách · việt
            </div>
          </div>
        </SpringPop>
        <div>
          <Reveal startFrac={a1 + 0.06} endFrac={a1 + 0.14}>
            <div style={{ fontFamily: FONT.body, fontWeight: 700, fontSize: 30, letterSpacing: 4, color: C.amber }}>
              TỪ ĐIỂN CỔ — ĐỊNH NGHĨA
            </div>
          </Reveal>
          <Reveal startFrac={a2} endFrac={a2 + 0.12}>
            <div style={{ fontFamily: FONT.display, fontWeight: 700, fontSize: 66, color: C.white, lineHeight: 1.35, marginTop: 20, maxWidth: 900 }}>
              «tổng xưng các tộc Việt tản mát khắp phương Nam»
            </div>
          </Reveal>
          <Reveal startFrac={a2 + 0.14} endFrac={a2 + 0.22}>
            <div style={{ fontFamily: FONT.body, fontSize: 36, color: C.cream, marginTop: 26 }}>
              <span style={{ color: C.amber }}>tổng xưng</span> — cách gọi gộp của người ngoài,
              không phải tên tự đặt.
            </div>
          </Reveal>
        </div>
      </div>
    </Paper>
  );
};

// sc015 — PHÉP SO SÁNH «NGƯỜI PHƯƠNG ĐÔNG»
export const Sc015: React.FC<SceneProps> = () => {
  const A = useA();
  const a1 = 0.04; // «Người xưa không nói một dân tộc» (clamped)
  const a2 = A("không", 5); // «không ai lấy Bách Việt làm quốc tịch»
  return (
    <Paper>
      <Reveal startFrac={a1} endFrac={a1 + 0.08}>
        <div
          style={{
            position: "absolute",
            top: 100,
            left: 0,
            right: 0,
            textAlign: "center",
            fontFamily: FONT.body,
            fontWeight: 700,
            fontSize: 36,
            letterSpacing: 3,
            color: C.amber,
          }}
        >
          PHÉP SO SÁNH
        </div>
      </Reveal>
      <div
        style={{
          position: "absolute",
          top: 260,
          left: 0,
          right: 0,
          display: "flex",
          justifyContent: "center",
          gap: 140,
        }}
      >
        {[
          { t: "BÁCH VIỆT", s: "cách gọi từ BẮC nhìn XUỐNG" },
          { t: "NGƯỜI PHƯƠNG ĐÔNG", s: "cách gọi từ TÂY nhìn QUA" },
        ].map((col, i) => (
          <SpringPop key={i} startFrac={a1 + 0.06 + i * 0.08}>
            <div
              style={{
                width: 660,
                border: `2px solid ${C.border}`,
                borderRadius: 12,
                background: "rgba(24,20,16,0.86)",
                padding: "44px 40px",
                textAlign: "center",
              }}
            >
              <div style={{ fontFamily: FONT.display, fontWeight: 800, fontSize: 60, color: C.white }}>
                {col.t}
              </div>
              <div style={{ fontFamily: FONT.body, fontSize: 34, color: C.mute, marginTop: 20 }}>
                {col.s}
              </div>
              <div style={{ fontFamily: FONT.body, fontSize: 34, color: C.cream, marginTop: 14 }}>
                một «cái ô» — chứ không phải một dân tộc.
              </div>
            </div>
          </SpringPop>
        ))}
      </div>
      <Reveal startFrac={a2} endFrac={a2 + 0.08}>
        <div
          style={{
            position: "absolute",
            bottom: 130,
            left: 0,
            right: 0,
            textAlign: "center",
            fontFamily: FONT.display,
            fontWeight: 700,
            fontSize: 56,
            color: C.warn,
          }}
        >
          không ai tự xưng «dân Bách Việt».
        </div>
      </Reveal>
    </Paper>
  );
};

// sc016 — KHÔNG AI TỰ GỌI MÌNH LÀ BÁCH VIỆT (vùng tự sáng nhãn riêng)
export const Sc016: React.FC<SceneProps> = () => {
  const A = useA();
  const { p } = useFrac();
  const a1 = A("gọi", 2); // «gọi mình là Mân Việt»
  const regions = [
    { k: "man", hanzi: "閩越", s: a1, t: "Mân Việt" },
    { k: "nam", hanzi: "南越", s: a1 + 0.1, t: "Nam Việt" },
    { k: "dongau", hanzi: "東越", s: a1 + 0.2, t: "Đông Việt" },
    { k: "tayau", hanzi: "西甌", s: a1 + 0.3, t: "Tây Âu" },
    { k: "lac", hanzi: "雒越", s: a1 + 0.4, t: "Lạc Việt" },
  ];
  return (
    <MapCanvas dim={0.46}>
      <svg width={1920} height={1080} viewBox="0 0 1920 1080" style={{ position: "absolute", inset: 0 }}>
        {regions.map((r) => {
          const L = MAP_LAMPS[r.k as keyof typeof MAP_LAMPS];
          return <Lamp key={r.k} x={L.x} y={L.y} scale={1} lit={ease(p(r.s, r.s + 0.06))} />;
        })}
      </svg>
      {regions.map((r) => {
        const L = MAP_LAMPS[r.k as keyof typeof MAP_LAMPS];
        return (
          <MapLabel
            key={r.k}
            x={L.x}
            y={L.y}
            text={`${r.hanzi} · ${r.t}`}
            startFrac={r.s + 0.04}
          />
        );
      })}
      <Reveal startFrac={0.94} endFrac={0.97}>
        <div style={{ position: "absolute", bottom: 96, left: 0, right: 0, textAlign: "center" }}>
          <Chip color={C.amber}>«Bách Việt» — cách gọi gộp cả trăm thứ Việt.</Chip>
        </div>
      </Reveal>
    </MapCanvas>
  );
};

// sc017 — BA DÒNG KHÔNG
export const Sc017: React.FC<SceneProps> = () => {
  const A = useA();
  const a1 = A("Không", 2);
  const a2 = A("Không", 3);
  const a3 = A("Không", 4);
  const lines = [
    { s: a1, t: "không vua chung" },
    { s: a2, t: "không biên giới chung" },
    { s: a3, t: "không ông tổ chung" },
  ];
  return (
    <TextCard eyebrow="BA DÒNG «KHÔNG»" startFrac={0.03}>
      <div style={{ display: "flex", flexDirection: "column", gap: 44, marginTop: 20 }}>
        {lines.map((l, i) => (
          <Reveal key={i} startFrac={l.s} endFrac={l.s + 0.06}>
            <div
              style={{
                fontFamily: FONT.display,
                fontWeight: 800,
                fontSize: 96,
                color: i === 2 ? C.warn : C.white,
                textAlign: "center",
                lineHeight: 1.15,
              }}
            >
              {l.t}.
            </div>
          </Reveal>
        ))}
      </div>
      <Reveal startFrac={a3 + 0.22} endFrac={a3 + 0.3}>
        <div style={{ fontFamily: FONT.body, fontSize: 36, color: C.mute, marginTop: 40, textAlign: "center" }}>
          một thế giới chung tên — không phải một quốc gia.
        </div>
      </Reveal>
    </TextCard>
  );
};

// sc018 — LƯỚI 6 NÉT MỞ (ô 1–2 sáng)
export const Sc018: React.FC<SceneProps> = () => {
  const A = useA();
  const g = A("sáu"); // «sáu nét»
  const c1 = A("nét", 2); // «Nét thứ nhất: cắt tóc»
  const c2 = A("nét", 3); // «Nét thứ hai: xăm mình»
  const { p } = useFrac();
  const lit = [
    ease(p(c1, c1 + 0.08)),
    ease(p(c2, c2 + 0.08)),
    0,
    0,
    0,
    0,
  ];
  return <SixGrid lit={lit} gridAt={g} />;
};

// sc019 — TRANH MỰC CẮT TÓC + XĂM MÌNH (ảnh gen BASE + overlay)
export const Sc019: React.FC<SceneProps> = () => {
  const A = useA();
  const a1 = 0.02; // «người phương Nam không búi tóc cao» (clamped)
  const a2 = 0.06; // «hình vẽ trên da» (clamped)
  const a3 = A("danh"); // «danh sách của người nhìn từ ngoài vào»
  return (
    <InkImageScene src="img-sc019.png" focus={{ x: 0.42, y: 0.5 }}>
      <Reveal startFrac={a1} endFrac={a1 + 0.08}>
        <div
          style={{
            position: "absolute",
            top: 84,
            left: 84,
            fontFamily: FONT.display,
            fontWeight: 700,
            fontSize: 50,
            color: C.white,
            textShadow: "0 2px 12px rgba(0,0,0,0.9)",
            background: "rgba(20,17,13,0.74)",
            padding: "12px 28px",
            borderRadius: 10,
          }}
        >
          斷髮 — người phương Nam không búi tóc cao
        </div>
      </Reveal>
      <Reveal startFrac={a2} endFrac={a2 + 0.08}>
        <div
          style={{
            position: "absolute",
            top: 176,
            left: 84,
            fontFamily: FONT.display,
            fontWeight: 700,
            fontSize: 50,
            color: C.white,
            textShadow: "0 2px 12px rgba(0,0,0,0.9)",
            background: "rgba(20,17,13,0.74)",
            padding: "12px 28px",
            borderRadius: 10,
          }}
        >
          紋身 — hình vẽ trên da
        </div>
      </Reveal>
      <Reveal startFrac={a3} endFrac={a3 + 0.08}>
        <div style={{ position: "absolute", bottom: 100, left: 0, right: 0, textAlign: "center" }}>
          <Chip color={C.amber}>đây là danh sách của người nhìn từ ngoài vào.</Chip>
        </div>
      </Reveal>
    </InkImageScene>
  );
};

// sc020 — LƯỚI 6 NÉT TIẾP (ô 3–5)
export const Sc020: React.FC<SceneProps> = () => {
  const A = useA();
  const c3 = 0.02; // «Nét thứ ba» (clamped)
  const c4 = A("nét", 3); // «Nét thứ tư: nhà sàn»
  const c5 = 0.95; // «Nét thứ năm: đi thuyền» (clamped)
  const { p } = useFrac();
  const lit = [1, 1, ease(p(c3, c3 + 0.08)), ease(p(c4, c4 + 0.08)), ease(p(c5, c5 + 0.04)), 0];
  return <SixGrid lit={lit} gridAt={0.02} />;
};

// sc021 — TRANH NHÀ SÀN + THUYỀN (ảnh gen BASE + overlay)
export const Sc021: React.FC<SceneProps> = () => {
  const A = useA();
  const a1 = A("thuyền", 2); // «thuyền là đường đi, là chợ, là nhà»
  const a2 = A("sống"); // «sống với nước, sống với núi»
  const a3 = A("đúc"); // «đúc trống đồng» — tease ô 6
  return (
    <InkImageScene src="img-sc021.png" focus={{ x: 0.5, y: 0.55 }}>
      <Reveal startFrac={a1} endFrac={a1 + 0.08}>
        <div
          style={{
            position: "absolute",
            bottom: 116,
            left: 84,
            fontFamily: FONT.display,
            fontWeight: 700,
            fontSize: 52,
            color: C.white,
            textShadow: "0 2px 12px rgba(0,0,0,0.9)",
            maxWidth: 1200,
          }}
        >
          thuyền là đường đi, là chợ — là nhà.
        </div>
      </Reveal>
      <Reveal startFrac={a2} endFrac={a2 + 0.08}>
        <div style={{ position: "absolute", bottom: 56, left: 84 }}>
          <Chip color={C.cream}>sống với nước, sống với núi.</Chip>
        </div>
      </Reveal>
      <Reveal startFrac={a3} endFrac={a3 + 0.04}>
        <div
          style={{
            position: "absolute",
            bottom: 116,
            right: 84,
            fontFamily: FONT.mono,
            fontSize: 30,
            color: C.amber,
            background: "rgba(20,17,13,0.74)",
            padding: "8px 20px",
            borderRadius: 8,
          }}
        >
          còn một nét cuối →
        </div>
      </Reveal>
    </InkImageScene>
  );
};

// sc022 — NÉT SÁU: ĐÚC TRỐNG ĐỒNG (6/6)
export const Sc022: React.FC<SceneProps> = () => {
  const A = useA();
  const { p } = useFrac();
  const c6 = 0.02; // «Nét thứ sáu: đúc trống đồng» (clamped)
  const aDrum = A("trống", 3); // «trống Đông Sơn»
  const aSun = A("mặt"); // «mặt trời ở giữa mặt trống»
  const lit = [1, 1, 1, 1, 1, ease(p(c6, c6 + 0.08))];
  return (
    <div style={{ position: "absolute", inset: 0 }}>
      <SixGrid lit={lit} gridAt={0.02} />
      <DrumGlyph x={1580} y={730} scale={1.1} progress={ease(p(aDrum, aSun + 0.1))} />
      <Reveal startFrac={aSun} endFrac={aSun + 0.08}>
        <div style={{ position: "absolute", bottom: 96, left: 0, right: 0, textAlign: "center" }}>
          <Chip color={C.bronze}>trống Đông Sơn — mặt trời ở giữa mặt trống.</Chip>
        </div>
      </Reveal>
    </div>
  );
};

// sc023 — CHỐT HỒI 1
export const Sc023: React.FC<SceneProps> = () => {
  const A = useA();
  const a1 = A("Không"); // «không hề hoang dã»
  const a2 = A("danh", 2); // «danh sách của người nhìn từ xa»
  return (
    <TextCard eyebrow="CHỐT HỒI MỘT" startFrac={0.04}>
      <Reveal startFrac={a1} endFrac={a1 + 0.1}>
        <div style={{ fontFamily: FONT.display, fontWeight: 800, fontSize: 80, color: C.white, textAlign: "center", lineHeight: 1.3 }}>
          dấu hiệu nhận diện —<br />
          <span style={{ color: C.amber }}>không phải chứng nhận đồng nhất</span>.
        </div>
      </Reveal>
      <Reveal startFrac={a2} endFrac={a2 + 0.1}>
        <div style={{ fontFamily: FONT.body, fontSize: 38, color: C.cream, marginTop: 40, textAlign: "center" }}>
          «không hề hoang dã» — nhưng cũng chỉ là danh sách của người nhìn từ xa.
        </div>
      </Reveal>
    </TextCard>
  );
};
