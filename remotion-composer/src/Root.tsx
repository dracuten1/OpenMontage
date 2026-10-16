import { Composition, CalculateMetadataFunction } from "remotion";
import { Explainer, ExplainerProps } from "./Explainer";
import {
  CinematicRenderer,
  calculateCinematicMetadata,
} from "./CinematicRenderer";
import { signalFromTomorrowWithMusicFixture } from "./cinematic/fixtures";
import { TalkingHead, TalkingHeadProps } from "./TalkingHead";
import {
  TitledVideo,
  calculateTitledVideoMetadata,
} from "./TitledVideo";
import { EndTag, EndTagProps } from "./components/EndTag";
import { HeroTitle } from "./components/HeroTitle";
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
import { ProductReveal, ProductRevealProps } from "./components/ProductReveal";
import { CaptionOverlay, WordCaption } from "./components/CaptionOverlay";
import { CollageBurst, CollageBurstProps } from "./CollageBurst";
import { LyricOverlay, LyricOverlayProps } from "./LyricOverlay";
import { ScenePreview, ScenePreviewProps } from "./con-rong-chau-tien/ScenePreview";
import { VNMythEpisode } from "./con-rong-chau-tien/Episode";
import { XiVuBaTocEpisode, XI_VU_BA_TOC_FRAMES } from "./xi-vu-ba-toc/Episode";
import { SonTinhThuyTinhEpisode, SON_TINH_THUY_TINH_FRAMES } from "./son-tinh-thuy-tinh/Episode";

// ---------------------------------------------------------------------------
// Theme System — prevents every video from looking like dark fintech
// ---------------------------------------------------------------------------

export interface ThemeConfig {
  primaryColor: string;
  accentColor: string;
  backgroundColor: string;
  surfaceColor: string;
  textColor: string;
  mutedTextColor: string;
  headingFont: string;
  bodyFont: string;
  monoFont: string;
  chartColors: string[];
  springConfig: { damping: number; stiffness: number; mass: number };
  transitionDuration: number;
  captionHighlightColor: string;
  captionBackgroundColor: string;
}

export const THEMES: Record<string, ThemeConfig> = {
  "clean-professional": {
    primaryColor: "#2563EB",
    accentColor: "#F59E0B",
    backgroundColor: "#FFFFFF",
    surfaceColor: "#F9FAFB",
    textColor: "#1F2937",
    mutedTextColor: "#6B7280",
    headingFont: "Inter",
    bodyFont: "Inter",
    monoFont: "JetBrains Mono",
    chartColors: ["#2563EB", "#F59E0B", "#10B981", "#8B5CF6", "#EC4899", "#06B6D4"],
    springConfig: { damping: 20, stiffness: 120, mass: 1 },
    transitionDuration: 0.4,
    captionHighlightColor: "#2563EB",
    captionBackgroundColor: "rgba(255, 255, 255, 0.85)",
  },
  "flat-motion-graphics": {
    primaryColor: "#7C3AED",
    accentColor: "#EC4899",
    backgroundColor: "#0F172A",
    surfaceColor: "#1E293B",
    textColor: "#F8FAFC",
    mutedTextColor: "#94A3B8",
    headingFont: "Space Grotesk",
    bodyFont: "Space Grotesk",
    monoFont: "Fira Code",
    chartColors: ["#7C3AED", "#EC4899", "#06B6D4", "#F59E0B", "#10B981", "#EF4444"],
    springConfig: { damping: 12, stiffness: 80, mass: 1 },
    transitionDuration: 0.3,
    captionHighlightColor: "#22D3EE",
    captionBackgroundColor: "rgba(15, 23, 42, 0.75)",
  },
  "minimalist-diagram": {
    primaryColor: "#1A1A2E",
    accentColor: "#E94560",
    backgroundColor: "#FAFAFA",
    surfaceColor: "#FFFFFF",
    textColor: "#1A1A2E",
    mutedTextColor: "#6B7280",
    headingFont: "IBM Plex Sans",
    bodyFont: "IBM Plex Sans",
    monoFont: "IBM Plex Mono",
    chartColors: ["#E94560", "#1A1A2E", "#0F3460", "#9CA3AF"],
    springConfig: { damping: 25, stiffness: 150, mass: 1 },
    transitionDuration: 0.5,
    captionHighlightColor: "#E94560",
    captionBackgroundColor: "rgba(250, 250, 250, 0.9)",
  },
  "anime-ghibli": {
    primaryColor: "#2D5016",
    accentColor: "#FFB347",
    backgroundColor: "#0A0A1A",
    surfaceColor: "#1A2332",
    textColor: "#F0E6D3",
    mutedTextColor: "#A8957E",
    headingFont: "Noto Serif JP",
    bodyFont: "Noto Sans",
    monoFont: "Fira Code",
    chartColors: ["#FFB347", "#2D5016", "#FF6B9D", "#A8E6CF", "#6B4C8A", "#E8927C"],
    springConfig: { damping: 18, stiffness: 60, mass: 1 },
    transitionDuration: 1.0,
    captionHighlightColor: "#FFB347",
    captionBackgroundColor: "rgba(10, 10, 26, 0.8)",
  },
};

// Default theme when none is specified — uses the existing dark style for backwards compatibility
export const DEFAULT_THEME = THEMES["flat-motion-graphics"];

export function resolveTheme(props: Record<string, unknown>): ThemeConfig {
  const themeName = (props.theme as string) || (props.playbook as string);
  if (themeName && THEMES[themeName]) {
    return THEMES[themeName];
  }
  // Allow custom theme passed as full object
  if (props.themeConfig && typeof props.themeConfig === "object") {
    return { ...DEFAULT_THEME, ...(props.themeConfig as Partial<ThemeConfig>) };
  }
  return DEFAULT_THEME;
}

const calculateMetadata: CalculateMetadataFunction<ExplainerProps> = async ({
  props,
}) => {
  const cuts = props.cuts || [];
  if (cuts.length === 0) {
    return { durationInFrames: 30 * 60 };
  }
  const lastEnd = Math.max(...cuts.map((c) => c.out_seconds || 0));
  // Add 1 second padding for final fade
  return { durationInFrames: Math.ceil((lastEnd + 1) * 30) };
};

export const Root: React.FC = () => {
  return (
    <>
      <Composition
        id="Explainer"
        component={Explainer}
        durationInFrames={30 * 60}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{
          cuts: [],
          overlays: [],
          captions: [],
          audio: {},
        }}
        calculateMetadata={calculateMetadata}
      />
      <Composition
        id="CinematicRenderer"
        component={CinematicRenderer}
        durationInFrames={30 * 30}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{
          scenes: [],
          titleFontSize: 78,
          titleWidth: 1320,
          signalLineCount: 18,
        }}
        calculateMetadata={calculateCinematicMetadata}
      />
      <Composition
        id="SignalFromTomorrowWithMusic"
        component={CinematicRenderer}
        durationInFrames={30 * 30}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={signalFromTomorrowWithMusicFixture}
        calculateMetadata={calculateCinematicMetadata}
      />
      <Composition
        id="TalkingHead"
        component={TalkingHead}
        durationInFrames={30 * 300}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={{
          videoSrc: "",
          captions: [],
          overlays: [],
          wordsPerPage: 4,
          fontSize: 52,
          highlightColor: "#22D3EE",
        }}
      />
      <Composition
        id="TitledVideo"
        component={TitledVideo}
        durationInFrames={30 * 60}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{
          videoSrc: "",
          tagline: "home is a verb.",
          taglineInSeconds: 53.5,
          taglineOutSeconds: undefined,
          topPx: 150,
          fontSize: 148,
          accentColor: "#F5C470",
        }}
        calculateMetadata={calculateTitledVideoMetadata}
      />
      <Composition
        id="KidsRiggedRabbit"
        component={KidsRiggedRabbit}
        durationInFrames={30 * 17}
        fps={30}
        width={1080}
        height={1080}
      />
      <Composition
        id="KidsRabbitLayered"
        component={KidsRabbitLayered}
        durationInFrames={30 * 17}
        fps={30}
        width={1080}
        height={1080}
      />
      <Composition
        id="KidsRabbitDemo"
        component={KidsRabbitDemo}
        durationInFrames={30 * 13}
        fps={30}
        width={1080}
        height={1080}
      />
      <Composition
        id="KidsRabbitCode"
        component={KidsRabbitCode}
        durationInFrames={510}
        fps={30}
        width={1080}
        height={1080}
      />
      <Composition
        id="KidsRabbitTurtleDuet"
        component={KidsRabbitTurtleDuet}
        durationInFrames={900}
        fps={30}
        width={1080}
        height={1080}
      />
      <Composition
        id="KidsStoryMultiScene"
        component={KidsStoryMultiScene}
        durationInFrames={1188}
        fps={30}
        width={1080}
        height={1080}
      />
      <Composition
        id="KidsStoryEp1V4"
        component={KidsStoryEp1V4}
        durationInFrames={1220}
        fps={30}
        width={1080}
        height={1080}
      />
      <Composition
        id="KidsStoryEp1V8"
        component={KidsStoryEp1V8}
        durationInFrames={1220}
        fps={30}
        width={1080}
        height={1080}
      />
      <Composition
        id="KidsStoryEp1V6"
        component={KidsStoryEp1V6}
        durationInFrames={1220}
        fps={30}
        width={1080}
        height={1080}
      />
      <Composition
        id="KidsDepthDemo"
        component={KidsDepthDemo}
        durationInFrames={270}
        fps={30}
        width={1080}
        height={1080}
      />
      <Composition
        id="KidsStoryEp1AI"
        component={KidsStoryEp1AI}
        durationInFrames={1220}
        fps={30}
        width={1080}
        height={1080}
      />
      <Composition
        id="KidsStoryEp1V2"
        component={KidsStoryEp1V2}
        durationInFrames={1206}
        fps={30}
        width={1080}
        height={1080}
      />
      <Composition
        id="KidsRaceRigDemo"
        component={KidsRaceRigDemo}
        durationInFrames={102}
        fps={30}
        width={1080}
        height={1080}
      />
      <Composition
        id="KidsStoryEp1RemakeDemo"
        component={KidsStoryEp1RemakeDemo}
        durationInFrames={285}
        fps={30}
        width={1080}
        height={1080}
      />
      <Composition
        id="KidsS5BackDemo"
        component={KidsS5BackDemo}
        durationInFrames={198}
        fps={30}
        width={1080}
        height={1080}
      />
      <Composition
        id="KidsStoryEp1Remake"
        component={KidsStoryEp1Remake}
        durationInFrames={1230}
        fps={30}
        width={1080}
        height={1080}
      />
      <Composition
        id="MeshDeformDemo"
        component={MeshDeformDemo}
        durationInFrames={150}
        fps={30}
        width={1080}
        height={1080}
      />
      <Composition
        id="CapsuleTurnaroundDemo"
        component={CapsuleTurnaroundDemo}
        durationInFrames={180}
        fps={30}
        width={1080}
        height={1080}
      />
      <Composition
        id="TurtleStill"
        component={TurtleStill}
        durationInFrames={30}
        fps={30}
        width={1080}
        height={1080}
      />
      <Composition
        id="TurtleStillWalk"
        component={TurtleStillWalk}
        durationInFrames={30}
        fps={30}
        width={1080}
        height={1080}
      />
      <Composition
        id="TurtleStillProud"
        component={TurtleStillProud}
        durationInFrames={30}
        fps={30}
        width={1080}
        height={1080}
      />
      <Composition
        id="TurtleStillV4Idle"
        component={TurtleStillV4Idle}
        durationInFrames={30}
        fps={30}
        width={1080}
        height={1080}
      />
      <Composition
        id="TurtleStillV4Walk"
        component={TurtleStillV4Walk}
        durationInFrames={30}
        fps={30}
        width={1080}
        height={1080}
      />
      <Composition
        id="TurtleStillV4Proud"
        component={TurtleStillV4Proud}
        durationInFrames={30}
        fps={30}
        width={1080}
        height={1080}
      />
      <Composition
        id="CharacterPerformerAdv"
        component={CharacterPerformerAdv}
        durationInFrames={30 * 9}
        fps={30}
        width={1080}
        height={1080}
      />
      <Composition
        id="HeroTitle"
        component={HeroTitle}
        durationInFrames={30 * 17}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{
          title: "THE CALIBRATORS",
          subtitle: "The People Who Define Reality",
        }}
      />
      <Composition
        id="ProductReveal"
        component={ProductReveal}
        durationInFrames={30 * 8}
        fps={30}
        width={1280}
        height={720}
        defaultProps={{
          productImage: "airnothing/product.png",
          productName: "AirNothing Pro Max Ultra",
          price: "Starting at $999",
          tagline: "Nothing included.",
          closer: "Less is nothing.",
          accentColor: "#00D4FF",
        } as ProductRevealProps}
      />
      <Composition
        id="ProductRevealVertical"
        component={ProductReveal}
        durationInFrames={30 * 8}
        fps={30}
        width={720}
        height={1280}
        defaultProps={{
          productImage: "airnothing/product.png",
          productName: "AirNothing Pro Max Ultra",
          price: "Starting at $999",
          tagline: "Nothing included.",
          closer: "Less is nothing.",
          accentColor: "#00D4FF",
        } as ProductRevealProps}
      />
      <Composition
        id="CaptionOverlayOnly"
        component={CaptionOverlay}
        durationInFrames={30 * 300}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{
          words: [] as WordCaption[],
          wordsPerPage: 3,
          fontSize: 58,
          highlightColor: "#FACC15",
          backgroundColor: "rgba(15, 23, 42, 0.75)",
        }}
      />
      <Composition
        id="CollageBurst"
        component={CollageBurst}
        durationInFrames={30 * 30}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={{
          backgroundSrc: "",
          backgroundInSeconds: 0,
          curtainStartSeconds: 1.5,
          curtainEndSeconds: 3.0,
          clips: [],
        } as CollageBurstProps}
      />
      <Composition
        id="LyricOverlay"
        component={LyricOverlay}
        durationInFrames={30 * 28}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={{
          videoSrc: "",
          lyrics: [],
          bottomY: 0.88,
        } as LyricOverlayProps}
      />
      <Composition
        id="EndTag"
        component={EndTag}
        // 5.5s at 30fps = 165 frames. Render CLI can override via --props.
        durationInFrames={165}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{
          text: "THE CITY KEEPS ITS OWN VIGIL.",
          palette: "cool_offwhite_on_black",
          fadeInSeconds: 0.6,
          holdSeconds: 4.3,
          fadeOutSeconds: 0.6,
        } as EndTagProps}
      />
      <Composition
        id="EndTagOverlay"
        component={EndTag}
        // 8.19s at 30fps = 246 frames. Render CLI can override via --props.
        // Intended to be composited on top of body footage, not concat'd.
        durationInFrames={246}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{
          text: "EARN THE LIGHT.",
          palette: "cool_offwhite_on_black",
          fadeInSeconds: 1.0,
          holdSeconds: 5.69,
          fadeOutSeconds: 1.5,
          overlay: true,
        } as EndTagProps}
      />
      <Composition
        id="VNMythEpisode"
        component={VNMythEpisode}
        durationInFrames={18245}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{ withMusic: true } as never}
      />
      <Composition
        id="SonTinhThuyTinh"
        component={SonTinhThuyTinhEpisode}
        durationInFrames={SON_TINH_THUY_TINH_FRAMES}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{ withMusic: true }}
      />
      <Composition
        id="SonTinhThuyTinhDraft"
        component={SonTinhThuyTinhEpisode}
        durationInFrames={SON_TINH_THUY_TINH_FRAMES}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{ withMusic: true, draftHud: true }}
      />
      <Composition
        id="XiVuBaToc"
        component={XiVuBaTocEpisode}
        durationInFrames={XI_VU_BA_TOC_FRAMES}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{ withMusic: true }}
      />
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
    </>
  );
};
