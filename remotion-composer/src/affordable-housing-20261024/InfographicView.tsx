import React from 'react';
import {interpolate, spring, useCurrentFrame} from 'remotion';
import {INFOGRAPHICS, InfographicId} from './infographics_data';
import {FPS} from './timing';

export interface InfographicViewProps {
  id: InfographicId;
  at?: number;
  scale?: number;
  width?: number | string;
  style?: React.CSSProperties;
  glowColor?: string;
}

export const InfographicView: React.FC<InfographicViewProps> = ({
  id,
  at = 0,
  scale = 1,
  width = '100%',
  style,
  glowColor,
}) => {
  const frame = useCurrentFrame();
  const enterSpring = spring({
    frame: frame - at,
    fps: FPS,
    config: {damping: 15, stiffness: 120, mass: 0.8},
  });

  const opacity = interpolate(frame - at, [0, 8], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const currentScale = scale * (0.92 + 0.08 * enterSpring);
  const translateY = 18 * (1 - enterSpring);

  const svgHtml = INFOGRAPHICS[id];

  return (
    <div
      style={{
        width,
        opacity,
        transform: `translateY(${translateY}px) scale(${currentScale})`,
        transformOrigin: 'center center',
        filter: glowColor
          ? `drop-shadow(0 8px 32px ${glowColor}40)`
          : 'drop-shadow(0 12px 36px rgba(0,0,0,0.65))',
        ...style,
      }}
      dangerouslySetInnerHTML={{__html: svgHtml}}
    />
  );
};
