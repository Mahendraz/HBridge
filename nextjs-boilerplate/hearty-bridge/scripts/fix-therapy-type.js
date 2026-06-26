/**
 * fix-therapy-type.js
 * Backfills therapyType on WeeklySchedule slots that are missing it,
 * using the patient's most recent topup transaction.
 */
const mongoose = require('mongoose');

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  const db = mongoose.connection.db;

  const slots = await db.collection('weeklyschedules')
    .find({ $or: [{ therapyType: null }, { therapyType: { $exists: false } }] })
    .toArray();

  console.log(`Found ${slots.length} slots missing therapyType`);

  let updated = 0;
  for (const slot of slots) {
    const childId = slot.patientId;
    if (!mongoose.isValidObjectId(childId)) continue;

    // Most recent topup with a therapyType for this child
    const tx = await db.collection('token_transactions').findOne(
      {
        childId: new mongoose.Types.ObjectId(childId),
        type: 'topup',
        therapyType: { $ne: null, $exists: true },
      },
      { sort: { createdAt: -1 } }
    );

    if (!tx?.therapyType) {
      console.log(`  Skipping ${slot.patientName} — no package with therapyType found`);
      continue;
    }

    await db.collection('weeklyschedules').updateOne(
      { _id: slot._id },
      { $set: { therapyType: tx.therapyType } }
    );

    console.log(`  ✓ ${slot.patientName} → ${tx.therapyType}`);
    updated++;
  }

  console.log(`\nDone. Updated ${updated}/${slots.length} slots.`);
  await mongoose.disconnect();
}

run().catch(err => { console.error(err); process.exit(1); });
