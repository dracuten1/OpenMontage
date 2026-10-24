// S2E04 lieu-hanh — scenes group "a" (sc001–sc008).
// Speech-lock: A("cụm từ") trả frac theo scene; mọi beat bắn đúng nhịp đọc.
// Anchor phrases verified against narration-words.json (compose worker sweep).
import * as React from "react";
import { Chip, InkPanel, QuoteSlate, Reveal, SceneTitle, useA, useFrac, ease } from "./common";
import { C, FONT, SceneProps } from "./theme";
import { Caption } from "./common";

/** sc001 (s01) — MỞ TẬP: ngưỡng cửa đền tháng Ba, ba nén hương + quote C12. */
export const Sc001: React.FC<SceneProps> = () => {
  const A = useA();
  const fDate = A("ngày ba tháng ba");
  const fGrat = A("biết ơn");
  return (
    <InkPanel img="img-001" focus={{ x: 0.5, y: 0.45 }}>
      <Reveal startFrac={A("hàng năm")} style={{ position: "absolute", top: 76, left: 96 }}>
        <Chip color={C.tealLight}>HỘI PHỦ DẦY · HÀNG NĂM</Chip>
      </Reveal>
      <Reveal startFrac={fDate} style={{ position: "absolute", top: 150, left: 96 }}>
        <div style={{ fontFamily: FONT.display, fontWeight: 800, fontSize: 96, color: C.white }}>
          3 · tháng 3 · âm lịch
        </div>
      </Reveal>
      <Reveal startFrac={A("thắp hương")} style={{ position: "absolute", top: 300, left: 96, maxWidth: 700 }}>
        <QuoteSlate
          text="Ghi chép về lễ hội cho biết Hội Phủ Dầy được tổ chức hàng năm vào ngày ba tháng ba âm lịch."
          startFrac={0.1}
          endFrac={0.55}
          source="vi.wiki Phủ Dầy (C12)"
          size={40}
          maxWidth={640}
        />
      </Reveal>
      <Reveal startFrac={fGrat} style={{ position: "absolute", bottom: 220, left: 96 }}>
        <Chip color={C.amber}>THÁNH MẪU LIỄU HẠNH — THẮP HƯƠNG BIẾT ƠN</Chip>
      </Reveal>
      <Caption sceneId="sc001" startFrame={0} bottom={64} />
    </InkPanel>
  );
};

/** sc002 (s01) — khung cửa thu thành nét teal; nhãn "hình minh họa". */
export const Sc002: React.FC<SceneProps> = () => {
  const A = useA();
  const { p } = useFrac();
  const fIllus = A("Từ ghi chép");
  const fName = A("danh xưng");
  return (
    <InkPanel img="img-002" mode="card" x={140} y={90} w={740} h={900}>
      <div style={{ position: "absolute", left: 960, top: 150, width: 820 }}>
        <SceneTitle
          eyebrow="câu hỏi mở tập"
          title="Thánh Mẫu Liễu Hạnh"
          accent={C.tealLight}
          titleSize={78}
          startFrac={fName}
        />
        <Reveal startFrac={fName + 0.18} style={{ marginTop: 34 }}>
          <div style={{ fontFamily: FONT.body, fontSize: 38, lineHeight: 1.5, color: C.cream, background: "rgba(20,17,13,0.78)", padding: "26px 32px", borderRadius: 10 }}>
            Người được gọi là <span style={{ color: C.amber, fontWeight: 700 }}>Mẫu</span> — nhân vật
            người phụ nữ mà tập này lần theo qua các lớp tư liệu.
          </div>
        </Reveal>
        <Reveal startFrac={fIllus} style={{ marginTop: 26 }}>
          <Chip color={C.mute}>HÌNH MINH HỌA — KHÔNG PHẢI QUAN SÁT TẠI CHỖ</Chip>
        </Reveal>
      </div>
      <Caption sceneId="sc002" startFrame={368} bottom={64} />
    </InkPanel>
  );
};

/** sc003 (s02) — bốn con dấu Tứ bất tử, ba dấu已知 + ô trống thứ tư. */
export const Sc003: React.FC<SceneProps> = () => {
  const A = useA();
  const seals = [
    { id: 0, label: "Sơn Tinh", anchor: "Sơn Tinh", glyph: "M -34 18 C -14 -26, 14 -26, 34 18 M 0 -30 L 0 22" },
    { id: 1, label: "Thánh Gióng", anchor: "Thánh Gióng", glyph: "M -30 20 Q 0 -18, 30 20 M -6 -30 L 10 -18" },
    { id: 2, label: "Chử Đồng Tử", anchor: "Chử Đồng Tử", glyph: "M -26 16 L 26 16 M 0 16 L 0 -24 M -18 -6 L 18 -6" },
  ];
  return (
    <InkPanel img="img-003" mode="card" x={90} y={210} w={820} h={640}>
      <div style={{ position: "absolute", left: 960, right: 90, top: 130 }}>
        <SceneTitle eyebrow="tứ bất tử" title="Bốn con dấu" startFrac={A("bốn cái tên")} titleSize={72} />
        <div style={{ display: "flex", gap: 26, marginTop: 44, flexWrap: "wrap" }}>
          {seals.map((s) => (
            <Reveal key={s.id} startFrac={A(s.anchor)} dy={16}>
              <div style={{ width: 236, border: `2px solid ${C.amber}88`, borderRadius: 10, background: "rgba(36,31,26,0.9)", padding: "22px 18px", textAlign: "center" }}>
                <svg width={92} height={80} viewBox="-46 -40 92 80">
                  <path d={s.glyph} fill="none" stroke={C.amber} strokeWidth={7} strokeLinecap="round" />
                </svg>
                <div style={{ fontFamily: FONT.body, fontWeight: 700, fontSize: 30, color: C.cream, marginTop: 10 }}>{s.label}</div>
              </div>
            </Reveal>
          ))}
          <Reveal startFrac={A("một vị nữa")} dy={16}>
            <div style={{ width: 236, border: `2px dashed ${C.teal}`, borderRadius: 10, background: "rgba(36,31,26,0.6)", padding: "22px 18px", textAlign: "center", opacity: 0.9 }}>
              <div style={{ fontFamily: FONT.display, fontWeight: 800, fontSize: 64, color: C.tealLight, lineHeight: "80px", height: 80 }}>?</div>
              <div style={{ fontFamily: FONT.body, fontWeight: 700, fontSize: 30, color: C.tealLight, marginTop: 10 }}>…một vị nữa</div>
            </div>
          </Reveal>
        </div>
      </div>
      <Caption sceneId="sc003" startFrame={668} bottom={64} />
    </InkPanel>
  );
};

/** sc004 (s02) — nét mực nữ nhân áo đỏ điền ô thứ tư + hai câu hỏi biên tập. */
export const Sc004: React.FC<SceneProps> = () => {
  const A = useA();
  const fQ1 = A("Vì sao");
  const fQ2 = A("gọi bà là Mẫu");
  return (
    <InkPanel img="img-004" mode="card" x={110} y={100} w={700} h={880}>
      <div style={{ position: "absolute", left: 900, top: 170, width: 900 }}>
        <Reveal startFrac={A("Vì sao một người phụ nữ")}>
          <div style={{ fontFamily: FONT.mono, fontSize: 30, color: C.amber, letterSpacing: 3 }}>DUY NHẤT TRONG HÀNG TỨ BẤT TỬ</div>
        </Reveal>
        <Reveal startFrac={A("tiếp tục gọi bà là Mẫu")}>
          <div style={{ fontFamily: FONT.display, fontWeight: 800, fontSize: 84, color: C.white, marginTop: 20 }}>Liễu Hạnh</div>
        </Reveal>
        <Reveal startFrac={fQ1} style={{ marginTop: 44 }}>
          <div style={{ borderLeft: `6px solid ${C.amber}`, paddingLeft: 28, fontFamily: FONT.display, fontWeight: 700, fontSize: 52, color: C.cream, lineHeight: 1.35 }}>
            Vì sao một người phụ nữ được đứng trong hàng Tứ bất tử?
          </div>
        </Reveal>
        <Reveal startFrac={fQ2} style={{ marginTop: 30 }}>
          <div style={{ borderLeft: `6px solid ${C.teal}`, paddingLeft: 28, fontFamily: FONT.display, fontWeight: 700, fontSize: 52, color: C.cream, lineHeight: 1.35 }}>
            Trở lại trần gian — vì sao người đời tiếp tục gọi bà là <span style={{ color: C.tealLight }}>Mẫu</span>?
          </div>
        </Reveal>
      </div>
      <Caption sceneId="sc004" startFrame={1285} bottom={64} />
    </InkPanel>
  );
};

/** sc005 (s03) — trang giấy dó: giới thiệu Phan Kế Bính — Nam Hải dị nhân liệt truyện. */
export const Sc005: React.FC<SceneProps> = () => {
  const A = useA();
  const fPage = A("một trang sách");
  const fPKB = A("Phan Kế Bính");
  const fNH = A("Nam Hải dị nhân liệt truyện");
  return (
    <InkPanel img="img-005" mode="card" x={120} y={80} w={780} h={920}>
      <div style={{ position: "absolute", left: 970, top: 200, width: 840 }}>
        <Reveal startFrac={fPage}>
          <div style={{ fontFamily: FONT.mono, fontSize: 28, color: C.mute, letterSpacing: 3 }}>NGUỒN GỐC CÂU CHUYỆN</div>
        </Reveal>
        <Reveal startFrac={fPKB} style={{ marginTop: 26 }}>
          <div style={{ fontFamily: FONT.display, fontWeight: 800, fontSize: 92, color: C.white }}>Phan Kế Bính</div>
        </Reveal>
        <Reveal startFrac={fNH} style={{ marginTop: 18 }}>
          <div style={{ fontFamily: FONT.display, fontWeight: 700, fontSize: 52, color: C.amber, lineHeight: 1.35 }}>
            «Nam Hải dị nhân liệt truyện»
          </div>
          <div style={{ fontFamily: FONT.mono, fontSize: 28, color: C.mute, marginTop: 20 }}>— mục: Liễu-Hạnh tiên-chúa</div>
        </Reveal>
      </div>
      <Caption sceneId="sc005" startFrame={1608} bottom={64} />
    </InkPanel>
  );
};

/** sc006 (s03) — bản đồ nhỏ: mốc 1557 + Vân Cát; nhãn "Xin lưu ý". */
export const Sc006: React.FC<SceneProps> = () => {
  const A = useA();
  const fYear = A("Xin lưu ý từ đầu");
  const fPlace = A("con số một nghìn năm trăm");
  const fNote = A("Xin lưu ý");
  return (
    <InkPanel img="img-006" mode="card" x={100} y={110} w={720} h={860}>
      <div style={{ position: "absolute", left: 900, top: 150, width: 900 }}>
        <Reveal startFrac={fYear}>
          <div style={{ fontFamily: FONT.mono, fontSize: 28, color: C.mute, letterSpacing: 3 }}>THỜI VUA ANH-TÔN · NHÀ LÊ</div>
        </Reveal>
        <Reveal startFrac={fYear + 0.05}>
          <div style={{ fontFamily: FONT.display, fontWeight: 800, fontSize: 150, color: C.amber, lineHeight: 1 }}>1557</div>
        </Reveal>
        <Reveal startFrac={A("không đủ để xác nhận năm sinh")} style={{ marginTop: 8 }}>
          <div style={{ fontFamily: FONT.body, fontSize: 34, color: C.cream }}>
            bản kể mở truyện — thôn <span style={{ color: C.amber, fontWeight: 700 }}>Vân-cát</span>, xã Yên-thái, huyện Vụ-bản
          </div>
        </Reveal>
        <Reveal startFrac={fNote} style={{ marginTop: 36 }}>
          <div style={{ border: `2px solid ${C.mute}`, borderRadius: 10, background: "rgba(20,17,13,0.82)", padding: "22px 28px", fontFamily: FONT.body, fontSize: 32, color: C.cream }}>
            Xin lưu ý — mốc mở truyện <em>của bản kể</em>, không đủ xác nhận năm sinh lịch sử.
          </div>
        </Reveal>
      </div>
      <Caption sceneId="sc006" startFrame={2210} bottom={64} />
    </InkPanel>
  );
};

/** sc007 (s04) — ba tờ giấy xếp lớp: bản kể / đền thờ-thực hành / lớp của ta. */
export const Sc007: React.FC<SceneProps> = () => {
  const A = useA();
  const fIntro = A("Trước khi bước");
  const layers = [
    { label: "Bản kể", note: "trang truyện — Phan Kế Bính và các bản chép lại", color: C.amber, anchor: "Bản kể", rot: -2, dy: 0 },
    { label: "Đền thờ · thực hành", note: "dấu vết việc thờ — hồ sơ, phong tục, lễ hội", color: C.teal, anchor: "Đền thờ", rot: 1, dy: 90 },
    { label: "Lớp của tập này", note: "đi theo từng lớp, không trộn thành một", color: C.cream, anchor: "ba lớp", rot: 3, dy: 180 },
  ];
  return (
    <InkPanel img="img-007" mode="card" x={130} y={70} w={700} h={940}>
      <div style={{ position: "absolute", left: 890, top: 110, right: 90 }}>
        <SceneTitle eyebrow="khung đọc" title="Ba lớp tư liệu" startFrac={fIntro} titleSize={72} />
        <div style={{ position: "relative", height: 640, marginTop: 30 }}>
          {layers.map((l) => (
            <Reveal key={l.label} startFrac={A(l.anchor)} dy={14} style={{ position: "absolute", left: 0, right: 0, top: l.dy }}>
              <div style={{ transform: `rotate(${l.rot}deg)`, border: `2px solid ${l.color}aa`, borderRadius: 8, background: "rgba(36,31,26,0.92)", padding: "24px 30px", boxShadow: "0 12px 40px rgba(0,0,0,0.5)" }}>
                <div style={{ fontFamily: FONT.display, fontWeight: 700, fontSize: 44, color: l.color }}>{l.label}</div>
                <div style={{ fontFamily: FONT.body, fontSize: 30, color: C.cream, marginTop: 8 }}>{l.note}</div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
      <Caption sceneId="sc007" startFrame={2547} bottom={64} />
    </InkPanel>
  );
};

/** sc008 (s04) — bốn vật thể mực trôi: chén ngọc, biển vàng, đèo núi, áo đỏ. */
export const Sc008: React.FC<SceneProps> = () => {
  const A = useA();
  const { frame, p } = useFrac();
  const items = [
    { anchor: "chén ngọc", label: "chén ngọc sứt góc", color: C.amber },
    { anchor: "biển vàng", label: "biển vàng hai chữ", color: C.amber },
    { anchor: "đèo", label: "dãy đèo núi", color: C.mute },
  ];
  const drift = (f0: number) => (frame - f0 * 0) * 0; // anchored reveals, no drift
  return (
    <InkPanel img="img-008">
      <div style={{ position: "absolute", inset: 0 }}>
        {items.map((it, i) => {
          const f = A(it.anchor);
          const t = ease(p(f, f + 0.1));
          return (
            <Reveal key={it.anchor} startFrac={f} dy={20} style={{ position: "absolute", top: 160 + i * 150, left: 120 }}>
              <Chip color={it.color}>{it.label}</Chip>
            </Reveal>
          );
        })}
        <Reveal startFrac={A("tôi sẽ không khẳng định")} style={{ position: "absolute", bottom: 230, left: 120, right: 620 }}>
          <div style={{ fontFamily: FONT.display, fontWeight: 700, fontSize: 50, lineHeight: 1.4, color: C.white, background: "rgba(20,17,13,0.82)", padding: "30px 36px", borderRadius: 10 }}>
            Tôi sẽ không khẳng định bà là ai trong lịch sử — chỉ chỉ cho bạn xem mỗi lớp giữ lại điều gì.
          </div>
        </Reveal>
      </div>
      <Caption sceneId="sc008" startFrame={3219} bottom={64} />
    </InkPanel>
  );
};
