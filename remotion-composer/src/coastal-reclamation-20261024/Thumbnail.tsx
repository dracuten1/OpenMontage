import React from 'react';
import { AbsoluteFill, Img, staticFile } from 'remotion';

export const CoastalReclamationThumbnail: React.FC = () => {
  return (
    <AbsoluteFill
      style={{
        backgroundColor: '#0a192f',
        width: 1080,
        height: 1920,
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
        overflow: 'hidden',
        color: '#ffffff',
      }}
    >
      {/* ── Background AI Artwork Layer ── */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
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
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '800px',
          background:
            'linear-gradient(180deg, rgba(10,25,47,0.95) 0%, rgba(10,25,47,0.82) 55%, rgba(10,25,47,0) 100%)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: '800px',
          background:
            'linear-gradient(0deg, rgba(10,25,47,0.96) 0%, rgba(10,25,47,0.85) 55%, rgba(10,25,47,0) 100%)',
        }}
      />

      {/* ── Top Disclaimer Tag ── */}
      <div
        style={{
          position: 'absolute',
          top: '80px',
          left: '50%',
          transform: 'translateX(-50%)',
          padding: '12px 28px',
          borderRadius: '24px',
          backgroundColor: 'rgba(10, 25, 47, 0.90)',
          border: '1.5px solid rgba(0, 245, 212, 0.7)',
          boxShadow: '0 6px 20px rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
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
            letterSpacing: '1.5px',
            color: '#00f5d4',
            fontFamily: 'monospace',
            whiteSpace: 'nowrap',
          }}
        >
          [ HÌNH MINH HỌA / SƠ ĐỒ NGUYÊN LÝ ]
        </span>
      </div>

      {/* ── Main Headline Card ── */}
      <div
        style={{
          position: 'absolute',
          top: '250px',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '960px',
          padding: '40px 36px',
          borderRadius: '32px',
          backgroundColor: 'rgba(10, 25, 47, 0.92)',
          border: '2px solid rgba(0, 180, 216, 0.5)',
          boxShadow: '0 16px 50px rgba(0, 0, 0, 0.7)',
          textAlign: 'center',
        }}
      >
        {/* Kicker badge */}
        <div
          style={{
            display: 'inline-block',
            padding: '10px 24px',
            borderRadius: '16px',
            backgroundColor: '#e9c46a',
            color: '#0a192f',
            fontSize: '28px',
            fontWeight: 800,
            letterSpacing: '1px',
            marginBottom: '20px',
          }}
        >
          KHOA HỌC THỦY ĐỘNG LỰC
        </div>

        {/* H1 Title */}
        <div
          style={{
            fontSize: '92px',
            fontWeight: 900,
            color: '#00f5d4',
            letterSpacing: '3px',
            lineHeight: 1.1,
            marginBottom: '14px',
            textShadow: '0 4px 20px rgba(0,245,212,0.4)',
          }}
        >
          LẤN BIỂN
        </div>

        {/* Subtitle lines */}
        <div
          style={{
            fontSize: '62px',
            fontWeight: 800,
            color: '#ffffff',
            lineHeight: 1.25,
            marginBottom: '10px',
          }}
        >
          DÒNG HẢI LƯU &amp;
        </div>
        <div
          style={{
            fontSize: '66px',
            fontWeight: 800,
            color: '#52b788',
            lineHeight: 1.25,
            marginBottom: '20px',
            textShadow: '0 2px 16px rgba(82,183,136,0.6)',
          }}
        >
          RỪNG NGẬP MẶN
        </div>

        <div
          style={{
            fontSize: '44px',
            fontWeight: 700,
            color: '#e9c46a',
          }}
        >
          Sẽ thay đổi ra sao?
        </div>
      </div>

      {/* ── Lower 3-Mechanism Card (Bottom Safe Area) ── */}
      <div
        style={{
          position: 'absolute',
          bottom: '120px',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '960px',
          padding: '36px 40px',
          borderRadius: '30px',
          backgroundColor: 'rgba(10, 25, 47, 0.94)',
          border: '2px solid rgba(42, 157, 143, 0.7)',
          boxShadow: '0 16px 50px rgba(0, 0, 0, 0.7)',
        }}
      >
        <div
          style={{
            fontSize: '32px',
            fontWeight: 800,
            color: '#e9c46a',
            letterSpacing: '2px',
            marginBottom: '18px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
          }}
        >
          <span style={{ fontSize: '36px' }}>⚡</span> 3 CƠ CHẾ NẮN DÒNG &amp; BỒI XÓI:
        </div>
        <div
          style={{
            fontSize: '28px',
            color: '#e0e1dd',
            lineHeight: 1.5,
            display: 'flex',
            flexDirection: 'column',
            gap: '14px',
          }}
        >
          <div>
            <strong style={{ color: '#00f5d4' }}>1. Lăng kính triều:</strong>{' '}
            Thu hẹp diện tích ngập triều làm biến đổi lưu tốc (Wilson et al., 2017).
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
        <div
          style={{
            marginTop: '20px',
            paddingTop: '16px',
            borderTop: '1px solid rgba(255,255,255,0.15)',
            fontSize: '22px',
            color: '#90e0ef',
            fontFamily: 'monospace',
          }}
        >
          Nguồn khoa học: Nature Earth &amp; Env (2022) • USGS (2003) • Frontiers (2025)
        </div>
      </div>
    </AbsoluteFill>
  );
};
