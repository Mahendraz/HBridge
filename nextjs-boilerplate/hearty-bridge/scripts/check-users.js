const mongoose = require('mongoose');

async function run() {
  await mongoose.connect('mongodb://localhost:27017/hearty-bridge');
  const db = mongoose.connection.db;
  
  const users = await db.collection('users').find(
    { role: { $in: ['admin', 'therapist'] } },
    { projection: { password: 0, __v: 0 } }
  ).toArray();
  
  console.log(`\nFound ${users.length} admin/therapist user(s):\n`);
  users.forEach(u => {
    console.log('='.repeat(50));
    console.log(JSON.stringify(u, null, 2));
  });

  // Also show total users by role
  const allRoles = await db.collection('users').aggregate([
    { $group: { _id: '$role', count: { $sum: 1 } } }
  ]).toArray();
  console.log('\n--- All Users by Role ---');
  allRoles.forEach(r => console.log(`  ${r._id}: ${r.count}`));

  await mongoose.disconnect();
}

run().catch(console.error);
