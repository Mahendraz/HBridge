const mongoose = require("mongoose");
mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const db = mongoose.connection.db;

  const txs = await db.collection("token_transactions").find({}).sort({ createdAt: -1 }).toArray();
  console.log("TOKEN TXS:", JSON.stringify(txs.map(t => ({
    childId: t.childId, childName: t.childName, type: t.type,
    packageType: t.packageType, therapyType: t.therapyType,
    amount: t.amount, balanceAfter: t.balanceAfter
  })), null, 2));

  const children = await db.collection("children").find({ isActive: true }).project({ name: 1, tokenBalance: 1 }).toArray();
  console.log("CHILDREN BALANCES:", JSON.stringify(children.map(c => ({ name: c.name, tokenBalance: c.tokenBalance })), null, 2));

  const ws = await db.collection("weeklyschedules").find({}).toArray();
  console.log("WEEKLY SCHEDULES:", JSON.stringify(ws.map(w => ({
    patientId: w.patientId, patientName: w.patientName, day: w.day, hour: w.hour,
    packageId: w.packageId, effectiveFrom: w.effectiveFrom
  })), null, 2));

  mongoose.disconnect();
});
