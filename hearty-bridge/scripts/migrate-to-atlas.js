/**
 * Migration script: copy all collections from local MongoDB → Atlas
 * Run via PowerShell (needs Windows localhost for local MongoDB):
 *   powershell.exe -Command "cd 'E:\Work\Hendra\HBridge\nextjs-boilerplate\hearty-bridge'; node scripts\migrate-to-atlas.js 2>&1"
 */

const mongoose = require('mongoose');

const LOCAL_URI  = 'mongodb://localhost:27017/hearty-bridge';
const ATLAS_URI  = 'mongodb+srv://nehard:ETe807uQjRZYonFs@nehard.yl6xhcq.mongodb.net/hearty-bridge';
const BATCH_SIZE = 500; // documents per insert batch

async function migrate() {
  console.log('=== Hearty Bridge — MongoDB → Atlas Migration ===\n');

  // ── 1. Connect to local ──────────────────────────────────────────────────
  console.log('Connecting to local MongoDB...');
  const localConn = await mongoose.createConnection(LOCAL_URI).asPromise();
  console.log('  ✓ Local connected\n');

  // ── 2. Connect to Atlas ──────────────────────────────────────────────────
  console.log('Connecting to MongoDB Atlas...');
  const atlasConn = await mongoose.createConnection(ATLAS_URI, {
    serverSelectionTimeoutMS: 15000,
  }).asPromise();
  console.log('  ✓ Atlas connected\n');

  const localDb  = localConn.db;
  const atlasDb  = atlasConn.db;

  // ── 3. Discover collections ──────────────────────────────────────────────
  const collections = await localDb.listCollections().toArray();
  console.log(`Found ${collections.length} collection(s) in local DB:`);
  collections.forEach(c => console.log(`  · ${c.name}`));
  console.log();

  if (collections.length === 0) {
    console.log('Nothing to migrate — local database is empty.');
    await localConn.close();
    await atlasConn.close();
    return;
  }

  let totalCopied = 0;

  // ── 4. Copy each collection ──────────────────────────────────────────────
  for (const { name } of collections) {
    const localCol = localDb.collection(name);
    const atlasCol = atlasDb.collection(name);

    const count = await localCol.countDocuments();
    process.stdout.write(`Migrating [${name}] (${count} docs)... `);

    if (count === 0) {
      console.log('skipped (empty)');
      continue;
    }

    // Drop existing data in Atlas for clean migration
    await atlasCol.deleteMany({});

    // Stream in batches
    const cursor = localCol.find({});
    let batch = [];
    let inserted = 0;

    for await (const doc of cursor) {
      batch.push(doc);
      if (batch.length >= BATCH_SIZE) {
        await atlasCol.insertMany(batch, { ordered: false });
        inserted += batch.length;
        batch = [];
      }
    }
    if (batch.length > 0) {
      await atlasCol.insertMany(batch, { ordered: false });
      inserted += batch.length;
    }

    console.log(`✓ ${inserted} docs`);
    totalCopied += inserted;
  }

  // ── 5. Verify indexes (best-effort re-create from local) ─────────────────
  console.log('\nCopying indexes...');
  for (const { name } of collections) {
    try {
      const indexes = await localDb.collection(name).indexes();
      for (const idx of indexes) {
        if (idx.name === '_id_') continue; // default, always exists
        const { key, name: idxName, unique, sparse, expireAfterSeconds } = idx;
        const opts = { name: idxName };
        if (unique) opts.unique = true;
        if (sparse) opts.sparse = true;
        if (expireAfterSeconds !== undefined) opts.expireAfterSeconds = expireAfterSeconds;
        await atlasDb.collection(name).createIndex(key, opts).catch(() => {/* ignore if already exists */});
      }
      process.stdout.write(`  [${name}] indexes copied\n`);
    } catch {
      process.stdout.write(`  [${name}] indexes skipped\n`);
    }
  }

  // ── 6. Done ──────────────────────────────────────────────────────────────
  console.log(`\n=== Migration complete: ${totalCopied} total documents copied ===`);

  await localConn.close();
  await atlasConn.close();
  process.exit(0);
}

migrate().catch(err => {
  console.error('\n[ERROR]', err.message || err);
  process.exit(1);
});
