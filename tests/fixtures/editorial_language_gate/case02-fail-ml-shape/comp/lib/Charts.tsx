// case02 genuine charts (mirrors real Charts.tsx marker placement)
export const BarChartCountUp: React.FC = () => {
  const maxValue = Math.max(1, 21000);
  const plotHeight = 420;
  const barH = (v: number) => (v / maxValue) * plotHeight;
  return <div style={{ height: barH(21000) }} />;
};

export const HBarChartExclusive: React.FC = () => {
  const maxValue = Math.max(1, 6);
  const trackWidth = 800;
  const barW = (v: number) => (v / maxValue) * trackWidth;
  return <div style={{ width: barW(4) }} />;
};

const LegendSwatch: React.FC = () => <div style={{ display: "flex", gap: 8 }} />;
