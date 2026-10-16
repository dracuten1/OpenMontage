// S2E01 "Sơn Tinh – Thủy Tinh" — scenes group A (spec_a.json, 11 scenes).
// Speech-lock: useA() → fraction của scene; mọi beat bắn tại A(word, occ).
import * as React from "react";
import { AbsoluteFill } from "remotion";
import {
  Paper,
  Reveal,
  SpringPop,
  InkPath,
  circleD,
  Chip,
  SourceTag,
  LegendFrame,
  QuotePlate,
  TextCard,
  plateSrc,
  InkImageScene,
  Lamp,
  TimelineTrack,
  MapLabel,
  useA,
  useFrac,
} from "./common";
import { C, FONT, SceneProps } from "./theme";

// ---------------------------------------------------------------------------
// sc001 (s01) — MỞ TẬP · HERO TITLE: dòng sông Hồng mực + vạch nước dâng
// ---------------------------------------------------------------------------
export const Sc001: React.FC<SceneProps> = () => {
  const A = useA();
  const aSong = A("dòng sông Hồng"); // "dòng sông Hồng vẫn đỏ nặng phù sa"
  const aThang = A("Sơn Tinh thắng rồi"); // "Truyện kể rằng Sơn Tinh thắng rồi"
  const river =
    "M 110 800 C 400 730, 660 880, 940 820 S 1480 720, 1810 806";
  return (
    <Paper>
      <div
        style={{
          position: "absolute",
          inset: 0,
          padding: "150px 120px 90px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <Reveal
          startFrac={0.02}
          style={{
            fontFamily: FONT.mono,
            fontSize: 30,
            letterSpacing: 8,
            color: C.mute,
          }}
        >
          VN MYTH · MÙA HAI · TẬP 01
        </Reveal>
        <SpringPop startFrac={aSong} style={{ marginTop: 44 }}>
          <div
            style={{
              fontFamily: FONT.display,
              fontWeight: 800,
              fontSize: 148,
              color: C.cream,
              lineHeight: 1.04,
              textAlign: "center",
            }}
          >
            Sơn Tinh – Thủy Tinh
          </div>
        </SpringPop>
        <Reveal
          startFrac={aThang}
          dy={30}
          style={{
            marginTop: 30,
            fontFamily: FONT.display,
            fontWeight: 700,
            fontSize: 60,
            color: C.cream,
            textAlign: "center",
          }}
        >
          vì sao cuộc chiến <span style={{ color: C.amber }}>không bao giờ kết thúc</span>?
        </Reveal>
      </div>
      {/* nét mực teal vẽ dòng sông + vạch thước mờ mép phải, nước dâng từng nấc */}
      <svg
        width={1920}
        height={1080}
        viewBox="0 0 1920 1080"
        style={{ position: "absolute", inset: 0, pointerEvents: "none" }}
      >
        <InkPath
          d={river}
          startFrac={aSong + 0.05}
          endFrac={aSong + 0.24}
          stroke={C.teal}
          strokeWidth={6}
        />
      </svg>
      <div
        style={{
          position: "absolute",
          right: 122,
          bottom: 116,
          width: 2,
          height: 300,
          background: C.mute,
          opacity: 0.45,
        }}
      />
      {[0, 1, 2, 3].map((i) => (
        <SpringPop
          key={i}
          startFrac={aSong + 0.16 + i * 0.035}
          style={{ position: "absolute", right: 146, bottom: 132 + i * 46 }}
        >
          <div
            style={{
              width: 122,
              height: 6,
              background: C.amber,
              borderRadius: 4,
              boxShadow: "0 2px 10px rgba(0,0,0,0.6)",
            }}
          />
        </SpringPop>
      ))}
    </Paper>
  );
};

// ---------------------------------------------------------------------------
// sc007 (s03) — BỐN Ô ĐỜI THƯỜNG: lưới 2x2 InkDraw theo nhịp liệt kê
// ---------------------------------------------------------------------------
export const Sc007: React.FC<SceneProps> = () => {
  const A = useA();
  const a7 = A("tháng Bảy âm lịch"); // nước sông dâng
  const a1 = A("Tháng Giêng"); // rước nước chân núi Ba Vì
  const aSgk = A("sách giáo khoa"); // cái tên Sơn Tinh
  const a3m = A("ba mốc báo động"); // thước đo mép đê
  const cell = (label: string, color: string, at: number, paths: { d: string; w?: number }[]) => (
    <SpringPop startFrac={at}>
      <LegendFrame label={label} color={color} style={{ padding: "40px 48px 30px" }}>
        <svg width="100%" height={236} viewBox="0 0 520 240" style={{ overflow: "visible" }}>
          {paths.map((p, i) => (
            <InkPath
              key={i}
              d={p.d}
              startFrac={at + 0.02 + i * 0.025}
              endFrac={at + 0.12 + i * 0.025}
              stroke={color}
              strokeWidth={p.w ?? 5}
            />
          ))}
        </svg>
      </LegendFrame>
    </SpringPop>
  );
  return (
    <Paper>
      <Reveal
        startFrac={0.02}
        style={{
          position: "absolute",
          top: 64,
          left: 0,
          right: 0,
          textAlign: "center",
          fontFamily: FONT.mono,
          fontSize: 30,
          letterSpacing: 6,
          color: C.mute,
        }}
      >
        NHỮNG VỊ THẦN Ở LẠI · BỐN Ô ĐỜI THƯỜNG
      </Reveal>
      <div
        style={{
          position: "absolute",
          inset: 0,
          padding: "168px 150px 96px",
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "58px 52px",
        }}
      >
        {cell("THÁNG BẢY ÂM LỊCH", C.teal, a7, [
          { d: "M 60 186 C 120 164, 190 208, 250 186 S 380 164, 450 192" },
          { d: "M 60 136 C 120 116, 190 158, 250 136 S 380 116, 450 142" },
          { d: "M 60 92 C 120 74, 190 112, 250 92 S 380 74, 450 96" },
          { d: "M 482 60 L 482 214", w: 4 },
        ])}
        {cell("THÁNG GIÊNG · RƯỚC NƯỚC", C.amber, a1, [
          { d: "M 40 196 L 150 86 L 258 196" },
          { d: "M 258 196 L 350 116 L 442 196" },
          { d: "M 168 206 L 332 206 L 306 228 L 194 228 Z", w: 4 },
          { d: "M 250 206 L 250 152" },
          { d: "M 250 156 L 288 200 L 250 200 Z", w: 4 },
        ])}
        {cell("SÁCH GIÁO KHOA", C.cream, aSgk, [
          { d: "M 110 62 L 410 62 L 410 202 L 110 202 Z" },
          { d: "M 260 62 L 260 202", w: 4 },
          { d: "M 138 106 L 234 106", w: 4 },
          { d: "M 138 138 L 234 138", w: 4 },
          { d: "M 286 106 L 382 106", w: 4 },
          { d: "M 286 138 L 382 138", w: 4 },
        ])}
        {cell("BA MỐC BÁO ĐỘNG", C.cream, a3m, [
          { d: "M 250 52 L 250 216", w: 4 },
          { d: "M 250 84 L 316 84", w: 5 },
          { d: "M 250 134 L 316 134", w: 5 },
          { d: "M 250 184 L 316 184", w: 5 },
          { d: "M 96 208 C 140 190, 190 224, 234 208", w: 4 },
        ])}
      </div>
    </Paper>
  );
};

// ---------------------------------------------------------------------------
// sc013 (s05) — HỌ · QUÊ · NGHỀ: quote-card nghề + ba chip
// ---------------------------------------------------------------------------
export const Sc013: React.FC<SceneProps> = () => {
  const A = useA();
  const aNghe = A("cầu mưa lụt"); // quote nghề được đọc
  const aLang = A("người của làng"); // "một vị thần gần như một người của làng"
  const q0 = Math.max(0.01, aNghe - 0.07);
  return (
    <Paper>
      <div
        style={{
          position: "absolute",
          inset: 0,
          padding: "110px 170px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 58,
        }}
      >
        <QuotePlate
          text="«…có tài cầu mưa lụt hoặc nắng hạn đều ứng nghiệm»"
          startFrac={q0}
          endFrac={q0 + 0.3}
          source="Lĩnh Nam chích quái · bản hiệu chính 1492"
          size={56}
          maxWidth={1420}
        />
        <div style={{ display: "flex", gap: 26 }}>
          <SpringPop startFrac={Math.max(0.01, aLang - 0.1)}>
            <Chip color={C.amber}>họ · Nguyễn</Chip>
          </SpringPop>
          <SpringPop startFrac={Math.max(0.01, aLang - 0.065)}>
            <Chip color={C.amber}>quê · động Gia Ninh · Phong Châu</Chip>
          </SpringPop>
          <SpringPop startFrac={Math.max(0.01, aLang - 0.03)}>
            <Chip color={C.amber}>nghề · cầu mưa · cầu nắng</Chip>
          </SpringPop>
        </div>
        <Reveal
          startFrac={aLang}
          style={{
            fontFamily: FONT.display,
            fontStyle: "italic",
            fontWeight: 700,
            fontSize: 46,
            color: C.cream,
            textAlign: "center",
          }}
        >
          — một vị thần gần như một người của làng
        </Reveal>
      </div>
      <SourceTag text="LNCQ · sách chép — Vũ Quỳnh · Kiều Phú biên lại" right />
    </Paper>
  );
};

// ---------------------------------------------------------------------------
// sc019 (s07) — LUẬT ĐẾN TRƯỚC: quote gả + gạch bỏ voi chín ngà / gà chín cựa
// ---------------------------------------------------------------------------
export const Sc019: React.FC<SceneProps> = () => {
  const A = useA();
  const aTruoc = A("đến trước"); // occ 1 — lời vua hẹn gả
  const aTan = A("tàn nhẫn"); // "đơn giản đến tàn nhẫn"
  const q0 = Math.max(0.01, aTruoc - 0.09);
  const struck = (text: string, r0: number, s0: number) => (
    <Reveal startFrac={r0}>
      <div style={{ position: "relative", display: "inline-block" }}>
        <div
          style={{
            fontFamily: FONT.display,
            fontWeight: 700,
            fontSize: 48,
            color: C.mute,
            padding: "4px 10px",
          }}
        >
          {text}
        </div>
        <svg
          width="100%"
          height={64}
          viewBox="0 0 1000 64"
          preserveAspectRatio="none"
          style={{ position: "absolute", inset: 0, pointerEvents: "none" }}
        >
          <InkPath
            d="M 8 34 L 992 34"
            startFrac={s0}
            endFrac={s0 + 0.03}
            stroke={C.warn}
            strokeWidth={9}
          />
        </svg>
      </div>
    </Reveal>
  );
  return (
    <Paper>
      <div
        style={{
          position: "absolute",
          inset: 0,
          padding: "120px 160px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 46,
        }}
      >
        <SpringPop startFrac={q0}>
          <LegendFrame label="TRÍCH NGUYÊN VĂN">
            <div
              style={{
                fontFamily: FONT.display,
                fontWeight: 700,
                fontSize: 58,
                lineHeight: 1.45,
                color: C.white,
                maxWidth: 1300,
              }}
            >
              «ai đem đủ sính lễ{" "}
              <span style={{ color: C.amber }}>đến trước</span> thì gả cho người ấy»
            </div>
            <div
              style={{
                fontFamily: FONT.mono,
                fontSize: 26,
                color: C.amber,
                marginTop: 24,
                letterSpacing: 1,
              }}
            >
              — sách chép · Đại Việt sử ký toàn thư, 1697
            </div>
          </LegendFrame>
        </SpringPop>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-end",
            gap: 14,
            marginRight: 30,
          }}
        >
          {struck("voi chín ngà", aTruoc + 0.14, aTruoc + 0.2)}
          {struck("gà chín cựa", aTruoc + 0.2, aTruoc + 0.26)}
        </div>
      </div>
      <SpringPop
        startFrac={aTan}
        style={{ position: "absolute", left: 130, bottom: 108 }}
      >
        <div
          style={{
            fontFamily: FONT.display,
            fontWeight: 800,
            fontSize: 64,
            color: C.cream,
            background: "rgba(20,17,13,0.78)",
            padding: "10px 26px",
            borderRadius: 10,
          }}
        >
          Đến trước thì thắng.
        </div>
      </SpringPop>
    </Paper>
  );
};

// ---------------------------------------------------------------------------
// sc025 (s09) — VÒNG LẶP: vòng mực xoay + 4 nhãn + chìa khóa tâm vòng
// ---------------------------------------------------------------------------
export const Sc025: React.FC<SceneProps> = () => {
  const A = useA();
  const { frame } = useFrac();
  const aVong = A("vòng lặp"); // "một thứ không đổi: vòng lặp"
  const aKhoa = A("chìa khóa"); // "Đó là chìa khóa"
  const CX = 960;
  const CY = 430;
  const R = 268;
  return (
    <Paper>
      <svg
        width={1920}
        height={1080}
        viewBox="0 0 1920 1080"
        style={{ position: "absolute", inset: 0, pointerEvents: "none" }}
      >
        <InkPath
          d={circleD(CX, CY, R)}
          startFrac={aVong}
          endFrac={aVong + 0.12}
          stroke={C.cream}
          strokeWidth={4}
        />
        <g transform={`rotate(${frame * 0.12} ${CX} ${CY})`}>
          <InkPath
            d={`M ${CX - 20} ${CY - R - 14} L ${CX} ${CY - R + 12} L ${CX + 20} ${CY - R - 14}`}
            startFrac={aVong + 0.1}
            endFrac={aVong + 0.14}
            stroke={C.teal}
            strokeWidth={7}
          />
          <InkPath
            d={`M ${CX + 214} ${CY + 148} L ${CX + 232} ${CY + 176} L ${CX + 200} ${CY + 186}`}
            startFrac={aVong + 0.12}
            endFrac={aVong + 0.16}
            stroke={C.teal}
            strokeWidth={7}
          />
          <InkPath
            d={`M ${CX - 214} ${CY + 148} L ${CX - 232} ${CY + 176} L ${CX - 200} ${CY + 186}`}
            startFrac={aVong + 0.14}
            endFrac={aVong + 0.18}
            stroke={C.teal}
            strokeWidth={7}
          />
        </g>
        {/* chìa khóa nhỏ cắm giữa tâm vòng */}
        <InkPath
          d={circleD(CX - 52, CY, 17)}
          startFrac={aKhoa}
          endFrac={aKhoa + 0.02}
          stroke={C.amber}
          strokeWidth={6}
        />
        <InkPath
          d={`M ${CX - 34} ${CY} L ${CX + 58} ${CY} M ${CX + 40} ${CY} L ${CX + 40} ${CY + 16} M ${CX + 22} ${CY} L ${CX + 22} ${CY + 12}`}
          startFrac={aKhoa + 0.02}
          endFrac={aKhoa + 0.05}
          stroke={C.amber}
          strokeWidth={6}
        />
      </svg>
      <SpringPop startFrac={aVong + 0.06} style={{ position: "absolute", left: 735, top: 88 }}>
        <Chip color={C.teal}>tháng 7 – tháng 8 âm lịch</Chip>
      </SpringPop>
      <SpringPop startFrac={aVong + 0.1} style={{ position: "absolute", left: 1360, top: 398 }}>
        <Chip color={C.teal}>nước lại lên</Chip>
      </SpringPop>
      <SpringPop startFrac={aVong + 0.14} style={{ position: "absolute", left: 810, top: 748 }}>
        <Chip color={C.amber}>Thần lại đánh</Chip>
      </SpringPop>
      <SpringPop startFrac={aVong + 0.18} style={{ position: "absolute", left: 330, top: 398 }}>
        <Chip color={C.amber}>Người lại chờ xem</Chip>
      </SpringPop>
      {/* khung nhỏ góc: khung sách chép */}
      <Reveal startFrac={Math.max(0.01, aKhoa - 0.12)} style={{ position: "absolute", right: 96, top: 64 }}>
        <LegendFrame label="KHUNG SÁCH CHÉP" style={{ padding: "30px 36px 26px" }}>
          <div
            style={{
              fontFamily: FONT.display,
              fontStyle: "italic",
              fontWeight: 700,
              fontSize: 34,
              color: C.cream,
            }}
          >
            Sách chép để nó mở.
          </div>
        </LegendFrame>
      </Reveal>
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 96,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 18,
        }}
      >
        <Reveal
          startFrac={Math.max(0.01, aKhoa - 0.2)}
          style={{
            fontFamily: FONT.display,
            fontWeight: 700,
            fontSize: 50,
            color: C.cream,
            background: "rgba(20,17,13,0.78)",
            padding: "8px 26px",
            borderRadius: 10,
          }}
        >
          Cả hai đều không kết thúc câu chuyện.
        </Reveal>
        <SpringPop startFrac={aKhoa}>
          <div
            style={{
              fontFamily: FONT.display,
              fontWeight: 800,
              fontSize: 56,
              color: C.amber,
            }}
          >
            Đó là chìa khóa.
          </div>
        </SpringPop>
      </div>
    </Paper>
  );
};

// ---------------------------------------------------------------------------
// sc031 (s12) — HERO · MAP STAGE 4/6: nối giáp vòng cung nước (img-08 bản đồ)
// ---------------------------------------------------------------------------
export const Sc031: React.FC<SceneProps> = () => {
  const A = useA();
  const aHat = A("sông Hát"); // "lên cửa sông Hát"
  const aDa = A("sông Đà"); // "rẽ vào sông Đà"
  const aTV = A("Tản Viên"); // "để đánh Tản Viên"
  const aBp = A("binh pháp"); // "Một đường hành quân có binh pháp"
  return (
    <InkImageScene
      src={plateSrc("img-08-ban-do.png")}
      label="HỒI HAI · ĐƯỜNG HÀNH QUÂN CỦA THỦY TINH"
      sublabel="Lý Nhân → Quảng Oai → sông Hát → sông Đà → Tản Viên"
      focus={{ x: 0.5, y: 0.45 }}
    >
      <svg
        width={1920}
        height={1080}
        viewBox="0 0 1920 1080"
        style={{ position: "absolute", inset: 0, pointerEvents: "none" }}
      >
        {/* chặng đã đi (mực mảnh, nhớ lại) */}
        <InkPath
          d="M 1560 900 C 1330 830, 1120 760, 1000 640"
          startFrac={0.02}
          endFrac={0.1}
          stroke={C.mute}
          strokeWidth={4}
        />
        {/* Quảng Oai → cửa sông Hát */}
        <InkPath
          d="M 1000 640 C 950 590, 910 545, 860 500"
          startFrac={aHat}
          endFrac={aHat + 0.06}
          stroke={C.teal}
          strokeWidth={7}
        />
        {/* Hát → ra sông lớn */}
        <InkPath
          d="M 860 500 C 940 440, 1030 420, 1090 390"
          startFrac={aHat + 0.07}
          endFrac={aHat + 0.13}
          stroke={C.teal}
          strokeWidth={7}
        />
        {/* sông lớn → rẽ vào sông Đà */}
        <InkPath
          d="M 1090 390 C 950 372, 800 352, 660 330"
          startFrac={aDa}
          endFrac={aDa + 0.06}
          stroke={C.teal}
          strokeWidth={7}
        />
        {/* sông Đà → đánh Tản Viên + mũi tên */}
        <InkPath
          d="M 660 330 C 730 272, 810 232, 898 214"
          startFrac={aTV}
          endFrac={aTV + 0.05}
          stroke={C.teal}
          strokeWidth={7}
        />
        <InkPath
          d="M 876 228 L 898 210 L 872 202"
          startFrac={aTV + 0.05}
          endFrac={aTV + 0.07}
          stroke={C.teal}
          strokeWidth={8}
        />
        {/* Tản Viên: núi ba đỉnh nhấn */}
        <InkPath
          d="M 850 214 L 898 152 L 944 214 M 820 214 L 850 178 L 878 214 M 916 214 L 946 180 L 972 214"
          startFrac={aTV + 0.02}
          endFrac={aTV + 0.08}
          stroke={C.amber}
          strokeWidth={6}
        />
        {/* đọc lại: lộ trình toàn sáng + vòng cung ôm đồng bằng */}
        <InkPath
          d="M 1560 900 C 1330 830, 1120 760, 1000 640 C 950 590, 910 545, 860 500 C 940 440, 1030 420, 1090 390 C 950 372, 800 352, 660 330 C 730 272, 810 232, 898 214"
          startFrac={aTV + 0.1}
          endFrac={aTV + 0.2}
          stroke={C.teal}
          strokeWidth={18}
          style={{ opacity: 0.3 }}
        />
        <InkPath
          d="M 1560 900 C 1180 800, 780 540, 896 222"
          startFrac={aTV + 0.14}
          endFrac={aTV + 0.28}
          stroke={C.amber}
          strokeWidth={5}
        />
      </svg>
      <MapLabel x={1560} y={900} text="Lý Nhân" startFrac={0.03} />
      <MapLabel x={1000} y={640} text="Quảng Oai" startFrac={0.05} />
      <MapLabel x={860} y={500} text="sông Hát · hệ sông Đáy" startFrac={aHat} color={C.teal} />
      <MapLabel x={1090} y={390} text="sông lớn" startFrac={aHat + 0.07} />
      <MapLabel x={660} y={330} text="sông Đà" startFrac={aDa} color={C.teal} />
      <MapLabel x={898} y={152} text="TẢN VIÊN" startFrac={aTV} color={C.amber} />
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 78,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 14,
        }}
      >
        <Reveal
          startFrac={Math.max(0.01, aBp - 0.09)}
          style={{
            fontFamily: FONT.display,
            fontWeight: 700,
            fontSize: 44,
            color: C.cream,
            background: "rgba(20,17,13,0.78)",
            padding: "8px 26px",
            borderRadius: 10,
          }}
        >
          Không phải một cơn giận thần ngẫu nhiên.
        </Reveal>
        <SpringPop startFrac={aBp}>
          <div
            style={{
              fontFamily: FONT.display,
              fontWeight: 800,
              fontSize: 54,
              color: C.amber,
              background: "rgba(20,17,13,0.78)",
              padding: "8px 28px",
              borderRadius: 10,
            }}
          >
            Một đường hành quân có binh pháp.
          </div>
        </SpringPop>
      </div>
    </InkImageScene>
  );
};

// ---------------------------------------------------------------------------
// sc037 (s15) — CẢNH BÁO LUẬT ĐỌC: địa lý khớp không chứng minh + lớp vỏ
// ---------------------------------------------------------------------------
export const Sc037: React.FC<SceneProps> = () => {
  const A = useA();
  const { frame, dur } = useFrac();
  const aKP = A("không chứng minh"); // "địa lý khớp không chứng minh…"
  const aVo = A("lớp vỏ"); // "Thần thoại ở đây là lớp vỏ"
  const flipT = Math.max(0, Math.min(1, (frame - (aVo * dur + 130)) / 24));
  return (
    <Paper variant="museum">
      <div style={{ position: "absolute", inset: 76, border: `2px solid ${C.border}`, borderRadius: 14 }}>
        <div
          style={{
            position: "absolute",
            inset: 0,
            padding: "0 130px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 52,
            transform: `perspective(1800px) rotateX(${flipT * 7}deg)`,
          }}
        >
          <Reveal
            startFrac={Math.max(0.01, aKP - 0.05)}
            style={{
              fontFamily: FONT.display,
              fontWeight: 700,
              fontSize: 62,
              lineHeight: 1.35,
              color: C.white,
              textAlign: "center",
              background: "rgba(20,17,13,0.78)",
              padding: "14px 34px",
              borderRadius: 12,
            }}
          >
            Địa lý khớp <span style={{ color: C.warn }}>không chứng minh</span> Sơn Tinh
            hay Thủy Tinh có thật.
          </Reveal>
          <Reveal
            startFrac={aKP + 0.14}
            style={{
              fontFamily: FONT.body,
              fontWeight: 500,
              fontSize: 44,
              color: C.cream,
              textAlign: "center",
            }}
          >
            — chỉ chứng minh người kể thuộc lòng con sông của mình.
          </Reveal>
          <Reveal
            startFrac={aVo}
            style={{
              fontFamily: FONT.display,
              fontWeight: 800,
              fontSize: 58,
              color: C.cream,
              textAlign: "center",
            }}
          >
            Thần thoại ở đây là <span style={{ color: C.amber }}>lớp vỏ</span>.
          </Reveal>
          <Reveal
            startFrac={aVo + 0.07}
            style={{
              fontFamily: FONT.body,
              fontWeight: 500,
              fontSize: 42,
              lineHeight: 1.4,
              color: C.cream,
              textAlign: "center",
              maxWidth: 1440,
            }}
          >
            Bên trong là kinh nghiệm sống còn, được truyền lại bằng chuyện kể.
          </Reveal>
        </div>
      </div>
      <SourceTag text="LUẬT ĐỌC · THỰC THI ĐÚNG HẸN" bottom={40} />
    </Paper>
  );
};

// ---------------------------------------------------------------------------
// sc043 (s18) — LONG BIÊN ĐÊM MƯA + MỐC 1971 (img-11, không thêm số nào khác)
// ---------------------------------------------------------------------------
export const Sc043: React.FC<SceneProps> = () => {
  const A = useA();
  const { frame, dur } = useFrac();
  const a71 = A("lũ năm 1971"); // "Còn lũ năm 1971 thì được ghi…"
  const aDe = A("lại ra đê"); // "người ta lại ra đê"
  const aHet = A("Việc chưa bao giờ xong"); // dòng khép
  return (
    <InkImageScene
      src={plateSrc("img-11-long-bien.png")}
      label="CẦU LONG BIÊN · CANH BẾ MÙA NƯỚC"
      sublabel="Ba mốc báo động mép sông — đo theo giờ"
      focus={{ x: 0.5, y: 0.62 }}
    >
      {/* bóng người dân ra đê trong đêm */}
      <svg
        width={1920}
        height={1080}
        viewBox="0 0 1920 1080"
        style={{ position: "absolute", inset: 0, pointerEvents: "none" }}
      >
        <InkPath
          d="M 1150 706 L 1790 706"
          startFrac={aDe}
          endFrac={aDe + 0.05}
          stroke={C.cream}
          strokeWidth={4}
          style={{ opacity: 0.85 }}
        />
        <InkPath
          d="M 1310 612 L 1346 612 L 1328 584 Z M 1328 612 L 1328 668 M 1328 630 L 1306 650 M 1328 630 L 1350 648 M 1328 668 L 1314 706 M 1328 668 L 1342 706"
          startFrac={aDe + 0.03}
          endFrac={aDe + 0.1}
          stroke={C.cream}
          strokeWidth={4}
        />
        <InkPath
          d="M 1452 624 L 1482 624 L 1467 600 Z M 1467 624 L 1467 672 M 1467 638 L 1449 656 M 1467 638 L 1485 654 M 1467 672 L 1456 706 M 1467 672 L 1478 706"
          startFrac={aDe + 0.06}
          endFrac={aDe + 0.13}
          stroke={C.cream}
          strokeWidth={4}
        />
        <InkPath
          d="M 1576 630 L 1600 630 L 1588 612 Z M 1588 630 L 1588 668 M 1588 642 L 1574 656 M 1588 642 L 1602 654 M 1588 668 L 1580 706 M 1588 668 L 1596 706"
          startFrac={aDe + 0.09}
          endFrac={aDe + 0.16}
          stroke={C.cream}
          strokeWidth={4}
        />
      </svg>
      <TimelineTrack
        progress={Math.min(1, frame / (dur * 0.92))}
        marks={[
          {
            at: 0.64,
            year: "1971",
            label: "lũ lớn nhất thế kỷ 20",
            lit: frame >= a71 * dur,
            accent: C.teal,
          },
        ]}
        y={872}
      />
      <Reveal
        startFrac={aHet}
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 118,
          textAlign: "center",
          fontFamily: FONT.display,
          fontWeight: 800,
          fontSize: 58,
          color: C.cream,
          background: "rgba(20,17,13,0.78)",
          padding: "12px 30px",
          borderRadius: 12,
        }}
      >
        <span style={{ margin: "0 auto" }}>Việc chưa bao giờ xong.</span>
      </Reveal>
    </InkImageScene>
  );
};

// ---------------------------------------------------------------------------
// sc049 (s21) — BA DÒNG PHỦ ĐỊNH + hai câu rơi trầm
// ---------------------------------------------------------------------------
export const Sc049: React.FC<SceneProps> = () => {
  const A = useA();
  const a1 = A("không có triều đại để sụp đổ");
  const a2 = A("không có đạo quân để giải tán");
  const a3 = A("không có cái chết để biến mất");
  const dong = (t: number, text: string) => (
    <SpringPop startFrac={t}>
      <div
        style={{
          fontFamily: FONT.display,
          fontWeight: 700,
          fontSize: 62,
          color: C.cream,
          textAlign: "center",
        }}
      >
        <span style={{ color: C.warn }}>— không</span> {text}
      </div>
    </SpringPop>
  );
  return (
    <TextCard>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 34 }}>
        {dong(a1, "triều đại để sụp đổ")}
        {dong(a2, "đạo quân để giải tán")}
        {dong(a3, "cái chết để biến mất")}
        <Reveal
          startFrac={a3 + 0.26}
          dy={40}
          style={{
            marginTop: 40,
            fontFamily: FONT.body,
            fontWeight: 500,
            fontSize: 40,
            color: C.mute,
            textAlign: "center",
          }}
        >
          nên người kể chuyện xưa không dám bịa một hồi kết
        </Reveal>
        <Reveal
          startFrac={a3 + 0.4}
          dy={44}
          style={{
            fontFamily: FONT.display,
            fontWeight: 700,
            fontSize: 44,
            lineHeight: 1.4,
            color: C.cream,
            textAlign: "center",
            maxWidth: 1280,
          }}
        >
          nó bất tận vì việc nó kể, mùa này qua mùa khác,{" "}
          <span style={{ color: C.amber }}>vẫn chưa xong</span>
        </Reveal>
      </div>
    </TextCard>
  );
};

// ---------------------------------------------------------------------------
// sc055 (s24) — TRỤC TRẬN ĐỊA: mép nước → gần mây (sơ đồ dọc)
// ---------------------------------------------------------------------------
export const Sc055: React.FC<SceneProps> = () => {
  const A = useA();
  const { frame, dur } = useFrac();
  const aMep = A("từ mép nước đến gần mây"); // "ta đi từ mép nước đến gần mây"
  const aTruc = A("nước ở dưới, núi ở trên"); // "đúng trục của trận đánh xưa"
  const aTran = A("ngay giữa trận địa"); // "dựng ngay giữa trận địa"
  const axisStart = Math.max(0.01, aMep - 0.09);
  const dotsOn = frame >= (aTran + 0.05) * dur ? 1 : 0;
  const y1 = 555 + Math.sin(frame * 0.045) * 268;
  const y2 = 555 - Math.sin(frame * 0.045) * 268;
  return (
    <Paper>
      <svg
        width={1920}
        height={1080}
        viewBox="0 0 1920 1080"
        style={{ position: "absolute", inset: 0, pointerEvents: "none" }}
      >
        {/* núi ba đỉnh (trên) + sóng mép nước (dưới) — nền tĩnh */}
        <path
          d="M 720 332 L 820 222 L 880 282 L 960 192 L 1040 282 L 1100 222 L 1180 332"
          fill="none"
          stroke={C.amber}
          strokeWidth={5}
          opacity={0.85}
        />
        <path
          d="M 700 902 C 760 880, 830 924, 890 902 S 1010 880, 1070 906 S 1190 924, 1240 900"
          fill="none"
          stroke={C.teal}
          strokeWidth={5}
          opacity={0.85}
        />
        <path
          d="M 700 936 C 760 918, 830 954, 890 934 S 1010 916, 1070 938 S 1190 950, 1240 932"
          fill="none"
          stroke={C.teal}
          strokeWidth={3}
          opacity={0.5}
        />
        {/* trục dọc: đền dưới → đền trên */}
        <InkPath
          d="M 960 848 L 960 262"
          startFrac={axisStart}
          endFrac={aMep + 0.02}
          stroke={C.cream}
          strokeWidth={5}
        />
        <InkPath
          d="M 938 850 L 960 826 L 982 850 M 960 850 L 960 872"
          startFrac={axisStart}
          endFrac={axisStart + 0.04}
          stroke={C.teal}
          strokeWidth={4}
        />
        <InkPath
          d="M 942 268 L 960 246 L 978 268 M 960 268 L 960 288"
          startFrac={aMep - 0.01}
          endFrac={aMep + 0.03}
          stroke={C.amber}
          strokeWidth={4}
        />
        {/* khách thập phương lên xuống hai đầu trục */}
        <g opacity={dotsOn}>
          <circle cx={930} cy={y1} r={8} fill={C.teal} />
          <circle cx={990} cy={y2} r={8} fill={C.amber} />
        </g>
      </svg>
      <Reveal startFrac={axisStart} style={{ position: "absolute", left: 1010, top: 812 }}>
        <div style={{ fontFamily: FONT.mono, fontSize: 30, color: C.teal }}>Đền Hạ — mép nước</div>
      </Reveal>
      <Reveal startFrac={aMep + 0.01} style={{ position: "absolute", left: 1010, top: 210 }}>
        <div style={{ fontFamily: FONT.mono, fontSize: 30, color: C.amber }}>
          Đền Thượng — gần mây · 1.227 m
        </div>
      </Reveal>
      <SpringPop startFrac={aMep - 0.05} style={{ position: "absolute", left: 560, top: 940 }}>
        <Chip color={C.teal}>nước</Chip>
      </SpringPop>
      <SpringPop startFrac={aMep + 0.02} style={{ position: "absolute", left: 1240, top: 148 }}>
        <Chip color={C.amber}>núi</Chip>
      </SpringPop>
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 92,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 14,
        }}
      >
        <Reveal
          startFrac={aTruc}
          style={{
            fontFamily: FONT.display,
            fontWeight: 700,
            fontSize: 44,
            color: C.cream,
            background: "rgba(20,17,13,0.78)",
            padding: "8px 26px",
            borderRadius: 10,
          }}
        >
          đúng trục của trận đánh xưa — nước ở dưới, núi trên
        </Reveal>
        <Reveal
          startFrac={aTran}
          style={{
            fontFamily: FONT.body,
            fontWeight: 500,
            fontSize: 38,
            color: C.cream,
            background: "rgba(20,17,13,0.78)",
            padding: "8px 26px",
            borderRadius: 10,
          }}
        >
          dựng ngay giữa trận địa mà truyện kể
        </Reveal>
      </div>
    </Paper>
  );
};

// ---------------------------------------------------------------------------
// sc061 (s28) — END CARD: nút đăng ký mực + mép nước đêm + đuốc trên đê
// ---------------------------------------------------------------------------
export const Sc061: React.FC<SceneProps> = () => {
  const A = useA();
  const { frame, dur, p } = useFrac();
  const aDK = A("đăng ký theo dõi"); // "hãy đăng ký theo dõi để không lỡ tập mới"
  const aTuan = A("mỗi tuần một vị thần"); // nhịp phát
  const aMep = A("bên mép nước"); // "Hẹn gặp lại bên mép nước"
  const lampLit = p(Math.min(0.9, aMep), Math.min(0.93, aMep + 0.02));
  const darkT = Math.max(0, Math.min(1, (frame - (dur - 78)) / 60));
  return (
    <Paper variant="museum">
      <Reveal
        startFrac={0.02}
        style={{
          position: "absolute",
          top: 66,
          left: 0,
          right: 0,
          textAlign: "center",
          fontFamily: FONT.mono,
          fontSize: 30,
          letterSpacing: 8,
          color: C.mute,
        }}
      >
        VN MYTH · MÙA HAI — NHỮNG VỊ THẦN Ở LẠI
      </Reveal>
      {/* nút đăng ký vẽ mực */}
      <svg
        width={1920}
        height={1080}
        viewBox="0 0 1920 1080"
        style={{ position: "absolute", inset: 0, pointerEvents: "none" }}
      >
        <InkPath
          d="M 652 252 L 1268 252 Q 1310 252 1310 294 L 1310 350 Q 1310 392 1268 392 L 652 392 Q 610 392 610 350 L 610 294 Q 610 252 652 252"
          startFrac={aDK}
          endFrac={aDK + 0.08}
          stroke={C.amber}
          strokeWidth={5}
        />
      </svg>
      <Reveal
        startFrac={aDK + 0.03}
        style={{
          position: "absolute",
          top: 296,
          left: 0,
          right: 0,
          textAlign: "center",
          fontFamily: FONT.body,
          fontWeight: 700,
          fontSize: 40,
          letterSpacing: 2,
          color: C.amber,
        }}
      >
        ĐĂNG KÝ THEO DÕI · MÙA HAI
      </Reveal>
      {/* ba vế nhịp phát */}
      <div
        style={{
          position: "absolute",
          top: 470,
          left: 0,
          right: 0,
          display: "flex",
          justifyContent: "center",
          gap: 26,
        }}
      >
        <SpringPop startFrac={aTuan}>
          <Chip color={C.teal}>mỗi tuần một vị thần</Chip>
        </SpringPop>
        <SpringPop startFrac={aTuan + 0.035}>
          <Chip color={C.teal}>một bằng chứng</Chip>
        </SpringPop>
        <SpringPop startFrac={aTuan + 0.07}>
          <Chip color={C.teal}>một câu hỏi</Chip>
        </SpringPop>
      </div>
      {/* khung mép nước đêm + ngọn đuốc trên thân đê */}
      <Reveal startFrac={aTuan + 0.18} style={{ position: "absolute", inset: 0 }}>
        <svg
          width={1920}
          height={1080}
          viewBox="0 0 1920 1080"
          style={{ position: "absolute", inset: 0, pointerEvents: "none" }}
        >
          <path
            d="M 240 828 C 380 806, 520 850, 660 828 S 940 806, 1080 832 S 1360 850, 1500 826"
            fill="none"
            stroke={C.teal}
            strokeWidth={4}
            opacity={0.55}
          />
          <path
            d="M 240 872 C 380 854, 520 892, 660 872 S 940 854, 1080 876 S 1360 890, 1500 870"
            fill="none"
            stroke={C.teal}
            strokeWidth={3}
            opacity={0.35}
          />
          <path d="M 300 828 L 1700 828" stroke={C.mute} strokeWidth={2} opacity={0.4} />
          {[0, 1, 2, 3, 4].map((i) => (
            <path
              key={i}
              d={`M ${1560 + i * 34} 828 L ${1560 + i * 34} ${828 - 20 - i * 9}`}
              stroke={C.mute}
              strokeWidth={3}
              opacity={0.4}
            />
          ))}
        </svg>
        <Lamp x={1120} y={796} scale={1.05} lit={lampLit} mode="lit" pulse={frame / 40} />
      </Reveal>
      <Reveal
        startFrac={aMep + 0.01}
        dy={36}
        style={{
          position: "absolute",
          top: 620,
          left: 0,
          right: 0,
          textAlign: "center",
          fontFamily: FONT.display,
          fontWeight: 700,
          fontStyle: "italic",
          fontSize: 54,
          color: C.cream,
          background: "rgba(20,17,13,0.78)",
          padding: "12px 32px",
          borderRadius: 12,
        }}
      >
        Hẹn gặp lại bên mép nước.
      </Reveal>
      {/* màn tối dần về nền #1A1714 */}
      <AbsoluteFill style={{ background: C.bg, opacity: darkT, pointerEvents: "none" }} />
    </Paper>
  );
};
