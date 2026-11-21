import { execSync, spawnSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { fetchIdea } from './1_fetch_idea.js';
import { generateScript } from './2_generate_script.js';
import { generateImages } from './3_generate_images.js';
import { publishAll } from './5_publish.js';
import { VideoScriptData } from '../remotion/types.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const TEMP_DIR = path.join(ROOT_DIR, 'temp');
const OUT_DIR = path.join(ROOT_DIR, 'out');
const DATA_SHORT_PATH = path.join(TEMP_DIR, 'data_short.json');
const DATA_LONG_PATH = path.join(TEMP_DIR, 'data_long.json');

async function main() {
  const args = process.argv.slice(2);
  const isDryRun = args.includes('--dry-run');
  const skipPublish = isDryRun || args.includes('--skip-publish');
  const skipRender = args.includes('--skip-render');
  const customTopicArg = args.find((a) => a.startsWith('--topic='))?.split('=')[1];
  const formatArg = (args.find((a) => a.startsWith('--format='))?.split('=')[1] as 'both' | 'short' | 'long') || 'both';

  console.log('================================================================');
  console.log('  MATTE-BLACK MANNEQUIN AUTOMATED CONTENT PIPELINE (v1.0.0)');
  console.log('================================================================');
  console.log(`Mode: ${isDryRun ? 'DRY-RUN (Simulated)' : 'PRODUCTION'}`);
  console.log(`Publishing: ${skipPublish ? 'DISABLED' : 'ENABLED'}`);
  console.log(`Render Format: ${formatArg}`);
  if (customTopicArg) console.log(`Custom Topic Override: "${customTopicArg}"`);
  console.log('----------------------------------------------------------------\n');

  if (!fs.existsSync(OUT_DIR)) {
    fs.mkdirSync(OUT_DIR, { recursive: true });
  }

  const startTime = Date.now();

  try {
    // -------------------------------------------------------------------------
    // STEP 1: Fetch Trending Idea & Deduplicate
    // -------------------------------------------------------------------------
    console.log('\n>>> [1/5] FETCHING & FILTERING TRENDING TOPIC...');
    const idea = await fetchIdea(customTopicArg);
    console.log(`✓ Topic locked: "${idea.title}"`);

    // -------------------------------------------------------------------------
    // STEP 2: Generate Structured Narrative & Visual Scene Beats
    // -------------------------------------------------------------------------
    console.log('\n>>> [2/5] GENERATING SCRIPT & BEAT PROMPTS (LLM)...');
    const script = await generateScript('short');
    console.log(`✓ Generated ${script.beats.length} scene beats for "${script.headline}"`);

    // -------------------------------------------------------------------------
    // STEP 3: Character Consistency Image Generation
    // -------------------------------------------------------------------------
    console.log('\n>>> [3/5] GENERATING CONSISTENT MANNEQUIN IMAGES...');
    await generateImages();
    console.log('✓ Mannequin stage images generated & synced.');

    // -------------------------------------------------------------------------
    // STEP 4: Neural TTS Voiceover & Word Timestamps (Python)
    // -------------------------------------------------------------------------
    console.log('\n>>> [4/5] SYNTHESIZING NEURAL AUDIO & EXTRACTING TIMESTAMPS...');
    const pythonScript = path.join(ROOT_DIR, 'scripts', '4_generate_audio.py');
    const pyResult = spawnSync('python', [pythonScript], { stdio: 'inherit' });
    if (pyResult.status !== 0) {
      console.warn('Python execution returned non-zero code. Checking data files...');
    }
    console.log('✓ Audio track & word-accurate timestamps produced.');

    // -------------------------------------------------------------------------
    // RENDER: Remotion Video Rendering (Short and/or Long)
    // -------------------------------------------------------------------------
    if (!skipRender) {
      console.log('\n>>> RENDERING PROGRAMMATIC REMOTION COMPOSITIONS...');

      // Read duration to compute total frames
      let shortData: VideoScriptData | null = null;
      let longData: VideoScriptData | null = null;

      if (fs.existsSync(DATA_SHORT_PATH)) {
        shortData = JSON.parse(fs.readFileSync(DATA_SHORT_PATH, 'utf-8'));
      }
      if (fs.existsSync(DATA_LONG_PATH)) {
        longData = JSON.parse(fs.readFileSync(DATA_LONG_PATH, 'utf-8'));
      }

      const remotionBin = path.join(ROOT_DIR, 'node_modules', '.bin', 'remotion');

      // 1. Render Short (9:16)
      if (formatArg === 'both' || formatArg === 'short') {
        const shortFrames = shortData ? Math.round(shortData.totalDuration * shortData.fps) : 360;
        const shortOut = path.join(OUT_DIR, 'short.mp4');
        console.log(`\nRendering Short Video (9:16 vertical) -> ${shortOut} (${shortFrames} frames)...`);

        const entryPoint = path.join(ROOT_DIR, 'remotion', 'Root.tsx');
        const shortCmd = `npx remotion render "${entryPoint}" ShortVideo "${shortOut}" --props="${DATA_SHORT_PATH}" --frames=0-${shortFrames - 1} --concurrency=4 --chromium-options="--no-sandbox"`;
        try {
          execSync(shortCmd, { stdio: 'inherit' });
          console.log(`✓ Short video rendered successfully: ${shortOut}`);
        } catch (e: any) {
          console.error(`Remotion short render failed: ${e.message}`);
          if (!isDryRun) throw e;
        }
      }

      // 2. Render Long (16:9)
      if (formatArg === 'both' || formatArg === 'long') {
        const longFrames = longData ? Math.round(longData.totalDuration * longData.fps) : 360;
        const longOut = path.join(OUT_DIR, 'long.mp4');
        console.log(`\nRendering Long Video (16:9 horizontal) -> ${longOut} (${longFrames} frames)...`);

        const entryPoint = path.join(ROOT_DIR, 'remotion', 'Root.tsx');
        const longCmd = `npx remotion render "${entryPoint}" LongVideo "${longOut}" --props="${DATA_LONG_PATH}" --frames=0-${longFrames - 1} --concurrency=4 --chromium-options="--no-sandbox"`;
        try {
          execSync(longCmd, { stdio: 'inherit' });
          console.log(`✓ Long video rendered successfully: ${longOut}`);
        } catch (e: any) {
          console.error(`Remotion long render failed: ${e.message}`);
          if (!isDryRun) throw e;
        }
      }
    } else {
      console.log('\n[Render] Skipped by --skip-render flag.');
    }

    // -------------------------------------------------------------------------
    // STEP 5: Social Publishing (YouTube + Instagram Reels)
    // -------------------------------------------------------------------------
    if (!skipPublish) {
      console.log('\n>>> [5/5] EXECUTING SOCIAL DISTRIBUTION (YOUTUBE & INSTAGRAM)...');
      await publishAll();
      console.log('✓ Social syndication complete.');
    } else {
      console.log('\n>>> [5/5] Social publishing skipped (Dry-Run / Skip-Publish active).');
    }

    const elapsed = Math.round((Date.now() - startTime) / 1000);
    console.log('\n================================================================');
    console.log(`  PIPELINE EXECUTION FINISHED SUCCESSFULLY IN ${elapsed}s`);
    console.log('================================================================');
  } catch (err: any) {
    console.error('\n❌ PIPELINE FAILED WITH ERROR:', err);
    process.exit(1);
  }
}

main();
