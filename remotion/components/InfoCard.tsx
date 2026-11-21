import React from 'react';
import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { InfoCardData } from '../types.js';

interface InfoCardProps {
  card: InfoCardData;
  aspectRatio: '9:16' | '16:9';
  startFrame?: number;
  durationInFrames?: number;
}

export const InfoCard: React.FC<InfoCardProps> = ({
  card,
  aspectRatio,
  startFrame = 0,
  durationInFrames = 90,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const relFrame = Math.max(0, frame - startFrame);

  // Spring entrance
  const entrance = spring({
    frame: relFrame,
    fps,
    config: {
      damping: 15,
      stiffness: 110,
      mass: 0.7,
    },
  });

  // Fade and slide out in the last 15 frames
  const exitFrames = 15;
  const exitProgress = interpolate(
    relFrame,
    [durationInFrames - exitFrames, durationInFrames],
    [0, 1],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  const translateY = interpolate(entrance, [0, 1], [40, 0]) + exitProgress * -30;
  const opacity = interpolate(entrance, [0, 1], [0, 1]) * (1 - exitProgress);
  const scale = interpolate(entrance, [0, 1], [0.92, 1]);

  if (opacity <= 0.01) {
    return null;
  }

  const isVertical = aspectRatio === '9:16';

  return (
    <div
      style={{
        position: 'absolute',
        top: isVertical ? '14%' : '18%',
        right: isVertical ? '8%' : '6%',
        width: isVertical ? '84%' : '440px',
        backgroundColor: '#FFFFFF',
        border: '3px solid #000000',
        borderRadius: '12px',
        padding: isVertical ? '22px 24px' : '26px 28px',
        boxShadow: '8px 8px 0px #000000',
        transform: `translateY(${translateY}px) scale(${scale})`,
        opacity,
        zIndex: 40,
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      }}
    >
      {/* Optional Badge */}
      {card.badge && (
        <div
          style={{
            display: 'inline-block',
            backgroundColor: '#000000',
            color: '#FFFFFF',
            fontSize: '12px',
            fontWeight: 800,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            padding: '3px 10px',
            borderRadius: '4px',
            marginBottom: '10px',
          }}
        >
          {card.badge}
        </div>
      )}

      {/* Main Metric / Big Number */}
      {card.metric && (
        <div style={{ marginBottom: '8px' }}>
          <div
            style={{
              fontSize: isVertical ? '54px' : '62px',
              fontWeight: 900,
              lineHeight: 1,
              letterSpacing: '-0.05em',
              color: '#000000',
            }}
          >
            {card.metric}
          </div>
          {card.metricLabel && (
            <div
              style={{
                fontSize: '14px',
                fontWeight: 600,
                color: '#525252',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
                marginTop: '4px',
              }}
            >
              {card.metricLabel}
            </div>
          )}
        </div>
      )}

      {/* Card Title */}
      <h3
        style={{
          margin: 0,
          fontSize: isVertical ? '22px' : '24px',
          fontWeight: 800,
          lineHeight: 1.25,
          color: '#000000',
          letterSpacing: '-0.02em',
        }}
      >
        {card.title}
      </h3>

      {/* Card Subtitle */}
      {card.subtitle && (
        <p
          style={{
            margin: '8px 0 0 0',
            fontSize: isVertical ? '15px' : '16px',
            fontWeight: 500,
            lineHeight: 1.4,
            color: '#404040',
          }}
        >
          {card.subtitle}
        </p>
      )}

      {/* Bullet Points */}
      {card.bulletPoints && card.bulletPoints.length > 0 && (
        <ul
          style={{
            margin: '14px 0 0 0',
            paddingLeft: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
          }}
        >
          {card.bulletPoints.map((point, idx) => (
            <li
              key={idx}
              style={{
                fontSize: isVertical ? '14px' : '15px',
                fontWeight: 600,
                color: '#171717',
                lineHeight: 1.35,
              }}
            >
              {point}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
