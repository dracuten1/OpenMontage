#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ssrPath = path.resolve(__dirname, '../remotion-composer/node_modules/@antv/infographic/esm/ssr/index.js');
const { renderToString } = await import(ssrPath);

const infographics = [
  {
    id: 's02_horea',
    title: 'S02: Kiến nghị HoREA',
    dsl: `infographic compare-binary-horizontal-badge-card-vs
data
  title KIẾN NGHỊ HOREA · NHÀ Ở GIÁ PHÙ HỢP
  desc Luật hóa phân khúc giá trần & cơ chế vay ưu đãi
  compares
    - label Hà Nội & TP.HCM
      icon building
      children
        - label Mức giá trần
          value 60–70 tr/m²
          icon tag
        - label Gói vay ưu đãi
          value >50 tr/tháng
          icon bank
    - label Tỉnh & Đô Thị Khác
      icon buildings
      children
        - label Mức giá trần
          value 25–30 tr/m²
          icon tag
        - label Hỗ trợ dài hạn
          value Vay 20–25 năm
          icon calendar
theme dark
  palette #FFB703 #00F5D4 #FF5E5B
`
  },
  {
    id: 's03_missing_middle',
    title: 'S03: The Missing Middle',
    dsl: `infographic list-waterfall-badge-card
data
  title KHOẢNG TRỐNG "THE MISSING MIDDLE"
  desc Nghịch lý 3 phân khúc giá nhà tại đô thị lớn
  lists
    - label Nhà ở xã hội
      value 18 – 25 tr/m²
      desc Chặn trần thu nhập < 50tr
      icon home
    - label Đề xuất HoREA
      value 60 – 70 tr/m²
      desc Khoảng trống không hỗ trợ
      icon alert triangle
    - label Sơ cấp nội đô
      value 102 – 107 tr/m²
      desc CBRE Q3/2026 vượt tầm với
      icon trend up
theme dark
  palette #10B981 #FFB703 #FF5E5B
`
  },
  {
    id: 's04_cost_breakdown',
    title: 'S04: Cơ cấu giá thành 1m²',
    dsl: `infographic chart-bar-plain-text
data
  title CƠ CẤU GIÁ THÀNH 1M² CĂN HỘ NỘI ĐÔ
  desc Bóc tách 4 thành phần chi phí xuất xưởng (CBRE & Bộ Xây Dựng)
  values
    - label Tiền đất & GPMB (28%)
      value 28
    - label Xây dựng & Vật liệu (38%)
      value 38
    - label Chi phí vốn & Pháp lý (18%)
      value 18
    - label Thuế & Biên lợi nhuận (16%)
      value 16
theme dark
  palette #FFB703 #00F5D4 #FF5E5B #A78BFA
`
  },
  {
    id: 's05_cashflow',
    title: 'S05: Dòng tiền 50 triệu/tháng',
    dsl: `infographic chart-pie-donut-compact-card
data
  title BÓC TÁCH DÒNG TIỀN 50 TRIỆU / THÁNG
  desc Cơ cấu chi tiêu thực tế khi mua nhà trả góp 20 năm
  values
    - label Trả nợ ngân hàng (28 triệu)
      value 56
    - label Sinh hoạt tối thiểu (15 triệu)
      value 30
    - label Quỹ dự phòng rủi ro (7 triệu)
      value 14
theme dark
  palette #FF5E5B #FFB703 #00F5D4
`
  },
  {
    id: 's06_interest_shock',
    title: 'S06: Cú sốc lãi suất thả nổi',
    dsl: `infographic compare-binary-horizontal-badge-card-vs
data
  title CÚ SỐC LÃI SUẤT THẢ NỔI VAY MUA NHÀ
  desc So sánh áp lực trả nợ giữa giai đoạn ưu đãi và thả nổi
  compares
    - label Giai đoạn Ưu đãi (1-2 năm)
      icon shield
      children
        - label Lãi suất vay
          value 8.0%/năm
          icon percent
        - label Trả góp tháng
          value 28 tr/tháng (56%)
          icon credit card
    - label Hết Ưu đãi: Thả nổi
      icon alert triangle
      children
        - label Lãi suất thả nổi
          value 11.5–12.5%
          icon trending up
        - label Trả góp tháng
          value 33–36 tr/tháng (70%)
          icon alert circle
theme dark
  palette #10B981 #FF5E5B #FFB703
`
  },
  {
    id: 's07_numbeo',
    title: 'S07: Numbeo 2026 (Giá nhà / thu nhập)',
    dsl: `infographic chart-bar-plain-text
data
  title TỶ LỆ GIÁ NHÀ / THU NHẬP (NUMBEO 2026)
  desc Số năm tích lũy toàn bộ thu nhập để sở hữu nhà
  values
    - label Chuẩn LHQ
      value 5.0
    - label TP.HCM
      value 33.6
    - label Hà Nội (Top Á)
      value 38.9
theme dark
  palette #10B981 #FFB703 #FF5E5B
`
  },
  {
    id: 's08_tod_metro',
    title: 'S08: Đô thị TOD & Metro',
    dsl: `infographic sequence-steps-badge-card
data
  title LỜI GIẢI VĨ MÔ & QUY HOẠCH ĐÔ THỊ
  desc Lộ trình phát triển TOD & đường sắt đô thị giãn dân
  sequences
    - label 1. Nghịch lý nội đô
      desc Giá 107 tr/m² vượt xa sức mua đại chúng
      icon alert triangle
    - label 2. Mô hình Đô thị TOD
      desc Mở rộng tuyến Metro giãn dân ra ngoại vi
      icon train
    - label 3. An cư vệ tinh
      desc Căn hộ 20 – 30 tr/m² trong tầm tay
      icon check circle
theme dark
  palette #FF5E5B #00F5D4 #10B981
`
  }
];

const outPublicDir = path.resolve(__dirname, '../remotion-composer/public/affordable-housing-20261024/infographics');
const outSrcDir = path.resolve(__dirname, '../remotion-composer/src/affordable-housing-20261024');

fs.mkdirSync(outPublicDir, { recursive: true });

const exportsObj = {};

for (const info of infographics) {
  // Save .info DSL file
  const infoPath = path.join(outPublicDir, `${info.id}.info`);
  fs.writeFileSync(infoPath, info.dsl, 'utf-8');

  // Render to SVG
  let svg = await renderToString(info.dsl);
  // Transparent background for dark glass card overlay
  svg = svg.replace('background-color:#1F1F1F', 'background-color:transparent');
  // Add font-family fallback
  if (!svg.includes('font-family="Alibaba PuHuiTi, -apple-system')) {
    svg = svg.replace('font-family="Alibaba PuHuiTi"', 'font-family="Alibaba PuHuiTi, -apple-system, BlinkMacSystemFont, sans-serif"');
  }

  // Make SVG responsive (width="100%" height="auto") so it scales cleanly with viewBox
  svg = svg.replace(/<svg\b([^>]*)>/, (match, attrs) => {
    let a = attrs
      .replace(/\bwidth="[^"]*"/, 'width="100%"')
      .replace(/\bheight="[^"]*"/, 'height="auto"');
    if (!a.includes('style=')) {
      a += ' style="width:100%;height:auto;display:block;"';
    } else {
      a = a.replace(/style="([^"]*)"/, 'style="$1;width:100%;height:auto;display:block;"');
    }
    return `<svg${a}>`;
  });

  const svgPath = path.join(outPublicDir, `${info.id}.svg`);
  fs.writeFileSync(svgPath, svg, 'utf-8');
  console.log(`Compiled ${info.id}: .info and .svg saved (${svg.length} bytes)`);

  exportsObj[info.id] = svg;
}

// Write TypeScript constants file
const tsContent = `// Auto-generated compiled AntV Infographics vector SVGs
// Source DSL files: remotion-composer/public/affordable-housing-20261024/infographics/*.info

export const INFOGRAPHICS = {
${Object.entries(exportsObj).map(([id, svg]) => `  ${JSON.stringify(id)}: ${JSON.stringify(svg)},`).join('\n')}
} as const;

export type InfographicId = keyof typeof INFOGRAPHICS;
`;

fs.writeFileSync(path.join(outSrcDir, 'infographics_data.ts'), tsContent, 'utf-8');
console.log('Successfully written infographics_data.ts!');
