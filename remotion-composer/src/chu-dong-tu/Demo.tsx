// chu-dong-tu (VN-Myth S2E03) — DEMO scene s03 "Một chiếc khố cho hai người".
// Draft HUD approval build: 1 scene duyệt, KHÔNG phải final. No BGM, fade/slide only.
// Season S2 look (values copied from thanh-giong/theme.ts — no cross-import):
// giấy dó sẫm #1A1714, mực kem #E8DCC8, hổ phách #D9A441; contrast rule: text trên
// panel đặc hoặc overlay tối >= 0.72 alpha; body >= 34px.
import React from "react";
import {
  AbsoluteFill,
  Audio,
  Img,
  Sequence,
  interpolate,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { loadFont as loadPlayfair } from "@remotion/google-fonts/PlayfairDisplay";
import { loadFont as loadBeVietnam } from "@remotion/google-fonts/BeVietnamPro";
import { loadFont as loadMono } from "@remotion/google-fonts/JetBrainsMono";

// --- Season S2 constants (copied, not imported) -----------------------------
const FPS = 30;
const W = 1920;
const H = 1080;
const TOTAL_F = 1020; // 32.0s audio + 2.0s tail = 34.0s
const AUDIO_START_F = 30; // 1s lead-in
const NARRATION_S = 30.73;
const TAIL_START_S = 31.80; // sau cue cuối (30.22+1.52) — fade caption + end card

const C = {
  bg: "#1A1714",
  card: "#241F1A",
  border: "#3A322A",
  cream: "#E8DCC8",
  amber: "#D9A441",
  mute: "#8A7F6E",
};
const FONT = {
  display: '"Playfair Display", "Noto Serif", Georgia, serif',
  body: '"Be Vietnam Pro", "Noto Sans", "Helvetica Neue", Arial, sans-serif',
  mono: '"JetBrains Mono", "SF Mono", Menlo, monospace',
};

const SUBSETS = ["vietnamese", "latin"] as const;
const fontLoads = [
  loadPlayfair("normal", { weights: ["700", "800"], subsets: [...SUBSETS] }),
  loadBeVietnam("normal", { weights: ["400", "500", "700"], subsets: [...SUBSETS] }),
  loadMono("normal", { weights: ["400", "500"], subsets: [...SUBSETS] }),
];
void fontLoads;

const clamp01 = (x: number): number => Math.max(0, Math.min(1, x));

// --- Captions: timing KHÓA theo word-timestamps ASR thật (demo_s03_words.json,
// alignment 83% stripped-match, +1.0s audio offset). Speech-window gate.
type Cue = { start: number; dur: number; lines: [string, string] };
const CAPTIONS: Cue[] = [
  // NGUYÊN VĂN narration s03 (trùng TTS demo_s03.wav) — 14 cue theo audio thật
  // dur = next.start − start (không chồng lấn; pad +0.3 đã trim tại ranh giới)
  { start: 1.00, dur: 3.34, lines: ["Trước khi hỏi vì sao người ta thờ,", "phải biết người ấy nghèo đến mức nào."] },
  { start: 4.34, dur: 2.62, lines: ["Bản kể chép lại gia cảnh ấy", "bằng vài dòng rất gọn."] },
  { start: 6.96, dur: 2.96, lines: ["«Cha từ, con hiếu, nhà gặp hỏa hoạn,", "của cải sạch không,"] },
  { start: 9.92, dur: 3.28, lines: ["«chỉ còn lại một khố vải duy nhất,", "cha con ra vào thay nhau mà mặc.»"] },
  { start: 13.20, dur: 2.32, lines: ["Một vụ cháy. Của cải sạch không.", ""] },
  { start: 15.52, dur: 3.06, lines: ["Cha và con, hai người,", "thay nhau mặc một chiếc khố duy nhất."] },
  { start: 18.58, dur: 0.94, lines: ["Rồi người cha lâm bệnh.", ""] },
  { start: 19.44, dur: 1.96, lines: ["Trước khi mất, ông dặn con ...", ""] },
  { start: 21.40, dur: 1.30, lines: ["«Cha chết cứ để trần mà chôn,", ""] },
  { start: 22.70, dur: 2.68, lines: ["giữ khố lại cho con,", "để khỏi xấu hổ.»"] },
  { start: 25.38, dur: 0.74, lines: ["Để trần mà chôn —", ""] },
  { start: 26.14, dur: 2.46, lines: ["đổi lấy cho con một lớp che thân", "khi ra khỏi nhà."] },
  { start: 28.60, dur: 1.62, lines: ["Nhưng người con không nỡ làm theo,", ""] },
  { start: 30.22, dur: 1.52, lines: ["liệm khố rồi đem chôn.", ""] },
];

// Quote windows khóa theo từ thật (build_demo_s03_cues.py):
const QUOTE_1 = { start: 10.32, end: 12.64 }; // «một khố vải... thay nhau mà mặc»
const QUOTE_2 = { start: 21.40, end: 24.86 }; // «Cha chết... giữ khố lại cho con»

export type ChuDongTuDemoProps = { draftHud?: boolean };

export const ChuDongTuDemo: React.FC<ChuDongTuDemoProps> = ({ draftHud = true }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  void fps; void FPS;
  const t = frame / 30;

  // --- Right panel image: fade + slide trong 1.2s đầu ----------------------
  const imgIn = clamp01(frame / 36); // 0..1 over 1.2s
  const imgOpacity = imgIn;
  const imgX = interpolate(imgIn, [0, 1], [40, 0]);

  // --- Captions ------------------------------------------------------------
  const cue = CAPTIONS.find((c) => t >= c.start && t < c.start + c.dur);
  const capFade = cue
    ? Math.min(
        clamp01((t - cue.start) / 0.3),
        clamp01((cue.start + cue.dur - t) / 0.3)
      )
    : 0;
  const tailFade = clamp01((t - TAIL_START_S) / 0.5); // caption fades out in tail
  const capOpacity = capFade * (1 - tailFade);

  // --- End card ------------------------------------------------------------
  const endIn = clamp01((t - (TAIL_START_S + 0.4)) / 0.6);

  const quoteCard = (q: { start: number; end: number }, lines: string[], second: boolean) => {
    const inP = clamp01((t - q.start) / 0.6);
    const outP = clamp01((t - (q.end - 0.5)) / 0.5);
    const o = inP * (1 - outP);
    if (o <= 0.01) return null;
    return (
      <div
        style={{
          position: "absolute",
          left: 96,
          bottom: 320,
          width: 1060,
          background: "rgba(36,31,26,0.96)",
          border: `2px solid ${second ? C.amber : C.border}`,
          borderLeft: `6px solid ${C.amber}`,
          borderRadius: 6,
          padding: "28px 36px",
          opacity: o,
          transform: `translateY(${interpolate(inP, [0, 1], [16, 0])}px)`,
        }}
      >
        {lines.map((ln, i) => (
          <div
            key={i}
            style={{
              fontFamily: FONT.display,
              fontSize: 40,
              fontWeight: 700,
              lineHeight: 1.4,
              color: C.amber,
              letterSpacing: 0.5,
            }}
          >
            {ln}
          </div>
        ))}
      </div>
    );
  };

  return (
    <AbsoluteFill style={{ background: C.bg, fontFamily: FONT.body }}>
      {/* ---------- LEFT content column (~1250px) ---------- */}
      <div style={{ position: "absolute", left: 96, top: 90, width: 1150 }}>
        {/* Label + title: 0.0-1.0s reveal */}
        <div
          style={{
            fontFamily: FONT.mono,
            fontSize: 28,
            letterSpacing: 3,
            color: C.amber,
            opacity: clamp01(frame / 18),
          }}
        >
          VN-MYTH S2E03 · DEMO
        </div>
        <div
          style={{
            fontFamily: FONT.display,
            fontSize: 74,
            fontWeight: 800,
            color: C.cream,
            lineHeight: 1.15,
            marginTop: 18,
            opacity: clamp01((frame - 6) / 20),
            transform: `translateY(${interpolate(clamp01((frame - 6) / 20), [0, 1], [14, 0])}px)`,
          }}
        >
          Một chiếc khố cho hai người
        </div>
        {/* divider */}
        <div
          style={{
            width: 220,
            height: 3,
            background: C.amber,
            marginTop: 26,
            opacity: clamp01((frame - 14) / 16),
            transform: `scaleX(${interpolate(clamp01((frame - 14) / 16), [0, 1], [0, 1])})`,
            transformOrigin: "left center",
          }}
        />
      </div>

      {/* ---------- Quote cards (left column, under title) ---------- */}
      {quoteCard(
        QUOTE_1,
        ["«một khố vải duy nhất,", "cha con ra vào thay nhau mà mặc»"],
        false
      )}
      {quoteCard(
        QUOTE_2,
        ["«để trần mà chôn,", "giữ khố lại cho con»"],
        true
      )}

      {/* ---------- RIGHT image panel (~620px, full height) ---------- */}
      <div
        style={{
          position: "absolute",
          right: 0,
          top: 0,
          width: 620,
          height: H,
          opacity: imgOpacity,
          transform: `translateX(${imgX}px)`,
        }}
      >
        <Img
          src={staticFile("chu-dong-tu/images/demo_s03_kho.jpg")}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            borderLeft: `2px solid ${C.border}`,
            boxSizing: "border-box",
          }}
        />
        {/* vignette nhẹ */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "radial-gradient(ellipse at center, rgba(26,23,20,0) 55%, rgba(26,23,20,0.55) 100%)",
            pointerEvents: "none",
          }}
        />
      </div>

      {/* ---------- Captions: bottom full-width, đè cả panel ---------- */}
      {cue && capOpacity > 0.01 ? (
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 130,
            display: "flex",
            justifyContent: "center",
            opacity: capOpacity,
            zIndex: 50,
          }}
        >
          <div
            style={{
              background: "rgba(20,17,13,0.82)",
              padding: "22px 48px",
              borderRadius: 8,
              textAlign: "center",
            }}
          >
            <div style={{ fontFamily: FONT.body, fontSize: 38, fontWeight: 500, color: C.cream, lineHeight: 1.35 }}>
              {cue.lines[0]}
            </div>
            <div style={{ fontFamily: FONT.body, fontSize: 38, fontWeight: 500, color: C.cream, lineHeight: 1.35 }}>
              {cue.lines[1]}
            </div>
          </div>
        </div>
      ) : null}

      {/* ---------- Tail: end card ---------- */}
      {endIn > 0 ? (
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: 440,
            display: "flex",
            justifyContent: "center",
            opacity: endIn,
            zIndex: 60,
          }}
        >
          <div
            style={{
              fontFamily: FONT.mono,
              fontSize: 30,
              color: C.mute,
              background: "rgba(36,31,26,0.9)",
              border: `1px solid ${C.border}`,
              borderRadius: 8,
              padding: "18px 36px",
              letterSpacing: 2,
            }}
          >
            DRAFT — demo 1 scene (s03) · chờ duyệt
          </div>
        </div>
      ) : null}

      {/* ---------- AUDIO: narration từ frame 30 (1s lead-in) ---------- */}
      <Sequence from={AUDIO_START_F}>
        <Audio src={staticFile("chu-dong-tu/demo_s03.wav")} volume={1} />
      </Sequence>

      {/* ---------- DRAFT HUD ---------- */}
      {draftHud ? (
        <div
          style={{
            position: "absolute",
            left: 24,
            bottom: 20,
            fontFamily: FONT.mono,
            fontSize: 26,
            fontWeight: 600,
            color: "#FFFFFF",
            background: "rgba(0,0,0,0.55)",
            padding: "6px 14px",
            borderRadius: 8,
            zIndex: 9999,
            letterSpacing: 1,
            pointerEvents: "none",
          }}
        >
          s03 · f{frame}/{TOTAL_F} · {(t).toFixed(1)}s · DRAFT HUD — chu-dong-tu S2E03
        </div>
      ) : null}
    </AbsoluteFill>
  );
};

export const CHU_DONG_TU_DEMO_FRAMES = TOTAL_F;
