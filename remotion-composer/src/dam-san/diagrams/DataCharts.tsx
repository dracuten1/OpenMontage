import React from "react";
import { Easing, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { C, FONT } from "../theme";
import { clampX } from "../common";

export const D03TextualStratigraphy: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const rows = [
    { yr: "1927 / 1933", who: "L. Sabatier (Paris & BEFEO)", n: 2, label: "2 cuộc chiến (cắt bỏ các đoạn lặp lại)", color: C.redLight },
    { yr: "1985 – 1987", who: "GS. Phan Đăng Nhật", n: 6, label: "6 tù trưởng (khôi phục văn bản)", color: C.copper },
    { yr: "2002 / 2006", who: "Đỗ Hồng Kỳ & Y Wơn Kna (Y Nuh Niê)", n: 8, label: "8 đối thủ / 7 cuộc chiến giành vợ", color: C.gold },
  ];
  return (
    <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 22 }}>
      <div style={{ fontFamily: FONT.mono, fontSize: 18, color: C.inkSoft, letterSpacing: 1.2 }}>
        ĐỊA TẦNG VĂN BẢN SỬ THI ĐĂM SĂN (ĐHSP HÀ NỘI · NGUYỄN HỮU THẤU · ĐỖ HỒNG KỲ)
      </div>
      {rows.map((r, i) => {
        const w = interpolate(frame, [i * 8, i * 8 + 28], [0, r.n / 8], { ...clampX, easing: Easing.out(Easing.cubic) });
        const op = spring({ frame: Math.max(0, frame - i * 8), fps, config: { damping: 18 }, from: 0, to: 1, durationInFrames: 18 });
        return (
          <div key={r.yr} style={{ opacity: op, background: C.bg, padding: "18px 24px", borderLeft: `5px solid ${r.color}` }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
              <span style={{ fontFamily: FONT.display, fontSize: 27, color: C.white, fontWeight: 700 }}>{r.who}</span>
              <span style={{ fontFamily: FONT.mono, fontSize: 19, color: r.color }}>{r.yr}</span>
            </div>
            <div style={{ marginTop: 12, height: 22, background: "#2E251F", position: "relative" }}>
              <div style={{ height: "100%", width: `${Math.round(w * 100)}%`, background: r.color }} />
            </div>
            <div style={{ marginTop: 10, fontFamily: FONT.body, fontSize: 21, color: C.cream }}>{r.label}</div>
          </div>
        );
      })}
    </div>
  );
};

export const D09PopulationSplit: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = spring({ frame, fps, config: { damping: 18 }, from: 0, to: 1, durationInFrames: 22 });
  return (
    <div style={{ opacity: p, width: "100%", display: "flex", flexDirection: "column", gap: 22 }}>
      <div style={{ fontFamily: FONT.mono, fontSize: 18, color: C.inkSoft }}>
        DÂN SỐ DÂN TỘC Ê ĐÊ — TÁCH BẠCH HAI MỐC ĐIỀU TRA CHÍNH THỨC (KHÔNG GỘP NGUỒN)
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1.15fr 1fr", gap: 28 }}>
        <div style={{ background: C.bg, borderTop: `6px solid ${C.gold}`, padding: "28px 30px" }}>
          <div style={{ fontFamily: FONT.mono, fontSize: 18, color: C.gold }}>ĐIỀU TRA 53 DTTS · 1/4/2019 (NHÂN DÂN)</div>
          <div style={{ fontFamily: FONT.mono, fontSize: 56, fontWeight: 700, color: C.white, marginTop: 10 }}>398.671 người</div>
          <div style={{ fontFamily: FONT.body, fontSize: 22, color: C.cream, marginTop: 14, lineHeight: 1.5 }}>
            • Nam: <strong>195.351</strong> · Nữ: <strong>203.320</strong>
            <br />• Cư trú vùng nông thôn: <strong>88,9%</strong>
          </div>
        </div>
        <div style={{ background: C.bg, borderTop: `6px solid ${C.tealLight}`, padding: "28px 30px" }}>
          <div style={{ fontFamily: FONT.mono, fontSize: 18, color: C.tealLight }}>TỔNG ĐIỀU TRA 2009 (PHÂN TỈNH RÕ)</div>
          <div style={{ fontFamily: FONT.mono, fontSize: 50, fontWeight: 700, color: C.white, marginTop: 10 }}>331.194 toàn quốc</div>
          <div style={{ fontFamily: FONT.body, fontSize: 22, color: C.cream, marginTop: 14, lineHeight: 1.5 }}>
            • Riêng tại Đắk Lắk (2009): <strong>298.534 người</strong> (chiếm <strong>90,1%</strong> tổng dân số Ê Đê lúc đó).
          </div>
        </div>
      </div>
    </div>
  );
};

export const D10KhoTangTreemap: React.FC = () => {
  const frame = useCurrentFrame();
  const data = [
    { name: "Ba Na", count: 30, color: C.teal },
    { name: "Mơ Nông", count: 26, color: C.copper },
    { name: "Ê Đê", count: 10, color: C.gold },
    { name: "Xơ Đăng", count: 4, color: C.red },
    { name: "Raglai", count: 3, color: C.tealLight },
    { name: "Chăm", count: 2, color: C.border },
  ];
  return (
    <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 18 }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontFamily: FONT.mono, fontSize: 18, color: C.inkSoft }}>
        <span>KHO TÀNG SỬ THI TÂY NGUYÊN (2001–2007)</span>
        <span>388 NGHỆ NHÂN · ~5.700 BĂNG 90 PHÚT · 801 TÁC PHẨM · 75 TÁC PHẨM IN / 62 TẬP</span>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {data.map((d, idx) => {
          const w = interpolate(frame, [idx * 5, idx * 5 + 24], [0, d.count / 30], { ...clampX, easing: Easing.out(Easing.cubic) });
          return (
            <div key={d.name} style={{ display: "grid", gridTemplateColumns: "150px 1fr 110px", gap: 18, alignItems: "center" }}>
              <div style={{ fontFamily: FONT.display, fontSize: 24, fontWeight: 700, color: d.name === "Ê Đê" ? C.red : C.ink }}>
                {d.name}
              </div>
              <div style={{ height: 34, background: "#DFD3BC" }}>
                <div style={{ height: "100%", width: `${Math.round(w * 100)}%`, background: d.color }} />
              </div>
              <div style={{ fontFamily: FONT.mono, fontSize: 22, fontWeight: 700, color: C.ink, textAlign: "right" }}>
                {d.count} / 75
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export const D11SurveyParadox: React.FC = () => {
  const frame = useCurrentFrame();
  const loveW = interpolate(frame, [4, 30], [0, 97], { ...clampX, easing: Easing.out(Easing.cubic) });
  const gapW = interpolate(frame, [12, 38], [0, 62.1], { ...clampX, easing: Easing.out(Easing.cubic) });
  const classW = interpolate(frame, [20, 44], [0, 80], { ...clampX, easing: Easing.out(Easing.cubic) });
  return (
    <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 22 }}>
      <div style={{ fontFamily: FONT.mono, fontSize: 18, color: C.inkSoft }}>
        KHẢO SÁT CẤP BỘ NĂM 2007 (VIỆN KHXH VN · GS. PHAN ĐĂNG NHẬT)
      </div>
      {[
        { label: "Yêu thích sử thi (37% thích + 60% rất thích · 2% không thích)", pct: "97%", w: loveW, color: C.tealLight },
        { label: "Thiếu hiểu biết thực tế (8,8% không biết gì + 53,3% hiểu rất ít)", pct: "62,1%", w: gapW, color: C.redLight },
        { label: "Tán thành & tự nguyện tham gia lớp dạy sử thi tại buôn, plây", pct: "80%", w: classW, color: C.gold },
      ].map((item) => (
        <div key={item.pct} style={{ background: C.bg, padding: "20px 26px", borderLeft: `5px solid ${item.color}` }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
            <span style={{ fontFamily: FONT.body, fontSize: 22, color: C.white }}>{item.label}</span>
            <span style={{ fontFamily: FONT.mono, fontSize: 32, fontWeight: 700, color: item.color }}>{item.pct}</span>
          </div>
          <div style={{ marginTop: 12, height: 18, background: "#2E251F" }}>
            <div style={{ height: "100%", width: `${item.w.toFixed(1)}%`, background: item.color }} />
          </div>
        </div>
      ))}
    </div>
  );
};

export const D12HeritageTimeline: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const milestones = [
    { yr: "1927–1933", desc: "L. Sabatier in bản Pháp–Ê Đê đầu tiên (Paris / BEFEO Tập 33)" },
    { yr: "2001–2007", desc: "Kho tàng sử thi Tây Nguyên: 388 nghệ nhân, ~5.700 băng, 75 tác phẩm / 62 tập" },
    { yr: "2005 / 2008", desc: "UNESCO công bố & ghi danh Không gian Cồng chiêng Tây Nguyên (17 cộng đồng)" },
    { yr: "19/12/2014", desc: "QĐ 4205/QĐ-BVHTTDL: Khan Ê Đê là Di sản VH phi vật thể Quốc gia" },
    { yr: "22/6/2023", desc: "Đắk Lắk mở lớp truyền dạy khan tại Ea Tul (20 hv) & klei duê tại Cuôr Đăng (22 hv)" },
    { yr: "Hiện tại", desc: "17 buôn phục dựng nhà dài du lịch & nghệ nhân Ama Nhiên (Akô Dhông) dịch song ngữ" },
  ];
  return (
    <div style={{ width: "100%", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
      {milestones.map((m, i) => {
        const p = spring({ frame: Math.max(0, frame - i * 5), fps, config: { damping: 18 }, from: 0, to: 1, durationInFrames: 18 });
        return (
          <div key={m.yr} style={{ opacity: p, background: C.bg, padding: "18px 22px", borderLeft: `4px solid ${i >= 3 ? C.gold : C.tealLight}` }}>
            <div style={{ fontFamily: FONT.mono, fontSize: 19, fontWeight: 700, color: i >= 3 ? C.gold : C.tealLight }}>{m.yr}</div>
            <div style={{ fontFamily: FONT.body, fontSize: 20, color: C.cream, marginTop: 6, lineHeight: 1.4 }}>{m.desc}</div>
          </div>
        );
      })}
    </div>
  );
};
