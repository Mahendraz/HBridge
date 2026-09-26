/**
 * measure-db-latency.js
 * Measures how long the app waits on MongoDB, to find where page delay comes from:
 * cold connect (DNS SRV + TLS + auth), a bare round trip (ping), and a small real query.
 * Also prints the cluster's provider/region from the Atlas replica set tags.
 *
 * Read-only. Run from hearty-bridge/:
 *   node --env-file=.env.local scripts/measure-db-latency.js
 */
const mongoose = require('mongoose');

const RUNS = 10;

function stats(samples) {
  const sorted = [...samples].sort((a, b) => a - b);
  const avg = samples.reduce((sum, v) => sum + v, 0) / samples.length;
  return `min ${sorted[0].toFixed(0)}ms | avg ${avg.toFixed(0)}ms | max ${sorted[sorted.length - 1].toFixed(0)}ms`;
}

async function time(fn) {
  const start = performance.now();
  await fn();
  return performance.now() - start;
}

async function main() {
  if (!process.env.MONGODB_URI) {
    throw new Error('MONGODB_URI is not set. Run with: node --env-file=.env.local scripts/measure-db-latency.js');
  }

  const connectMs = await time(() =>
    mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 10000, family: 4 })
  );
  console.log(`Cold connect (DNS + TLS + auth): ${connectMs.toFixed(0)}ms`);

  const db = mongoose.connection.db;
  const hello = await db.admin().command({ hello: 1 });
  const tags = hello.tags || {};
  console.log(`Server: ${hello.me || 'unknown'}`);
  console.log(`Provider/region: ${tags.provider || '?'} / ${tags.region || '? (not an Atlas cluster, or tags hidden)'}`);

  const pings = [];
  for (let i = 0; i < RUNS; i++) {
    pings.push(await time(() => db.admin().command({ ping: 1 })));
  }
  console.log(`Ping round trip x${RUNS}: ${stats(pings)}`);

  const queries = [];
  for (let i = 0; i < RUNS; i++) {
    queries.push(await time(() => db.collection('users').findOne({}, { projection: { _id: 1 } })));
  }
  console.log(`users.findOne x${RUNS}: ${stats(queries)}`);

  const avgPing = pings.reduce((sum, v) => sum + v, 0) / RUNS;
  console.log(`\nA page doing 5 sequential queries spends ~${(avgPing * 5).toFixed(0)}ms on network alone.`);
}

main()
  .catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  })
  .finally(() => mongoose.disconnect());
