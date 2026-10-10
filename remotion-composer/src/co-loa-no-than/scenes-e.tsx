// VN-Myth Ep.04 — scenes group E: sc041..sc050 (dây chuyền đúc đồng, ba phần tư
// chưa dùng, kho của nhà nước, lẫy nỏ đồng hiện vật, BLUEPRINT nỏ thần — HERO,
// Triệu Đà, Nam Việt bản đồ, lăng Triệu Mội, phiếu kiểm kê, cách dùng chữ).
// Speech-lock: mọi animation fire tại A("từ", occ).
import React from "react";
import { AbsoluteFill, staticFile } from "remotion";
import { C, FONT, SceneProps } from "./theme";
import {
  Chip,
  CountUp,
  EarthBadge,
  InkImageScene,
  LabBadge,
  LegendFrame,
  Paper,
  PhotoCredit,
  QuotePlate,
  Reveal,
  SourceTag,
  SpringPop,
  StrikeThrough,
  ease,
  useA,
  useFrac
} from "./common";

// === sc041 === DÂY CHUYỀN ĐÚC ĐỒNG — chuỗi 4 công đoạn chạy liên tục
export const Sc041: React.FC<SceneProps> = ({ durationInFrames }) => {
  const A = useA();
  const tKhuon = A("khuôn", 1); // «đã có khuôn, có thợ, có người kiểm tra»
  const tChay = A("dây", 1); // «một dây chuyền đúc đồng chạy thật»
  const tLoat = A("loạt", 1); // «sản xuất hàng loạt chuẩn hóa»
  const { frame, p } = useFrac(durationInFrames);
  const stations = [
    { label: "khuôn đúc", icon: "▤" },
    { label: "thợ rót đồng", icon: "⚗" },
    { label: "ra khuôn", icon: "△" },
    { label: "kiểm tra — đối chiếu chuẩn", icon: "✓" },
  ];
  const flow = ease(p(tChay, tChay + 0.2)); // băng chuyền chạy
  return (
    <Paper variant="earth">
      <EarthBadge text="SẢN XUẤT HÀNG LOẠT CHUẨN HÓA" />
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
        <SpringPop startFrac={tLoat} from={0.85}>
          <div style={{ fontFamily: FONT.display, fontWeight: 800, fontSize: 66, color: C.white }}>
            sản xuất <span style={{ color: C.earthGlow }}>hàng loạt</span> — chuẩn hóa
          </div>
          <div style={{ fontFamily: FONT.body, fontSize: 32, color: C.cream, marginTop: 12, textAlign: "center" }}>
            thứ nhiều người tưởng là phát minh của thời công nghiệp
          </div>
        </SpringPop>
        <svg width="1560" height="470" viewBox="0 0 1560 470" style={{ marginTop: 40 }}>
          {/* băng chuyền */}
          <path d="M 80 330 H 1480" stroke={C.earthGlow} strokeWidth={6} opacity={0.8} />
          {Array.from({ length: 24 }, (_, i) => {
            const x = 80 + ((i * 80 + frame * 2.2) % 1400);
            return <circle key={i} cx={x} cy={330} r={9} fill={C.bg} stroke={C.cream} strokeWidth={3} opacity={0.7} />;
          })}
          {/* bốn công đoạn */}
          {stations.map((st, i) => (
            <g key={i} transform={`translate(${180 + i * 400} 190)`} opacity={ease(p(tKhuon + i * 0.03 - 0.02, tKhuon + i * 0.03 + 0.04))}>
              <rect x={-110} y={-110} width={220} height={180} rx={10} fill="rgba(36,31,26,0.94)" stroke={C.earthGlow} strokeWidth={3} />
              <text x={0} y={-26} textAnchor="middle" fontSize={64} fill={C.amber}>{st.icon}</text>
              <text x={0} y={44} textAnchor="middle" fill={C.cream} fontFamily='"Be Vietnam Pro"' fontSize={27}>{st.label}</text>
            </g>
          ))}
          {/* mũi tên nối các công đoạn — chảy liên tục */}
          {[0, 1, 2].map((i) => {
            const x = 300 + i * 400 + ((frame * 3) % 120);
            return <path key={i} d={`M ${x} 190 l 26 -12 l -8 12 l 8 12 Z`} fill={C.amber} opacity={0.8} />;
          })}
        </svg>
        <Reveal startFrac={tChay} endFrac={tChay + 0.12}>
          <div style={{ fontFamily: FONT.body, fontSize: 36, color: C.amber, marginTop: 20 }}>
            một «dây chuyền» đúc đồng chạy thật — hai nghìn năm trước khi từ ấy ra đời
          </div>
        </Reveal>
      </AbsoluteFill>
      <SourceTag text="Mỗi ký gần một trăm chiếc — khớp đến mức khó tin" bottom={40} right />
    </Paper>
  );
};

// === sc042 === BA PHẦN TƯ CHƯA DÙNG — photo inset + donut
export const Sc042: React.FC<SceneProps> = ({ durationInFrames }) => {
  const A = useA();
  const tDonut = A("phần", 1); // «khoảng ba phần tư»
  const tMoi = A("khuôn", 1); // «mới ra khuôn, chưa hề qua sử dụng»
  const { frame, p } = useFrac(durationInFrames);
  const sweep = ease(p(tDonut, tDonut + 0.16));
  const CIRC = 2 * Math.PI * 240;
  return (
    <Paper variant="earth">
      <EarthBadge text="CHI TIẾT ĐÁNG SUY NGẪM NHẤT" />
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 110 }}>
          {/* donut 3/4 */}
          <svg width="640" height="640" viewBox="0 0 640 640">
            <circle cx={320} cy={320} r={240} fill="none" stroke="rgba(232,220,200,0.18)" strokeWidth={74} />
            <path
              d={`M 320 80 A 240 240 0 1 1 319.9 80`}
              fill="none"
              stroke={C.earthGlow}
              strokeWidth={74}
              strokeDasharray={`${CIRC * 0.75 * sweep} ${CIRC}`}
              transform="rotate(-90 320 320)"
              strokeLinecap="butt"
            />
            <text x={320} y={300} textAnchor="middle" fill={C.white} fontFamily='"JetBrains Mono"' fontWeight={700} fontSize={92}>
              ~3/4
            </text>
            <text x={320} y={364} textAnchor="middle" fill={C.cream} fontFamily='"Be Vietnam Pro"' fontSize={34}>chưa qua sử dụng</text>
          </svg>
          {/* photo inset */}
          <div
            style={{
              width: 660,
              height: 560,
              border: `3px solid ${C.cream}`,
              borderRadius: 12,
              overflow: "hidden",
              boxShadow: "0 20px 50px rgba(0,0,0,0.6)",
              background: "#14110D",
            }}
          >
            <img src={require_img()} style={{ width: "100%", height: "100%", objectFit: "cover" }} alt="mũi tên đồng" />
          </div>
        </div>
        <Reveal startFrac={tMoi} endFrac={tMoi + 0.12}>
          <div style={{ fontFamily: FONT.body, fontSize: 38, color: C.cream, marginTop: 40 }}>
            <b style={{ color: C.white }}>mới ra khuôn, chưa hề qua sử dụng</b> — chúng không kịp dùng
          </div>
        </Reveal>
      </AbsoluteFill>
      <PhotoCredit />
      <SourceTag text="Tích trữ nhiều hơn nhu cầu trước mắt — tính đến trận đánh chưa xảy ra" bottom={44} right />
    </Paper>
  );
};
// staticFile cho ảnh thật (wrapper an toàn)
const require_img = () => staticFile("co-loa-no-than/images/mui-ten-dong-coloa.jpg");

// === sc043 === KHO CỦA NHÀ NƯỚC — hố nằm chờ, hạt bụi lắng
export const Sc043: React.FC<SceneProps> = ({ durationInFrames }) => {
  const A = useA();
  const tTich = A("tích", 1); // «tích trữ vũ khí nhiều hơn nhu cầu trước mắt»
  const tDanh = A("tiếp", 1); // «để còn đánh tiếp»
  const tChung = A("chuẩn", 1); // «chứng nhân của sự chuẩn bị»
  const { frame, p } = useFrac(durationInFrames);
  return (
    <Paper variant="earth">
      <EarthBadge text="KHO CỦA MỘT NHÀ NƯỚC" />
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
        <svg width="1500" height="620" viewBox="0 0 1500 620">
          <path d="M 300 200 H 1200 V 520 H 300 Z" fill="rgba(92,61,34,0.55)" stroke={C.earth} strokeWidth={5} />
          <path d="M 250 200 H 1250" stroke={C.cream} strokeWidth={5} opacity={0.7} />
          {Array.from({ length: 14 }, (_, i) => (
            <g key={i} transform={`translate(${350 + (i % 7) * 120} ${330 + Math.floor(i / 7) * 90}) scale(0.13)`} opacity={ease(p(tTich - 0.06, tTich))}>
              <path d="M 0 0 L 90 220 L -90 220 Z M 0 220 L 34 700 L -34 700 Z" fill={C.bronze} opacity={0.75} />
            </g>
          ))}
          {/* hạt bụi lắng chậm — nhịp thở khoảng lặng */}
          {Array.from({ length: 16 }, (_, i) => {
            const y = ((frame * (0.6 + (i % 4) * 0.3) + i * 71) % 420) + 120;
            return <circle key={i} cx={320 + ((i * 173) % 1160)} cy={y} r={2 + (i % 3)} fill={C.cream} opacity={0.22} />;
          })}
        </svg>
        <SpringPop startFrac={tDanh} from={0.85}>
          <div style={{ fontFamily: FONT.display, fontWeight: 700, fontSize: 62, color: C.white, marginTop: 20 }}>
            «Người ta chôn chúng — <span style={{ color: C.earthGlow }}>để còn đánh tiếp</span>»
          </div>
        </SpringPop>
        <Reveal startFrac={tChung} endFrac={tChung + 0.12}>
          <div style={{ fontFamily: FONT.body, fontSize: 34, color: C.cream, marginTop: 18 }}>
            một khoảng lặng — chứng nhân của sự chuẩn bị
          </div>
        </Reveal>
      </AbsoluteFill>
      <SourceTag text="Không phải chiến lợi phẩm, không phải hiện trường chiến sự" bottom={40} right />
    </Paper>
  );
};

// === sc044 === LẪY NỎ ĐỒNG HIỆN VẬT — ảnh + ba nhãn bộ phận
export const Sc044: React.FC<SceneProps> = ({ durationInFrames }) => {
  const A = useA();
  t_labels: {
  }
  const tHop = A("hộp", 1); // «hộp lẫy»
  const tCo = A("cò", 1); // «lẫy cò»
  const tTruc = A("trục", 1); // «trục quay»
  const { frame, p } = useFrac(durationInFrames);
  const labels = [
    { t: tHop, text: "hộp lẫy", x: 64, y: 300 },
    { t: tCo, text: "lẫy cò", x: 64, y: 470 },
    { t: tTruc, text: "trục quay", x: 64, y: 640 },
  ];
  return (
    <InkImageScene src="img-sc044.png" focus={{ x: 0.58, y: 0.5 }} label="BỘ LẪY NỎ ĐỒNG — HIỆN VẬT THẬT" sublabel="tìm thấy ngay tại thành Cổ Loa">
      {labels.map((l, i) => (
        <div key={i} style={{ position: "absolute", left: l.x, top: l.y }}>
          <SpringPop startFrac={l.t} from={0.8}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 16,
                fontFamily: FONT.body,
                fontWeight: 700,
                fontSize: 38,
                color: C.teal,
                background: "rgba(20,17,13,0.86)",
                border: `2px solid ${C.teal}`,
                borderRadius: 8,
                padding: "12px 26px",
              }}
            >
              <span style={{ fontFamily: FONT.mono, color: C.cream }}>{i + 1}</span> {l.text}
            </div>
          </SpringPop>
        </div>
      ))}
      {/* đường chỉ từ nhãn vào ảnh */}
      <svg width="1920" height="1080" viewBox="0 0 1920 1080" style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
        {[
          { d: "M 380 330 Q 700 330 1010 430", t: tHop },
          { d: "M 340 500 Q 660 500 980 540", t: tCo },
          { d: "M 420 670 Q 720 670 1000 610", t: tTruc },
        ].map((l, i) => (
          <path key={i} d={l.d} stroke={C.teal} strokeWidth={3} fill="none" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - ease(p(l.t, l.t + 0.08))} opacity={0.8} />
        ))}
      </svg>
      <SourceTag text="Cơ cấu giữ lực căng của dây và nhả tên — đã được nghiên cứu, phục dựng" bottom={44} right />
    </InkImageScene>
  );
};

// === sc045 === BLUEPRINT NỔ-BẬT — HERO: nỏ exploded rồi lắp lại (teal technical)
export const Sc045: React.FC<SceneProps> = ({ durationInFrames }) => {
  const A = useA();
  const tGiu = A("giữ", 1); // «Cơ cấu giữ lực căng» — lẫy bung ra
  const tNha = A("nhả", 1); // «và nhả tên» — cò + trục
  const tKhop = A("khớp", 1); // «khớp nhau như một cơ khí thật sự» — lắp lại
  const tHoaLuc = A("hỏa", 1); // «một hỏa lực tập trung»
  const tThanLinh = A("thần", 2); // «ngôn ngữ của thế giới thần linh» (2nd occ in s22)
  const { frame, dur, p } = useFrac(durationInFrames);
  const explode = ease(p(tGiu, tNha + 0.1)); // các bộ phận bung ra
  const reassemble = ease(p(tKhop, tKhop + 0.18)); // lắp lại
  const ex = (1 - reassemble) * explode; // offset hiện tại
  return (
    <Paper variant="museum">
      <LabBadge text="BLUEPRINT — LINH QUANG KIM QUÁ THẦN CƠ" />
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
        <svg width="1920" height="1080" viewBox="0 0 1920 1080">
          {/* lưới blueprint mờ */}
          {Array.from({ length: 12 }, (_, i) => (
            <line key={`v${i}`} x1={i * 160} y1={0} x2={i * 160} y2={1080} stroke={C.teal} strokeWidth={0.7} opacity={0.09} />
          ))}
          {Array.from({ length: 8 }, (_, i) => (
            <line key={`h${i}`} x1={0} y1={i * 140} x2={1920} y2={i * 140} stroke={C.teal} strokeWidth={0.7} opacity={0.09} />
          ))}
          {/* thân nỏ */}
          <g opacity={ease(p(0.02, 0.1))}>
            <rect x={700 - ex * 130} y={500} width={520} height={52} fill="none" stroke={C.cream} strokeWidth={4} />
            <text x={960 - ex * 130} y={480} textAnchor="middle" fill={C.cream} fontFamily='"JetBrains Mono"' fontSize={25} opacity={0.85}>thân nỏ (án gỗ)</text>
          </g>
          {/* dây cung */}
          <g opacity={ease(p(0.04, 0.12))}>
            <path d={`M ${1330 + ex * 150} ${330 - ex * 60} Q ${1430 + ex * 160} ${526} ${1330 + ex * 150} ${722 + ex * 60}`} fill="none" stroke={C.cream} strokeWidth={4} pathLength={1} strokeDasharray={1} strokeDashoffset={1 - ease(p(0.05, 0.18))} />
            <text x={1360 + ex * 150} y={300 - ex * 60} fill={C.cream} fontFamily='"JetBrains Mono"' fontSize={25}>dây cung</text>
          </g>
          {/* cánh cung */}
          <g opacity={ease(p(0.03, 0.11))}>
            <path d={`M ${1290 + ex * 190} ${340 - ex * 90} Q ${1560 + ex * 220} ${526} ${1290 + ex * 190} ${712 + ex * 90}`} fill="none" stroke={C.amber} strokeWidth={7} pathLength={1} strokeDasharray={1} strokeDashoffset={1 - ease(p(0.04, 0.2))} />
          </g>
          {/* hộp lẫy đồng — bộ phận chủ đề, bung cao nhất */}
          <g opacity={ease(p(tGiu - 0.04, tGiu))}>
            <rect x={660 - ex * 300} y={560 - ex * 210} width={150} height={90} fill="rgba(127,209,200,0.14)" stroke={C.teal} strokeWidth={5} rx={8} />
            <text x={735 - ex * 300} y={540 - ex * 210} textAnchor="middle" fill={C.teal} fontFamily='"JetBrains Mono"' fontSize={26}>hộp lẫy đồng</text>
            {/* lẫy cò */}
            <path d={`M ${700 - ex * 300} ${650 - ex * 210} q ${-30 - ex * 20} ${70 + ex * 40} ${40} ${86 + ex * 40}`} fill="none" stroke={C.teal} strokeWidth={6} strokeLinecap="round" opacity={ease(p(tNha, tNha + 0.06))} />
            {/* trục quay */}
            <circle cx={735 - ex * 300} cy={575 - ex * 210} r={16} fill="none" stroke={C.teal} strokeWidth={5} opacity={ease(p(tNha, tNha + 0.06))} />
          </g>
          {/* nhãn bộ phận khi lắp xong */}
          <text x={735 - ex * 300} y={720 - ex * 210} textAnchor="middle" fill={C.cream} fontFamily='"Be Vietnam Pro"' fontSize={24} opacity={reassemble}>lẫy · cò · trục quay</text>
          {/* vòng sáng khi lắp hoàn chỉnh */}
          {reassemble > 0.9 && (
            <circle cx={735} cy={605} r={70 + 16 * Math.sin(frame / 6)} fill="none" stroke={C.teal} strokeWidth={3} opacity={0.5} />
          )}
        </svg>
        <div style={{ position: "absolute", bottom: 130, left: 120, right: 120 }}>
          <Reveal startFrac={tHoaLuc} endFrac={tHoaLuc + 0.1}>
            <div style={{ fontFamily: FONT.body, fontWeight: 500, fontSize: 36, lineHeight: 1.4, color: C.cream, background: "rgba(20,17,13,0.78)", padding: "18px 26px", borderRadius: 10 }}>
              «một <b style={{ color: C.teal }}>hỏa lực tập trung</b> mà thời tiền sử Đông Nam Á chưa từng thấy —
              thần thoại kể <b>đúng hiện tượng</b>, bằng ngôn ngữ của thế giới thần linh»
            </div>
          </Reveal>
        </div>
      </AbsoluteFill>
      <SourceTag text="Ghép cả hồ sơ: mũi chuẩn hóa + đúc loạt + kho dự trữ + cơ khí giữ lực" bottom={40} right />
    </Paper>
  );
};

// === sc046 === TRIỆU ĐÀ — hồ sơ sử Hán mở ra
export const Sc046: React.FC<SceneProps> = ({ durationInFrames }) => {
  const A = useA();
  const tName = A("Triệu", 1); // «Triệu Đà»
  const tSuKy = A("Sử", 1); // «Sử ký — bộ sử của Tư Mã Thiên»
  const tLap = A("linh", 1); // «hai trăm linh tư trước Công nguyên»
  const tThо = A("thọ", 1); // «sống thọ hơn một trăm tuổi»
  const { p } = useFrac(durationInFrames);
  return (
    <InkImageScene src="img-sc046.png" focus={{ x: 0.5, y: 0.42 }} label="TRIỆU ĐÀ" sublabel="đối thủ của hồ sơ sử Hán — vẫn còn đào được lăng mộ gia đình">
      <div style={{ position: "absolute", top: 84, left: 84 }}>
        <Reveal startFrac={tSuKy} endFrac={tSuKy + 0.08}>
          <Chip color={C.cream}>Sử ký — Tư Mã Thiên</Chip>
        </Reveal>
      </div>
      <div style={{ position: "absolute", top: 180, left: 84, display: "flex", flexDirection: "column", gap: 18 }}>
        <SpringPop startFrac={tLap} from={0.84}>
          <div
            style={{
              fontFamily: FONT.mono,
              fontWeight: 700,
              fontSize: 38,
              color: C.white,
              border: `2px solid ${C.cream}`,
              borderRadius: 8,
              padding: "12px 26px",
              background: "rgba(26,23,20,0.86)",
            }}
          >
            204 TCN (Nam Việt lập)
          </div>
        </SpringPop>
        <SpringPop startFrac={tThо} from={0.84}>
          <div
            style={{
              fontFamily: FONT.mono,
              fontWeight: 700,
              fontSize: 38,
              color: C.cream,
              border: `2px solid ${C.cream}`,
              borderRadius: 8,
              padding: "12px 26px",
              background: "rgba(26,23,20,0.86)",
            }}
          >
            &gt;100 tuổi (Triệu Đà)
          </div>
        </SpringPop>
      </div>
      <SourceTag text="Một đối thủ sống lâu hơn cả đời vua chúa bấy giờ" bottom={44} right />
    </InkImageScene>
  );
};

// === sc047 === NAM VIỆT TRÊN BẢN ĐỒ + ô chữ trống
export const Sc047: React.FC<SceneProps> = ({ durationInFrames }) => {
  const A = useA();
  const tDo = A("đô", 1); // «đóng đô tại Phiên Ngung»
  const tQz = A("Quảng", 1); // «chính là Quảng Châu ngày nay»
  const tChu = A("chữ", 1); // «một chữ đánh giá»
  const { frame, p } = useFrac(durationInFrames);
  return (
    <Paper>
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
        <svg width="1500" height="760" viewBox="0 0 1500 760">
          {/* mảng đất phương Bắc */}
          <path d="M 120 120 Q 500 60 900 110 Q 1180 150 1320 260 L 1240 480 Q 900 430 620 470 Q 340 500 160 460 Z" fill="rgba(232,220,200,0.07)" stroke={C.cream} strokeWidth={5} />
          <text x={620} y={230} fill={C.cream} fontFamily='"Be Vietnam Pro"' fontSize={40} opacity={0.85} textAnchor="middle">NAM VIỆT</text>
          {/* đô Phiên Ngung sáng lên */}
          <g opacity={ease(p(tDo, tDo + 0.08))}>
            <circle cx={880} cy={330} r={20 + 8 * Math.sin(frame / 6)} fill={C.amber} opacity={0.3} />
            <circle cx={880} cy={330} r={9} fill={C.amber} />
            <text x={880} y={382} textAnchor="middle" fill={C.amber} fontFamily='"Be Vietnam Pro"' fontSize={28}>Phiên Ngung</text>
          </g>
          {/* đường nhìn sang Âu Lạc phía nam */}
          <path d="M 880 350 Q 820 480 760 600" stroke={C.cream} strokeWidth={3} strokeDasharray="10 8" fill="none" opacity={ease(p(tDo + 0.06, tDo + 0.16))} />
          {/* Âu Lạc phía nam — ba vòng nhỏ */}
          <g opacity={ease(p(tDo + 0.08, tDo + 0.2))}>
            {[46, 32, 18].map((r, i) => (
              <circle key={i} cx={760} cy={640} r={r} fill="none" stroke={C.earthGlow} strokeWidth={5 - i} opacity={0.85} />
            ))}
            <text x={760} y={716} textAnchor="middle" fill={C.earthGlow} fontFamily='"Be Vietnam Pro"' fontSize={28}>ÂU LẠC</text>
          </g>
        </svg>
        <Reveal startFrac={tQz} endFrac={tQz + 0.08}>
          <Chip color={C.cream} style={{ marginTop: 6 }}>đô Phiên Ngung — chính là Quảng Châu ngày nay</Chip>
        </Reveal>
        {/* ô chữ trống đóng khung — payoff ở sc051 */}
        <SpringPop startFrac={tChu} from={0.85} style={{ marginTop: 44 }}>
          <div
            style={{
              width: 320,
              height: 130,
              border: `3px dashed ${C.amber}`,
              borderRadius: 10,
              background: "rgba(36,31,26,0.6)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontFamily: FONT.display,
              fontWeight: 800,
              fontSize: 46,
              color: C.mute,
            }}
          >
            «một chữ»
          </div>
          <div style={{ fontFamily: FONT.body, fontSize: 30, color: C.cream, textAlign: "center", marginTop: 14 }}>
            về người láng giềng Âu Lạc — sử Hán để lại một chữ đánh giá. Chỉ một chữ.
          </div>
        </SpringPop>
      </AbsoluteFill>
      <SourceTag text="Ta sẽ quay lại với chữ ấy" bottom={40} right />
    </Paper>
  );
};

// === sc048 === LĂNG TRIỆU MỘI — cutaway dọc, ấn vàng, áo ngọc
export const Sc048: React.FC<SceneProps> = ({ durationInFrames }) => {
  const A = useA();
  const tDate = A("tám", 1); // «năm một nghìn chín trăm tám mươi ba»
  const tSau = A("mười", 1); // «sâu hơn mười bảy mét»
  const tAn = A("ấn", 1); // «ấn vàng khắc bốn chữ»
  const tNgoc = A("ngọc", 1); // «áo chôn bằng ngọc»
  const { frame, p } = useFrac(durationInFrames);
  const descend = ease(p(tSau, tSau + 0.2));
  return (
    <Paper>
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 100 }}>
          <svg width="560" height="720" viewBox="0 0 560 720">
            {/* đồi Tượng Cương */}
            <path d="M 60 160 Q 280 60 500 160 L 500 720 L 60 720 Z" fill="rgba(232,220,200,0.06)" stroke={C.cream} strokeWidth={4} />
            {/* hầm mộ sâu — camera hạ dần */}
            <rect x={180} y={170 + (1 - descend) * 300} width={200} height={360} fill="rgba(20,17,13,0.9)" stroke={C.amber} strokeWidth={4} />
            {/* thước độ sâu */}
            {Array.from({ length: 9 }, (_, i) => (
              <g key={i} opacity={descend}>
                <path d={`M 430 ${200 + i * 60} H 452`} stroke={C.cream} strokeWidth={3} />
              </g>
            ))}
            <text x={466} y={560} fill={C.amber} fontFamily='"JetBrains Mono"' fontSize={27} transform="rotate(-90 466 560)">&gt;17 m (độ sâu lăng)</text>
            {/* ấn vàng + áo ngọc trong mộ */}
            <g transform={`translate(280 ${560 + (1 - descend) * 300})`} opacity={ease(p(tAn, tAn + 0.06))}>
              <rect x={-34} y={-34} width={68} height={68} fill="rgba(217,164,65,0.3)" stroke={C.amber} strokeWidth={4} rx={6} />
              <text x={0} y={10} textAnchor="middle" fill={C.amber} fontSize={22} fontFamily='"Be Vietnam Pro"'>文帝</text>
            </g>
            <g transform={`translate(360 ${580 + (1 - descend) * 300})`} opacity={ease(p(tNgoc, tNgoc + 0.06))}>
              <circle cx={0} cy={0} r={26} fill="rgba(127,209,200,0.25)" stroke={C.teal} strokeWidth={4} />
              <circle cx={0} cy={0} r={12} fill={C.teal} opacity={0.6} />
            </g>
          </svg>
          <div style={{ maxWidth: 760 }}>
            <SpringPop startFrac={tDate} from={0.84}>
              <div
                style={{
                  fontFamily: FONT.mono,
                  fontWeight: 700,
                  fontSize: 44,
                  color: C.white,
                  border: `2px solid ${C.cream}`,
                  borderRadius: 8,
                  padding: "14px 28px",
                  background: "rgba(36,31,26,0.92)",
                }}
              >
                6/1983 (lăng Triệu Mội)
              </div>
              <div style={{ fontFamily: FONT.body, fontSize: 30, color: C.cream, marginTop: 14 }}>
                đồi Tượng Cương, Quảng Châu — cháu nội Triệu Đà
              </div>
            </SpringPop>
            <div style={{ marginTop: 40 }}>
              <Reveal startFrac={tAn} endFrac={tAn + 0.1}>
                <div style={{ fontFamily: FONT.display, fontWeight: 700, fontSize: 44, color: C.amber }}>
                  ấn vàng «Văn Đế hành tỷ»
                </div>
              </Reveal>
              <Reveal startFrac={tNgoc} endFrac={tNgoc + 0.1}>
                <div style={{ fontFamily: FONT.display, fontWeight: 700, fontSize: 44, color: C.teal, marginTop: 16 }}>
                  + bộ áo chôn bằng ngọc
                </div>
              </Reveal>
            </div>
          </div>
        </div>
      </AbsoluteFill>
      <SourceTag text="Con triện vương đế thật — của một triều đình thật" bottom={40} right />
    </Paper>
  );
};

// === sc049 === PHIẾU KIỂM KÊ TRIỀU ĐÌNH — items slide + đóng dấu 'có thật'
export const Sc049: React.FC<SceneProps> = ({ durationInFrames }) => {
  const A = useA();
  const tKinh = A("kinh", 1); // «Họ có kinh đô»
  const tTrieu = A("triện", 1); // «có triện»
  const tLang = A("lăng", 2); // «có lăng»
  const tNgoc = A("ngọc", 2); // «có ngọc»
  const tKet = A("đào", 1); // «nó tự đào lên được kẻ trong truyện»
  const { p } = useFrac(durationInFrames);
  const items = [
    { t: tKinh, label: "kinh đô" },
    { t: tTrieu, label: "triện vàng" },
    { t: tLang, label: "lăng mộ" },
    { t: tNgoc, label: "áo ngọc" },
  ];
  return (
    <Paper>
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
        <div style={{ fontFamily: FONT.mono, fontSize: 30, letterSpacing: 4, color: C.cream, marginBottom: 30 }}>
          PHIẾU KIỂM KÊ — HỒ SƠ SỬ HÁN
        </div>
        {items.map((it, i) => (
          <div key={i} style={{ position: "relative", width: 900, marginBottom: 22 }}>
            <Reveal startFrac={it.t} endFrac={it.t + 0.06} dy={30}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  border: `2px solid ${C.cream}`,
                  borderRadius: 8,
                  background: "rgba(36,31,26,0.93)",
                  padding: "18px 34px",
                  fontFamily: FONT.display,
                  fontWeight: 700,
                  fontSize: 42,
                  color: C.white,
                }}
              >
                <span>{i + 1}. {it.label}</span>
                <span
                  style={{
                    fontFamily: FONT.mono,
                    fontSize: 30,
                    color: C.amber,
                    border: `3px solid ${C.amber}`,
                    borderRadius: 6,
                    padding: "4px 18px",
                    transform: `rotate(${(i % 2 ? 6 : -5)}deg) scale(${ease(p(it.t + 0.03, it.t + 0.09))})`,
                    opacity: ease(p(it.t + 0.03, it.t + 0.08)),
                  }}
                >
                  CÓ THẬT
                </span>
              </div>
            </Reveal>
          </div>
        ))}
        <Reveal startFrac={tKet} endFrac={tKet + 0.12}>
          <div style={{ fontFamily: FONT.display, fontWeight: 700, fontSize: 46, color: C.amber, marginTop: 26 }}>
            «Khảo cổ không cần đọc truyện — nó tự đào lên được kẻ trong truyện»
          </div>
        </Reveal>
      </AbsoluteFill>
      <SourceTag text="Đủ để đối chiếu từng món đồ của một triều đình thật" bottom={40} right />
    </Paper>
  );
};

// === sc050 === CÁCH DÙNG CHỮ — trang Sử ký, chọn 'mưu kế', gạch mờ 2 từ khác
export const Sc050: React.FC<SceneProps> = ({ durationInFrames }) => {
  const A = useA();
  const tDai = A("đại", 1); // «Không phải 'đại phá'»
  const tTan = A("tàn", 1); // «Không phải 'tàn sát'»
  const tMuu = A("mưu", 1); // «mưu kế, quà cáp, ngoại giao»
  const { p } = useFrac(durationInFrames);
  return (
    <Paper variant="museum">
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
        {/* trang Sử ký */}
        <div
          style={{
            width: 1300,
            border: `3px solid ${C.cream}`,
            borderRadius: 6,
            background: "rgba(232,220,200,0.05)",
            padding: "60px 90px",
            position: "relative",
          }}
        >
          <div style={{ fontFamily: FONT.mono, fontSize: 28, color: C.cream, letterSpacing: 3, marginBottom: 36, opacity: 0.8 }}>
            SỬ KÝ — trang viết về Âu Lạc
          </div>
          {/* hai cụm bị gạch mờ */}
          <div style={{ display: "flex", gap: 60, marginBottom: 46 }}>
            {[
              { t: tDai, text: "đại phá" },
              { t: tTan, text: "tàn sát" },
            ].map((w, i) => (
              <div key={i} style={{ position: "relative", fontFamily: FONT.display, fontWeight: 700, fontSize: 56, color: C.cream, opacity: 0.55 }}>
                {w.text}
                <div
                  style={{
                    position: "absolute",
                    left: -10,
                    right: -10,
                    top: "50%",
                    height: 9,
                    background: C.warn,
                    transform: `scaleX(${ease(p(w.t + 0.02, w.t + 0.1))})`,
                    transformOrigin: "left",
                    borderRadius: 4,
                  }}
                />
              </div>
            ))}
          </div>
          {/* ba cụm được chọn — mưu kế đứng đầu đánh dấu */}
          <div style={{ display: "flex", gap: 44, alignItems: "baseline" }}>
            {["mưu kế", "quà cáp", "ngoại giao"].map((w, i) => (
              <div key={i} style={{ position: "relative" }}>
                <SpringPop startFrac={tMuu + i * 0.03} from={0.82}>
                  <div
                    style={{
                      fontFamily: FONT.display,
                      fontWeight: 800,
                      fontSize: i === 0 ? 68 : 54,
                      color: i === 0 ? C.amber : C.cream,
                    }}
                  >
                    {w}
                  </div>
                </SpringPop>
                {i === 0 && (
                  <div style={{ position: "absolute", left: "50%", bottom: -26, transform: "translateX(-50%)", fontFamily: FONT.mono, fontSize: 26, color: C.amber, opacity: ease(p(tMuu + 0.06, tMuu + 0.14)), whiteSpace: "nowrap" }}>
                    ▲ chữ đứng đầu
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
        <Reveal startFrac={tMuu + 0.1} endFrac={tMuu + 0.18}>
          <div style={{ fontFamily: FONT.body, fontSize: 36, color: C.cream, marginTop: 40 }}>
            Ba phương thức — dùng chữ của chính bên thắng cuộc
          </div>
        </Reveal>
      </AbsoluteFill>
      <SourceTag text="Đọc kỹ cách dùng chữ — đó là điều gây sốc nhất của tối nay" bottom={40} right />
    </Paper>
  );
};
