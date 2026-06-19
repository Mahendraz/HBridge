import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

// ---------------------------------------------------------------------------
// Client singleton
// ---------------------------------------------------------------------------
function createR2Client() {
  const endpoint  = process.env.R2_ENDPOINT;
  const keyId     = process.env.R2_ACCESS_KEY_ID;
  const secretKey = process.env.R2_SECRET_ACCESS_KEY;

  if (!endpoint || !keyId || !secretKey) {
    throw new Error(
      'Missing Cloudflare R2 env vars: R2_ENDPOINT, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY'
    );
  }

  return new S3Client({
    endpoint,
    region: 'auto', // R2 uses "auto" as region
    // forcePathStyle is required for Cloudflare R2 — without it the SDK prepends
    // the bucket name to the hostname which R2 does not support via the API endpoint
    forcePathStyle: true,
    credentials: { accessKeyId: keyId, secretAccessKey: secretKey },
  });
}

// ---------------------------------------------------------------------------
// Upload — returns the object key on success, or null on failure
// ---------------------------------------------------------------------------
export async function uploadToR2(
  buffer: Buffer,
  key: string, // e.g. "reports/64abc.../1700000000-photo.jpg"
  contentType: string
): Promise<string | null> {
  try {
    const client = createR2Client();

    await client.send(
      new PutObjectCommand({
        Bucket:      process.env.R2_BUCKET_NAME!,
        Key:         key,
        Body:        buffer,
        ContentType: contentType,
      })
    );

    return key;
  } catch (err) {
    console.error('R2 upload error:', err);
    return null;
  }
}

// ---------------------------------------------------------------------------
// Delete — best-effort, never throws
// ---------------------------------------------------------------------------
export async function deleteFromR2(key: string): Promise<void> {
  try {
    const client = createR2Client();

    await client.send(
      new DeleteObjectCommand({
        Bucket: process.env.R2_BUCKET_NAME!,
        Key:    key,
      })
    );
  } catch (err) {
    console.warn('R2 delete warning:', err);
  }
}

// ---------------------------------------------------------------------------
// Check if file exists
// ---------------------------------------------------------------------------
export async function existsInR2(key: string): Promise<boolean> {
  try {
    const client = createR2Client();

    await client.send(
      new HeadObjectCommand({
        Bucket: process.env.R2_BUCKET_NAME!,
        Key:    key,
      })
    );
    return true;
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// Generate a pre-signed URL — valid for 1 hour by default
// ---------------------------------------------------------------------------
export async function getR2SignedUrl(
  key: string,
  expiresInSeconds = 3600
): Promise<string | null> {
  try {
    const client = createR2Client();

    const url = await getSignedUrl(
      client,
      new GetObjectCommand({
        Bucket: process.env.R2_BUCKET_NAME!,
        Key:    key,
      }),
      { expiresIn: expiresInSeconds }
    );

    return url;
  } catch (err) {
    console.error('R2 signed URL error:', err);
    return null;
  }
}
