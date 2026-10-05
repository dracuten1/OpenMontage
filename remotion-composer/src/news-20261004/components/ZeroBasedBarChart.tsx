import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { C, FONT, SPRING, fmtVi, toneFill, toneText, type Tone } from "../theme";
import { Spoken } from "../timing";

export interface BarDatum {
  label: string;
  value: number;
  /** scene-local frame at which THIS bar starts growing (frame its label/value is spoken) */
  at: number;
  tone?: Tone;
  /** optional sub-label shown under the label (e.g. "Big4") */
  sub?: string;
}

export interface ZeroBasedBarChartProps {
  data: BarDatum[];
  /** unit appended to value labels, e.g. "%", " triệu đ" */
  unit?: string;
  decimals?: number;
  /** axis max; default = max(value) * 1.15. Axis ALWAYS starts at 0. */
  max?: number;
  orientation?: "horizontal" | "vertical";
  width?: number;
  height?: number;
  /** frame at which the axis/gridlines fade in (default: earliest bar.at - 6) */
  axisAt?: number;
  /** title/caption shown above chart */
  title?: string;
  /** show the "0" baseline tick label (default true) */
  showZero?: boolean;
}

/**
 * Bar chart whose axis is ALWAYS zero-based; each bar scales from 0 at its own `at` frame
 * and its value label counts up with it. Only feed values from research_digest.
 */
export const ZeroBasedBarChart: React.FC<ZeroBasedBarChartProps> = ({
  data, unit = "", decimals = 1, max, orientation = "horizontal", width = 1100, height = 520, axisAt, title, showZero = true,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const top = max ?? Math.max(...data.map((d) => d.value)) * 1.15;
  const a0 = axisAt ?? Math.max(0, Math.min(...data.map((d) => d.at)) - 6);
  const horizontal = orientation === "horizontal";
  const labelW = horizontal ? 280 : 0;
  const valW = horizontal ? 190 : 0;
  const plotW = horizontal ? width - labelW - valW : width;
  const plotH = horizontal ? height : height - 110;
  const ticks = [0, 0.25, 0.5, 0.75, 1];
  const gap = 18;
  const n = data.length;
  const bandH = horizontal ? (plotH - gap * (n - 1)) / n : 0;
  const bandW = horizontal ? 0 : (plotW - gap * (n - 1)) / n;

  return (
    <Spoken at={a0} fromY={12}>
      <div style={{ width, fontFamily: FONT }}>
        {title ? <div style={{ fontSize: 30, fontWeight: 600, color: C.textSoft, marginBottom: 14 }}>{title}</div> : null}
        <div style={{ position: "relative", width, height }}>
          {/* gridlines + tick labels */}
          {ticks.map((t) => {
            const v = top * t;
            const pos = horizontal ? { left: labelW + plotW * t, top: 0, width: 1, height: plotH } : { left: 0, top: plotH * (1 - t), width: plotW, height: 1 };
            return (
              <React.Fragment key={t}>
                <div style={{ position: "absolute", background: t === 0 ? C.muted : C.border, opacity: t === 0 ? 1 : 0.6, ...pos }} />
                {(t > 0 || showZero) && horizontal ? (
                  <div style={{ position: "absolute", left: labelW + plotW * t - 40, top: plotH + 8, width: 80, textAlign: "center", fontSize: 22, color: C.muted }}>
                    {fmtVi(v, v % 1 ? 1 : 0)}
                  </div>
                ) : null}
                {(t > 0 || showZero) && !horizontal ? (
                  <div style={{ position: "absolute", left: -4, top: plotH * (1 - t) - 14, transform: "translateX(-100%)", fontSize: 22, color: C.muted }}>
                    {fmtVi(v, v % 1 ? 1 : 0)}
                  </div>
                ) : null}
              </React.Fragment>
            );
          })}
          {data.map((d, i) => {
            const p = frame < d.at ? 0 : Math.min(1, spring({ frame: frame - d.at, fps, config: { ...SPRING, damping: 26 } }));
            const shown = d.value * p;
            const frac = (d.value / top) * p;
            const tone = d.tone ?? "blue";
            const label = `${fmtVi(shown, decimals)}${unit}`;
            const op = interpolate(frame - d.at, [0, 6], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
            if (horizontal) {
              const y = i * (bandH + gap);
              return (
                <div key={i} style={{ position: "absolute", left: 0, top: y, width, height: bandH, opacity: op }}>
                  <div style={{ position: "absolute", left: 0, width: labelW - 20, height: bandH, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "flex-end", textAlign: "right" }}>
                    <div style={{ fontSize: 30, fontWeight: 600, color: C.text }}>{d.label}</div>
                    {d.sub ? <div style={{ fontSize: 22, color: C.muted }}>{d.sub}</div> : null}
                  </div>
                  <div style={{ position: "absolute", left: labelW, width: plotW * frac, height: bandH, background: toneFill(tone), borderRadius: "0 10px 10px 0" }} />
                  <div style={{ position: "absolute", left: labelW + plotW * frac + 14, height: bandH, display: "flex", alignItems: "center", fontSize: 40, fontWeight: 800, color: toneText(tone), fontVariantNumeric: "tabular-nums" }}>
                    {label}
                  </div>
                </div>
              );
            }
            const x = i * (bandW + gap);
            const barH = plotH * frac;
            return (
              <div key={i} style={{ position: "absolute", left: x, top: 0, width: bandW, height, opacity: op }}>
                <div style={{ position: "absolute", left: 0, width: bandW, bottom: height - plotH, height: barH, background: toneFill(tone), borderRadius: "10px 10px 0 0" }} />
                <div style={{ position: "absolute", left: 0, width: bandW, bottom: height - plotH + barH + 8, textAlign: "center", fontSize: 38, fontWeight: 800, color: toneText(tone), fontVariantNumeric: "tabular-nums" }}>
                  {label}
                </div>
                <div style={{ position: "absolute", left: 0, width: bandW, top: plotH + 12, textAlign: "center", fontSize: 28, fontWeight: 600, color: C.text }}>
                  {d.label}
                  {d.sub ? <div style={{ fontSize: 22, fontWeight: 400, color: C.muted }}>{d.sub}</div> : null}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </Spoken>
  );
};
