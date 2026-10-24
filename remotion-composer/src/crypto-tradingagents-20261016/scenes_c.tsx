// scenes_c.tsx — s07 (SOLANA · BA MỐC), s08 (BIẾN ĐỘNG LỚN), s09 (LƯU CHECKLIST).
import React from "react";
import { frameOf } from "./timing";
import { C } from "./theme";
import { Chip, CondRow, Disc, HTitle, Lane, ObsRow, Reveal, RV, SceneShell, Status } from "./common";

// ---- s07: three scenario lanes; full recovery condition = 2 sessions holding
// 109,40–110,10 + MACD histogram narrowing/positive + RSI > 50.
export const S07: React.FC = () => {
  const F = (p: string, o = 1) => frameOf("s07", p, o);
  return (
    <SceneShell tag="ĐÓNG CỬA 15/10" layer="KỊCH BẢN">
      <HTitle text="SOLANA · BA MỐC" />
      <Lane at={F("Hồi kỹ thuật")} y={390} h={320} tone={C.blue}
        chip={<Chip tone={C.blue}><RV at={F("Hồi kỹ thuật")} style={{ marginRight: 10 }}>HỒI</RV><RV at={F("hội tụ")}>· HỘI TỤ EMA10/SMA50</RV></Chip>}>
        <div style={{ position: "absolute", left: 58, right: 32, top: 100, fontSize: 60, fontWeight: 800, color: C.text, fontVariantNumeric: "tabular-nums" }}>
          <RV at={F("một trăm lẻ chín")}>109,00–110,10</RV>
        </div>
      </Lane>
      <Lane at={F("Đóng cửa thủng")} y={740} h={320} tone={C.red}
        chip={<Chip tone={C.red}>ĐÓNG CỬA NGÀY THỦNG <RV at={F("một trăm lẻ ba")}>103,46</RV></Chip>}>
        <CondRow at={F("rủi ro")} top={100} tone={C.red} size={40}>
          <RV at={F("rủi ro")} style={{ marginRight: 10 }}>RỦI RO VỀ</RV><RV at={F("tám mươi bảy")}>87,13</RV>
        </CondRow>
        <CondRow at={F("giảm thêm")} top={178} tone={C.red} size={40}>−16,3% TỪ GIÁ HIỆN TẠI</CondRow>
      </Lane>
      <Lane at={F("Hai phiên")} y={1090} h={320} tone={C.green} chip={<Chip tone={C.green}>HAI PHIÊN ĐÓNG GIỮ TRÊN VÙNG</Chip>}>
        <div style={{ position: "absolute", left: 58, right: 32, top: 92, fontSize: 56, fontWeight: 800, color: C.text, fontVariantNumeric: "tabular-nums" }}>
          <RV at={F("một trăm lẻ chín phẩy bốn")}>109,40–110,10</RV>
        </div>
        <CondRow at={F("cột MACD")} top={178} tone={C.green}>MACD HISTOGRAM THU HẸP / DƯƠNG</CondRow>
        <CondRow at={F("RSI")} top={236} tone={C.green}>
          <RV at={F("RSI")} style={{ marginRight: 10 }}>RSI &gt; 50</RV><RV at={F("mới đủ điều kiện")}>· MỚI XEM XÉT GIỮ</RV>
        </CondRow>
      </Lane>
    </SceneShell>
  );
};

// ---- s08: shared view + ATR (= BIÊN ĐỘ THỰC TRUNG BÌNH NGÀY) reference rows.
const AtrRow: React.FC<{ at: number; atVal: number; y: number; name: string; value: string }> = ({
  at, atVal, y, name, value,
}) => (
  <ObsRow at={at} y={y} h={130} label={name} tone={C.text} labelSize={40} labelTone={C.muted}
    value={<RV at={atVal}>{value}</RV>} valueSize={62} />
);

export const S08: React.FC = () => {
  const F = (p: string, o = 1) => frameOf("s08", p, o);
  return (
    <SceneShell tag="NẾN NGÀY 15/10" layer="NHẬN ĐỊNH">
      <HTitle text="BIẾN ĐỘNG LỚN" />
      <Reveal
        at={F("Cả ba")}
        style={{
          left: 68, top: 390, width: 912, height: 190, background: C.surface,
          border: `1px solid ${C.line}`, borderRadius: 16, boxSizing: "border-box",
          padding: "28px 36px", display: "flex", flexDirection: "column", justifyContent: "center", gap: 14,
        }}
      >
        <div style={{ fontSize: 40, fontWeight: 800, color: C.green }}>CẢ BA VẪN TRÊN SMA200</div>
        <RV at={F("không bán tháo")}>
          <span style={{ display: "block", fontSize: 30, fontWeight: 700, color: C.muted, letterSpacing: 1 }}>
            KHÔNG BÁN THÁO HOẢNG LOẠN
          </span>
        </RV>
      </Reveal>
      <Reveal at={F("Biên độ thực trung bình")} style={{ left: 68, top: 620, fontSize: 44, fontWeight: 800, color: C.blue, letterSpacing: 1 }}>
        BIÊN ĐỘ THỰC TRUNG BÌNH NGÀY
      </Reveal>
      <AtrRow at={F("Bitcoin")} atVal={F("hai nghìn một trăm chín mươi hai")} y={700} name="BITCOIN" value="2.192,49 USD" />
      <AtrRow at={F("Ether")} atVal={F("chín mươi phẩy tám bốn")} y={850} name="ETHER" value="90,84 USD" />
      <AtrRow at={F("Xôlana")} atVal={F("bốn phẩy bảy sáu")} y={1000} name="SOLANA" value="4,76 USD" />
      <Status at={F("Mọi mốc")} tone={C.amber} size={32}>
        <RV at={F("Mọi mốc")} style={{ marginRight: 10 }}>ĐÓNG CỬA NẾN MỚI XÁC NHẬN</RV><RV at={F("Vĩ mô")}>· VĨ MÔ THẬN TRỌNG</RV>
      </Status>
    </SceneShell>
  );
};

// ---- s09: CTA + disclosure, held to end + tail.
const CtaCard: React.FC<{ at: number; y: number; children: React.ReactNode }> = ({ at, y, children }) => (
  <Reveal
    at={at}
    style={{
      left: 68,
      top: y,
      width: 912,
      height: 190,
      background: C.surface,
      border: `1px solid ${C.line}`,
      borderRadius: 16,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      gap: 12,
      boxSizing: "border-box",
      padding: 24,
    }}
  >
    {children}
  </Reveal>
);

export const S09: React.FC = () => {
  const F = (p: string, o = 1) => frameOf("s09", p, o);
  return (
    <SceneShell tag="NẾN NGÀY 15/10" layer="LỜI BIÊN TẬP">
      <HTitle text="LƯU CHECKLIST" />
      <CtaCard at={F("đối chiếu")} y={520}>
        <div style={{ fontSize: 38, fontWeight: 800, color: C.text, textAlign: "center" }}>ĐỐI CHIẾU KHI ĐIỀU KIỆN THAY ĐỔI</div>
      </CtaCard>
      <CtaCard at={F("Crypto")} y={750}>
        <div style={{ fontSize: 42, fontWeight: 800, color: C.amber }}>CRYPTO BIẾN ĐỘNG MẠNH</div>
        <RV at={F("có thể")}>
          <span style={{ display: "block", fontSize: 32, fontWeight: 700, color: C.text }}>CÓ THỂ GÂY MẤT VỐN</span>
        </RV>
      </CtaCard>
      <CtaCard at={F("phân tích")} y={980}>
        <div style={{ fontSize: 42, fontWeight: 800, color: C.blue }}>PHÂN TÍCH CÓ ĐIỀU KIỆN</div>
        <div style={{ fontSize: 32, fontWeight: 700, color: C.text }}>KHÔNG PHẢI KHUYẾN NGHỊ ĐẦU TƯ</div>
      </CtaCard>
      <Disc />
    </SceneShell>
  );
};
