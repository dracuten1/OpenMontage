// VN-Myth Ep.04 — scenes group H: sc071..sc074 (đền Thượng + giếng Trọng Thủy,
// đá Mỵ Châu + lễ hội Cổ Loa, teaser tập sau — trăm nước họ Việts, CTA lớp đất mở).
// Speech-lock: mọi animation fire tại A("từ", occ).
import React from "react";
import { AbsoluteFill, Img, random, staticFile } from "remotion";
import { C, FONT, SceneProps } from "./theme";
import {
  Chip,
  InkImageScene,
  Paper,
  Reveal,
  SourceTag,
  SpringPop,
  circleD,
  ease,
  useA,
  useFrac,
} from "./common";

// === sc071 === CỔ LOA HÔM NAY — đền Thượng và giếng Trọng Thủy
export const Sc071: React.FC<SceneProps> = ({ durationInFrames }) => {
  const A = useA();
  const tBay = A("mười", 1); // «mười bảy cây số từ Hà Nội»
  const tThuong = A("Thượng", 1); // «đền Thượng thờ An Dương Vương»
  const tGiang = A("giếng", 1); // «giếng Trọng Thủy»
  const tThuy = A("Thủy", 1); // «Trọng Thủy»
  const { frame, p } = useFrac(durationInFrames);
  return (
    <InkImageScene src="img-sc071.png" focus={{ x: 0.5, y: 0.44 }} durationInFrames={durationInFrames} label="đền Thượng — Cổ Loa hôm nay" sublabel="từ hồ sơ về tận nơi thờ tự đang sống">
      <div style={{ position: "absolute", top: 84, left: 84 }}>
        <SpringPop startFrac={tBay} from={0.84} durationInFrames={durationInFrames}>
          <Chip color={C.amber}>17 km từ Hà Nội</Chip>
        </SpringPop>
      </div>
      <div style={{ position: "absolute", top: 190, left: 84 }}>
        <SpringPop startFrac={tThuong} from={0.84} durationInFrames={durationInFrames}>
          <div
            style={{
              border: `2px solid ${C.amber}`,
              borderRadius: 8,
              background: "rgba(26,23,20,0.88)",
              padding: "12px 30px",
              fontFamily: FONT.body,
              fontWeight: 700,
              fontSize: 38,
              color: C.white,
            }}
          >
            đền Thượng — thờ <span style={{ color: C.amber }}>An Dương Vương</span>
          </div>
        </SpringPop>
      </div>
      {/* inset giếng Trọng Thủy — khung khắc nhỏ */}
      <div style={{ position: "absolute", bottom: 290, right: 84 }}>
        <SpringPop startFrac={tGiang} from={0.8} durationInFrames={durationInFrames}>
          <div style={{ border: `3px solid ${C.cream}`, borderRadius: 10, padding: 6, background: "rgba(26,23,20,0.9)" }}>
            <svg width={320} height={220} viewBox="0 0 320 220">
              <path d={circleD(160, 96, 78)} fill="none" stroke={C.cream} strokeWidth={6} />
              <ellipse cx={160} cy={96} rx={44} ry={14} fill="none" stroke={C.teal} strokeWidth={3} opacity={0.7} />
              {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => {
                const ang = (i / 8) * Math.PI * 2;
                return (
                  <rect key={i} x={160 + Math.cos(ang) * 78 - 11} y={96 + Math.sin(ang) * 26 - 8} width={22} height={16} rx={3} fill="none" stroke={C.earthGlow} strokeWidth={3} />
                );
              })}
              <path d="M 60 200 H 260" stroke={C.cream} strokeWidth={3} opacity={0.6} />
            </svg>
            <div style={{ fontFamily: FONT.body, fontWeight: 700, fontSize: 30, color: C.white, textAlign: "center", padding: "8px 0 4px" }}>
              giếng Trọng Thủy
            </div>
            <Reveal startFrac={tThuy} endFrac={tThuy + 0.06} durationInFrames={durationInFrames}>
              <div style={{ fontFamily: FONT.body, fontSize: 28, color: C.cream, textAlign: "center", paddingBottom: 8 }}>
                chiếc giếng trong truyền thuyết
              </div>
            </Reveal>
          </div>
        </SpringPop>
      </div>
      {/* khói hương */}
      <svg width="1920" height="1080" viewBox="0 0 1920 1080" style={{ position: "absolute", inset: 0, pointerEvents: "none", opacity: ease(p(0.2, 0.5)) * 0.5 }}>
        {[0, 1].map((i) => (
          <path
            key={i}
            d={`M ${700 + i * 480} 760 q ${18 + (frame % 9)} -60 ${-12 + (frame % 6)} -120 q ${-20 + (frame % 5)} -58 10 -112`}
            fill="none"
            stroke={C.cream}
            strokeWidth={3}
            opacity={0.5}
          />
        ))}
      </svg>
      <SourceTag text="Cổ Loa không phán xét ai — Cổ Loa chỉ nhớ" bottom={40} right />
    </InkImageScene>
  );
};

// === sc072 === ĐÁ MỸ CHÂU VÀ LỄ HỘI — câu chốt của tập
export const Sc072: React.FC<SceneProps> = ({ durationInFrames }) => {
  const A = useA();
  const tKhoi = A("khối", 1); // «một khối đá tự nhiên hình người cụt đầu»
  const tCut = A("cụt", 1); // «cụt đầu»
  const tMai = A("mái", 1); // «tất cả đều được một mái đền che»
  const tCao = A("Cao", 1); // «đền Cao Lỗ»
  const tLe = A("lễ", 1); // «lễ hội Cổ Loa»
  const tNho = A("nhớ", 3); // «Đất này nhớ cả những vết lông ngơ»
  const tVet = A("vết", 1); // «vết lông ngơ»
  return (
    <InkImageScene src="img-sc072.png" focus={{ x: 0.5, y: 0.42 }} durationInFrames={durationInFrames} label="khối đá hình người cụt đầu — đền Mỵ Châu" sublabel="không đắp tượng, chỉ đặt một hòn đá">
      <div style={{ position: "absolute", top: 84, left: 84, display: "flex", flexDirection: "column", gap: 18 }}>
        <SpringPop startFrac={tKhoi} from={0.84} durationInFrames={durationInFrames}>
          <Chip color={C.amber}>không đắp tượng — chỉ một hòn đá</Chip>
        </SpringPop>
        <Reveal startFrac={tCut} endFrac={tCut + 0.06} durationInFrames={durationInFrames}>
          <div
            style={{
              border: `2px solid ${C.cream}`,
              borderRadius: 8,
              background: "rgba(26,23,20,0.86)",
              padding: "10px 26px",
              fontFamily: FONT.body,
              fontWeight: 500,
              fontSize: 34,
              color: C.cream,
              maxWidth: 640,
            }}
          >
            cách dân gian gửi gắm thương cảm hơn hai nghìn năm — không cần một lời phán xét
          </div>
        </Reveal>
      </div>
      <div style={{ position: "absolute", top: 84, right: 84, textAlign: "right" }}>
        <SpringPop startFrac={tCao} from={0.84} durationInFrames={durationInFrames}>
          <Chip color={C.teal}>đền Cao Lỗ — người chế nỏ cũng được thờ</Chip>
        </SpringPop>
      </div>
      <div style={{ position: "absolute", bottom: 300, left: 0, right: 0, textAlign: "center" }}>
        <Reveal startFrac={tMai} endFrac={tMai + 0.08} durationInFrames={durationInFrames}>
          <div style={{ fontFamily: FONT.body, fontWeight: 500, fontSize: 36, color: C.cream }}>
            kẻ dựng thành, kẻ chế nỏ, kẻ mất nước, kẻ chịu oan — cùng một mái đền che
          </div>
        </Reveal>
      </div>
      <div style={{ position: "absolute", bottom: 200, left: 0, right: 0, textAlign: "center" }}>
        <SpringPop startFrac={tLe} from={0.82} durationInFrames={durationInFrames}>
          <div
            style={{
              display: "inline-block",
              border: `2px solid ${C.amber}`,
              borderRadius: 8,
              background: "rgba(26,23,20,0.9)",
              padding: "12px 32px",
              fontFamily: FONT.mono,
              fontSize: 36,
              color: C.amber,
              letterSpacing: 2,
            }}
          >
            lễ hội Cổ Loa — mùng 6 tháng Giêng
          </div>
        </SpringPop>
      </div>
      {/* câu chốt khắc */}
      <div style={{ position: "absolute", bottom: 96, left: 0, right: 0, textAlign: "center" }}>
        <Reveal startFrac={tNho} endFrac={tNho + 0.1} durationInFrames={durationInFrames}>
          <div
            style={{
              fontFamily: FONT.display,
              fontWeight: 800,
              fontSize: 60,
              color: C.white,
              textShadow: "0 4px 22px rgba(0,0,0,0.8)",
            }}
          >
            «Đất này nhớ cả những <span style={{ color: C.amber }}>vết lông ngơ</span>»
          </div>
        </Reveal>
      </div>
      <SourceTag text="Truyền thuyết không nằm trên sách — nó nằm trong lễ hội" bottom={38} right />
    </InkImageScene>
  );
};

// === sc073 === TEASER TẬP SAU — trăm nước họ Việts biến mất đâu?
export const Sc073: React.FC<SceneProps> = ({ durationInFrames }) => {
  const A = useA();
  const tTram = A("Trăm", 1); // «Trăm nước họ Việts đã biến mất đâu?»
  const tMat = A("mất", 1); // «biến mất đâu»
  const tCon = A("còn", 1); // «chỉ còn một Việt trên bản đồ»
  const tBoc = A("bọc", 1); // «Từ bọc trứng trăm con»
  const tVong = A("vòng", 2); // «ba vòng thành Cổ Loa»
  const { frame, p } = useFrac(durationInFrames);
  // f05 silhouette làm nền callback
  const bgFade = ease(p(0.02, 0.12));
  // chấm nước họ Việts tắt tuần tự từ tMat
  const fadeAll = ease(p(tMat, tMat + 0.5));
  const dots = Array.from({ length: 96 }, (_, i) => {
    const rx = random(`vx-${i}`);
    const ry = random(`vy-${i}`);
    return { x: 240 + rx * 1440, y: 160 + ry * 620 };
  });
  const survivor = { x: 1350, y: 430 };
  const pulse = 0.5 + 0.5 * Math.sin(frame / 7);
  return (
    <Paper>
      <AbsoluteFill style={{ opacity: bgFade * 0.22, filter: "blur(3px)" }}>
        <Img src={staticFile("co-loa-no-than/images/f05-tram-trung.png")} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      </AbsoluteFill>
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
        <svg width="1920" height="900" viewBox="0 0 1920 900">
          {/* đường viền bản đồ mờ */}
          <path
            d="M 250 260 Q 520 140 900 200 Q 1300 260 1660 220 Q 1720 480 1560 700 Q 1200 800 800 760 Q 420 730 280 540 Z"
            fill="none"
            stroke={C.cream}
            strokeWidth={4}
            opacity={0.3}
            strokeDasharray="16 18"
          />
          {/* trăm nước — tắt tuần tự */}
          {dots.map((d, i) => {
            const off = fadeAll * (0.4 + (i / dots.length) * 1.1);
            const isOut = off >= ((i * 7) % 100) / 100;
            return (
              <circle
                key={i}
                cx={d.x}
                cy={d.y}
                r={6}
                fill={C.cream}
                opacity={isOut ? 0 : 0.75}
              />
            );
          })}
          {/* một Việt còn lại — pulse */}
          <g opacity={ease(p(tCon, tCon + 0.08))}>
            <circle cx={survivor.x} cy={survivor.y} r={30 + pulse * 22} fill={C.amber} opacity={0.2} />
            <circle cx={survivor.x} cy={survivor.y} r={13} fill={C.amber} />
            <path d={`M ${survivor.x + 26} ${survivor.y - 40} h 220 M ${survivor.x + 26} ${survivor.y - 40} l 26 -14 M ${survivor.x + 26} ${survivor.y - 40} l 26 14`} stroke={C.amber} strokeWidth={4} fill="none" />
          </g>
        </svg>
        <SpringPop startFrac={tTram} from={0.85} durationInFrames={durationInFrames} style={{ marginTop: -40 }}>
          <div
            style={{
              fontFamily: FONT.display,
              fontWeight: 800,
              fontSize: 84,
              color: C.white,
              textAlign: "center",
              textShadow: "0 6px 30px rgba(0,0,0,0.7)",
            }}
          >
            trăm nước họ Việts — <span style={{ color: C.amber }}>đã biến mất đâu?</span>
          </div>
        </SpringPop>
        <div style={{ display: "flex", gap: 40, marginTop: 36 }}>
          <Reveal startFrac={tCon} endFrac={tCon + 0.08} durationInFrames={durationInFrames}>
            <div
              style={{
                border: `2px solid ${C.amber}`,
                borderRadius: 10,
                background: "rgba(36,31,26,0.92)",
                padding: "16px 36px",
                fontFamily: FONT.body,
                fontWeight: 500,
                fontSize: 38,
                color: C.cream,
              }}
            >
              vì sao chỉ còn <span style={{ color: C.amber }}>một Việt</span> trên bản đồ?
            </div>
          </Reveal>
          <Reveal startFrac={tBoc} endFrac={tBoc + 0.08} durationInFrames={durationInFrames}>
            <div
              style={{
                border: `2px solid ${C.cream}`,
                borderRadius: 10,
                background: "rgba(36,31,26,0.92)",
                padding: "16px 36px",
                fontFamily: FONT.body,
                fontWeight: 500,
                fontSize: 38,
                color: C.cream,
              }}
            >
              từ <span style={{ color: C.cream }}>bọc trứng trăm con</span> tới ba vòng thành Cổ Loa
            </div>
          </Reveal>
        </div>
      </AbsoluteFill>
      <SourceTag text="Phía trước — câu hỏi quyết định của cả series" bottom={40} right />
    </Paper>
  );
};

// === sc074 === CTA — lớp đất mở ra ánh sáng
export const Sc074: React.FC<SceneProps> = ({ durationInFrames }) => {
  const A = useA();
  const tDang = A("Đăng", 1); // «Đăng ký để không lỡ»
  const tLo = A("lỡ", 1); // «không lỡ»
  const tMoi = A("Mỗi", 1); // «Mỗi tập là một lớp đất mới được mở»
  const tLop = A("lớp", 1); // «một lớp đất»
  const tMo = A("mở", 1); // «được mở»
  const tKe = A("kể", 1); // «hãy kể lại cho một người nữa nghe»
  const tSom = A("sớm", 1); // «được nghe sớm hơn hai nghìn năm một chút»
  const { p } = useFrac(durationInFrames);
  const open = ease(p(tLop - 0.08, tLop + 0.16)); // hai lớp đất mở ra
  const glow = ease(p(tMo - 0.04, tMo + 0.1));
  return (
    <Paper variant="earth">
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
        {/* ánh sáng từ lớp đất mở */}
        <div
          style={{
            position: "absolute",
            left: "50%",
            top: "58%",
            width: 1500,
            height: 700,
            transform: "translate(-50%, -30%)",
            borderRadius: "50% 50% 0 0",
            background: `radial-gradient(ellipse at 50% 100%, rgba(217,164,65,${0.28 * glow}) 0%, rgba(217,164,65,0) 65%)`,
          }}
        />
        <SpringPop startFrac={tDang} from={0.86} durationInFrames={durationInFrames}>
          <div
            style={{
              fontFamily: FONT.display,
              fontWeight: 800,
              fontSize: 118,
              color: C.white,
              textAlign: "center",
              textShadow: "0 6px 30px rgba(0,0,0,0.65)",
            }}
          >
            ĐĂNG KÝ <span style={{ color: C.amber }}>ĐỂ KHÔNG LỠ</span>
          </div>
        </SpringPop>
        <Reveal startFrac={tMoi} endFrac={tMoi + 0.08} durationInFrames={durationInFrames} style={{ marginTop: 30 }}>
          <div style={{ fontFamily: FONT.display, fontWeight: 700, fontSize: 56, color: C.cream, textAlign: "center" }}>
            mỗi tập — là một <span style={{ color: C.amber }}>lớp đất mới</span> được mở
          </div>
        </Reveal>
        <Reveal startFrac={tKe} endFrac={tKe + 0.12} durationInFrames={durationInFrames} style={{ marginTop: 60, maxWidth: 1420 }}>
          <div
            style={{
              border: `2px solid ${C.border}`,
              borderRadius: 12,
              background: "rgba(36,31,26,0.92)",
              padding: "26px 46px",
              fontFamily: FONT.body,
              fontWeight: 500,
              fontSize: 38,
              lineHeight: 1.5,
              color: C.cream,
              textAlign: "center",
            }}
          >
            nếu tập này đổi cách bạn nghĩ về Mỵ Châu —
            <br />
            hãy <span style={{ color: C.amber }}>kể lại cho một người nữa nghe</span>
          </div>
        </Reveal>
        <Reveal startFrac={tSom} endFrac={tSom + 0.1} durationInFrames={durationInFrames} style={{ marginTop: 26 }}>
          <div style={{ fontFamily: FONT.mono, fontSize: 30, color: C.mute, textAlign: "center" }}>
            — để bản kể đúng được nghe sớm hơn hai nghìn năm một chút
          </div>
        </Reveal>
      </AbsoluteFill>
      {/* hai lớp đất dưới khung mở ra */}
      <svg width="1920" height="1080" viewBox="0 0 1920 1080" style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
        <path d={`M 0 1080 L 0 ${960 - open * 26} L ${640 - open * 300} 1080 Z`} fill={C.earthDeep} opacity={0.92} />
        <path d={`M 1920 1080 L 1920 ${960 - open * 26} L ${1280 + open * 300} 1080 Z`} fill={C.earthDeep} opacity={0.92} />
        <path d={`M 0 1080 L 0 ${1000 - open * 18} L ${420 - open * 180} 1080 Z`} fill={C.earth} opacity={0.85} />
        <path d={`M 1920 1080 L 1920 ${1000 - open * 18} L ${1500 + open * 180} 1080 Z`} fill={C.earth} opacity={0.85} />
      </svg>
      {/* logo series */}
      <div style={{ position: "absolute", bottom: 60, left: 0, right: 0, textAlign: "center" }}>
        <Reveal startFrac={0.5} endFrac={0.58} durationInFrames={durationInFrames}>
          <div style={{ fontFamily: FONT.body, fontWeight: 700, fontSize: 30, letterSpacing: 8, color: C.cream }}>
            VN-MYTH · HỌ NHÀ RỒNG VÀ TIÊN
          </div>
        </Reveal>
      </div>
      <SourceTag text="Tập kế tiếp — trăm nước họ Việts" bottom={36} right />
    </Paper>
  );
};
