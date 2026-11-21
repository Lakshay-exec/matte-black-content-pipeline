import React from 'react';
import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { WordTimestamp } from '../types.js';

interface KineticCaptionsProps {
  words: WordTimestamp[];
  aspectRatio: '9:16' | '16:9';
  className?: string;
}

export const KineticCaptions: React.FC<KineticCaptionsProps> = ({
  words,
  aspectRatio,
  className = '',
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const currentTime = frame / fps;

  if (!words || words.length === 0) {
    return null;
  }

  // Find index of current word
  const activeIndex = words.findIndex(
    (w) => currentTime >= w.start && currentTime <= w.end + 0.05
  );

  // Fallback to closest previous word if in a brief pause between words
  const effectiveIndex =
    activeIndex !== -1
      ? activeIndex
      : words.reduce((prev, curr, idx) => (curr.start <= currentTime ? idx : prev), -1);

  if (effectiveIndex === -1) {
    return null;
  }

  // Display a moving chunk of words (3 to 4 words window around current word)
  const windowSize = aspectRatio === '9:16' ? 3 : 5;
  const chunkStart = Math.max(0, Math.min(effectiveIndex - 1, words.length - windowSize));
  const visibleWords = words.slice(chunkStart, chunkStart + windowSize);

  const activeWord = words[effectiveIndex];
  const wordTimeDelta = Math.max(0, currentTime - activeWord.start);
  const wordProgress = Math.min(1, wordTimeDelta / Math.max(0.1, activeWord.end - activeWord.start));

  return (
    <div
      className={className}
      style={{
        position: 'absolute',
        bottom: aspectRatio === '9:16' ? '18%' : '6%',
        left: '5%',
        right: '5%',
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'center',
        gap: aspectRatio === '9:16' ? '10px' : '16px',
        pointerEvents: 'none',
        zIndex: 50,
      }}
    >
      {visibleWords.map((item, idx) => {
        const isCurrent = item.word === activeWord.word && Math.abs(item.start - activeWord.start) < 0.01;
        const isPast = item.end < currentTime;

        return (
          <span
            key={`${item.word}-${item.start}-${idx}`}
            style={{
              fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
              fontWeight: isCurrent ? 900 : 700,
              fontSize: aspectRatio === '9:16' ? '42px' : '48px',
              letterSpacing: '-0.04em',
              textTransform: 'uppercase',
              color: isCurrent ? '#FFFFFF' : isPast ? '#A3A3A3' : '#D4D4D4',
              backgroundColor: isCurrent ? '#000000' : 'transparent',
              padding: isCurrent ? '4px 14px' : '4px 4px',
              borderRadius: isCurrent ? '6px' : '0px',
              transform: isCurrent
                ? `scale(${1 + 0.08 * Math.sin(wordProgress * Math.PI)})`
                : 'scale(1)',
              transition: 'all 0.08s ease-out',
              display: 'inline-block',
              lineHeight: 1.15,
              boxShadow: isCurrent ? '0 4px 14px rgba(0, 0, 0, 0.25)' : 'none',
            }}
          >
            {item.word}
          </span>
        );
      })}
    </div>
  );
};
