import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import axios from 'axios';
import { ContentIdea, VideoScriptData } from '../remotion/types.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const TEMP_DIR = path.join(ROOT_DIR, 'temp');
const IDEA_FILE = path.join(TEMP_DIR, 'current_idea.json');
const OUTPUT_FILE = path.join(TEMP_DIR, 'script.json');

const SYSTEM_PROMPT = `
You are the lead content architect and creative director for an ultra-high-retention digital media channel.
Visual Aesthetic:
- Stark black-and-white minimalism, inspired by luxury brutalism, scientific papers, and Apple design.
- The star anchor is a matte-black mannequin statue with a featureless, blank oval face, isolated on a pure #FFFFFF white background.
- Tone: Crisp, authoritative, cerebral, fast-paced, high intellectual signal, zero corporate fluff.

You must generate a structured JSON script matching the requested format.
Ensure that:
1. The hook immediately stops scrolling within the first 2 seconds.
2. The beats flow logically with high tension and payoff.
3. Each beat contains:
   - "text": The spoken narration line.
   - "statuePrompt": Exact description of the matte-black blank-oval mannequin statue's posture, angle, or gesture (e.g., "A minimalist matte-black mannequin statue with smooth blank oval face, standing with hands clasped behind back in deep contemplation, isolated on pure #FFFFFF white background, studio lighting, hyper-realistic, 8k").
   - "cameraMovement": One of 'zoom-in', 'zoom-out', 'pan-left', 'pan-right', 'subtle-float', 'dramatic-push'.
   - "infoCard": A minimalist floating graphic card (optional per beat, but at least 2 beats should have one) with a badge, title, and either a metric, subtitle, or 2-3 bullet points.
`;

function generateMockScript(idea: ContentIdea, targetFormat: 'short' | 'long'): VideoScriptData {
  const isShort = targetFormat === 'short';
  return {
    topicId: idea.id,
    topicTitle: idea.title,
    category: idea.category || 'ANALYSIS',
    headline: idea.title.length > 50 ? `${idea.title.slice(0, 47)}...` : idea.title,
    hook: `Most people misunderstand what is happening with ${idea.title}.`,
    targetFormat,
    fps: 30,
    totalDuration: isShort ? 28 : 65,
    audioFile: 'voiceover.mp3',
    words: [], // populated in step 4
    chapters: [
      { title: 'The Core Shift', startTime: 0 },
      { title: 'The Hidden Mechanism', startTime: isShort ? 7 : 18 },
      { title: 'Strategic Takeaways', startTime: isShort ? 16 : 38 },
      { title: 'The Prediction', startTime: isShort ? 22 : 52 },
    ],
    beats: [
      {
        id: 'beat-0',
        beatIndex: 0,
        startTime: 0,
        duration: isShort ? 7 : 16,
        text: `Most people misunderstand what is happening with ${idea.title}. The real story is not in the headlines, but in the underlying architecture.`,
        statuePrompt: 'Matte-black blank-oval-face mannequin statue standing dead center looking forward in sharp studio contrast, pure #FFFFFF white background, minimalist composition',
        cameraMovement: 'zoom-in',
        statueImage: 'reference_statue.png',
        infoCard: {
          type: 'alert',
          badge: 'PARADIGM SHIFT',
          title: idea.title,
          subtitle: idea.summary,
        },
      },
      {
        id: 'beat-1',
        beatIndex: 1,
        startTime: isShort ? 7 : 16,
        duration: isShort ? 9 : 20,
        text: 'When you eliminate friction from complex systems, traditional workflows collapse. The data reveals an overwhelming velocity shift.',
        statuePrompt: 'Matte-black mannequin statue in three-quarters profile, head tilted down in deep intellectual focus, stark shadow on pure white #FFFFFF canvas',
        cameraMovement: 'pan-left',
        statueImage: 'reference_statue.png',
        infoCard: {
          type: 'metric',
          badge: 'VELOCITY INDEX',
          metric: '10x',
          metricLabel: 'Execution Acceleration',
          title: 'Structural Transformation',
        },
      },
      {
        id: 'beat-2',
        beatIndex: 2,
        startTime: isShort ? 16 : 36,
        duration: isShort ? 6 : 16,
        text: 'Those who adapt early establish an unassailable moat. Those who wait will be forced to rebuild from zero.',
        statuePrompt: 'Matte-black mannequin statue with arm raised pointing forward decisively, pure #FFFFFF clean background',
        cameraMovement: 'subtle-float',
        statueImage: 'reference_statue.png',
        infoCard: {
          type: 'takeaway',
          badge: 'STRATEGIC PILLARS',
          title: 'Key Directives',
          bulletPoints: [
            'Automate high-friction bottlenecks',
            'Prioritize verified signal over volume',
            'Deploy autonomous background workers',
          ],
        },
      },
      {
        id: 'beat-3',
        beatIndex: 3,
        startTime: isShort ? 22 : 52,
        duration: isShort ? 6 : 13,
        text: 'The architecture is already in motion. Stay sharp, question standard models, and subscribe for tomorrow’s intelligence.',
        statuePrompt: 'Matte-black blank-oval-face mannequin statue side silhouette against pure #FFFFFF white, dramatic ambient lighting',
        cameraMovement: 'dramatic-push',
        statueImage: 'reference_statue.png',
        infoCard: {
          type: 'quote',
          badge: 'FINAL VERDICT',
          title: 'Autonomous Dominance',
          subtitle: 'The future belongs to builders who automate end-to-end.',
        },
      },
    ],
  };
}

export async function generateScript(targetFormat: 'short' | 'long' = 'short'): Promise<VideoScriptData> {
  if (!fs.existsSync(IDEA_FILE)) {
    throw new Error(`[Step 2] Idea file not found at ${IDEA_FILE}. Run step 1 first.`);
  }

  const idea: ContentIdea = JSON.parse(fs.readFileSync(IDEA_FILE, 'utf-8'));
  console.log(`[Step 2] Generating script for "${idea.title}" (Format: ${targetFormat})...`);

  const geminiApiKey = process.env.GEMINI_API_KEY;
  const anthropicApiKey = process.env.ANTHROPIC_API_KEY;

  if (!geminiApiKey && !anthropicApiKey) {
    console.log('[Step 2] Notice: No GEMINI_API_KEY or ANTHROPIC_API_KEY found in environment. Using high-signal deterministic script generator.');
    const mockScript = generateMockScript(idea, targetFormat);
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(mockScript, null, 2));
    return mockScript;
  }

  const userPrompt = `
Topic: ${idea.title}
Summary: ${idea.summary}
Category: ${idea.category}
Target Video Format: ${targetFormat} (${targetFormat === 'short' ? '30-45 seconds, 4-5 scene beats' : '60-90 seconds, 6-8 scene beats'})

Generate a complete JSON response according to this schema:
{
  "topicId": "${idea.id}",
  "topicTitle": "${idea.title}",
  "category": "${idea.category}",
  "headline": "Punchy 4-7 word headline",
  "hook": "Opening sentence",
  "targetFormat": "${targetFormat}",
  "fps": 30,
  "totalDuration": 30,
  "audioFile": "voiceover.mp3",
  "chapters": [ { "title": "...", "startTime": 0 } ],
  "beats": [
    {
      "id": "beat-0",
      "beatIndex": 0,
      "startTime": 0,
      "duration": 6,
      "text": "Spoken line for beat",
      "statuePrompt": "Detailed pose prompt for matte-black mannequin on #FFFFFF background",
      "cameraMovement": "zoom-in",
      "infoCard": {
        "type": "takeaway",
        "badge": "TAG",
        "title": "Title",
        "subtitle": "Subtitle",
        "bulletPoints": ["Point 1", "Point 2"]
      }
    }
  ]
}
Return ONLY pure JSON. No markdown backticks, no explanations.
`;

  try {
    let scriptJson: VideoScriptData | null = null;

    if (geminiApiKey) {
      console.log('[Step 2] Querying Google Gemini API...');
      const response = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiApiKey}`,
        {
          contents: [{ role: 'user', parts: [{ text: `${SYSTEM_PROMPT}\n\n${userPrompt}` }] }],
          generationConfig: {
            responseMimeType: 'application/json',
            temperature: 0.7,
          },
        },
        { headers: { 'Content-Type': 'application/json' }, timeout: 60000 }
      );

      const candidate = response.data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
      scriptJson = JSON.parse(candidate.replace(/```json/g, '').replace(/```/g, '').trim());
    } else if (anthropicApiKey) {
      console.log('[Step 2] Querying Anthropic Claude API...');
      const res = await axios.post(
        'https://api.anthropic.com/v1/messages',
        {
          model: 'claude-3-5-sonnet-20241022',
          max_tokens: 3000,
          system: SYSTEM_PROMPT,
          messages: [{ role: 'user', content: userPrompt }],
        },
        {
          headers: {
            'x-api-key': anthropicApiKey,
            'anthropic-version': '2023-06-01',
            'content-type': 'application/json',
          },
        }
      );
      const content = res.data.content[0].text;
      scriptJson = JSON.parse(content.replace(/```json/g, '').replace(/```/g, '').trim());
    }

    if (scriptJson && scriptJson.beats) {
      // Ensure statueImage fallback
      scriptJson.beats.forEach((b, idx) => {
        if (!b.statueImage) {
          b.statueImage = `images/beat_${idx}.png`;
        }
      });
      fs.writeFileSync(OUTPUT_FILE, JSON.stringify(scriptJson, null, 2));
      console.log(`[Step 2] Script generated and written to ${OUTPUT_FILE}`);
      return scriptJson;
    }
  } catch (err: any) {
    console.warn(`[Step 2] API call failed (${err.message}). Falling back to deterministic script.`);
  }

  const fallbackScript = generateMockScript(idea, targetFormat);
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(fallbackScript, null, 2));
  return fallbackScript;
}

// Direct execution support
if (import.meta.url === `file://${process.argv[1]}`) {
  const formatArg = (process.argv.find((arg) => arg.startsWith('--format='))?.split('=')[1] as 'short' | 'long') || 'short';
  generateScript(formatArg).catch((err) => {
    console.error('[Step 2] Fatal error:', err);
    process.exit(1);
  });
}
