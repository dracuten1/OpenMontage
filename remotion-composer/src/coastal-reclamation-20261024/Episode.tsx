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
  useVideoConfig,
} from 'remotion';

// Load timing and words data
import sceneTiming from '../../public/coastal-reclamation-20261024/scene_timing.json';
import wordsData from '../../public/coastal-reclamation-20261024/words.json';

interface WordItem {
  word: string;
  start: number;
  end: number;
  probability?: number;
  canonical_word?: string;
  display_word?: string;
}

export interface CoastalReclamationEpisodeProps {
  debug?: boolean;
}

export const CoastalReclamationEpisode: React.FC<CoastalReclamationEpisodeProps> = ({
  debug = true,
}) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();

  // Determine current active scene based on frame
  const scenes = sceneTiming.scenes;
  let activeSceneIndex = 0;
  for (let i = 0; i < scenes.length; i++) {
    if (frame >= scenes[i].start_frame && frame < scenes[i].end_frame) {
      activeSceneIndex = i;
      break;
    }
  }
  if (frame >= scenes[scenes.length - 1].end_frame) {
    activeSceneIndex = scenes.length - 1;
  }

  const currentScene = scenes[activeSceneIndex];
  const frameInScene = frame - currentScene.start_frame;
  const timeInScene = frameInScene / fps;
  const sceneDurFrames = currentScene.duration_frames;

  // Scene voice words
  const sceneWordsKey = `s0${activeSceneIndex + 1}` as keyof typeof wordsData;
  const currentWords: WordItem[] = (wordsData[sceneWordsKey] as WordItem[]) || [];

  // Ken Burns slow scale
  const bgScale = interpolate(frameInScene, [0, sceneDurFrames], [1.0, 1.04], {
    extrapolateRight: 'clamp',
  });

  // Scene transition cross-fade (first 12 frames of each scene)
  const sceneFadeIn = interpolate(frameInScene, [0, 12], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Callout Card entrance spring (appears after speech settles, e.g., frame 140)
  const cardTriggerFrame = activeSceneIndex === 0 ? 150 : 180;
  const cardSpring = spring({
    frame: frameInScene - cardTriggerFrame,
    fps,
    config: { damping: 16, stiffness: 90 },
  });
  const cardOpacity = interpolate(cardSpring, [0, 1], [0, 1]);
  const cardTranslateY = interpolate(cardSpring, [0, 1], [30, 0]);

  // Particles animation along vector paths
  const particleCount = 14;
  const particles = Array.from({ length: particleCount }).map((_, i) => {
    const t = ((frame * 1.6 + i * (500 / particleCount)) % 500) / 500;
    const px = 160 + t * 760 + Math.sin(t * Math.PI * 2) * 50;
    const py = 740 + t * 500 + Math.cos(t * Math.PI * 1.5) * 60;
    const pOpacity = Math.sin(t * Math.PI) * 0.85;
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
      {/* ── Continuous Background Music ── */}
      <Audio
        src={staticFile('coastal-reclamation-20261024/full_bgm.wav')}
        volume={0.18}
      />

      {/* ── Per-Scene Voice Narrations ── */}
      {scenes.map((sc, idx) => (
        <Sequence
          key={sc.id}
          from={sc.start_frame}
          durationInFrames={sc.duration_frames}
        >
          <Audio
            src={staticFile(`coastal-reclamation-20261024/${sc.voice_file}`)}
            volume={1.0}
          />
        </Sequence>
      ))}

      {/* ── 1. Background AI Artwork Layer with Motion ── */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          opacity: sceneFadeIn,
          transform: `scale(${bgScale})`,
          transformOrigin: 'center center',
        }}
      >
        <Img
          src={staticFile(`coastal-reclamation-20261024/${currentScene.image_file}`)}
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
      {/* Bottom gradient for subtitles and callout cards */}
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

      {/* ── 2. Top Header Bar: Chapter indicator & Scientific Disclaimer ── */}
      <div
        style={{
          position: 'absolute',
          top: '50px',
          left: '48px',
          padding: '8px 20px',
          borderRadius: '20px',
          backgroundColor: 'rgba(10, 25, 47, 0.88)',
          border: '1.5px solid rgba(0, 180, 216, 0.6)',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          zIndex: 20,
        }}
      >
        <div
          style={{
            width: '10px',
            height: '10px',
            borderRadius: '50%',
            backgroundColor: '#00f5d4',
            boxShadow: '0 0 10px #00f5d4',
          }}
        />
        <span
          style={{
            fontSize: '22px',
            fontWeight: 800,
            color: '#ffffff',
            letterSpacing: '1px',
          }}
        >
          PHẦN {activeSceneIndex + 1}/6: {currentScene.title}
        </span>
      </div>

      {/* Mandatory Scientific Disclaimer Badge (Stacked neatly under chapter bar) */}
      <div
        style={{
          position: 'absolute',
          top: '110px',
          left: '48px',
          padding: '6px 16px',
          borderRadius: '16px',
          backgroundColor: 'rgba(10, 25, 47, 0.88)',
          border: '1px solid rgba(0, 180, 216, 0.5)',
          boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          zIndex: 20,
        }}
      >
        <span
          style={{
            fontSize: '17px',
            fontWeight: 700,
            letterSpacing: '1.2px',
            color: '#00b4d8',
            fontFamily: 'monospace',
          }}
        >
          [ HÌNH MINH HỌA / SƠ ĐỒ NGUYÊN LÝ ]
        </span>
      </div>

      {/* ── 3. Remotion Atelier Dynamic Vector Graphics ── */}
      <svg
        viewBox="0 0 1080 1920"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
          zIndex: 10,
        }}
      >
        <defs>
          <linearGradient id="currentGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#00f5d4" stopOpacity="0.8" />
            <stop offset="50%" stopColor="#00b4d8" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#0077b6" stopOpacity="0.3" />
          </linearGradient>

          <filter id="cyanGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Scene-specific vector graphics */}
        {activeSceneIndex === 0 && (
          <g>
            <path
              d="M 120 740 Q 380 700 620 780 T 980 840"
              fill="none"
              stroke="#2a9d8f"
              strokeWidth="3.5"
              filter="url(#cyanGlow)"
            />
            <path
              d="M 100 890 Q 390 850 640 940 T 990 1020"
              fill="none"
              stroke="#00b4d8"
              strokeWidth="3.5"
              filter="url(#cyanGlow)"
            />
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
          </g>
        )}

        {activeSceneIndex === 1 && (
          <g>
            {/* Constricted strait vectors */}
            <path
              d="M 180 850 Q 540 950 900 850"
              fill="none"
              stroke="#f4a261"
              strokeWidth="4"
              strokeDasharray="14 10"
              filter="url(#cyanGlow)"
            />
            {/* Accelerating arrows */}
            <polygon points="560,950 530,935 540,950 530,965" fill="#f4a261" />
            {/* Eddy swirl circle */}
            <circle
              cx="780"
              cy="1050"
              r="45"
              fill="none"
              stroke="#00f5d4"
              strokeWidth="3"
              strokeDasharray="8 6"
              transform={`rotate(${(frame * 3) % 360} 780 1050)`}
            />
          </g>
        )}

        {activeSceneIndex === 2 && (
          <g>
            {/* Longshore drift groyne barrier */}
            <line
              x1="540"
              y1="700"
              x2="540"
              y2="1100"
              stroke="#e9c46a"
              strokeWidth="8"
              filter="url(#cyanGlow)"
            />
            {/* Updrift sand accumulation particles */}
            {Array.from({ length: 8 }).map((_, i) => (
              <circle
                key={i}
                cx={420 + (i % 3) * 30 + Math.sin((frame + i * 20) / 10) * 8}
                cy={800 + i * 35}
                r="6"
                fill="#e9c46a"
              />
            ))}
            {/* Downdrift erosion warning cross */}
            <text
              x="620"
              y="940"
              fill="#e76f51"
              fontSize="38"
              fontWeight="bold"
            >
              ⚠ ĐÓI CÁT &amp; XÓI LỞ
            </text>
          </g>
        )}

        {activeSceneIndex === 3 && (
          <g>
            {/* Wave attenuation line passing through roots */}
            <path
              d="M 100 850 Q 300 800 500 850 T 980 880"
              fill="none"
              stroke="#00f5d4"
              strokeWidth="4"
              filter="url(#cyanGlow)"
            />
            {/* Pneumatophore root markers */}
            {Array.from({ length: 9 }).map((_, i) => (
              <line
                key={i}
                x1={200 + i * 80}
                y1="960"
                x2={200 + i * 80}
                y2="880"
                stroke="#52b788"
                strokeWidth="6"
                strokeLinecap="round"
              />
            ))}
          </g>
        )}

        {activeSceneIndex === 4 && (
          <g>
            {/* Permeable channels with circulating arrows */}
            <path
              d="M 220 820 Q 540 820 860 820"
              fill="none"
              stroke="#52b788"
              strokeWidth="4"
              strokeDasharray="16 12"
            />
            <path
              d="M 220 980 Q 540 980 860 980"
              fill="none"
              stroke="#00b4d8"
              strokeWidth="4"
              strokeDasharray="16 12"
            />
          </g>
        )}

        {activeSceneIndex === 5 && (
          <g>
            {/* Dynamic equilibrium balance circles */}
            <circle
              cx="540"
              cy="900"
              r="120"
              fill="none"
              stroke="#00f5d4"
              strokeWidth="3"
              strokeDasharray="10 8"
              transform={`rotate(${(frame * 1.5) % 360} 540 900)`}
            />
            <circle
              cx="540"
              cy="900"
              r="180"
              fill="none"
              stroke="#52b788"
              strokeWidth="2.5"
              strokeDasharray="14 10"
              transform={`rotate(${(-frame * 1.2) % 360} 540 900)`}
            />
          </g>
        )}
      </svg>

      {/* ── 4. Main Headline Badge (Scene 1 Hook / Scene 6 Conclusion) ── */}
      {activeSceneIndex === 0 && (
        <div
          style={{
            position: 'absolute',
            top: frameInScene < 65 ? '380px' : '140px',
            left: '50%',
            transform: `translateX(-50%) scale(${frameInScene < 65 ? 1.0 : 0.75})`,
            width: '920px',
            padding: '24px 32px',
            borderRadius: '24px',
            backgroundColor: 'rgba(10, 25, 47, 0.92)',
            border: '2px solid rgba(0, 180, 216, 0.5)',
            boxShadow: '0 12px 40px rgba(0, 0, 0, 0.6)',
            textAlign: 'center',
            transition: 'all 0.4s ease',
            zIndex: 15,
          }}
        >
          <div
            style={{
              fontSize: '52px',
              fontWeight: 900,
              color: '#00f5d4',
              letterSpacing: '3px',
              marginBottom: '6px',
            }}
          >
            LẤN BIỂN &amp; THỦY ĐỘNG LỰC
          </div>
          <div
            style={{
              fontSize: '36px',
              fontWeight: 700,
              color: '#ffffff',
            }}
          >
            Dòng hải lưu &amp; Rừng ngập mặn sẽ thay đổi ra sao?
          </div>
        </div>
      )}

      {/* ── 5. Karaoke Word-Level Subtitles ── */}
      <div
        style={{
          position: 'absolute',
          bottom: cardOpacity > 0.3 ? '460px' : '180px',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '940px',
          padding: '20px 28px',
          borderRadius: '20px',
          backgroundColor: 'rgba(10, 25, 47, 0.92)',
          border: '1.5px solid rgba(0, 180, 216, 0.6)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
          textAlign: 'center',
          transition: 'bottom 0.4s ease',
          zIndex: 15,
        }}
      >
        <div
          style={{
            fontSize: '35px',
            lineHeight: 1.5,
            fontWeight: 600,
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'center',
            gap: '8px 12px',
          }}
        >
          {currentWords.map((item, idx) => {
            const isSpoken = timeInScene >= item.start;
            const isCurrent =
              timeInScene >= item.start && timeInScene <= item.end;
            const displayWord =
              item.display_word || item.canonical_word || item.word;

            let wordColor = 'rgba(255, 255, 255, 0.70)';
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
                }}
              >
                {displayWord}
              </span>
            );
          })}
        </div>
      </div>

      {/* ── 6. Scientific Educational Callout Cards ── */}
      <div
        style={{
          position: 'absolute',
          bottom: '120px',
          left: '50%',
          transform: `translateX(-50%) translateY(${cardTranslateY}px)`,
          opacity: cardOpacity,
          width: '940px',
          padding: '24px 32px',
          borderRadius: '22px',
          backgroundColor: 'rgba(10, 25, 47, 0.94)',
          border: '1.5px solid rgba(42, 157, 143, 0.7)',
          boxShadow: '0 16px 40px rgba(0, 0, 0, 0.6)',
          zIndex: 12,
        }}
      >
        {activeSceneIndex === 0 && (
          <div>
            <div
              style={{
                fontSize: '24px',
                fontWeight: 800,
                color: '#e9c46a',
                marginBottom: '10px',
              }}
            >
              ⚡ 3 NGUYÊN LÝ VẬT LÝ THEN CHỐT:
            </div>
            <div style={{ fontSize: '24px', color: '#e0e1dd', lineHeight: 1.4 }}>
              1. Lăng kính triều thu hẹp làm tăng lưu tốc dòng chảy • 2. Cân bằng bùn cát bồi đón dòng, đói sạt khuất dòng • 3. Rễ ngập mặn cần triều rút để hô hấp.
            </div>
          </div>
        )}

        {activeSceneIndex === 1 && (
          <div>
            <div
              style={{
                fontSize: '24px',
                fontWeight: 800,
                color: '#f4a261',
                marginBottom: '10px',
              }}
            >
              🌊 ĐỊNH LUẬT BẢO TOÀN LƯU LƯỢNG (Q = A × V):
            </div>
            <div style={{ fontSize: '24px', color: '#e0e1dd', lineHeight: 1.4 }}>
              San lấp thu hẹp mặt cắt A làm lưu tốc V tăng đột ngột tại eo thắt, cuốn trôi bùn đáy và tạo các xoáy nước tù đọng phía sau bờ kè.
            </div>
          </div>
        )}

        {activeSceneIndex === 2 && (
          <div>
            <div
              style={{
                fontSize: '24px',
                fontWeight: 800,
                color: '#e76f51',
                marginBottom: '10px',
              }}
            >
              🏖️ HIỆU ỨNG CHẶN DÒNG DỌC BỜ (USGS CIRCULAR 1075):
            </div>
            <div style={{ fontSize: '24px', color: '#e0e1dd', lineHeight: 1.4 }}>
              Bờ đón dòng: Cát lắng tụ tạo bãi bồi nhân tạo. Bờ khuất dòng: Dòng nước bị đói trầm tích sẽ khoét sâu vào bờ gây sạt lở dữ dội.
            </div>
          </div>
        )}

        {activeSceneIndex === 3 && (
          <div>
            <div
              style={{
                fontSize: '24px',
                fontWeight: 800,
                color: '#52b788',
                marginBottom: '10px',
              }}
            >
              🌿 ĐẶC TÍNH RỄ THỞ (PNEUMATOPHORES):
            </div>
            <div style={{ fontSize: '24px', color: '#e0e1dd', lineHeight: 1.4 }}>
              Cản phá 70-80% sóng bão nhưng bắt buộc cần chu kỳ triều rút để trao đổi khí. Bồi lấp bùn quá nhanh sẽ bít kín lỗ thở làm chết cây.
            </div>
          </div>
        )}

        {activeSceneIndex === 4 && (
          <div>
            <div
              style={{
                fontSize: '24px',
                fontWeight: 800,
                color: '#00f5d4',
                marginBottom: '10px',
              }}
            >
              🏗️ GIẢI PHÁP CÔNG TRÌNH SINH THÁI THÍCH ỨNG:
            </div>
            <div style={{ fontSize: '24px', color: '#e0e1dd', lineHeight: 1.4 }}>
              Quy hoạch đảo mở có kênh lưu thông triều tự nhiên, nuôi bãi định kỳ bổ sung cát, và thiết lập đai rừng đệm phía ngoài tiêu năng sóng.
            </div>
          </div>
        )}

        {activeSceneIndex === 5 && (
          <div>
            <div
              style={{
                fontSize: '24px',
                fontWeight: 800,
                color: '#e9c46a',
                marginBottom: '10px',
              }}
            >
              🌍 NGUYÊN LÝ CÂN BẰNG ĐỘNG VEN BỜ:
            </div>
            <div style={{ fontSize: '24px', color: '#e0e1dd', lineHeight: 1.4 }}>
              Bờ biển không phải đường biên cố định. Phát triển bền vững đòi hỏi phải tôn trọng và hòa nhịp cùng các quy luật thủy động lực tự nhiên.
            </div>
          </div>
        )}
      </div>

      {/* ── 7. Draft HUD Overlay (debug) ── */}
      {debug && (
        <div
          style={{
            position: 'absolute',
            bottom: '36px',
            left: '36px',
            backgroundColor: 'rgba(0, 0, 0, 0.78)',
            border: '1px solid rgba(255, 255, 255, 0.35)',
            padding: '6px 14px',
            borderRadius: '8px',
            fontFamily: 'monospace',
            fontSize: '19px',
            color: '#00f5d4',
            zIndex: 999,
          }}
        >
          S{activeSceneIndex + 1} f{frame} {(frame / 30).toFixed(1)}s [{frameInScene}/{sceneDurFrames}]
        </div>
      )}
    </AbsoluteFill>
  );
};
