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
 * worse than a missing one — fluent-ffmpeg doesn't reliably turn a
 * spawn-level failure into its own catchable 'error' event, so it can
 * surface as a raw uncaughtException from deep inside child_process instead
 * of rejecting the promise compressVideo() awaits. Probing with a cheap
 * `-version` spawn here means a broken binary is caught in this function's
 * own try/catch (a controlled, local failure) — before compressVideo ever
 * reaches the real transcode, where the same failure would otherwise be
 * far more likely to crash the process instead of just falling back.
 */
function verifyFfmpegRuns(ffmpegPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn(ffmpegPath, ['-version']);
    child.on('error', reject);
    child.on('exit', (code) => (code === 0 ? resolve() : reject(new Error(`ffmpeg -version exited with code ${code}`))));
  });
}

async function loadFfmpeg() {
  try {
    const [ffmpegMod, staticMod] = await Promise.all([
      import('fluent-ffmpeg'),
      import('ffmpeg-static'),
    ]);
    const ffmpeg = ffmpegMod.default;
    const ffmpegPath = staticMod.default;
    if (!ffmpegPath) return null;
    await verifyFfmpegRuns(ffmpegPath);
    ffmpeg.setFfmpegPath(ffmpegPath);
    return ffmpeg;
  } catch (err) {
    console.warn('[compress] ffmpeg binary present but failed to run, falling back to original:', err instanceof Error ? err.message : err);
    return null;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Image — convert to WebP, quality 82, max 2048px, strip private metadata
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
// Video — H.264 MP4, CRF 28, max 720p, AAC 128k, web-optimised moov atom
// ─────────────────────────────────────────────────────────────────────────────
export async function compressVideo(
  buffer: Buffer,
  mimeType: string
): Promise<CompressResult> {
  const extMap: Record<string, string> = {
    'video/mp4': 'mp4',
    'video/webm': 'webm',
    'video/quicktime': 'mov',
  };
  const inExt = extMap[mimeType] ?? 'mp4';

  const ffmpeg = await loadFfmpeg();
  if (!ffmpeg) {
    console.warn('[compress] ffmpeg not available, uploading original video');
    return { buffer, mimeType, ext: inExt };
  }

  const inPath  = path.join(tmpdir(), `hb-in-${randomUUID()}.${inExt}`);
  const outPath = path.join(tmpdir(), `hb-out-${randomUUID()}.mp4`);

  try {
    await writeFile(inPath, buffer);

    await new Promise<void>((resolve, reject) => {
      ffmpeg(inPath)
        .outputOptions('-vf', "scale='if(gt(iw,1280),1280,iw)':-2")
        .outputOptions('-c:v', 'libx264')
        .outputOptions('-crf', '28')
        .outputOptions('-preset', 'fast')
        .outputOptions('-pix_fmt', 'yuv420p')
        .outputOptions('-c:a', 'aac')
        .outputOptions('-b:a', '128k')
        .outputOptions('-movflags', '+faststart')
        .output(outPath)
        .on('end', () => resolve())
        .on('error', (err) => reject(err))
        .run();
    });

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
