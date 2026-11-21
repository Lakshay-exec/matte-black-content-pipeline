import React from 'react';
import { Audio, Sequence, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import { KineticCaptions } from '../components/KineticCaptions.js';
import { InfoCard } from '../components/InfoCard.js';
import { StatueStage } from '../components/StatueStage.js';
import { VideoScriptData } from '../types.js';

export const ShortVideo: React.FC<VideoScriptData> = ({
  headline,
  category,
  beats,
  words,
  audioFile,
}) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  // Progress bar ratio (0 to 1)
  const progress = Math.min(1, frame / durationInFrames);

  // Audio source resolution (support staticFile or relative path)
  const audioSrc = audioFile ? (audioFile.startsWith('http') ? audioFile : staticFile(audioFile)) : undefined;

  return (
    <div
      style={{
        position: 'relative',
        width: 1080,
        height: 1920,
        backgroundColor: '#FFFFFF',
        overflow: 'hidden',
        color: '#000000',
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      }}
    >
      {/* Top Animated Progress Bar */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '8px',
          backgroundColor: '#E5E5E5',
          zIndex: 100,
        }}
      >
        <div
          style={{
            height: '100%',
            width: `${progress * 100}%`,
            backgroundColor: '#000000',
            transition: 'width 0.05s linear',
          }}
        />
      </div>

      {/* Top Header Pill */}
      <div
        style={{
          position: 'absolute',
          top: '36px',
          left: '48px',
          right: '48px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          zIndex: 80,
        }}
      >
        <div
          style={{
            backgroundColor: '#000000',
            color: '#FFFFFF',
            padding: '8px 18px',
            borderRadius: '999px',
            fontSize: '18px',
            fontWeight: 800,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
          }}
        >
          {category || 'REPORT'}
        </div>

        <div
          style={{
            fontSize: '16px',
            fontWeight: 700,
            color: '#737373',
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
          }}
        >
          #DAILY_INTEL
        </div>
      </div>

      {/* Headline banner */}
      <div
        style={{
          position: 'absolute',
          top: '90px',
          left: '48px',
          right: '48px',
          zIndex: 70,
        }}
      >
        <h1
          style={{
            margin: 0,
            fontSize: '38px',
            fontWeight: 900,
            lineHeight: 1.15,
            letterSpacing: '-0.03em',
            color: '#000000',
          }}
        >
          {headline}
        </h1>
      </div>

      {/* Scene Beats Sequence */}
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
            name={`Beat ${beat.beatIndex + 1}`}
          >
            {/* Mannequin Stage */}
            <StatueStage
              imageSrc={statueSrc}
              cameraMovement={beat.cameraMovement}
              aspectRatio="9:16"
            />

            {/* Optional Floating InfoCard */}
            {beat.infoCard && (
              <InfoCard
                card={beat.infoCard}
                aspectRatio="9:16"
                startFrame={10}
                durationInFrames={beatDurationFrames - 10}
              />
            )}
          </Sequence>
        );
      })}

      {/* High-Impact Word-by-Word Kinetic Captions */}
      <KineticCaptions words={words} aspectRatio="9:16" />

      {/* Audio Playback */}
      {audioSrc && <Audio src={audioSrc} />}
    </div>
  );
};
