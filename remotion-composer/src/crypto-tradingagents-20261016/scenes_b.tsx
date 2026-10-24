// scenes_b.tsx — s04 (ETHER · ÁP LỰC TRUNG HẠN), s05 (ETHER · BA MỐC), s06 (SOLANA · YẾU, CHƯA QUÁ BÁN).
import React from "react";
import { frameOf } from "./timing";
import { C } from "./theme";
import { Chip, CondRow, HSub, HTitle, Lane, ObsRow, Outcome, RV, SceneShell, Status } from "./common";

// ---- s04: observation ladder, 4 rows + closing.
export const S04: React.FC = () => {
  const F = (p: string, o = 1) => frameOf("s04", p, o);
  return (
    <SceneShell tag="ĐÓNG CỬA 15/10" layer="QUAN SÁT">
      <HTitle text="ETHER · ÁP LỰC TRUNG HẠN" size={54} />
      <HSub at={F("Ether yếu")} tone={C.red}>YẾU HƠN HẲN</HSub>
      <ObsRow at={F("Đóng cửa")} y={390} h={150} label="ĐÓNG CỬA"
        value={<RV at={F("hai nghìn bốn trăm")}>2.418,21 USD</RV>} />
      <ObsRow at={F("Giá sâu dưới")} y={568} h={150} label="DƯỚI BA ĐƯỜNG" tone={C.red} labelSize={34}
        value={<RV at={F("Đường mười ngày")}>EMA10 · SMA50 · VWMA</RV>} valueSize={34} />
      <ObsRow at={F("RSI")} y={746} h={150} label="RSI NGÀY" tone={C.amber}
        value={<><RV at={F("ba mươi bảy")} style={{ marginRight: 10 }}>37,69</RV><RV at={F("gần")}>· GẦN QUÁ BÁN</RV></>} valueSize={42} />
      <ObsRow at={F("Cột MACD")} y={924} h={150} label="MACD HISTOGRAM NGÀY" tone={C.red} labelSize={34}
        value={<RV at={F("ba mươi ba")}>−33,61</RV>} />
      <Status at={F("không bán tháo")} tone={C.green}>KHÔNG BÁN THÁO · TRÊN SMA200 ≈13%</Status>
    </SceneShell>
  );
};

// ---- s05: three scenario lanes.
export const S05: React.FC = () => {
  const F = (p: string, o = 1) => frameOf("s05", p, o);
  return (
    <SceneShell tag="ĐÓNG CỬA 15/10" layer="KỊCH BẢN">
      <HTitle text="ETHER · BA MỐC" />
      <Lane at={F("Hồi")} y={390} h={320} tone={C.blue}
        chip={<Chip tone={C.blue}><RV at={F("Hồi")} style={{ marginRight: 10 }}>HỒI</RV><RV at={F("vùng quan sát")}>· QUAN SÁT</RV></Chip>}>
        <div style={{ position: "absolute", left: 58, right: 32, top: 100, fontSize: 60, fontWeight: 800, color: C.text, fontVariantNumeric: "tabular-nums" }}>
          <RV at={F("hai nghìn bốn trăm")}>2.470–2.520</RV>
        </div>
      </Lane>
      <Lane at={F("Đóng cửa dưới")} y={740} h={320} tone={C.red}
        chip={<Chip tone={C.red}>ĐÓNG CỬA NGÀY DƯỚI <RV at={F("hai nghìn ba trăm")}>2.300</RV></Chip>}>
        <CondRow at={F("rủi ro")} top={100} tone={C.red} size={40}>
          <RV at={F("rủi ro")} style={{ marginRight: 10 }}>RỦI RO VỀ</RV><RV at={F("hai nghìn một trăm bốn mươi")}>2.140,45</RV>
        </CondRow>
        <CondRow at={F("giảm thêm")} top={178} tone={C.red} size={40}>−11–12% TỪ GIÁ HIỆN TẠI</CondRow>
      </Lane>
      <Lane at={F("Đóng cửa vượt")} y={1090} h={320} tone={C.green} chip={<Chip tone={C.green}>ĐÓNG CỬA VƯỢT HỢP LƯU</Chip>}>
        <div style={{ position: "absolute", left: 58, right: 32, top: 92, fontSize: 56, fontWeight: 800, color: C.text, fontVariantNumeric: "tabular-nums" }}>
          <RV at={F("hai nghìn năm trăm")}>2.555,57–2.585,32</RV>
        </div>
        <CondRow at={F("cột MACD")} top={178} tone={C.green}>MACD HISTOGRAM THU HẸP</CondRow>
        <Outcome at={F("mới tạm dừng")} top={232} tone={C.green}>TẠM DỪNG GIẢM TỶ TRỌNG</Outcome>
      </Lane>
    </SceneShell>
  );
};

// ---- s06: observation ladder over mood backdrop.
export const S06: React.FC = () => {
  const F = (p: string, o = 1) => frameOf("s06", p, o);
  return (
    <SceneShell tag="ĐÓNG CỬA 15/10" layer="QUAN SÁT" mood="bg_s06_mood.png">
      <HTitle text="SOLANA · YẾU, CHƯA QUÁ BÁN" size={50} />
      <ObsRow at={F("đỉnh")} y={390} h={200} label={<><RV at={F("đỉnh")} style={{ marginRight: 10 }}>TỪ ĐỈNH</RV><RV at={F("ngày sáu")}>06/10</RV></>}
        tone={C.red} labelSize={38}
        value={<><RV at={F("một trăm hai mươi")} style={{ marginRight: 10 }}>120,79 →</RV><RV at={F("mười ba phẩy tám")}>−13,8%</RV></>} />
      <ObsRow at={F("Đóng cửa")} y={616} h={200} label="ĐÓNG CỬA"
        value={<RV at={F("một trăm lẻ bốn")}>104,07 USD</RV>} />
      <ObsRow at={F("Dưới đường mười ngày")} y={842} h={200} label="DƯỚI EMA10 VÀ SMA50" tone={C.red} labelSize={34}
        value={<RV at={F("Dưới đường mười ngày")}>ÁP LỰC NGẮN HẠN</RV>} valueSize={34} />
      <ObsRow at={F("Bám sát")} y={1068} h={200} label="DẢI DAO ĐỘNG DƯỚI" tone={C.amber} labelSize={34}
        value={<RV at={F("một trăm lẻ ba")}>103,46</RV>} />
      <ObsRow at={F("RSI")} y={1294} h={200} label="RSI NGÀY" tone={C.amber}
        value={<><RV at={F("ba mươi bảy")} style={{ marginRight: 10 }}>37,47</RV><RV at={F("chưa quá bán")}>· CHƯA QUÁ BÁN</RV></>} valueSize={42} />
    </SceneShell>
  );
};
