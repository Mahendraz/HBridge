const mongoose = require('mongoose');

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/hearty-bridge';

async function clearData() {
  await mongoose.connect(MONGO_URI);
  const db = mongoose.connection.db;

  const results = {};

  // Clear sessions
  const sessions = await db.collection('sessions').deleteMany({});
  results.sessions = sessions.deletedCount;

  // Clear token transactions
  const transactions = await db.collection('tokentransactions').deleteMany({});
  results.tokentransactions = transactions.deletedCount;

  // Clear weekly schedules
  const schedules = await db.collection('weeklyschedules').deleteMany({});
  results.weeklyschedules = schedules.deletedCount;

  // Reset tokenBalance and tokenExpiry on all children
  const children = await db.collection('children').updateMany(
    {},
    { $set: { tokenBalance: 0, tokenExpiry: null } }
  );
  results.childrenReset = children.modifiedCount;

  console.log('✅ Data cleared:');
  console.log(`  sessions:          ${results.sessions} deleted`);
  console.log(`  tokentransactions: ${results.tokentransactions} deleted`);
  console.log(`  weeklyschedules:   ${results.weeklyschedules} deleted`);
  console.log(`  children reset:    ${results.childrenReset} updated (tokenBalance → 0)`);

  await mongoose.disconnect();
}

clearData().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
