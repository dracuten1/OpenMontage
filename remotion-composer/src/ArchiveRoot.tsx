// Archived historical episode & demo compositions (moved out of Root.tsx to keep active bundles fast).
// Render any archived composition via: npx remotion render src/ArchiveRoot.tsx <comp-id> out.mp4
import React from "react";
import { Composition, registerRoot } from "remotion";
import { KidCarDemo } from "./kid-car-cartoon-demo/KidCarDemo";
import { BanhChungFull, BanhChungDraftHud, BanhChungPreview } from "./banh-chung";
import { TOTAL_FRAMES as banhChungTotalFrames } from "./banh-chung/timing";
import { DeDatDeNuocFull, DeDatDeNuocDraftHud, DeDatDeNuocPreview } from "./de-dat-de-nuoc";
import { TOTAL_FRAMES as deDatDeNuocTotalFrames } from "./de-dat-de-nuoc/timing";
import { Episode as EpisodeChinhPhu, TOTAL_FRAMES as chinhPhuTotalFrames } from "./chinh-phu-tich-tru-20261106/Episode";
import { EpisodeNvidiaCeoAffair } from "./nvidia-ceo-affair-20261109/Episode";
import { TOTAL_FRAMES as nvidiaCeoTotalFrames } from "./nvidia-ceo-affair-20261109/timing";
import UsdVndEpisode from "./usd-vnd-ky-luc-20261117/Episode";
import { TOTAL_FRAMES as usdVndTotalFrames } from "./usd-vnd-ky-luc-20261117/timing";
import { CharacterPerformerAdv } from "./CharacterPerformerAdv";
import { KidsRabbitDemo } from "./KidsRabbitDemo";
import { KidsRabbitLayered } from "./KidsRabbitLayered";
import { KidsRiggedRabbit } from "./KidsRiggedRabbit";
import { KidsRabbitCode } from "./KidsRabbitCode";
import { KidsRabbitTurtleDuet } from "./KidsRabbitDuet";
import { KidsStoryMultiScene } from "./KidsStoryMultiScene";
import { KidsStoryEp1V4 } from "./KidsStoryEp1V4";
import { KidsStoryEp1V6 } from "./KidsStoryEp1V6";
import { KidsStoryEp1V8 } from "./KidsStoryEp1V8";
import { KidsDepthDemo } from "./KidsDepthDemo";
import { KidsStoryEp1AI } from "./KidsStoryEp1AI";
import { KidsStoryEp1V2 } from "./KidsStoryEp1V2";
import { KidsRaceRigDemo } from "./KidsRaceRigDemo";
import { KidsStoryEp1RemakeDemo } from "./KidsStoryEp1RemakeDemo";
import { KidsStoryEp1Remake } from "./KidsStoryEp1Remake";
import { KidsS5BackDemo } from "./KidsS5BackDemo";
import { MeshDeformDemo } from "./MeshDeformDemo";
import { CapsuleTurnaroundDemo } from "./CapsuleTurnaroundDemo";
import { TurtleStill, TurtleStillWalk, TurtleStillProud } from "./TurtleStill";
import {
  TurtleStillV4Idle,
  TurtleStillV4Walk,
  TurtleStillV4Proud,
} from "./TurtleStillV4";
import { ScenePreview, ScenePreviewProps } from "./con-rong-chau-tien/ScenePreview";
import { VNMythEpisode } from "./con-rong-chau-tien/Episode";
import { XiVuBaTocEpisode, XI_VU_BA_TOC_FRAMES } from "./xi-vu-ba-toc/Episode";
import { SonTinhThuyTinhEpisode, SON_TINH_THUY_TINH_FRAMES } from "./son-tinh-thuy-tinh/Episode";
import { ThanhGiongEpisode, THANH_GIONG_FRAMES } from "./thanh-giong/Episode";
import {
  ChuDongTuDemo,
  CHU_DONG_TU_DEMO_FRAMES,
} from "./chu-dong-tu/Demo";
import {
  ChuDongTuEpisode,
  CHU_DONG_TU_FRAMES,
} from "./chu-dong-tu/Episode";
import { News20261017, NEWS_20261017_TOTAL_FRAMES } from "./news-daily-20261017/Episode";
import { News20261018, NEWS_20261018_TOTAL_FRAMES } from "./news-daily-20261018/Episode";
import { News20261019, NEWS_20261019_TOTAL_FRAMES } from "./news-daily-20261019/Episode";
import { LieuHanhDemo, LIEU_HANH_DEMO_FRAMES } from "./lieu-hanh/Demo";
import { LieuHanhEpisode, LIEU_HANH_FRAMES } from "./lieu-hanh/Episode";
import { CoastalReclamationDemo } from "./coastal-reclamation-20261024/Scene01Demo";
import { CoastalReclamationThumbnail } from "./coastal-reclamation-20261024/Thumbnail";
import { CoastalReclamationEpisode } from "./coastal-reclamation-20261024/Episode";
import { EpisodeMsOutage, MS_OUTAGE_TOTAL_FRAMES } from "./ms-outage-20261113/Episode";
import { MuaLuTruongBo } from "./mua-lu-trung-bo-2026-11-09/MuaLuTruongBo";
import { TOTAL_FRAMES as muaLuTotalFrames } from "./mua-lu-trung-bo-2026-11-09/timing";
import { EpisodeTinNong3Tin } from "./tin-nong-3tin-20261110/Episode";
import { TOTAL_FRAMES as tinNong3TinTotalFrames } from "./tin-nong-3tin-20261110/timing";
import EpisodeMuaLuMienTrung from "./mua-lu-mien-trung-2026-11-11/Episode";
import { TOTAL_FRAMES as muaLuMienTrungTotalFrames } from "./mua-lu-mien-trung-2026-11-11/timing";
import { EpisodeTaiChinh3Tin, TOTAL_FRAMES as taiChinh3TinTotalFrames } from "./tai-chinh-3tin-20261111/Episode";
import { EpisodeTinNong3Tin112, TOTAL_FRAMES as tinNong3Tin112TotalFrames } from "./tin-nong-3tin-20261112/Episode";
import { EpisodeFaaGroundStop } from "./faa-ground-stop-20261114/Episode";
import { TOTAL_FRAMES as faaGroundStopTotalFrames } from "./faa-ground-stop-20261114/timing";
import { EpisodeTinNong5Tin1115, TOTAL_FRAMES as tinNong5Tin1115TotalFrames } from "./tin-nong-5tin-20261115/Episode";
import { EpisodeTinNong5Tin, TOTAL_FRAMES as tinNong5TinTotalFrames } from "./tin-nong-5tin-20261116/Episode";
import { EpisodeTinNong5Tin1118, TOTAL_FRAMES as tinNong5Tin1118TotalFrames } from "./tin-nong-5tin-20261118/Episode";
import { EpisodeTinNong5TinThue1118, TOTAL_FRAMES as tinNong5TinThue1118TotalFrames } from "./tin-nong-5tin-thue-20261118/Episode";
import { EpisodeTinNong4Tin1119 } from "./tin-nong-4tin-20261119/Episode";
import { TOTAL_FRAMES as tinNong4Tin1119TotalFrames } from "./tin-nong-4tin-20261119/timing";
import { EpisodeTinNong5Tin1120 } from "./tin-nong-5tin-20261120/Episode";
import { TOTAL_FRAMES as tinNong5Tin1120TotalFrames } from "./tin-nong-5tin-20261120/timing";
import { EpisodeGoldGiamSau1120 } from "./gold-giam-sau-20261120/Episode";
import { TOTAL_FRAMES as goldGiamSau1120TotalFrames } from "./gold-giam-sau-20261120/timing";
import { EpisodeTinNong5Tin1121 } from "./tin-nong-5tin-20261121/Episode";
import { TOTAL_FRAMES as tinNong5Tin1121TotalFrames } from "./tin-nong-5tin-20261121/timing";
import { EpisodeKerchKyiv1121 } from "./kerch-kyiv-20261121/Episode";
import { TOTAL_FRAMES as kerchKyiv1121TotalFrames } from "./kerch-kyiv-20261121/timing";
import { EpisodeKerchKyiv1121V2 } from "./kerch-kyiv-20261121-v2/Episode";
import { TOTAL_FRAMES as kerchKyiv1121V2TotalFrames } from "./kerch-kyiv-20261121-v2/timing";
import { Episode5Tin20261122 } from "./tin-nong-5tin-20261122/Episode";
import { TOTAL_FRAMES as tinNong5Tin1122TotalFrames } from "./tin-nong-5tin-20261122/timing";
import {
  ChibiNewsDemo,
  CHIBI_NEWS_FPS,
  CHIBI_NEWS_TOTAL_FRAMES,
} from "./chibi-ky-chu-diem-tin/ChibiNewsDemo";

export const ArchiveRoot: React.FC = () => (
  <>
    <Composition id="ChinhPhuTichTruEditorialV1" component={EpisodeChinhPhu} width={1080} height={1920} fps={30} durationInFrames={chinhPhuTotalFrames} defaultProps={{ showHud: false }} />
    <Composition id="ChinhPhuTichTruEditorialV1HUD" component={EpisodeChinhPhu} width={1080} height={1920} fps={30} durationInFrames={chinhPhuTotalFrames} defaultProps={{ showHud: true }} />
    <Composition id="usd-vnd-ky-luc-20261117" component={UsdVndEpisode} width={1080} height={1920} fps={30} durationInFrames={usdVndTotalFrames} defaultProps={{ showHud: false }} />
    <Composition id="usd-vnd-ky-luc-20261117-DRAFT" component={UsdVndEpisode} width={1080} height={1920} fps={30} durationInFrames={usdVndTotalFrames} defaultProps={{ showHud: true }} />
    <Composition id="NvidiaCeoAffairNews" component={EpisodeNvidiaCeoAffair} width={1080} height={1920} fps={30} durationInFrames={nvidiaCeoTotalFrames} defaultProps={{ hud: false, showCaptions: true }} />
    <Composition id="NvidiaCeoAffairNewsHUD" component={EpisodeNvidiaCeoAffair} width={1080} height={1920} fps={30} durationInFrames={nvidiaCeoTotalFrames} defaultProps={{ hud: true, showCaptions: true }} />
    <Composition id="KidsRiggedRabbit" component={KidsRiggedRabbit} durationInFrames={30 * 17} fps={30} width={1080} height={1080} />
    <Composition id="KidsRabbitLayered" component={KidsRabbitLayered} durationInFrames={30 * 17} fps={30} width={1080} height={1080} />
    <Composition id="KidsRabbitDemo" component={KidsRabbitDemo} durationInFrames={30 * 13} fps={30} width={1080} height={1080} />
    <Composition id="KidsRabbitCode" component={KidsRabbitCode} durationInFrames={510} fps={30} width={1080} height={1080} />
    <Composition id="KidsRabbitTurtleDuet" component={KidsRabbitTurtleDuet} durationInFrames={900} fps={30} width={1080} height={1080} />
    <Composition id="KidsStoryMultiScene" component={KidsStoryMultiScene} durationInFrames={1188} fps={30} width={1080} height={1080} />
    <Composition id="KidsStoryEp1V4" component={KidsStoryEp1V4} durationInFrames={1220} fps={30} width={1080} height={1080} />
    <Composition id="KidsStoryEp1V8" component={KidsStoryEp1V8} durationInFrames={1220} fps={30} width={1080} height={1080} />
    <Composition id="KidsStoryEp1V6" component={KidsStoryEp1V6} durationInFrames={1220} fps={30} width={1080} height={1080} />
    <Composition id="KidsDepthDemo" component={KidsDepthDemo} durationInFrames={270} fps={30} width={1080} height={1080} />
    <Composition id="KidsStoryEp1AI" component={KidsStoryEp1AI} durationInFrames={1220} fps={30} width={1080} height={1080} />
    <Composition id="KidsStoryEp1V2" component={KidsStoryEp1V2} durationInFrames={1206} fps={30} width={1080} height={1080} />
    <Composition id="KidsRaceRigDemo" component={KidsRaceRigDemo} durationInFrames={102} fps={30} width={1080} height={1080} />
    <Composition id="KidsStoryEp1RemakeDemo" component={KidsStoryEp1RemakeDemo} durationInFrames={285} fps={30} width={1080} height={1080} />
    <Composition id="KidsS5BackDemo" component={KidsS5BackDemo} durationInFrames={198} fps={30} width={1080} height={1080} />
    <Composition id="KidsStoryEp1Remake" component={KidsStoryEp1Remake} durationInFrames={1230} fps={30} width={1080} height={1080} />
    <Composition id="MeshDeformDemo" component={MeshDeformDemo} durationInFrames={150} fps={30} width={1080} height={1080} />
    <Composition id="CapsuleTurnaroundDemo" component={CapsuleTurnaroundDemo} durationInFrames={180} fps={30} width={1080} height={1080} />
    <Composition id="TurtleStill" component={TurtleStill} durationInFrames={30} fps={30} width={1080} height={1080} />
    <Composition id="TurtleStillWalk" component={TurtleStillWalk} durationInFrames={30} fps={30} width={1080} height={1080} />
    <Composition id="TurtleStillProud" component={TurtleStillProud} durationInFrames={30} fps={30} width={1080} height={1080} />
    <Composition id="TurtleStillV4Idle" component={TurtleStillV4Idle} durationInFrames={30} fps={30} width={1080} height={1080} />
    <Composition id="TurtleStillV4Walk" component={TurtleStillV4Walk} durationInFrames={30} fps={30} width={1080} height={1080} />
    <Composition id="TurtleStillV4Proud" component={TurtleStillV4Proud} durationInFrames={30} fps={30} width={1080} height={1080} />
    <Composition id="CharacterPerformerAdv" component={CharacterPerformerAdv} durationInFrames={30 * 9} fps={30} width={1080} height={1080} />
    <Composition id="VNMythEpisode" component={VNMythEpisode} durationInFrames={18245} fps={30} width={1920} height={1080} defaultProps={{ withMusic: true } as never} />
    <Composition id="ThanhGiong" component={ThanhGiongEpisode} durationInFrames={THANH_GIONG_FRAMES} fps={30} width={1920} height={1080} defaultProps={{ withMusic: true }} />
    <Composition id="ThanhGiongDraft" component={ThanhGiongEpisode} durationInFrames={THANH_GIONG_FRAMES} fps={30} width={1920} height={1080} defaultProps={{ withMusic: true, draftHud: true }} />
    <Composition id="ChuDongTuDemo" component={ChuDongTuDemo} durationInFrames={CHU_DONG_TU_DEMO_FRAMES} fps={30} width={1920} height={1080} defaultProps={{ draftHud: true }} />
    <Composition id="ChuDongTu" component={ChuDongTuEpisode} durationInFrames={CHU_DONG_TU_FRAMES} fps={30} width={1920} height={1080} defaultProps={{ withMusic: true }} />
    <Composition id="ChuDongTuDraft" component={ChuDongTuEpisode} durationInFrames={CHU_DONG_TU_FRAMES} fps={30} width={1920} height={1080} defaultProps={{ withMusic: true, draftHud: true }} />
    <Composition id="SonTinhThuyTinh" component={SonTinhThuyTinhEpisode} durationInFrames={SON_TINH_THUY_TINH_FRAMES} fps={30} width={1920} height={1080} defaultProps={{ withMusic: true }} />
    <Composition id="SonTinhThuyTinhDraft" component={SonTinhThuyTinhEpisode} durationInFrames={SON_TINH_THUY_TINH_FRAMES} fps={30} width={1920} height={1080} defaultProps={{ withMusic: true, draftHud: true }} />
    <Composition id="XiVuBaToc" component={XiVuBaTocEpisode} durationInFrames={XI_VU_BA_TOC_FRAMES} fps={30} width={1920} height={1080} defaultProps={{ withMusic: true }} />
    <Composition id="News20261017" component={News20261017} durationInFrames={NEWS_20261017_TOTAL_FRAMES} fps={30} width={1080} height={1920} defaultProps={{ hud: false }} />
    <Composition id="News20261017Debug" component={News20261017} durationInFrames={NEWS_20261017_TOTAL_FRAMES} fps={30} width={1080} height={1920} defaultProps={{ hud: true }} />
    <Composition id="News20261018" component={News20261018} durationInFrames={NEWS_20261018_TOTAL_FRAMES} fps={30} width={1080} height={1920} defaultProps={{ hud: false }} />
    <Composition id="News20261018Debug" component={News20261018} durationInFrames={NEWS_20261018_TOTAL_FRAMES} fps={30} width={1080} height={1920} defaultProps={{ hud: true }} />
    <Composition id="News20261019" component={News20261019} durationInFrames={NEWS_20261019_TOTAL_FRAMES} fps={30} width={1080} height={1920} defaultProps={{ hud: false }} />
    <Composition id="News20261019Debug" component={News20261019} durationInFrames={NEWS_20261019_TOTAL_FRAMES} fps={30} width={1080} height={1920} defaultProps={{ hud: true }} />
    <Composition
      id="VNMythScenePreview"
      component={ScenePreview}
      durationInFrames={450}
      fps={30}
      width={1920}
      height={1080}
      defaultProps={{ sceneId: "sc-03", durationInFrames: 450 } as ScenePreviewProps}
      calculateMetadata={async ({ props }) => ({
        durationInFrames: (props as ScenePreviewProps).durationInFrames,
      })}
    />
    <Composition id="LieuHanhDemo" component={LieuHanhDemo} durationInFrames={LIEU_HANH_DEMO_FRAMES} fps={30} width={1920} height={1080} defaultProps={{ draftHud: true }} />
    <Composition id="LieuHanh" component={LieuHanhEpisode} durationInFrames={LIEU_HANH_FRAMES} fps={30} width={1920} height={1080} defaultProps={{ withMusic: true }} />
    <Composition id="LieuHanhDraft" component={LieuHanhEpisode} durationInFrames={LIEU_HANH_FRAMES} fps={30} width={1920} height={1080} defaultProps={{ withMusic: true, draftHud: true }} />
    <Composition id="CoastalReclamationDemo" component={CoastalReclamationDemo} durationInFrames={300} fps={30} width={1080} height={1920} defaultProps={{ debug: true }} />
    <Composition id="CoastalReclamationDemoClean" component={CoastalReclamationDemo} durationInFrames={300} fps={30} width={1080} height={1920} defaultProps={{ debug: false }} />
    <Composition id="CoastalReclamationThumbnail" component={CoastalReclamationThumbnail} durationInFrames={1} fps={30} width={1080} height={1920} />
    <Composition id="CoastalReclamationEpisode" component={CoastalReclamationEpisode} durationInFrames={2910} fps={30} width={1080} height={1920} defaultProps={{ debug: true }} />
    <Composition id="CoastalReclamationEpisodeClean" component={CoastalReclamationEpisode} durationInFrames={2910} fps={30} width={1080} height={1920} defaultProps={{ debug: false }} />
    <Composition id="MuaLuTruongBoDraft" component={MuaLuTruongBo} durationInFrames={muaLuTotalFrames} fps={30} width={720} height={1280} defaultProps={{ hud: true, scale720: true }} />
    <Composition id="MuaLuTruongBoFinal" component={MuaLuTruongBo} durationInFrames={muaLuTotalFrames} fps={30} width={1080} height={1920} defaultProps={{ hud: false }} />
    <Composition id="tin-nong-3tin-20261110-DRAFT" component={EpisodeTinNong3Tin} durationInFrames={tinNong3TinTotalFrames} fps={30} width={1080} height={1920} defaultProps={{ hud: true }} />
    <Composition id="tin-nong-3tin-20261110-FINAL" component={EpisodeTinNong3Tin} durationInFrames={tinNong3TinTotalFrames} fps={30} width={1080} height={1920} defaultProps={{ hud: false }} />
    <Composition id="mua-lu-mien-trung-2026-11-11-DRAFT" component={EpisodeMuaLuMienTrung} durationInFrames={muaLuMienTrungTotalFrames} fps={30} width={1080} height={1920} defaultProps={{ hud: true }} />
    <Composition id="mua-lu-mien-trung-2026-11-11-FINAL" component={EpisodeMuaLuMienTrung} durationInFrames={muaLuMienTrungTotalFrames} fps={30} width={1080} height={1920} defaultProps={{ hud: false }} />
    <Composition id="tai-chinh-3tin-20261111-DRAFT" component={EpisodeTaiChinh3Tin} durationInFrames={taiChinh3TinTotalFrames} fps={30} width={1080} height={1920} defaultProps={{ hud: true }} />
    <Composition id="tai-chinh-3tin-20261111-FINAL" component={EpisodeTaiChinh3Tin} durationInFrames={taiChinh3TinTotalFrames} fps={30} width={1080} height={1920} defaultProps={{ hud: false }} />
    <Composition id="tin-nong-3tin-20261112-DRAFT" component={EpisodeTinNong3Tin112} durationInFrames={tinNong3Tin112TotalFrames} fps={30} width={1080} height={1920} defaultProps={{ showHud: true }} />
    <Composition id="tin-nong-3tin-20261112-FINAL" component={EpisodeTinNong3Tin112} durationInFrames={tinNong3Tin112TotalFrames} fps={30} width={1080} height={1920} defaultProps={{ showHud: false }} />
    <Composition id="tin-nong-5tin-20261116-DRAFT" component={EpisodeTinNong5Tin} durationInFrames={tinNong5TinTotalFrames} fps={30} width={1080} height={1920} defaultProps={{ showHud: true }} />
    <Composition id="tin-nong-5tin-20261116-FINAL" component={EpisodeTinNong5Tin} durationInFrames={tinNong5TinTotalFrames} fps={30} width={1080} height={1920} defaultProps={{ showHud: false }} />
    <Composition id="ms-outage-20261113-DRAFT" component={EpisodeMsOutage} durationInFrames={MS_OUTAGE_TOTAL_FRAMES} fps={30} width={1080} height={1920} defaultProps={{ hud: true, showCaptions: true }} />
    <Composition id="ms-outage-20261113-FINAL" component={EpisodeMsOutage} durationInFrames={MS_OUTAGE_TOTAL_FRAMES} fps={30} width={1080} height={1920} defaultProps={{ hud: false, showCaptions: true }} />
    <Composition id="faa-ground-stop-20261114-DRAFT" component={EpisodeFaaGroundStop} durationInFrames={faaGroundStopTotalFrames} fps={30} width={1080} height={1920} defaultProps={{ hud: true }} />
    <Composition id="faa-ground-stop-20261114-FINAL" component={EpisodeFaaGroundStop} durationInFrames={faaGroundStopTotalFrames} fps={30} width={1080} height={1920} defaultProps={{ hud: false }} />
    <Composition id="tin-nong-5tin-20261115-DRAFT" component={EpisodeTinNong5Tin1115} durationInFrames={tinNong5Tin1115TotalFrames} fps={30} width={1080} height={1920} defaultProps={{ showHud: true }} />
    <Composition id="tin-nong-5tin-20261115-FINAL" component={EpisodeTinNong5Tin1115} durationInFrames={tinNong5Tin1115TotalFrames} fps={30} width={1080} height={1920} defaultProps={{ showHud: false }} />
    <Composition id="tin-nong-5tin-20261118-DRAFT" component={EpisodeTinNong5Tin1118} durationInFrames={tinNong5Tin1118TotalFrames} fps={30} width={1080} height={1920} defaultProps={{ showHud: true }} />
    <Composition id="tin-nong-5tin-20261118-FINAL" component={EpisodeTinNong5Tin1118} durationInFrames={tinNong5Tin1118TotalFrames} fps={30} width={1080} height={1920} defaultProps={{ showHud: false }} />
    <Composition id="tin-nong-5tin-thue-20261118-DRAFT" component={EpisodeTinNong5TinThue1118} durationInFrames={tinNong5TinThue1118TotalFrames} fps={30} width={1080} height={1920} defaultProps={{ showHud: true }} />
    <Composition id="tin-nong-5tin-thue-20261118-FINAL" component={EpisodeTinNong5TinThue1118} durationInFrames={tinNong5TinThue1118TotalFrames} fps={30} width={1080} height={1920} defaultProps={{ showHud: false }} />
    <Composition id="tin-nong-4tin-20261119-DRAFT" component={EpisodeTinNong4Tin1119} durationInFrames={tinNong4Tin1119TotalFrames} fps={30} width={1080} height={1920} defaultProps={{ showHud: true }} />
    <Composition id="tin-nong-4tin-20261119-FINAL" component={EpisodeTinNong4Tin1119} durationInFrames={tinNong4Tin1119TotalFrames} fps={30} width={1080} height={1920} defaultProps={{ showHud: false }} />
    <Composition id="tin-nong-5tin-20261120-DRAFT" component={EpisodeTinNong5Tin1120} durationInFrames={tinNong5Tin1120TotalFrames} fps={30} width={1080} height={1920} defaultProps={{ showHud: true }} />
    <Composition id="tin-nong-5tin-20261120-FINAL" component={EpisodeTinNong5Tin1120} durationInFrames={tinNong5Tin1120TotalFrames} fps={30} width={1080} height={1920} defaultProps={{ showHud: false }} />
    <Composition id="gold-giam-sau-20261120-DRAFT" component={EpisodeGoldGiamSau1120} durationInFrames={goldGiamSau1120TotalFrames} fps={30} width={1080} height={1920} defaultProps={{ showHud: true }} />
    <Composition id="gold-giam-sau-20261120-FINAL" component={EpisodeGoldGiamSau1120} durationInFrames={goldGiamSau1120TotalFrames} fps={30} width={1080} height={1920} defaultProps={{ showHud: false }} />
    <Composition id="tin-nong-5tin-20261121-DRAFT" component={EpisodeTinNong5Tin1121} durationInFrames={tinNong5Tin1121TotalFrames} fps={30} width={1080} height={1920} defaultProps={{ showHud: true }} />
    <Composition id="tin-nong-5tin-20261121-FINAL" component={EpisodeTinNong5Tin1121} durationInFrames={tinNong5Tin1121TotalFrames} fps={30} width={1080} height={1920} defaultProps={{ showHud: false }} />
    <Composition id="kerch-kyiv-20261121-DRAFT" component={EpisodeKerchKyiv1121} durationInFrames={kerchKyiv1121TotalFrames} fps={30} width={1080} height={1920} defaultProps={{ showHud: true }} />
    <Composition id="kerch-kyiv-20261121-FINAL" component={EpisodeKerchKyiv1121} durationInFrames={kerchKyiv1121TotalFrames} fps={30} width={1080} height={1920} defaultProps={{ showHud: false }} />
    <Composition id="banh-chung-DRAFT" component={BanhChungDraftHud} durationInFrames={banhChungTotalFrames} fps={30} width={1920} height={1080} />
    <Composition id="banh-chung-FINAL" component={BanhChungFull} durationInFrames={banhChungTotalFrames} fps={30} width={1920} height={1080} defaultProps={{ showHud: false, showCaptions: false }} />
    <Composition id="banh-chung-PREVIEW" component={BanhChungPreview} durationInFrames={banhChungTotalFrames} fps={30} width={1920} height={1080} />
    <Composition id="de-dat-de-nuoc-DRAFT" component={DeDatDeNuocDraftHud} durationInFrames={deDatDeNuocTotalFrames} fps={30} width={1920} height={1080} />
    <Composition id="de-dat-de-nuoc-FINAL" component={DeDatDeNuocFull} durationInFrames={deDatDeNuocTotalFrames} fps={30} width={1920} height={1080} defaultProps={{ showHud: false, showCaptions: false }} />
    <Composition id="de-dat-de-nuoc-PREVIEW" component={DeDatDeNuocPreview} durationInFrames={deDatDeNuocTotalFrames} fps={30} width={1920} height={1080} />
    <Composition id="KidCarCartoonDemo" component={KidCarDemo} durationInFrames={240} fps={24} width={1280} height={720} />
    <Composition id="kerch-kyiv-20261121-v2-DRAFT" component={EpisodeKerchKyiv1121V2} durationInFrames={kerchKyiv1121V2TotalFrames} fps={30} width={1080} height={1920} defaultProps={{ showHud: true }} />
    <Composition id="kerch-kyiv-20261121-v2-FINAL" component={EpisodeKerchKyiv1121V2} durationInFrames={kerchKyiv1121V2TotalFrames} fps={30} width={1080} height={1920} defaultProps={{ showHud: false }} />
    <Composition id="tin-nong-5tin-20261122-DRAFT" component={Episode5Tin20261122} durationInFrames={tinNong5Tin1122TotalFrames} fps={30} width={1080} height={1920} defaultProps={{ showHud: true }} />
    <Composition id="tin-nong-5tin-20261122-FINAL" component={Episode5Tin20261122} durationInFrames={tinNong5Tin1122TotalFrames} fps={30} width={1080} height={1920} defaultProps={{ showHud: false }} />
    <Composition id="ChibiKyChuDiemTin" component={ChibiNewsDemo} durationInFrames={CHIBI_NEWS_TOTAL_FRAMES} fps={CHIBI_NEWS_FPS} width={1080} height={1920} defaultProps={{ showHud: false }} />
  </>
);

registerRoot(ArchiveRoot);
