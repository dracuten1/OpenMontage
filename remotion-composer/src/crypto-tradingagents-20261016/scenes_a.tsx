// scenes_a.tsx — s01 (TÁCH DÒNG), s02 (BITCOIN · BIÊN AN TOÀN MỎNG), s03 (BITCOIN · HAI MỐC).
import React from "react";
import { frameOf } from "./timing";
import { C } from "./theme";
import { Chip, CondRow, Disc, HSub, HTitle, Lane, ObsRow, Outcome, Reveal, RV, SceneShell, Status } from "./common";

// ---- s01: three price lanes; verdicts only after the 2nd name mention.
const PriceLane: React.FC<{
  at: number;
  atVal: number;
  atVerdict: number;
  name: string;
  ticker: string;
  price: string;
  verdict: string;
  tone: string;
  y: number;
}> = ({ at, atVal, atVerdict, name, ticker, price, verdict, tone, y }) => (
  <Reveal
    at={at}
    style={{
      left: 68,
      top: y,
      width: 912,
      height: 240,
      background: C.surface,
      border: `1px solid ${C.line}`,
      borderRadius: 16,
      padding: "28px 36px",
      boxSizing: "border-box",
    }}
  >
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
      <div>
        <div style={{ fontSize: 46, fontWeight: 800, color: C.text }}>{name}</div>
        <div style={{ fontSize: 26, fontWeight: 700, color: C.muted, letterSpacing: 3 }}>{ticker}</div>
      </div>
      <div style={{ fontSize: 58, fontWeight: 800, color: C.text, fontVariantNumeric: "tabular-nums" }}>
        <RV at={atVal}>{price}</RV>
      </div>
    </div>
    <div style={{ marginTop: 18 }}>
      <RV at={atVerdict}>
        <Chip tone={tone}>{verdict}</Chip>
      </RV>
    </div>
  </Reveal>
);

export const S01: React.FC = () => {
  const F = (p: string, o = 1) => frameOf("s01", p, o);
  return (
    <SceneShell tag="ĐÓNG CỬA 15/10" layer="QUAN SÁT" mood="bg_s01_mood.png">
      <Reveal at={F("áp lực ngắn hạn")} style={{ left: 68, top: 176 }}>
        <Chip tone={C.amber}>ÁP LỰC NGẮN HẠN</Chip>
      </Reveal>
      <HTitle text="TÁCH DÒNG" at={F("tách dòng")} y={232} size={68} />
      <PriceLane at={F("Bitcoin")} atVal={F("tám mươi mốt")} atVerdict={F("Bitcoin", 2)}
        name="Bitcoin" ticker="BTC" price="81.562,49 USD" verdict="GIỮ NGUYÊN QUAN SÁT" tone={C.blue} y={430} />
      <PriceLane at={F("Ether")} atVal={F("hai nghìn bốn trăm")} atVerdict={F("Ether", 2)}
        name="Ether" ticker="ETH" price="2.418,21 USD" verdict="GIẢM TỪNG PHẦN" tone={C.amber} y={700} />
      <PriceLane at={F("Xôlana")} atVal={F("một trăm lẻ")} atVerdict={F("Xôlana", 2)}
        name="Solana" ticker="SOL" price="104,07 USD" verdict="GIẢM TỪNG PHẦN" tone={C.amber} y={970} />
      <Status at={F("Vì sao")} tone={C.blue}>VÌ SAO KHÁC HƯỚNG XỬ LÝ?</Status>
      <Disc />
    </SceneShell>
  );
};

// ---- s02: observation ladder, 5 rows.
export const S02: React.FC = () => {
  const F = (p: string, o = 1) => frameOf("s02", p, o);
  return (
    <SceneShell tag="ĐÓNG CỬA 15/10" layer="QUAN SÁT">
      <HTitle text="BITCOIN · BIÊN AN TOÀN MỎNG" size={52} />
      <HSub at={F("cấu trúc dài hạn")} tone={C.green}>GIỮ VÌ CẤU TRÚC DÀI HẠN CÒN NGUYÊN</HSub>
      <ObsRow at={F("Đóng cửa")} y={390} h={130} label="ĐÓNG CỬA"
        value={<RV at={F("tám mươi mốt")}>81.562,49 USD</RV>} />
      <ObsRow at={F("Giá trên")} y={546} h={130} label="TRÊN SMA200" tone={C.green}
        value={<RV at={F("cao hơn")}>≈13%</RV>} />
      <ObsRow at={F("Đường năm mươi ngày")} y={702} h={130} label="SMA50 VẪN TRÊN SMA200" tone={C.green}
        value="CẤU TRÚC DÀI HẠN CÒN NGUYÊN" valueSize={28} labelSize={30} />
      <ObsRow at={F("dưới đường mười ngày")} y={858} h={130} label="DƯỚI EMA10" tone={C.red}
        value={<RV at={F("tám mươi hai nghìn")}>82.942,36</RV>} />
      <ObsRow at={F("RSI")} y={1014} h={130} label="RSI NGÀY" tone={C.amber}
        value={<RV at={F("bốn mươi sáu")}>46,56</RV>} />
      <Status at={F("Và giá")} tone={C.amber}>CÁCH SMA50 CHỈ ≈0,5%</Status>
    </SceneShell>
  );
};

// ---- s03: two scenario lanes (trigger chip -> reference block).
export const S03: React.FC = () => {
  const F = (p: string, o = 1) => frameOf("s03", p, o);
  return (
    <SceneShell tag="ĐÓNG CỬA 15/10" layer="KỊCH BẢN">
      <HTitle text="BITCOIN · HAI MỐC" />
      <Lane at={F("Đóng cửa ngày")} y={390} h={500} tone={C.green} chip={<Chip tone={C.green}>ĐÓNG CỬA NGÀY LẤY LẠI</Chip>}>
        <div style={{ position: "absolute", left: 58, right: 32, top: 88, fontSize: 54, fontWeight: 800, color: C.text, fontVariantNumeric: "tabular-nums" }}>
          <RV at={F("tám mươi hai nghìn")} style={{ marginRight: 14 }}>82.942</RV>
          <RV at={F("vùng tám ba")}>→ GIỮ 83.801–84.049</RV>
        </div>
        <CondRow at={F("khối lượng mở rộng")} top={204} tone={C.green}>KHỐI LƯỢNG MỞ RỘNG</CondRow>
        <CondRow at={F("cột MACD")} top={268} tone={C.green}>MACD HISTOGRAM NGÀY DƯƠNG</CondRow>
        <Outcome at={F("mới xác nhận")} top={372} tone={C.green}>MỚI XÁC NHẬN ĐÀ TĂNG</Outcome>
      </Lane>
      <Reveal at={F("Ngược lại")} style={{ left: 68, top: 906, fontSize: 28, fontWeight: 800, color: C.muted, letterSpacing: 4 }}>
        NGƯỢC LẠI
      </Reveal>
      <Lane at={F("Đóng cửa dưới")} y={948} h={500} tone={C.red} chip={<Chip tone={C.red}>ĐÓNG DƯỚI HỖ TRỢ</Chip>}>
        <div style={{ position: "absolute", left: 58, right: 32, top: 88, fontSize: 54, fontWeight: 800, color: C.text, fontVariantNumeric: "tabular-nums" }}>
          <RV at={F("vùng tám một")}>81.103–81.165</RV>
        </div>
        <CondRow at={F("không lấy lại")} top={204} tone={C.red}>KHÔNG LẤY LẠI Ở PHIÊN KẾ</CondRow>
        <Outcome at={F("rủi ro")} top={372} tone={C.red}>RỦI RO GIẢM SÂU</Outcome>
      </Lane>
    </SceneShell>
  );
};
