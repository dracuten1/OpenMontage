import React from "react";
import {
  AbsoluteFill,
  Audio,
  OffthreadVideo,
  Sequence,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { C, FONT } from "./theme";
import lhTracksRaw from "./screen_tracks_longhouse.json";
import clTracksRaw from "./screen_tracks_clash.json";

type TrackPoint = { x: number; y: number; v: boolean };
type TracksMap = Record<string, Record<string, TrackPoint>>;

const LH_TRACKS = lhTracksRaw as TracksMap;
const CL_TRACKS = clTracksRaw as TracksMap;

function getTrack(map: TracksMap, key: string, localFrame1: number): TrackPoint {
  const f = Math.max(1, Math.min(240, Math.round(localFrame1)));
  const pt = map[String(f)]?.[key];
  if (!pt || !pt.v) return { x: -300, y: -300, v: false };
  return pt;
}

const TrackedCallout: React.FC<{
  pt: TrackPoint;
  label: string;
  bg: string;
  textColor?: string;
  dx?: number;
  dy?: number;
  stemHeight?: number;
  localFrame: number;
  startAt: number;
  endAt: number;
  emphasize?: boolean;
}> = ({
  pt,
  label,
  bg,
  textColor = "#FFFFFF",
  dx = 0,
  dy = -56,
  stemHeight = 32,
  localFrame,
  startAt,
  endAt,
  emphasize = false,
}) => {
  const { fps } = useVideoConfig();
  if (!pt.v || localFrame < startAt || localFrame > endAt) return null;

  const pop = spring({
    frame: Math.max(0, localFrame - startAt),
    fps,
    config: { damping: 12, stiffness: 185, mass: 0.65 },
  });
  const fadeOut = interpolate(localFrame, [endAt - 6, endAt], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const s = (emphasize ? 1.12 : 1.0) * interpolate(pop, [0, 1], [0.55, 1]);

  // Keep callouts inside safe frame borders
  const px = Math.max(150, Math.min(1770, pt.x + dx));
  const py = Math.max(95, Math.min(910, pt.y + dy));

  return (
    <div
      style={{
        position: "absolute",
        left: px,
        top: py,
        transform: `translate(-50%, -100%) scale(${s})`,
        transformOrigin: "bottom center",
        opacity: fadeOut * Math.min(1, pop * 1.4),
        pointerEvents: "none",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      <div
        style={{
          backgroundColor: bg,
          border: "2.5px solid #F7F1E3",
          borderRadius: 999,
          padding: emphasize ? "8px 20px" : "6px 15px",
          boxShadow: "0 6px 18px rgba(0,0,0,0.48)",
          display: "flex",
          alignItems: "center",
          gap: 8,
          whiteSpace: "nowrap",
        }}
      >
        <div
          style={{
            width: 8,
            height: 8,
            borderRadius: 99,
            backgroundColor: textColor,
          }}
        />
        <span
          style={{
            fontFamily: FONT.body,
            fontSize: emphasize ? 22 : 18,
            fontWeight: 800,
            color: textColor,
            letterSpacing: 0.3,
          }}
        >
          {label}
        </span>
      </div>
      <div
        style={{
          width: 2.5,
          height: stemHeight,
          backgroundColor: "#F7F1E3",
          boxShadow: "0 2px 6px rgba(0,0,0,0.45)",
        }}
      />
      <div
        style={{
          width: 9,
          height: 9,
          borderRadius: 99,
          backgroundColor: bg,
          border: "2px solid #F7F1E3",
        }}
      />
    </div>
  );
};

const TopPhaseBadge: React.FC<{ frame: number }> = ({ frame }) => {
  let tag = "MINH HỌA 1 · NHÀ DÀI Ê ĐÊ";
  let title = "Đón rể Chuê Nuê lên cầu thang bầu vú";
  let accent = C.gold;

  if (frame >= 54 && frame < 156) {
    tag = "MINH HỌA 1 · GIẢI PHẪU GIAN GAH";
    title = "Nhấc mái lộ ghế độc mộc Kpan & bếp lửa gia tộc";
    accent = C.tealLight;
  } else if (frame >= 156 && frame < 240) {
    tag = "MINH HỌA 1 · CƠ CHẾ MẪU HỆ";
    title = "Con gái út nối dài thêm gian Ôk phía sau nhà";
    accent = C.redLight;
  } else if (frame >= 240 && frame < 306) {
    tag = "MINH HỌA 2 · ĐĂM SĂN VS MTAO MXÂY";
    title = "Múa khiên xoay vần — đối đầu tù trưởng áo giáp sắt";
    accent = C.gold;
  } else if (frame >= 306 && frame < 367) {
    tag = "MINH HỌA 2 · BƯỚC NHẢY HẠ GIỚI";
    title = "Đăm Săn phi người lao giáo — giáp sắt bất khả xâm phạm";
    accent = C.redLight;
  } else if (frame >= 367 && frame < 427) {
    tag = "MINH HỌA 2 · CÚ LẬT YÀNG MÁCH";
    title = "Ánh sáng Yàng chỉ chày mòn ném trúng vành tai giáp sắt";
    accent = C.gold;
  } else if (frame >= 427) {
    tag = "MINH HỌA 2 · KHẢI HOÀN";
    title = "Mtao Mxây gục ngã — buôn làng quy tụ dưới lá cờ Đăm Săn";
    accent = C.tealLight;
  }

  return (
    <div
      style={{
        position: "absolute",
        top: 28,
        left: 36,
        backgroundColor: "rgba(18, 13, 10, 0.88)",
        border: `2.5px solid ${accent}`,
        borderRadius: 16,
        padding: "10px 22px",
        boxShadow: "0 10px 26px rgba(0,0,0,0.45)",
      }}
    >
      <div style={{ fontFamily: FONT.mono, fontSize: 15, fontWeight: 700, color: accent, letterSpacing: 1.4 }}>
        {tag}
      </div>
      <div style={{ fontFamily: FONT.display, fontSize: 27, fontWeight: 700, color: C.white, marginTop: 2 }}>
        {title}
      </div>
    </div>
  );
};

const BottomNarrationBar: React.FC<{ frame: number }> = ({ frame }) => {
  const beats = [
    { a: 0, b: 53, text: "Theo luật tục Chuê Nuê, chàng trai phải ở rể — bước qua cầu thang cái chạm đôi bầu vú & vầng trăng." },
    { a: 54, b: 155, text: "Nhấc mái giải phẫu lộ gian Gah: ghế Kpan dài độc mộc tiếp khách quý và bếp lửa ấm của đại gia đình mẫu hệ." },
    { a: 156, b: 239, text: "Mỗi lần người con gái út lập gia đình, ngôi nhà dài hình thuyền lại nối thêm một gian phía hậu." },
    { a: 240, b: 305, text: "Giao chiến Mtao Mxây: Đăm Săn múa khiên xoay lốc bụi, khiêu chiến vị tù trưởng mình khoác áo giáp sắt." },
    { a: 306, b: 366, text: "Chàng vọt lên không trung tung ngọn giáo đồng — nhưng tia lửa tóe ra trên lớp giáp sắt dày." },
    { a: 367, b: 426, text: "Thần Yàng mách kế: ném chiếc chày mòn trúng vành tai — giáp sắt vỡ tung, cồng đồng vang dội!" },
    { a: 427, b: 480, text: "Mtao Mxây ngã xuống, voi chiến tung vòi khải hoàn — chiến công mở rộng buôn làng bậc nhất sử thi." },
  ];
  const cur = beats.find((x) => frame >= x.a && frame <= x.b);
  if (!cur) return null;

  return (
    <div
      style={{
        position: "absolute",
        bottom: 30,
        left: 0,
        right: 0,
        display: "flex",
        justifyContent: "center",
        pointerEvents: "none",
      }}
    >
      <div
        style={{
          backgroundColor: "rgba(18, 13, 10, 0.88)",
          border: `2.5px solid ${C.gold}`,
          borderRadius: 16,
          padding: "12px 28px",
          maxWidth: 1460,
          boxShadow: "0 12px 28px rgba(0,0,0,0.5)",
        }}
      >
        <span style={{ fontFamily: FONT.body, fontSize: 25, fontWeight: 700, color: C.white }}>
          {cur.text}
        </span>
      </div>
    </div>
  );
};

export const AnimDemo: React.FC = () => {
  const frame = useCurrentFrame();
  const isLonghouse = frame < 240;
  const local1 = isLonghouse ? frame + 1 : frame - 239;

  return (
    <AbsoluteFill style={{ backgroundColor: C.bgDeep }}>
      <Sequence from={0} durationInFrames={240}>
        <OffthreadVideo
          src={staticFile("dam-san/anim_demo/anim_b3d02_longhouse.mp4")}
          muted
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      </Sequence>
      <Sequence from={240} durationInFrames={240}>
        <OffthreadVideo
          src={staticFile("dam-san/anim_demo/anim_b3d03_clash.mp4")}
          muted
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      </Sequence>
      <Audio src={staticFile("dam-san/anim_demo/demo_sfx_mix.wav")} />

      {/* 3D-to-2D Tracked Callout Badges */}
      {isLonghouse ? (
        <>
          <TrackedCallout
            pt={getTrack(LH_TRACKS, "Stairs", local1)}
            label="Cầu thang cái (bầu vú & trăng)"
            bg={C.red}
            dy={-38}
            stemHeight={26}
            localFrame={local1}
            startAt={2}
            endAt={66}
          />
          <TrackedCallout
            pt={getTrack(LH_TRACKS, "Roof", local1)}
            label="Mái hình thuyền · Nhấc giải phẫu"
            bg={C.teal}
            dy={-24}
            stemHeight={24}
            localFrame={local1}
            startAt={44}
            endAt={96}
            emphasize
          />
          <TrackedCallout
            pt={getTrack(LH_TRACKS, "Groom", local1)}
            label="Chàng rể (Chuê Nuê)"
            bg={C.gold}
            textColor="#18120E"
            dy={-18}
            stemHeight={22}
            localFrame={local1}
            startAt={6}
            endAt={232}
          />
          <TrackedCallout
            pt={getTrack(LH_TRACKS, "Hearth", local1)}
            label="Bếp lửa Gah"
            bg="#B45309"
            dy={-24}
            stemHeight={24}
            localFrame={local1}
            startAt={90}
            endAt={176}
          />
          <TrackedCallout
            pt={getTrack(LH_TRACKS, "Wife", local1)}
            label="Vợ họ Niê"
            bg={C.red}
            dx={45}
            dy={-20}
            stemHeight={22}
            localFrame={local1}
            startAt={96}
            endAt={205}
          />
          <TrackedCallout
            pt={getTrack(LH_TRACKS, "Extension", local1)}
            label="Nối dài gian Ôk"
            bg={C.teal}
            dy={-24}
            stemHeight={28}
            localFrame={local1}
            startAt={170}
            endAt={238}
            emphasize
          />
        </>
      ) : (
        <>
          <TrackedCallout
            pt={getTrack(CL_TRACKS, "DamSan", local1)}
            label="Đăm Săn · Khiên đồng"
            bg={C.gold}
            textColor="#18120E"
            dy={-16}
            stemHeight={22}
            localFrame={local1}
            startAt={2}
            endAt={238}
          />
          <TrackedCallout
            pt={getTrack(CL_TRACKS, "MtaoMxay", local1)}
            label="Mtao Mxây · Giáp sắt"
            bg="#334155"
            dx={72}
            dy={-10}
            stemHeight={22}
            localFrame={local1}
            startAt={2}
            endAt={192}
          />
          <TrackedCallout
            pt={getTrack(CL_TRACKS, "Impact", local1)}
            label="ĐÂM BẬT GIÁP SẮT!"
            bg={C.red}
            dx={-135}
            dy={-74}
            stemHeight={28}
            localFrame={local1}
            startAt={98}
            endAt={124}
            emphasize
          />
          <TrackedCallout
            pt={getTrack(CL_TRACKS, "Pestle", local1)}
            label="Chày mòn · Yàng mách"
            bg="#B45309"
            dy={-26}
            stemHeight={22}
            localFrame={local1}
            startAt={134}
            endAt={178}
            emphasize
          />
          <TrackedCallout
            pt={getTrack(CL_TRACKS, "Impact", local1)}
            label="VỠ GIÁP SẮT!"
            bg={C.red}
            dx={-125}
            dy={-74}
            stemHeight={26}
            localFrame={local1}
            startAt={170}
            endAt={198}
            emphasize
          />
          <TrackedCallout
            pt={getTrack(CL_TRACKS, "Elephant", local1)}
            label="Voi chiến & Buôn thắng trận"
            bg={C.teal}
            dy={-20}
            stemHeight={22}
            localFrame={local1}
            startAt={196}
            endAt={238}
          />
        </>
      )}

      <TopPhaseBadge frame={frame} />
      <BottomNarrationBar frame={frame} />
    </AbsoluteFill>
  );
};
