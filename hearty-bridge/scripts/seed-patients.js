'use strict';

/**
 * Seed script: reset patient data dan isi ulang dengan 14 parents, 18 kids,
 * 3 packages, weekly schedules, historical sessions, reports, invoices.
 *
 * Run via PowerShell:
 *   node scripts\seed-patients.js
 */

const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');
const path     = require('path');
const fs       = require('fs');

// ── Config ────────────────────────────────────────────────────────────────────

// Atlas SRV DNS (queryTxt) fails from PowerShell — use direct host URIs.
const MONGO_URI = 'mongodb://nehard:ETe807uQjRZYonFs@ac-iptwcj0-shard-00-00.yl6xhcq.mongodb.net:27017,ac-iptwcj0-shard-00-01.yl6xhcq.mongodb.net:27017,ac-iptwcj0-shard-00-02.yl6xhcq.mongodb.net:27017/hearty-bridge?authSource=admin&replicaSet=atlas-i61f2n-shard-0&tls=true';

// ── Static data ───────────────────────────────────────────────────────────────

const DAYS    = ['senin','selasa','rabu','kamis','jumat','sabtu'];
const DOW_MAP = { senin:1, selasa:2, rabu:3, kamis:4, jumat:5, sabtu:6 }; // JS getDay()

// 18 schedule slots across 6 days — day index repeats every 3 kids
// Each group of 3 uses these hours within the day
const DAY_HOURS = [
  [9, 10, 11],  // senin
  [9, 11, 13],  // selasa
  [10, 11, 13], // rabu
  [9, 10, 14],  // kamis
  [9, 11, 14],  // jumat
  [9, 10, 11],  // sabtu
];

const PARENTS = [
  { name:'Budi Santoso',    email:'budi@hbridge.id',   phone:'081234567890', kids:1 },
  { name:'Dewi Rahayu',     email:'dewi@hbridge.id',   phone:'082345678901', kids:1 },
  { name:'Ahmad Fauzi',     email:'ahmad@hbridge.id',  phone:'083456789012', kids:2 },
  { name:'Siti Nurhaliza',  email:'siti@hbridge.id',   phone:'084567890123', kids:1 },
  { name:'Hendra Kusuma',   email:'hendra@hbridge.id', phone:'085678901234', kids:2 },
  { name:'Ratna Wulandari', email:'ratna@hbridge.id',  phone:'086789012345', kids:1 },
  { name:'Doni Prasetyo',   email:'doni@hbridge.id',   phone:'087890123456', kids:2 },
  { name:'Anita Setiawan',  email:'anita@hbridge.id',  phone:'088901234567', kids:1 },
  { name:'Rudi Hermawan',   email:'rudi@hbridge.id',   phone:'089012345678', kids:2 },
  { name:'Maya Indah',      email:'maya@hbridge.id',   phone:'081234500010', kids:1 },
  { name:'Eko Wahyudi',     email:'eko@hbridge.id',    phone:'082345600011', kids:1 },
  { name:'Fitri Handayani', email:'fitri@hbridge.id',  phone:'083456700012', kids:1 },
  { name:'Agus Supriyadi',  email:'agus@hbridge.id',   phone:'084567800013', kids:1 },
  { name:'Lina Marlina',    email:'lina@hbridge.id',   phone:'085678900014', kids:1 },
];

const BOY_NAMES  = ['Radit','Farhan','Kevin','Rizky','Gilang','Farel','Dani','Bima','Aldi','Fariz'];
const GIRL_NAMES = ['Laila','Keisha','Rizka','Gita','Salsabila','Nadia','Clara','Nana','Rara','Tika'];

const DIAGNOSES = [
  'Keterlambatan bicara','Gangguan sensori','Autisme ringan',
  'Cerebral palsy ringan','Down syndrome ringan','ADHD','Dispraksia',
  'Keterlambatan perkembangan motorik','Gangguan pemrosesan sensori',
];

const REPORT_TITLES = [
  'Perkembangan Motorik Halus','Evaluasi Sesi Terapi','Progress Kemampuan Bicara',
  'Laporan Perkembangan Bulanan','Evaluasi Kemampuan Sosial','Perkembangan Kognitif',
  'Progress Integrasi Sensorik','Laporan Kemajuan Terapi',
];
const REPORT_TYPES = ['progress','assessment','therapy-notes','milestone'];
const REPORT_CONTENTS = [
  'Anak menunjukkan perkembangan yang baik dalam sesi ini. Kemampuan motorik halus meningkat.',
  'Respons terhadap stimulus sensori membaik. Program dilanjutkan sesuai rencana terapi.',
  'Terdapat peningkatan konsentrasi dan keterlibatan aktif dalam aktivitas terapi.',
  'Anak dapat mengikuti instruksi dengan lebih konsisten dibanding sesi sebelumnya.',
  'Perkembangan koordinasi tangan-mata terlihat meningkat secara signifikan.',
  'Kemampuan komunikasi verbal mengalami perbaikan. Kosa kata bertambah.',
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function oid() { return new mongoose.Types.ObjectId(); }

/**
 * Returns the date of the N-th past occurrence of targetDow (1=Mon..6=Sat).
 * weeksAgo=1 means the most recent past occurrence.
 */
function pastWeekday(targetDow, weeksAgo, hour) {
  const now   = new Date();
  const today = now.getDay(); // 0=Sun,1=Mon..6=Sat
  let diff    = today - targetDow;
  if (diff < 0) diff += 7;
  if (diff === 0 && weeksAgo === 0) diff = 0; // same weekday, this week
  const d = new Date(now);
  d.setDate(now.getDate() - diff - weeksAgo * 7);
  d.setHours(hour, 0, 0, 0);
  return d;
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log('Connecting to MongoDB Atlas...');
  await mongoose.connect(MONGO_URI, { serverSelectionTimeoutMS: 20000 });
  const db = mongoose.connection.db;
  console.log('Connected.\n');

  // 1. Read existing staff ────────────────────────────────────────────────────
  const staff      = await db.collection('users').find({ role: { $in: ['admin','super_admin','therapist'] } }).toArray();
  const therapists = staff.filter(u => u.role === 'therapist');
  const admins     = staff.filter(u => u.role === 'admin' || u.role === 'super_admin');

  if (therapists.length === 0) throw new Error('No therapists found! Create therapist accounts first.');

  console.log(`Found ${therapists.length} therapist(s):`);
  therapists.forEach(t => console.log(`  · ${t.name} (${t._id})`));
  console.log(`Found ${admins.length} admin(s):`);
  admins.forEach(a => console.log(`  · ${a.name} (${a.role})`));

  const adminDoc = admins[0];

  // 2. Clear existing patient data ────────────────────────────────────────────
  console.log('\nClearing existing patient data...');
  const cleared = await Promise.all([
    db.collection('users').deleteMany({ role: 'parent' }),
    db.collection('children').deleteMany({}),
    db.collection('weeklyschedules').deleteMany({}),
    db.collection('sessions').deleteMany({}),
    db.collection('reports').deleteMany({}),
    db.collection('packages').deleteMany({}),
    db.collection('invoices').deleteMany({}),
    db.collection('token_transactions').deleteMany({}),
  ]);
  const labels = ['parents','children','schedules','sessions','reports','packages','invoices','token_tx'];
  cleared.forEach((r, i) => console.log(`  Deleted ${r.deletedCount} ${labels[i]}`));

  // 3. Create packages ────────────────────────────────────────────────────────
  const now = new Date();
  const pkgs = [
    { _id: oid(), name:'Silver',  sessions:8,  price:1600000, therapyType:'both', description:'Paket Silver — 8 pertemuan',  isActive:true, createdBy:adminDoc._id, createdAt:now, updatedAt:now },
    { _id: oid(), name:'Gold',    sessions:12, price:2400000, therapyType:'both', description:'Paket Gold — 12 pertemuan',   isActive:true, createdBy:adminDoc._id, createdAt:now, updatedAt:now },
    { _id: oid(), name:'Diamond', sessions:16, price:3200000, therapyType:'both', description:'Paket Diamond — 16 pertemuan',isActive:true, createdBy:adminDoc._id, createdAt:now, updatedAt:now },
  ];
  await db.collection('packages').insertMany(pkgs);
  console.log('\nCreated 3 packages: Silver(8) · Gold(12) · Diamond(16)');

  // 4. Hash password ──────────────────────────────────────────────────────────
  const passwordHash = await bcrypt.hash('parent123', 10);

  // 5. Expand parent list into kid slots ─────────────────────────────────────
  const kidSlots = []; // { pData, kidIndex }
  for (const p of PARENTS) {
    for (let k = 0; k < p.kids; k++) kidSlots.push({ pData: p, kidIndex: k });
  }
  // Should be exactly 18

  // 6. Build all documents ───────────────────────────────────────────────────
  const parentDocs  = [];
  const childDocs   = [];
  const txDocs      = [];
  const schedDocs   = [];
  const sessionDocs = [];
  const reportDocs  = [];
  const invoiceDocs = [];

  // Create parent docs first (keyed by email)
  const parentMap = new Map(); // email → parentDoc
  for (let i = 0; i < PARENTS.length; i++) {
    const p = PARENTS[i];
    const doc = {
      _id: oid(),
      name: p.name,
      email: p.email,
      phone: p.phone,
      password: passwordHash,
      role: 'parent',
      isActive: true,
      profile: {},
      createdAt: new Date(now.getTime() - (PARENTS.length - i) * 5 * 24 * 3600_000),
      updatedAt: now,
    };
    parentDocs.push(doc);
    parentMap.set(p.email, doc);
  }

  // Track used (therapistId, day, hour) to avoid schedule conflicts
  const usedSlots = new Set(); // `${therapistId}_${day}_${hour}`

  let therapistRR   = 0;
  let boyNameRR     = 0;
  let girlNameRR    = 0;
  let invoiceSeq    = 1;

  for (let idx = 0; idx < kidSlots.length; idx++) {
    const { pData, kidIndex } = kidSlots[idx];
    const parentDoc = parentMap.get(pData.email);

    // Day assignment: 3 kids per day, cycling through 6 days
    const dayIdx  = Math.floor(idx / 3) % 6;
    const posInDay = idx % 3;
    const day     = DAYS[dayIdx];
    const dow     = DOW_MAP[day]; // 1=Mon..6=Sat

    // Therapist: round-robin
    const therapist = therapists[therapistRR % therapists.length];
    therapistRR++;

    // Hour: start with DAY_HOURS default, shift if conflict
    let hour = DAY_HOURS[dayIdx][posInDay];
    while (usedSlots.has(`${therapist._id}_${day}_${hour}`)) hour++;
    usedSlots.add(`${therapist._id}_${day}_${hour}`);

    // Therapy type: siblings alternate OT/TW
    const therapyType = kidIndex % 2 === 0 ? 'OT' : 'TW';

    // Package: cycle Silver → Gold → Diamond
    const pkg = pkgs[idx % 3];

    // Progress: deterministic-random between 1 and totalSessions-1
    const maxProgress = pkg.sessions - 1;
    const completed   = 1 + ((idx * 3 + idx * 7 + 5) % maxProgress);

    // Gender & name
    const gender    = idx % 2 === 0 ? 'male' : 'female';
    const firstName = gender === 'male'
      ? BOY_NAMES[boyNameRR++   % BOY_NAMES.length]
      : GIRL_NAMES[girlNameRR++ % GIRL_NAMES.length];
    const lastName  = pData.name.split(' ').slice(1).join(' ') || pData.name;
    const kidName   = `${firstName} ${lastName}`;

    // Age: 2-12 years, vary by idx
    const ageYears  = 2 + (idx % 11);
    const dob       = new Date(now);
    dob.setFullYear(dob.getFullYear() - ageYears);
    dob.setMonth(idx % 12);

    // IDs
    const kidId = oid();
    const txId  = oid(); // TokenTransaction ID — also serves as packageId link

    // startDate = when the package was bought (completedSessions+1 weeks ago)
    const startDate = new Date(now.getTime() - (completed + 1) * 7 * 24 * 3600_000);

    // ── Child ────────────────────────────────────────────────────────────────
    childDocs.push({
      _id: kidId,
      name: kidName,
      dateOfBirth: dob,
      gender,
      parentId: parentDoc._id,
      therapistId: therapist._id,
      medicalInfo: {
        conditions:  [DIAGNOSES[idx % DIAGNOSES.length]],
        medications: [],
        allergies:   [],
        notes: '',
      },
      contactInfo: {
        emergencyContact: {
          name: pData.name,
          phone: pData.phone,
          relationship: 'Orang tua',
        },
      },
      tokenBalance: pkg.sessions - completed,
      isActive: true,
      createdAt: startDate,
      updatedAt: now,
    });

    // ── TokenTransaction (topup) ─────────────────────────────────────────────
    txDocs.push({
      _id: txId,
      childId: kidId,
      childName: kidName,
      adminId: adminDoc._id,
      adminName: adminDoc.name,
      type: 'topup',
      packageType: pkg.name,
      packageId: pkg._id,
      therapyType,
      amount: pkg.sessions,
      balanceBefore: 0,
      balanceAfter: pkg.sessions,
      note: `Pembelian paket ${pkg.name} — ${therapyType}`,
      createdAt: startDate,
      updatedAt: startDate,
    });

    // ── WeeklySchedule ───────────────────────────────────────────────────────
    schedDocs.push({
      _id: oid(),
      day,
      hour,
      patientId:     kidId.toString(),
      patientName:   kidName,
      therapistId:   therapist._id.toString(),
      therapistName: therapist.name,
      therapyType,
      diagnosis:     DIAGNOSES[idx % DIAGNOSES.length],
      notes: '',
      effectiveFrom: startDate,
      packageId:     txId.toString(), // String! links to Session.packageId via toString()
      totalSessions: pkg.sessions,
      effectiveUntil: null,
      createdAt: startDate,
      updatedAt: startDate,
    });

    // ── Sessions (historical completed) ──────────────────────────────────────
    for (let s = 1; s <= completed; s++) {
      const weeksAgo   = completed - s + 1; // oldest = most weeks ago
      const sessionDate = pastWeekday(dow, weeksAgo, hour);

      sessionDocs.push({
        _id: oid(),
        childId:      kidId,
        therapistId:  therapist._id,
        date:         sessionDate,
        time:         `${String(hour).padStart(2,'0')}:00`,
        duration:     60,
        type:        'in-person',
        status:      'completed',
        rating:       3 + (s % 3), // 3, 4, or 5
        packageId:    txId,          // ObjectId! ref TokenTransaction
        sessionNumber:   s,
        totalSessions:   pkg.sessions,
        isActive: true,
        notes: `Sesi ${s} dari ${pkg.sessions}`,
        createdAt:  sessionDate,
        updatedAt:  sessionDate,
      });

      // ── Reports (~60% of sessions) ────────────────────────────────────────
      if ((s * 3 + idx * 7 + 1) % 5 < 3) { // 3/5 = 60%
        const rStatus = s % 2 === 0 ? 'completed' : 'draft';
        const rType   = REPORT_TYPES[(s + idx) % REPORT_TYPES.length];
        const rTitle  = REPORT_TITLES[(s + idx) % REPORT_TITLES.length];
        const rCreated = new Date(sessionDate.getTime() + 2 * 3600_000);

        reportDocs.push({
          _id: oid(),
          title:         `${rTitle} - Sesi ${s}`,
          description:   `Laporan sesi ke-${s} untuk ${kidName}`,
          content:        REPORT_CONTENTS[(s + idx) % REPORT_CONTENTS.length],
          type:           rType,
          status:         rStatus,
          childId:        kidId,
          childName:      kidName,
          therapistId:    therapist._id,
          therapistName:  therapist.name,
          mediaFiles: [],
          sessionDate:    sessionDate,
          sessionHour:    hour,
          tags:           [therapyType, pkg.name],
          isActive: true,
          seenBy:    [],
          reactions: [],
          createdAt: rCreated,
          updatedAt: rCreated,
        });
      }
    }

    // ── Invoice ───────────────────────────────────────────────────────────────
    // Distribution: 40% paid, 30% unpaid-visible, 20% overdue, 10% not-submitted
    const invChoice = idx % 10;
    const isPaid    = invChoice < 4;          // 0-3
    const isOverdue = invChoice >= 7 && invChoice < 9; // 7-8
    const isHidden  = invChoice === 9;        // 9 = not submitted to parent

    const dueDate = new Date(now);
    if (isOverdue) dueDate.setDate(dueDate.getDate() - 14);
    else           dueDate.setDate(dueDate.getDate() + 14);

    invoiceDocs.push({
      _id: oid(),
      invoiceNumber:        `INV-${String(invoiceSeq++).padStart(4,'0')}`,
      childId:              kidId,
      childName:            kidName,
      parentId:             parentDoc._id,
      packageTransactionId: txId,
      packageId:            pkg._id,
      packageType:          pkg.name,
      therapyType,
      sessions:             pkg.sessions,
      amount:               pkg.price,
      dueDate,
      status:    isPaid ? 'paid' : isOverdue ? 'overdue' : 'unpaid',
      paidAt:    isPaid ? new Date(now.getTime() - (idx + 1) * 2 * 24 * 3600_000) : null,
      isVisibleToParent: !isHidden,
      notes: '',
      adminId:   adminDoc._id,
      adminName: adminDoc.name,
      paymentProofKey: null,
      paymentMessage:  '',
      paymentSubmittedAt: null,
      createdAt: startDate,
      updatedAt: now,
    });
  }

  // 7. Insert everything ──────────────────────────────────────────────────────
  console.log('\nInserting data...');
  await db.collection('users').insertMany(parentDocs);
  console.log(`  ✓ ${parentDocs.length} parents`);
  await db.collection('children').insertMany(childDocs);
  console.log(`  ✓ ${childDocs.length} children`);
  await db.collection('token_transactions').insertMany(txDocs);
  console.log(`  ✓ ${txDocs.length} token transactions`);
  await db.collection('weeklyschedules').insertMany(schedDocs);
  console.log(`  ✓ ${schedDocs.length} weekly schedules`);
  await db.collection('sessions').insertMany(sessionDocs);
  console.log(`  ✓ ${sessionDocs.length} sessions`);
  await db.collection('reports').insertMany(reportDocs);
  console.log(`  ✓ ${reportDocs.length} reports`);
  await db.collection('invoices').insertMany(invoiceDocs);
  console.log(`  ✓ ${invoiceDocs.length} invoices`);

  // 8. Summary ────────────────────────────────────────────────────────────────
  console.log('\n╔══════════════════════════════════════════════╗');
  console.log('║           SEED COMPLETE ✅                   ║');
  console.log('╠══════════════════════════════════════════════╣');
  console.log('║  All parent accounts (password: parent123)   ║');
  console.log('╠══════════════════════════════════════════════╣');

  for (const p of PARENTS) {
    const padded = `${p.email} | ${p.name}`.padEnd(44);
    console.log(`║  ${padded}  ║`);
  }
  console.log('╚══════════════════════════════════════════════╝');

  console.log('\nSchedule distribution:');
  const dayCount = {};
  schedDocs.forEach(s => { dayCount[s.day] = (dayCount[s.day] || 0) + 1; });
  DAYS.forEach(d => console.log(`  ${d.padEnd(8)}: ${dayCount[d] || 0} pasien`));

  await mongoose.disconnect();
  console.log('\nDisconnected. Done.');
}

main().catch(err => {
  console.error('\n❌ Seed failed:', err.message);
  process.exit(1);
});
