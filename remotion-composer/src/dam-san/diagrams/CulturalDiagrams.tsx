import React from "react";
import { Easing, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { C, FONT } from "../theme";
import { clampX } from "../common";

export const D01Season3Callback: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s1 = spring({ frame, fps, config: { damping: 18 }, from: 0, to: 1, durationInFrames: 22 });
  const s2 = spring({ frame: Math.max(0, frame - 12), fps, config: { damping: 18 }, from: 0, to: 1, durationInFrames: 24 });
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 36, alignItems: "stretch", width: "100%" }}>
      <div
        style={{
          opacity: s1,
          transform: `translateY(${interpolate(s1, [0, 1], [18, 0])}px)`,
          background: `${C.bg}F0`,
          borderLeft: `6px solid ${C.tealLight}`,
          padding: "28px 30px",
          display: "flex",
          flexDirection: "column",
          gap: 14,
        }}
      >
        <div style={{ fontFamily: FONT.mono, fontSize: 18, color: C.tealLight, letterSpacing: 1.5 }}>
          S3E01 · MIỀN NÚI PHÍA BẮC
        </div>
        <div style={{ fontFamily: FONT.display, fontSize: 34, color: C.white, fontWeight: 700 }}>
          Người Mường — «Đẻ đất đẻ nước»
        </div>
        <div style={{ fontFamily: FONT.body, fontSize: 22, color: C.cream, lineHeight: 1.45 }}>
          Ngữ hệ <strong>Nam Á</strong> (nhánh Việt – Mường) · Diễn xướng nghi lễ mo tang ma 5 phần · 8.000–16.000 câu.
        </div>
      </div>

      <div
        style={{
          opacity: s2,
          transform: `translateY(${interpolate(s2, [0, 1], [18, 0])}px)`,
          background: `${C.bg}F0`,
          borderLeft: `6px solid ${C.gold}`,
          padding: "28px 30px",
          display: "flex",
          flexDirection: "column",
          gap: 14,
        }}
      >
        <div style={{ fontFamily: FONT.mono, fontSize: 18, color: C.gold, letterSpacing: 1.5 }}>
          S3E02 · CAO NGUYÊN TÂY NGUYÊN
        </div>
        <div style={{ fontFamily: FONT.display, fontSize: 34, color: C.white, fontWeight: 700 }}>
          Người Ê Đê — «Klei Khan Y Đam San»
        </div>
        <div style={{ fontFamily: FONT.body, fontSize: 22, color: C.cream, lineHeight: 1.45 }}>
          Ngữ hệ <strong>Nam Đảo</strong> (Highlands Chamic) · Hát kể <em>khan</em> bên bếp lửa nhà dài · 2.077 câu (bản in) / 7 cuộc chiến.
        </div>
      </div>
    </div>
  );
};

export const D02ThreeActs: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const acts = [
    { num: "01", title: "Cưỡng hôn Chuê Nuê", desc: "Lấy H'Nhị & H'Bhị theo luật mẫu hệ; chống cự bằng đánh quay đến khi Yàng răn dạy.", color: C.tealLight },
    { num: "02", title: "Chinh chiến & Cây Smuk", desc: "Hạ Mtao Grứ, Mtao Mxây; chặt cây thần Smuk/Ktu khiến hai vợ chết rồi lên Trời cứu về.", color: C.gold },
    { num: "03", title: "Rừng Sáp Đen & Mặt Trời", desc: "Cầu hôn Nữ thần Mặt Trời thất bại, chết chìm trong sáp chảy, hóa ruồi nhập H'Âng.", color: C.redLight },
  ];
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 22, width: "100%" }}>
      <div style={{ fontFamily: FONT.mono, fontSize: 18, color: C.inkSoft, letterSpacing: 1.4 }}>
        CẤU TRÚC 3 CHẶNG SỬ THI KLEI KHAN Y ĐAM SAN (2.077 CÂU PHỔ THÔNG)
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 26 }}>
        {acts.map((a, i) => {
          const p = spring({ frame: Math.max(0, frame - i * 8), fps, config: { damping: 18 }, from: 0, to: 1, durationInFrames: 22 });
          return (
            <div
              key={a.num}
              style={{
                opacity: p,
                transform: `translateY(${interpolate(p, [0, 1], [16, 0])}px)`,
                background: C.bg,
                borderTop: `6px solid ${a.color}`,
                padding: "24px 24px 28px",
                color: C.white,
              }}
            >
              <div style={{ fontFamily: FONT.mono, fontSize: 28, fontWeight: 700, color: a.color }}>{a.num}</div>
              <div style={{ fontFamily: FONT.display, fontSize: 29, fontWeight: 700, marginTop: 8 }}>{a.title}</div>
              <div style={{ fontFamily: FONT.body, fontSize: 20, lineHeight: 1.45, color: C.cream, marginTop: 12 }}>{a.desc}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export const D04DualReadings: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = spring({ frame, fps, config: { damping: 18 }, from: 0, to: 1, durationInFrames: 24 });
  return (
    <div style={{ opacity: p, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 32, width: "100%" }}>
      <div style={{ background: C.bg, borderLeft: `6px solid ${C.redLight}`, padding: "28px 30px" }}>
        <div style={{ fontFamily: FONT.mono, fontSize: 18, color: C.redLight }}>CÁCH ĐỌC 1 · GIỚI HẠN THIẾT CHẾ</div>
        <div style={{ fontFamily: FONT.display, fontSize: 32, color: C.white, fontWeight: 700, marginTop: 10 }}>
          Va chạm với Tự nhiên & Cộng đồng
        </div>
        <div style={{ fontFamily: FONT.body, fontSize: 22, color: C.cream, lineHeight: 1.5, marginTop: 14 }}>
          Khi Đăm Săn vượt khỏi ranh giới bảo vệ buôn làng và liên minh dòng họ để tìm cuộc hôn nhân siêu phàm, sức nóng Mặt Trời nhắc lại trật tự không thể phá vỡ của vạn vật.
        </div>
      </div>

      <div style={{ background: C.bg, borderLeft: `6px solid ${C.gold}`, padding: "28px 30px" }}>
        <div style={{ fontFamily: FONT.mono, fontSize: 18, color: C.gold }}>CÁCH ĐỌC 2 · LINH NGA NIÊ KDĂM</div>
        <div style={{ fontFamily: FONT.display, fontSize: 32, color: C.white, fontWeight: 700, marginTop: 10 }}>
          Khát vọng Đem Ánh Sáng Về Buôn Làng
        </div>
        <div style={{ fontFamily: FONT.body, fontSize: 22, color: C.cream, lineHeight: 1.5, marginTop: 14 }}>
          «Không phải bắt Nữ thần Mặt Trời là phản kháng chế độ mẫu hệ, mà cho rằng Đăm Săn khát vọng lớn hơn, kiêu hãnh hơn: muốn là người đem ánh sáng về với buôn làng.»
        </div>
      </div>
    </div>
  );
};

export const D05MatrilinealChueNue: React.FC = () => {
  const frame = useCurrentFrame();
  const draw = interpolate(frame, [8, 42], [0, 1], { ...clampX, easing: Easing.out(Easing.cubic) });
  return (
    <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 18 }}>
      <div style={{ fontFamily: FONT.mono, fontSize: 18, color: C.inkSoft, letterSpacing: 1.2 }}>
        THIẾT CHẾ MẪU HỆ & TỤC NỐI DÒNG CHUÊ NUÊ (HAI HỆ DÒNG NIÊ — MLÔ)
      </div>
      <svg viewBox="0 0 1240 390" style={{ width: "100%", height: 390 }}>
        <rect x="20" y="30" width="380" height="170" fill={C.bg} stroke={C.gold} strokeWidth="3" />
        <text x="48" y="80" fill={C.gold} fontFamily={FONT.mono} fontSize="20">DÒNG HỌ NIÊ</text>
        <text x="48" y="122" fill={C.white} fontFamily={FONT.display} fontSize="28" fontWeight="700">Con mang họ mẹ</text>
        <text x="48" y="160" fill={C.cream} fontFamily={FONT.body} fontSize="18">Con gái út thừa kế & giữ nhà dài</text>

        <rect x="840" y="30" width="380" height="170" fill={C.bg} stroke={C.tealLight} strokeWidth="3" />
        <text x="868" y="80" fill={C.tealLight} fontFamily={FONT.mono} fontSize="20">DÒNG HỌ MLÔ</text>
        <text x="868" y="122" fill={C.white} fontFamily={FONT.display} fontSize="28" fontWeight="700">Trao đổi hôn nhân</text>
        <text x="868" y="160" fill={C.cream} fontFamily={FONT.body} fontSize="18">Chồng ở rể · Pô-pin-ca điều hành</text>

        <path d="M 405 95 C 530 40, 710 40, 835 95" fill="none" stroke={C.red} strokeWidth="5" strokeDasharray="520" strokeDashoffset={520 * (1 - draw)} />
        <path d="M 835 150 C 710 205, 530 205, 405 150" fill="none" stroke={C.gold} strokeWidth="5" strokeDasharray="520" strokeDashoffset={520 * (1 - draw)} />

        <rect x="370" y="232" width="500" height="130" fill={C.bg} stroke={C.redLight} strokeWidth="3" />
        <text x="400" y="276" fill={C.redLight} fontFamily={FONT.mono} fontSize="19">CƠ CHẾ NỐI DÒNG CHUÊ NUÊ</text>
        <text x="400" y="314" fill={C.white} fontFamily={FONT.body} fontSize="20">Khi một người mất, họ phải cử người thay thế</text>
        <text x="400" y="344" fill={C.cream} fontFamily={FONT.body} fontSize="20">«Để sợi dây Niê – Mlô không bị đứt đoạn»</text>
      </svg>
    </div>
  );
};

export const D06LonghouseBlueprint: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = spring({ frame, fps, config: { damping: 18 }, from: 0, to: 1, durationInFrames: 22 });
  return (
    <div style={{ opacity: p, width: "100%", display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontFamily: FONT.mono, fontSize: 18, color: C.inkSoft }}>
        <span>MẶT BẰNG NHÀ DÀI HÌNH THUYỀN Ê ĐÊ</span>
        <span>TRỤC ĐÔNG – TÂY · GẦN BẾN NƯỚC</span>
      </div>
      <svg viewBox="0 0 1280 420" style={{ width: "100%", height: 420 }}>
        {/* Front Dring gah + Twin odd-step stairs */}
        <rect x="20" y="120" width="210" height="180" fill="#2A211B" stroke={C.gold} strokeWidth="3" />
        <text x="44" y="198" fill={C.gold} fontFamily={FONT.mono} fontSize="20">DRING GAH</text>
        <text x="44" y="230" fill={C.cream} fontFamily={FONT.body} fontSize="19">Sân sàn trước</text>
        <rect x="36" y="26" width="176" height="82" fill={C.red} />
        <text x="52" y="60" fill={C.white} fontFamily={FONT.body} fontSize="18">Cầu thang cái</text>
        <text x="52" y="88" fill={C.cream} fontFamily={FONT.mono} fontSize="16">Bầu vú + trăng</text>
        <rect x="36" y="312" width="176" height="82" fill={C.border} />
        <text x="52" y="346" fill={C.white} fontFamily={FONT.body} fontSize="18">Cầu thang đực</text>
        <text x="52" y="374" fill={C.cream} fontFamily={FONT.mono} fontSize="16">Bậc số lẻ (5-7)</text>

        {/* Gah Guest Hall */}
        <rect x="246" y="95" width="490" height="230" fill={C.bg} stroke={C.gold} strokeWidth="3" />
        <text x="272" y="138" fill={C.gold} fontFamily={FONT.mono} fontSize="21">GIAN GAH (PHÍA TRƯỚC)</text>
        <text x="272" y="172" fill={C.white} fontFamily={FONT.body} fontSize="19">Tiếp khách · Sinh hoạt · Đêm kể Khan</text>
        <rect x="272" y="198" width="240" height="44" fill={C.copper} />
        <text x="288" y="227" fill={C.white} fontFamily={FONT.body} fontSize="18">Ghế độc mộc Kpan</text>
        <rect x="272" y="256" width="185" height="48" fill={C.red} />
        <text x="288" y="287" fill={C.white} fontFamily={FONT.body} fontSize="18">Bếp Kpưr gah</text>
        <rect x="476" y="256" width="220" height="48" fill={C.teal} />
        <text x="492" y="287" fill={C.white} fontFamily={FONT.body} fontSize="18">Bộ chiêng & Ché</text>

        {/* Ok Family Quarters */}
        <rect x="752" y="95" width="508" height="230" fill="#222C29" stroke={C.tealLight} strokeWidth="3" />
        <text x="778" y="138" fill={C.tealLight} fontFamily={FONT.mono} fontSize="21">GIAN ÔK (PHÍA SAU)</text>
        <text x="778" y="172" fill={C.white} fontFamily={FONT.body} fontSize="19">Buồng vợ chồng (ngăn phên nứa)</text>
        <text x="778" y="212" fill={C.cream} fontFamily={FONT.body} fontSize="18">• Gian đầu sát sân sau của bà chủ nhà</text>
        <text x="778" y="246" fill={C.cream} fontFamily={FONT.body} fontSize="18">• Con gái út lấy chồng nối dài thêm gian sau</text>
        <text x="778" y="286" fill={C.gold} fontFamily={FONT.mono} fontSize="17">Vách dựng thượng thách – hạ thu</text>
      </svg>
    </div>
  );
};

export const D07ChamicLanguageMap: React.FC = () => {
  const frame = useCurrentFrame();
  const draw = interpolate(frame, [5, 38], [0, 1], { ...clampX, easing: Easing.out(Easing.cubic) });
  return (
    <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ fontFamily: FONT.mono, fontSize: 18, color: C.inkSoft, letterSpacing: 1.2 }}>
        KHẢM NGỮ HỆ TÂY NGUYÊN: NAM ĐẢO (CHAMIC) ĐAN XEN NAM Á (MÔN – KHMER)
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1.1fr 1fr", gap: 28 }}>
        <div style={{ background: C.bg, borderTop: `5px solid ${C.gold}`, padding: "24px 28px" }}>
          <div style={{ fontFamily: FONT.mono, fontSize: 18, color: C.gold }}>NGỮ HỆ NAM ĐẢO (MALAYO-POLYNESIA)</div>
          <div style={{ fontFamily: FONT.display, fontSize: 30, color: C.white, fontWeight: 700, marginTop: 8 }}>
            5 Dân tộc tại Việt Nam
          </div>
          <div style={{ fontFamily: FONT.body, fontSize: 22, color: C.cream, marginTop: 12, lineHeight: 1.5 }}>
            <strong>Ê Đê · Gia Rai · Chăm · Chu Ru · Raglai</strong>
            <br />
            Tổ tiên Chamic đến duyên hải VN <strong>trước 600 TCN</strong> (Thurgood 1999), nhánh cao nguyên giao thoa sâu với Môn – Khmer.
          </div>
        </div>

        <div style={{ background: C.bg, borderTop: `5px solid ${C.tealLight}`, padding: "24px 28px" }}>
          <div style={{ fontFamily: FONT.mono, fontSize: 18, color: C.tealLight }}>NGỮ HỆ NAM Á (AUSTROASIATIC)</div>
          <div style={{ fontFamily: FONT.display, fontSize: 30, color: C.white, fontWeight: 700, marginTop: 8 }}>
            21 Dân tộc Môn–Khmer & Việt–Mường
          </div>
          <div style={{ fontFamily: FONT.body, fontSize: 22, color: C.cream, marginTop: 12, lineHeight: 1.5 }}>
            Trên Tây Nguyên: <strong>Ba Na · Mnông · Xơ Đăng · Cơ Ho · Mạ · Giẻ Triêng...</strong>
            <br />
            Đối chiếu S3E01: người Mường nói nhánh Việt – Mường (Nam Á).
          </div>
        </div>
      </div>
      <div style={{ height: 6, width: `${Math.round(draw * 100)}%`, background: `linear-gradient(90deg, ${C.gold}, ${C.tealLight})` }} />
    </div>
  );
};

export const D08GongEnsembleChart: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const items = [
    { count: 6, title: "6 Chiêng Bằng", role: "Giai điệu nền", color: C.gold },
    { count: 3, title: "3 Chiêng Núm", role: "Âm trầm cộng hưởng", color: C.copper },
    { count: 1, title: "1 Chiêng Giữ Nhịp", role: "Khóa phách lễ hội", color: C.tealLight },
    { count: 1, title: "1 Trống Cái Mặt Da", role: "Dẫn xung lực nghi lễ", color: C.redLight },
  ];
  return (
    <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 18 }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontFamily: FONT.mono, fontSize: 18, color: C.inkSoft }}>
        <span>DÀN CỒNG CHIÊNG Ê ĐÊ CHUẨN (BÁO NHÂN DÂN)</span>
        <span>UNESCO 2005 / GHI DANH 2008 · 17 CỘNG ĐỒNG NAM Á & NAM ĐẢO</span>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 20 }}>
        {items.map((it, idx) => {
          const p = spring({ frame: Math.max(0, frame - idx * 6), fps, config: { damping: 18 }, from: 0, to: 1, durationInFrames: 20 });
          return (
            <div key={it.title} style={{ opacity: p, background: C.bg, borderBottom: `5px solid ${it.color}`, padding: "22px 20px" }}>
              <div style={{ fontFamily: FONT.mono, fontSize: 44, fontWeight: 700, color: it.color }}>{it.count}</div>
              <div style={{ fontFamily: FONT.display, fontSize: 25, color: C.white, fontWeight: 700, marginTop: 6 }}>{it.title}</div>
              <div style={{ fontFamily: FONT.body, fontSize: 19, color: C.cream, marginTop: 8 }}>{it.role}</div>
            </div>
          );
        })}
      </div>
      <div style={{ background: C.bg, padding: "18px 24px", borderLeft: `5px solid ${C.gold}`, color: C.cream, fontFamily: FONT.body, fontSize: 21 }}>
        Đêm kể <strong>khan</strong> dùng lối ngâm hai nốt trầm bổng theo lời nói vần (<em>klei duê</em>), kết hợp tiếng kèn tre <em>đing tut</em>.
      </div>
    </div>
  );
};
