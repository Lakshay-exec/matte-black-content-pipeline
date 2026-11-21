import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import Parser from 'rss-parser';
import axios from 'axios';
import { ContentIdea, HistoryRecord } from '../remotion/types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const HISTORY_PATH = path.join(ROOT_DIR, 'data', 'history.json');
const TEMP_DIR = path.join(ROOT_DIR, 'temp');
const OUTPUT_FILE = path.join(TEMP_DIR, 'current_idea.json');

// Curated list of high-quality RSS feeds for viral tech, AI, science, and market shifts
const RSS_FEEDS = [
  'https://techcrunch.com/feed/',
  'https://hnrss.org/frontpage',
  'https://news.ycombinator.com/rss',
  'https://www.theverge.com/rss/index.xml',
  'https://feeds.arstechnica.com/arstechnica/index',
];

// Fallback high-impact topics if network feeds are offline or rate-limited
const FALLBACK_TOPICS: Omit<ContentIdea, 'id' | 'fetchedAt'>[] = [
  {
    title: 'The Rise of Sovereign AI Clusters',
    summary: 'Nations and private enterprises are abandoning centralized cloud models to build localized, sovereign AI clusters for maximum autonomy and data security.',
    source: 'Curated Intelligence',
    category: 'ARTIFICIAL INTELLIGENCE',
    tags: ['AI', 'Infrastructure', 'Compute', 'Geopolitics'],
  },
  {
    title: 'Zero-Click Operating Systems and Agentic Web',
    summary: 'Web browsers and OS interfaces are migrating from manual point-and-click interaction to autonomous background agents executing end-to-end task flows.',
    source: 'Curated Intelligence',
    category: 'COMPUTING',
    tags: ['Agents', 'Automation', 'UX', 'Future'],
  },
  {
    title: 'Synthetic Data Scaling and Post-Training Dynasties',
    summary: 'As public human data hits exhaustion limits, top frontier labs rely on synthetic environments and verifiable reasoning chains to train next-gen models.',
    source: 'Curated Intelligence',
    category: 'MACHINE LEARNING',
    tags: ['SyntheticData', 'Reasoning', 'FrontierModels'],
  },
  {
    title: 'Quantum Advantage in Room-Temperature Materials',
    summary: 'Recent breakthroughs in quantum algorithmic simulations are discovering novel molecular structures without costly physical laboratory trial-and-error.',
    source: 'Curated Intelligence',
    category: 'QUANTUM SCIENCE',
    tags: ['Quantum', 'Materials', 'Simulation'],
  },
];

function normalizeString(str: string): string {
  return str.toLowerCase().replace(/[^a-z0-9]/g, '');
}

function isDuplicate(title: string, history: HistoryRecord[]): boolean {
  const norm = normalizeString(title);
  return history.some((h) => {
    const historyNorm = normalizeString(h.title);
    return historyNorm.includes(norm) || norm.includes(historyNorm);
  });
}

export async function fetchIdea(customTopic?: string): Promise<ContentIdea> {
  if (!fs.existsSync(TEMP_DIR)) {
    fs.mkdirSync(TEMP_DIR, { recursive: true });
  }

  let history: HistoryRecord[] = [];
  if (fs.existsSync(HISTORY_PATH)) {
    try {
      history = JSON.parse(fs.readFileSync(HISTORY_PATH, 'utf-8'));
    } catch {
      history = [];
    }
  }

  // If user passed a custom topic flag
  if (customTopic && customTopic.trim().length > 0) {
    console.log(`[Step 1] Using custom topic provided by user: "${customTopic}"`);
    const customIdea: ContentIdea = {
      id: `custom-${Date.now()}`,
      title: customTopic.trim(),
      summary: `In-depth analysis and strategic breakdown of ${customTopic.trim()}.`,
      source: 'User Prompt',
      category: 'SPECIAL INTELLIGENCE',
      tags: ['Featured', 'SpecialReport'],
      fetchedAt: new Date().toISOString(),
    };
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(customIdea, null, 2));
    return customIdea;
  }

  console.log('[Step 1] Scanning RSS & trending sources...');
  const parser = new Parser({ timeout: 7000 });
  const candidateIdeas: ContentIdea[] = [];

  for (const feedUrl of RSS_FEEDS) {
    try {
      const feed = await parser.parseURL(feedUrl);
      if (feed && feed.items) {
        for (const item of feed.items.slice(0, 8)) {
          if (!item.title) continue;
          if (isDuplicate(item.title, history)) continue;

          candidateIdeas.push({
            id: `idea-${Buffer.from(item.title).toString('base64url').slice(0, 16)}`,
            title: item.title.trim(),
            summary: item.contentSnippet ? item.contentSnippet.slice(0, 280) : item.title,
            source: feed.title || feedUrl,
            url: item.link,
            category: 'TRENDING INTEL',
            tags: ['Trending', 'Breaking'],
            fetchedAt: new Date().toISOString(),
          });
        }
      }
    } catch (err: any) {
      console.warn(`[Step 1] Warning: Failed to fetch feed ${feedUrl}: ${err.message}`);
    }
  }

  let selectedIdea: ContentIdea | null = null;

  if (candidateIdeas.length > 0) {
    selectedIdea = candidateIdeas[0];
    console.log(`[Step 1] Selected trending RSS idea: "${selectedIdea.title}"`);
  } else {
    console.log('[Step 1] No new RSS ideas found or feeds unreachable. Selecting from curated pool...');
    const unusedFallback = FALLBACK_TOPICS.find((t) => !isDuplicate(t.title, history));
    const fallback = unusedFallback || FALLBACK_TOPICS[Math.floor(Math.random() * FALLBACK_TOPICS.length)];

    selectedIdea = {
      ...fallback,
      id: `curated-${Date.now()}`,
      fetchedAt: new Date().toISOString(),
    };
    console.log(`[Step 1] Selected curated idea: "${selectedIdea.title}"`);
  }

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(selectedIdea, null, 2));
  console.log(`[Step 1] Output written to ${OUTPUT_FILE}`);
  return selectedIdea;
}

// Direct execution support
if (import.meta.url === `file://${process.argv[1]}`) {
  const customArg = process.argv.find((arg) => arg.startsWith('--topic='))?.split('=')[1];
  fetchIdea(customArg).catch((err) => {
    console.error('[Step 1] Fatal error:', err);
    process.exit(1);
  });
}
