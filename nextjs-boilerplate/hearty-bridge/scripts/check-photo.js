// temporary diagnostic - remove after use
const mongoose = require('mongoose');
const MONGO_URI = process.env.MONGODB_URI;
if (!MONGO_URI) { console.error('Set MONGODB_URI env var'); process.exit(1); }
mongoose.connect(MONGO_URI).then(async () => {
  const children = await mongoose.connection.db.collection('children').find({}).project({ name: 1, photoUrl: 1 }).toArray();
  children.forEach(c => console.log(`"${c.name}": photoUrl = ${JSON.stringify(c.photoUrl)}`));
  await mongoose.disconnect();
}).catch(e => console.error('Error:', e.message));
