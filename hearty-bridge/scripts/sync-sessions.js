/**
 * sync-sessions.js
 * Generates session records for existing WeeklySchedule slots that have
 * tokenBalance > 0 but no sessions linked yet.
 */
const mongoose = require('mongoose');

const DAY_TO_IDX = { senin: 1, selasa: 2, rabu: 3, kamis: 4, jumat: 5, sabtu: 6 };

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  const db = mongoose.connection.db;

  const slots = await db.collection('weeklyschedules').find({ packageId: null }).toArray();
  console.log(`Found ${slots.length} slots with no package linked`);

  for (const slot of slots) {
    const childId = slot.patientId;
    if (!mongoose.isValidObjectId(childId)) continue;

    // Find most recent active package for this child
    const activePkg = await db.collection('token_transactions').findOne(
      { childId: new mongoose.Types.ObjectId(childId), type: 'topup', packageType: { $ne: null } },
      { sort: { createdAt: -1 } }
    );
    if (!activePkg) {
      console.log(`  Skipping ${slot.patientName} — no active package`);
      continue;
    }

    // Check if sessions already exist for this package
    const existingCount = await db.collection('sessions').countDocuments({
      packageId: activePkg._id,
      isActive: true,
    });
    if (existingCount > 0) {
      console.log(`  Skipping ${slot.patientName} — sessions already exist (${existingCount})`);
      continue;
    }

    // Compute first session date from effectiveFrom + day
    const targetDayIdx = DAY_TO_IDX[slot.day] ?? 1;
    const firstDate = new Date(slot.effectiveFrom || new Date());
    while (firstDate.getUTCDay() !== targetDayIdx) {
      firstDate.setUTCDate(firstDate.getUTCDate() + 1);
    }

    const totalSessions = activePkg.amount;
    const sessionDates = Array.from({ length: totalSessions }, (_, i) => {
      const d = new Date(firstDate);
      d.setUTCDate(firstDate.getUTCDate() + i * 7);
      return d;
    });
    const lastSessionDate = sessionDates[totalSessions - 1];

    if (!mongoose.isValidObjectId(slot.therapistId)) {
      console.log(`  Skipping ${slot.patientName} — invalid therapistId`);
      continue;
    }

    const therapistObjId = new mongoose.Types.ObjectId(slot.therapistId);
    const childObjId = new mongoose.Types.ObjectId(childId);

    const sessionDocs = sessionDates.map((d, idx) => ({
      childId: childObjId,
      therapistId: therapistObjId,
      date: d,
      time: `${String(slot.hour).padStart(2, '0')}:00`,
      duration: 60,
      type: 'in-person',
      status: 'scheduled',
      packageId: activePkg._id,
      sessionNumber: idx + 1,
      totalSessions,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    }));

    await db.collection('sessions').insertMany(sessionDocs);
    console.log(`  ✓ ${slot.patientName} — created ${totalSessions} sessions (${slot.day} ${slot.hour}:00)`);

    // Update slot: link packageId + effectiveUntil
    await db.collection('weeklyschedules').updateOne(
      { _id: slot._id },
      { $set: {
        packageId: activePkg._id.toString(),
        totalSessions,
        effectiveUntil: lastSessionDate,
      }}
    );

    // Update child tokenExpiry
    await db.collection('children').updateOne(
      { _id: childObjId },
      { $set: { tokenExpiry: lastSessionDate } }
    );

    console.log(`    First: ${sessionDates[0].toISOString().split('T')[0]}, Last: ${lastSessionDate.toISOString().split('T')[0]}`);
  }

  console.log('\nDone.');
  await mongoose.disconnect();
}

run().catch(err => { console.error(err); process.exit(1); });
