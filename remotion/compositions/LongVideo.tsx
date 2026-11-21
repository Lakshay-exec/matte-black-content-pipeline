import React from 'react';
import { Audio, Sequence, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import { KineticCaptions } from '../components/KineticCaptions.js';
import { InfoCard } from '../components/InfoCard.js';
import { StatueStage } from '../components/StatueStage.js';
import { VideoScriptData } from '../types.js';

export const LongVideo: React.FC<VideoScriptData> = ({
  headline,
  category,
  beats,
  words,
  audioFile,
  chapters,
}) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const currentTime = frame / fps;

  // Global progress
  const progress = Math.min(1, frame / durationInFrames);

  // Audio source resolution
  const audioSrc = audioFile ? (audioFile.startsWith('http') ? audioFile : staticFile(audioFile)) : undefined;

  // Determine current active chapter
  const currentChapter = chapters && chapters.length > 0
    ? [...chapters].reverse().find((c) => currentTime >= c.startTime) || chapters[0]
    : undefined;

  return (
    <div
      style={{
        position: 'relative',
        width: 1920,
        height: 1080,
        backgroundColor: '#FFFFFF',
        overflow: 'hidden',
        color: '#000000',
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      }}
    >
      {/* Top Global Progress Bar */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '6px',
          backgroundColor: '#EEEEEE',
          zIndex: 100,
        }}
      >
        <div
          style={{
            height: '100%',
            width: `${progress * 100}%`,
            backgroundColor: '#000000',
          }}
        />
      </div>

      {/* Top Header Bar */}
      <header
        style={{
          position: 'absolute',
          top: '28px',
          left: '60px',
          right: '60px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '2px solid #000000',
          paddingBottom: '16px',
          zIndex: 80,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div
            style={{
              backgroundColor: '#000000',
              color: '#FFFFFF',
              fontSize: '14px',
              fontWeight: 800,
              padding: '4px 12px',
              borderRadius: '4px',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
            }}
          >
            {category || 'SPECIAL REPORT'}
          </div>
          <span
            style={{
              fontSize: '20px',
              fontWeight: 900,
              letterSpacing: '-0.02em',
              color: '#000000',
            }}
          >
            {headline}
          </span>
        </div>

        {currentChapter && (
          <div
            style={{
              fontSize: '15px',
              fontWeight: 700,
              color: '#525252',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}
          >
            CHAPTER: {currentChapter.title}
          </div>
        )}
      </header>

      {/* Main Split Screen Container */}
      <div
        style={{
          position: 'absolute',
          top: '90px',
          bottom: '120px',
          left: '60px',
          right: '60px',
          display: 'flex',
          gap: '40px',
        }}
      >
        {/* Left Side: Mannequin Visual Stage */}
        <div
          style={{
            flex: '0 0 50%',
            position: 'relative',
            height: '100%',
            border: '2px solid #000000',
            borderRadius: '16px',
            overflow: 'hidden',
            backgroundColor: '#FFFFFF',
          }}
        >
          {beats && beats.map((beat) => {
            const beatStartFrame = Math.round(beat.startTime * fps);
            const beatDurationFrames = Math.max(1, Math.round(beat.duration * fps));
            const statueSrc = beat.statueImage.startsWith('http')
              ? beat.statueImage
              : staticFile(beat.statueImage);

            return (
              <Sequence
                key={beat.id}
                from={beatStartFrame}
                durationInFrames={beatDurationFrames}
              >
                <StatueStage
                  imageSrc={statueSrc}
                  cameraMovement={beat.cameraMovement}
                  aspectRatio="16:9"
                />
              </Sequence>
            );
          })}
        </div>

        {/* Right Side: Dynamic Data & Info Presentation Stage */}
        <div
          style={{
            flex: '0 0 calc(50% - 40px)',
            position: 'relative',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
          }}
        >
          {beats && beats.map((beat) => {
            const beatStartFrame = Math.round(beat.startTime * fps);
            const beatDurationFrames = Math.max(1, Math.round(beat.duration * fps));

            if (!beat.infoCard) return null;

            return (
              <Sequence
                key={`info-${beat.id}`}
                from={beatStartFrame}
                durationInFrames={beatDurationFrames}
              >
                <div style={{ position: 'relative', width: '100%', height: '100%' }}>
                  <InfoCard
                    card={beat.infoCard}
                    aspectRatio="16:9"
                    startFrame={5}
                    durationInFrames={beatDurationFrames - 5}
                  />
                </div>
              </Sequence>
            );
          })}
        </div>
      </div>

      {/* Bottom Subtitle / Kinetic Caption Bar */}
      <footer
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: '110px',
          backgroundColor: '#FAFAFA',
          borderTop: '2px solid #E5E5E5',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 90,
        }}
      >
        <KineticCaptions words={words} aspectRatio="16:9" />
      </footer>

      {/* Audio Element */}
      {audioSrc && <Audio src={audioSrc} />}
    </div>
  );
};
