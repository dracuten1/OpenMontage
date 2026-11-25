import React from "react";
// @ts-expect-error react-dom types not installed in devDependencies
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { HeroTitle } from "./SceneShell";
import { normalizeSectionCaptions } from "./NewsEpisodeShell";

describe("NewsEpisodeShell helpers & HeroTitle", () => {
  it("normalizes both scene-local and global caption clocks", () => {
    const localCaps = [{ text: "Local cue", start: 0.1, end: 1.4 }];
    expect(normalizeSectionCaptions(localCaps, 12.0)).toEqual([
      { text: "Local cue", start: 0.1, end: 1.4 },
    ]);

    const globalCaps = [{ chunk_text: "Global cue", start: 12.2, end: 14.0 }];
    expect(normalizeSectionCaptions(globalCaps, 12.0)).toEqual([
      { text: "Global cue", start: 0.2, end: 2.0 },
    ]);
  });

  it("renders HeroTitle with highlighted keyword block and subtitle", () => {
    const html = renderToStaticMarkup(
      <HeroTitle text="QUỐC HỘI MỸ TUYÊN CHIẾN?" highlight="TUYÊN CHIẾN" sub="VnExpress / Reuters" />,
    );
    expect(html).toContain("TUYÊN CHIẾN");
    expect(html).toContain("VnExpress / Reuters");
  });
});
