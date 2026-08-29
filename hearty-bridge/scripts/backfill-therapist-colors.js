/**
 * backfill-therapist-colors.js
 * Assigns a schedule color to every therapist who doesn't have one yet,
 * so the weekly schedule shows a consistent color per therapist instead
 * of only the ones an admin happened to edit manually.
 *
 * Keep THERAPIST_COLOR_PRESETS in sync with lib/utils/therapist-colors.ts.
 */
const mongoose = require('mongoose');

const THERAPIST_COLOR_PRESETS = [
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

function nextColor(usedColors) {
  const used = usedColors.filter(Boolean).map((c) => c.toLowerCase());
  const unused = THERAPIST_COLOR_PRESETS.find((preset) => !used.includes(preset.toLowerCase()));
  if (unused) return unused;

  const counts = new Map(THERAPIST_COLOR_PRESETS.map((preset) => [preset.toLowerCase(), 0]));
  for (const color of used) {
    if (counts.has(color)) counts.set(color, counts.get(color) + 1);
  }
  return THERAPIST_COLOR_PRESETS.reduce((least, preset) =>
    counts.get(preset.toLowerCase()) < counts.get(least.toLowerCase()) ? preset : least
  );
}

async function run() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/hearty-bridge');
  const db = mongoose.connection.db;

  const therapists = await db.collection('users')
    .find({ role: 'therapist' })
    .sort({ createdAt: 1 })
    .toArray();

  console.log(`Found ${therapists.length} therapist(s)`);

  const usedColors = therapists.map((t) => t.profile?.color).filter(Boolean);
  let assigned = 0;

  for (const t of therapists) {
    if (t.profile?.color) {
      console.log(`  - ${t.name}: already has ${t.profile.color}`);
      continue;
    }
    const color = nextColor(usedColors);
    usedColors.push(color);

    await db.collection('users').updateOne(
      { _id: t._id },
      { $set: { 'profile.color': color } }
    );
    console.log(`  + ${t.name}: assigned ${color}`);
    assigned++;
  }

  console.log(`\nDone. Assigned colors to ${assigned}/${therapists.length} therapist(s).`);
  await mongoose.disconnect();
}

run().catch((err) => { console.error(err); process.exit(1); });
