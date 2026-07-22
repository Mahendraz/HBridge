/**
 * Simulates GET /api/weekly-schedule for the current week to find errors.
 */
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');

function loadEnv() {
  const envPath = path.join(__dirname, '..', '.env.local');
  if (!fs.existsSync(envPath)) return;
  const lines = fs.readFileSync(envPath, 'utf-8').split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx < 0) continue;
    process.env[trimmed.slice(0, eqIdx).trim()] = trimmed.slice(eqIdx + 1).trim().replace(/^['"]|['"]$/g, '');
  }
}
loadEnv();

function getMondayOfWeek(dateStr) {
  const base = dateStr ? new Date(dateStr + 'T00:00:00Z') : new Date();
  const day = base.getUTCDay();
  const toMon = day === 0 ? -6 : 1 - day;
  const mon = new Date(base);
  mon.setUTCDate(base.getUTCDate() + toMon);
  mon.setUTCHours(0, 0, 0, 0);
  return mon;
}

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const db = mongoose.connection.db;
  const weekStart = getMondayOfWeek(); // current week
  const weekEnd = new Date(weekStart);
  weekEnd.setUTCDate(weekStart.getUTCDate() + 6);
  weekEnd.setUTCHours(23, 59, 59, 999);

  console.log(`\nChecking week: ${weekStart.toISOString().split('T')[0]} to ${weekEnd.toISOString().split('T')[0]}`);

  // 1. Get all active slots
  const allSlots = await db.collection('weeklyschedules').find({
    $and: [
      { $or: [{ effectiveFrom: null }, { effectiveFrom: { $lte: weekStart } }] },
      { $or: [{ effectiveUntil: null }, { effectiveUntil: { $gte: weekStart } }] },
    ],
  }).toArray();

  console.log(`\nActive slots for this week: ${allSlots.length}`);

  const packageSlots = allSlots.filter(s => s.packageId);
  console.log(`Package-bound slots: ${packageSlots.length}`);

  // 2. Try to create ObjectIds from packageIds
  console.log('\nTesting ObjectId conversion for each packageId:');
  let hasError = false;
  for (const s of packageSlots) {
    try {
      const oid = new mongoose.Types.ObjectId(s.packageId);
      console.log(`  OK: ${s.patientName} | ${s.packageId} → ${oid}`);
    } catch (e) {
      console.log(`  ERROR: ${s.patientName} | packageId="${s.packageId}" → ${e.message}`);
      hasError = true;
    }
  }

  if (hasError) {
    console.log('\n⚠ Invalid packageId values found above — these cause the 500 error.');
    await mongoose.disconnect();
    return;
  }

  // 3. Try the aggregation
  const packageIds = packageSlots.map(s => new mongoose.Types.ObjectId(s.packageId));
  console.log('\nRunning completedAgg...');
  try {
    const completedAgg = await db.collection('sessions').aggregate([
      { $match: { packageId: { $in: packageIds }, status: 'completed', isActive: true } },
      { $group: { _id: '$packageId', count: { $sum: 1 } } },
    ]).toArray();
    console.log(`  completedAgg returned ${completedAgg.length} rows`);
  } catch (e) {
    console.log(`  ERROR in completedAgg: ${e.message}`);
  }

  console.log('\nRunning weekSessions query...');
  try {
    const weekSessions = await db.collection('sessions').find({
      packageId: { $in: packageIds },
      date: { $gte: weekStart, $lte: weekEnd },
      isActive: true,
    }).toArray();
    console.log(`  weekSessions returned ${weekSessions.length} rows`);
    for (const s of weekSessions) {
      console.log(`    ${s.packageId} | session ${s.sessionNumber}/${s.totalSessions} | date=${s.date?.toISOString()?.split('T')[0]}`);
    }
  } catch (e) {
    console.log(`  ERROR in weekSessions query: ${e.message}`);
  }

  console.log('\n✓ GET simulation completed without crash.');
  await mongoose.disconnect();
}).catch(e => { console.error('Connection error:', e.message); process.exit(1); });
