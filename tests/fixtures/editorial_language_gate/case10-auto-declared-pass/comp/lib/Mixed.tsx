// case01 MAJOR 3 pin: ONE file holding BOTH a genuine chart body and a
// presentation card body — the verdict must be per declaration BODY, never
// per file (a file-wide-verdict implementation credits MixedCard too and
// must fail the contract suite).
export const MixedChart: React.FC = () => {
  const maxValue = 24000;
  const plotHeight = 420;
  const barH = (v: number) => (v / maxValue) * plotHeight;
  return <div style={{ height: barH(21000) }} />;
};

export const MixedCard: React.FC = () => (
  <div style={{ display: "flex", padding: 16, borderRadius: 12, border: "1px solid #333" }} />
);
