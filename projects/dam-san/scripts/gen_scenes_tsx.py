#!/usr/bin/env python3
"""Generate remotion-composer/src/dam-san/timing.ts and scenes.gen.tsx from scene_timing.json + scene_manifest.json."""
from __future__ import annotations

import json
from pathlib import Path

OM = Path("/Users/tuyennguyen/project/OpenMontage")
P = OM / "projects" / "dam-san"
SRC = OM / "remotion-composer" / "src" / "dam-san"
SRC.mkdir(parents=True, exist_ok=True)

# Concise bespoke editorial titles/quotes/notes per section s01..s30 (100% locked to raw_data.json)
SCENE_COPY = {
    "s01": ("MỞ · NGHỊCH LÝ RỪNG SÁP ĐEN", "Thất bại trước Nữ thần Mặt Trời", "Đánh thắng mọi tù trưởng trên mặt đất — nhưng vì sao Đăm Săn gục ngã trong Rừng Sáp Đen?", "Klei Khan Y Đam San"),
    "s02": ("MỞ · MÙA 3 «50 LÊN NÚI»", "Từ Mường đất Tổ tới Tây Nguyên", "Tập 2 Season 3: đối chiếu 3 tầng — sử thi, thiết chế mẫu hệ & ngữ hệ Nam Đảo, và di sản hôm nay.", "S3E01 -> S3E02"),
    "s03": ("LỚP A · 2.077 CÂU PHỔ THÔNG", "Khởi đầu bằng cưỡng hôn Chuê Nuê", "Không mở đầu bằng chiến công: Đăm Săn buộc phải cưới H'Nhị và H'Bhị theo tập tục nối dây.", "2.077 câu"),
    "s04": ("LỚP A · CẤU TRÚC TRƯỜNG CA", "Ba chặng kịch tính của Đăm Săn", "Từ phản kháng hôn nhân ban đầu đến chiến công buôn làng và bi kịch Rừng Sáp Đen.", "Yàng răn dạy"),
    "s05": ("LỚP A · CHIẾN CÔNG HẠ GIỚI", "Mtao Grứ & Mtao Mxây áo giáp sắt", "Phá giáp sắt nhờ lời mách của Yàng — chiến công mở rộng buôn làng hùng mạnh bậc nhất.", "Voi chiến & khiên đồng"),
    "s06": ("LỚP A · ĐỊA TẦNG VĂN BẢN", "Bản công bố 1927–1933 bị cắt đoạn", "L. Sabatier (BEFEO Tập 33, 1933) tự cắt bớt các đoạn chiến trận vì cho rằng lặp lại đơn điệu.", "Sabatier 1933"),
    "s07": ("LỚP A · CÚ LẬT TƯ LIỆU", "Từ 2 trận lên 6 rồi 8 đối thủ", "GS Phan Đăng Nhật (6) và Đỗ Hồng Kỳ – Y Wơn Kna ghi từ nghệ nhân Y Nuh Niê (8 đối thủ / 7 trận).", "7 cuộc chiến giành vợ"),
    "s08": ("LỚP A · ẤN BẢN SONG NGỮ 2003", "Hai tập Nguyễn Hữu Thấu & lối ngâm khan", "«Khan là khúc ngâm kể trên hai nốt trầm bổng bên bếp lửa» — L. Sabatier (1933), BEFEO tr. 143.", "Bản in 2003 (2 tập)"),
    "s09": ("LỚP A · CÂY THẦN SMUK / KTU", "Chặt cây sinh mệnh & lên Trời đòi phép", "Cây đổ đè chết H'Nhị và H'Bhị; Đăm Săn vác gươm lên Trời xin phép ngải, nén, gừng cứu vợ.", "Biểu tượng dòng họ"),
    "s10": ("LỚP A · BƯỚC VÀO RỪNG SÁP ĐEN", "Chuyến đi cầu hôn Nữ thần Mặt Trời", "Bất chấp lời khóc can ngăn của dân làng và hai vợ, chàng rời quỹ đạo buôn làng tìm thần linh.", "Rừng Sáp Đen"),
    "s11": ("LỚP A · ĐỈNH BI KỊCH", "Sáp đen tan chảy & hóa ruồi H'Âng", "Sức nóng Mặt Trời thiêu chảy sáp đen; hồn Đăm Săn hóa ruồi nhập H'Âng sinh Đăm Săn cháu.", "Vòng tuần hoàn tập tục"),
    "s12": ("LỚP A · HAI TẦNG DIỄN GIẢI", "Giới hạn tự nhiên hay khát vọng ánh sáng?", "Đối chiếu cách đọc thiết chế mẫu hệ với góc nhìn nhà nghiên cứu Ê Đê Linh Nga Niê Kdăm.", "Đọc song song"),
    "s13": ("LỚP B · XÃ HỘI PHÍA SAU SỬ THI", "Bước xuống khỏi ngựa chiến", "Đằng sau khúc hát anh hùng là bộ máy luật tục và kiến trúc cực kỳ chặt chẽ của người Ê Đê.", "Gian khách Gah"),
    "s14": ("LỚP B · MẪU HỆ & CHUÊ NUÊ", "Sợi dây liên kết hai họ Niê – Mlô", "Con mang họ mẹ, con gái út thừa kế, đàn ông ở rể và cơ chế nối dòng giữ bền liên minh.", "Họ Niê ↔ Họ Mlô"),
    "s15": ("LỚP B · NHÀ DÀI HÌNH THUYỀN", "Thượng thách hạ thu bên bến nước", "Đặt theo trục Đông – Tây; mỗi khi con gái út lấy chồng, nhà được nối dài thêm phía sau.", "Ký ức hải đảo"),
    "s16": ("LỚP B · KHÔNG GIAN ĐỊNH VỊ", "Dring gah · Cầu thang bầu vú · Kpan", "Cầu thang bậc số lẻ chạm đôi bầu vú & trăng lưỡi liềm dẫn vào gian Gah và ghế độc mộc Kpan.", "Mặt bằng kiến trúc"),
    "s17": ("LỚP B · CẦU NỐI SEASON 3", "Người Ê Đê nói tiếng Nam Đảo", "Khác với Mường Nam Á (S3E01), Ê Đê thuộc ngữ hệ Nam Đảo cùng Chăm, Gia Rai, Chu Ru, Raglai.", "5 dân tộc Nam Đảo"),
    "s18": ("LỚP B · LỊCH SỬ NGÔN NGỮ", "Chamic đến duyên hải từ trước 600 TCN", "Khảm giao thoa Chamic (Nam Đảo) và 21 dân tộc Môn–Khmer (Nam Á) trên cao nguyên.", "Thurgood 1999 · Brunelle"),
    "s19": ("LỚP B · GIAO THOA VÙNG", "Bia ký Rang Đê & UNESCO Cồng chiêng", "Không gian Cồng chiêng Tây Nguyên (UNESCO 2005/2008) gắn kết 17 cộng đồng Nam Á và Nam Đảo.", "17 cộng đồng"),
    "s20": ("LỚP B · DÀN NHẠC NGHI LỄ", "6 chiêng bằng · 3 núm · 1 nhịp · 1 trống", "Mỗi chiếc chiêng ẩn một vị thần; tiếng chiêng hòa cùng giọng po khan giữ hồn buôn làng.", "Bộ chiêng Ê Đê"),
    "s21": ("LỚP B · NHỊP ĐIỆU KỂ KHAN", "Ngâm vần klei duê & kèn đing tut", "Từng cụm ba chữ lên xuống hai nốt đều đặn tạo sức mê hoặc suốt nhiều giờ bên bếp lửa.", "Âm thanh truyền khẩu"),
    "s22": ("LỚP C · DÂN SỐ Ê ĐÊ", "398.671 người (1/4/2019) vs mốc 2009", "88,9% sống ở nông thôn; tách bạch rõ mốc 2009 (Đắk Lắk 298.534 / 331.194 = 90,1%).", "Điều tra 53 DTTS"),
    "s23": ("LỚP C · CHIẾN DỊCH 2001–2007", "388 nghệ nhân & gần 5.700 băng 90 phút", "Thu âm 801 tác phẩm hát kể qua cuộc điền dã quy mô lớn của Viện Khoa học xã hội Việt Nam.", "801 tác phẩm ghi âm"),
    "s24": ("LỚP C · KHO TÀNG SỬ THI TÂY NGUYÊN", "75 tác phẩm in trong 62 tập (~60.400 trang)", "Ba Na 30 · Mơ Nông 26 · Ê Đê 10 · Xơ Đăng 4 · Raglai 3 · Chăm 2 — Đăm Săn là phần nổi.", "75 sử thi xuất bản"),
    "s25": ("LỚP C · NGHỊCH LÝ KHẢO SÁT 2007", "97% yêu thích nhưng 62,1% biết rất ít", "8,8% không biết gì & 53,3% hiểu rất ít; nhưng tới 80% ủng hộ mở lớp dạy ngay tại buôn.", "Viện KHXH VN 2007"),
    "s26": ("LỚP C · PHÁP LÝ & TRUYỀN DẠY", "QĐ 4205 (2014) & lớp Cư M'Gar 2023", "Di sản VH phi vật thể QG 19/12/2014; lớp 22/6/2023 tại Ea Tul (20 hv) & Cuôr Đăng (22 hv).", "4205/QĐ-BVHTTDL"),
    "s27": ("LỚP C · NGƯỜI GIỮ LỬA HÔM NAY", "Ama Nhiên & rào cản tiếng Ê Đê cổ", "«Lớp trẻ nghe tiếng Ê Đê không hiểu hết được» — Ama Nhiên (Akô Dhông) tự dịch song ngữ.", "Buôn Akô Dhông"),
    "s28": ("LỚP C · THÁCH THỨC ĐƯƠNG ĐẠI", "17 buôn phục dựng nhà dài du lịch", "Du lịch cộng đồng mở sinh kế mới nhưng đặt ra bài toán tránh sân khấu hóa đêm khan.", "Cảnh báo UNESCO"),
    "s29": ("KẾT · LỜI GIẢI CHO ĐĂM SĂN", "Sức mạnh anh hùng và ranh giới tự nhiên", "Hạ giới nằm trong vòng luật tục Niê – Mlô; trước Mặt Trời là giới hạn tối hậu của con người.", "Rừng Sáp Đen"),
    "s30": ("KẾT · HẸN GẶP TẬP TIẾP THEO", "Kiệt tác folklore tiền Đông Dương", "«Không thể nói đến folklore tiền Đông Dương mà quên Đăm Săn» — Georges Condominas.", "Season 3 · 50 lên núi"),
}


def main() -> None:
    st = json.loads((P / "artifacts" / "scene_timing.json").read_text(encoding="utf-8"))
    mf = json.loads((P / "scene_manifest.json").read_text(encoding="utf-8"))
    by_sc = {r["scene_id"]: r for r in mf["scenes"]}

    # 1. Write timing.ts
    ts_lines = [
        "// Auto-generated from projects/dam-san/artifacts/scene_timing.json (exact VieNeu TTS frame lock).",
        f"export const FPS = {st['fps']};",
        f"export const TOTAL_FRAMES = {st['total_frames']};",
        f"export const TOTAL_SECONDS = {st['total_seconds']};",
        "",
        "export type SceneTiming = {",
        "  id: string;",
        "  scene: string;",
        "  label: string;",
        "  start: number;",
        "  end: number;",
        "  start_frame: number;",
        "  frames: number;",
        "};",
        "",
        "export const SCENES: SceneTiming[] = [",
    ]
    for sec in st["sections"]:
        ts_lines.append(
            f"  {{ id: {sec['id']!r}, scene: {sec['scene']!r}, label: {sec['label']!r}, "
            f"start: {sec['start']}, end: {sec['end']}, start_frame: {sec['start_frame']}, frames: {sec['frames']} }},"
        )
    ts_lines.append("];")
    (SRC / "timing.ts").write_text("\n".join(ts_lines) + "\n", encoding="utf-8")

    # 2. Write scenes.gen.tsx
    track_imports = [f'import track{i:02d} from "./tracks/B3D-{i:02d}.json";' for i in range(1, 11)]
    gx = [
        "// Auto-generated Atelier compositions for dam-san combining Blender 5.2.2 LTS animated 3D + BlenderKit + bespoke infographics.",
        'import React from "react";',
        'import { AbsoluteFill } from "remotion";',
        'import { C, FONT, SceneProps } from "./theme";',
        'import { ArchivalPaperStage, CalloutSpec, DioramaBackdrop, EditorialCallout, LayerStamp, SceneTrackedCallouts, TracksMap } from "./common";',
        'import { DIAGRAMS } from "./diagrams";',
        'import { DraftHUD } from "./draft-hud";',
        *track_imports,
        "",
        "const TRACKS_BY_CLIP: Record<string, TracksMap> = {",
        *[f'  "B3D-{i:02d}": track{i:02d} as TracksMap,' for i in range(1, 11)],
        "};",
        "",
        "const CALLOUTS_BY_CLIP: Record<string, CalloutSpec[]> = {",
        '  "B3D-01": [',
        '    { anchor: "DamSan", label: "Đăm Săn tiến vào rừng thẳm", accent: C.redLight, dx: -20, startFrac: 0.04, endFrac: 0.92 },',
        '    { anchor: "SunPortal", label: "Cổng Nữ thần Mặt Trời", accent: C.gold, dx: 55, startFrac: 0.22, endFrac: 0.96 },',
        '    { anchor: "WaxForest", label: "Rừng sáp đen nóng chảy", accent: C.copper, dx: -70, startFrac: 0.35, endFrac: 0.96 },',
        "  ],",
        '  "B3D-02": [',
        '    { anchor: "Stairs", label: "Cầu thang cái (bầu vú & trăng)", accent: C.redLight, dx: -15, startFrac: 0.03, endFrac: 0.36 },',
        '    { anchor: "Hearth", label: "Gian Gah · Bếp lửa & Ché", accent: C.tealLight, dx: 20, startFrac: 0.28, endFrac: 0.78 },',
        '    { anchor: "Extension", label: "Gian hậu Ôk nối dài", accent: C.gold, dx: -15, startFrac: 0.62, endFrac: 0.98 },',
        "  ],",
        '  "B3D-03": [',
        '    { anchor: "DamSan", label: "Đăm Săn múa khiên", accent: C.redLight, dx: -75, startFrac: 0.04, endFrac: 0.88 },',
        '    { anchor: "MtaoMxay", label: "Mtao Mxây áo giáp sắt", accent: C.copper, dx: 75, startFrac: 0.06, endFrac: 0.72 },',
        '    { anchor: "Impact", label: "Yàng mách: chày vỡ giáp", accent: C.gold, dx: -95, dy: -55, startFrac: 0.64, endFrac: 0.95 },',
        "  ],",
        '  "B3D-04": [',
        '    { anchor: "BEFEO1933", label: "Bản cắt Sabatier (1933)", accent: C.redLight, dx: -20, startFrac: 0.05, endFrac: 0.58 },',
        '    { anchor: "Tablets8", label: "Khôi phục 8 đối thủ / 7 trận", accent: C.gold, dx: -20, startFrac: 0.34, endFrac: 0.98 },',
        '    { anchor: "Cassette", label: "Băng điền dã Tây Nguyên", accent: C.tealLight, dy: -28, startFrac: 0.18, endFrac: 0.96 },',
        "  ],",
        '  "B3D-05": [',
        '    { anchor: "SmukTree", label: "Cây thần Smuk / Ktu", accent: C.tealLight, dx: 45, startFrac: 0.05, endFrac: 0.66 },',
        '    { anchor: "DamSan", label: "Chặt cây đổ đè 2 vợ", accent: C.redLight, dx: -45, startFrac: 0.10, endFrac: 0.64 },',
        '    { anchor: "SkyBeam", label: "Lên Trời đòi phép cứu sinh", accent: C.gold, startFrac: 0.64, endFrac: 0.98 },',
        "  ],",
        '  "B3D-06": [',
        '    { anchor: "SunGoddess", label: "Nữ thần Mặt Trời", accent: C.gold, startFrac: 0.06, endFrac: 0.96 },',
        '    { anchor: "WaxPool", label: "Sáp đen tan chảy", accent: C.copper, dx: -55, startFrac: 0.18, endFrac: 0.78 },',
        '    { anchor: "SoulFly", label: "Hóa ruồi nhập H\'Âng", accent: C.gold, startFrac: 0.68, endFrac: 0.99 },',
        "  ],",
        '  "B3D-07": [',
        '    { anchor: "ClanCord", label: "Liên minh Chuê Nuê: Niê – Mlô", accent: C.redLight, startFrac: 0.12, endFrac: 0.96 },',
        '    { anchor: "KpanBench", label: "Ghế độc mộc Kpan", accent: C.gold, dx: -55, startFrac: 0.06, endFrac: 0.78 },',
        '    { anchor: "ChueNue", label: "Con gái út thừa kế", accent: C.tealLight, dx: 65, startFrac: 0.25, endFrac: 0.96 },',
        "  ],",
        '  "B3D-08": [',
        '    { anchor: "ChampaCoast", label: "Chamic duyên hải (<600 TCN)", accent: C.copper, startFrac: 0.15, endFrac: 0.78 },',
        '    { anchor: "ChamicArc", label: "Luồng ngữ hệ Nam Đảo", accent: C.gold, startFrac: 0.28, endFrac: 0.92 },',
        '    { anchor: "DakLakEde", label: "Tâm điểm Ê Đê Đắk Lắk", accent: C.tealLight, dx: -45, startFrac: 0.56, endFrac: 0.98 },',
        "  ],",
        '  "B3D-09": [',
        '    { anchor: "FlatGongs6", label: "6 chiêng bằng · Knă", accent: C.gold, dx: -30, startFrac: 0.08, endFrac: 0.92 },',
        '    { anchor: "BossGongs3", label: "3 chiêng núm · H\'Lữ", accent: C.copper, dx: 35, startFrac: 0.24, endFrac: 0.96 },',
        '    { anchor: "PoKhan", label: "Nghệ nhân kể khan bên bếp lửa", accent: C.tealLight, startFrac: 0.12, endFrac: 0.96 },',
        "  ],",
        '  "B3D-10": [',
        '    { anchor: "Archive62", label: "Kho tàng 62 tập sử thi", accent: C.gold, dx: -25, startFrac: 0.08, endFrac: 0.88 },',
        '    { anchor: "FieldTapes", label: "Gần 5.700 băng ghi âm 90\'", accent: C.tealLight, dx: 25, startFrac: 0.20, endFrac: 0.96 },',
        '    { anchor: "EternalHearth", label: "Bếp lửa buôn Akô Dhông", accent: C.redLight, dx: -25, startFrac: 0.12, endFrac: 0.96 },',
        "  ],",
        "};",
        "",
        "const layerAccent = (tag: string): string => {",
        '  if (tag.startsWith("LỚP A") || tag.startsWith("MỞ")) return C.redLight;',
        '  if (tag.startsWith("LỚP B")) return C.tealLight;',
        "  return C.gold;",
        "};",
        "",
        "const makeHero3DScene = (",
        "  sceneId: string,",
        "  secId: string,",
        "  tag: string,",
        "  title: string,",
        "  subtitle: string,",
        "  badge: string,",
        "  imgFile: string,",
        "  move: React.ComponentProps<typeof DioramaBackdrop>[\"move\"],",
        "  isQuote = false,",
        "  diagId: string | null = null",
        "): React.FC<SceneProps> => {return ({ durationInFrames, showHud }) => {",
        "  const acc = layerAccent(tag);",
        "  const DiagComp = diagId ? DIAGRAMS[diagId] : null;",
        "  const clipMatch = imgFile.match(/(B3D-\\d{2})/);",
        "  const clipKey = clipMatch ? clipMatch[1] : null;",
        "  const tracks = clipKey ? TRACKS_BY_CLIP[clipKey] : undefined;",
        "  const callouts = clipKey ? CALLOUTS_BY_CLIP[clipKey] : undefined;",
        "  if (DiagComp && isQuote) {",
        "    // Split 3D + Infographic on light archival paper or dark studio stage",
        "    return (",
        "      <AbsoluteFill style={{ backgroundColor: C.bg }}>",
        "        <DioramaBackdrop file={imgFile} move={move} dim={0.48} />",
        "        <ArchivalPaperStage accent={acc}>",
        "          <div style={{ display: \"flex\", justifyContent: \"space-between\", alignItems: \"flex-start\", gap: 24 }}>",
        "            <LayerStamp layerTag={tag} title={title} accent={C.red} lightPaper />",
        "            <div style={{ fontFamily: FONT.mono, fontSize: 18, color: C.inkSoft, paddingTop: 18, whiteSpace: \"nowrap\" }}>{badge}</div>",
        "          </div>",
        "          <div style={{ flex: 1, display: \"flex\", alignItems: \"center\", padding: \"14px 0\" }}>",
        "            <DiagComp />",
        "          </div>",
        "          <div style={{ fontFamily: FONT.body, fontSize: 22, color: C.inkSoft, borderTop: `1px solid ${C.border}55`, paddingTop: 12 }}>",
        "            {subtitle}",
        "          </div>",
        "        </ArchivalPaperStage>",
        "        {showHud && <DraftHUD sceneId={sceneId} sectionId={secId} durationInFrames={durationInFrames} label={title} />}",
        "      </AbsoluteFill>",
        "    );",
        "  }",
        "  if (DiagComp) {",
        "    // Dark studio full-bleed Blender 3D top/background + animated Atelier diagram panel bottom",
        "    return (",
        "      <AbsoluteFill style={{ backgroundColor: C.bgDeep }}>",
        "        <DioramaBackdrop file={imgFile} move={move} dim={0.45} />",
        "        <AbsoluteFill style={{ padding: \"54px 68px 54px\", display: \"flex\", flexDirection: \"column\", justifyContent: \"space-between\" }}>",
        "          <div style={{ display: \"flex\", justifyContent: \"space-between\", alignItems: \"flex-start\" }}>",
        "            <LayerStamp layerTag={tag} title={title} accent={acc} />",
        "            <div style={{ fontFamily: FONT.mono, fontSize: 20, color: acc, paddingTop: 18 }}>{badge}</div>",
        "          </div>",
        "          <div style={{ background: \"rgba(242,234,216,0.95)\", borderLeft: `6px solid ${acc}`, padding: \"28px 34px\", boxShadow: \"0 26px 70px rgba(0,0,0,0.65)\" }}>",
        "            <DiagComp />",
        "          </div>",
        "        </AbsoluteFill>",
        "        {showHud && <DraftHUD sceneId={sceneId} sectionId={secId} durationInFrames={durationInFrames} label={title} />}",
        "      </AbsoluteFill>",
        "    );",
        "  }",
        "  if (isQuote) {",
        "    return (",
        "      <AbsoluteFill style={{ backgroundColor: C.bgDeep }}>",
        "        <DioramaBackdrop file={imgFile} move={move} dim={0.34} />",
        "        <AbsoluteFill style={{ padding: \"56px 72px 72px\", display: \"flex\", flexDirection: \"column\", justifyContent: \"space-between\" }}>",
        "          <LayerStamp layerTag={tag} title={title} accent={acc} />",
        "          <EditorialCallout quote={subtitle} source={badge} accent={acc} />",
        "        </AbsoluteFill>",
        "        {showHud && <DraftHUD sceneId={sceneId} sectionId={secId} durationInFrames={durationInFrames} label={title} />}",
        "      </AbsoluteFill>",
        "    );",
        "  }",
        "  return (",
        "    <AbsoluteFill style={{ backgroundColor: C.bgDeep }}>",
        "      <DioramaBackdrop file={imgFile} move={move} dim={0.14} />",
        "      {tracks && callouts && <SceneTrackedCallouts tracks={tracks} specs={callouts} />}",
        "      <AbsoluteFill style={{ padding: \"56px 72px 66px\", display: \"flex\", flexDirection: \"column\", justifyContent: \"space-between\" }}>",
        "        <div style={{ display: \"flex\", justifyContent: \"space-between\", alignItems: \"flex-start\" }}>",
        "          <LayerStamp layerTag={tag} title={title} accent={acc} />",
        "          <div style={{ fontFamily: FONT.mono, fontSize: 20, color: acc, paddingTop: 18 }}>{badge}</div>",
        "        </div>",
        "        <div style={{ maxWidth: 960, fontFamily: FONT.body, fontSize: 27, lineHeight: 1.42, color: C.white, background: \"rgba(16,12,10,0.72)\", borderLeft: `4px solid ${acc}`, padding: \"16px 24px\" }}>",
        "          {subtitle}",
        "        </div>",
        "      </AbsoluteFill>",
        "      {showHud && <DraftHUD sceneId={sceneId} sectionId={secId} durationInFrames={durationInFrames} label={title} />}",
        "    </AbsoluteFill>",
        "  );",
        "}};",
        "",
        "export const GENERATED_SCENES: Record<string, React.FC<SceneProps>> = {",
    ]

    sp_all = json.loads((P / "artifacts" / "scene_plan.json").read_text(encoding="utf-8"))["scenes"]
    for sec in st["sections"]:
        sc_id = sec["scene"]
        sid = sec["id"]
        row = by_sc[sc_id]
        tag, title, sub, badge = SCENE_COPY[sid]
        arch = row["archetype"]
        diag = row["diagram_id"]
        is_quote = "quote" in arch or "diagram_focus" in arch
        move = next(x["movement"] for x in sp_all if x["id"] == sc_id)
        b3d_file = row["blender_asset"]
        clip_prefix = Path(b3d_file).name[:6]  # B3D-01 .. B3D-10
        backdrop_file = f"blender/video/{clip_prefix}-clip.mp4" if diag is None else b3d_file
        gx.append(
            f"  {sc_id}: makeHero3DScene({sc_id!r}, {sid!r}, {tag!r}, {title!r}, {sub!r}, {badge!r}, "
            f"{backdrop_file!r}, {move!r}, {'true' if is_quote else 'false'}, {json.dumps(diag)}),"
        )

    gx.append("};")
    (SRC / "scenes.gen.tsx").write_text("\n".join(gx) + "\n", encoding="utf-8")
    print(f"Generated timing.ts ({st['total_frames']} frames) and scenes.gen.tsx ({len(st['sections'])} scenes)")


if __name__ == "__main__":
    main()
