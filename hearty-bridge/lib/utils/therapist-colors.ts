/**
 * Shared color palette for per-therapist schedule colors.
 * Keep in sync with scripts/backfill-therapist-colors.js.
 */
export const THERAPIST_COLOR_PRESETS = [
  '#14b8a6', // teal
  '#3b82f6', // blue
  '#a855f7', // purple
  '#f97316', // orange
  '#ec4899', // pink
  '#84cc16', // lime
  '#eab308', // yellow
  '#ef4444', // red
  '#06b6d4', // cyan
  '#6366f1', // indigo
];

/**
 * Picks the next color for a new therapist: the first preset not already
 * in use, or (once the palette is exhausted) the least-used preset, so
 * every therapist gets a distinct, stable color for as long as possible.
 */
export function assignTherapistColor(usedColors: (string | null | undefined)[]): string {
  const used = usedColors.filter((c): c is string => !!c).map((c) => c.toLowerCase());

  const unused = THERAPIST_COLOR_PRESETS.find(
    (preset) => !used.includes(preset.toLowerCase())
  );
  if (unused) return unused;

  const counts = new Map(THERAPIST_COLOR_PRESETS.map((preset) => [preset.toLowerCase(), 0]));
  for (const color of used) {
    if (counts.has(color)) counts.set(color, (counts.get(color) ?? 0) + 1);
  }
  return THERAPIST_COLOR_PRESETS.reduce((least, preset) =>
    (counts.get(preset.toLowerCase()) ?? 0) < (counts.get(least.toLowerCase()) ?? 0) ? preset : least
  );
}

/** Converts a `#rrggbb`/`#rgb` hex color to an `rgba(...)` string for tinted backgrounds. */
export function hexToRgba(hex: string, alpha: number): string {
  const clean = hex.replace('#', '');
  const full = clean.length === 3 ? clean.split('').map((c) => c + c).join('') : clean;
  const value = parseInt(full, 16);
  const r = (value >> 16) & 255;
  const g = (value >> 8) & 255;
  const b = value & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
