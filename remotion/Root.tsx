import React from 'react';
import { Composition } from 'remotion';
import { ShortVideo } from './compositions/ShortVideo';
import { LongVideo } from './compositions/LongVideo';
import { VideoScriptData } from './types';

// Default mock props for local development and Studio preview
const defaultMockData: VideoScriptData = {
  topicId: 'demo-topic-001',
  topicTitle: 'The Shift Towards Minimalist Agent Architectures',
  category: 'TECHNOLOGY',
  headline: 'Why Autonomous Pipelines Are Winning',
  hook: 'The internet is quietly changing how digital content is engineered.',
  targetFormat: 'short',
  fps: 30,
  totalDuration: 12,
  audioFile: 'voiceover.mp3',
  words: [
    { word: 'The', start: 0.1, end: 0.35 },
    { word: 'future', start: 0.36, end: 0.8 },
    { word: 'of', start: 0.82, end: 0.98 },
    { word: 'content', start: 1.0, end: 1.45 },
    { word: 'is', start: 1.46, end: 1.65 },
    { word: 'not', start: 1.66, end: 1.95 },
    { word: 'more', start: 1.96, end: 2.25 },
    { word: 'noise.', start: 2.26, end: 2.85 },
    { word: 'It', start: 3.1, end: 3.3 },
    { word: 'is', start: 3.31, end: 3.5 },
    { word: 'pure,', start: 3.52, end: 3.9 },
    { word: 'unfiltered', start: 3.92, end: 4.6 },
    { word: 'signal.', start: 4.62, end: 5.2 },
    { word: 'Autonomous', start: 5.5, end: 6.2 },
    { word: 'agents', start: 6.22, end: 6.6 },
    { word: 'now', start: 6.62, end: 6.9 },
    { word: 'render,', start: 6.92, end: 7.4 },
    { word: 'curate,', start: 7.45, end: 7.95 },
    { word: 'and', start: 7.98, end: 8.15 },
    { word: 'distribute.', start: 8.18, end: 9.1 },
    { word: 'Are', start: 9.4, end: 9.6 },
    { word: 'you', start: 9.62, end: 9.85 },
    { word: 'ready?', start: 9.88, end: 10.8 },
  ],
  beats: [
    {
      id: 'beat-1',
      beatIndex: 0,
      startTime: 0,
      duration: 3,
      text: 'The future of content is not more noise.',
      statuePrompt: 'Matte black mannequin statue standing upright in contemplation on pure white background',
      statueImage: 'reference_statue.png',
      cameraMovement: 'zoom-in',
      infoCard: {
        type: 'takeaway',
        title: 'Signal Over Noise',
        badge: 'PARADIGM SHIFT',
        subtitle: 'Content saturation has reached critical inflection.',
      },
    },
    {
      id: 'beat-2',
      beatIndex: 1,
      startTime: 3,
      duration: 2.5,
      text: 'It is pure, unfiltered signal.',
      statuePrompt: 'Matte black mannequin statue head tilted slightly in sharp high contrast lighting',
      statueImage: 'reference_statue.png',
      cameraMovement: 'subtle-float',
      infoCard: {
        type: 'metric',
        title: 'Retention Multiplier',
        metric: '94.2%',
        metricLabel: 'Audience focus metric',
        badge: 'BENCHMARK',
      },
    },
    {
      id: 'beat-3',
      beatIndex: 2,
      startTime: 5.5,
      duration: 3.6,
      text: 'Autonomous agents now render, curate, and distribute.',
      statuePrompt: 'Matte black mannequin statue gesturing forward with hand outstretched in authority',
      statueImage: 'reference_statue.png',
      cameraMovement: 'pan-right',
      infoCard: {
        type: 'takeaway',
        title: 'Full Pipeline Automation',
        bulletPoints: [
          'Zero manual video editing',
          'Automated trend ingestion',
          'Direct social syndication',
        ],
        badge: 'PIPELINE',
      },
    },
    {
      id: 'beat-4',
      beatIndex: 3,
      startTime: 9.1,
      duration: 2.9,
      text: 'Are you ready?',
      statuePrompt: 'Matte black mannequin statue front facing silhouette pure white stark background',
      statueImage: 'reference_statue.png',
      cameraMovement: 'dramatic-push',
      infoCard: {
        type: 'alert',
        title: 'The Next Wave',
        subtitle: 'Subscribe for daily automated intelligence.',
        badge: 'ACT NOW',
      },
    },
  ],
  chapters: [
    { title: 'The Saturation Crisis', startTime: 0 },
    { title: 'Unfiltered Signal', startTime: 3 },
    { title: 'Autonomous Execution', startTime: 5.5 },
    { title: 'The Mandate', startTime: 9.1 },
  ],
};

export const RemotionRoot: React.FC = () => {
  return (
    <>
      {/* Short Form Video (9:16 Vertical) - 1080x1920 */}
      <Composition
        id="ShortVideo"
        component={ShortVideo}
        durationInFrames={Math.round(defaultMockData.totalDuration * defaultMockData.fps)}
        fps={defaultMockData.fps}
        width={1080}
        height={1920}
        defaultProps={defaultMockData}
      />

      {/* Long Form Video (16:9 Horizontal) - 1920x1080 */}
      <Composition
        id="LongVideo"
        component={LongVideo}
        durationInFrames={Math.round(defaultMockData.totalDuration * defaultMockData.fps)}
        fps={defaultMockData.fps}
        width={1920}
        height={1080}
        defaultProps={defaultMockData}
      />
    </>
  );
};

export default RemotionRoot;
