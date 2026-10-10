// EP.06 xi-vu-ba-toc — scenes group E (S3-E compose worker)
// sc045–sc055 · speech-lock: useA() trả về FRACTION của scene → nạp thẳng vào startFrac.
// Anchors lấy từ spec_E.json (đã verify nằm trong window).
import React from "react";
import {
  Paper, Reveal, CountUp, SpringPop, InkDraw, circleD,
  Chip, LegendFrame, LabBadge, DossierBadge, SourceTag,
  plateSrc, InkImageScene, WipeInk, ease, useA, useFrac,
} from "./common";
import { C, FONT, SceneProps } from "./theme";

const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
const easeIn = (t: number) => t * t * t;

const bronzeMirror: React.CSSProperties = {
  position: "absolute",
  borderRadius: 26,
  border: "10px solid #3E2C17",
  background:
    "radial-gradient(ellipse at 38% 32%, #A9854F 0%, #7C5A33 46%, #4C3720 100%)",
  boxShadow: "inset 0 0 90px rgba(0,0,0,0.55), 0 18px 60px rgba(0,0,0,0.5)",
};

// sc045 — KHOẢNG TRẮNG + PHÁN MŨI TÊN 3 (s21)
export const Sc045: React.FC<SceneProps> = () => {
  const A = useA();
  const { p } = useFrac();
  const aBlank = A("trắng tinh");
  const aPaint = A("được tô thành mũi tên");
  const aLabel = A("danh xưng tập hợp ước lệ");
  const aVerdict = A("không tồn tại trong bất kỳ văn bản nào");

  const peel = ease(p(aBlank, aBlank + 0.05)); // mũi tên bung lệch lên
  const ghostIn = clamp01(p(aPaint, aPaint + 0.03));
  const ghostFade = clamp01(p(aPaint + 0.11, aPaint + 0.16)); // nét tô sau này tan

  return (
    <Paper>
      <DossierBadge text="HỒ SƠ TỐI NAY — SOI MŨI TÊN 3" />

      <div style={{ ...bronzeMirror, left: 340, top: 250, width: 1240, height: 560 }} />

      <div style={{ position: "absolute", left: 340, top: 250, width: 1240, height: 560 }}>
        <div
          style={{
            position: "absolute", left: 110, top: 236,
            fontFamily: FONT.hanzi, fontSize: 74, color: C.cream,
          }}
        >
          三苗
        </div>
        <div
          style={{
            position: "absolute", right: 110, top: 236,
            fontFamily: FONT.hanzi, fontSize: 74, color: C.cream,
          }}
        >
          百越
        </div>

        {/* khoảng giấy dó trắng tinh phía sau mũi tên */}
        <Reveal
          startFrac={aBlank} endFrac={aBlank + 0.03} dy={0}
          style={{
            position: "absolute", left: 400, top: 216, width: 440, height: 148,
            background: "#F7F2E4", borderRadius: 8,
            border: `2px dashed ${C.mute}`,
            boxShadow: "0 10px 34px rgba(0,0,0,0.35)",
          }}
        />

        {/* nhãn "không cổ thư nào chép" */}
        <Reveal
          startFrac={aBlank + 0.03} endFrac={aBlank + 0.07} dy={10}
          style={{ position: "absolute", left: 400, top: 148, width: 440, textAlign: "center" }}
        >
          <Chip>không cổ thư nào chép</Chip>
        </Reveal>

        {/* mũi tên 3 — bung lên, rời khỏi mặt gương */}
        <svg
          width={440} height={148} viewBox="0 0 440 148"
          style={{
            position: "absolute", left: 400, top: 216,
            transform: `translate(${-18 * peel}px, ${-170 * peel}px) rotate(${-7 * peel}deg)`,
            opacity: 1 - peel,
          }}
        >
          <line x1={8} y1={74} x2={392} y2={74} stroke={C.amber} strokeWidth={10} strokeLinecap="round" />
          <path d="M 384 46 L 432 74 L 384 102 Z" fill={C.amber} />
        </svg>
        <div
          style={{
            position: "absolute", left: 400, top: 376, width: 440, textAlign: "center",
            fontFamily: FONT.body, fontSize: 24, color: C.cream, opacity: 1 - peel,
          }}
        >
          mũi tên thứ ba
        </div>

        {/* nét mực tưởng tượng: khoảng trắng "về sau được tô thành mũi tên" */}
        <div style={{ position: "absolute", left: 400, top: 216, width: 440, height: 148, opacity: ghostIn * (1 - ghostFade) * 0.9 }}>
          <InkDraw
            d="M 8 74 L 392 74" viewBox="0 0 440 148" width={440} height={148}
            startFrac={aPaint} endFrac={aPaint + 0.05} stroke={C.mute} strokeWidth={4}
            style={{ position: "absolute", inset: 0 }}
          />
          <InkDraw
            d="M 384 54 L 428 74 L 384 94" viewBox="0 0 440 148" width={440} height={148}
            startFrac={aPaint + 0.05} endFrac={aPaint + 0.08} stroke={C.mute} strokeWidth={4}
            style={{ position: "absolute", inset: 0 }}
          />
        </div>
      </div>

      {/* nhắc lại tập trước: Bách Việt là danh xưng ước lệ */}
      <Reveal
        startFrac={aLabel} endFrac={aLabel + 0.06}
        style={{ position: "absolute", left: 240, top: 846, width: 1440 }}
      >
        <LegendFrame label="NHỚ LẠI — TẬP TRƯỚC" color={C.amber}>
          <div style={{ fontFamily: FONT.body, fontSize: 29, color: C.cream, lineHeight: 1.5 }}>
            Bách Việt là <b>danh xưng tập hợp ước lệ</b> — cách gọi một vùng đất và người ở đó —
            không phải một quốc gia, không phải một dòng dõi di truyền.
          </div>
        </LegendFrame>
      </Reveal>

      {/* tem phán mũi tên 3 */}
      <SpringPop
        startFrac={aVerdict} from={1.25}
        style={{
          position: "absolute", left: 0, right: 0, top: 596,
          display: "flex", justifyContent: "center", alignItems: "center", gap: 56,
        }}
      >
        <span style={{ fontFamily: FONT.hanzi, fontSize: 58, color: C.mute }}>三苗</span>
        <div
          style={{
            transform: "rotate(-7deg)", borderRadius: 10,
            border: `6px double ${C.warn}`, padding: "20px 44px",
            background: "rgba(247,242,228,0.10)",
          }}
        >
          <div style={{ fontFamily: FONT.display, fontSize: 44, letterSpacing: 5, color: C.warn, textAlign: "center" }}>
            KHÔNG TỒN TẠI
          </div>
          <div style={{ fontFamily: FONT.display, fontSize: 38, letterSpacing: 3, color: C.warn, textAlign: "center" }}>
            TRONG VĂN BẢN NÀO
          </div>
        </div>
        <span style={{ fontFamily: FONT.hanzi, fontSize: 58, color: C.mute }}>百越</span>
      </SpringPop>
    </Paper>
  );
};

// sc046 — LỚP KHOA HỌC RỌI XUYÊN GƯƠNG: wipe teal + DNA helix (s22)
export const Sc046: React.FC<SceneProps> = () => {
  const A = useA();
  const { frame, p } = useFrac();
  const aKhoa = A("khoa học lên tiếng");
  const aKinh = A("kính hiển vi di truyền");
  const aHM = A("Hmong-Mien");

  const wipe = ease(p(aKhoa, aKhoa + 0.08));
  const helixIn = ease(p(aKinh, aKinh + 0.08));
  const edgeFade = clamp01(1 - p(aKhoa + 0.1, aKhoa + 0.16));

  // hình học helix — vẽ bằng code, xoay chậm theo frame
  const N = 30, cx = 960, top = 120, gap = 29, amp = 190;
  const ph = frame * 0.035;
  const pts1: string[] = [];
  const pts2: string[] = [];
  const rungs: { y: number; x1: number; x2: number; depth: number }[] = [];
  for (let i = 0; i <= N; i++) {
    const y = top + i * gap;
    const x1 = cx + amp * Math.sin(i * 0.55 + ph);
    const x2 = cx + amp * Math.sin(i * 0.55 + ph + Math.PI);
    pts1.push(`${x1.toFixed(1)} ${y}`);
    pts2.push(`${x2.toFixed(1)} ${y}`);
    if (i % 2 === 0) rungs.push({ y, x1, x2, depth: (Math.sin(i * 0.55 + ph) + 1) / 2 });
  }
  const d1 = "M " + pts1.join(" L ");
  const d2 = "M " + pts2.join(" L ");

  return (
    <Paper variant="teal">
      <WipeInk startFrac={0} color="#241F1A" />

      {/* lớp xanh lục trượt qua mặt gương */}
      <div
        style={{
          position: "absolute", left: 0, top: 0, bottom: 0,
          width: `${wipe * 100}%`,
          background: "linear-gradient(90deg, rgba(14,52,50,0.88), rgba(14,52,50,0.58))",
        }}
      />
      <div
        style={{
          position: "absolute", left: wipe * 1920 - 5, top: 0, bottom: 0, width: 5,
          background: C.teal, opacity: edgeFade,
        }}
      />

      {/* bóng gương đồng mờ phía sau */}
      <div
        style={{
          position: "absolute", left: 460, top: 190, width: 1000, height: 700, borderRadius: "50%",
          background: "radial-gradient(ellipse, rgba(150,110,60,0.34), rgba(150,110,60,0.0) 70%)",
          filter: "blur(6px)",
        }}
      />

      <LabBadge text="DÂN SỐ HỌC DI TRUYỀN" />

      <Reveal
        startFrac={aKinh} endFrac={aKinh + 0.06} dy={10}
        style={{ position: "absolute", left: 0, right: 0, top: 122, textAlign: "center" }}
      >
        <Chip color={C.teal}>kính hiển vi di truyền</Chip>
      </Reveal>

      {/* chuỗi xoắn kép */}
      <svg width={1920} height={1080} viewBox="0 0 1920 1080" style={{ position: "absolute", inset: 0, opacity: helixIn }}>
        {rungs.map((r, i) => (
          <line
            key={i} x1={r.x1} y1={r.y} x2={r.x2} y2={r.y}
            stroke={i % 4 === 0 ? C.cream : C.teal}
            strokeWidth={4} opacity={0.22 + 0.68 * r.depth}
          />
        ))}
        <path d={d1} fill="none" stroke={C.teal} strokeWidth={7} strokeLinecap="round" opacity={0.95} />
        <path d={d2} fill="none" stroke={C.cream} strokeWidth={7} strokeLinecap="round" opacity={0.85} />
      </svg>

      {/* nhãn nhóm + MRCA */}
      <Reveal
        startFrac={aHM} endFrac={aHM + 0.06} dy={10}
        style={{ position: "absolute", left: 0, right: 0, top: 968, textAlign: "center" }}
      >
        <Chip color={C.teal}>nhóm Hmong-Mien — người H'Mông · bà con Miền</Chip>
      </Reveal>
      <Reveal
        startFrac={aHM + 0.1} endFrac={aHM + 0.17}
        style={{ position: "absolute", left: 60, bottom: 64, width: 620 }}
      >
        <LegendFrame label="MRCA" color={C.teal}>
          <div style={{ fontFamily: FONT.body, fontSize: 27, color: C.cream, lineHeight: 1.45 }}>
            tổ chung gần nhất của các nhóm Hmong-Mien hôm nay.
          </div>
        </LegendFrame>
      </Reveal>
    </Paper>
  );
};

// sc047 — NÔNG DÂN TRƯỜNG GIANG: ảnh gen + stat 5.800 + mini-map hai sông (s22)
export const Sc047: React.FC<SceneProps> = () => {
  const A = useA();
  const a58 = A("năm nghìn tám trăm năm");
  const aSong = A("Lưu vực sông Trường Giang");
  const aNong = A("nông dân trồng lúa");

  return (
    <InkImageScene
      src={plateSrc("img-sc047.png")}
      label="LƯU VỰC TRƯỜNG GIANG"
      sublabel="bình minh phù sa — thửa ruộng bậc thang"
      focus={{ x: 0.5, y: 0.62 }}
    >
      {/* stat card — MRCA ~5.800 năm */}
      <SpringPop
        startFrac={a58 - 0.02} from={0.86}
        style={{
          position: "absolute", left: 60, top: 56, padding: "24px 36px", borderRadius: 12,
          background: "rgba(18,32,30,0.88)", border: `2px solid ${C.teal}`,
        }}
      >
        <div style={{ fontFamily: FONT.body, fontSize: 23, letterSpacing: 3, color: C.teal }}>
          MRCA — TỔ CHUNG GẦN NHẤT
        </div>
        <div style={{ fontFamily: FONT.display, fontSize: 86, color: C.white, lineHeight: 1.12 }}>
          ≈ <CountUp to={5800} startFrac={a58} endFrac={a58 + 0.15} /> năm
        </div>
        <div style={{ fontFamily: FONT.body, fontSize: 26, color: C.mute }}>
          trước đây — lưu vực Trường Giang
        </div>
      </SpringPop>

      {/* mini-bản đồ hai dòng sông — bên phải */}
      <Reveal
        startFrac={aSong} endFrac={aSong + 0.05}
        style={{
          position: "absolute", right: 60, top: 300, width: 336, padding: "16px 18px 14px",
          borderRadius: 12, background: "rgba(18,32,30,0.86)", border: `1px solid ${C.teal}`,
        }}
      >
        <div style={{ position: "relative", width: 300, height: 330 }}>
          <InkDraw
            d="M 30 64 C 110 14, 190 108, 262 44" viewBox="0 0 300 330" width={300} height={330}
            startFrac={aSong + 0.06} endFrac={aSong + 0.16} stroke={C.mute} strokeWidth={5}
            style={{ position: "absolute", inset: 0 }}
          />
          <InkDraw
            d="M 30 210 C 116 282, 196 156, 262 236" viewBox="0 0 300 330" width={300} height={330}
            startFrac={aSong + 0.12} endFrac={aSong + 0.24} stroke={C.teal} strokeWidth={8}
            style={{ position: "absolute", inset: 0 }}
          />
          <InkDraw
            d={circleD(262, 236, 12)} viewBox="0 0 300 330" width={300} height={330}
            startFrac={aSong + 0.24} endFrac={aSong + 0.28} stroke={C.teal} strokeWidth={6}
            style={{ position: "absolute", inset: 0 }}
          />
        </div>
        <div style={{ fontFamily: FONT.body, fontSize: 22, color: C.mute, marginTop: 4 }}>
          Hoàng Hà — mờ dần
        </div>
        <div style={{ fontFamily: FONT.body, fontSize: 24, color: C.teal }}>
          Trường Giang — sáng
        </div>
      </Reveal>

      {/* chip cư dân + phủ định Hoàng Hà */}
      <Reveal
        startFrac={aNong} endFrac={aNong + 0.06} dy={12}
        style={{ position: "absolute", left: 60, top: 872 }}
      >
        <Chip color={C.teal}>nông dân trồng lúa — cư dân Trường Giang</Chip>
      </Reveal>
      <Reveal
        startFrac={aSong + 0.16} endFrac={aSong + 0.22} dy={12}
        style={{ position: "absolute", left: 60, top: 944 }}
      >
        <Chip> KHÔNG PHẢI HOÀNG HÀ — chiến trường của Xi Vưu </Chip>
      </Reveal>

      <SourceTag text="ảnh: tái tạo minh họa — không phải tư liệu lịch sử" bottom={64} right />
    </InkImageScene>
  );
};

// sc048 — 8.200 NĂM + PHÁN MŨI TÊN 4 (s22)
export const Sc048: React.FC<SceneProps> = () => {
  const A = useA();
  const { p } = useFrac();
  const a82 = A("tám nghìn hai trăm năm trước");
  const aHoa = A("hòa huyết đến sau");
  const aCoi = A("mới là cội chính");
  const aVerdict = A("DNA chỉ về Trường Giang");

  const hoangDim = clamp01(p(aHoa + 0.08, aHoa + 0.15)); // Hoàng Hà mờ dần
  const truongGlow = clamp01(p(aCoi + 0.05, aCoi + 0.12)); // Trường Giang sáng lên

  return (
    <Paper variant="teal">
      <LabBadge text="GÓC KHOA HỌC — MŨI TÊN 4" />

      {/* stat phụ: 8.200 năm tách khỏi Tai-Kadai */}
      <SpringPop
        startFrac={a82 - 0.02} from={0.88}
        style={{
          position: "absolute", left: "50%", top: 128, transform: "translateX(-50%)",
          padding: "20px 44px", borderRadius: 12, textAlign: "center",
          background: "rgba(18,32,30,0.9)", border: `2px solid ${C.teal}`,
        }}
      >
        <div style={{ fontFamily: FONT.body, fontSize: 23, letterSpacing: 3, color: C.teal }}>
          NHÁNH HMONG-MIEN TÁCH KHỎI HỆ TAI-KADAI
        </div>
        <div style={{ fontFamily: FONT.display, fontSize: 74, color: C.white, lineHeight: 1.15 }}>
          <CountUp to={8200} startFrac={a82} endFrac={a82 + 0.15} /> năm trước
        </div>
        <div style={{ fontFamily: FONT.body, fontSize: 25, color: C.mute }}>
          — sâu hơn nhiều so với mọi sử ký
        </div>
      </SpringPop>

      {/* bản đồ hai dòng sông */}
      <div style={{ position: "absolute", left: 360, top: 430, width: 1200, height: 380 }}>
        <InkDraw
          d="M 90 86 C 340 18, 700 132, 1110 52" viewBox="0 0 1200 380" width={1200} height={380}
          startFrac={0.08} endFrac={0.2} stroke={C.mute} strokeWidth={8}
          style={{ position: "absolute", inset: 0, opacity: 0.9 - 0.55 * hoangDim }}
        />
        <InkDraw
          d="M 90 264 C 360 336, 720 196, 1110 278" viewBox="0 0 1200 380" width={1200} height={380}
          startFrac={0.12} endFrac={0.26} stroke={C.teal} strokeWidth={12}
          style={{
            position: "absolute", inset: 0,
            opacity: 0.85 + 0.15 * truongGlow,
            filter: `drop-shadow(0 0 ${10 + 14 * truongGlow}px ${C.teal})`,
          }}
        />
        <InkDraw
          d={circleD(1110, 278, 14)} viewBox="0 0 1200 380" width={1200} height={380}
          startFrac={aCoi + 0.12} endFrac={aCoi + 0.16} stroke={C.teal} strokeWidth={7}
          style={{ position: "absolute", inset: 0 }}
        />
        <svg width={1200} height={380} viewBox="0 0 1200 380" style={{ position: "absolute", inset: 0 }}>
          <text x={92} y={44} fontFamily={FONT.body} fontSize={26} fill={C.mute} opacity={0.9 - 0.5 * hoangDim}>
            HOÀNG HÀ
          </text>
          <text x={92} y={330} fontFamily={FONT.body} fontSize={26} fill={C.teal}>
            TRƯỜNG GIANG
          </text>
        </svg>
      </div>

      <Reveal
        startFrac={aHoa} endFrac={aHoa + 0.06}
        style={{ position: "absolute", left: 430, top: 384, fontFamily: FONT.body, fontSize: 27, color: C.cream }}
      >
        phía Bắc — chỉ là lớp <b>hòa huyết đến sau</b>
      </Reveal>
      <Reveal
        startFrac={aCoi} endFrac={aCoi + 0.06}
        style={{ position: "absolute", right: 430, top: 584, fontFamily: FONT.body, fontSize: 27, color: C.teal }}
      >
        nông dân Trường Giang — <b>mới là cội chính</b>
      </Reveal>

      {/* tem phán mũi tên 4 */}
      <SpringPop
        startFrac={aVerdict} from={1.22}
        style={{
          position: "absolute", left: "50%", top: 856, transform: "translateX(-50%) rotate(-5deg)",
          borderRadius: 10, border: `6px double ${C.warn}`, padding: "18px 52px",
          background: "rgba(247,242,228,0.10)", textAlign: "center",
        }}
      >
        <div style={{ fontFamily: FONT.display, fontSize: 46, letterSpacing: 4, color: C.warn }}>
          DNA → TRƯỜNG GIANG
        </div>
        <div style={{ fontFamily: FONT.display, fontSize: 34, letterSpacing: 3, color: C.warn, opacity: 0.9 }}>
          KHÔNG PHẢI XI VƯU
        </div>
      </SpringPop>
    </Paper>
  );
};

// sc049 — HAI TẦNG ĐẶT CẠNH NHAU (callback sc032) (s23)
export const Sc049: React.FC<SceneProps> = () => {
  const A = useA();
  const { p } = useFrac();
  const aMau = A("Chưa từng có mẫu di truyền cổ nào");
  const aCuDan = A("nói về cư dân");
  const aPhaHe = A("không thể tự phong làm phả hệ");

  const split = ease(p(0.02, 0.1)); // hai tầng tách ra đặt cạnh nhau

  const panel: React.CSSProperties = {
    position: "absolute", top: 230, width: 760, height: 540, borderRadius: 14,
    boxShadow: "0 14px 44px rgba(0,0,0,0.4)", boxSizing: "border-box",
  };

  return (
    <Paper>
      <WipeInk startFrac={0} color="#241F1A" />

      {/* tầng trái — ký ức */}
      <div
        style={{
          ...panel, left: 170, background: "rgba(122,86,40,0.30)", border: `3px solid ${C.amber}`,
          transform: `translateX(${410 * (1 - split)}px)`,
        }}
      >
        <div style={{ padding: "44px 52px" }}>
          <div style={{ fontFamily: FONT.body, fontSize: 22, letterSpacing: 4, color: C.amber }}>
            TẦNG KÝ ỨC
          </div>
          <div style={{ fontFamily: FONT.display, fontSize: 50, color: C.white, marginTop: 12 }}>
            truyền khẩu · Txiv Yawg
          </div>
          <Reveal startFrac={aPhaHe} endFrac={aPhaHe + 0.08} style={{ marginTop: 40 }}>
            <div style={{ fontFamily: FONT.body, fontSize: 28, color: C.cream, lineHeight: 1.5 }}>
              không thể tự phong làm <b>phả hệ</b>
            </div>
          </Reveal>
          <Reveal startFrac={aPhaHe + 0.1} endFrac={aPhaHe + 0.18} style={{ marginTop: 16 }}>
            <div style={{ fontFamily: FONT.display, fontSize: 40, color: C.amber }}>
              — ký ức thì sống
            </div>
          </Reveal>
        </div>
      </div>

      {/* tầng phải — di truyền */}
      <div
        style={{
          ...panel, right: 170, background: "rgba(14,52,50,0.42)", border: `3px solid ${C.teal}`,
          transform: `translateX(${-410 * (1 - split)}px)`,
        }}
      >
        <div style={{ padding: "44px 52px" }}>
          <div style={{ fontFamily: FONT.body, fontSize: 22, letterSpacing: 4, color: C.teal }}>
            TẦNG DI TRUYỀN
          </div>
          <div style={{ fontFamily: FONT.display, fontSize: 50, color: C.white, marginTop: 12 }}>
            kính hiển vi · cư dân
          </div>
          <Reveal startFrac={aCuDan} endFrac={aCuDan + 0.08} style={{ marginTop: 40 }}>
            <div style={{ fontFamily: FONT.body, fontSize: 28, color: C.cream, lineHeight: 1.5 }}>
              <b>nói về cư dân</b> — người trồng lúa, không nói về vua tổ
            </div>
          </Reveal>
          <Reveal startFrac={aCuDan + 0.1} endFrac={aCuDan + 0.18} style={{ marginTop: 16 }}>
            <div style={{ fontFamily: FONT.display, fontSize: 40, color: C.teal }}>
              — di truyền thì đo
            </div>
          </Reveal>
        </div>
      </div>

      {/* ranh giới teal + dòng ghi giới hạn */}
      <Reveal
        startFrac={aMau} endFrac={aMau + 0.06} dy={0}
        style={{
          position: "absolute", left: 958, top: 210, height: 580, width: 4,
          background: C.teal, opacity: 0.9,
        }}
      />
      <Reveal
        startFrac={aMau + 0.08} endFrac={aMau + 0.16} dy={8}
        style={{
          position: "absolute", left: "50%", transform: "translateX(-50%)", top: 826,
          padding: "12px 30px", borderRadius: 8,
          background: "rgba(18,32,30,0.92)", border: `1px solid ${C.teal}`,
          fontFamily: FONT.body, fontSize: 26, color: C.cream, textAlign: "center", whiteSpace: "nowrap",
        }}
      >
        chưa có mẫu DNA cổ cho Cửu Lê / Tam Miêu
      </Reveal>
    </Paper>
  );
};

// sc050 — KHÔNG PHỦ ĐỊNH — TỪ CHỐI MŨI TÊN: hai câu chốt tách đôi (s23)
export const Sc050: React.FC<SceneProps> = () => {
  const A = useA();
  const { p } = useFrac();
  const aHong = A("hồ sơ mới hỏng");
  const aLeft = A("khoa học không phủ định Txiv Yawg");
  const aRight = A("Khoa học chỉ từ chối mũi tên");

  const uL = 480 * ease(p(aLeft + 0.04, aLeft + 0.12));
  const uR = 480 * ease(p(aRight + 0.04, aRight + 0.12));

  return (
    <Paper>
      {/* nền tối hai mảng */}
      <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 960, background: "linear-gradient(160deg, #2A1512 0%, #170E0C 100%)" }} />
      <div style={{ position: "absolute", right: 0, top: 0, bottom: 0, width: 960, background: "linear-gradient(200deg, #0E2724 0%, #101E1C 100%)" }} />
      <div style={{ position: "absolute", left: 959, top: 0, bottom: 0, width: 2, background: C.cream, opacity: 0.45 }} />

      {/* dòng dẫn: khi tầng này cướp chỗ tầng kia */}
      <Reveal
        startFrac={aHong} endFrac={aHong + 0.05}
        style={{ position: "absolute", left: 0, right: 0, top: 150, textAlign: "center" }}
      >
        <div style={{ fontFamily: FONT.body, fontSize: 31, color: C.cream, opacity: 0.85 }}>
          khi tầng này cướp chỗ tầng kia — <b>hồ sơ mới hỏng</b>
        </div>
      </Reveal>

      {/* câu trái — mực đỏ trầm */}
      <Reveal
        startFrac={aLeft} endFrac={aLeft + 0.1} dy={34}
        style={{ position: "absolute", left: 0, width: 960, top: 400, textAlign: "center" }}
      >
        <div style={{ fontFamily: FONT.display, fontSize: 64, color: C.warn, lineHeight: 1.35 }}>
          Khoa học<br />không phủ định<br />Txiv Yawg.
        </div>
        <div style={{ width: uL, height: 3, margin: "30px auto 0", background: C.warn, opacity: 0.8 }} />
        <div style={{ marginTop: 22, fontFamily: FONT.body, fontSize: 25, color: C.mute }}>
          tầng ký ức — nguyên giá trị riêng
        </div>
      </Reveal>

      {/* câu phải — science teal */}
      <Reveal
        startFrac={aRight} endFrac={aRight + 0.1} dy={34}
        style={{ position: "absolute", left: 960, width: 960, top: 400, textAlign: "center" }}
      >
        <div style={{ fontFamily: FONT.display, fontSize: 64, color: C.teal, lineHeight: 1.35 }}>
          Khoa học<br />chỉ từ chối<br />mũi tên.
        </div>
        <div style={{ width: uR, height: 3, margin: "30px auto 0", background: C.teal, opacity: 0.85 }} />
        <div style={{ marginTop: 22, fontFamily: FONT.body, fontSize: 25, color: C.mute }}>
          tầng di truyền — nguyên giá trị riêng
        </div>
      </Reveal>
    </Paper>
  );
};

// sc051 — PHÁN QUYẾT TỔNG C12: bản án + triện lớn (s24)
export const Sc051: React.FC<SceneProps> = () => {
  const A = useA();
  const aChain = A("tập hợp các mắt xích chú giải và diễn giải cổ");
  const aPha = A("không phải phả hệ có thật");
  const aTuhao = A("tự hào cội nguồn không cần thêm một vị tổ chung huyền thoại");

  return (
    <Paper>
      <DossierBadge text="PHÁN QUYẾT TỔNG — C12" />

      {/* chữ Hán display dọc bên phải */}
      <Reveal
        startFrac={0.02} endFrac={0.1} dy={0}
        style={{
          position: "absolute", right: 110, top: 190, height: 720,
          writingMode: "vertical-rl", fontFamily: FONT.hanzi, fontSize: 66,
          color: C.mute, opacity: 0.55, letterSpacing: 18,
        }}
      >
        蚩尤 九黎 三苗 百越
      </Reveal>

      {/* bản án */}
      <div
        style={{
          position: "absolute", left: 240, top: 196, width: 1240, height: 700, borderRadius: 12,
          background: "rgba(36,31,26,0.72)", border: `3px double ${C.amber}`,
          padding: "52px 72px", boxSizing: "border-box",
        }}
      >
        <Reveal startFrac={0.01} endFrac={0.06} dy={8}>
          <Chip color={C.amber}>C12 — ĐỌC PHÁN QUYẾT TỔNG</Chip>
        </Reveal>

        <Reveal startFrac={aChain} endFrac={aChain + 0.08} style={{ marginTop: 46 }}>
          <div style={{ fontFamily: FONT.display, fontSize: 56, color: C.white, letterSpacing: 2 }}>
            Xi Vưu → Cửu Lê → Tam Miêu → Bách Việt
          </div>
        </Reveal>
        <Reveal startFrac={aChain + 0.05} endFrac={aChain + 0.13} style={{ marginTop: 20 }}>
          <div style={{ fontFamily: FONT.body, fontSize: 33, color: C.cream, lineHeight: 1.5 }}>
            = tập hợp các <b>mắt xích chú giải &amp; diễn giải cổ</b>
          </div>
        </Reveal>
        <Reveal startFrac={aPha} endFrac={aPha + 0.08} style={{ marginTop: 40 }}>
          <div style={{ fontFamily: FONT.display, fontSize: 46, color: C.warn }}>
            — KHÔNG phải phả hệ có thật trong sử liệu
          </div>
        </Reveal>
        <Reveal startFrac={aPha + 0.05} endFrac={aPha + 0.13} style={{ marginTop: 16 }}>
          <div style={{ fontFamily: FONT.body, fontSize: 33, color: C.teal }}>
            — không kiểm chứng được bằng di truyền học
          </div>
        </Reveal>
        <Reveal startFrac={aTuhao} endFrac={aTuhao + 0.08} style={{ marginTop: 44 }}>
          <div style={{ fontFamily: FONT.body, fontSize: 30, color: C.cream, lineHeight: 1.5 }}>
            Tự hào cội nguồn — không cần thêm một vị tổ chung huyền thoại.
          </div>
        </Reveal>

        {/* triện lớn ép xuống cuối */}
        <SpringPop
          startFrac={aTuhao + 0.07} from={1.3}
          style={{
            position: "absolute", right: 64, bottom: 56, width: 168, height: 168,
            transform: "rotate(-8deg)", borderRadius: 10,
            border: `7px double ${C.warn}`,
            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
            background: "rgba(200,85,61,0.12)",
          }}
        >
          <div style={{ fontFamily: FONT.display, fontSize: 62, color: C.warn }}>C12</div>
          <div style={{ fontFamily: FONT.body, fontSize: 21, letterSpacing: 5, color: C.warn }}>ĐÃ SOI</div>
        </SpringPop>
      </div>
    </Paper>
  );
};

// sc052 — BỐN MŨI TÊN RƠI: gương sạch + bóng Xi Vưu + tagline đôi (s24)
export const Sc052: React.FC<SceneProps> = () => {
  const A = useA();
  const { p } = useFrac();
  const aGon = A("vì nó gọn");
  const aChia = A("Gọn thì dễ chia sẻ");
  const aKe = A("Sự thật thì phải kể");

  // 4 mũi tên rơi lần lượt (nhịp mở cảnh)
  const drops = [
    easeIn(p(0.04, 0.12)),
    easeIn(p(0.11, 0.19)),
    easeIn(p(0.18, 0.26)),
    easeIn(p(0.25, 0.33)),
  ];

  return (
    <Paper>
      <DossierBadge text="BỐN MŨI TÊN — SOI XONG" />

      <div style={{ ...bronzeMirror, left: 510, top: 170, width: 900, height: 520 }} />

      <div style={{ position: "absolute", left: 510, top: 170, width: 900, height: 520 }}>
        {/* bốn mũi tên trên mặt gương, rơi khỏi khung */}
        {[
          { x: 90, y: 96 }, { x: 330, y: 200 }, { x: 560, y: 96 }, { x: 760, y: 210 },
        ].map((pos, i) => (
          <div
            key={i}
            style={{
              position: "absolute", left: pos.x, top: pos.y,
              transform: `translateY(${drops[i] * 720}px) rotate(${drops[i] * 9}deg)`,
              opacity: 1 - drops[i],
            }}
          >
            <svg width={130} height={40} viewBox="0 0 130 40">
              <line x1={4} y1={20} x2={100} y2={20} stroke={C.amber} strokeWidth={7} strokeLinecap="round" />
              <path d="M 94 6 L 126 20 L 94 34 Z" fill={C.amber} />
            </svg>
            <div style={{ fontFamily: FONT.body, fontSize: 20, color: C.cream, marginTop: 2 }}>
              {i + 1}
            </div>
          </div>
        ))}

        {/* bóng Xi Vưu đơn độc trong khung gương */}
        <InkDraw
          d={circleD(450, 178, 36)} viewBox="0 0 900 520" width={900} height={520}
          startFrac={0.3} endFrac={0.38} stroke="#241A0F" strokeWidth={7}
          style={{ position: "absolute", inset: 0 }}
        />
        <InkDraw
          d="M 348 392 C 380 282, 520 282, 552 392" viewBox="0 0 900 520" width={900} height={520}
          startFrac={0.34} endFrac={0.45} stroke="#241A0F" strokeWidth={8}
          style={{ position: "absolute", inset: 0 }}
        />
      </div>

      {/* tagline hiện đôi */}
      <Reveal
        startFrac={aGon} endFrac={aGon + 0.06} dy={10}
        style={{ position: "absolute", left: 0, right: 0, top: 756, textAlign: "center" }}
      >
        <Chip>sơ đồ viral lan truyền — vì nó gọn</Chip>
      </Reveal>
      <div
        style={{
          position: "absolute", left: 0, right: 0, top: 856, textAlign: "center",
          fontFamily: FONT.display, fontSize: 48,
        }}
      >
        <Reveal startFrac={aChia} endFrac={aChia + 0.07} dy={20} style={{ display: "inline-block" }}>
          <span style={{ color: C.amber }}>Gọn thì dễ chia sẻ.</span>
        </Reveal>
        <span style={{ color: C.mute, margin: "0 26px" }}>·</span>
        <Reveal startFrac={aKe} endFrac={aKe + 0.07} dy={20} style={{ display: "inline-block" }}>
          <span style={{ color: C.teal }}>Sự thật thì phải kể.</span>
        </Reveal>
      </div>
    </Paper>
  );
};

// sc053 — BA TẤM KÍNH — BA LÝ DO: triptych mờ dần (s25)
export const Sc053: React.FC<SceneProps> = () => {
  const A = useA();
  const { p } = useFrac();
  const aLy1 = A("vì đế chế nào cũng cần lý do cho binh lửa");
  const aLy2 = A("ký ức thật về một quê hương đã mất");
  const aLy3 = A("khát cội nguồn là khát thật");

  const split = ease(p(0.03, 0.12)); // ba lớp tách hàng
  const dark = 0.38 * clamp01(p(0.25, 0.95)); // cảnh tối dần

  const centers = [340, 960, 1580];
  const fades = [
    1 - 0.7 * clamp01(p(aLy1 + 0.13, aLy1 + 0.2)),
    1 - 0.7 * clamp01(p(aLy2 + 0.13, aLy2 + 0.2)),
    1 - 0.7 * clamp01(p(aLy3 + 0.13, aLy3 + 0.2)),
  ];

  const panel = (i: number, color: string): React.CSSProperties => ({
    position: "absolute", left: centers[i] - 280, top: 200, width: 560, height: 620,
    borderRadius: 16, border: `3px solid ${color}`,
    background: "rgba(36,31,26,0.8)", boxSizing: "border-box",
    transform: `translateX(${(960 - centers[i]) * (1 - split)}px)`,
    opacity: fades[i], boxShadow: "0 14px 44px rgba(0,0,0,0.45)",
  });

  return (
    <Paper>
      {/* tấm 1 — Người Hán: chiến thần (đỏ trầm) */}
      <div style={panel(0, C.warn)}>
        <div style={{ padding: "36px 48px" }}>
          <div style={{ position: "relative", width: 464, height: 260 }}>
            <InkDraw
              d="M 232 12 L 232 190" viewBox="0 0 464 260" width={464} height={260}
              startFrac={0.12} endFrac={0.2} stroke={C.warn} strokeWidth={9}
              style={{ position: "absolute", inset: 0 }}
            />
            <InkDraw
              d="M 176 190 L 288 190" viewBox="0 0 464 260" width={464} height={260}
              startFrac={0.18} endFrac={0.23} stroke={C.warn} strokeWidth={8}
              style={{ position: "absolute", inset: 0 }}
            />
            <InkDraw
              d="M 232 190 L 232 248" viewBox="0 0 464 260" width={464} height={260}
              startFrac={0.22} endFrac={0.26} stroke={C.warn} strokeWidth={7}
              style={{ position: "absolute", inset: 0 }}
            />
          </div>
          <div style={{ fontFamily: FONT.display, fontSize: 40, color: C.white, marginTop: 10 }}>NGƯỜI HÁN</div>
          <div style={{ fontFamily: FONT.body, fontSize: 25, color: C.mute, marginTop: 6 }}>
            soi gương thấy <b>chiến thần</b>
          </div>
          <Reveal startFrac={aLy1} endFrac={aLy1 + 0.07} style={{ marginTop: 24 }}>
            <div style={{ fontFamily: FONT.body, fontSize: 26, color: C.warn, lineHeight: 1.45 }}>
              đế chế nào cũng cần lý do cho binh lửa
            </div>
          </Reveal>
        </div>
      </div>

      {/* tấm 2 — Người H'Mông: vua tổ (amber) */}
      <div style={panel(1, C.amber)}>
        <div style={{ padding: "36px 48px" }}>
          <div style={{ position: "relative", width: 464, height: 260 }}>
            <InkDraw
              d="M 24 226 L 140 86 L 212 166 L 300 34 L 424 226" viewBox="0 0 464 260" width={464} height={260}
              startFrac={0.12} endFrac={0.22} stroke={C.amber} strokeWidth={8}
              style={{ position: "absolute", inset: 0 }}
            />
            <InkDraw
              d={circleD(300, 34, 13)} viewBox="0 0 464 260" width={464} height={260}
              startFrac={0.22} endFrac={0.26} stroke={C.amber} strokeWidth={6}
              style={{ position: "absolute", inset: 0 }}
            />
          </div>
          <div style={{ fontFamily: FONT.display, fontSize: 40, color: C.white, marginTop: 10 }}>NGƯỜI H'MÔNG</div>
          <div style={{ fontFamily: FONT.body, fontSize: 25, color: C.mute, marginTop: 6 }}>
            thấy <b>vua tổ</b> — thiên di
          </div>
          <Reveal startFrac={aLy2} endFrac={aLy2 + 0.07} style={{ marginTop: 24 }}>
            <div style={{ fontFamily: FONT.body, fontSize: 26, color: C.amber, lineHeight: 1.45 }}>
              ký ức thật về một quê hương đã mất
            </div>
          </Reveal>
        </div>
      </div>

      {/* tấm 3 — Người Việt: thủy tổ (teal) */}
      <div style={panel(2, C.teal)}>
        <div style={{ padding: "36px 48px" }}>
          <div style={{ position: "relative", width: 464, height: 260 }}>
            <InkDraw
              d="M 28 110 C 108 50, 188 170, 268 110 S 420 56, 436 98" viewBox="0 0 464 260" width={464} height={260}
              startFrac={0.12} endFrac={0.2} stroke={C.teal} strokeWidth={8}
              style={{ position: "absolute", inset: 0 }}
            />
            <InkDraw
              d="M 28 180 C 108 120, 188 240, 268 180 S 420 126, 436 168" viewBox="0 0 464 260" width={464} height={260}
              startFrac={0.18} endFrac={0.26} stroke={C.teal} strokeWidth={8}
              style={{ position: "absolute", inset: 0 }}
            />
          </div>
          <div style={{ fontFamily: FONT.display, fontSize: 40, color: C.white, marginTop: 10 }}>NGƯỜI VIỆT</div>
          <div style={{ fontFamily: FONT.body, fontSize: 25, color: C.mute, marginTop: 6 }}>
            thấy <b>thủy tổ</b> — giữa đồng bằng phù sa
          </div>
          <Reveal startFrac={aLy3} endFrac={aLy3 + 0.07} style={{ marginTop: 24 }}>
            <div style={{ fontFamily: FONT.body, fontSize: 26, color: C.teal, lineHeight: 1.45 }}>
              khát cội nguồn là khát thật
            </div>
          </Reveal>
        </div>
      </div>

      {/* tối dần */}
      <div style={{ position: "absolute", inset: 0, background: "#000", opacity: dark }} />
    </Paper>
  );
};

// sc054 — NẾN TÀN — GƯƠNG LẶNG: vệt sáng cuối cùng (s25)
export const Sc054: React.FC<SceneProps> = () => {
  const A = useA();
  const { frame, p } = useFrac();
  const aThua = A("Ba tộc cùng nhớ một kẻ thua");
  const aXoa = A("không ai chịu để mình bị xóa nhòa");
  const aLang = A("tấm gương lặng hẳn");

  const s1 = clamp01(p(aThua, aThua + 0.055));
  const s2 = clamp01(p(aXoa, aXoa + 0.055));
  const s3 = clamp01(p(aLang, aLang + 0.06));

  // gương đồng tối lại từng nhịp
  const mOp = 0.55 - 0.17 * s1 - 0.18 * s2 - 0.15 * s3;
  // nến lịm dần — ba nhịp
  const flick = 1 + 0.07 * Math.sin(frame * 1.7);
  const flameScale = (1 - 0.22 * s1 - 0.22 * s2) * flick;
  const flameOp = 1 - s3;
  // vệt sáng giữa màn — co lại mảnh đúng nhịp "tấm gương lặng hẳn"
  const slitW = 10 - 7 * ease(s3);
  const slitH = 640 - 470 * ease(s3);
  const slitOp = (0.16 + 0.84 * clamp01(p(aXoa + 0.04, aXoa + 0.16))) * (0.35 + 0.65 * (1 - s3 * 0.4));

  return (
    <Paper variant="night">
      <div style={{ position: "absolute", inset: 0, background: "rgba(12,9,6,0.55)" }} />

      {/* mặt gương đồng tối dần */}
      <div
        style={{
          ...bronzeMirror, left: 250, top: 270, width: 680, height: 420, opacity: mOp,
          border: "8px solid #241A0F",
        }}
      />
      <div
        style={{
          position: "absolute", left: 250, top: 270, width: 680, height: 420,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontFamily: FONT.display, fontSize: 34, color: C.cream, opacity: mOp * 0.5,
        }}
      >
        ba tộc — cùng nhớ một kẻ thua
      </div>

      {/* nến tàn */}
      <div style={{ position: "absolute", left: 1560, top: 600 }}>
        <div
          style={{
            position: "absolute", left: -26, top: -170, width: 130, height: 170, borderRadius: "50%",
            background: "radial-gradient(ellipse, rgba(242,180,92,0.5), rgba(242,180,92,0) 70%)",
            opacity: flameOp,
          }}
        />
        <div
          style={{
            position: "absolute", left: -9, top: -74, width: 18, height: 44, borderRadius: "50% 50% 46% 46%",
            background: "radial-gradient(ellipse at 50% 70%, #FFF6DC 0%, #F0C878 62%, rgba(240,200,120,0) 100%)",
            transform: `scale(${flameScale})`, opacity: flameOp,
          }}
        />
        <div style={{ position: "absolute", left: -1, top: -30, width: 2, height: 12, background: "#3A2A16" }} />
        <div
          style={{
            position: "absolute", left: -24, top: -18, width: 48, height: 232, borderRadius: "8px 8px 4px 4px",
            background: "linear-gradient(180deg, #EFE3C6 0%, #D9C49A 60%, #B9A072 100%)",
            boxShadow: "inset -8px 0 16px rgba(0,0,0,0.25)",
          }}
        />
        <div
          style={{
            position: "absolute", left: -58, top: 214, width: 116, height: 26, borderRadius: 6,
            background: "linear-gradient(180deg, #6B5228, #4A3818)",
          }}
        />
      </div>

      {/* vệt sáng cuối cùng — dọc giữa màn hình */}
      <div
        style={{
          position: "absolute", left: 960 - slitW / 2, top: 540 - slitH / 2,
          width: slitW, height: slitH, background: C.white, borderRadius: 4,
          boxShadow: `0 0 ${28 + 26 * (1 - s3)}px ${8}px rgba(242,180,92,0.35)`,
          opacity: slitOp,
        }}
      />
    </Paper>
  );
};

// sc055 — C1 NGUYÊN VĂN — LẦN THỨ BA (HERO): màn đen tuyệt đối (s26)
export const Sc055: React.FC<SceneProps> = () => {
  const A = useA();
  const { p } = useFrac();
  const aDna = A("DNA khẳng định");
  const aBv = A("không hề có một mã gene nào tên là Bách Việt");
  const aViet = A("Không có gene Việt");
  const aMau = aViet + 0.22; // vế 3 — "Không có dòng máu thuần khiết…"

  const first = Math.max(aDna, 0.075); // ngắt 0,8 giây trước câu đầu
  const dim1 = clamp01(p(aViet + 0.03, aViet + 0.1));
  const dim2 = clamp01(p(aMau + 0.03, aMau + 0.1));

  const line = (at: number, top: number, dim: number, main: React.ReactNode): React.ReactNode => (
    <Reveal
      startFrac={at} endFrac={at + 0.08} dy={18}
      style={{ position: "absolute", left: 0, right: 0, top, textAlign: "center", opacity: 1 - 0.55 * dim }}
    >
      <div style={{ fontFamily: FONT.display, fontSize: 64, color: C.white, lineHeight: 1.4 }}>{main}</div>
    </Reveal>
  );

  return (
    <div style={{ position: "absolute", inset: 0, background: "#1A1714" }}>
      <Reveal
        startFrac={first} endFrac={first + 0.06} dy={0}
        style={{
          position: "absolute", left: 0, right: 0, top: 268, textAlign: "center",
          fontFamily: FONT.body, fontSize: 30, letterSpacing: 6, color: C.white, opacity: 0.62,
        }}
      >
        DNA khẳng định:
      </Reveal>

      {line(aBv, 396, dim1, (
        <span>
          không hề có một mã gene nào tên là{" "}
          <span style={{ borderBottom: "3px solid rgba(245,242,234,0.4)" }}>Bách Việt</span>
          <span style={{ fontFamily: FONT.hanzi, fontSize: 44, color: "#8C8375", marginLeft: 22 }}>百越</span>
        </span>
      ))}

      {line(aViet, 586, dim2, "Không có gene Việt.")}

      {line(aMau, 726, 0, (
        <span>
          Không có dòng máu thuần khiết nào
          <br />
          chờ được xác nhận.
        </span>
      ))}

      <div
        style={{
          position: "absolute", left: "50%", top: 920, transform: "translateX(-50%)",
          width: 340 * ease(clamp01(p(aMau + 0.11, aMau + 0.22))), height: 2,
          background: "rgba(245,242,234,0.28)",
        }}
      />
    </div>
  );
};

