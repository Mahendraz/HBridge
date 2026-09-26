import { writeFile, readFile, unlink } from 'fs/promises';
import { tmpdir } from 'os';
import { randomUUID } from 'crypto';
import path from 'path';
import { spawn } from 'child_process';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────
export interface CompressResult {
  buffer: Buffer;
  mimeType: string;
  ext: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Lazy loaders — dynamic imports so a missing native binary never crashes the
// route at module-load time; we gracefully fall back to the original file.
// ─────────────────────────────────────────────────────────────────────────────
async function loadSharp() {
  try {
    const mod = await import('sharp');
    return mod.default;
  } catch {
    return null;
  }
}

/**
 * A present-but-broken ffmpeg binary (seen in the wild on some Windows
 * setups: a valid-looking PE file that still fails with `spawn EFTYPE`) is
 * worse than a missing one. Probing with a cheap `-version` spawn picks the
 * first candidate that actually runs, so compressVideo() only ever transcodes
 * with a binary known to work and otherwise falls back to the original file.
 */
function verifyFfmpegRuns(ffmpegPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn(ffmpegPath, ['-version']);
    child.on('error', reject);
    child.on('exit', (code) => (code === 0 ? resolve() : reject(new Error(`ffmpeg -version exited with code ${code}`))));
  });
}

/**
 * Candidates in priority order: an explicit FFMPEG_PATH, the bundled
 * ffmpeg-static binary, then whatever `ffmpeg` is on PATH. The bundled binary
 * is the one known to be broken on some Windows setups (see above), and when
 * it was the only option every video — including iPhone HEVC .mov files that
 * Chrome/Android can't play — silently stayed in its original format.
 */
async function resolveFfmpegPath(): Promise<string | null> {
  const candidates: string[] = [];
  if (process.env.FFMPEG_PATH) candidates.push(process.env.FFMPEG_PATH);
  try {
    const staticPath = (await import('ffmpeg-static')).default;
    if (staticPath) candidates.push(staticPath);
  } catch {
    // package missing — fine, try the next candidate
  }
  candidates.push('ffmpeg');

  for (const candidate of candidates) {
    try {
      await verifyFfmpegRuns(candidate);
      return candidate;
    } catch (err) {
      console.warn(`[compress] ffmpeg candidate "${candidate}" failed to run:`, err instanceof Error ? err.message : err);
    }
  }
  return null;
}

// Resolved once per process — probing spawns a child, no need to repeat it
// for every upload.
let ffmpegPathPromise: Promise<string | null> | null = null;

async function loadFfmpegPath(): Promise<string | null> {
  try {
    ffmpegPathPromise ??= resolveFfmpegPath();
    const ffmpegPath = await ffmpegPathPromise;
    if (!ffmpegPath) {
      console.warn('[compress] no working ffmpeg binary found, falling back to original');
    }
    return ffmpegPath;
  } catch (err) {
    console.warn('[compress] ffmpeg failed to load, falling back to original:', err instanceof Error ? err.message : err);
    return null;
  }
}

/**
 * Runs ffmpeg with the given arguments. Rejects with the tail of stderr when
 * it exits non-zero, since that's where ffmpeg explains what went wrong.
 */
function runFfmpeg(ffmpegPath: string, args: string[]): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn(ffmpegPath, args);
    let stderr = '';
    child.stderr.on('data', (chunk: Buffer) => {
      stderr = (stderr + chunk.toString()).slice(-2000);
    });
    child.on('error', reject);
    child.on('close', (code) =>
      code === 0 ? resolve() : reject(new Error(`ffmpeg exited with code ${code}: ${stderr.trim()}`))
    );
  });
}

/**
 * HEIC/HEIF (iPhone photos) → JPEG. The prebuilt sharp binary ships libheif
 * without an HEVC decoder (AVIF only), so heic-convert's WASM decoder does
 * the decoding. Returns null when conversion fails.
 */
async function heicToJpeg(buffer: Buffer): Promise<Buffer | null> {
  try {
    const convert = (await import('heic-convert')).default;
    const jpeg = await convert({ buffer, format: 'JPEG', quality: 0.9 });
    return Buffer.from(jpeg);
  } catch (err) {
    console.warn('[compress] HEIC conversion failed:', err instanceof Error ? err.message : err);
    return null;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Image — convert to WebP, quality 82, max 2048px, strip private metadata.
// HEIC is decoded to JPEG first; if that fails the upload is rejected by
// throwing, since an unconverted HEIC can't be shown outside Apple devices.
// ─────────────────────────────────────────────────────────────────────────────
export async function compressImage(
  buffer: Buffer,
  mimeType: string
): Promise<CompressResult> {
  const extMap: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
    'image/gif': 'gif',
  };

  if (mimeType === 'image/heic' || mimeType === 'image/heif') {
    const jpeg = await heicToJpeg(buffer);
    if (!jpeg) throw new Error('Foto HEIC tidak bisa dikonversi. Coba ekspor sebagai JPG.');
    buffer = jpeg;
    mimeType = 'image/jpeg';
  }

  const sharp = await loadSharp();
  if (!sharp) {
    console.warn('[compress] sharp not available, uploading original image');
    return { buffer, mimeType, ext: extMap[mimeType] ?? 'jpg' };
  }

  try {
    if (mimeType === 'image/gif') {
      const compressed = await sharp(buffer, { animated: true }).gif().toBuffer();
      return { buffer: compressed, mimeType: 'image/gif', ext: 'gif' };
    }

    const compressed = await sharp(buffer)
      .rotate()
      .resize(2048, 2048, { fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 82, effort: 4 })
      .toBuffer();

    return { buffer: compressed, mimeType: 'image/webp', ext: 'webp' };
  } catch (err) {
    console.warn('[compress] image compression failed, using original:', err);
    return { buffer, mimeType, ext: extMap[mimeType] ?? 'jpg' };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Video — H.264 MP4, CRF 28, max 720p, AAC 128k, web-optimised moov atom.
// This is also what makes iPhone HEVC .mov files playable on Chrome/Android.
// ─────────────────────────────────────────────────────────────────────────────
export async function compressVideo(
  buffer: Buffer,
  mimeType: string
): Promise<CompressResult> {
  const extMap: Record<string, string> = {
    'video/mp4': 'mp4',
    'video/webm': 'webm',
    'video/quicktime': 'mov',
    'video/3gpp': '3gp',
  };
  const inExt = extMap[mimeType] ?? 'mp4';

  const ffmpegPath = await loadFfmpegPath();
  if (!ffmpegPath) {
    console.warn('[compress] ffmpeg not available, uploading original video');
    return { buffer, mimeType, ext: inExt };
  }

  const inPath  = path.join(tmpdir(), `hb-in-${randomUUID()}.${inExt}`);
  const outPath = path.join(tmpdir(), `hb-out-${randomUUID()}.mp4`);

  try {
    await writeFile(inPath, buffer);

    await runFfmpeg(ffmpegPath, [
      '-hide_banner',
      '-i', inPath,
      // First video + first audio track only — iPhone .mov files also carry
      // metadata/timecode tracks that MP4 can't hold.
      '-map', '0:v:0',
      '-map', '0:a:0?',
      '-vf', "scale='if(gt(iw,1280),1280,iw)':-2",
      '-c:v', 'libx264',
      '-crf', '28',
      '-preset', 'fast',
      '-pix_fmt', 'yuv420p',
      '-c:a', 'aac',
      '-b:a', '128k',
      '-movflags', '+faststart',
      '-y', outPath,
    ]);

    const compressed = await readFile(outPath);
    return { buffer: compressed, mimeType: 'video/mp4', ext: 'mp4' };
  } catch (err) {
    console.warn('[compress] video compression failed, using original:', err);
    return { buffer, mimeType, ext: inExt };
  } finally {
    await unlink(inPath).catch(() => {});
    await unlink(outPath).catch(() => {});
  }
}
