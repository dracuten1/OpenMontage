// case02 card-stack family (mirrors real SceneShell.tsx)
export const StatChipRow: React.FC = () => (
  <div style={{ display: "flex", flexWrap: "wrap", gap: 20, alignItems: "stretch" }} />
);

export const StatChip: React.FC = () => (
  <div style={{ display: "flex", padding: "10px 14px", borderRadius: 12, border: "1px solid #333" }} />
);

export const MechRowStack: React.FC = () => (
  <div style={{ display: "flex", flexDirection: "column", gap: 12, padding: 12, borderRadius: 14 }} />
);

export const FloodRowStack: React.FC = () => (
  <div style={{ display: "flex", padding: 16, borderRadius: 14, border: "1px solid #444" }} />
);

export const DetailRowStack: React.FC = () => (
  <div style={{ display: "flex", padding: 12, borderRadius: 10 }} />
);

export const VersusBadge: React.FC = () => (
  <div style={{ display: "flex", borderRadius: 999, padding: 6 }} />
);

export const VerdictCardStack: React.FC = () => (
  <div style={{ display: "flex", flexDirection: "column", padding: 20, borderRadius: 16 }} />
);

export const TimeChip: React.FC = () => (
  <div style={{ display: "flex", borderRadius: 999, padding: "4px 10px" }} />
);
