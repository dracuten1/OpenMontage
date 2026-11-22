// VN-Myth S3E02 — Sử thi Đăm Săn (Klei Khan Y Đam San, Ê Đê — Tây Nguyên).
// Bespoke Atelier theme: Warm Archival Diorama (Bazan Đêm, Giấy Dó Ngà, Đỏ Thổ Cẩm, Đồng Chiêng, Xanh Đại Ngàn).
export const EPISODE_SLUG = "dam-san" as const;
export const FPS = 30;
export const W = 1920;
export const H = 1080;

export const C = {
  bg: "#1A1512",        // Đêm Bazan Tây Nguyên
  bgDeep: "#100C0A",    // Sáp Đen cháy sâu
  bgLight: "#F2EAD8",   // Giấy Dó / Vỏ cây ngà ấm
  card: "#251D18",
  border: "#6B4226",    // Gỗ trầm / viền khung bảo tàng
  cream: "#EDE2CE",
  white: "#FAF5EB",
  gold: "#D49B38",      // Đồng chiêng cũ — dữ liệu & nhấn chính
  amber: "#D49B38",
  copper: "#C76B3E",
  red: "#9E3B24",       // Thổ cẩm đỏ đô / đất đỏ bazan — Lớp A sử thi
  redLight: "#C95439",
  teal: "#38665E",      // Xanh đại ngàn — Lớp B ngôn ngữ & thiết chế
  tealLight: "#659C92",
  mute: "#96897B",
  ink: "#221914",
  inkSoft: "#594336",
};

export const FONT = {
  display: '"Playfair Display", "Noto Serif", Georgia, serif',
  body: '"Be Vietnam Pro", "Noto Sans", "Helvetica Neue", Arial, sans-serif',
  mono: '"JetBrains Mono", "SF Mono", Menlo, monospace',
};

export type SceneProps = {
  durationInFrames: number;
  showHud?: boolean;
};

export const T = {
  bg: C.bg,
  bgDeep: C.bgDeep,
  paper: C.bgLight,
  paperDeep: "#130E0C",
  paperEdge: C.border,
  ink: C.ink,
  inkSoft: C.inkSoft,
  layerA: C.red,
  layerB: C.teal,
  layerC: C.gold,
  fontCaption: FONT.body,
  fontMono: FONT.mono,
  fontDisplay: FONT.display,
};
