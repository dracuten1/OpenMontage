import React from "react";
import { staticFile, Img } from "remotion";
import { Paper, Reveal, SpringPop, useA, useFrac } from "./common";
import { C, FONT, SceneProps } from "./theme";

const ease = (t: number): number => (t < 0 ? 0 : t > 1 ? 1 : t * t * (3 - 2 * t));

// sc059 — HERO CLIMAX: chữ 越
export const Sc059: React.FC<SceneProps> = () => {
  const A = useA();
  const { p } = useFrac();
  const aV = A("Việt", 8); // «Việt Nam — trên bản đồ thế giới»
  const aDuy = A("duy");
  const aChu = A("Chữ", 3); // «Chữ làm được»
  const hero = ease(p(aV, aV + 0.18));
  return (
    <Paper variant="night">
      <Img
        src={staticFile("bach-viet-bien-mat/images/img-sc059.png")}
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", opacity: 0.9 }}
      />
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          fontFamily: FONT.hanzi,
          fontSize: 360,
          color: C.amber,
          opacity: hero,
          transform: `translate(-50%, -50%) scale(${0.72 + 0.28 * hero})`,
          textShadow: "0 0 90px rgba(0,0,0,0.65)",
        }}
      >
        越
      </div>
      <Reveal startFrac={aDuy} endFrac={aDuy + 0.1}>
        <div style={{ position: "absolute", bottom: 190, left: 0, right: 0, textAlign: "center", fontFamily: FONT.body, fontSize: 44, color: C.cream }}>
          Việt Nam — quốc hiệu duy nhất còn giữ chữ Việt
        </div>
      </Reveal>
      <Reveal startFrac={aChu} endFrac={aChu + 0.12}>
        <div style={{ position: "absolute", bottom: 100, left: 0, right: 0, textAlign: "center", fontFamily: FONT.display, fontWeight: 700, fontSize: 56, color: C.white }}>
          Không gene nào làm được điều đó. Chữ làm được.
        </div>
      </Reveal>
    </Paper>
  );
};

// sc060 — LANDING: bản đồ lùi nền, chữ 越 giữ sáng
export const Sc060: React.FC<SceneProps> = () => {
  const A = useA();
  const aTung = A("từng");
  const aTheo = A("theo");
  return (
    <Paper variant="night">
      <Img
        src={staticFile("bach-viet-bien-mat/f07-hung-vuong.png")}
        style={{ position: "absolute", left: 0, bottom: 0, width: 880, opacity: 0.35, filter: "grayscale(1)" }}
      />
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          fontFamily: FONT.hanzi,
          fontSize: 200,
          color: C.amber,
          textShadow: "0 0 60px rgba(0,0,0,0.7)",
        }}
      >
        越
      </div>
      <Reveal startFrac={aTung} endFrac={aTung + 0.1}>
        <div style={{ position: "absolute", top: 250, right: 180, textAlign: "right", fontFamily: FONT.body, fontSize: 30, color: C.mute }}>
          Đông Âu → Giang–Hoài
        </div>
      </Reveal>
      <Reveal startFrac={aTung + 0.05} endFrac={aTung + 0.15}>
        <div style={{ position: "absolute", top: 340, right: 180, textAlign: "right", fontFamily: FONT.body, fontSize: 30, color: C.mute }}>
          Nam Việt → chín quận
        </div>
      </Reveal>
      <Reveal startFrac={aTheo} endFrac={aTheo + 0.1}>
        <div style={{ position: "absolute", top: 430, right: 180, textAlign: "right", fontFamily: FONT.body, fontSize: 30, color: C.mute }}>
          Lạc Việt → giữ tên
        </div>
      </Reveal>
    </Paper>
  );
};

// sc061 — DI SẢN CỦA CẢ MỘT THẾ GIỚI
export const Sc061: React.FC<SceneProps> = () => {
  const A = useA();
  const a1 = A("di");
  const a2 = A("năm");
  return (
    <Paper variant="night">
      <Reveal startFrac={a1} endFrac={a1 + 0.1}>
        <div style={{ position: "absolute", top: 380, left: 160, right: 160, textAlign: "center", fontFamily: FONT.display, fontWeight: 700, fontSize: 54, color: C.cream, lineHeight: 1.5 }}>
          chữ Việt — di sản của cả một thế giới đã tắt,<br />được một nhánh người sống sót mang qua hai nghìn năm.
        </div>
      </Reveal>
      <Reveal startFrac={a2} endFrac={a2 + 0.12}>
        <div style={{ position: "absolute", bottom: 120, left: 0, right: 0, textAlign: "center", fontFamily: FONT.body, fontSize: 34, color: C.mute }}>
          54 dân tộc — cùng chung hành trình ấy, cùng chung chữ ấy.
        </div>
      </Reveal>
    </Paper>
  );
};

// sc062 — ĐÈN → CHỮ morph
export const Sc062: React.FC<SceneProps> = () => {
  const A = useA();
  const { p } = useFrac();
  const aKhong = A("không", 7); // «ngọn đèn cuối cùng — không tắt»
  const aDoi = A("đổi");
  const m = ease(p(aKhong, aKhong + 0.3));
  return (
    <Paper variant="night">
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          width: 480,
          height: 480,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${C.lampGlow} 0%, ${C.lampRed} 45%, rgba(0,0,0,0) 75%)`,
          opacity: 1 - m,
          transform: `translate(-50%, -50%) scale(${1 - 0.75 * m})`,
        }}
      />
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          fontFamily: FONT.hanzi,
          fontSize: 300,
          color: C.amber,
          opacity: m,
          transform: `translate(-50%, -50%) scale(${0.8 + 0.2 * m})`,
        }}
      >
        越
      </div>
      <Reveal startFrac={aDoi} endFrac={aDoi + 0.1}>
        <div style={{ position: "absolute", bottom: 150, left: 0, right: 0, textAlign: "center", fontFamily: FONT.display, fontWeight: 700, fontSize: 46, color: C.cream }}>
          Không tắt. Nó chỉ đổi hình.
        </div>
      </Reveal>
    </Paper>
  );
};

// sc063 — THÀNH CHỮ
export const Sc063: React.FC<SceneProps> = () => {
  const A = useA();
  const { p } = useFrac();
  const aThanh = A("Thành");
  const inChu = ease(p(aThanh, aThanh + 0.12));
  const outDark = ease(p(0.85, 1));
  return (
    <Paper variant="night">
      <div
        style={{
          position: "absolute",
          top: 280,
          left: 0,
          right: 0,
          textAlign: "center",
          fontFamily: FONT.hanzi,
          fontSize: 280,
          color: C.amber,
          opacity: inChu,
        }}
      >
        越
      </div>
      <Reveal startFrac={aThanh + 0.1} endFrac={aThanh + 0.25}>
        <div style={{ position: "absolute", bottom: 240, left: 0, right: 0, textAlign: "center", fontFamily: FONT.display, fontWeight: 700, fontSize: 60, color: C.white }}>
          Thành chữ.
        </div>
      </Reveal>
      <div style={{ position: "absolute", inset: 0, background: "#000", opacity: outDark }} />
    </Paper>
  );
};

// sc064 — TEASE XI VƯU
export const Sc064: React.FC<SceneProps> = () => {
  const A = useA();
  const aHan = A("Hán");
  const aGoi = A("gọi");
  const aGan = A("gán");
  return (
    <Paper variant="night">
      <Img
        src={staticFile("bach-viet-bien-mat/images/img-sc064.png")}
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
      />
      <div
        style={{
          position: "absolute",
          top: 0,
          bottom: 0,
          left: 0,
          width: 780,
          background: "linear-gradient(90deg, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.75) 55%, rgba(0,0,0,0) 100%)",
        }}
      />
      <div style={{ position: "absolute", top: 290, left: 120, width: 640, fontFamily: FONT.display, fontWeight: 700, fontSize: 88, color: C.white }}>
        Ep.06 — Xi Vưu
      </div>
      <Reveal startFrac={aHan} endFrac={aHan + 0.1}>
        <div style={{ position: "absolute", top: 470, left: 120, fontFamily: FONT.body, fontSize: 34, color: C.cream }}>
          Hán — thần chiến tranh
        </div>
      </Reveal>
      <Reveal startFrac={aGoi} endFrac={aGoi + 0.1}>
        <div style={{ position: "absolute", top: 545, left: 120, fontFamily: FONT.body, fontSize: 34, color: C.teal }}>
          H'Mông — tổ phụ
        </div>
      </Reveal>
      <Reveal startFrac={aGan} endFrac={aGan + 0.1}>
        <div style={{ position: "absolute", top: 620, left: 120, fontFamily: FONT.body, fontSize: 34, color: C.amber }}>
          mạng Việt — ông tổ Bách Việt?
        </div>
      </Reveal>
    </Paper>
  );
};

// sc065 — OUTRO CTA
export const Sc065: React.FC<SceneProps> = () => {
  const A = useA();
  const aDang = A("Đăng");
  return (
    <Paper variant="night">
      <Img
        src={staticFile("bach-viet-bien-mat/images/img-sc004.png")}
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", opacity: 0.18 }}
      />
      <div style={{ position: "absolute", top: 400, left: 0, right: 0, textAlign: "center" }}>
        <SpringPop startFrac={aDang}>
          <div
            style={{
              display: "inline-block",
              border: `3px solid ${C.amber}`,
              borderRadius: 14,
              padding: "18px 64px",
              fontFamily: FONT.display,
              fontWeight: 700,
              fontSize: 56,
              color: C.white,
            }}
          >
            Đăng ký để không lỡ
          </div>
        </SpringPop>
      </div>
      <Reveal startFrac={aDang + 0.08} endFrac={aDang + 0.2}>
        <div style={{ position: "absolute", top: 580, left: 0, right: 0, textAlign: "center", fontFamily: FONT.body, fontSize: 36, color: C.mute }}>
          chương kết của cả một mùa dài hỏi: tổ tiên ta thật sự là ai
        </div>
      </Reveal>
      <div
        style={{
          position: "absolute",
          bottom: 70,
          right: 90,
          fontFamily: FONT.display,
          fontWeight: 700,
          fontSize: 40,
          color: C.amber,
          letterSpacing: 6,
        }}
      >
        VN-MYTH
      </div>
    </Paper>
  );
};
