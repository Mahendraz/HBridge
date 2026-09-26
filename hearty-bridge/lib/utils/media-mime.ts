/**
 * Shared MIME handling for user-uploaded media (report media, announcements).
 * Safe to import from both client components and API routes.
 *
 * iOS is the reason this exists: Safari sometimes sends camera videos/photos
 * with an empty `File.type` (or `application/octet-stream`), and iPhone
 * captures come as `.mov` (HEVC) and `.heic`, so trusting `file.type` alone
 * rejected them. The extension is used as the fallback signal.
 */

const EXT_TO_MIME: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  gif: 'image/gif',
  heic: 'image/heic',
  heif: 'image/heif',
  mp4: 'video/mp4',
  m4v: 'video/mp4',
  mov: 'video/quicktime',
  qt: 'video/quicktime',
  webm: 'video/webm',
  '3gp': 'video/3gpp',
  pdf: 'application/pdf',
};

// Non-canonical MIME strings some browsers/OSes send for the same formats.
const MIME_ALIASES: Record<string, string> = {
  'image/jpg': 'image/jpeg',
  'image/pjpeg': 'image/jpeg',
  'image/heic-sequence': 'image/heic',
  'image/heif-sequence': 'image/heif',
  'video/x-m4v': 'video/mp4',
  'video/x-quicktime': 'video/quicktime',
};

export const HEIC_MIME_TYPES = new Set(['image/heic', 'image/heif']);

export const REPORT_MEDIA_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/heic',
  'image/heif',
  'video/mp4',
  'video/webm',
  'video/quicktime',
  'video/3gpp',
]);

export const ANNOUNCEMENT_MIME_TYPES = new Set([
  ...REPORT_MEDIA_MIME_TYPES,
  'application/pdf',
]);

// `accept` attribute values. Extensions are listed alongside MIME types
// because iOS/Android pickers match on either, and .heic/.mov often only
// match by extension.
export const REPORT_MEDIA_ACCEPT =
  'image/*,video/*,.heic,.heif,.mov,.m4v,.mp4,.webm,.3gp';
export const ANNOUNCEMENT_ACCEPT = `${REPORT_MEDIA_ACCEPT},application/pdf,.pdf`;

export function getExtension(fileName: string): string {
  const dot = fileName.lastIndexOf('.');
  return dot >= 0 ? fileName.slice(dot + 1).toLowerCase() : '';
}

/**
 * Returns the canonical MIME type for an uploaded file, falling back to the
 * extension when the browser sent nothing useful.
 */
export function resolveMimeType(type: string | undefined, fileName: string): string {
  const raw = (type ?? '').toLowerCase().trim();
  const aliased = MIME_ALIASES[raw] ?? raw;
  if (aliased && aliased !== 'application/octet-stream') return aliased;
  return EXT_TO_MIME[getExtension(fileName)] ?? aliased;
}

/**
 * Extension to store an upload under, derived from its validated MIME type.
 * The client's own extension is kept only when it names that same type, so a
 * `clip.html` sent as video/mp4 is stored as `.mp4`, never `.html`.
 */
export function storageExtension(mimeType: string, fileName: string): string {
  const ext = getExtension(fileName);
  if (ext && EXT_TO_MIME[ext] === mimeType) return ext;
  const canonical = Object.keys(EXT_TO_MIME).find((key) => EXT_TO_MIME[key] === mimeType);
  return canonical ?? 'bin';
}

export function mediaKind(mimeType: string): 'image' | 'video' | 'document' {
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType.startsWith('video/')) return 'video';
  return 'document';
}
