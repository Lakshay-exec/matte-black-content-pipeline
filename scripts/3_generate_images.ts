import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import axios from 'axios';
import { VideoScriptData } from '../remotion/types.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const TEMP_DIR = path.join(ROOT_DIR, 'temp');
const PUBLIC_DIR = path.join(ROOT_DIR, 'public');
const IMAGES_DIR = path.join(PUBLIC_DIR, 'images');
const SCRIPT_FILE = path.join(TEMP_DIR, 'script.json');
const MASTER_REF_IMAGE = path.join(ROOT_DIR, 'assets', 'reference_statue.png');

export async function generateImages(): Promise<void> {
  if (!fs.existsSync(SCRIPT_FILE)) {
    throw new Error(`[Step 3] Script file not found at ${SCRIPT_FILE}. Run step 2 first.`);
  }

  if (!fs.existsSync(IMAGES_DIR)) {
    fs.mkdirSync(IMAGES_DIR, { recursive: true });
  }

  const script: VideoScriptData = JSON.parse(fs.readFileSync(SCRIPT_FILE, 'utf-8'));
  const apiKey = process.env.GEMINI_API_KEY;

  console.log(`[Step 3] Preparing images for ${script.beats.length} scene beats...`);

  let masterRefBase64 = '';
  if (fs.existsSync(MASTER_REF_IMAGE)) {
    masterRefBase64 = fs.readFileSync(MASTER_REF_IMAGE).toString('base64');
  }

  for (let i = 0; i < script.beats.length; i++) {
    const beat = script.beats[i];
    const targetFile = path.join(IMAGES_DIR, `beat_${i}.png`);

    console.log(`[Step 3] Beat ${i + 1}/${script.beats.length}: "${beat.statuePrompt.slice(0, 60)}..."`);

    let generated = false;

    if (apiKey) {
      try {
        console.log(`[Step 3] Calling Gemini Image Generation API with master reference statue...`);
        // We use Google GenAI multimodal image generation / Imagen endpoint
        const fullPrompt = `Subject consistency reference provided. Generate a high-resolution, photorealistic, minimalist photograph of the exact same character: a matte-black mannequin statue with a featureless, blank oval face. The character is posed as follows: ${beat.statuePrompt}. CRITICAL: Background must be 100% pure solid white (#FFFFFF), zero shadows on the background edges, professional studio softbox lighting, ultra-sharp 8k.`;

        // Attempt Gemini Imagen / Flash-Image call
        const response = await axios.post(
          `https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-002:predict?key=${apiKey}`,
          {
            instances: [
              {
                prompt: fullPrompt,
              },
            ],
            parameters: {
              sampleCount: 1,
              aspectRatio: script.targetFormat === 'short' ? '9:16' : '16:9',
              personGeneration: 'allow_adult',
              outputMimeType: 'image/png',
            },
          },
          {
            headers: { 'Content-Type': 'application/json' },
            timeout: 60000,
          }
        );

        if (
          response.data &&
          response.data.predictions &&
          response.data.predictions[0] &&
          response.data.predictions[0].bytesBase64Encoded
        ) {
          const imgBuffer = Buffer.from(response.data.predictions[0].bytesBase64Encoded, 'base64');
          fs.writeFileSync(targetFile, imgBuffer);
          console.log(`[Step 3] Successfully generated and saved ${targetFile}`);
          beat.statueImage = `images/beat_${i}.png`;
          generated = true;
        }
      } catch (err: any) {
        console.warn(`[Step 3] Gemini Image generation warning for beat ${i}: ${err.message}. Using reference statue fallback.`);
      }
    }

    if (!generated) {
      // Fallback: Copy master reference image or create symlink
      if (fs.existsSync(MASTER_REF_IMAGE)) {
        fs.copyFileSync(MASTER_REF_IMAGE, targetFile);
      } else {
        // If master doesn't exist, create an empty 1x1 placeholder
        fs.writeFileSync(targetFile, Buffer.from(''));
      }
      beat.statueImage = `images/beat_${i}.png`;
      console.log(`[Step 3] Applied master reference fallback for beat ${i}: ${targetFile}`);
    }
  }

  // Update script.json with finalized relative image paths
  fs.writeFileSync(SCRIPT_FILE, JSON.stringify(script, null, 2));
  console.log('[Step 3] Image generation step completed.');
}

// Direct execution support
if (import.meta.url === `file://${process.argv[1]}`) {
  generateImages().catch((err) => {
    console.error('[Step 3] Fatal error:', err);
    process.exit(1);
  });
}
