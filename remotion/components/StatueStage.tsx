import React from 'react';
import { Img, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { CameraMovement } from '../types';

interface StatueStageProps {
  imageSrc: string;
  cameraMovement?: CameraMovement;
  aspectRatio: '9:16' | '16:9';
  alt?: string;
  className?: string;
}

export const StatueStage: React.FC<StatueStageProps> = ({
  imageSrc,
  cameraMovement = 'zoom-in',
  aspectRatio,
  alt = 'Matte-black mannequin statue',
  className = '',
}) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  // Entrance spring animation
  const entrance = spring({
    frame,
    fps,
    config: {
      damping: 18,
      stiffness: 80,
      mass: 0.8,
    },
  });

  // Calculate dynamic camera movement across the duration of the beat
  const progress = frame / Math.max(1, durationInFrames);

  let scale = 1;
  let translateX = 0;
  let translateY = 0;
  let rotate = 0;

  switch (cameraMovement) {
    case 'zoom-in':
      scale = interpolate(progress, [0, 1], [1.0, 1.12], { extrapolateRight: 'clamp' });
      translateY = interpolate(progress, [0, 1], [0, -15]);
      break;
    case 'zoom-out':
      scale = interpolate(progress, [0, 1], [1.14, 1.0], { extrapolateRight: 'clamp' });
      translateY = interpolate(progress, [0, 1], [-15, 0]);
      break;
    case 'pan-left':
      translateX = interpolate(progress, [0, 1], [25, -25]);
      scale = 1.05;
      break;
    case 'pan-right':
      translateX = interpolate(progress, [0, 1], [-25, 25]);
      scale = 1.05;
      break;
    case 'dramatic-push':
      scale = interpolate(progress, [0, 1], [1.0, 1.25], { extrapolateRight: 'clamp' });
      translateY = interpolate(progress, [0, 1], [10, -35]);
      break;
    case 'subtle-float':
    default:
      // Sinusoidal subtle floating
      const floatCycle = Math.sin((frame / fps) * 1.5);
      translateY = floatCycle * 8;
      rotate = floatCycle * 0.4;
      scale = 1.02;
      break;
  }

  const baseOpacity = interpolate(entrance, [0, 0.4, 1], [0, 0.8, 1]);

  return (
    <div
      className={className}
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#FFFFFF',
        overflow: 'hidden',
      }}
    >
      {/* Subtle monochrome ambient backlight circle */}
      <div
        style={{
          position: 'absolute',
          width: aspectRatio === '9:16' ? '650px' : '520px',
          height: aspectRatio === '9:16' ? '650px' : '520px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(0,0,0,0.035) 0%, rgba(0,0,0,0.01) 50%, rgba(255,255,255,0) 75%)',
          pointerEvents: 'none',
        }}
      />

      {/* Main Mannequin Image Layer with mix-blend-mode: multiply */}
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transform: `translate(${translateX}px, ${translateY}px) scale(${scale * (0.95 + 0.05 * entrance)}) rotate(${rotate}deg)`,
          opacity: baseOpacity,
          transformOrigin: 'center 60%',
        }}
      >
        <Img
          src={imageSrc}
          alt={alt}
          style={{
            maxWidth: aspectRatio === '9:16' ? '88%' : '75%',
            maxHeight: aspectRatio === '9:16' ? '85%' : '88%',
            objectFit: 'contain',
            // CRITICAL: Multiply blend mode eliminates slight off-white bounding artifacts seamlessly
            mixBlendMode: 'multiply',
            filter: 'contrast(1.08) brightness(0.98)',
          }}
        />
      </div>

      {/* Ground soft shadow reflection illusion */}
      <div
        style={{
          position: 'absolute',
          bottom: aspectRatio === '9:16' ? '12%' : '8%',
          width: aspectRatio === '9:16' ? '320px' : '260px',
          height: '24px',
          borderRadius: '50%',
          background: 'radial-gradient(ellipse, rgba(0,0,0,0.18) 0%, rgba(0,0,0,0.05) 55%, transparent 75%)',
          transform: `scaleX(${interpolate(scale, [1, 1.25], [1, 1.1])})`,
          opacity: 0.85 * baseOpacity,
          pointerEvents: 'none',
        }}
      />
    </div>
  );
};
