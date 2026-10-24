import React from 'react';
import {
  AbsoluteFill,
  Audio,
  Img,
  interpolate,
  Sequence,
  spring,
  staticFile,
  useCurrentFrame,
} from 'remotion';
import {C, FONT, SOURCE} from './theme';
import {
  FPS,
  SceneId,
  SCENE_TIMING,
  EPISODE_TOTAL_FRAMES,
  el,
  elText,
  captionAt,
  Spoken,
} from './timing';
import {AnimatedInfographicView} from './AnimatedInfographic';

// Helper positioning and styling
const pos = (x: number, y: number, w: number = 940): React.CSSProperties => ({
  position: 'absolute',
  left: x,
  top: y,
  width: w,
});

const glassCard = (
  borderColor: string = C.border,
  bgColor: string = C.panel,
): React.CSSProperties => ({
  background: bgColor,
  border: `2px solid ${borderColor}`,
  borderRadius: 20,
  padding: '20px 26px',
  boxShadow: '0 12px 32px rgba(0, 0, 0, 0.65)',
  backdropFilter: 'blur(10px)',
});

// --- Scene Infographic Components --------------------------------------------

// Scene 1: Hook - Thu nhập 50 triệu / tháng & Diện cần hỗ trợ
const Scene1Infographics: React.FC<{s: SceneId}> = ({s}) => {
  const f = useCurrentFrame();
  const incomeEl = el(s, 'income');
  const stampEl = el(s, 'stamp');
  const priceEl = el(s, 'price');

  // Counter 0 -> 50
  const incomeCount = Math.min(
    50,
    Math.max(
      0,
      Math.round(
        interpolate(f - incomeEl.start_frame_local, [0, 22], [0, 50], {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
        }),
      ),
    ),
  );

  // Physics slam spring for stamp
  const stampSpring = spring({
    frame: f - stampEl.start_frame_local,
    fps: FPS,
    config: {damping: 10, stiffness: 220, mass: 0.6},
  });
  const stampScale = interpolate(stampSpring, [0, 1], [3.0, 1.0]);
  const stampRot = interpolate(stampSpring, [0, 1], [-25, -6]);
  const stampOpacity = interpolate(f - stampEl.start_frame_local, [0, 4], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <>
      {/* Top Hero Counter Card */}
      <Spoken at={incomeEl.start_frame_local} fromY={-20} style={{...pos(70, 440)}}>
        <div style={glassCard(C.amber, 'rgba(15, 23, 42, 0.92)')}>
          <div
            style={{
              fontSize: 22,
              fontWeight: 800,
              color: C.muted,
              letterSpacing: 1.5,
              textTransform: 'uppercase',
            }}
          >
            Hộ gia đình đô thị · Thu nhập thực tế
          </div>
          <div
            style={{
              fontSize: 60,
              fontWeight: 900,
              color: C.amber,
              marginTop: 6,
              lineHeight: 1.1,
              textShadow: `0 0 24px ${C.amber}55`,
            }}
          >
            {incomeCount}{' '}
            <span style={{fontSize: 42, color: C.white, fontWeight: 800}}>
              TRIỆU / THÁNG
            </span>
          </div>
          <div
            style={{
              fontSize: 22,
              color: C.cyan,
              marginTop: 8,
              fontWeight: 600,
            }}
          >
            Mức thu nhập thuộc top cao trung lưu tại Hà Nội & TP.HCM
          </div>
        </div>
      </Spoken>

      {/* Physics Slam Stamp */}
      {f >= stampEl.start_frame_local && (
        <div
          style={{
            ...pos(110, 620, 860),
            transform: `scale(${stampScale}) rotate(${stampRot}deg)`,
            transformOrigin: 'center center',
            opacity: stampOpacity,
            zIndex: 40,
          }}
        >
          <div
            style={{
              border: `6px double ${C.coral}`,
              borderRadius: 20,
              background: 'rgba(255, 94, 91, 0.22)',
              backdropFilter: 'blur(12px)',
              padding: '16px 28px',
              textAlign: 'center',
              boxShadow: `0 0 35px ${C.coral}88, inset 0 0 20px ${C.coral}44`,
            }}
          >
            <div
              style={{
                fontSize: 42,
                fontWeight: 900,
                color: C.coral,
                letterSpacing: 2,
                textTransform: 'uppercase',
                textShadow: '0 4px 16px rgba(0,0,0,0.8)',
              }}
            >
              [ DIỆN CẦN HỖ TRỢ MUA NHÀ ]
            </div>
            <div
              style={{
                fontSize: 20,
                fontWeight: 700,
                color: C.white,
                marginTop: 4,
                letterSpacing: 1,
              }}
            >
              Theo đề xuất mới nhất gửi Thủ tướng & Bộ Xây dựng
            </div>
          </div>
        </div>
      )}

      {/* SVG Callout line pointing to center 3D price tag */}
      <Spoken at={priceEl.start_frame_local} fromY={30} style={{...pos(70, 830)}}>
        <div style={glassCard(C.cyan, 'rgba(15, 23, 42, 0.94)')}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <div>
              <div
                style={{
                  fontSize: 20,
                  fontWeight: 800,
                  color: C.cyan,
                  letterSpacing: 1.2,
                }}
              >
                MỨC GIÁ CĂN HỘ ĐỀ XUẤT HỖ TRỢ
              </div>
              <div
                style={{
                  fontSize: 52,
                  fontWeight: 900,
                  color: C.white,
                  marginTop: 4,
                }}
              >
                60 – 70 <span style={{fontSize: 32, color: C.amber}}>TRIỆU / M²</span>
              </div>
            </div>
            <div
              style={{
                background: 'rgba(0, 245, 212, 0.15)',
                border: `1.5px solid ${C.cyan}`,
                borderRadius: 14,
                padding: '10px 18px',
                textAlign: 'center',
              }}
            >
              <div style={{fontSize: 16, color: C.muted}}>Tương đương</div>
              <div style={{fontSize: 28, fontWeight: 900, color: C.cyan}}>
                ~3,25 TỶ
              </div>
            </div>
          </div>
        </div>
      </Spoken>
    </>
  );
};

// Scene 2: Đề xuất HoREA - Nhà ở thương mại giá phù hợp (AntV Infographic upgraded)
const Scene2Infographics: React.FC<{s: SceneId}> = ({s}) => {
  const titleEl = el(s, 'title');
  const tier1El = el(s, 'tier1');
  const tier2El = el(s, 'tier2');

  return (
    <>
      {/* Title Card */}
      <Spoken at={titleEl.start_frame_local} fromY={-20} style={{...pos(70, 310)}}>
        <div style={glassCard(C.border, 'rgba(15, 23, 42, 0.94)')}>
          <div
            style={{
              fontSize: 20,
              fontWeight: 800,
              color: C.amber,
              letterSpacing: 1.5,
              textTransform: 'uppercase',
            }}
          >
            ĐỀ XUẤT LUẬT HÓA PHÂN KHÚC MỚI
          </div>
          <div
            style={{
              fontSize: 42,
              fontWeight: 900,
              color: C.white,
              marginTop: 6,
              lineHeight: 1.15,
            }}
          >
            {elText(s, 'title')}
          </div>
        </div>
      </Spoken>

      {/* Main AntV Infographic Vector Comparison (Hà Nội/HCM 60-70tr vs Tỉnh 25-30tr) */}
      <Spoken at={tier1El.start_frame_local - 25} fromY={18} style={{...pos(70, 480)}}>
        <div style={{...glassCard(C.amber, 'rgba(15, 23, 42, 0.94)'), padding: '24px 20px'}}>
          <AnimatedInfographicView
            id="s02_horea"
            at={tier1El.start_frame_local - 25}
            scale={1.04}
            cues={[tier1El.start_frame_local, tier2El.start_frame_local]}
          />
        </div>
      </Spoken>

      {/* Tier 2 Loan Package Policy Card */}
      <Spoken at={tier2El.start_frame_local} fromY={24} style={{...pos(70, 1020)}}>
        <div style={glassCard(C.coral, 'rgba(15, 23, 42, 0.95)')}>
          <div style={{display: 'flex', alignItems: 'center', gap: 14}}>
            <div
              style={{
                background: C.coral,
                color: C.white,
                padding: '8px 16px',
                borderRadius: 10,
                fontSize: 18,
                fontWeight: 900,
              }}
            >
              GÓI TÍN DỤNG
            </div>
            <div style={{fontSize: 22, fontWeight: 800, color: C.white}}>
              Ưu Đãi Lãi Suất Dài Hạn
            </div>
          </div>
          <div
            style={{
              fontSize: 32,
              fontWeight: 900,
              color: C.amber,
              marginTop: 10,
            }}
          >
            {elText(s, 'tier2')}
          </div>
          <div style={{fontSize: 20, color: C.muted, marginTop: 6}}>
            Được tiếp cận gói vay mua nhà thương mại giá phù hợp với thời hạn 20 – 25 năm.
          </div>
        </div>
      </Spoken>
    </>
  );
};

// Scene 3: The Missing Middle - Khoảng trống 3 phân khúc (AntV Infographic upgraded)
const Scene3Infographics: React.FC<{s: SceneId}> = ({s}) => {
  const f = useCurrentFrame();
  const b1El = el(s, 'b1');
  const b2El = el(s, 'b2');
  const b3El = el(s, 'b3');

  return (
    <>
      {/* Top Header Card */}
      <Spoken at={0} fromY={-16} style={{...pos(70, 300)}}>
        <div style={{textAlign: 'center', background: 'rgba(15, 23, 42, 0.92)', padding: '16px 24px', borderRadius: 20, border: `1.5px solid ${C.cyan}44`}}>
          <div style={{fontSize: 22, fontWeight: 800, color: C.cyan, letterSpacing: 1.2}}>
            KHOẢNG TRỐNG THỊ TRƯỜNG BẤT ĐỘNG SẢN
          </div>
          <div style={{fontSize: 38, fontWeight: 900, color: C.white, marginTop: 4}}>
            Nghịch Lý 3 Phân Khúc Giá Nhà
          </div>
        </div>
      </Spoken>

      {/* Main AntV Infographic Vector: 3-Tier Waterfall Badge Cards */}
      <Spoken at={15} fromY={18} style={{...pos(70, 460)}}>
        <div style={{...glassCard(C.cyan, 'rgba(15, 23, 42, 0.94)'), padding: '24px 20px'}}>
          <AnimatedInfographicView
            id="s03_missing_middle"
            at={15}
            scale={1.05}
            cues={[b1El.start_frame_local, b2El.start_frame_local, b3El.start_frame_local]}
          />
        </div>
      </Spoken>

      {/* Synchronized Callout Cards for Voice Highlights */}
      <div style={{...pos(70, 930), display: 'flex', flexDirection: 'column', gap: 14}}>
        {/* Tier 1 Cue */}
        <Spoken at={b1El.start_frame_local} fromY={14}>
          <div style={{...glassCard(f >= b2El.start_frame_local ? 'rgba(16, 185, 129, 0.3)' : C.green, 'rgba(15, 23, 42, 0.92)'), padding: '14px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
            <div style={{fontSize: 22, fontWeight: 800, color: C.green}}>
              🟢 Nhà Ở Xã Hội: 18 – 25 tr/m²
            </div>
            <div style={{fontSize: 18, color: C.muted, fontWeight: 600}}>
              Chặn trần thu nhập &lt; 50 triệu
            </div>
          </div>
        </Spoken>

        {/* Tier 2 Cue */}
        <Spoken at={b2El.start_frame_local} fromY={14}>
          <div style={{...glassCard(f >= b3El.start_frame_local ? 'rgba(255, 183, 3, 0.3)' : C.amber, 'rgba(15, 23, 42, 0.92)'), padding: '14px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
            <div style={{fontSize: 22, fontWeight: 800, color: C.amber}}>
              ⚡ Đề Xuất HoREA: 60 – 70 tr/m²
            </div>
            <div style={{fontSize: 18, color: C.coral, fontWeight: 700}}>
              Khoảng trống không được hỗ trợ
            </div>
          </div>
        </Spoken>

        {/* Tier 3 Cue & Takeaway */}
        <Spoken at={b3El.start_frame_local} fromY={14}>
          <div style={{...glassCard(C.coral, 'rgba(15, 23, 42, 0.95)'), padding: '18px 22px'}}>
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
              <div style={{fontSize: 24, fontWeight: 900, color: C.coral}}>
                🚀 Sơ Cấp Nội Đô: 102 – 107 tr/m²
              </div>
              <div style={{fontSize: 18, color: C.muted}}>CBRE Q3/2026</div>
            </div>
            <div style={{fontSize: 22, color: C.white, marginTop: 8, fontWeight: 700, lineHeight: 1.3}}>
              Thu nhập 50 triệu: Vượt điều kiện mua NOXH, nhưng không thể gánh nổi căn hộ 100+ triệu/m².
            </div>
          </div>
        </Spoken>
      </div>
    </>
  );
};

// Scene 4: Bài toán mua căn 50m2 - 3,25 tỷ
// Scene 4: Giải phẫu chi phí giá thành 1m² (AntV Infographic upgraded)
const Scene4Infographics: React.FC<{s: SceneId}> = ({s}) => {
  const f = useCurrentFrame();
  const costLandEl = el(s, 'cost_land');
  const costBuildEl = el(s, 'cost_build');
  const costFloorEl = el(s, 'cost_floor');

  // Count-up for the 45 – 55 floor-price card, synced to its narration cue.
  const floorP = interpolate(f - costFloorEl.start_frame_local, [0, 24], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <>
      {/* Top Header Card */}
      <Spoken at={0} fromY={-16} style={{...pos(70, 290)}}>
        <div
          style={{
            textAlign: 'center',
            background: 'rgba(15, 23, 42, 0.94)',
            padding: '16px 24px',
            borderRadius: 20,
            border: `1.5px solid ${C.amber}55`,
          }}
        >
          <div
            style={{
              fontSize: 20,
              fontWeight: 800,
              color: C.amber,
              letterSpacing: 1.5,
              textTransform: 'uppercase',
            }}
          >
            GIẢI PHẪU CHI PHÍ DỰ ÁN
          </div>
          <div
            style={{
              fontSize: 38,
              fontWeight: 900,
              color: C.white,
              marginTop: 4,
            }}
          >
            Vì Sao Biến Mất Căn Hộ 30 Tr/M²?
          </div>
        </div>
      </Spoken>

      {/* Main AntV Infographic Vector: Cost breakdown bar chart */}
      <Spoken at={costLandEl.start_frame_local - 25} fromY={18} style={{...pos(70, 440)}}>
        <div style={{...glassCard(C.amber, 'rgba(15, 23, 42, 0.94)'), padding: '24px 20px'}}>
          <AnimatedInfographicView
            id="s04_cost_breakdown"
            at={costLandEl.start_frame_local - 25}
            scale={1.04}
            cues={[
              costLandEl.start_frame_local,
              costBuildEl.start_frame_local,
              costBuildEl.start_frame_local + 45,
              costBuildEl.start_frame_local + 90,
            ]}
          />
        </div>
      </Spoken>

      {/* Cost Floor Outcome Card */}
      <Spoken at={costFloorEl.start_frame_local} fromY={24} style={{...pos(70, 1020)}}>
        <div style={glassCard(C.coral, 'rgba(15, 23, 42, 0.96)')}>
          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
            <div>
              <div style={{fontSize: 20, fontWeight: 800, color: C.coral}}>
                GIÁ THÀNH XUẤT XƯỞNG TỐI THIỂU
              </div>
              <div style={{fontSize: 48, fontWeight: 900, color: C.amber, marginTop: 4}}>
                {`${Math.round(45 * floorP)} – ${Math.round(55 * floorP)}`}{' '}
                <span style={{fontSize: 28, color: C.white}}>TRIỆU / M²</span>
              </div>
            </div>
            <div
              style={{
                background: 'rgba(255, 94, 91, 0.15)',
                border: `1.5px solid ${C.coral}`,
                borderRadius: 14,
                padding: '10px 18px',
                textAlign: 'center',
              }}
            >
              <div style={{fontSize: 16, color: C.muted}}>Chưa tính</div>
              <div style={{fontSize: 22, fontWeight: 900, color: C.coral}}>
                Thuế & Lợi nhuận
              </div>
            </div>
          </div>
        </div>
      </Spoken>
    </>
  );
};

// Scene 5: Bóc tách dòng tiền 50 triệu/tháng (AntV Infographic upgraded)
export const Scene5Infographics: React.FC<{s: SceneId}> = ({s}) => {
  const f = useCurrentFrame();
  const seg1El = el(s, 'seg1');
  const seg2El = el(s, 'seg2');
  const seg3El = el(s, 'seg3');

  return (
    <>
      {/* Top Header Card */}
      <Spoken at={0} fromY={-16} style={{...pos(70, 290)}}>
        <div style={{textAlign: 'center', background: 'rgba(15, 23, 42, 0.92)', padding: '16px 24px', borderRadius: 20, border: `1.5px solid ${C.amber}44`}}>
          <div style={{fontSize: 22, fontWeight: 800, color: C.amber, letterSpacing: 1.2}}>
            CƠ CẤU PHÂN BỔ DÒNG TIỀN 50 TRIỆU / THÁNG
          </div>
          <div style={{fontSize: 36, fontWeight: 900, color: C.white, marginTop: 4}}>
            Tỷ Trọng Chi Tiêu Khi Mua Nhà Trả Góp
          </div>
        </div>
      </Spoken>

      {/* Main AntV Infographic Donut Chart with Callout Labels */}
      <Spoken at={15} fromY={18} style={{...pos(70, 440)}}>
        <div style={{...glassCard(C.coral, 'rgba(15, 23, 42, 0.94)'), padding: '20px 16px'}}>
          <AnimatedInfographicView
            id="s05_cashflow"
            at={15}
            scale={1.04}
            arcCues={[seg1El.start_frame_local, seg2El.start_frame_local, seg3El.start_frame_local]}
          />
        </div>
      </Spoken>

      {/* 3 Synchronized Cash Flow Breakdown Cards synced with voice cues */}
      <div style={{...pos(70, 1020), display: 'flex', flexDirection: 'column', gap: 14}}>
        <Spoken at={seg1El.start_frame_local} fromY={16}>
          <div style={glassCard(C.coral, 'rgba(15, 23, 42, 0.94)')}>
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
              <div style={{fontSize: 26, fontWeight: 900, color: C.coral}}>
                💳 28 TRIỆU (56%)
              </div>
              <div style={{fontSize: 18, color: C.muted}}>Gốc + Lãi ngân hàng mỗi tháng</div>
            </div>
          </div>
        </Spoken>

        <Spoken at={seg2El.start_frame_local} fromY={16}>
          <div style={glassCard(C.amber, 'rgba(15, 23, 42, 0.94)')}>
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
              <div style={{fontSize: 26, fontWeight: 900, color: C.amber}}>
                🛒 15 TRIỆU (30%)
              </div>
              <div style={{fontSize: 18, color: C.muted}}>Chi phí sinh hoạt tối thiểu gia đình</div>
            </div>
          </div>
        </Spoken>

        <Spoken at={seg3El.start_frame_local} fromY={16}>
          <div style={glassCard(C.cyan, 'rgba(15, 23, 42, 0.94)')}>
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
              <div style={{fontSize: 26, fontWeight: 900, color: C.cyan}}>
                🛡️ 7 TRIỆU (14%)
              </div>
              <div style={{fontSize: 18, color: C.muted}}>Dự phòng khẩn cấp & y tế cả nhà</div>
            </div>
          </div>
        </Spoken>
      </div>
    </>
  );
};

// Scene 6: Cảnh báo lãi suất thả nổi
const Scene6Infographics: React.FC<{s: SceneId}> = ({s}) => {
  const f = useCurrentFrame();
  const rate1El = el(s, 'rate1');
  const rate2El = el(s, 'rate2');
  const shockEl = el(s, 'shock');

  // Speedometer needle rotation: 8% (-40 deg) -> 12% (+50 deg)
  const needleSpring = spring({
    frame: f - rate2El.start_frame_local,
    fps: FPS,
    config: {damping: 12, stiffness: 90},
  });
  const needleAngle = interpolate(needleSpring, [0, 1], [-40, 52]);

  // Alert pulse for shock card
  const shockPulse = Math.sin(f * 0.35) * 8 + 14;

  return (
    <>
      {/* Top Speedometer / Dial Gauge Arc */}
      <div style={{...pos(70, 430)}}>
        <div style={{fontSize: 22, fontWeight: 800, color: C.coral, letterSpacing: 1.2, textAlign: 'center'}}>
          ĐỒ THỊ RỦI RO LÃI SUẤT THẢ NỔI
        </div>

        {/* Speedometer SVG */}
        <div style={{display: 'flex', justifyContent: 'center', marginTop: 10}}>
          <svg width="460" height="190" viewBox="0 0 460 190">
            {/* Background Arc */}
            <path
              d="M 50 170 A 180 180 0 0 1 410 170"
              fill="none"
              stroke="#1E293B"
              strokeWidth="24"
              strokeLinecap="round"
            />
            {/* Green Safe Arc (0 - 8%) */}
            <path
              d="M 50 170 A 180 180 0 0 1 180 40"
              fill="none"
              stroke={C.green}
              strokeWidth="24"
              strokeLinecap="round"
            />
            {/* Amber Warning Arc (8% - 10%) */}
            <path
              d="M 180 40 A 180 180 0 0 1 280 40"
              fill="none"
              stroke={C.amber}
              strokeWidth="24"
            />
            {/* Red Danger Arc (10% - 14%+) */}
            <path
              d="M 280 40 A 180 180 0 0 1 410 170"
              fill="none"
              stroke={C.coral}
              strokeWidth="24"
              strokeLinecap="round"
            />

            {/* Labels */}
            <text x="70" y="150" fill={C.green} fontSize="18" fontWeight="800">
              8% Ưu đãi
            </text>
            <text x="350" y="150" fill={C.coral} fontSize="18" fontWeight="800">
              12%+ Thả nổi
            </text>

            {/* Needle Pivot */}
            <circle cx="230" cy="170" r="14" fill={C.white} />
            {/* Needle */}
            <g transform={`rotate(${needleAngle}, 230, 170)`}>
              <line
                x1="230"
                y1="170"
                x2="230"
                y2="28"
                stroke={C.white}
                strokeWidth="5"
                strokeLinecap="round"
              />
              <polygon points="230,16 224,32 236,32" fill={C.coral} />
            </g>
          </svg>
        </div>
      </div>

      {/* Main AntV Infographic Vector: Interest Shock Comparison */}
      <Spoken at={rate1El.start_frame_local - 25} fromY={18} style={{...pos(70, 520)}}>
        <div style={{...glassCard(C.coral, 'rgba(15, 23, 42, 0.94)'), padding: '24px 20px'}}>
          <AnimatedInfographicView
            id="s06_interest_shock"
            at={rate1El.start_frame_local - 25}
            scale={1.04}
            cues={[rate1El.start_frame_local, rate2El.start_frame_local]}
          />
        </div>
      </Spoken>

      {/* Shock Card */}
      <Spoken at={shockEl.start_frame_local} fromY={24} style={{...pos(70, 1050)}}>
        <div
          style={{
            ...glassCard(C.coral, 'rgba(30, 10, 18, 0.96)'),
            boxShadow: `0 0 ${shockPulse}px rgba(255, 94, 91, 0.8)`,
          }}
        >
          <div style={{display: 'flex', alignItems: 'center', gap: 12}}>
            <div style={{fontSize: 32}}>🚨</div>
            <div
              style={{
                fontSize: 34,
                fontWeight: 900,
                color: C.coral,
                lineHeight: 1.15,
              }}
            >
              VỌT LÊN 33 – 36 TRIỆU / THÁNG (&gt;65–70% THU NHẬP)
            </div>
          </div>
          <div style={{fontSize: 20, color: '#FECDD3', marginTop: 8}}>
            Vượt ngưỡng an toàn quốc tế DTI 40%, đẩy người mua vào bẫy nợ kiệt quệ tài chính.
          </div>
        </div>
      </Spoken>
    </>
  );
};

// Scene 7: Giá nhà / Thu nhập Numbeo 2026
// Scene 7: Numbeo 2026 - Tỷ lệ giá nhà / thu nhập (AntV Infographic upgraded)
const Scene7Infographics: React.FC<{s: SceneId}> = ({s}) => {
  const f = useCurrentFrame();
  const hnEl = el(s, 'hn');
  const hcmEl = el(s, 'hcm');
  const unEl = el(s, 'un');

  return (
    <>
      {/* Top Header */}
      <Spoken at={0} fromY={-16} style={{...pos(70, 300)}}>
        <div style={{textAlign: 'center', background: 'rgba(15, 23, 42, 0.92)', padding: '16px 24px', borderRadius: 20, border: `1.5px solid ${C.cyan}44`}}>
          <div style={{fontSize: 22, fontWeight: 800, color: C.cyan, letterSpacing: 1.2}}>
            CHỈ SỐ GIÁ NHÀ TRÊN THU NHẬP (NUMBEO 2026)
          </div>
          <div style={{fontSize: 36, fontWeight: 900, color: C.white, marginTop: 4}}>
            Cần Bao Nhiêu Năm Thu Nhập Để Mua Nhà?
          </div>
        </div>
      </Spoken>

      {/* Main AntV Infographic Vector Bar Chart */}
      <Spoken at={15} fromY={18} style={{...pos(70, 470)}}>
        <div style={{...glassCard(C.border, 'rgba(15, 23, 42, 0.94)'), padding: '24px 20px'}}>
          <AnimatedInfographicView
            id="s07_numbeo"
            at={15}
            scale={1.06}
            cues={[unEl.start_frame_local, hcmEl.start_frame_local, hnEl.start_frame_local]}
          />
        </div>
      </Spoken>

      {/* Synchronized Callout Metrics synced with voice cues */}
      <div style={{...pos(70, 930), display: 'flex', flexDirection: 'column', gap: 14}}>
        <Spoken at={hcmEl.start_frame_local} fromY={16}>
          <div style={glassCard(C.amber, 'rgba(15, 23, 42, 0.94)')}>
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
              <div style={{fontSize: 24, fontWeight: 900, color: C.amber}}>
                🌆 TP. Hồ Chí Minh
              </div>
              <div style={{fontSize: 28, fontWeight: 900, color: C.amber}}>
                33,6 NĂM
              </div>
            </div>
            <div style={{fontSize: 18, color: C.muted, marginTop: 4}}>
              Tương đương hơn 3 thập kỷ tích lũy toàn bộ thu nhập
            </div>
          </div>
        </Spoken>

        <Spoken at={hnEl.start_frame_local} fromY={16}>
          <div style={glassCard(C.coral, 'rgba(15, 23, 42, 0.94)')}>
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
              <div style={{fontSize: 24, fontWeight: 900, color: C.coral}}>
                🏢 Hà Nội (Top đầu Châu Á)
              </div>
              <div style={{fontSize: 28, fontWeight: 900, color: C.coral}}>
                38,9 NĂM
              </div>
            </div>
            <div style={{fontSize: 18, color: C.muted, marginTop: 4}}>
              Xếp hàng đầu các đô thị đắt đỏ nhất khu vực về tương quan thu nhập
            </div>
          </div>
        </Spoken>

        <Spoken at={unEl.start_frame_local} fromY={16}>
          <div style={glassCard(C.green, 'rgba(15, 23, 42, 0.96)')}>
            <div style={{display: 'flex', alignItems: 'center', gap: 12}}>
              <div
                style={{
                  background: C.green,
                  color: '#0B132B',
                  fontWeight: 900,
                  fontSize: 16,
                  padding: '4px 12px',
                  borderRadius: 8,
                }}
              >
                CHUẨN LHQ &lt; 5 NĂM
              </div>
              <div style={{fontSize: 20, fontWeight: 800, color: C.white}}>
                Khoảng cách báo động
              </div>
            </div>
            <div
              style={{
                fontSize: 28,
                fontWeight: 800,
                color: C.white,
                marginTop: 6,
                lineHeight: 1.25,
              }}
            >
              Giá nhà tại Hà Nội cao gấp <span style={{color: C.amber, fontWeight: 900}}>7,8 LẦN</span> so với chuẩn lành mạnh của Liên Hợp Quốc!
            </div>
          </div>
        </Spoken>
      </div>
    </>
  );
};

// Scene 8: Nhận định & Lời giải vĩ mô (TOD) (AntV Infographic upgraded)
const Scene8Infographics: React.FC<{s: SceneId}> = ({s}) => {
  const f = useCurrentFrame();
  const line1El = el(s, 'line1');
  const todEl = el(s, 'tod');
  const ctaEl = el(s, 'cta');

  return (
    <>
      {/* Top Editorial Takeaway Card */}
      <Spoken at={line1El.start_frame_local} fromY={-16} style={{...pos(70, 300)}}>
        <div style={glassCard(C.coral, 'rgba(15, 23, 42, 0.94)')}>
          <div style={{fontSize: 20, fontWeight: 800, color: C.coral, letterSpacing: 1.2}}>
            NHẬN ĐỊNH THỊ TRƯỜNG
          </div>
          <div
            style={{
              fontSize: 34,
              fontWeight: 900,
              color: C.white,
              marginTop: 6,
              lineHeight: 1.2,
            }}
          >
            {elText(s, 'line1')}
          </div>
        </div>
      </Spoken>

      {/* Main AntV Infographic Vector: TOD & Metro Progression Steps */}
      <Spoken at={line1El.start_frame_local - 20} fromY={18} style={{...pos(70, 480)}}>
        <div style={{...glassCard(C.cyan, 'rgba(15, 23, 42, 0.94)'), padding: '24px 20px'}}>
          <AnimatedInfographicView
            id="s08_tod_metro"
            at={line1El.start_frame_local - 20}
            scale={1.05}
            cues={[line1El.start_frame_local, todEl.start_frame_local, ctaEl.start_frame_local]}
          />
        </div>
      </Spoken>

      {/* TOD Solution Callout & Call To Action */}
      <Spoken at={ctaEl.start_frame_local} fromY={24} style={{...pos(70, 950)}}>
        <div style={glassCard(C.amber, 'rgba(17, 28, 53, 0.96)')}>
          <div
            style={{
              fontSize: 32,
              fontWeight: 900,
              color: C.amber,
              textAlign: 'center',
              lineHeight: 1.25,
            }}
          >
            LƯƠNG BAO NHIÊU MỚI DÁM MUA NHÀ 3,25 TỶ?
          </div>
          <div
            style={{
              fontSize: 22,
              fontWeight: 700,
              color: C.white,
              textAlign: 'center',
              marginTop: 10,
            }}
          >
            Để lại bình luận & góc nhìn của bạn ngay phía dưới 👇
          </div>
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              gap: 28,
              marginTop: 16,
            }}
          >
            <div
              style={{
                background: 'rgba(255,255,255,0.1)',
                padding: '8px 20px',
                borderRadius: 20,
                fontSize: 18,
                color: C.cyan,
                fontWeight: 700,
              }}
            >
              💬 Bình luận
            </div>
            <div
              style={{
                background: 'rgba(255,255,255,0.1)',
                padding: '8px 20px',
                borderRadius: 20,
                fontSize: 18,
                color: C.amber,
                fontWeight: 700,
              }}
            >
              🔄 Chia sẻ
            </div>
            <div
              style={{
                background: 'rgba(255,255,255,0.1)',
                padding: '8px 20px',
                borderRadius: 20,
                fontSize: 18,
                color: C.coral,
                fontWeight: 700,
              }}
            >
              ❤️ Thả tim
            </div>
          </div>
        </div>
      </Spoken>
    </>
  );
};

// --- Scene Infographic Router -------------------------------------------------

const SceneInfographics: React.FC<{s: SceneId}> = ({s}) => {
  switch (s) {
    case 's01':
      return <Scene1Infographics s={s} />;
    case 's02':
      return <Scene2Infographics s={s} />;
    case 's03':
      return <Scene3Infographics s={s} />;
    case 's04':
      return <Scene4Infographics s={s} />;
    case 's05':
      return <Scene5Infographics s={s} />;
    case 's06':
      return <Scene6Infographics s={s} />;
    case 's07':
      return <Scene7Infographics s={s} />;
    case 's08':
      return <Scene8Infographics s={s} />;
    default:
      return null;
  }
};

// --- Karaoke Caption Overlay --------------------------------------------------

export const Caption: React.FC<{s: SceneId}> = ({s}) => {
  const f = useCurrentFrame();
  const active = captionAt(s, f / FPS);
  if (!active) return null;

  const words = active.chunk_text.split(/\s+/);
  const pages: string[] = [];
  let chunk = '';
  for (const word of words) {
    if ((chunk + ' ' + word).trim().length > 64) {
      pages.push(chunk);
      chunk = word;
    } else {
      chunk = (chunk + ' ' + word).trim();
    }
  }
  if (chunk) pages.push(chunk);

  const index = Math.min(
    pages.length - 1,
    Math.floor(
      Math.max(0, f / FPS - active.start) /
        Math.max(0.01, (active.end - active.start) / pages.length),
    ),
  );
  const text = pages[index] ?? '';
  const size = text.length > 50 ? 34 : text.length > 36 ? 40 : 46;

  const tokens = text.split(' ');
  let best = 1;
  for (let i = 1; i < tokens.length; i++) {
    if (
      Math.abs(tokens.slice(0, i).join(' ').length - tokens.slice(i).join(' ').length) <
      Math.abs(tokens.slice(0, best).join(' ').length - tokens.slice(best).join(' ').length)
    ) {
      best = i;
    }
  }
  const lines =
    text.length > 32
      ? [tokens.slice(0, best).join(' '), tokens.slice(best).join(' ')]
      : [text];

  return (
    <div
      style={{
        ...pos(70, 1515, 940),
        height: 190,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        textAlign: 'center',
        zIndex: 60,
      }}
    >
      <div
        style={{
          background: 'rgba(11, 19, 43, 0.94)',
          border: '1.5px solid rgba(56, 189, 248, 0.45)',
          borderRadius: 20,
          padding: '16px 28px',
          boxShadow: '0 10px 32px rgba(0, 0, 0, 0.8)',
          maxWidth: '100%',
        }}
      >
        {lines.map((line, i) => (
          <div
            key={i}
            style={{
              fontSize: size,
              fontWeight: 800,
              lineHeight: 1.25,
              color: i === 0 ? C.white : C.cyan,
              textShadow: '0 3px 12px rgba(0,0,0,0.9)',
            }}
          >
            {line}
          </div>
        ))}
      </div>
    </div>
  );
};

// --- Single Scene Frame Component ---------------------------------------------

interface SceneProps {
  s: SceneId;
  idx: number;
  start: number;
  sceneFrames: number;
  hud: boolean;
}

const Scene: React.FC<SceneProps> = ({s, idx, start, sceneFrames, hud}) => {
  const f = useCurrentFrame();

  // Gentle Ken Burns slow scale
  const bgScale = interpolate(f, [0, sceneFrames], [1.0, 1.04], {
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill>
      {/* Background 3D Isometric Artwork with Ken Burns Scale */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          overflow: 'hidden',
        }}
      >
        <Img
          src={staticFile(
            `affordable-housing-20261024/sc${String(idx + 1).padStart(2, '0')}_bg.png`,
          )}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            transform: `scale(${bgScale})`,
            transformOrigin: 'center center',
          }}
        />

        {/* Dark Vignette & Ambient Layer across center for high-contrast centered infographics */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'radial-gradient(ellipse at 50% 50%, rgba(6,11,25,0.68) 0%, rgba(6,11,25,0.88) 70%, rgba(6,11,25,0.98) 100%)',
            pointerEvents: 'none',
          }}
        />

        {/* Top Dark Gradient to protect Header (y = 0..300) */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 320,
            background:
              'linear-gradient(180deg, rgba(6,11,25,0.96) 0%, rgba(6,11,25,0.7) 60%, rgba(6,11,25,0) 100%)',
            pointerEvents: 'none',
          }}
        />

        {/* Bottom Dark Gradient to protect Captions (y = 1400..1920) */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: 520,
            background:
              'linear-gradient(0deg, rgba(6,11,25,0.98) 0%, rgba(6,11,25,0.86) 60%, rgba(6,11,25,0) 100%)',
            pointerEvents: 'none',
          }}
        />
      </div>

      {/* Top Retention Progress Bar */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          height: 8,
          width: `${(100 * (start + f)) / EPISODE_TOTAL_FRAMES}%`,
          background: C.coral,
          zIndex: 80,
        }}
      />

      {/* Top Header Badge & Scientific/Verification Pill at y = 64 */}
      <div
        style={{
          position: 'absolute',
          top: 64,
          left: 70,
          right: 70,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          zIndex: 70,
        }}
      >
        <div
          style={{
            background: 'rgba(255, 94, 91, 0.18)',
            border: `2px solid ${C.coral}`,
            borderRadius: 14,
            padding: '8px 20px',
            color: C.coral,
            fontSize: 22,
            fontWeight: 800,
            letterSpacing: 1.2,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
          }}
        >
          <div
            style={{
              width: 10,
              height: 10,
              borderRadius: '50%',
              backgroundColor: C.coral,
              boxShadow: `0 0 10px ${C.coral}`,
            }}
          />
          {elText(s, 'badge')}
        </div>

        <div
          style={{
            background: 'rgba(15, 23, 42, 0.92)',
            border: `1.5px solid ${C.cyan}`,
            borderRadius: 12,
            padding: '8px 18px',
            color: C.cyan,
            fontSize: 18,
            fontWeight: 700,
            letterSpacing: 1.1,
          }}
        >
          [ ĐỒ HỌA MINH HỌA · SỐ LIỆU KIỂM CHỨNG ]
        </div>
      </div>

      {/* Creative Scene Infographics */}
      <SceneInfographics s={s} />

      {/* Karaoke Caption Overlay */}
      <Caption s={s} />

      {/* Verified Source Disclaimer */}
      <div
        style={{
          ...pos(70, 1726, 940),
          fontSize: 20,
          lineHeight: 1.3,
          color: C.muted,
          textAlign: 'center',
          zIndex: 60,
        }}
      >
        {SOURCE}
      </div>

      {/* Optional Debug HUD Bar */}
      {hud && (
        <div
          style={{
            ...pos(70, 1795, 940),
            display: 'flex',
            justifyContent: 'center',
            zIndex: 90,
          }}
        >
          <div
            style={{
              background: 'rgba(0, 0, 0, 0.82)',
              border: '1px solid rgba(0, 245, 212, 0.4)',
              borderRadius: 10,
              padding: '6px 20px',
              color: C.cyan,
              fontFamily: 'monospace',
              fontSize: 20,
              letterSpacing: 1,
            }}
          >
            S{idx + 1} ({s}) · f{start + f} · {((start + f) / FPS).toFixed(2)}s · [local {f}/{sceneFrames}]
          </div>
        </div>
      )}
    </AbsoluteFill>
  );
};

// --- Exported Episode Component -----------------------------------------------

export interface AffordableHousingEpisodeProps {
  hud?: boolean;
}

export const AffordableHousingEpisode: React.FC<AffordableHousingEpisodeProps> = ({
  hud = false,
}) => {
  return (
    <AbsoluteFill
      style={{
        backgroundColor: C.bg,
        color: C.white,
        fontFamily: FONT,
        overflow: 'hidden',
      }}
    >
      {/* Continuous Ambient Background Music */}
      <Audio
        src={staticFile('affordable-housing-20261024/full_bgm.wav')}
        volume={0.22}
      />

      {/* Per-Scene Voice & Infographic Sequences */}
      {SCENE_TIMING.map((sc, idx) => (
        <Sequence
          key={sc.scene_id}
          from={sc.start_frame}
          durationInFrames={sc.scene_frames}
        >
          <Audio
            src={staticFile(`affordable-housing-20261024/voice_${sc.scene_id}.wav`)}
            volume={1.0}
          />
          <Scene
            s={sc.scene_id}
            idx={idx}
            start={sc.start_frame}
            sceneFrames={sc.scene_frames}
            hud={hud}
          />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};
