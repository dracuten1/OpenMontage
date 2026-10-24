import React from 'react';
import {AbsoluteFill, Img, staticFile} from 'remotion';
import {C, FONT} from './theme';

interface ThumbnailProps {
  headlineType?: 'topic' | 'salary';
}

export const AffordableHousingThumbnail: React.FC<ThumbnailProps> = ({
  headlineType = 'topic',
}) => {
  return (
    <AbsoluteFill
      style={{
        backgroundColor: C.bg,
        fontFamily: FONT,
        color: C.white,
        overflow: 'hidden',
      }}
    >
      {/* Background Isometric Artwork */}
      <Img
        src={staticFile('affordable-housing-20261024/sc01_bg.png')}
        style={{
          position: 'absolute',
          top: 60,
          left: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          transform: 'scale(1.06)',
          filter: 'brightness(1.05)',
        }}
      />

      {/* Top & Bottom Contrast Gradients */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'linear-gradient(180deg, rgba(6,11,25,0.96) 0%, rgba(11,19,43,0.82) 30%, rgba(11,19,43,0.15) 54%, rgba(6,11,25,0.92) 78%, rgba(6,11,25,1) 100%)',
        }}
      />

      {/* Top Breaking Tag */}
      <div
        style={{
          position: 'absolute',
          top: 110,
          left: 64,
          right: 64,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <div
          style={{
            background: C.coral,
            color: C.white,
            padding: '12px 28px',
            borderRadius: 14,
            fontSize: 28,
            fontWeight: 900,
            letterSpacing: 2,
            boxShadow: `0 8px 28px ${C.coral}66`,
          }}
        >
          NGHỊCH LÝ AN CƯ ĐÔ THỊ · 2026
        </div>
        <div
          style={{
            background: 'rgba(15,23,42,0.92)',
            border: `2px solid ${C.cyan}`,
            color: C.cyan,
            padding: '10px 22px',
            borderRadius: 12,
            fontSize: 24,
            fontWeight: 800,
          }}
        >
          INFOGRAPHIC TÀI CHÍNH
        </div>
      </div>

      {/* Main Hook Headline */}
      <div
        style={{
          position: 'absolute',
          top: 200,
          left: 64,
          right: 64,
        }}
      >
        {headlineType === 'topic' ? (
          <>
            <div
              style={{
                fontSize: 56,
                fontWeight: 900,
                lineHeight: 1.15,
                color: C.white,
                textShadow: '0 6px 24px rgba(0,0,0,0.9)',
              }}
            >
              ĐỀ XUẤT NHÀ Ở
            </div>
            <div
              style={{
                fontSize: 62,
                fontWeight: 900,
                lineHeight: 1.15,
                color: C.amber,
                marginTop: 4,
                textShadow: '0 6px 24px rgba(0,0,0,0.9)',
              }}
            >
              60–70 TRIỆU/M²
            </div>
            <div
              style={{
                fontSize: 52,
                fontWeight: 900,
                lineHeight: 1.18,
                color: C.coral,
                marginTop: 8,
                textShadow: '0 6px 24px rgba(0,0,0,0.9)',
              }}
            >
              CHO NGƯỜI THU NHẬP THẤP?
            </div>
          </>
        ) : (
          <>
            <div
              style={{
                fontSize: 64,
                fontWeight: 900,
                lineHeight: 1.12,
                color: C.white,
                textShadow: '0 6px 24px rgba(0,0,0,0.9)',
              }}
            >
              LƯƠNG <span style={{color: C.amber}}>50 TRIỆU/THÁNG</span>
            </div>
            <div
              style={{
                fontSize: 52,
                fontWeight: 900,
                lineHeight: 1.15,
                color: C.cyan,
                marginTop: 8,
                textShadow: '0 6px 24px rgba(0,0,0,0.9)',
              }}
            >
              VẪN THUỘC DIỆN CẦN HỖ TRỢ MUA NHÀ?
            </div>
          </>
        )}
      </div>

      {/* Center Subline Chips */}
      <div
        style={{
          position: 'absolute',
          top: 410,
          left: 64,
          right: 64,
          display: 'flex',
          gap: 16,
        }}
      >
        <div
          style={{
            background: 'rgba(15,23,42,0.9)',
            border: `1.5px solid rgba(255,183,3,0.6)`,
            borderRadius: 10,
            padding: '8px 18px',
            fontSize: 22,
            fontWeight: 700,
            color: C.amber,
          }}
        >
          Kiến nghị HoREA gửi Thủ tướng
        </div>
        <div
          style={{
            background: 'rgba(15,23,42,0.9)',
            border: `1.5px solid rgba(255,94,91,0.6)`,
            borderRadius: 10,
            padding: '8px 18px',
            fontSize: 22,
            fontWeight: 700,
            color: C.coral,
          }}
        >
          Vùng trũng: Thu nhập 50 triệu/tháng
        </div>
      </div>

      {/* Bottom Data Comparison Cards */}
      <div
        style={{
          position: 'absolute',
          bottom: 170,
          left: 64,
          right: 64,
          display: 'flex',
          gap: 24,
        }}
      >
        <div
          style={{
            flex: 1,
            background: 'rgba(17, 28, 53, 0.96)',
            border: `3px solid ${C.amber}`,
            borderRadius: 22,
            padding: '24px 26px',
            boxShadow: '0 14px 36px rgba(0,0,0,0.75)',
          }}
        >
          <div style={{fontSize: 22, color: C.amber, fontWeight: 800}}>
            CĂN HỘ 50M² CHUẨN
          </div>
          <div
            style={{
              fontSize: 52,
              fontWeight: 900,
              color: C.white,
              marginTop: 6,
            }}
          >
            3,25 <span style={{fontSize: 32, color: C.amber}}>TỶ ĐỒNG</span>
          </div>
          <div style={{fontSize: 21, color: '#CBD5E1', marginTop: 8, fontWeight: 500}}>
            Đơn giá 65 tr/m² · Vốn tự có 30% (~975 tr)
          </div>
        </div>

        <div
          style={{
            flex: 1,
            background: 'rgba(17, 28, 53, 0.96)',
            border: `3px solid ${C.coral}`,
            borderRadius: 22,
            padding: '24px 26px',
            boxShadow: '0 14px 36px rgba(0,0,0,0.75)',
          }}
        >
          <div style={{fontSize: 22, color: C.coral, fontWeight: 800}}>
            GÁNH NẶNG TRẢ GÓP (20 NĂM)
          </div>
          <div
            style={{
              fontSize: 52,
              fontWeight: 900,
              color: C.white,
              marginTop: 6,
            }}
          >
            28 <span style={{fontSize: 30, color: C.coral}}>TR/THÁNG</span>
          </div>
          <div style={{fontSize: 21, color: '#CBD5E1', marginTop: 8, fontWeight: 500}}>
            Ưu đãi ngốn 56% · Thả nổi ngốn &gt;64% lương
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

export const AffordableHousingThumbnailLandscape: React.FC = () => {
  return (
    <AbsoluteFill
      style={{
        backgroundColor: C.bg,
        fontFamily: FONT,
        color: C.white,
        overflow: 'hidden',
      }}
    >
      {/* Background Isometric Artwork on Right Side */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          right: 0,
          width: '56%',
          height: '100%',
          overflow: 'hidden',
        }}
      >
        <Img
          src={staticFile('affordable-housing-20261024/sc01_bg.png')}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            transform: 'scale(1.18)',
            filter: 'brightness(1.02) contrast(1.05)',
          }}
        />
        {/* Soft gradient blend from left */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'linear-gradient(90deg, #0B132B 0%, rgba(11,19,43,0.85) 28%, rgba(11,19,43,0.2) 65%, rgba(11,19,43,0.45) 100%)',
          }}
        />
      </div>

      {/* Left Column Content Area */}
      <div
        style={{
          position: 'absolute',
          top: 45,
          bottom: 45,
          left: 55,
          width: 730,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          zIndex: 10,
        }}
      >
        {/* Header Tags */}
        <div style={{display: 'flex', gap: 14, alignItems: 'center'}}>
          <div
            style={{
              background: C.coral,
              color: C.white,
              padding: '8px 20px',
              borderRadius: 10,
              fontSize: 19,
              fontWeight: 900,
              letterSpacing: 1.5,
              boxShadow: `0 6px 20px ${C.coral}55`,
            }}
          >
            NGHỊCH LÝ AN CƯ ĐÔ THỊ · 2026
          </div>
          <div
            style={{
              background: 'rgba(15,23,42,0.92)',
              border: `1.5px solid ${C.cyan}`,
              color: C.cyan,
              padding: '7px 16px',
              borderRadius: 8,
              fontSize: 17,
              fontWeight: 800,
            }}
          >
            KIẾN NGHỊ HOREA
          </div>
        </div>

        {/* Main Headline */}
        <div>
          <div
            style={{
              fontSize: 44,
              fontWeight: 900,
              lineHeight: 1.12,
              color: C.white,
              textShadow: '0 4px 20px rgba(0,0,0,0.9)',
            }}
          >
            ĐỀ XUẤT NHÀ Ở
          </div>
          <div
            style={{
              fontSize: 50,
              fontWeight: 900,
              lineHeight: 1.15,
              color: C.amber,
              marginTop: 2,
              textShadow: '0 4px 20px rgba(0,0,0,0.9)',
            }}
          >
            60–70 TRIỆU/M²
          </div>
          <div
            style={{
              fontSize: 40,
              fontWeight: 900,
              lineHeight: 1.18,
              color: C.coral,
              marginTop: 4,
              textShadow: '0 4px 20px rgba(0,0,0,0.9)',
            }}
          >
            CHO NGƯỜI THU NHẬP THẤP?
          </div>
          <div
            style={{
              fontSize: 20,
              color: '#CBD5E1',
              marginTop: 12,
              lineHeight: 1.4,
              maxWidth: 700,
              fontWeight: 500,
            }}
          >
            Lương 50 triệu/tháng vẫn rơi vào khoảng trống &ldquo;The Missing Middle&rdquo;:
            Trả góp 28 triệu/tháng ngốn tới 56%–64% thu nhập.
          </div>
        </div>

        {/* Bottom Data Cards */}
        <div style={{display: 'flex', gap: 18}}>
          <div
            style={{
              flex: 1,
              background: 'rgba(17, 28, 53, 0.96)',
              border: `2px solid ${C.amber}`,
              borderRadius: 16,
              padding: '14px 18px',
              boxShadow: '0 10px 25px rgba(0,0,0,0.7)',
            }}
          >
            <div style={{fontSize: 17, color: C.amber, fontWeight: 800}}>
              CĂN HỘ 50M² CHUẨN
            </div>
            <div
              style={{
                fontSize: 36,
                fontWeight: 900,
                color: C.white,
                marginTop: 2,
              }}
            >
              3,25 <span style={{fontSize: 22, color: C.amber}}>TỶ ĐỒNG</span>
            </div>
            <div style={{fontSize: 15, color: '#CBD5E1', marginTop: 4, fontWeight: 500}}>
              Vốn tự có 30% (~975 triệu đồng)
            </div>
          </div>

          <div
            style={{
              flex: 1,
              background: 'rgba(17, 28, 53, 0.96)',
              border: `2px solid ${C.coral}`,
              borderRadius: 16,
              padding: '14px 18px',
              boxShadow: '0 10px 25px rgba(0,0,0,0.7)',
            }}
          >
            <div style={{fontSize: 17, color: C.coral, fontWeight: 800}}>
              TRẢ GÓP NGÂN HÀNG (20 NĂM)
            </div>
            <div
              style={{
                fontSize: 36,
                fontWeight: 900,
                color: C.white,
                marginTop: 2,
              }}
            >
              28 <span style={{fontSize: 22, color: C.coral}}>TR/THÁNG</span>
            </div>
            <div style={{fontSize: 15, color: '#CBD5E1', marginTop: 4, fontWeight: 500}}>
              Ngốn 56%–64% tổng lương gia đình
            </div>
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
