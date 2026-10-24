import React from "react";
import { AbsoluteFill, Audio, Sequence, staticFile, useCurrentFrame } from "remotion";
import { C, FONT, FONT_MONO } from "./theme";
import { SCENE_TIMING, EPISODE_TOTAL_FRAMES, FPS, getSceneTiming, A, AEnd, Spoken, FullSceneId } from "./timing";
import { S1Panel } from "./S1Panel";

const chip: React.CSSProperties = {
  display: "inline-block", padding: "24px 30px", borderRadius: 20,
  border: `2px solid ${C.border}`, background: C.surface,
  fontSize: 46, fontWeight: 600, lineHeight: 1.3,
};
const stack: React.CSSProperties = {
  position: "absolute", left: 90, right: 90, top: 480,
  display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 64,
};

const SceneBody: React.FC<{ id: FullSceneId }> = ({ id }) => {
  if (id === "s01") return <S1Panel />;
  if (id === "s02") return <div style={stack}>
    <Spoken at={A("s02", "tuyên bố")}><div style={{ fontSize: 92, fontWeight: 800, borderBottom: `4px solid ${C.gold}`, paddingBottom: 18 }}>tuyên bố</div></Spoken>
    <Spoken at={A("s02", "Mỹ có thể rút đi ngay")}><div style={{ fontSize: 56, fontWeight: 700 }}>Mỹ có thể rút đi ngay</div></Spoken>
    <Spoken at={A("s02", "Iran không được sở hữu")}><div style={{ ...chip, borderStyle: "dashed" }}>Iran không được sở hữu vũ khí hạt nhân</div></Spoken>
  </div>;
  if (id === "s03") return <div style={{ ...stack, top: 580 }}>
    <Spoken at={A("s03", "trên một trăm mười")}><div style={{ fontSize: 86, fontWeight: 800, lineHeight: 1.2 }}>trên <span style={{ color: C.gold }}>110 USD/thùng</span></div></Spoken>
    <Spoken at={A("s03", "chưa thể trở lại bình thường")}><div style={chip}>chưa bình thường trong năm tới</div></Spoken>
  </div>;
  if (id === "s04") return <div style={{ ...stack, top: 360, gap: 60 }}>
    <Spoken at={A("s04", "OpenAI")}><div style={{ fontSize: 110, fontWeight: 800 }}>OpenAI</div></Spoken>
    <Spoken at={A("s04", "khoảng ba mươi tỷ")}><div style={{ ...chip, fontSize: 60, color: C.gold, background: C.surfaceGold }}>~30 tỷ USD</div></Spoken>
    <Spoken at={A("s04", "định giá tiềm năng")}><div style={chip}>định giá tiềm năng 1.400 tỷ USD</div></Spoken>
    <Spoken at={A("s04", "chưa phải thương vụ hoàn tất")}><div style={{ ...chip, fontSize: 54, fontWeight: 800, color: C.gold, border: `3px dashed ${C.gold}` }}>CHƯA HOÀN TẤT</div></Spoken>
  </div>;
  if (id === "s05") return <div style={stack}>
    <Spoken at={A("s05", "Qualcomm")}><div style={{ fontSize: 100, fontWeight: 800 }}>Qualcomm</div></Spoken>
    <Spoken at={A("s05", "cắt giảm nhân sự")}><div style={{ fontSize: 60, fontWeight: 700, lineHeight: 1.25 }}>cắt giảm nhân sự toàn cầu</div></Spoken>
    <Spoken at={A("s05", "chưa nêu số lượng")}><div style={{ ...chip, borderStyle: "dashed" }}>chưa nêu số người</div></Spoken>
  </div>;
  if (id === "s06") return <div style={stack}>
    <Spoken at={A("s06", "chỉ giao dịch qua tài khoản")}><div style={{ fontSize: 64, fontWeight: 800, lineHeight: 1.3 }}>chỉ tài khoản ngân hàng chính chủ</div></Spoken>
    <Spoken at={A("s06", "không nhận ví điện tử")}><div style={chip}>không ví điện tử / chứng khoán</div></Spoken>
  </div>;
  if (id === "s07") return <div style={{ ...stack, top: 360, left: 80, right: 80, padding: "42px 36px", boxSizing: "border-box", background: "rgba(245,196,112,0.06)", borderLeft: `8px solid ${C.gold}`, borderRadius: 24, gap: 54 }}>
    <Spoken at={A("s07", "Với người đi làm")}><div style={{ color: C.gold, fontSize: 54, fontWeight: 800 }}>NHẬN ĐỊNH</div></Spoken>
    <Spoken at={A("s07", "lãi suất tiết kiệm đang giảm")}><div style={{ fontSize: 44, lineHeight: 1.3 }}>lãi suất tiết kiệm giảm</div></Spoken>
    <Spoken at={A("s07", "chi phí năng lượng")}><div style={{ fontSize: 44, lineHeight: 1.3 }}>chi phí năng lượng chưa dịu</div></Spoken>
    <Spoken at={A("s07", "ngành công nghệ")}><div style={{ fontSize: 44, lineHeight: 1.3 }}>ngành công nghệ xoay chuyển nhân sự</div></Spoken>
    <Spoken at={A("s07", "chưa phải con số đã đóng")}><div style={{ ...chip, fontSize: 40, color: C.gold }}>gọi vốn chưa phải con số đóng</div></Spoken>
  </div>;
  return <div style={{ position: "absolute", top: 670, left: 90, right: 90, textAlign: "center" }}>
    <Spoken at={A("s08", "Bản tin ngày hai mươi tháng mười")}><div style={{ fontSize: 90, fontWeight: 800, lineHeight: 1.25 }}>Tin nhanh 20/10/2026</div><div style={{ width: 140, height: 5, background: C.gold, margin: "40px auto 0" }} /></Spoken>
  </div>;
};

const Hud: React.FC<{ id: FullSceneId }> = ({ id }) => {
  const local = useCurrentFrame();
  const t = getSceneTiming(id);
  const g = t.start_frame + local;
  return <div style={{ position: "absolute", left: 32, bottom: 32, fontFamily: FONT_MONO, fontSize: 26, color: C.textSoft, background: "rgba(4,9,20,0.55)", border: `1px solid ${C.border}`, borderRadius: 8, padding: "8px 14px", zIndex: 50 }}>
    {`S${Number(id.slice(1))} f${g} ${Math.floor(g / FPS)}s [${local}/${t.scene_frames}]`}
  </div>;
};

export const NewsDailyFull: React.FC<{ hud?: boolean }> = ({ hud = false }) => (
  <AbsoluteFill style={{ background: C.bgDeep, fontFamily: FONT, color: C.text }}>
    {SCENE_TIMING.map((t) => <Sequence key={t.scene_id} from={t.start_frame} durationInFrames={t.scene_frames}>
      <SceneBody id={t.scene_id} />
      <Audio src={staticFile(`news-daily-20261020/voice_${t.scene_id === "s01" ? "s1" : t.scene_id}.wav`)} />
      {hud && <Hud id={t.scene_id} />}
    </Sequence>)}
  </AbsoluteFill>
);
