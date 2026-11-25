import React from "react";
import {
  AbsoluteFill,
  Img,
  OffthreadVideo,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { ChannelThemeProvider } from "../../core/theme";
import { kyChuPhapLuatTheme } from "./theme";

export interface KcplBumper9x16Props {
  bgSrc?: string;
}

export const KcplBumper9x16: React.FC<KcplBumper9x16Props> = ({
  bgSrc = "channels/ky-chu-phap-luat/brand/kcpl_bumper_9x16.mp4",
}) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const { colors, fonts, backdrop } = kyChuPhapLuatTheme;
  kyChuPhapLuatTheme.ensureFonts();

  const ruleProgress = spring({
    frame: Math.max(0, frame - 6),
    fps,
    config: { damping: 18, stiffness: 130, mass: 1 },
  });
  const titleProgress = spring({
    frame: Math.max(0, frame - 12),
    fps,
    config: { damping: 18, stiffness: 130, mass: 1 },
  });
  const subProgress = spring({
    frame: Math.max(0, frame - 20),
    fps,
    config: { damping: 20, stiffness: 120, mass: 1 },
  });

  const fadeIn = interpolate(frame, [0, 6], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const fadeOut = interpolate(
    frame,
    [Math.max(1, durationInFrames - 6), durationInFrames],
    [1, 0],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    },
  );
  const masterOpacity = fadeIn * fadeOut;

  const grainTextures = backdrop.grainTextures;
  const grainIdx =
    grainTextures.length > 0 ? Math.floor(frame / 2.5) % grainTextures.length : 0;
  const grainSrc = grainTextures[grainIdx];

  return (
    <ChannelThemeProvider theme={kyChuPhapLuatTheme}>
      <AbsoluteFill
        style={{
          backgroundColor: "#0A1E31",
          opacity: masterOpacity,
          overflow: "hidden",
        }}
      >
        <AbsoluteFill style={{ overflow: "hidden" }}>
          <OffthreadVideo
            src={staticFile(bgSrc)}
            muted
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              transform: "scale(1.12)",
              transformOrigin: "44% 40%",
            }}
          />
        </AbsoluteFill>

        {/* Seamless radial + lower scrim matching sampled #0A1E31 navy */}
        <AbsoluteFill
          style={{
            background:
              "radial-gradient(62% 38% at 50% 40%, rgba(10,30,49,0) 58%, rgba(10,30,49,0.88) 88%, #0A1E31 100%)",
          }}
        />
        <AbsoluteFill
          style={{
            background:
              "linear-gradient(180deg, rgba(10,30,49,0) 48%, rgba(10,30,49,0.92) 64%, #0A1E31 78%)",
          }}
        />

        {/* Safe Zone typography block (y: 1120..1400, x: 90..940) */}
        <div
          style={{
            position: "absolute",
            top: 1120,
            left: 90,
            width: 900,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            textAlign: "center",
          }}
        >
          <div
            style={{
              width: 260 * ruleProgress,
              height: 5,
              backgroundColor: colors.vermilion,
              marginBottom: 28,
            }}
          />
          <div
            style={{
              fontFamily: fonts.display,
              fontSize: 84,
              fontWeight: 800,
              letterSpacing: "2px",
              lineHeight: 1.05,
              color: colors.textOnDark,
              opacity: titleProgress,
              transform: `translateY(${(1 - titleProgress) * 18}px)`,
            }}
          >
            KÝ CHỦ PHÁP LUẬT
          </div>
          <div
            style={{
              marginTop: 18,
              fontFamily: fonts.body,
              fontSize: 28,
              fontWeight: 600,
              letterSpacing: "3px",
              color: "#E6B84C",
              opacity: subProgress,
              transform: `translateY(${(1 - subProgress) * 12}px)`,
            }}
          >
            TIN NGHỊ ĐỊNH  |  LUẬT ĐỜI SỐNG
          </div>
        </div>

        {/* 12fps 35mm film grain */}
        {grainSrc ? (
          <AbsoluteFill
            style={{
              opacity: 0.06,
              mixBlendMode: "overlay",
              pointerEvents: "none",
            }}
          >
            <Img
              src={staticFile(grainSrc)}
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          </AbsoluteFill>
        ) : null}
      </AbsoluteFill>
    </ChannelThemeProvider>
  );
};
