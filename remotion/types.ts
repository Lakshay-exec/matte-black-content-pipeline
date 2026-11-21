export interface WordTimestamp {
  word: string;
  start: number; // in seconds
  end: number;   // in seconds
}

export type InfoCardType = 'statistic' | 'takeaway' | 'quote' | 'alert' | 'metric';

export interface InfoCardData {
  type: InfoCardType;
  title: string;
  subtitle?: string;
  metric?: string;
  metricLabel?: string;
  bulletPoints?: string[];
  badge?: string;
}

export type CameraMovement = 'zoom-in' | 'zoom-out' | 'pan-left' | 'pan-right' | 'subtle-float' | 'dramatic-push';

export interface SceneBeat {
  id: string;
  beatIndex: number;
  startTime: number;     // in seconds
  duration: number;      // in seconds
  text: string;          // Narration segment text
  statuePrompt: string;  // Detailed prompt describing mannequin pose/angle
  statueImage: string;   // Local relative path or URL (e.g. temp/images/beat_0.png)
  cameraMovement: CameraMovement;
  infoCard?: InfoCardData;
}

export interface VideoScriptData {
  topicId: string;
  topicTitle: string;
  category: string;
  headline: string;
  hook: string;
  targetFormat: 'short' | 'long';
  beats: SceneBeat[];
  words: WordTimestamp[];
  audioFile: string;     // Local path (e.g. temp/voiceover.mp3)
  totalDuration: number; // in seconds
  fps: number;
  chapters?: {
    title: string;
    startTime: number;
  }[];
}

export interface ContentIdea {
  id: string;
  title: string;
  summary: string;
  source: string;
  url?: string;
  category: string;
  tags: string[];
  fetchedAt: string;
}

export interface HistoryRecord {
  id: string;
  title: string;
  category: string;
  publishedAt: string;
  youtubeLongId?: string;
  youtubeLongUrl?: string;
  youtubeShortId?: string;
  youtubeShortUrl?: string;
  instagramPostId?: string;
  instagramMediaUrl?: string;
}
