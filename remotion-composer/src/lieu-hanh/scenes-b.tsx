// S2E04 lieu-hanh — scenes group "b" (sc009–sc016).
import * as React from "react";
import { Chip, InkPanel, QuoteSlate, Reveal, SceneTitle, useA } from "./common";
import { Caption } from "./common";
import { C, FONT, SceneProps } from "./theme";

/** sc009 (s05) — trang sách mở ra thành trời mực; người con gái áo đỏ + chén ngọc. */
export const Sc009: React.FC<SceneProps> = () => {
  const A = useA();
  const fDream = A("một giấc mơ");
  const fGirl = A("người con gái");
  const fCup = A("chén ngọc");
  return (
    <InkPanel img="img-009" focus={{ x: 0.55, y: 0.4 }}>
      <Reveal startFrac={fDream} style={{ position: "absolute", top: 90, left: 110 }}>
        <Chip color={C.mute}>CẢNH TRONG MƠ CỦA THÁI-CÔNG — KHÔNG PHẢI TOÀN BỘ MỞ TRUYỆN</Chip>
      </Reveal>
      <Reveal startFrac={fGirl} style={{ position: "absolute", top: 170, left: 110 }}>
        <div style={{ fontFamily: FONT.display, fontWeight: 800, fontSize: 76, color: C.white }}>
          Người con gái <span style={{ color: C.redLight }}>áo đỏ</span>
        </div>
      </Reveal>
      <Reveal startFrac={fCup} style={{ position: "absolute", top: 300, left: 110, maxWidth: 760 }}>
        <div style={{ fontFamily: FONT.body, fontSize: 38, lineHeight: 1.5, color: C.cream, background: "rgba(20,17,13,0.8)", padding: "26px 32px", borderRadius: 10 }}>
          Bâng chén ngọc dâng rượu thọ — nhỡ tay rơi chén, sứt mất một góc.
          <div style={{ fontFamily: FONT.mono, fontSize: 27, color: C.amber, marginTop: 14 }}>mọi thứ bắt đầu xoay chuyển</div>
        </div>
      </Reveal>
      <Caption sceneId="sc009" startFrame={3731} bottom={64} />
    </InkPanel>
  );
};

/** sc010 (s05) — quan viết sổ; biển vàng Sắc-giáng · Nam nam; Quỳnh-hoa. */
export const Sc010: React.FC<SceneProps> = () => {
  const A = useA();
  const fBook = A("Mé trước có một cái biển vàng");
  const fSign = A("biển vàng");
  const fName = A("Quỳnh-hoa");
  return (
    <InkPanel img="img-010" mode="card" x={120} y={90} w={760} h={900}>
      <div style={{ position: "absolute", left: 950, top: 150, width: 860 }}>
        <SceneTitle eyebrow="sổ·biển·tên" title="Sắc-giáng" startFrac={fSign} titleSize={80} />
        <Reveal startFrac={fSign + 0.06} style={{ marginTop: 24 }}>
          <div style={{ border: `3px solid ${C.amber}`, borderRadius: 8, background: "rgba(36,31,26,0.94)", padding: "30px 36px", textAlign: "center" }}>
            <div style={{ fontFamily: FONT.display, fontWeight: 800, fontSize: 62, color: C.amber }}>SẮC-GIÁNG</div>
            <div style={{ fontFamily: FONT.display, fontWeight: 700, fontSize: 46, color: C.cream, marginTop: 10 }}>NAM NAM</div>
            <div style={{ fontFamily: FONT.mono, fontSize: 26, color: C.mute, marginTop: 16 }}>các khoản dưới mập mờ không rõ</div>
          </div>
        </Reveal>
        <Reveal startFrac={fName} style={{ marginTop: 30 }}>
          <div style={{ fontFamily: FONT.body, fontSize: 36, color: C.cream, lineHeight: 1.5 }}>
            Tiên-chúa thứ hai — tên là <span style={{ color: C.amber, fontWeight: 700 }}>Quỳnh-hoa</span>
          </div>
        </Reveal>
        <Reveal startFrac={fBook} style={{ marginTop: 18 }}>
          <Chip color={C.mute}>VIÊN QUAN MỞ SỔ — BIÊN VÀI CHỮ</Chip>
        </Reveal>
      </div>
      <Caption sceneId="sc010" startFrame={4513} bottom={64} />
    </InkPanel>
  );
};

/** sc011 (s06) — diagram: thẻ tên theo từng nguồn, không hợp nhất. */
export const Sc011: React.FC<SceneProps> = () => {
  const A = useA();
  const cards = [
    { name: "Quỳnh Hoa", note: "đoạn chén ngọc — bản Phan Kế Bính", anchor: "Quỳnh-hoa" },
    { name: "Giáng Tiên", note: "đoạn kể ngày mất — bản Phan Kế Bính", anchor: "Giáng-tiên" },
    { name: "An Thái", note: "bản dân gian — thôn An Thái, làng Vân Cát", anchor: "An Thái" },
  ];
  return (
    <InkPanel img="img-011" mode="card" x={120} y={140} w={780} h={800}>
      <div style={{ position: "absolute", left: 950, top: 120, right: 100 }}>
        <SceneTitle eyebrow="lớp kiểm tên" title="Tên theo từng nguồn" accent={C.tealLight} startFrac={A("Theo bản Phan")} titleSize={66} subtitle="Không hợp nhất — giữ đúng đoạn đã chép" />
        <div style={{ marginTop: 40, display: "flex", flexDirection: "column", gap: 26 }}>
          {cards.map((cd) => (
            <Reveal key={cd.name} startFrac={A(cd.anchor)} dy={16}>
              <div style={{ borderLeft: `6px solid ${C.teal}`, background: "rgba(36,31,26,0.92)", padding: "22px 30px", borderRadius: 8 }}>
                <div style={{ fontFamily: FONT.display, fontWeight: 700, fontSize: 46, color: C.cream }}>{cd.name}</div>
                <div style={{ fontFamily: FONT.mono, fontSize: 27, color: C.tealLight, marginTop: 8 }}>{cd.note}</div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
      <Caption sceneId="sc011" startFrame={5160} bottom={64} />
    </InkPanel>
  );
};

/** sc012 (s07) — trang sách im lìm + quote C03 về mồng ba tháng ba. */
export const Sc012: React.FC<SceneProps> = () => {
  const A = useA();
  return (
    <InkPanel img="img-012" mode="card" x={170} y={110} w={700} h={860}>
      <div style={{ position: "absolute", left: 940, top: 220, width: 870 }}>
        <QuoteSlate
          text="Hôm mồng ba tháng ba, Giáng tiên tự nhiên vô bệnh mà mất, bấy giờ mới hai mươi mốt tuổi."
          startFrac={A("Rồi đến một")}
          endFrac={A("Rồi đến một") + 0.5}
          source="NHDNLT 45 · Phan Kế Bính (C03)"
          size={56}
          maxWidth={820}
        />
        <Reveal startFrac={A("mồng ba tháng ba") + 0.3} style={{ marginTop: 30 }}>
          <Chip color={C.tealLight}>CÂU DUY NHẤT VỀ NGÀY MẤT — GIỮ TRONG KHUNG BẢN KỂ</Chip>
        </Reveal>
      </div>
      <Caption sceneId="sc012" startFrame={5973} bottom={64} />
    </InkPanel>
  );
};

/** sc013 (s07) — diagram: hai mảnh giấy đối chiếu 3/3. */
export const Sc013: React.FC<SceneProps> = () => {
  const A = useA();
  const fMatch = A("Sự trùng ngày");
  return (
    <InkPanel img="img-013" mode="card" x={110} y={130} w={760} h={820}>
      <div style={{ position: "absolute", left: 920, top: 150, right: 90 }}>
        <SceneTitle eyebrow="đối chiếu" title="3 · 3 · âm lịch" accent={C.tealLight} startFrac={fMatch} titleSize={76} />
        <div style={{ display: "flex", gap: 30, marginTop: 46 }}>
          <Reveal startFrac={fMatch + 0.08} dy={14}>
            <div style={{ width: 400, border: `2px solid ${C.amber}99`, borderRadius: 10, background: "rgba(36,31,26,0.92)", padding: "30px 30px" }}>
              <div style={{ fontFamily: FONT.mono, fontSize: 26, color: C.amber, letterSpacing: 2 }}>BẢN KỂ</div>
              <div style={{ fontFamily: FONT.display, fontWeight: 700, fontSize: 40, color: C.cream, marginTop: 14, lineHeight: 1.35 }}>mồng ba tháng ba</div>
              <div style={{ fontFamily: FONT.body, fontSize: 28, color: C.mute, marginTop: 12 }}>ngày tiên chúa mất</div>
            </div>
          </Reveal>
          <Reveal startFrac={fMatch + 0.16} dy={14}>
            <div style={{ width: 400, border: `2px solid ${C.teal}`, borderRadius: 10, background: "rgba(36,31,26,0.92)", padding: "30px 30px" }}>
              <div style={{ fontFamily: FONT.mono, fontSize: 26, color: C.tealLight, letterSpacing: 2 }}>GHI CHÉP LỄ HỘI</div>
              <div style={{ fontFamily: FONT.display, fontWeight: 700, fontSize: 40, color: C.cream, marginTop: 14, lineHeight: 1.35 }}>hội Phủ Dầy — 3/3</div>
              <div style={{ fontFamily: FONT.body, fontSize: 28, color: C.mute, marginTop: 12 }}>ngày hội hằng năm</div>
            </div>
          </Reveal>
        </div>
        <Reveal startFrac={fMatch + 0.3} style={{ marginTop: 34 }}>
          <div style={{ fontFamily: FONT.body, fontSize: 32, color: C.cream, background: "rgba(20,17,13,0.8)", padding: "22px 28px", borderRadius: 10 }}>
            Sự trùng ngày — ghi chú, chưa phải sự kiện lịch sử chung.
          </div>
        </Reveal>
      </div>
      <Caption sceneId="sc013" startFrame={6546} bottom={64} />
    </InkPanel>
  );
};

/** sc014 (s08) — 'hiển thánh' tỏa ra giữ trang mở; đường mực nối tiếp. */
export const Sc014: React.FC<SceneProps> = () => {
  const A = useA();
  const fIf = A("Nếu đây là");
  const fWord = A("hiển thánh");
  const fNot = A("dấu ngắt");
  return (
    <InkPanel img="img-014" mode="card" x={120} y={100} w={740} h={880}>
      <div style={{ position: "absolute", left: 920, top: 160, width: 880 }}>
        <Reveal startFrac={fIf}>
          <div style={{ fontFamily: FONT.body, fontSize: 38, color: C.mute, lineHeight: 1.5 }}>
            Nếu đây là câu chuyện thường — nó kết thúc ở tuổi hai mươi mốt.
          </div>
        </Reveal>
        <Reveal startFrac={A("kể tiếp rằng nàng trở về")} style={{ marginTop: 30 }}>
          <div style={{ fontFamily: FONT.display, fontWeight: 800, fontSize: 84, color: C.white, lineHeight: 1.2 }}>
            Nàng <span style={{ color: C.amber }}>trở về</span>.
          </div>
        </Reveal>
        <Reveal startFrac={fWord} style={{ marginTop: 34 }}>
          <div style={{ display: "inline-block", border: `3px solid ${C.amber}`, borderRadius: 10, background: "rgba(36,31,26,0.94)", padding: "20px 40px" }}>
            <span style={{ fontFamily: FONT.display, fontWeight: 800, fontSize: 74, color: C.amber }}>hiển thánh</span>
          </div>
          <div style={{ fontFamily: FONT.mono, fontSize: 27, color: C.mute, marginTop: 16 }}>chữ của bản kể — không phải ghi nhận quan sát</div>
        </Reveal>
        <Reveal startFrac={fNot} style={{ marginTop: 30 }}>
          <div style={{ fontFamily: FONT.body, fontSize: 34, color: C.cream }}>
            Cái chết mồng ba tháng ba: <span style={{ color: C.tealLight }}>dấu ngắt</span>, không phải dấu chấm hết.
          </div>
        </Reveal>
      </div>
      <Caption sceneId="sc014" startFrame={6796} bottom={64} />
    </InkPanel>
  );
};

/** sc015 (s09) — HERO: đường mực rời nhà rồi trở về; chữ 'trở về'. */
export const Sc015: React.FC<SceneProps> = () => {
  const A = useA();
  const fUp = A("không ở lại cõi trên");
  const fBack = A("trở về trần gian");
  const fEdge = A("đường");
  const fHome = A("Vân Cát");
  return (
    <InkPanel img="img-015" focus={{ x: 0.5, y: 0.42 }}>
      <Reveal startFrac={fUp} style={{ position: "absolute", top: 100, left: 120 }}>
        <Chip color={C.mute}>HỒI HAI — TIÊN CHÚA TRỞ VỀ</Chip>
      </Reveal>
      <Reveal startFrac={fBack} style={{ position: "absolute", top: 190, left: 120 }}>
        <div style={{ fontFamily: FONT.display, fontWeight: 800, fontSize: 170, color: C.white, lineHeight: 1 }}>
          trở <span style={{ color: C.amber }}>về</span>
        </div>
        <div style={{ fontFamily: FONT.mono, fontSize: 30, color: C.cream, marginTop: 14, letterSpacing: 2, background: "rgba(20,17,13,0.72)", padding: "8px 14px", borderRadius: 6, display: "inline-block" }}>
          về lại vùng Vân Cát
        </div>
      </Reveal>
      <Reveal startFrac={fEdge} style={{ position: "absolute", bottom: 240, left: 120, right: 700 }}>
        <div style={{ fontFamily: FONT.body, fontSize: 36, lineHeight: 1.5, color: C.cream, background: "rgba(20,17,13,0.8)", padding: "26px 32px", borderRadius: 10 }}>
          Chỉ cần dừng ở chuyển động ấy: câu chuyện đổi hướng — rời đi rồi trở lại.
        </div>
      </Reveal>
      <Reveal startFrac={fHome} style={{ position: "absolute", bottom: 150, left: 120 }}>
        <Chip color={C.tealLight}>VÂN CÁT</Chip>
      </Reveal>
      <Caption sceneId="sc015" startFrame={7904} bottom={64} />
    </InkPanel>
  );
};

/** sc016 (s10) — câu đối hiện theo lời đọc: Tam mộc sâm đình / Trùng sơn xuất lộ. */
export const Sc016: React.FC<SceneProps> = () => {
  const A = useA();
  const fMeet = A("Phùng-khắc-Khoan");
  const fQ1 = A("Tam mộc sâm đình");
  const fQ2 = A("Trùng sơn");
  const fGone = A("biến mất");
  return (
    <InkPanel img="img-016" mode="card" x={110} y={90} w={740} h={900}>
      <div style={{ position: "absolute", left: 910, top: 130, right: 90 }}>
        <Reveal startFrac={fMeet}>
          <div style={{ fontFamily: FONT.mono, fontSize: 28, color: C.mute, letterSpacing: 3 }}>GẶP TRÊN ĐƯỜNG ĐI SỨ</div>
          <div style={{ fontFamily: FONT.display, fontWeight: 700, fontSize: 44, color: C.cream, marginTop: 12 }}>Phùng Khắc Khoan — Trạng Bùng</div>
        </Reveal>
        <div style={{ marginTop: 40 }}>
          <QuoteSlate
            text="Tam mộc sâm đình, tọa chước hảo hề nữ tử."
            startFrac={fQ1}
            endFrac={fQ1 + 0.28}
            source="ra — câu đối của Phùng-công"
            size={46}
            maxWidth={840}
          />
        </div>
        <div style={{ marginTop: 26 }}>
          <QuoteSlate
            text="Trùng sơn xuất lộ, tẩu lai sứ giả lại nhân."
            startFrac={fQ2}
            endFrac={fQ2 + 0.28}
            source="đối — câu đáp của tiên chúa"
            size={46}
            maxWidth={840}
            accent={C.tealLight}
          />
        </div>
        <Reveal startFrac={fGone} style={{ marginTop: 30 }}>
          <div style={{ fontFamily: FONT.body, fontSize: 32, color: C.cream, background: "rgba(20,17,13,0.8)", padding: "22px 28px", borderRadius: 10, lineHeight: 1.45 }}>
            Muốn hỏi lai lịch — thì đã biến mất. Việc nêu tên chưa đủ xác nhận cuộc gặp từng có thật.
          </div>
        </Reveal>
      </div>
      <Caption sceneId="sc016" startFrame={8735} bottom={64} />
    </InkPanel>
  );
};
