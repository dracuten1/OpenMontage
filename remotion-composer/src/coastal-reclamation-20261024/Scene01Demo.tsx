import React from 'react';
import {
  AbsoluteFill,
  Audio,
  Img,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';

// Import words data
import wordsData from '../../public/coastal-reclamation-20261024/words.json';

interface WordItem {
  word: string;
  start: number;
  end: number;
  probability?: number;
  canonical_word?: string;
  display_word?: string;
}

export interface CoastalReclamationDemoProps {
  debug?: boolean;
}

export const CoastalReclamationDemo: React.FC<CoastalReclamationDemoProps> = ({
  debug = true,
}) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const currentTime = frame / fps;

  // 1. Camera / Ken Burns zoom
  const bgScale = interpolate(frame, [0, 300], [1.0, 1.045], {
    extrapolateRight: 'clamp',
  });

  // 2. Title transition (0s - 2.5s big center, then shrinks & moves to top header)
  const titleSpring = spring({
    frame: frame - 65,
    fps,
    config: { damping: 18, stiffness: 100 },
  });

  const titleScale = interpolate(titleSpring, [0, 1], [1.0, 0.7]);
  const titleY = interpolate(titleSpring, [0, 1], [420, 120]);
  const titleBgOpacity = interpolate(titleSpring, [0, 1], [0.85, 0.95]);

  // 3. Bathymetry Contour Lines drawing animation
  const contourDraw1 = interpolate(frame, [25, 75], [1000, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const contourDraw2 = interpolate(frame, [45, 95], [1000, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const contourDraw3 = interpolate(frame, [65, 115], [1000, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // 4. Badges reveal
  const badge1Opacity = interpolate(frame, [50, 65], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const badge2Opacity = interpolate(frame, [70, 85], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const badge3Opacity = interpolate(frame, [90, 105], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // 5. Educational mechanism card reveal (after voice completes at ~160 frames)
  const cardSpring = spring({
    frame: frame - 165,
    fps,
    config: { damping: 16, stiffness: 90 },
  });
  const cardOpacity = interpolate(cardSpring, [0, 1], [0, 1]);
  const cardTranslateY = interpolate(cardSpring, [0, 1], [40, 0]);

  // 6. Subtitles from narration_words.json
  const words: WordItem[] = wordsData.s01;

  // 7. Particle positions along curved streamlines
  const particleCount = 16;
  const particles = Array.from({ length: particleCount }).map((_, i) => {
    const t = ((frame * 1.8 + i * (600 / particleCount)) % 600) / 600;
    // Bezier-like curve across the bay
    const px = 180 + t * 740 + Math.sin(t * Math.PI * 2) * 45;
    const py = 760 + t * 480 + Math.cos(t * Math.PI * 1.5) * 60;
    const pOpacity = Math.sin(t * Math.PI) * 0.9;
    return { px, py, pOpacity };
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: '#0a192f',
        width,
        height,
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
        overflow: 'hidden',
        color: '#ffffff',
      }}
    >
      {/* ── Audio Elements ── */}
      <Audio
        src={staticFile('coastal-reclamation-20261024/sc01_voice.wav')}
        volume={1.0}
      />
      <Audio
        src={staticFile('coastal-reclamation-20261024/sc01_bgm.wav')}
        volume={0.18}
      />

      {/* ── 1. Background AI Artwork Layer ── */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          transform: `scale(${bgScale})`,
          transformOrigin: 'center center',
        }}
      >
        <Img
          src={staticFile('coastal-reclamation-20261024/sc01_bg.png')}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
          }}
        />
      </div>

      {/* ── Gradient Contrast Protection Overlays ── */}
      {/* Top gradient for headers & badges */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '380px',
          background:
            'linear-gradient(180deg, rgba(10,25,47,0.92) 0%, rgba(10,25,47,0.65) 50%, rgba(10,25,47,0) 100%)',
          pointerEvents: 'none',
        }}
      />
      {/* Bottom gradient for subtitles and info card */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: '620px',
          background:
            'linear-gradient(0deg, rgba(10,25,47,0.96) 0%, rgba(10,25,47,0.75) 55%, rgba(10,25,47,0) 100%)',
          pointerEvents: 'none',
        }}
      />

      {/* ── 2. Prominent Scientific Disclaimer Badge (SSOT contract) ── */}
      <div
        style={{
          position: 'absolute',
          top: '52px',
          right: '48px',
          padding: '8px 18px',
          borderRadius: '20px',
          backgroundColor: 'rgba(10, 25, 47, 0.85)',
          border: '1px solid rgba(0, 180, 216, 0.5)',
          boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}
      >
        <div
          style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            backgroundColor: '#00f5d4',
            boxShadow: '0 0 8px #00f5d4',
          }}
        />
        <span
          style={{
            fontSize: '20px',
            fontWeight: 700,
            letterSpacing: '1.5px',
            color: '#00b4d8',
            fontFamily: 'monospace',
          }}
        >
          HÌNH MINH HỌA / SƠ ĐỒ NGUYÊN LÝ
        </span>
      </div>

      {/* ── 3. Remotion Atelier Vector SVG Overlay Layer ── */}
      <svg
        viewBox="0 0 1080 1920"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
        }}
      >
        <defs>
          {/* Gradient for current streamlines */}
          <linearGradient id="currentGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#00f5d4" stopOpacity="0.8" />
            <stop offset="50%" stopColor="#00b4d8" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#0077b6" stopOpacity="0.3" />
          </linearGradient>

          {/* Glow filter */}
          <filter id="cyanGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* ── Bathymetry Contour Lines ── */}
        {/* Contour 1: 0m (Intertidal Mangrove Margin) */}
        <path
          d="M 120 740 Q 380 700 620 780 T 980 840"
          fill="none"
          stroke="#2a9d8f"
          strokeWidth="3.5"
          strokeDasharray="1000"
          strokeDashoffset={contourDraw1}
          filter="url(#cyanGlow)"
        />

        {/* Contour 2: -5m (Subtidal Shelf) */}
        <path
          d="M 100 890 Q 390 850 640 940 T 990 1020"
          fill="none"
          stroke="#00b4d8"
          strokeWidth="3.5"
          strokeDasharray="1000"
          strokeDashoffset={contourDraw2}
          filter="url(#cyanGlow)"
        />

        {/* Contour 3: -10m (Deep Seabed Basin) */}
        <path
          d="M 90 1060 Q 400 1020 660 1120 T 1000 1210"
          fill="none"
          stroke="#0077b6"
          strokeWidth="3"
          strokeDasharray="1000"
          strokeDashoffset={contourDraw3}
        />

        {/* ── Animated Current Streamlines & Particles ── */}
        <path
          d="M 160 760 Q 450 780 720 980 T 960 1260"
          fill="none"
          stroke="url(#currentGrad)"
          strokeWidth="4"
          strokeDasharray="12 12"
          opacity="0.65"
        />

        {/* Moving Particles along the coastal current stream */}
        {particles.map((p, idx) => (
          <circle
            key={idx}
            cx={p.px}
            cy={p.py}
            r="6"
            fill="#00f5d4"
            opacity={p.pOpacity}
            filter="url(#cyanGlow)"
          />
        ))}

        {/* Directional current indicators */}
        <g opacity={Math.sin((frame / 15) * Math.PI) * 0.3 + 0.7}>
          <polygon
            points="730,990 705,975 715,990 705,1005"
            fill="#00f5d4"
          />
          <polygon
            points="880,1170 855,1155 865,1170 855,1185"
            fill="#00b4d8"
          />
        </g>
      </svg>

      {/* ── Bathymetry Contour Tags ── */}
      <div
        style={{
          position: 'absolute',
          top: '715px',
          left: '120px',
          opacity: badge1Opacity,
          backgroundColor: 'rgba(10,25,47,0.88)',
          border: '1px solid #2a9d8f',
          padding: '6px 14px',
          borderRadius: '8px',
          fontSize: '22px',
          fontWeight: 700,
          color: '#2a9d8f',
        }}
      >
        0m: BÃI TRIỀU & RỪNG NGẬP MẶN
      </div>

      <div
        style={{
          position: 'absolute',
          top: '865px',
          left: '140px',
          opacity: badge2Opacity,
          backgroundColor: 'rgba(10,25,47,0.88)',
          border: '1px solid #00b4d8',
          padding: '6px 14px',
          borderRadius: '8px',
          fontSize: '22px',
          fontWeight: 700,
          color: '#00b4d8',
        }}
      >
        -5m: THỀM NÔNG NẮN DÒNG
      </div>

      <div
        style={{
          position: 'absolute',
          top: '1035px',
          left: '160px',
          opacity: badge3Opacity,
          backgroundColor: 'rgba(10,25,47,0.88)',
          border: '1px solid #0077b6',
          padding: '6px 14px',
          borderRadius: '8px',
          fontSize: '22px',
          fontWeight: 700,
          color: '#90e0ef',
        }}
      >
        -10m: ĐÁY BIỂN SÂU
      </div>

      {/* ── 4. Main Hook Headline (Spring animation & Pin-to-top) ── */}
      <div
        style={{
          position: 'absolute',
          top: `${titleY}px`,
          left: '50%',
          transform: `translateX(-50%) scale(${titleScale})`,
          width: '920px',
          padding: '24px 32px',
          borderRadius: '24px',
          backgroundColor: `rgba(10, 25, 47, ${titleBgOpacity})`,
          border: '2px solid rgba(0, 180, 216, 0.4)',
          boxShadow: '0 12px 40px rgba(0, 0, 0, 0.6)',
          textAlign: 'center',
          zIndex: 10,
        }}
      >
        <div
          style={{
            fontSize: '56px',
            fontWeight: 900,
            color: '#00f5d4',
            letterSpacing: '3px',
            marginBottom: '8px',
            textTransform: 'uppercase',
          }}
        >
          LẤN BIỂN & THỦY ĐỘNG LỰC
        </div>
        <div
          style={{
            fontSize: '38px',
            fontWeight: 700,
            color: '#ffffff',
            lineHeight: 1.25,
          }}
        >
          Dòng hải lưu & Rừng ngập mặn sẽ thay đổi ra sao?
        </div>
      </div>

      {/* ── 5. Karaoke Word-Level Subtitles (Synced via narration_words.json) ── */}
      <div
        style={{
          position: 'absolute',
          bottom: frame < 165 ? '180px' : '480px',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '940px',
          padding: '20px 28px',
          borderRadius: '20px',
          backgroundColor: 'rgba(10, 25, 47, 0.90)',
          border: '1.5px solid rgba(0, 180, 216, 0.6)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
          textAlign: 'center',
          transition: 'bottom 0.4s ease',
          zIndex: 15,
        }}
      >
        <div
          style={{
            fontSize: '36px',
            lineHeight: 1.5,
            fontWeight: 600,
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'center',
            gap: '10px 14px',
          }}
        >
          {words.map((item, idx) => {
            const isSpoken = currentTime >= item.start;
            const isCurrent =
              currentTime >= item.start && currentTime <= item.end;
            const displayWord =
              item.display_word || item.canonical_word || item.word;

            let wordColor = 'rgba(255, 255, 255, 0.45)';
            let wordWeight = 500;
            let textShadow = 'none';

            if (isCurrent) {
              wordColor = '#00f5d4';
              wordWeight = 900;
              textShadow = '0 0 14px rgba(0, 245, 212, 0.8)';
            } else if (isSpoken) {
              wordColor = '#ffffff';
              wordWeight = 700;
            }

            return (
              <span
                key={idx}
                style={{
                  color: wordColor,
                  fontWeight: wordWeight,
                  textShadow,
                  transition: 'color 0.1s ease',
                }}
              >
                {displayWord}
              </span>
            );
          })}
        </div>
      </div>

      {/* ── 6. Scientific Mechanisms Summary Card (Appears after voiceover) ── */}
      <div
        style={{
          position: 'absolute',
          bottom: '120px',
          left: '50%',
          transform: `translateX(-50%) translateY(${cardTranslateY}px)`,
          opacity: cardOpacity,
          width: '940px',
          padding: '28px 32px',
          borderRadius: '22px',
          backgroundColor: 'rgba(10, 25, 47, 0.92)',
          border: '1.5px solid rgba(42, 157, 143, 0.7)',
          boxShadow: '0 16px 40px rgba(0, 0, 0, 0.6)',
          zIndex: 12,
        }}
      >
        <div
          style={{
            fontSize: '24px',
            fontWeight: 800,
            color: '#e9c46a',
            letterSpacing: '2px',
            marginBottom: '14px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
          }}
        >
          <span style={{ fontSize: '28px' }}>⚡</span> 3 CƠ CHẾ VẬT LÝ THEN CHỐT:
        </div>
        <div
          style={{
            fontSize: '25px',
            color: '#e0e1dd',
            lineHeight: 1.45,
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
          }}
        >
          <div>
            <strong style={{ color: '#00f5d4' }}>1. Lăng kính triều:</strong>{' '}
            Thu hẹp diện tích ngập triều làm biến đổi vận tốc dòng chảy (Wilson et al., 2017).
          </div>
          <div>
            <strong style={{ color: '#00b4d8' }}>2. Cân bằng bùn cát:</strong>{' '}
            Bồi lắng phía đón dòng, đói cát xói lở phía khuất dòng (USGS 03-337).
          </div>
          <div>
            <strong style={{ color: '#2a9d8f' }}>3. Rừng ngập mặn:</strong>{' '}
            Tiêu tán &gt;70% sóng ngắn nhưng cần dòng triều thông thoáng để rễ thở.
          </div>
        </div>
      </div>

      {/* ── 7. Draft HUD Overlay (SSOT review gate) ── */}
      {debug && (
        <div
          style={{
            position: 'absolute',
            bottom: '36px',
            left: '36px',
            backgroundColor: 'rgba(0, 0, 0, 0.75)',
            border: '1px solid rgba(255, 255, 255, 0.3)',
            padding: '6px 14px',
            borderRadius: '8px',
            fontFamily: 'monospace',
            fontSize: '20px',
            color: '#00f5d4',
            zIndex: 999,
          }}
        >
          S1 f{frame} {(frame / 30).toFixed(1)}s [{frame}/300]
        </div>
      )}
    </AbsoluteFill>
  );
};
