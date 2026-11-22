import { describe, expect, it } from "vitest";
import { geoMercator, geoPath } from "d3-geo";
import { feature } from "topojson-client";
import countries50m from "world-atlas/countries-50m.json";
import type { GeoFeatureCollection } from "d3-geo";
import {
  archivalSpotlightLayout,
  comparisonSplitLayout,
  editorialMapLayout,
  flowTimelineLayout,
} from "./index";
import { computeYDomain, editorialLineChartLayout } from "../charts";
import {
  BRAND_BUMPER_FRAMES,
  BRAND_BUMPER_SECONDS,
  BrandBumper,
  SAFE,
  SAFE_16X9,
} from "../news";
import { assertInBounds, assertRailSafe } from "../layoutGuard";

describe("editorial visual kit", () => {
  it("keeps Safe Zone v3.2 and 16:9 constants within canvas bounds", () => {
    expect(SAFE.cardTop).toBe(350);
    expect(SAFE.cardBottom).toBe(1420);
    expect(SAFE.subTop).toBe(1480);
    expect(SAFE.subBottom).toBe(1600);
    expect(SAFE.margin + SAFE.maxW).toBeLessThanOrEqual(940);
    expect(SAFE_16X9.width).toBe(1920);
    expect(SAFE_16X9.height).toBe(1080);
  });

  it("projects Kerch and Kyiv inside map viewport using world-atlas countries-50m", () => {
    const fc = feature(countries50m, countries50m.objects.countries) as GeoFeatureCollection;
    expect(fc.features.length).toBeGreaterThan(100);

    const proj = geoMercator()
      .center([33.5, 48.0])
      .scale(2400)
      .translate([425, 250])
      .clipExtent([
        [0, 0],
        [850, 500],
      ]);

    const kerchPt = proj([36.51, 45.3]);
    const kyivPt = proj([30.52, 50.45]);
    expect(kerchPt).not.toBeNull();
    expect(kyivPt).not.toBeNull();
    expect(kerchPt![0]).toBeGreaterThan(0);
    expect(kerchPt![0]).toBeLessThan(850);
    expect(kerchPt![1]).toBeGreaterThan(0);
    expect(kerchPt![1]).toBeLessThan(500);
    expect(kyivPt![0]).toBeGreaterThan(0);
    expect(kyivPt![0]).toBeLessThan(850);
    expect(kyivPt![1]).toBeGreaterThan(0);
    expect(kyivPt![1]).toBeLessThan(500);

    const pathGen = geoPath(proj);
    const ukraine = fc.features.find((f) => String(f.id) === "804");
    expect(ukraine).toBeDefined();
    expect(pathGen(ukraine!)).toBeTruthy();
  });

  it("validates editorialMapLayout bounds and rejects invalid dimensions", () => {
    const layout = editorialMapLayout(850, 500, [
      { id: "p1", coords: [36.51, 45.3], label: "Kerch", enterFrame: 10 },
    ]);
    expect(layout.width).toBe(850);
    expect(layout.height).toBe(500);
    expect(layout.pinCount).toBe(1);
    assertInBounds({
      id: "map-container",
      left: 0,
      top: 0,
      w: layout.width,
      h: layout.height,
      containerW: SAFE.maxW,
      containerH: SAFE.cardBottom - SAFE.cardTop,
    });
    assertRailSafe({ id: "map-rail", rightDesign: SAFE.margin + layout.width, camMax: 1.0 });
    expect(() => editorialMapLayout(0, 500)).toThrow();
  });

  it("computes honest y-domain with axis-break detection for narrow variance", () => {
    const narrow = computeYDomain([137.5, 137.5, 137.2, 137.2, 136.2], "auto");
    expect(narrow.hasAxisBreak).toBe(true);
    expect(narrow.min).toBeGreaterThan(130);
    expect(narrow.max).toBeGreaterThan(137.5);

    const zeroBased = computeYDomain([137.5, 136.2], "zero");
    expect(zeroBased.hasAxisBreak).toBe(false);
    expect(zeroBased.min).toBe(0);

    const explicit = computeYDomain([10, 20], [5, 30]);
    expect(explicit.hasAxisBreak).toBe(true);
    expect(explicit.min).toBe(5);
    expect(explicit.max).toBe(30);
  });

  it("computes editorialLineChartLayout points inside plot area", () => {
    const data = [
      { label: "15/11", value: 137.5 },
      { label: "16/11", value: 137.5 },
      { label: "17/11", value: 137.2 },
      { label: "18/11", value: 137.2 },
      { label: "19/11", value: 136.2 },
    ];
    const layout = editorialLineChartLayout(data, 820, 420, "auto", true);
    expect(layout.points).toHaveLength(5);
    expect(layout.domain.hasAxisBreak).toBe(true);
    for (const pt of layout.points) {
      expect(pt.x).toBeGreaterThanOrEqual(layout.plotLeft);
      expect(pt.x).toBeLessThanOrEqual(layout.plotLeft + layout.plotWidth);
      expect(pt.y).toBeGreaterThanOrEqual(layout.plotTop);
      expect(pt.y).toBeLessThanOrEqual(layout.plotTop + layout.plotHeight);
    }
  });

  it("computes layout bounds for ArchivalSpotlight, FlowTimeline, and ComparisonSplit", () => {
    const spot = archivalSpotlightLayout(850, 520, true);
    expect(spot.photoHeight).toBe(388);
    expect(() => archivalSpotlightLayout(-10, 200)).toThrow();

    const flow = flowTimelineLayout(3, 850, 20, 162);
    expect(flow.height).toBe(526);
    assertInBounds({
      id: "flow",
      left: 0,
      top: 0,
      w: flow.width,
      h: flow.height,
      containerW: SAFE.maxW,
      containerH: SAFE.cardBottom - SAFE.cardTop,
    });

    const split = comparisonSplitLayout(850, 480);
    expect(split.columnWidth * 2 + split.dividerGap).toBeLessThanOrEqual(850);
    assertInBounds({
      id: "split",
      left: 0,
      top: 0,
      w: split.width,
      h: split.height,
      containerW: SAFE.maxW,
      containerH: SAFE.cardBottom - SAFE.cardTop,
    });
  });

  it("exports BrandBumper with 90-frame (3s) outro stinger constants", () => {
    expect(BRAND_BUMPER_FRAMES).toBe(90);
    expect(BRAND_BUMPER_SECONDS).toBe(3);
    expect(typeof BrandBumper).toBe("function");
  });
});
