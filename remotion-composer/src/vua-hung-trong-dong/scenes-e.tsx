// VN-Myth Ep.03 — scenes group E: sc-53..sc-66 (Hồi bốn climax: Ngọc Lũ xoay 360°,
// bản khai sinh không chữ, montage con dấu, đáp hook, Giỗ Tổ, thư pháp, motto đóng sổ,
// outro series, teaser Ep.04, end card). Mọi animation khóa vào word-anchor (±0.3s).
import React from "react";
import { AbsoluteFill, Img, staticFile } from "remotion";
import { C, FONT, SceneProps } from "./theme";
import {
  Chip,
  CountUp,
  InkPath,
  Paper,
  Reveal,
  SoundRipples,
  SourceTag,
  SpringPop,
  useA,
  useFrac,
  ease,
} from "./common";
import refNgocLu from "../../../projects/vua-hung-trong-dong/assets/reference/ngoc-lu-drum.jpg";
import refPattern from "../../../projects/vua-hung-trong-dong/assets/reference/trong1-ngoc-lu-1-pattern.jpg";
import refF13 from "../../../projects/vua-hung-trong-dong/assets/reference/f13-den-hung.png";
import refF06 from "../../../projects/vua-hung-trong-dong/assets/reference/f06-chia-50-50.png";

const img = (name: string) => staticFile(`vua-hung-trong-dong/images/${name}`);

// === sc-53 === THẺ BẢO VẬT NGỌC LŨ — stat card + ảnh thật
export const Sc53: React.FC<SceneProps> = () => {
  const A = useA();
  const tTitle = A("hiện", 1); // "hiện vật kết tinh"
  const tRank = A("đứng", 1); // "đứng đầu nhóm trống lớn nhất"
  const tSib = A("cùng", 1); // "cùng họng với Hoàng Hạ…"
  const t63 = A("sáu", 1); // "sáu mươi ba centimet"
  const t79 = A("bảy", 1); // "bảy mươi chín phẩy ba"
  const tFind = A("phát", 1); // "phát hiện tại Bình Lục, Hà Nam"
  const tPhoto = A("Lũ", 1); // "Ngọc Lũ" → ảnh thật trượt vào
  const { frame } = useFrac();
  const glint = ((frame % 90) / 90) * 100;
  return (
    <Paper variant="museum">
      <div style={{ position: "absolute", left: 110, top: 120, width: 1010 }}>
        <Reveal startFrac={tTitle} endFrac={tTitle + 0.06}>
          <div style={{ fontFamily: FONT.body, fontWeight: 700, fontSize: 30, letterSpacing: 5, color: C.bronze }}>
            HIỆN VẬT KẾT TINH CỦA ĐÔNG SƠN
          </div>
        </Reveal>
        <Reveal startFrac={tTitle + 0.03} endFrac={tTitle + 0.1}>
          <div style={{ fontFamily: FONT.display, fontWeight: 800, fontSize: 96, lineHeight: 1.06, color: C.white, marginTop: 14 }}>
            TRỐNG ĐỒNG<br />NGỌC LŨ
          </div>
        </Reveal>
        <SpringPop startFrac={tRank} from={0.9} style={{ marginTop: 26 }}>
          <div style={{ fontFamily: FONT.body, fontWeight: 500, fontSize: 38, color: C.cream, background: "rgba(36,31,26,0.92)", padding: "12px 26px", borderRadius: 8, display: "inline-block", border: `2px solid ${C.border}` }}>
            bảo vật đứng đầu nhóm trống <b style={{ color: C.bronze }}>lớn nhất</b> của Đông Sơn
          </div>
        </SpringPop>
        <Reveal startFrac={tSib} endFrac={tSib + 0.08} style={{ marginTop: 24 }}>
          <div style={{ fontFamily: FONT.body, fontSize: 34, color: C.mute }}>cùng họng với</div>
          <div style={{ display: "flex", gap: 14, marginTop: 10 }}>
            {["Hoàng Hạ", "Sông Đà", "Khai Hóa", "Bản Thôm"].map((n) => (
              <Chip key={n} color={C.bronze}>{n}</Chip>
            ))}
          </div>
        </Reveal>
        <div style={{ display: "flex", gap: 34, marginTop: 44 }}>
          <SpringPop startFrac={t63} from={0.85} style={{ background: "rgba(36,31,26,0.96)", border: `3px solid ${C.bronze}`, borderRadius: 12, padding: "26px 36px", minWidth: 320 }}>
            <div style={{ fontFamily: FONT.body, fontSize: 34, color: C.cream }}>thân cao</div>
            <div style={{ fontFamily: FONT.display, fontWeight: 800, fontSize: 110, color: C.white, lineHeight: 1.05 }}>
              <CountUp to={63} startFrac={t63} endFrac={t63 + 0.1} />
              <span style={{ fontSize: 44, color: C.bronze }}> cm</span>
            </div>
          </SpringPop>
          <SpringPop startFrac={t79} from={0.85} style={{ background: "rgba(36,31,26,0.96)", border: `3px solid ${C.bronze}`, borderRadius: 12, padding: "26px 36px", minWidth: 320 }}>
            <div style={{ fontFamily: FONT.body, fontSize: 34, color: C.cream }}>mặt rộng</div>
            <div style={{ fontFamily: FONT.display, fontWeight: 800, fontSize: 110, color: C.white, lineHeight: 1.05 }}>
              <CountUp to={79.3} decimals={1} startFrac={t79} endFrac={t79 + 0.1} />
              <span style={{ fontSize: 44, color: C.bronze }}> cm</span>
            </div>
          </SpringPop>
        </div>
        <Reveal startFrac={tFind} endFrac={tFind + 0.07} style={{ marginTop: 34 }}>
          <div style={{ fontFamily: FONT.body, fontWeight: 500, fontSize: 38, color: C.amber }}>
            phát hiện tại <b>Bình Lục, Hà Nam</b>
          </div>
        </Reveal>
      </div>
      {/* ảnh thật — Public Domain */}
      <Reveal startFrac={tPhoto} endFrac={tPhoto + 0.1} dy={40} style={{ position: "absolute", right: 110, top: 150 }}>
        <div
          style={{
            width: 560,
            padding: 14,
            background: "rgba(36,31,26,0.96)",
            border: `4px solid ${C.bronze}`,
            borderRadius: 14,
            position: "relative",
            overflow: "hidden",
          }}
        >
          <Img src={refNgocLu} style={{ width: "100%", height: 600, objectFit: "cover", borderRadius: 8, display: "block" }} />
          <div
            style={{
              position: "absolute",
              top: 0,
              bottom: 0,
              left: `${glint - 30}%`,
              width: "18%",
              background: "linear-gradient(105deg, rgba(245,242,234,0) 0%, rgba(245,242,234,0.18) 50%, rgba(245,242,234,0) 100%)",
              pointerEvents: "none",
            }}
          />
          <div style={{ fontFamily: FONT.body, fontSize: 28, color: C.cream, textAlign: "center", marginTop: 12 }}>
            trống đồng Ngọc Lũ — ảnh tư liệu
          </div>
        </div>
      </Reveal>
      <SourceTag text="Ảnh: trống đồng Ngọc Lũ — Public Domain · số đo: Bảo tàng Lịch sử Quốc gia" bottom={40} right />
    </Paper>
  );
};

// === sc-54 === HERO CLIMAX — NGỌC LŨ XOAY 360° (ảnh thật + vành họa tiết xoay)
export const Sc54: React.FC<SceneProps> = () => {
  const A = useA();
  const tSpin = A("trước", 1); // "Ở tập trước…" → khối trống bắt đầu xoay
  const tRipple = A("đọc", 1); // "cách đọc mặt trống" → nhịp trống
  const tRing = A("hàng", 1); // "hàng người hóa trang lông chim"
  const tTuc = A("tục", 1); // "chính là tục chổ mình"
  const tLac = A("Lạc", 1); // "dân Lạc giặm mình"
  const { frame, dur } = useFrac();
  const spinP = ease(Math.max(0, Math.min(1, (frame - tSpin * dur) / (Math.max(1, (0.97 - tSpin) * dur)))));
  const deg = spinP * 360;
  return (
    <Paper variant="museum">
      <Reveal startFrac={0.03} endFrac={0.1} style={{ position: "absolute", top: 66, left: 0, right: 0, textAlign: "center" }}>
        <div style={{ fontFamily: FONT.body, fontWeight: 700, fontSize: 32, letterSpacing: 6, color: C.bronze }}>
          HỒI BỐN · CLIMAX — ĐỌC LẠI MẶT TRỐNG
        </div>
      </Reveal>
      {/* vành họa tiết xoay 360° */}
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: "50%",
          width: 900,
          height: 900,
          marginLeft: -450,
          marginTop: -450,
          borderRadius: "50%",
          overflow: "hidden",
          transform: `rotate(${deg}deg)`,
          opacity: 0.55,
          boxShadow: `0 0 140px rgba(201,143,78,0.28)`,
        }}
      >
        <Img src={refPattern} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      </div>
      {/* mặt trống thật — ảnh PD ở tâm */}
      <SpringPop startFrac={tSpin} from={0.62} style={{ position: "absolute", left: "50%", top: "50%", transform: "translate(-50%,-50%)" }}>
        <div
          style={{
            width: 620,
            height: 620,
            borderRadius: "50%",
            overflow: "hidden",
            border: `10px solid ${C.bronze}`,
            boxShadow: `0 0 90px rgba(201,143,78,0.45), inset 0 0 60px rgba(0,0,0,0.5)`,
          }}
        >
          <Img src={refNgocLu} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        </div>
      </SpringPop>
      <SoundRipples cx={960} cy={540} startFrac={tRipple} count={4} maxR={720} color={C.bronze} periodFrac={0.14} />
      <Reveal startFrac={tRing} endFrac={tRing + 0.08} style={{ position: "absolute", top: 950, left: 0, right: 0, textAlign: "center" }}>
        <div style={{ fontFamily: FONT.body, fontWeight: 500, fontSize: 36, color: C.cream, background: "rgba(20,17,13,0.8)", display: "inline-block", padding: "10px 30px", borderRadius: 8 }}>
          hàng người hóa trang lông chim · tay cầm nhạc cụ · đi vòng ngược chiều kim đồng hồ
        </div>
      </Reveal>
      <SpringPop startFrac={tTuc} from={0.85} style={{ position: "absolute", left: 90, bottom: 120 }}>
        <div style={{ fontFamily: FONT.display, fontWeight: 700, fontSize: 44, color: C.amber, background: "rgba(36,31,26,0.94)", border: `3px solid ${C.amber}`, borderRadius: 10, padding: "18px 30px" }}>
          tục «chổ mình» — Toàn thư nhắc
        </div>
      </SpringPop>
      <SpringPop startFrac={tLac} from={0.85} style={{ position: "absolute", right: 90, bottom: 120 }}>
        <div style={{ fontFamily: FONT.display, fontWeight: 700, fontSize: 44, color: C.teal, background: "rgba(36,31,26,0.94)", border: `3px solid ${C.teal}`, borderRadius: 10, padding: "18px 30px" }}>
          dân Lạc — giặm mình
        </div>
      </SpringPop>
      <SourceTag text="Ảnh: Ngọc Lũ (PD) · họa tiết vành múa: bản dựng từ tư liệu Đông Sơn" bottom={40} />
    </Paper>
  );
};

// === sc-55 === BẢN KHAI SINH KHÔNG CHỮ — diagram giải mã mặt trống
export const Sc55: React.FC<SceneProps> = () => {
  const A = useA();
  // board mở khi lời liệt kê bắt đầu vào cửa sổ cảnh ("…mái cong"); thuyền/nhà sàn
  // được nói ở đuôi sc-54 nên hai tile đầu pop theo mốc mở bảng.
  const tBoard = A("mái", 1);
  const tThuyen = tBoard + 0.022;
  const tNha = tBoard + 0.048;
  const tChim = A("chim", 2); // occ2 — occ1 nằm ở sc-54 ("lông chim")
  const tLe = A("lễ", 1);
  const tMua = A("múa", 1);
  const tRead = A("Đọc", 1); // "Đọc nó không cần biết chữ"
  const tManifest = A("tuyên", 1); // "bản tuyên ngôn"
  const tKham = A("Quốc", 1); // "Quốc hiệu không khắc trên đá"
  const tiles = [
    { t: tThuyen, label: "THUYỀN", icon: "M10 40 Q40 52 70 40 M40 40 V10 M28 22 L52 22", x: 250, y: 240 },
    { t: tNha, label: "NHÀ SÀN MÁI CONG", icon: "M10 26 Q40 2 70 26 M18 26 V54 M62 26 V54 M10 54 H70", x: 1310, y: 240 },
    { t: tChim, label: "CHIM LẠC", icon: "M10 34 Q30 8 52 26 Q64 14 70 30 Q50 44 24 40 Q18 46 10 34", x: 1390, y: 620 },
    { t: tLe, label: "LỄ HỘI", icon: "M40 8 V56 M40 12 H68 L56 22 L68 32 H40 M24 44 H56 M30 44 V56", x: 300, y: 640 },
    { t: tMua, label: "NGƯỜI MÚA", icon: "M40 10 A6 6 0 1 1 39.9 10 M40 18 V40 M40 24 L22 34 M40 24 L58 12 M40 40 L26 58 M40 40 L54 58", x: 700, y: 880 },
  ];
  return (
    <Paper variant="museum">
      <Reveal startFrac={tBoard} endFrac={tBoard + 0.07} style={{ position: "absolute", top: 64, left: 0, right: 0, textAlign: "center" }}>
        <div style={{ fontFamily: FONT.display, fontWeight: 800, fontSize: 64, color: C.white }}>
          Một tấm <span style={{ color: C.bronze }}>bản khai sinh</span> không dùng một chữ nào
        </div>
      </Reveal>
      {/* mặt trống nhỏ ở tâm */}
      <SpringPop startFrac={tBoard + 0.03} from={0.7} style={{ position: "absolute", left: "50%", top: "47%", transform: "translate(-50%,-50%)" }}>
        <div
          style={{
            width: 300,
            height: 300,
            borderRadius: "50%",
            overflow: "hidden",
            border: `7px solid ${C.bronze}`,
            boxShadow: `0 0 70px rgba(201,143,78,0.4)`,
          }}
        >
          <Img src={refPattern} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        </div>
      </SpringPop>
      <svg width="1920" height="1080" viewBox="0 0 1920 1080" style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
        {tiles.map((tl, i) => (
          <InkPath
            key={i}
            d={`M960 500 L${tl.x + 90} ${tl.y + 70}`}
            startFrac={tl.t}
            endFrac={tl.t + 0.09}
            stroke={C.bronze}
            strokeWidth={3}
          />
        ))}
      </svg>
      {tiles.map((tl, i) => (
        <SpringPop key={i} startFrac={tl.t} from={0.82} style={{ position: "absolute", left: tl.x, top: tl.y }}>
          <div style={{ width: 180, textAlign: "center" }}>
            <svg width="80" height="66" viewBox="0 0 80 66" style={{ display: "block", margin: "0 auto" }}>
              <path d={tl.icon} fill="none" stroke={C.cream} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <div style={{ fontFamily: FONT.body, fontWeight: 700, fontSize: 30, letterSpacing: 2, color: C.white, marginTop: 10, background: "rgba(36,31,26,0.92)", border: `2px solid ${C.border}`, borderRadius: 8, padding: "8px 10px" }}>
              {tl.label}
            </div>
          </div>
        </SpringPop>
      ))}
      <Reveal startFrac={tRead} endFrac={tRead + 0.07} style={{ position: "absolute", left: 140, top: 130 }}>
        <div style={{ fontFamily: FONT.display, fontWeight: 700, fontSize: 46, color: C.cream }}>
          Đọc nó không cần biết chữ — chỉ cần biết <span style={{ color: C.amber }}>nghe</span>.
        </div>
      </Reveal>
      <SpringPop startFrac={tManifest} from={0.8} style={{ position: "absolute", left: "50%", top: 880, transform: "translateX(-50%)" }}>
        <div style={{ fontFamily: FONT.display, fontWeight: 800, fontSize: 54, color: C.bronze, background: "rgba(36,31,26,0.95)", border: `3px solid ${C.bronze}`, borderRadius: 12, padding: "18px 40px" }}>
          BẢN TUYÊN NGÔN CỦA MỘT CỘNG ĐỒNG
        </div>
      </SpringPop>
      <Reveal startFrac={tKham} endFrac={tKham + 0.08} style={{ position: "absolute", left: 0, right: 0, bottom: 60, textAlign: "center" }}>
        <div style={{ fontFamily: FONT.display, fontWeight: 800, fontSize: 58, color: C.white }}>
          Quốc hiệu không khắc trên đá — khắc trên <span style={{ color: C.bronze }}>ĐỒNG</span>.
        </div>
      </Reveal>
    </Paper>
  );
};

// === sc-56 === MONTAGE KẾT — NĂM LỜI KHAI NHẤN CON DẤU
export const Sc56: React.FC<SceneProps> = () => {
  const A = useA();
  const tTitle = A("kết", 1); // "đi tới lời kết"
  const items = [
    { t: A("canh", 1), label: "CANH LÚA", src: img("img-sc-44.png") },
    { t: A("đúc", 1), label: "ĐÚC ĐỒNG", src: img("img-sc-19.png") },
    { t: A("chôn", 1), label: "CHÔN NGƯỜI CHẾT", src: img("img-sc-31.png") },
    { t: A("đánh", 1), label: "ĐÁNH TRỐNG TỤ HỌP", src: refPattern },
    { t: A("tụ", 1), label: "VÀNH NGƯỜI MÚA", src: refNgocLu },
  ];
  const { frame, dur } = useFrac();
  return (
    <Paper>
      {/* FIX-08 — 5 ô tile placeholder mờ đúng hàng layout, hiện từ frame 0;
          tile thật (nền đặc) phủ lên từng ô khi anchor tới */}
      <Reveal startFrac={0.0} endFrac={0.03} dy={0} style={{ position: "absolute", left: 80, right: 80, top: 360, display: "flex", gap: 22, justifyContent: "center" }}>
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} style={{ width: 330, opacity: 0.35 }}>
            <div style={{ width: 330, height: 330, borderRadius: 10, border: `2px dashed ${C.border}`, background: "rgba(36,31,26,0.4)" }} />
            <div style={{ width: "70%", height: 40, borderRadius: 8, background: C.border, opacity: 0.35, margin: "14px auto 0" }} />
          </div>
        ))}
      </Reveal>
      <Reveal startFrac={tTitle} endFrac={tTitle + 0.07} style={{ position: "absolute", top: 90, left: 0, right: 0, textAlign: "center" }}>
        <div style={{ fontFamily: FONT.display, fontWeight: 800, fontSize: 72, color: C.white }}>
          Năm lời khai — <span style={{ color: C.amber }}>nhấn thành con dấu</span>
        </div>
        <div style={{ fontFamily: FONT.body, fontSize: 36, color: C.cream, marginTop: 14 }}>
          một xã hội phức tạp thật sự bật dậy ở sông Hồng
        </div>
      </Reveal>
      <div style={{ position: "absolute", left: 80, right: 80, top: 360, display: "flex", gap: 22, justifyContent: "center" }}>
        {items.map((it, i) => {
          const press = ease(Math.max(0, Math.min(1, (frame - (it.t + 0.085) * dur) / (0.05 * dur))));
          return (
            <SpringPop key={i} startFrac={it.t} from={0.85}>
              <div
                style={{
                  width: 330,
                  transform: `scale(${1 - press * 0.12})`,
                  opacity: 1 - press * 0.25,
                }}
              >
                <div style={{ width: 330, height: 330, borderRadius: 10, overflow: "hidden", border: `3px solid ${press > 0.5 ? C.amber : C.border}`, position: "relative", background: "rgba(36,31,26,0.9)" }}>
                  <Img src={it.src} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  {press > 0.35 && (
                    <svg width="330" height="330" viewBox="0 0 330 330" style={{ position: "absolute", inset: 0 }}>
                      <rect x="112" y="112" width="106" height="106" fill="rgba(217,164,65,0.16)" stroke={C.amber} strokeWidth="5" transform="rotate(-8 165 165)" rx="8" />
                      <path d="M138 168 L158 190 L196 140" fill="none" stroke={C.amber} strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </div>
                <div style={{ fontFamily: FONT.body, fontWeight: 700, fontSize: 30, letterSpacing: 1, color: press > 0.5 ? C.amber : C.cream, textAlign: "center", marginTop: 14, background: "rgba(36,31,26,0.9)", borderRadius: 8, padding: "8px 6px" }}>
                  {it.label}
                </div>
              </div>
            </SpringPop>
          );
        })}
      </div>
      <SourceTag text="tái dùng tư liệu tập này: ruộng lúa · lò đồng · mộ thuyền · mặt trống · vành múa Ngọc Lũ" bottom={48} />
    </Paper>
  );
};

// === sc-57 === ĐÁP HOOK — ĐẤT CÒN GIỮ LỜI KHAI
export const Sc57: React.FC<SceneProps> = () => {
  const A = useA();
  const tLost = A("Còn", 1); // "Còn tiếng trống…" — hai dòng đầu vào tại mốc chuyển
  const tBook = A("tiếng", 1); // "tiếng trống thì vang thật"
  const tVang1 = A("vang", 1); // "tiếng trống thì vang thật"
  const tVang3 = A("vang", 3); // "nó vang trong cách người Việt…"
  const tVang4 = A("vang", 4); // "vang trong ngày cả nước…"
  const tQ = A("hỏi", 1); // "Câu hỏi mở màn tối nay"
  const tAns = A("đất", 1); // "vì đất còn giữ lời khai"
  const { frame, dur } = useFrac();
  const carve = ease(Math.max(0, Math.min(1, (frame - tAns * dur) / (0.14 * dur))));
  return (
    <Paper>
      <Reveal startFrac={tLost} endFrac={tLost + 0.07} style={{ position: "absolute", left: 110, top: 110, width: 760 }}>
        <div style={{ fontFamily: FONT.display, fontWeight: 700, fontSize: 50, color: C.cream, opacity: 0.85, lineHeight: 1.3 }}>
          Tên các vị vua — nếu có — <span style={{ color: C.warn }}>đã mất</span>.
        </div>
      </Reveal>
      <Reveal startFrac={tBook} endFrac={tBook + 0.07} style={{ position: "absolute", right: 110, top: 110, width: 760, textAlign: "right" }}>
        <div style={{ fontFamily: FONT.display, fontWeight: 700, fontSize: 50, color: C.cream, opacity: 0.85, lineHeight: 1.3 }}>
          Chức danh còn sót lại trong <span style={{ color: C.teal }}>trang sách</span> của người đời sau.
        </div>
      </Reveal>
      <SoundRipples cx={960} cy={560} startFrac={tVang1} count={3} maxR={560} color={C.amber} />
      <div style={{ position: "absolute", left: 0, right: 0, top: 400, textAlign: "center" }}>
        <SpringPop startFrac={tVang1} from={0.9}>
          <div style={{ fontFamily: FONT.display, fontWeight: 700, fontSize: 52, color: C.amber }}>
            Còn tiếng trống thì <b>VANG THẬT</b> —
          </div>
        </SpringPop>
        <SpringPop startFrac={tVang3} from={0.9} style={{ marginTop: 20 }}>
          <div style={{ fontFamily: FONT.display, fontWeight: 700, fontSize: 46, color: C.cream }}>
            vang trong chữ <span style={{ color: C.bronze }}>ĐỒNG BÀO</span> ·
          </div>
        </SpringPop>
        <SpringPop startFrac={tVang4} from={0.9} style={{ marginTop: 20 }}>
          <div style={{ fontFamily: FONT.display, fontWeight: 700, fontSize: 46, color: C.cream }}>
            vang trong ngày cả nước về <span style={{ color: C.bronze }}>PHÚ THỌ</span>.
          </div>
        </SpringPop>
      </div>
      <Reveal startFrac={tQ} endFrac={tQ + 0.07} style={{ position: "absolute", left: 0, right: 0, bottom: 300, textAlign: "center" }}>
        <div style={{ fontFamily: FONT.display, fontWeight: 500, fontSize: 40, color: C.mute, fontStyle: "italic" }}>
          «Văn Lang có thật không? — sao ta tin là nó từng tồn tại?»
        </div>
      </Reveal>
      <div style={{ position: "absolute", left: 0, right: 0, bottom: 130, textAlign: "center" }}>
        <div
          style={{
            display: "inline-block",
            fontFamily: FONT.display,
            fontWeight: 800,
            fontSize: 78,
            color: C.white,
            letterSpacing: carve * 4,
            opacity: 0.25 + carve * 0.75,
            borderBottom: `${Math.round(carve * 6)}px solid ${C.amber}`,
            paddingBottom: 16,
          }}
        >
          TA TIN — VÌ ĐẤT CÒN GIỮ LỜI KHAI
        </div>
      </div>
    </Paper>
  );
};

// === sc-58 === GIỖ TỔ — NGÀY CẢ NƯỚC VỀ PHÚ THỌ
export const Sc58: React.FC<SceneProps> = () => {
  const A = useA();
  const tMung = A("mùng", 1); // "mùng mười tháng ba âm lịch"
  const tGios = A("Giỗ", 1); // "Giỗ Tổ Hùng Vương"
  const tNghi = A("nghỉ", 1); // "nghỉ lễ quốc gia từ 2007"
  const tVe = A("trở", 1); // "người người… trở về Phú Thọ"
  const tDen = A("Đền", 1); // "Đền Hùng trên núi Nghĩa Lĩnh là có thật"
  const tReal = A("thật", 1); // "đền tháp, bia đá, hương khói ngàn năm"
  return (
    <Paper variant="earth">
      <AbsoluteFill style={{ opacity: 0.38, filter: "blur(2px)" }}>
        <Img src={refF13} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      </AbsoluteFill>
      <AbsoluteFill style={{ pointerEvents: "none", background: "linear-gradient(to top, rgba(26,23,20,0.94) 0%, rgba(26,23,20,0.55) 45%, rgba(26,23,20,0.25) 100%)" }} />
      <div style={{ position: "absolute", left: 130, top: 130, width: 1180 }}>
        <Reveal startFrac={tMung} endFrac={tMung + 0.06}>
          <div style={{ fontFamily: FONT.body, fontWeight: 700, fontSize: 30, letterSpacing: 5, color: C.amber }}>
            MỖI NĂM · MÙNG 10 THÁNG 3 ÂM LỊCH
          </div>
        </Reveal>
        <Reveal startFrac={tGios} endFrac={tGios + 0.07}>
          <div style={{ fontFamily: FONT.display, fontWeight: 800, fontSize: 100, lineHeight: 1.08, color: C.white, marginTop: 16 }}>
            Giỗ Tổ<br />Hùng Vương
          </div>
        </Reveal>
        <SpringPop startFrac={tNghi} from={0.88} style={{ marginTop: 26 }}>
          <div style={{ fontFamily: FONT.body, fontWeight: 500, fontSize: 38, color: C.cream, background: "rgba(36,31,26,0.92)", border: `2px solid ${C.border}`, borderRadius: 10, padding: "14px 28px", display: "inline-block" }}>
            nghỉ lễ quốc gia từ năm <b style={{ color: C.amber }}><CountUp to={2007} startFrac={tNghi} endFrac={tNghi + 0.09} /></b>
          </div>
        </SpringPop>
        <Reveal startFrac={tVe} endFrac={tVe + 0.07} style={{ marginTop: 30 }}>
          <div style={{ fontFamily: FONT.display, fontWeight: 700, fontSize: 52, color: C.white }}>
            người người từ khắp nơi <span style={{ color: C.amber }}>trở về Phú Thọ</span>
          </div>
        </Reveal>
      </div>
      <div style={{ position: "absolute", right: 130, top: 170, width: 460, textAlign: "left" }}>
        <SpringPop startFrac={tDen} from={0.88}>
          <div style={{ fontFamily: FONT.display, fontWeight: 700, fontSize: 50, color: C.white, background: "rgba(36,31,26,0.94)", border: `3px solid ${C.amber}`, borderRadius: 12, padding: "22px 30px" }}>
            Đền Hùng trên núi Nghĩa Lĩnh <span style={{ color: C.amber }}>là có thật</span>
          </div>
        </SpringPop>
        <Reveal startFrac={tReal} endFrac={tReal + 0.08} style={{ marginTop: 24 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 12, alignItems: "flex-start" }}>
            {["đền tháp", "bia đá", "hương khói ngàn năm"].map((s) => (
              <Chip key={s} color={C.amber}>{s}</Chip>
            ))}
          </div>
        </Reveal>
      </div>
      <SourceTag text="nền: tranh Đền Hùng (tư liệu tập) — dim theo BIBLE" bottom={40} />
    </Paper>
  );
};

// === sc-59 === TAM GIÁC TÂM LINH TRÊN ĐỊA LÝ THẬT — bản đồ mực
export const Sc59: React.FC<SceneProps> = () => {
  const A = useA();
  // "cha, mẹ, con đứng cạnh nhau" (857.7–859.0s) — tên núi đọc ở đuôi sc-58;
  // ba đỉnh pop theo nhịp cha-mẹ-con đứng cạnh nhau, đúng trong cửa sổ sc-59.
  const tGan = A("con", 1);
  const tSim = A("đứng", 1);
  const tVan = A("nhau", 1);
  const tFam = A("sơ", 1); // "sơ đồ gia đình thần thoại" → tam giác nối
  const tGeo = A("địa", 1); // "đặt ngay trên địa lý thật"
  const tArgue = A("tranh", 1); // "tranh luận về tên vua"
  const tQueue = A("dòng", 1); // "dòng người về đền"
  const tHen = A("hẹn", 1); // "một lời hẹn đã ăn vào máu"
  const tProof = A("bằng", 1); // "bằng chứng sống động nhất"
  const peaks = [
    { t: tGan, x: 960, y: 380, name: "NÚI NGHĨA LĨNH", sub: "Đền Hùng" },
    { t: tSim, x: 600, y: 640, name: "NÚI SIM", sub: "thờ Lạc Long Quân" },
    { t: tVan, x: 1320, y: 640, name: "NÚI VẶN", sub: "thờ Âu Cơ" },
  ];
  return (
    <Paper>
      <AbsoluteFill style={{ opacity: 0.85 }}>
        <Img src={img("img-sc-59.png")} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      </AbsoluteFill>
      <AbsoluteFill style={{ pointerEvents: "none", background: "linear-gradient(to top, rgba(26,23,20,0.9) 0%, rgba(26,23,20,0.3) 40%, rgba(26,23,20,0.15) 100%)" }} />
      <svg width="1920" height="1080" viewBox="0 0 1920 1080" style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
        <InkPath d="M960 380 L600 640" startFrac={tFam} endFrac={tFam + 0.08} stroke={C.amber} strokeWidth={4} />
        <InkPath d="M600 640 L1320 640" startFrac={tFam + 0.04} endFrac={tFam + 0.12} stroke={C.amber} strokeWidth={4} />
        <InkPath d="M1320 640 L960 380" startFrac={tFam + 0.08} endFrac={tFam + 0.16} stroke={C.amber} strokeWidth={4} />
      </svg>
      {peaks.map((p, i) => (
        <SpringPop key={i} startFrac={p.t} from={0.8} style={{ position: "absolute", left: p.x, top: p.y, transform: "translate(-50%,-50%)" }}>
          <div style={{ textAlign: "center" }}>
            <div style={{ width: 22, height: 22, borderRadius: "50%", background: C.amber, boxShadow: `0 0 34px rgba(217,164,65,0.9)`, margin: "0 auto" }} />
            <div style={{ fontFamily: FONT.body, fontWeight: 700, fontSize: 34, color: C.white, marginTop: 12, background: "rgba(20,17,13,0.86)", borderRadius: 8, padding: "8px 20px", border: `2px solid ${C.amber}` }}>
              {p.name}
            </div>
            <div style={{ fontFamily: FONT.body, fontSize: 30, color: C.cream, marginTop: 8, background: "rgba(20,17,13,0.78)", borderRadius: 8, padding: "6px 16px" }}>
              {p.sub}
            </div>
          </div>
        </SpringPop>
      ))}
      <Reveal startFrac={tGeo} endFrac={tGeo + 0.07} style={{ position: "absolute", left: 130, top: 110, width: 900 }}>
        <div style={{ fontFamily: FONT.display, fontWeight: 700, fontSize: 52, color: C.white, lineHeight: 1.25 }}>
          cha — mẹ — con đứng cạnh nhau,<br />nhưng đặt ngay trên <span style={{ color: C.amber }}>địa lý thật</span>
        </div>
      </Reveal>
      <div style={{ position: "absolute", left: 130, bottom: 130, width: 1660 }}>
        <Reveal startFrac={tArgue} endFrac={tArgue + 0.06}>
          <div style={{ fontFamily: FONT.body, fontWeight: 500, fontSize: 38, color: C.cream, opacity: 0.85 }}>
            Khoa học có thể <span style={{ color: C.teal }}>tranh luận</span> về tên vua —
          </div>
        </Reveal>
        <SpringPop startFrac={tQueue} from={0.9} style={{ marginTop: 14 }}>
          <div style={{ fontFamily: FONT.display, fontWeight: 800, fontSize: 56, color: C.white }}>
            dòng người về đền mỗi mùa Giỗ Tổ <span style={{ color: C.amber }}>không cần tranh luận</span>
          </div>
        </SpringPop>
        <Reveal startFrac={tHen} endFrac={tHen + 0.07} style={{ marginTop: 18 }}>
          <div style={{ fontFamily: FONT.display, fontWeight: 700, fontSize: 44, color: C.amber }}>
            một lời hẹn đã ăn vào máu qua bao đời — bằng chứng sống động nhất
          </div>
        </Reveal>
      </div>
    </Paper>
  );
};

// === sc-60 === CA DAO THƯ PHÁP — lục bát khắc theo nhịp 2/2/2
export const Sc60: React.FC<SceneProps> = () => {
  const A = useA();
  const tDao = A("dao", 1); // "câu ca dao"
  const l1 = [A("Dù", 1), A("đi", 1), A("về", 1)]; // «Dù ai | đi ngược | về xuôi»
  const l2 = [A("Nhớ", 1), A("Giỗ", 1), A("mồng", 1)]; // «Nhớ ngày | Giỗ Tổ | mồng mười tháng ba»
  const tKeep = A("giữ", 1); // "cả dân tộc giữ được lời hẹn"
  return (
    <Paper>
      {/* FIX-08 — ghost ca dao mờ làm nền, hiện từ frame 0; từng vế thật
          (Reveal trắng đặc) sẽ phủ đúng chỗ khi chữ được đọc */}
      <Reveal startFrac={0.0} endFrac={0.03} dy={0} style={{ position: "absolute", left: 0, right: 0, top: 300, textAlign: "center", pointerEvents: "none" }}>
        <div style={{ fontFamily: FONT.display, fontWeight: 700, fontSize: 88, lineHeight: 1.5, color: C.cream, opacity: 0.12, letterSpacing: 2 }}>
          <div>Dù ai đi ngược về xuôi</div>
          <div>Nhớ ngày Giỗ Tổ mồng mười tháng ba</div>
        </div>
      </Reveal>
      <Reveal startFrac={tDao} endFrac={tDao + 0.06} style={{ position: "absolute", top: 120, left: 0, right: 0, textAlign: "center" }}>
        <div style={{ fontFamily: FONT.body, fontWeight: 700, fontSize: 32, letterSpacing: 6, color: C.amber }}>
          DÂN GIAN GÓI TẤT CẢ THÀNH MỘT CÂU CA DAO
        </div>
      </Reveal>
      <div style={{ position: "absolute", left: 0, right: 0, top: 300, textAlign: "center" }}>
        <div style={{ fontFamily: FONT.display, fontWeight: 700, fontSize: 88, lineHeight: 1.5, color: C.white, letterSpacing: 2 }}>
          <div>
            {[
              { t: l1[0], s: "Dù ai" },
              { t: l1[1], s: "đi ngược" },
              { t: l1[2], s: "về xuôi" },
            ].map((x, i) => (
              <Reveal key={`a${i}`} startFrac={x.t} endFrac={x.t + 0.05} dy={16} style={{ display: "inline-block", marginRight: 26 }}>
                {x.s}
              </Reveal>
            ))}
          </div>
          <div>
            {[
              { t: l2[0], s: "Nhớ ngày" },
              { t: l2[1], s: "Giỗ Tổ" },
              { t: l2[2], s: "mồng mười tháng ba" },
            ].map((x, i) => (
              <Reveal key={`b${i}`} startFrac={x.t} endFrac={x.t + 0.05} dy={16} style={{ display: "inline-block", marginRight: 26 }}>
                <span style={{ color: i === 2 ? C.amber : C.white }}>{x.s}</span>
              </Reveal>
            ))}
          </div>
        </div>
        <svg width="900" height="30" viewBox="0 0 900 30" style={{ marginTop: 26 }}>
          <InkPath d="M80 15 H820" startFrac={tKeep} endFrac={tKeep + 0.1} stroke={C.amber} strokeWidth={3} />
        </svg>
        <Reveal startFrac={tKeep} endFrac={tKeep + 0.08} style={{ marginTop: 30 }}>
          <div style={{ fontFamily: FONT.display, fontWeight: 700, fontSize: 50, color: C.cream }}>
            không ai ép — cả dân tộc <span style={{ color: C.amber }}>tự giữ được lời hẹn</span> qua bao thế hệ
          </div>
        </Reveal>
      </div>
      <SourceTag text="ca dao dân gian · «Dù ai đi ngược về xuôi / Nhớ ngày Giỗ Tổ mồng mười tháng ba»" bottom={48} />
    </Paper>
  );
};

// === sc-61 === DÒNG NGƯỜI VỀ ĐỀN — tranh gen + câu chốt khắc chậm
export const Sc61: React.FC<SceneProps> = () => {
  const A = useA();
  const tNoWrite = A("chữ", 1); // "…dòng chữ nào" — chữ@886.16, trong cửa sổ
  const tNoCarve = A("khắc", 1); // "không khắc được tên vua nào"
  const tNoNeed = A("cần", 1); // "hóa ra, nó không cần chữ"
  const tChot = A("nhớ", 1); // «…vẫn nhớ đường về nhà»
  const tTruyen = A("Truyền", 1); // ba kho lưu giữ
  const tKy = A("Ký", 1); // "Ký ức lưu giữ bằng nghi lễ" — canonical token viết hoa đầu câu
  const tGene = A("Gen", 1); // "Gen lưu giữ bằng dòng máu"
  return (
    <Paper>
      <AbsoluteFill style={{ opacity: 0.9 }}>
        <Img src={img("img-sc-61.png")} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      </AbsoluteFill>
      <AbsoluteFill style={{ pointerEvents: "none", background: "linear-gradient(to top, rgba(26,23,20,0.95) 0%, rgba(26,23,20,0.6) 34%, rgba(26,23,20,0.12) 65%)" }} />
      <div style={{ position: "absolute", left: 130, top: 110 }}>
        <Reveal startFrac={tNoWrite} endFrac={tNoWrite + 0.06}>
          <div style={{ fontFamily: FONT.body, fontWeight: 500, fontSize: 40, color: C.cream, background: "rgba(20,17,13,0.8)", display: "inline-block", padding: "10px 26px", borderRadius: 10 }}>
            Nước Văn Lang không chép được dòng chữ nào —
          </div>
        </Reveal>
        <Reveal startFrac={tNoCarve} endFrac={tNoCarve + 0.06} style={{ marginTop: 16 }}>
          <div style={{ fontFamily: FONT.body, fontWeight: 500, fontSize: 40, color: C.cream, background: "rgba(20,17,13,0.8)", display: "inline-block", padding: "10px 26px", borderRadius: 10 }}>
            không khắc được tên vua nào.
          </div>
        </Reveal>
        <SpringPop startFrac={tNoNeed} from={0.9} style={{ marginTop: 22 }}>
          <div style={{ fontFamily: FONT.display, fontWeight: 800, fontSize: 56, color: C.amber }}>
            Nhưng hóa ra — nó không cần chữ.
          </div>
        </SpringPop>
      </div>
      <div style={{ position: "absolute", left: 0, right: 0, bottom: 250, textAlign: "center" }}>
        <Reveal startFrac={tChot} endFrac={tChot + 0.12} dy={20}>
          <div style={{ fontFamily: FONT.display, fontWeight: 800, fontSize: 74, color: C.white, textShadow: "0 4px 26px rgba(0,0,0,0.9)" }}>
            «Dù không có chữ, cả dân tộc vẫn <span style={{ color: C.amber }}>nhớ đường về nhà</span>.»
          </div>
        </Reveal>
      </div>
      <div style={{ position: "absolute", left: 0, right: 0, bottom: 90, display: "flex", gap: 22, justifyContent: "center" }}>
        {[
          { t: tTruyen, k: "TRUYỀN THUYẾT", v: "lưu giữ bằng kể", c: C.amber },
          { t: tKy, k: "KÝ ỨC", v: "lưu giữ bằng nghi lễ", c: C.cream },
          { t: tGene, k: "GEN", v: "lưu giữ bằng dòng máu", c: C.teal },
        ].map((x, i) => (
          <SpringPop key={i} startFrac={x.t} from={0.88}>
            <div style={{ fontFamily: FONT.body, fontWeight: 700, fontSize: 32, color: x.c, border: `2px solid ${x.c}`, background: "rgba(20,17,13,0.82)", borderRadius: 999, padding: "12px 30px" }}>
              {x.k} <span style={{ color: C.cream, fontWeight: 400 }}>· {x.v}</span>
            </div>
          </SpringPop>
        ))}
      </div>
    </Paper>
  );
};

// === sc-62 === ĐỒNG BÀO — CÙNG MỘT BỌC
export const Sc62: React.FC<SceneProps> = () => {
  const A = useA();
  const tTu = A("từ", 1); // "cái từ ta từng mổ xẻ ở tập trước"
  const tBoc = A("bọc", 1); // "cùng một bọc"
  const t54 = A("Năm", 1); // "Năm mươi tư dân tộc"
  const tKyUc = A("ký", 1); // "cùng chung một ký ức về cội"
  const { frame } = useFrac();
  const spin = frame * 0.12;
  const figures = Array.from({ length: 18 }, (_, i) => (i * 20 + spin) % 360);
  return (
    <Paper>
      <AbsoluteFill style={{ opacity: 0.3, filter: "blur(3px)" }}>
        <Img src={refF06} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      </AbsoluteFill>
      <AbsoluteFill style={{ pointerEvents: "none", background: "rgba(26,23,20,0.62)" }} />
      {/* vòng silhouette trăm người con */}
      <svg width="900" height="900" viewBox="0 0 900 900" style={{ position: "absolute", left: 1090, top: 90, opacity: 0.5 }}>
        {figures.map((a, i) => {
          const r = 400;
          const x = 450 + r * Math.cos((a * Math.PI) / 180);
          const y = 450 + r * Math.sin((a * Math.PI) / 180);
          return (
            <g key={i} transform={`translate(${x},${y}) scale(1.4)`}>
              <circle cx="0" cy="-26" r="9" fill="none" stroke={C.amber} strokeWidth="3" />
              <path d="M0 -16 V14 M0 -8 L-11 2 M0 -8 L11 -4 M0 14 L-9 30 M0 14 L9 30" fill="none" stroke={C.amber} strokeWidth="3" strokeLinecap="round" />
            </g>
          );
        })}
        <circle cx="450" cy="450" r="400" fill="none" stroke={C.border} strokeWidth="2" strokeDasharray="6 10" />
      </svg>
      <div style={{ position: "absolute", left: 130, top: 170, width: 950 }}>
        <Reveal startFrac={tTu} endFrac={tTu + 0.06}>
          <div style={{ fontFamily: FONT.body, fontWeight: 700, fontSize: 30, letterSpacing: 5, color: C.amber }}>
            CÁI TỪ TA TỪNG MỔ XẺ Ở TẬP TRƯỚC
          </div>
        </Reveal>
        <SpringPop startFrac={tBoc} from={0.85} style={{ marginTop: 20 }}>
          <div style={{ fontFamily: FONT.display, fontWeight: 800, fontSize: 120, lineHeight: 1.05, color: C.white }}>
            ĐỒNG BÀO<br />
            <span style={{ fontSize: 72, color: C.amber }}>= CÙNG MỘT BỌC</span>
          </div>
        </SpringPop>
        <SpringPop startFrac={t54} from={0.88} style={{ marginTop: 34 }}>
          <div style={{ fontFamily: FONT.display, fontWeight: 800, fontSize: 96, color: C.white }}>
            <CountUp to={54} startFrac={t54} endFrac={t54 + 0.09} />
            <span style={{ fontSize: 46, color: C.cream }}> dân tộc hôm nay</span>
          </div>
        </SpringPop>
        <Reveal startFrac={tKyUc} endFrac={tKyUc + 0.07} style={{ marginTop: 26 }}>
          <div style={{ fontFamily: FONT.body, fontWeight: 500, fontSize: 42, color: C.cream, background: "rgba(36,31,26,0.92)", display: "inline-block", padding: "12px 28px", borderRadius: 10 }}>
            cùng chung <b style={{ color: C.amber }}>một ký ức về cội</b>
          </div>
        </Reveal>
      </div>
      <SourceTag text="nền: tranh chia bọc (Ep.01) — dim theo BIBLE · vòng người con: họa mực" bottom={40} />
    </Paper>
  );
};

// === sc-63 === MOTTO KHẮC MỰC ĐÓNG SỔ
export const Sc63: React.FC<SceneProps> = () => {
  const A = useA();
  const tXaHoi = A("xã", 1); // "một xã hội thật đã từng sống, hát và đúc trống"
  const tSong = A("sống", 1);
  const tVe = A("vẫn", 1); // "vẫn về Giỗ Tổ mỗi mùa xuân"
  const tM1 = A("Không", 1); // «KHÔNG TÌM THẤY TÊN VUA —
  const tM2 = A("tìm", 2); //  TÌM THẤY TIẾNG TRỐNG»
  const tDu = A("đủ", 1); // "thế là đủ" → sổ đóng lại
  const { frame, dur } = useFrac();
  const carve1 = ease(Math.max(0, Math.min(1, (frame - tM1 * dur) / (0.12 * dur))));
  const carve2 = ease(Math.max(0, Math.min(1, (frame - tM2 * dur) / (0.12 * dur))));
  const close = ease(Math.max(0, Math.min(1, (frame - (tDu + 0.03) * dur) / (0.14 * dur))));
  return (
    <Paper>
      <Reveal startFrac={tXaHoi} endFrac={tXaHoi + 0.07} style={{ position: "absolute", left: 0, right: 0, top: 150, textAlign: "center" }}>
        <div style={{ fontFamily: FONT.body, fontWeight: 500, fontSize: 42, color: C.cream }}>
          một xã hội thật đã từng <span style={{ color: C.amber }}>{`sống, hát và đúc trống`}</span> trên dải đất này —
        </div>
      </Reveal>
      <Reveal startFrac={tVe} endFrac={tVe + 0.07} style={{ position: "absolute", left: 0, right: 0, top: 260, textAlign: "center" }}>
        <div style={{ fontFamily: FONT.body, fontWeight: 500, fontSize: 42, color: C.cream }}>
          và con cháu của xã hội ấy <span style={{ color: C.amber }}>vẫn về Giỗ Tổ mỗi mùa xuân</span>.
        </div>
      </Reveal>
      <div style={{ position: "absolute", left: 0, right: 0, top: 430, textAlign: "center" }}>
        <div
          style={{
            fontFamily: FONT.display,
            fontWeight: 800,
            fontSize: 92,
            letterSpacing: 5,
            color: C.white,
            opacity: 0.2 + carve1 * 0.8,
            transform: `translateY(${(1 - carve1) * 26}px)`,
          }}
        >
          KHÔNG TÌM THẤY TÊN VUA —
        </div>
        <div
          style={{
            fontFamily: FONT.display,
            fontWeight: 800,
            fontSize: 92,
            letterSpacing: 5,
            color: C.amber,
            marginTop: 18,
            opacity: 0.2 + carve2 * 0.8,
            transform: `translateY(${(1 - carve2) * 26}px)`,
          }}
        >
          TÌM THẤY TIẾNG TRỐNG
        </div>
      </div>
      {/* triện đỏ như con dấu */}
      <svg width="200" height="200" viewBox="0 0 200 200" style={{ position: "absolute", right: 300, top: 700, opacity: carve2, transform: `rotate(${(1 - carve2) * -14}deg)` }}>
        <rect x="14" y="14" width="172" height="172" rx="14" fill="rgba(200,85,61,0.16)" stroke={C.warn} strokeWidth="7" />
        <path d="M62 100 H138 M100 62 V138" stroke={C.warn} strokeWidth="9" strokeLinecap="round" />
      </svg>
      <Reveal startFrac={tDu} endFrac={tDu + 0.05} style={{ position: "absolute", left: 0, right: 0, bottom: 150, textAlign: "center" }}>
        <div style={{ fontFamily: FONT.display, fontWeight: 700, fontSize: 52, color: C.cream }}>
          Với một dân tộc — thế là <span style={{ color: C.white }}>đủ</span>.
        </div>
      </Reveal>
      {/* SỔ ĐÓNG LẠI — hai bìa khép như sách cổ */}
      {close > 0 && (
        <>
          <AbsoluteFill
            style={{
              pointerEvents: "none",
              background: "linear-gradient(115deg, #2A2117 0%, #171310 100%)",
              borderRight: `6px solid ${C.bronze}`,
              transform: `translateX(${-50 * (1 - close)}%)`,
              opacity: close,
              display: "flex",
              alignItems: "center",
              justifyContent: "flex-end",
            }}
          >
            <div style={{ fontFamily: FONT.display, fontWeight: 800, fontSize: 60, color: C.bronze, writingMode: "vertical-rl", marginRight: 60, opacity: 0.9 }}>
              HỒI KÝ ĐẤT
            </div>
          </AbsoluteFill>
          <AbsoluteFill
            style={{
              pointerEvents: "none",
              background: "linear-gradient(245deg, #2A2117 0%, #171310 100%)",
              borderLeft: `6px solid ${C.bronze}`,
              transform: `translateX(${50 * (1 - close)}%)`,
              opacity: close,
              display: "flex",
              alignItems: "center",
            }}
          >
            <div style={{ fontFamily: FONT.display, fontWeight: 800, fontSize: 60, color: C.bronze, writingMode: "vertical-rl", marginLeft: 60, opacity: 0.9 }}>
              VN-MYTH · III
            </div>
          </AbsoluteFill>
        </>
      )}
    </Paper>
  );
};

// === sc-64 === OUTRO SERIES VN-MYTH
export const Sc64: React.FC<SceneProps> = () => {
  const A = useA();
  const tLogo = A("Đây", 1); // "Đây là vn-myth"
  const tTag = A("mỗi", 1); // "mỗi tập một truyền thuyết…"
  const tEp = A("Tập", 1); // "Tập này: Văn Lang…"
  const tShare = A("chia", 1); // "hãy chia sẻ cho một người…"
  const { frame } = useFrac();
  const pulse = 1 + 0.02 * Math.sin(frame / 9);
  return (
    <Paper>
      <div style={{ position: "absolute", left: 0, right: 0, top: 190, textAlign: "center" }}>
        <SpringPop startFrac={tLogo} from={0.8}>
          <div style={{ transform: `scale(${pulse})` }}>
            <div style={{ fontFamily: FONT.display, fontWeight: 800, fontSize: 150, letterSpacing: 14, color: C.white }}>
              VN<span style={{ color: C.amber }}>-</span>MYTH
            </div>
            <div style={{ display: "inline-block", marginTop: 8, fontFamily: FONT.body, fontWeight: 700, fontSize: 34, letterSpacing: 6, color: C.amber, border: `2px solid ${C.amber}`, borderRadius: 8, padding: "8px 26px" }}>
              TẬP 3 · VUA HÙNG TRONG ĐỒNG
            </div>
          </div>
        </SpringPop>
        <Reveal startFrac={tTag} endFrac={tTag + 0.07} style={{ marginTop: 54 }}>
          <div style={{ fontFamily: FONT.display, fontWeight: 700, fontSize: 52, color: C.cream }}>
            mỗi tập: một truyền thuyết · một bằng chứng thật
          </div>
        </Reveal>
        <SpringPop startFrac={tEp} from={0.9} style={{ marginTop: 34 }}>
          <div style={{ fontFamily: FONT.display, fontWeight: 800, fontSize: 64, color: C.white, background: "rgba(36,31,26,0.94)", border: `3px solid ${C.bronze}`, borderRadius: 12, padding: "18px 44px", display: "inline-block" }}>
            tập này: <span style={{ color: C.bronze }}>Văn Lang và tiếng trống đồng</span>
          </div>
        </SpringPop>
        <Reveal startFrac={tShare} endFrac={tShare + 0.08} style={{ marginTop: 50 }}>
          <div style={{ fontFamily: FONT.body, fontWeight: 500, fontSize: 38, color: C.cream, opacity: 0.92 }}>
            nếu thấy đáng xem — chia sẻ cho <b style={{ color: C.amber }}>một người cũng thương câu chuyện nước nhà</b>
          </div>
        </Reveal>
      </div>
      <SourceTag text="series vn-myth · tập 3/4" bottom={48} />
    </Paper>
  );
};

// === sc-65 === TEASER EP.04 — CHIẾC NỎ THẦN
export const Sc65: React.FC<SceneProps> = () => {
  const A = useA();
  const tNext = A("sau", 1); // "Tập sau"
  const tNo = A("nỏ", 1); // "chiếc nỏ thần"
  const tTrieu = A("triệu", 1); // "bắn triệu mũi tên"
  const tThanh = A("thành", 1); // "thành trì lớn nhất…"
  const tVuon = A("vương", 1); // "một câu chuyện về vương quốc…"
  const { frame, dur } = useFrac();
  const drift = ease(Math.max(0, Math.min(1, frame / Math.max(1, dur - 1))));
  return (
    <Paper>
      <AbsoluteFill style={{ transform: `scale(${1.08 + drift * 0.05})`, opacity: 0.92 }}>
        <Img src={img("img-sc-65.png")} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      </AbsoluteFill>
      <AbsoluteFill style={{ pointerEvents: "none", background: "linear-gradient(to right, rgba(26,23,20,0.92) 0%, rgba(26,23,20,0.55) 42%, rgba(26,23,20,0.1) 75%)" }} />
      <div style={{ position: "absolute", left: 130, top: 200, width: 900 }}>
        <Reveal startFrac={tNext} endFrac={tNext + 0.06}>
          <div style={{ fontFamily: FONT.body, fontWeight: 700, fontSize: 32, letterSpacing: 6, color: C.amber }}>
            TẬP SAU · EP.04
          </div>
        </Reveal>
        <SpringPop startFrac={tNo} from={0.85} style={{ marginTop: 18 }}>
          <div style={{ fontFamily: FONT.display, fontWeight: 800, fontSize: 108, lineHeight: 1.06, color: C.white }}>
            CHIẾC NỎ<br />THẦN
          </div>
        </SpringPop>
        <Reveal startFrac={tTrieu} endFrac={tTrieu + 0.06} style={{ marginTop: 26 }}>
          <div style={{ fontFamily: FONT.display, fontWeight: 700, fontSize: 52, color: C.amber }}>
            bắn <b>triệu mũi tên</b> như vệt sao
          </div>
        </Reveal>
        <Reveal startFrac={tThanh} endFrac={tThanh + 0.06} style={{ marginTop: 14 }}>
          <div style={{ fontFamily: FONT.body, fontWeight: 500, fontSize: 40, color: C.cream, background: "rgba(20,17,13,0.8)", display: "inline-block", padding: "10px 24px", borderRadius: 10 }}>
            và thành trì lớn nhất Đông Nam Á thời đó
          </div>
        </Reveal>
        <Reveal startFrac={tVuon} endFrac={tVuon + 0.08} style={{ marginTop: 30 }}>
          <div style={{ fontFamily: FONT.display, fontWeight: 700, fontSize: 46, color: C.white, fontStyle: "italic" }}>
            một câu chuyện về vương quốc đứng ngay sát bóng trống đồng ấy
          </div>
        </Reveal>
      </div>
    </Paper>
  );
};

// === sc-66 === ĐĂNG KÝ & CÂU HỎI MỞ — end card tương tác
export const Sc66: React.FC<SceneProps> = () => {
  const A = useA();
  const tSub = A("Đăng", 1); // "Đăng ký để không lỡ"
  const tQ = A("nền", 1); // "nền đất trao lại cho bạn…"
  const tKe = A("kể", 1); // "Hãy kể mình nghe ở phần bình luận"
  const { frame } = useFrac();
  const ring = 1 + 0.05 * Math.sin(frame / 7);
  return (
    <Paper>
      <div style={{ position: "absolute", left: 0, right: 0, top: 140, textAlign: "center" }}>
        <SpringPop startFrac={tSub} from={0.85}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 22,
              fontFamily: FONT.display,
              fontWeight: 800,
              fontSize: 64,
              color: "#1A1714",
              background: C.amber,
              borderRadius: 999,
              padding: "20px 56px",
              boxShadow: `0 0 ${Math.round(30 + 26 * Math.abs(Math.sin(frame / 9)))}px rgba(217,164,65,0.5)`,
              transform: `scale(${ring})`,
            }}
          >
            <svg width="52" height="58" viewBox="0 0 52 58">
              <path d="M26 4 C15 4 9 12 9 22 V34 L3 44 H49 L43 34 V22 C43 12 37 4 26 4 Z" fill="none" stroke="#1A1714" strokeWidth="5" strokeLinejoin="round" />
              <path d="M19 50 Q19 56 26 56 Q33 56 33 50" fill="none" stroke="#1A1714" strokeWidth="5" strokeLinecap="round" />
            </svg>
            ĐĂNG KÝ ĐỂ KHÔNG LỠ
          </div>
        </SpringPop>
      </div>
      <div style={{ position: "absolute", left: 200, right: 200, top: 400, textAlign: "center" }}>
        <Reveal startFrac={tQ} endFrac={tQ + 0.09} dy={26}>
          <div style={{ fontFamily: FONT.display, fontWeight: 700, fontSize: 60, lineHeight: 1.4, color: C.white }}>
            Nếu một ngày nền đất trao lại cho bạn<br />
            <span style={{ color: C.amber }}>một dòng chữ của Văn Lang</span> —<br />
            bạn mong nó viết điều gì?
          </div>
        </Reveal>
      </div>
      <div style={{ position: "absolute", left: 0, right: 0, bottom: 130, textAlign: "center" }}>
        <SpringPop startFrac={tKe} from={0.9}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 16, fontFamily: FONT.body, fontWeight: 500, fontSize: 40, color: C.cream, border: `2px solid ${C.border}`, background: "rgba(36,31,26,0.92)", borderRadius: 999, padding: "16px 40px" }}>
            <svg width="40" height="40" viewBox="0 0 40 40">
              <path d="M4 6 H36 V28 H14 L4 36 Z" fill="none" stroke={C.cream} strokeWidth="4" strokeLinejoin="round" />
              <path d="M12 14 H28 M12 21 H22" stroke={C.cream} strokeWidth="4" strokeLinecap="round" />
            </svg>
            kể mình nghe ở phần bình luận
          </div>
        </SpringPop>
      </div>
      <div style={{ position: "absolute", left: 0, right: 0, bottom: 48, textAlign: "center" }}>
        <span style={{ fontFamily: FONT.display, fontWeight: 700, fontSize: 30, letterSpacing: 4, color: C.mute }}>
          VN-MYTH · EP.03 · VUA HÙNG TRONG ĐỒNG
        </span>
      </div>
    </Paper>
  );
};
