// VN-Myth Ep.03 — scenes group B: sc-13..sc-24 (Đồng Đậu, 4 tầng văn hóa,
// hero timeline cuộn dọc, hai rail khớp nhau, mini-reveal, hai cột khuyết bổ sung).
import React from "react";
import { AbsoluteFill, Img, staticFile, useCurrentFrame } from "remotion";
import { C, FONT, SceneProps } from "./theme";
import {
  Chip,
  InkImageScene,
  LegendFrame,
  Paper,
  Reveal,
  SoundRipples,
  SourceTag,
  SpringPop,
  useA,
  useFrac,
  ease,
} from "./common";
import refF11 from "../../../projects/vua-hung-trong-dong/assets/reference/f11-dong-son.png";
import refPottery from "../../../projects/vua-hung-trong-dong/assets/reference/dong-dau-pottery-animals.jpg";

const img = (name: string) => staticFile(`vua-hung-trong-dong/images/${name}`);

// === sc-13 === HỐ KHAI QUẬT ĐỒNG ĐẬU — cutaway crane down
export const Sc13: React.FC<SceneProps> = () => {
  const A = useA();
  const tTitle = A("Di", 1);
  const tSub = A("xã", 1);
  const tGlow = A("Từ", 1);
  const { frame, dur } = useFrac();
  const t = Math.max(0, Math.min(1, frame / Math.max(1, dur - 1)));
  const crane = `translateY(${(1 - t) * 90}px) scale(${1.16 - t * 0.06})`;
  return (
    <Paper variant="earth">
      <AbsoluteFill style={{ transform: crane, overflow: "hidden" }}>
        <Img src={img("img-sc-13.png")} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      </AbsoluteFill>
      <AbsoluteFill
        style={{
          pointerEvents: "none",
          background:
            "linear-gradient(to top, rgba(26,23,20,0.92) 0%, rgba(26,23,20,0.35) 30%, rgba(26,23,20,0.05) 60%)",
        }}
      />
      {/* các tầng phát sáng tuần tự */}
      <svg width="1920" height="1080" viewBox="0 0 1920 1080" style={{ position: "absolute", inset: 0 }}>
        {[0, 1, 2, 3].map((i) => {
          const g = ease(Math.max(0, Math.min(1, (frame - (tGlow + i * 0.05) * dur) / (0.08 * dur))));
          return (
            <rect
              key={i}
              x="0"
              y={520 + i * 120}
              width={g * 1920}
              height="8"
              fill={C.earthGlow}
              opacity={0.5 + 0.3 * g}
              style={{ filter: `drop-shadow(0 0 12px rgba(201,143,78,${g}))` }}
            />
          );
        })}
      </svg>
      <div style={{ position: "absolute", left: 96, bottom: 150, right: 96 }}>
        <Reveal startFrac={tTitle} endFrac={tTitle + 0.06}>
          <div style={{ fontFamily: FONT.body, fontWeight: 700, fontSize: 30, letterSpacing: 5, color: C.earthGlow }}>
            HỒI MỘT · XUỐNG ĐẤT
          </div>
        </Reveal>
        <Reveal startFrac={tTitle + 0.02} endFrac={tTitle + 0.1}>
          <div style={{ fontFamily: FONT.display, fontWeight: 800, fontSize: 92, color: C.white }}>
            DI CHỈ ĐỒNG ĐẬU
          </div>
        </Reveal>
        <Reveal startFrac={tSub} endFrac={tSub + 0.07}>
          <div style={{ fontFamily: FONT.body, fontSize: 40, color: C.cream, marginTop: 14 }}>
            Gò Đậu · xã Yên Lạc · tỉnh Vĩnh Phúc
          </div>
        </Reveal>
      </div>
    </Paper>
  );
};

// === sc-14 === STAT CARD ĐỒNG ĐẬU — 85.000 m² count-up
export const Sc14: React.FC<SceneProps> = () => {
  const A = useA();
  const tArea = A("tám", 1);
  const tChong = A("chồng", 1);
  const tC14 = A("trăm", 1);
  const tMany = A("nhiều", 2);
  return (
    <Paper variant="earth">
      <div style={{ position: "absolute", left: 360, right: 360, top: 220 }}>
        <div
          style={{
            border: `3px solid ${C.earth}`,
            borderRadius: 12,
            background: "rgba(36,31,26,0.94)",
            padding: "56px 64px",
          }}
        >
          <div style={{ display: "flex", alignItems: "baseline", gap: 28 }}>
            <SpringPop startFrac={tArea} from={0.9}>
              <span style={{ fontFamily: FONT.display, fontWeight: 800, fontSize: 150, color: C.white }}>
                85.000
              </span>
            </SpringPop>
            <span style={{ fontFamily: FONT.body, fontSize: 52, color: C.earthGlow }}>m²</span>
          </div>
          <Reveal startFrac={tChong} endFrac={tChong + 0.06}>
            <div style={{ fontFamily: FONT.body, fontSize: 42, color: C.cream, marginTop: 24, lineHeight: 1.4 }}>
              Tại đúng một chỗ — <b style={{ color: C.earthGlow }}>các tầng văn hóa chồng liên tục</b>
            </div>
          </Reveal>
          <Reveal startFrac={tC14} endFrac={tC14 + 0.06}>
            <div style={{ fontFamily: FONT.body, fontSize: 42, color: C.cream, marginTop: 14 }}>
              Lớp sớm nhất định tuổi <Chip color={C.earthGlow}>~3.500 năm (C14)</Chip>
            </div>
          </Reveal>
          <Reveal startFrac={tMany} endFrac={tMany + 0.07}>
            <div style={{ fontFamily: FONT.display, fontWeight: 700, fontSize: 50, color: C.white, marginTop: 30 }}>
              «Một chỗ, nhiều tầng — nghĩa là người ở liên tục, không đứt mạch.»
            </div>
          </Reveal>
        </div>
      </div>
      <SourceTag text="Di chỉ Đồng Đậu — Vĩnh Phúc" bottom={54} right />
    </Paper>
  );
};

// === sc-15 === CUỐN SỬ KHÔNG LỜI — book of strata, lật từng trang
export const Sc15: React.FC<SceneProps> = () => {
  const A = useA();
  const tBook = A("nghĩa", 1);
  const tFlip = A("đào", 1);
  const tQuote = A("lật", 1);
  const tSeal = A("đứt", 1);
  const { frame, dur } = useFrac();
  const pages = [0, 1, 2, 3, 4, 5];
  return (
    <Paper variant="earth">
      <div style={{ position: "absolute", left: 300, right: 300, top: 180 }}>
        <Reveal startFrac={tBook} endFrac={tBook + 0.08}>
          <div style={{ fontFamily: FONT.display, fontWeight: 700, fontSize: 60, color: C.white, textAlign: "center" }}>
            Một cuốn sử — viết bằng đất
          </div>
        </Reveal>
        <div style={{ marginTop: 50, perspective: 1200 }}>
          {pages.map((i) => {
            const flipT = ease(
              Math.max(0, Math.min(1, (frame - (tFlip + i * 0.05) * dur) / (0.09 * dur)))
            );
            const shown = i === 5 ? 1 : 1 - flipT;
            if (shown <= 0.02) return null;
            return (
              <div
                key={i}
                style={{
                  height: 92,
                  marginBottom: 10,
                  background: `linear-gradient(180deg, rgba(${92 + i * 8},${61 + i * 5},${34 + i * 3},${0.55 + 0.06 * i}) , rgba(36,31,26,0.9))`,
                  border: `2px solid ${C.earthDeep}`,
                  borderRadius: 8,
                  transform: `rotateX(${flipT * -78}deg) translateY(${flipT * -40}px)`,
                  transformOrigin: "bottom center",
                  opacity: shown,
                  padding: "0 34px",
                  display: "flex",
                  alignItems: "center",
                  gap: 22,
                }}
              >
                <span style={{ fontFamily: FONT.mono, fontSize: 26, color: C.earthGlow }}>{`trang ${i + 1}`}</span>
                <span style={{ width: 46, height: 12, borderRadius: 6, background: i % 2 ? C.earth : C.earthGlow, opacity: 0.7 }} />
                <span style={{ width: 80, height: 12, borderRadius: 6, background: C.border, opacity: 0.8 }} />
                <span style={{ width: 56, height: 12, borderRadius: 6, background: C.teal, opacity: i > 3 ? 0.6 : 0.25 }} />
              </div>
            );
          })}
        </div>
      </div>
      <Reveal startFrac={tQuote} endFrac={tQuote + 0.08} style={{ position: "absolute", bottom: 130, left: 0, right: 0, textAlign: "center" }}>
        <span style={{ fontFamily: FONT.display, fontWeight: 700, fontSize: 46, color: C.cream }}>
          «Đào từng lớp — như lật từng trang của một cuốn sử không lời.»
        </span>
      </Reveal>
      <SpringPop startFrac={tSeal} from={0.9} style={{ position: "absolute", bottom: 52, left: 0, right: 0, textAlign: "center" }}>
        <span style={{ fontFamily: FONT.body, fontWeight: 700, fontSize: 36, color: C.earthGlow, letterSpacing: 3 }}>
          KHÔNG BỎ ĐI — KHÔNG ĐỨT MẠCH
        </span>
      </SpringPop>
    </Paper>
  );
};

// === sc-16 === TẦNG PHÙNG NGUYÊN — stat card tầng sâu nhất
export const Sc16: React.FC<SceneProps> = () => {
  const A = useA();
  const tCard = A("sâu", 1);
  const tBar = A("hai", 1);
  const tGom = A("gốm", 1);
  const tDa = A("ngọc", 1);
  const tLua = A("hạt", 1);
  const { frame, dur } = useFrac();
  const bar = ease(Math.max(0, Math.min(1, (frame - tBar * dur) / (0.1 * dur))));
  return (
    <Paper variant="earth">
      <div style={{ position: "absolute", left: 330, right: 330, top: 180 }}>
        <SpringPop startFrac={tCard} from={0.92}>
          <div
            style={{
              border: `3px solid ${C.earth}`,
              borderRadius: 12,
              background: "rgba(36,31,26,0.94)",
              padding: "48px 60px",
            }}
          >
            <div style={{ fontFamily: FONT.body, fontWeight: 700, fontSize: 30, letterSpacing: 4, color: C.earthGlow }}>
              LỚP SÂU NHẤT
            </div>
            <div style={{ fontFamily: FONT.display, fontWeight: 800, fontSize: 96, color: C.white, marginTop: 8 }}>
              TẦNG PHÙNG NGUYÊN
            </div>
            <div style={{ marginTop: 30, position: "relative", height: 60 }}>
              <div style={{ position: "absolute", inset: 0, background: C.border, borderRadius: 8 }} />
              <div
                style={{
                  position: "absolute",
                  left: 0,
                  top: 0,
                  bottom: 0,
                  width: `${bar * 100}%`,
                  background: `linear-gradient(90deg, ${C.earthGlow}, ${C.amber})`,
                  borderRadius: 8,
                }}
              />
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "0 26px",
                  fontFamily: FONT.mono,
                  fontSize: 32,
                  color: "#1A1714",
                  fontWeight: 700,
                }}
              >
                <span>~2000 TCN</span>
                <span>~1500 TCN</span>
              </div>
            </div>
            <div style={{ display: "flex", gap: 24, marginTop: 36 }}>
              {[
                { t: tGom, txt: "gốm vạch hoa văn" },
                { t: tDa, txt: "đá ngọc mài giỏi" },
                { t: tLua, txt: "HẠT LÚA CHÁY", hot: true },
              ].map((c, i) => (
                <SpringPop key={i} startFrac={c.t} from={0.8}>
                  <span
                    style={{
                      display: "inline-block",
                      padding: "16px 26px",
                      border: `2px solid ${c.hot ? C.amber : C.border}`,
                      borderRadius: 10,
                      fontFamily: FONT.body,
                      fontWeight: c.hot ? 700 : 500,
                      fontSize: 32,
                      color: c.hot ? C.amber : C.cream,
                      background: c.hot ? "rgba(217,164,65,0.12)" : "rgba(26,23,20,0.7)",
                    }}
                  >
                    {c.txt}
                  </span>
                </SpringPop>
              ))}
            </div>
          </div>
        </SpringPop>
      </div>
      <Reveal startFrac={tLua + 0.06} endFrac={tLua + 0.14} style={{ position: "absolute", bottom: 80, left: 0, right: 0, textAlign: "center" }}>
        <span style={{ fontFamily: FONT.display, fontWeight: 700, fontSize: 48, color: C.amber }}>
          «Trong tầng Phùng Nguyên tại Đồng Đậu — có hạt lúa cháy.»
        </span>
      </Reveal>
    </Paper>
  );
};

// === sc-17 === GỐM PHÙNG NGUYÊN & HẠT LÚA CHÁY — gen image + ảnh thật inset
export const Sc17: React.FC<SceneProps> = () => {
  const A = useA();
  const tInset = A("chứng", 1);
  const tQuote = A("Nền", 1);
  return (
    <Paper variant="earth">
      <AbsoluteFill>
        <Img src={img("img-sc-17.png")} style={{ width: "100%", height: "100%", objectFit: "cover", opacity: 0.92 }} />
      </AbsoluteFill>
      <AbsoluteFill
        style={{
          pointerEvents: "none",
          background:
            "linear-gradient(90deg, rgba(26,23,20,0.9) 0%, rgba(26,23,20,0.4) 55%, rgba(26,23,20,0.15) 100%), linear-gradient(to top, rgba(26,23,20,0.95) 0%, rgba(26,23,20,0.3) 35%, rgba(0,0,0,0) 60%)",
        }}
      />
      {/* khung ảnh thật đối chiếu */}
      <SpringPop startFrac={tInset} from={0.88} style={{ position: "absolute", right: 90, top: 140, width: 560 }}>
        <div style={{ border: `3px solid ${C.cream}`, borderRadius: 10, padding: 10, background: "rgba(20,17,13,0.85)" }}>
          <Img src={refPottery} style={{ width: "100%", height: 300, objectFit: "cover", borderRadius: 6 }} />
          <div style={{ fontFamily: FONT.body, fontSize: 26, color: C.cream, marginTop: 10, lineHeight: 1.35 }}>
            Gốm & hình thú Đồng Đậu (ảnh thật) — CC0
          </div>
        </div>
      </SpringPop>
      <div style={{ position: "absolute", left: 96, bottom: 130, right: 720 }}>
        <SpringPop startFrac={tQuote} from={0.92}>
          <div style={{ fontFamily: FONT.display, fontWeight: 800, fontSize: 62, color: C.white, lineHeight: 1.25 }}>
            «Nền của mọi thứ bắt đầu từ <span style={{ color: C.amber }}>hạt thóc</span> —
            không phải từ <span style={{ opacity: 0.55, textDecoration: "line-through" }}>vương miện</span>.»
          </div>
        </SpringPop>
      </div>
    </Paper>
  );
};

// === sc-18 === TẦNG ĐỒNG ĐẬU — stat card tầng 2
export const Sc18: React.FC<SceneProps> = () => {
  const A = useA();
  const tCard = A("Lớn", 1);
  const tBar = A("một", 2);
  const tThau = A("thau", 1);
  const tChips = A("đầu", 1);
  const { frame, dur } = useFrac();
  const bar = ease(Math.max(0, Math.min(1, (frame - tBar * dur) / (0.1 * dur))));
  return (
    <Paper variant="earth">
      <div style={{ position: "absolute", left: 330, right: 330, top: 170 }}>
        <SpringPop startFrac={tCard} from={0.92}>
          <div
            style={{
              border: `3px solid ${C.earth}`,
              borderRadius: 12,
              background: "rgba(36,31,26,0.94)",
              padding: "48px 60px",
            }}
          >
            <div style={{ fontFamily: FONT.body, fontWeight: 700, fontSize: 30, letterSpacing: 4, color: C.earthGlow }}>
              LỚN LÊN MỘT TẦNG
            </div>
            <div style={{ fontFamily: FONT.display, fontWeight: 800, fontSize: 96, color: C.white, marginTop: 8 }}>
              TẦNG ĐỒNG ĐẬU
            </div>
            <div style={{ marginTop: 30, position: "relative", height: 60 }}>
              <div style={{ position: "absolute", inset: 0, background: C.border, borderRadius: 8 }} />
              <div
                style={{
                  position: "absolute",
                  left: 0,
                  top: 0,
                  bottom: 0,
                  width: `${bar * 100}%`,
                  background: `linear-gradient(90deg, ${C.amber}, ${C.earthGlow})`,
                  borderRadius: 8,
                }}
              />
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "0 26px",
                  fontFamily: FONT.mono,
                  fontSize: 32,
                  fontWeight: 700,
                  color: "#1A1714",
                }}
              >
                <span>~1500 TCN</span>
                <span>~1000 TCN</span>
              </div>
            </div>
            <SpringPop startFrac={tThau} from={0.8} style={{ marginTop: 34 }}>
              <div style={{ fontFamily: FONT.display, fontWeight: 800, fontSize: 64, color: C.amber }}>
                ĐỒNG THAU XUẤT HIỆN LẦN ĐẦU
              </div>
            </SpringPop>
            <div style={{ display: "flex", gap: 22, marginTop: 30 }}>
              {["LÒ", "THỢ", "KỸ THUẬT CHUYỀN TAY"].map((c, i) => (
                <SpringPop key={c} startFrac={tChips + i * 0.03} from={0.8}>
                  <Chip color={C.earthGlow}>{c}</Chip>
                </SpringPop>
              ))}
            </div>
          </div>
        </SpringPop>
      </div>
    </Paper>
  );
};

// === sc-19 === LÒ LUYỆN ĐỒNG THẬU RỰC LỬA — embers
export const Sc19: React.FC<SceneProps> = () => {
  const A = useA();
  const tCenter = A("Nghĩa", 1);
  const tLo = A("lò", 1);
  const tTho = A("thợ", 1);
  const tChuyen = A("chuyền", 1);
  const tDetail = A("in", 1);
  const { frame } = useFrac();
  const sparks = Array.from({ length: 22 }, (_, i) => i);
  return (
    <Paper variant="earth">
      <AbsoluteFill>
        <Img src={img("img-sc-19.png")} style={{ width: "100%", height: "100%", objectFit: "cover", opacity: 0.9 }} />
      </AbsoluteFill>
      <AbsoluteFill
        style={{
          pointerEvents: "none",
          background:
            "radial-gradient(ellipse at 42% 55%, rgba(217,164,65,0.10) 0%, rgba(0,0,0,0) 45%), linear-gradient(to top, rgba(26,23,20,0.94) 0%, rgba(26,23,20,0.25) 40%, rgba(0,0,0,0) 65%)",
        }}
      />
      <svg width="1920" height="1080" viewBox="0 0 1920 1080" style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
        {sparks.map((i) => {
          const sx = 560 + ((i * 173) % 800);
          const phase = (frame * (3 + (i % 4)) + i * 61) % 900;
          return (
            <circle
              key={i}
              cx={sx + Math.sin((frame + i * 20) / 14) * 18}
              cy={760 - phase}
              r={2 + (i % 3)}
              fill={i % 3 === 0 ? C.amber : C.earthGlow}
              opacity={Math.max(0, 0.85 - phase / 900)}
            />
          );
        })}
      </svg>
      <div style={{ position: "absolute", left: 96, top: 130, width: 900 }}>
        <SpringPop startFrac={tCenter} from={0.92}>
          <div style={{ fontFamily: FONT.display, fontWeight: 700, fontSize: 58, color: C.white, lineHeight: 1.3, textShadow: "0 2px 14px rgba(0,0,0,0.8)" }}>
            «Trung tâm luyện kim đồng thau — lớn của lưu vực sông Hồng.»
          </div>
        </SpringPop>
        <div style={{ display: "flex", gap: 20, marginTop: 36 }}>
          {[
            { t: tLo, c: "CÓ LÒ" },
            { t: tTho, c: "CÓ THỢ" },
            { t: tChuyen, c: "KỸ THUẬT CHUYỀN TAY" },
          ].map((x) => (
            <SpringPop key={x.c} startFrac={x.t} from={0.8}>
              <Chip color={C.amber}>{x.c}</Chip>
            </SpringPop>
          ))}
        </div>
      </div>
      <Reveal startFrac={tDetail} endFrac={tDetail + 0.09} style={{ position: "absolute", bottom: 70, left: 0, right: 0, textAlign: "center" }}>
        <span style={{ fontFamily: FONT.body, fontSize: 36, color: C.cream, background: "rgba(20,17,13,0.8)", padding: "12px 30px", borderRadius: 8 }}>
          Tên di chỉ trùng tên tầng — <b style={{ color: C.amber }}>gò Đậu in lên cả một thời đại</b>
        </span>
      </Reveal>
    </Paper>
  );
};

// === sc-20 === GÒ MUN & ĐÔNG SƠN — stat card kép trên ảnh
export const Sc20: React.FC<SceneProps> = () => {
  const A = useA();
  const tGM = A("Gò", 1);
  const tDS = A("Đông", 1);
  const tTrong = A("hiện", 1);
  return (
    <Paper variant="earth">
      <AbsoluteFill>
        <Img src={img("img-sc-20.png")} style={{ width: "100%", height: "100%", objectFit: "cover", opacity: 0.55, filter: "brightness(0.75)" }} />
      </AbsoluteFill>
      <AbsoluteFill
        style={{
          pointerEvents: "none",
          background: "linear-gradient(90deg, rgba(26,23,20,0.94) 0%, rgba(26,23,20,0.75) 48%, rgba(26,23,20,0.35) 100%)",
        }}
      />
      <div style={{ position: "absolute", left: 110, top: 150, width: 1000 }}>
        <SpringPop startFrac={tGM} from={0.92}>
          <div
            style={{
              border: `3px solid ${C.earth}`,
              borderRadius: 12,
              background: "rgba(36,31,26,0.94)",
              padding: "36px 44px",
            }}
          >
            <div style={{ fontFamily: FONT.display, fontWeight: 800, fontSize: 66, color: C.white }}>TẦNG GÒ MUN</div>
            <div style={{ fontFamily: FONT.mono, fontSize: 32, color: C.earthGlow, marginTop: 8 }}>~1100 – 800 TCN</div>
            <div style={{ fontFamily: FONT.body, fontSize: 34, color: C.cream, marginTop: 14, lineHeight: 1.4 }}>
              Đồ đồng <b>phổ cập</b> — thành rìu, thành dao, thành lưỡi cày
            </div>
          </div>
        </SpringPop>
        <SpringPop startFrac={tDS} from={0.92} style={{ marginTop: 30, marginLeft: 70 }}>
          <div
            style={{
              border: `3px solid ${C.amber}`,
              borderRadius: 12,
              background: "rgba(36,31,26,0.96)",
              padding: "36px 44px",
            }}
          >
            <div style={{ fontFamily: FONT.display, fontWeight: 800, fontSize: 66, color: C.white }}>TẦNG ĐÔNG SƠN</div>
            <div style={{ fontFamily: FONT.mono, fontSize: 32, color: C.amber, marginTop: 8 }}>~800 TCN trở đi</div>
            <div style={{ fontFamily: FONT.body, fontSize: 34, color: C.cream, marginTop: 14 }}>
              Hiện vật đỉnh cao:
            </div>
            <SpringPop startFrac={tTrong + 0.04} from={0.7} style={{ marginTop: 10 }}>
              <div style={{ fontFamily: FONT.display, fontWeight: 800, fontSize: 84, color: C.amber, textShadow: `0 0 30px rgba(217,164,65,0.5)` }}>
                TRỐNG ĐỒNG
              </div>
            </SpringPop>
          </div>
        </SpringPop>
      </div>
    </Paper>
  );
};

// === sc-21 === HERO HỒI MỘT — TIMELINE CUỘN DỌC 4 TẦNG (probe #3)
const TIERS = [
  { name: "PHÙNG NGUYÊN", era: "~2000–1500 TCN", note: "gốm + hạt lúa cháy", icon: "gốm" },
  { name: "ĐỒNG ĐẬU", era: "~1500–1000 TCN", note: "lò đồng thau", icon: "lò" },
  { name: "GÒ MUN", era: "~1100–800 TCN", note: "đồng phổ cập", icon: "rìu" },
  { name: "ĐÔNG SƠN", era: "~800 TCN →", note: "TRỐNG ĐỒNG", icon: "trống" },
];

export const Sc21: React.FC<SceneProps> = () => {
  const A = useA();
  const tTiers = [A("gốm", 1), A("lò", 1), A("khắp", 1), A("trống", 2)];
  const tDrum = A("trống", 2);
  const tQ1 = A("đoạn", 1);
  const tQ2 = A("lớp", 1);
  const { frame, dur } = useFrac();
  const scroll = ease(Math.max(0, Math.min(1, (frame - 0.08 * dur) / (0.8 * dur))));
  const drumT = ease(Math.max(0, Math.min(1, (frame - (tDrum + 0.05) * dur) / (0.12 * dur))));
  const yBase = 150 + (1 - scroll) * 520;
  return (
    <Paper variant="earth">
      <Reveal startFrac={0.02} endFrac={0.07} style={{ position: "absolute", top: 70, left: 0, right: 0, textAlign: "center" }}>
        <span style={{ fontFamily: FONT.body, fontWeight: 700, fontSize: 32, letterSpacing: 6, color: C.earthGlow }}>
          GÒ ĐẬU — ĐỌC NHƯ MỘT DÒNG CHỮ LIỀN MẠCH
        </span>
      </Reveal>
      {/* trục đứng */}
      <svg width="1920" height="1080" viewBox="0 0 1920 1080" style={{ position: "absolute", inset: 0 }}>
        <rect
          x="952"
          y={yBase - 40}
          width="16"
          height={Math.max(60, 860 * scroll + 120)}
          rx="8"
          fill={C.earthDeep}
        />
      </svg>
      {TIERS.map((tier, i) => {
        const t = tTiers[i];
        const lit = ease(Math.max(0, Math.min(1, (frame - t * dur) / (0.07 * dur))));
        const y = yBase + 700 - i * 205;
        const left = i % 2 === 0;
        return (
          <div
            key={tier.name}
            style={{
              position: "absolute",
              left: left ? 300 : 1060,
              top: y,
              width: 560,
              opacity: 0.25 + 0.75 * lit,
              transform: `translateY(${(1 - lit) * 26}px)`,
            }}
          >
            <div
              style={{
                border: `3px solid ${i === 3 ? C.amber : C.earth}`,
                borderLeft: left ? undefined : `8px solid ${i === 3 ? C.amber : C.earth}`,
                borderRight: left ? `8px solid ${i === 3 ? C.amber : C.earth}` : undefined,
                background: "rgba(36,31,26,0.94)",
                borderRadius: 10,
                padding: "22px 30px",
                boxShadow: lit > 0.5 ? `0 0 26px rgba(201,143,78,${0.25 * lit})` : undefined,
              }}
            >
              <div style={{ fontFamily: FONT.display, fontWeight: 800, fontSize: 54, color: i === 3 ? C.amber : C.white }}>
                {tier.name}
              </div>
              <div style={{ fontFamily: FONT.mono, fontSize: 28, color: C.earthGlow, marginTop: 4 }}>{tier.era}</div>
              <div style={{ fontFamily: FONT.body, fontSize: 30, color: C.cream, marginTop: 6 }}>{tier.note}</div>
            </div>
            {/* hiện vật mini */}
            <svg width="120" height="90" viewBox="0 0 120 90" style={{ position: "absolute", top: 14, [left ? "right" : "left"]: -140, opacity: lit }}>
              {i === 0 && <g stroke={C.cream} strokeWidth="4" fill="none"><path d="M20 50 h80 M20 50 l-8 -18 M50 50 l-6 -18 M80 50 l-6 -18" /></g>}
              {i === 1 && <g stroke={C.earthGlow} strokeWidth="4" fill="none"><path d="M30 20 h60 v50 h-60 z M45 35 h30 M45 50 h30" /><path d="M60 8 l10 12 h-20 z" fill={C.amber} /></g>}
              {i === 2 && <g stroke={C.cream} strokeWidth="4" fill="none"><path d="M20 55 l50 -30 M55 18 l16 26 M28 68 a16 16 0 1 0 32 0 a16 16 0 1 0 -32 0" /></g>}
              {i === 3 && (
                <g stroke={C.amber} strokeWidth="4" fill="none">
                  <circle cx="60" cy="40" r="30" />
                  <circle cx="60" cy="40" r="16" opacity="0.6" />
                </g>
              )}
            </svg>
          </div>
        );
      })}
      {/* trống đồng kết — reuse tranh f11 + sóng âm */}
      <div
        style={{
          position: "absolute",
          right: 140,
          top: yBase - 210,
          width: 300,
          opacity: drumT,
          transform: `scale(${0.8 + 0.25 * drumT})`,
        }}
      >
        <Img
          src={refF11}
          style={{ width: 300, height: 300, objectFit: "cover", borderRadius: "50%", border: `6px solid ${C.amber}`, filter: "brightness(0.95)" }}
        />
      </div>
      <SoundRipples cx={1290} cy={yBase - 60} startFrac={tDrum + 0.08} count={3} maxR={420} color={C.amber} />
      <Reveal startFrac={tQ1} endFrac={tQ1 + 0.05} style={{ position: "absolute", bottom: 118, left: 0, right: 0, textAlign: "center" }}>
        <span style={{ fontFamily: FONT.display, fontWeight: 800, fontSize: 54, color: C.white }}>«Không một đoạn đứt.»</span>
      </Reveal>
      <Reveal startFrac={tQ2} endFrac={tQ2 + 0.05} style={{ position: "absolute", bottom: 40, left: 0, right: 0, textAlign: "center" }}>
        <span style={{ fontFamily: FONT.display, fontWeight: 800, fontSize: 54, color: C.amber }}>«Không một lớp bỏ trống.»</span>
      </Reveal>
    </Paper>
  );
};

// === sc-22 === HAI RAIL: TRUYỀN THUYẾT HỢP CHUỖI TẦNG
export const Sc22: React.FC<SceneProps> = () => {
  const A = useA();
  const tTop = A("Hãy", 1);
  const tBot = A("đặt", 1);
  const tMatch = A("khớp", 1);
  const tFlag = A("nhịp", 1);
  const { frame, dur } = useFrac();
  const segs = [0, 1, 2, 3];
  // FIX-08: scaffold rail mờ — hiện ngay từ frame 0, mờ đủ để không tranh chấp
  const scaffoldIn = ease(Math.max(0, Math.min(1, frame / (0.03 * dur))));
  return (
    <Paper>
      {/* FIX-08 scaffold — bản mờ của hai rail + mối nối, chống màn hình trống đầu cảnh */}
      <svg width="1920" height="1080" viewBox="0 0 1920 1080" style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
        <g opacity={0.16 * scaffoldIn}>
          <rect x="150" y="190" width="1620" height="88" rx="10" fill="none" stroke={C.amber} strokeWidth="2" strokeDasharray="10 12" />
          <rect x="150" y="620" width="1620" height="88" rx="10" fill="none" stroke={C.earth} strokeWidth="2" strokeDasharray="10 12" />
          {segs.map((i) => (
            <path key={`c${i}`} d={`M${330 + i * 420} 480 V600`} stroke={C.border} strokeWidth="2" strokeDasharray="6 12" />
          ))}
        </g>
      </svg>
      {/* rail truyền thuyết — amber mờ */}
      <Reveal startFrac={tTop} endFrac={tTop + 0.07} style={{ position: "absolute", left: 150, right: 150, top: 190 }}>
        <div
          style={{
            border: `2px dashed ${C.amber}`,
            borderRadius: 10,
            background: "rgba(217,164,65,0.08)",
            padding: "18px 30px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            opacity: 0.85,
          }}
        >
          <span style={{ fontFamily: FONT.body, fontWeight: 700, fontSize: 34, color: C.amber }}>
            TRUYỀN THUYẾT KỂ — các vua Hùng
          </span>
          <span style={{ fontFamily: FONT.body, fontSize: 28, color: C.cream, opacity: 0.8 }}>đóng khung phỏng đoán</span>
        </div>
      </Reveal>
      {/* rail tầng đất */}
      <Reveal startFrac={tBot} endFrac={tBot + 0.07} style={{ position: "absolute", left: 150, right: 150, top: 620 }}>
        <div
          style={{
            border: `3px solid ${C.earth}`,
            borderRadius: 10,
            background: "rgba(92,61,34,0.25)",
            padding: "18px 30px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span style={{ fontFamily: FONT.body, fontWeight: 700, fontSize: 34, color: C.earthGlow }}>
            CHUỖI TẦNG: Phùng Nguyên → Đồng Đậu → Gò Mun → Đông Sơn
          </span>
        </div>
      </Reveal>
      {/* các cặp khớp — dấu cộng */}
      {segs.map((i) => {
        const m = ease(Math.max(0, Math.min(1, (frame - (tMatch + i * 0.035) * dur) / (0.05 * dur))));
        const x = 330 + i * 420;
        return (
          <svg key={i} width="1920" height="1080" viewBox="0 0 1920 1080" style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
            <path d={`M${x} 470 V620`} stroke={C.cream} strokeWidth="4" opacity={m * 0.8} />
            <g opacity={m}>
              <circle cx={x} cy={545} r="34" fill="rgba(36,31,26,0.95)" stroke={C.cream} strokeWidth="3" />
              <path d={`M${x - 16} 545 h32 M${x} 529 v32`} stroke={C.amber} strokeWidth="6" strokeLinecap="round" />
            </g>
          </svg>
        );
      })}
      <SpringPop startFrac={tFlag} from={0.85} style={{ position: "absolute", right: 150, bottom: 120 }}>
        <div
          style={{
            border: `2px solid ${C.teal}`,
            background: "rgba(26,23,20,0.85)",
            borderRadius: 8,
            padding: "18px 26px",
            fontFamily: FONT.body,
            fontSize: 30,
            color: C.teal,
            maxWidth: 560,
            lineHeight: 1.35,
          }}
        >
          ⚑ nguồn gốc <b>bản địa</b>: các tầng chồng liên tục tại một chỗ
        </div>
      </SpringPop>
      <Reveal startFrac={tMatch + 0.14} endFrac={tMatch + 0.2} style={{ position: "absolute", top: 480, left: 0, right: 0, textAlign: "center" }}>
        <span style={{ fontFamily: FONT.display, fontWeight: 700, fontSize: 44, color: C.white }}>
          «Trình tự khớp — không sớm hơn, không lệch nhịp.»
        </span>
      </Reveal>
    </Paper>
  );
};

// === sc-23 === MINI-REVEAL: ĐẤT CÓ CHỮ TRƯỚC KHI NGƯỜI CÓ CHỮ
export const Sc23: React.FC<SceneProps> = () => {
  const A = useA();
  const t1 = A("chữ", 1);
  const t2 = A("chữ", 2);
  const tIcons = [A("đồng", 4), A("gốm", 1), A("hạt", 1)];
  return (
    <Paper>
      {/* FIX-03 hero panel — hiện ngay từ frame đầu (fade ≤0.3s), khớp lời dẫn
          334–340s: «bằng chứng then chốt cho thấy văn hóa Đông Sơn mang nguồn
          gốc bản địa…»; giữ nguyên suốt cảnh, không đụng phần tử đã khóa anchor */}
      <Reveal startFrac={0.02} endFrac={0.041} style={{ position: "absolute", top: 90, left: 0, right: 0, textAlign: "center" }}>
        <div
          style={{
            display: "inline-block",
            maxWidth: 1560,
            background: "rgba(36,31,26,0.85)",
            border: `2px solid ${C.teal}`,
            borderRadius: 12,
            padding: "22px 40px",
          }}
        >
          <div style={{ fontFamily: FONT.body, fontWeight: 700, fontSize: 30, letterSpacing: 5, color: C.teal }}>
            HỒI MỘT · BẰNG CHỨNG THEN CHỐT
          </div>
          <div style={{ fontFamily: FONT.display, fontWeight: 800, fontSize: 52, color: C.white, marginTop: 10, lineHeight: 1.25 }}>
            Văn hóa Đông Sơn mang nguồn gốc <span style={{ color: C.teal }}>BẢN ĐỊA</span>
          </div>
          <div style={{ fontFamily: FONT.body, fontSize: 34, color: C.cream, marginTop: 10, lineHeight: 1.4 }}>
            — lớn lên từ chính mảnh đất này, chứ không trôi từ đâu tới.
          </div>
        </div>
      </Reveal>
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center" }}>
          <Reveal startFrac={t1} endFrac={t1 + 0.06}>
            <span style={{ fontFamily: FONT.display, fontWeight: 800, fontSize: 110, color: C.white, lineHeight: 1.15 }}>
              NGƯỜI CHƯA KỊP CÓ CHỮ —
            </span>
          </Reveal>
          <Reveal startFrac={t2} endFrac={t2 + 0.07}>
            <span style={{ fontFamily: FONT.display, fontWeight: 800, fontSize: 110, color: C.earthGlow, lineHeight: 1.15 }}>
              nhưng ĐẤT đã có chữ
            </span>
          </Reveal>
          <div style={{ display: "flex", gap: 46, marginTop: 70, justifyContent: "center" }}>
            {[
              { t: tIcons[0], label: "đồng", color: C.earthGlow, d: "M30 70 a24 20 0 1 1 48 0 a24 20 0 1 1 -48 0 M54 50 v-24 M44 34 l10 -12 l10 12" },
              { t: tIcons[1], label: "gốm", color: C.cream, d: "M30 40 h60 v34 h-60 z M40 52 h40 M40 64 h40 M50 52 v12 M70 52 v12" },
              { t: tIcons[2], label: "hạt lúa cháy", color: C.amber, d: "M54 26 c18 10 18 44 0 56 c-18 -12 -18 -46 0 -56 z M54 82 v14" },
            ].map((ic) => (
              <SpringPop key={ic.label} startFrac={ic.t} from={0.75}>
                  <div style={{ textAlign: "center" }}>
                    <svg width="120" height="110" viewBox="0 0 120 110">
                      <path d={ic.d} fill="none" stroke={ic.color} strokeWidth="5" strokeLinecap="round" />
                    </svg>
                    <div style={{ fontFamily: FONT.body, fontSize: 32, color: ic.color, marginTop: 8 }}>{ic.label}</div>
                  </div>
                </SpringPop>
            ))}
          </div>
        </div>
      </AbsoluteFill>
    </Paper>
  );
};

// === sc-24 === HAI CỘT KHUYẾT BỔ SUNG: ĐẤT vs CỔ THƯ
export const Sc24: React.FC<SceneProps> = () => {
  const A = useA();
  const tDat = A("đọc", 1);
  const ticks = [A("nông", 1), A("luyện", 1), A("trống", 1)];
  const tNoName = A("tên", 1);
  // FIX-04: CỔ THƯ column + items re-anchor 'hai'→'đất' (frac ~0.08) — chạy song song
  // với cột NỀN ĐẤT; mọi text hiện ≥3s trước khi cảnh kết thúc.
  const tCo = A("đất", 1);
  const tMid = A("cổ", 1);
  return (
    <Paper>
      <div style={{ position: "absolute", left: 170, top: 170, width: 700 }}>
        <SpringPop startFrac={tDat} from={0.92}>
          <div
            style={{
              border: `3px solid ${C.earth}`,
              borderRadius: 12,
              background: "rgba(32,24,16,0.92)",
              padding: "34px 40px",
            }}
          >
            <div style={{ fontFamily: FONT.display, fontWeight: 800, fontSize: 58, color: C.earthGlow }}>NỀN ĐẤT</div>
            {["nông nghiệp", "luyện kim", "trống"].map((label, i) => (
              <Reveal key={label} startFrac={ticks[i]} endFrac={ticks[i] + 0.05}>
                <div style={{ display: "flex", gap: 18, alignItems: "center", marginTop: 20, fontFamily: FONT.body, fontSize: 38, color: C.cream }}>
                  <span style={{ color: C.teal, fontWeight: 700 }}>✓</span> {label}
                </div>
              </Reveal>
            ))}
            <Reveal startFrac={tNoName} endFrac={tNoName + 0.05}>
              <div style={{ display: "flex", gap: 18, alignItems: "center", marginTop: 20, fontFamily: FONT.body, fontSize: 38, color: C.warn }}>
                <span style={{ fontWeight: 700 }}>✗</span> tên vua
              </div>
            </Reveal>
            <div style={{ fontFamily: FONT.body, fontSize: 28, color: C.mute, marginTop: 18 }}>
              «đá và đồng không nói tiếng người»
            </div>
          </div>
        </SpringPop>
      </div>
      <div style={{ position: "absolute", right: 170, top: 170, width: 700 }}>
        <SpringPop startFrac={tCo} from={0.92}>
          <div
            style={{
              border: `3px solid ${C.amber}`,
              borderRadius: 12,
              background: "rgba(36,31,26,0.92)",
              padding: "34px 40px",
            }}
          >
            <div style={{ fontFamily: FONT.display, fontWeight: 800, fontSize: 58, color: C.amber }}>CỔ THƯ</div>
            {["chức danh", "khung thời gian"].map((label, i) => (
              <Reveal key={label} startFrac={tCo + 0.05 + i * 0.06} endFrac={tCo + 0.1 + i * 0.06}>
                <div style={{ display: "flex", gap: 18, alignItems: "center", marginTop: 20, fontFamily: FONT.body, fontSize: 38, color: C.cream }}>
                  <span style={{ color: C.teal, fontWeight: 700 }}>✓</span> {label}
                </div>
              </Reveal>
            ))}
            <Reveal startFrac={tNoName + 0.03} endFrac={tNoName + 0.08}>
              <div style={{ display: "flex", gap: 18, alignItems: "center", marginTop: 20, fontFamily: FONT.body, fontSize: 38, color: C.warn }}>
                <span style={{ fontWeight: 700 }}>✗</span> tên vua
              </div>
            </Reveal>
            <div style={{ fontFamily: FONT.body, fontSize: 28, color: C.mute, marginTop: 18 }}>
              «im lặng đúng chỗ cần tên»
            </div>
          </div>
        </SpringPop>
      </div>
      <Reveal startFrac={tMid} endFrac={tMid + 0.09} style={{ position: "absolute", bottom: 100, left: 0, right: 0, textAlign: "center" }}>
        <span style={{ fontFamily: FONT.display, fontWeight: 700, fontSize: 52, color: C.white }}>
          «Một văn bản <span style={{ color: C.amber }}>cổ hơn, gần thời ấy hơn</span> — và chép từ bên ngoài.»
        </span>
      </Reveal>
    </Paper>
  );
};
