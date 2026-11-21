import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import axios from 'axios';
import { google } from 'googleapis';
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { HistoryRecord, VideoScriptData } from '../remotion/types.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const DATA_DIR = path.join(ROOT_DIR, 'data');
const TEMP_DIR = path.join(ROOT_DIR, 'temp');
const OUT_DIR = path.join(ROOT_DIR, 'out');
const HISTORY_FILE = path.join(DATA_DIR, 'history.json');
const SCRIPT_FILE = path.join(TEMP_DIR, 'script.json');

const SHORT_VIDEO_PATH = path.join(OUT_DIR, 'short.mp4');
const LONG_VIDEO_PATH = path.join(OUT_DIR, 'long.mp4');

// --- 1. YouTube Data API v3 Client ---
function getYouTubeClient() {
  const clientId = process.env.YOUTUBE_CLIENT_ID;
  const clientSecret = process.env.YOUTUBE_CLIENT_SECRET;
  const refreshToken = process.env.YOUTUBE_REFRESH_TOKEN;

  if (!clientId || !clientSecret || !refreshToken) {
    return null;
  }

  const oauth2Client = new google.auth.OAuth2(
    clientId,
    clientSecret,
    'https://developers.google.com/oauthplayground'
  );

  oauth2Client.setCredentials({ refresh_token: refreshToken });
  return google.youtube({ version: 'v3', auth: oauth2Client });
}

async function uploadToYouTube(
  youtube: any,
  filePath: string,
  title: string,
  description: string,
  tags: string[],
  isShort: boolean
): Promise<{ id: string; url: string }> {
  console.log(`[Publish - YouTube] Uploading ${path.basename(filePath)} (${isShort ? 'Short' : 'Long'})...`);

  const formattedTitle = isShort ? `${title} #Shorts` : title;
  const formattedDesc = isShort ? `${description}\n\n#Shorts #MatteBlack #Intelligence #AI` : description;

  const res = await youtube.videos.insert({
    part: ['snippet', 'status'],
    requestBody: {
      snippet: {
        title: formattedTitle.slice(0, 100),
        description: formattedDesc,
        tags: [...tags, 'Minimalism', 'Automation', 'Technology', 'AI'],
        categoryId: '28', // Science & Technology
      },
      status: {
        privacyStatus: 'public',
        selfDeclaredMadeForKids: false,
      },
    },
    media: {
      body: fs.createReadStream(filePath),
    },
  });

  const videoId = res.data.id;
  const url = isShort ? `https://youtube.com/shorts/${videoId}` : `https://youtu.be/${videoId}`;
  console.log(`[Publish - YouTube] Successfully uploaded: ${url}`);
  return { id: videoId, url };
}

// --- 2. Cloudflare R2 Temporary Hosting Client ---
function getR2Client(): { client: S3Client; bucket: string; publicUrlBase: string } | null {
  const accountId = process.env.CLOUDFLARE_R2_ACCOUNT_ID;
  const accessKeyId = process.env.CLOUDFLARE_R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY;
  const bucket = process.env.CLOUDFLARE_R2_BUCKET_NAME;
  const publicUrlBase = process.env.CLOUDFLARE_R2_PUBLIC_URL; // e.g. https://pub-xxxx.r2.dev

  if (!accountId || !accessKeyId || !secretAccessKey || !bucket || !publicUrlBase) {
    return null;
  }

  const client = new S3Client({
    region: 'auto',
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
  });

  return { client, bucket, publicUrlBase: publicUrlBase.replace(/\/$/, '') };
}

async function uploadToR2(
  r2: { client: S3Client; bucket: string; publicUrlBase: string },
  filePath: string
): Promise<{ key: string; publicUrl: string }> {
  const fileKey = `temp-pipeline/${Date.now()}-${path.basename(filePath)}`;
  console.log(`[Publish - R2] Uploading temporary video to Cloudflare R2: ${fileKey}...`);

  const fileStream = fs.createReadStream(filePath);
  const fileSize = fs.statSync(filePath).size;

  await r2.client.send(
    new PutObjectCommand({
      Bucket: r2.bucket,
      Key: fileKey,
      Body: fileStream,
      ContentType: 'video/mp4',
      ContentLength: fileSize,
    })
  );

  const publicUrl = `${r2.publicUrlBase}/${fileKey}`;
  console.log(`[Publish - R2] Public temporary URL: ${publicUrl}`);
  return { key: fileKey, publicUrl };
}

async function deleteFromR2(
  r2: { client: S3Client; bucket: string; publicUrlBase: string },
  fileKey: string
): Promise<void> {
  console.log(`[Publish - R2] Cleaning up temporary object from R2: ${fileKey}...`);
  try {
    await r2.client.send(
      new DeleteObjectCommand({
        Bucket: r2.bucket,
        Key: fileKey,
      })
    );
    console.log(`[Publish - R2] Cleaned up temporary object successfully.`);
  } catch (err: any) {
    console.warn(`[Publish - R2] Cleanup warning: ${err.message}`);
  }
}

// --- 3. Instagram Reels via Meta Graph API ---
async function publishToInstagramReels(videoUrl: string, caption: string): Promise<string> {
  const igAccountId = process.env.INSTAGRAM_ACCOUNT_ID;
  const igAccessToken = process.env.INSTAGRAM_ACCESS_TOKEN;

  if (!igAccountId || !igAccessToken) {
    throw new Error('Missing Instagram credentials');
  }

  console.log('[Publish - Instagram] Creating Reel media container...');
  const createContainerRes = await axios.post(
    `https://graph.facebook.com/v19.0/${igAccountId}/media`,
    {
      media_type: 'REELS',
      video_url: videoUrl,
      caption: `${caption}\n\n#minimalism #monochrome #technology #intelligence #reels`,
      access_token: igAccessToken,
    }
  );

  const containerId = createContainerRes.data.id;
  console.log(`[Publish - Instagram] Container created: ${containerId}. Waiting for video processing...`);

  // Poll status until container is ready (status_code === 'FINISHED')
  let isReady = false;
  let attempts = 0;
  const maxAttempts = 30; // 30 * 5s = 2.5 minutes max

  while (!isReady && attempts < maxAttempts) {
    attempts++;
    await new Promise((resolve) => setTimeout(resolve, 5000));

    const statusRes = await axios.get(
      `https://graph.facebook.com/v19.0/${containerId}`,
      {
        params: {
          fields: 'status_code,status',
          access_token: igAccessToken,
        },
      }
    );

    const statusCode = statusRes.data.status_code;
    console.log(`[Publish - Instagram] Container status check (${attempts}/${maxAttempts}): ${statusCode}`);

    if (statusCode === 'FINISHED') {
      isReady = true;
    } else if (statusCode === 'ERROR') {
      throw new Error(`Instagram video processing failed: ${JSON.stringify(statusRes.data)}`);
    }
  }

  if (!isReady) {
    throw new Error('Instagram video processing timed out');
  }

  // Publish the container
  console.log('[Publish - Instagram] Publishing container to profile...');
  const publishRes = await axios.post(
    `https://graph.facebook.com/v19.0/${igAccountId}/media_publish`,
    {
      creation_id: containerId,
      access_token: igAccessToken,
    }
  );

  const mediaId = publishRes.data.id;
  console.log(`[Publish - Instagram] Successfully published Reel! Media ID: ${mediaId}`);
  return mediaId;
}

// --- Main Orchestrator for Publishing ---
export async function publishAll(): Promise<void> {
  console.log('[Step 5] Initializing social publishing module...');

  if (!fs.existsSync(SCRIPT_FILE)) {
    throw new Error(`Script file not found at ${SCRIPT_FILE}. Run previous steps first.`);
  }

  const script: VideoScriptData = JSON.parse(fs.readFileSync(SCRIPT_FILE, 'utf-8'));

  let history: HistoryRecord[] = [];
  if (fs.existsSync(HISTORY_FILE)) {
    try {
      history = JSON.parse(fs.readFileSync(HISTORY_FILE, 'utf-8'));
    } catch {
      history = [];
    }
  }

  const historyRecord: HistoryRecord = {
    id: script.topicId || `record-${Date.now()}`,
    title: script.headline || script.topicTitle,
    category: script.category,
    publishedAt: new Date().toISOString(),
  };

  // Build description with chapter timestamps
  let detailedDescription = `${script.headline}\n\n${script.hook}\n\n`;
  if (script.chapters && script.chapters.length > 0) {
    detailedDescription += 'CHAPTERS:\n';
    script.chapters.forEach((ch) => {
      const minutes = Math.floor(ch.startTime / 60);
      const seconds = Math.floor(ch.startTime % 60);
      const timeStr = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
      detailedDescription += `${timeStr} - ${ch.title}\n`;
    });
  }

  // --- YouTube Publishing ---
  const youtube = getYouTubeClient();
  if (youtube) {
    try {
      // 1. Upload Long Video
      if (fs.existsSync(LONG_VIDEO_PATH)) {
        const longRes = await uploadToYouTube(
          youtube,
          LONG_VIDEO_PATH,
          script.headline,
          detailedDescription,
          [script.category],
          false
        );
        historyRecord.youtubeLongId = longRes.id;
        historyRecord.youtubeLongUrl = longRes.url;
      }

      // 2. Upload Short Video
      if (fs.existsSync(SHORT_VIDEO_PATH)) {
        const shortRes = await uploadToYouTube(
          youtube,
          SHORT_VIDEO_PATH,
          script.headline,
          detailedDescription,
          [script.category],
          true
        );
        historyRecord.youtubeShortId = shortRes.id;
        historyRecord.youtubeShortUrl = shortRes.url;
      }
    } catch (err: any) {
      console.error(`[Publish - YouTube] Error: ${err.message}`);
    }
  } else {
    console.log('[Publish - YouTube] Skipped (Missing YOUTUBE_CLIENT_ID / SECRET / REFRESH_TOKEN). Mocking record.');
    historyRecord.youtubeLongUrl = `https://youtu.be/mock_${Date.now()}`;
    historyRecord.youtubeShortUrl = `https://youtube.com/shorts/mock_${Date.now()}`;
  }

  // --- Cloudflare R2 + Instagram Reels Publishing ---
  const r2 = getR2Client();
  const igConfigured = !!(process.env.INSTAGRAM_ACCOUNT_ID && process.env.INSTAGRAM_ACCESS_TOKEN);

  if (r2 && igConfigured && fs.existsSync(SHORT_VIDEO_PATH)) {
    let uploadedKey: string | null = null;
    try {
      // 1. Upload temporarily to R2
      const { key, publicUrl } = await uploadToR2(r2, SHORT_VIDEO_PATH);
      uploadedKey = key;

      // 2. Publish to Instagram
      const igPostId = await publishToInstagramReels(publicUrl, script.headline);
      historyRecord.instagramPostId = igPostId;
    } catch (err: any) {
      console.error(`[Publish - Instagram] Error: ${err.message}`);
    } finally {
      // 3. Immediately clean up R2 temporary storage to maintain zero cost
      if (uploadedKey) {
        await deleteFromR2(r2, uploadedKey);
      }
    }
  } else {
    console.log('[Publish - Instagram] Skipped (Missing Cloudflare R2 or Instagram credentials). Mocking record.');
    historyRecord.instagramPostId = `mock_ig_${Date.now()}`;
  }

  // Update history.json
  history.unshift(historyRecord);
  fs.writeFileSync(HISTORY_FILE, JSON.stringify(history, null, 2));
  console.log(`[Step 5] Successfully logged published record to ${HISTORY_FILE}`);
}

// Direct execution support
if (import.meta.url === `file://${process.argv[1]}`) {
  publishAll().catch((err) => {
    console.error('[Step 5] Fatal error:', err);
    process.exit(1);
  });
}
