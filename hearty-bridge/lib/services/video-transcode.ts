import { uploadToR2, deleteFromR2 } from '@/lib/services/r2-storage';
import { compressVideo } from '@/lib/utils/compress';

export interface TranscodedVideo {
  key: string;
  mimeType: string;
  size: number;
}

// One ffmpeg transcode at a time per process. Uploads now start the moment a
// file is picked, so several videos can land within seconds of each other —
// running their transcodes in parallel would pin every CPU core at once.
let queue: Promise<void> = Promise.resolve();

/**
 * Runs after the upload response has already been sent (callers schedule it
 * with next/server's after()). Transcodes the raw video to H.264 MP4, uploads
 * the result as `${keyPrefix}-c.mp4`, and hands it to `swap` so the owning
 * record (report media entry, announcement attachment) can point at it.
 *
 * `swap(null)` means "keep the raw file, just mark it ready" — used when
 * ffmpeg is unavailable (compressVideo returns the original buffer by
 * reference) or anything fails. `swap` returns whether the record still
 * referenced the raw key; false means the user deleted it mid-transcode, so
 * the freshly uploaded output is removed again instead of being orphaned.
 */
export function transcodeVideoInBackground(opts: {
  rawKey: string;
  rawBuffer: Buffer;
  mimeType: string;
  keyPrefix: string;
  swap: (result: TranscodedVideo | null) => Promise<boolean>;
}): Promise<void> {
  const run = queue.then(() => transcode(opts));
  queue = run.catch(() => {});
  return run;
}

async function transcode({
  rawKey,
  rawBuffer,
  mimeType,
  keyPrefix,
  swap,
}: Parameters<typeof transcodeVideoInBackground>[0]): Promise<void> {
  try {
    const compressed = await compressVideo(rawBuffer, mimeType);

    if (compressed.buffer === rawBuffer) {
      await swap(null);
      return;
    }

    const compressedKey = `${keyPrefix}-c.${compressed.ext}`;
    const uploaded = await uploadToR2(compressed.buffer, compressedKey, compressed.mimeType);
    if (!uploaded) {
      console.error('[video-transcode] compressed upload failed, keeping raw video:', rawKey);
      await swap(null);
      return;
    }

    const stillReferenced = await swap({
      key: compressedKey,
      mimeType: compressed.mimeType,
      size: compressed.buffer.length,
    });

    await deleteFromR2(stillReferenced ? rawKey : compressedKey);
  } catch (err) {
    console.error('[video-transcode] background processing failed:', err);
    try {
      await swap(null);
    } catch {
      // best-effort — the entry stays 'processing' if even this fails
    }
  }
}
