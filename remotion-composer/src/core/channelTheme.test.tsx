import React from "react";
// @ts-expect-error react-dom types not installed in devDependencies
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("remotion", async () => {
  const actual = await vi.importActual<typeof import("remotion")>("remotion");
  return {
    ...actual,
    Sequence: ({ children }: { children?: React.ReactNode }) => React.createElement(React.Fragment, null, children),
    Img: ({ src, style }: { src?: string; style?: React.CSSProperties }) =>
      React.createElement("img", { src, style }),
    OffthreadVideo: ({ src, style }: { src?: string; style?: React.CSSProperties }) =>
      React.createElement("video", { src, style }),
    Audio: ({ src }: { src?: string }) => React.createElement("audio", { src }),
    useCurrentFrame: () => 0,
    useVideoConfig: () => ({
      width: 1920,
      height: 1080,
      fps: 30,
      durationInFrames: 150,
      id: "test-comp",
      defaultProps: {},
    }),
  };
});

import { getChannelTheme, listChannelIds } from "../channels/registry";
import { kyChuDiemTinTheme } from "../channels/ky-chu-diem-tin/theme";
import { kyChuPhapLuatTheme } from "../channels/ky-chu-phap-luat/theme";
import { vnMythTheme } from "../channels/vn-myth/theme";
import { COLORS as NEWS_COLORS, SAFE as NEWS_SAFE } from "../components/news/theme";
import { BrandBumper } from "../core/BrandBumper";
import { CaptionLayer, SceneShell } from "../core/SceneShell";
import { ChannelThemeProvider, createChannelTheme } from "../core/theme";

describe("Multi-channel Remotion core theming", () => {
  it("registers ky-chu-diem-tin, ky-chu-phap-luat, and vn-myth with expected canvas & bumper config", () => {
    const ids = listChannelIds();
    expect(ids).toContain("ky-chu-diem-tin");
    expect(ids).toContain("ky-chu-phap-luat");
    expect(ids).toContain("vn-myth");
    expect(getChannelTheme("ky-chu-diem-tin").canvas).toEqual({ width: 1080, height: 1920, fps: 30 });
    expect(getChannelTheme("ky-chu-diem-tin").bumper.enabled).toBe(true);
    expect(getChannelTheme("ky-chu-phap-luat").canvas).toEqual({ width: 1080, height: 1920, fps: 30 });
    expect(getChannelTheme("ky-chu-phap-luat").bumper.enabled).toBe(true);
    expect(getChannelTheme("ky-chu-phap-luat").bumper.frames).toBe(90);
    expect(getChannelTheme("ky-chu-phap-luat").colors.ink).toBe("#0D1B2A");
    expect(getChannelTheme("vn-myth").canvas).toEqual({ width: 1920, height: 1080, fps: 30 });
    expect(getChannelTheme("vn-myth").bumper.enabled).toBe(false);
  });

  it("deep-merges createChannelTheme overrides while preserving base tokens", () => {
    const custom = createChannelTheme("clean-minimal", {
      id: "science-brief",
      name: "Science Brief",
      colors: { accent: "#14B8A6", vermilion: "#14B8A6" },
    });
    expect(custom.id).toBe("science-brief");
    expect(custom.colors.accent).toBe("#14B8A6");
    expect(custom.colors.paper).toBe("#FAFAFA");
    expect(custom.safe.maxW).toBe(1728);
  });

  it("renders SceneShell, CaptionLayer, and BrandBumper with active ChannelThemeProvider", () => {
    const mythHtml = renderToStaticMarkup(
      <ChannelThemeProvider theme={vnMythTheme}>
        <SceneShell sceneId="scene-1" label="Intro" kicker="VN-MYTH">
          <CaptionLayer captions={[{ text: "Truyền thuyết 100 năm", start: 0, end: 5 }]} />
        </SceneShell>
        <BrandBumper />
      </ChannelThemeProvider>,
    );
    expect(mythHtml).toContain("VN-MYTH");
    expect(mythHtml).toContain(vnMythTheme.colors.ink);
    // vn-myth has bumper disabled (null video paths), so BrandBumper renders nothing
    expect(mythHtml).not.toContain("kcdt_bumper");

    const legalHtml = renderToStaticMarkup(
      <ChannelThemeProvider theme={kyChuPhapLuatTheme}>
        <SceneShell sceneId="scene-1" label="Legal Cover" kicker="NGHỊ ĐỊNH MỚI">
          <CaptionLayer captions={[{ text: "Phạt tới 6 triệu đồng", start: 0, end: 4 }]} />
        </SceneShell>
        <BrandBumper aspect="9x16" />
      </ChannelThemeProvider>,
    );
    expect(legalHtml).toContain("NGHỊ ĐỊNH MỚI");
    expect(legalHtml).toContain("#0D1B2A");
    expect(legalHtml).toContain("#F6F2E9");
    expect(legalHtml).toContain("#145A4A");
    expect(legalHtml).toContain("kcpl_bumper_9x16.mp4");
    expect(legalHtml).not.toContain("kcdt_bumper");
  });

  it("keeps backward-compatible components/news tokens aligned with ky-chu-diem-tin", () => {
    expect(NEWS_COLORS).toEqual(kyChuDiemTinTheme.colors);
    expect(NEWS_SAFE).toEqual(kyChuDiemTinTheme.safe);
  });
});
