# Task Breakdown - Demo 3 Feedback (Detail Penuh per POV)

Dokumen pendamping teknis untuk [`UPDATE_CHECKLIST.md`](./UPDATE_CHECKLIST.md). Setiap item sudah dicek langsung ke kode aktual di `hearty-bridge/` (bukan asumsi) — mencantumkan file/baris persis, kenapa rusak, dan langkah konkret cara memperbaikinya.

> Base path kode: `hearty-bridge/` (Next.js App Router — `app/`, `components/`, `models/`, `lib/`)

**3 hal muncul berulang di banyak item lintas POV** — kalau dikerjakan, kerjakan sekali sebagai fitur infrastruktur, bukan diperbaiki satu-satu:
- **Sistem Notifikasi** — belum ada sama sekali di codebase (dipakai di Parent #1/#2, Terapis #5, Admin #9)
- **Sistem PDF/Invoice Template** — belum ada library PDF apapun (dipakai di Parent #7/#8, Super Admin #4)
- **Pola layout mobile responsif** — dua pola berbeda, dua-duanya gagal di HP portrait (dipakai di Terapis #1/#2)

Setiap kemunculannya ditandai 🔗 di bawah dan dijelaskan detail di tempat pertama munculnya.

---

## 1. POV Orang Tua (Parent)

### 1.1 Notifikasi invoice tidak muncul di dashboard 🔗 *Sistem Notifikasi*
**Yang salah sekarang:** Tidak ada mekanisme notifikasi invoice sama sekali. `app/dashboard/page.tsx` (`ParentMainContent`, baris 718-814) cuma render "Laporan Minggu Ini" dan "Jadwal Hari Ini & Mendatang" — tidak menyentuh invoice. `app/api/dashboard/stats/route.ts` → `parentStats()` (baris 390-457) tidak pernah query `Invoice`. Model `Invoice` juga tidak punya flag "sudah dilihat/belum".

**Kenapa rusak:** Fitur belum pernah dibangun — tidak ada field untuk menandai invoice "baru/belum dilihat", tidak ada widget untuk menampilkannya.

**File yang perlu diubah:**
- `models/Invoice.ts` — tambah field `seenByParentAt: Date | null`
- `app/api/dashboard/stats/route.ts` (`parentStats`)
- `app/dashboard/page.tsx` (`ParentMainContent`)

**Cara perbaikinnya:**
1. Tambah field `seenByParentAt: Date | null` (default `null`) ke schema `Invoice`.
2. Di `parentStats()`, hitung `unseenInvoiceCount` = jumlah invoice milik anak-anak parent tersebut yang `isVisibleToParent: true && seenByParentAt: null`.
3. Tampilkan sebagai badge/callout di dashboard yang link ke `/dashboard/invoices`.
4. Saat parent membuka halaman `/dashboard/invoices`, panggil endpoint baru (atau extend `GET /api/invoices`) untuk set `seenByParentAt = now()` pada invoice yang baru dibuka.
5. **Idealnya** ini jadi salah satu jenis event di Sistem Notifikasi umum (lihat 1.2), bukan widget berdiri sendiri — supaya "invoice baru" juga muncul di lonceng notifikasi.

**Effort:** M

---

### 1.2 Lonceng notifikasi umum tidak tersedia 🔗 *Sistem Notifikasi (epic utama)*
**Yang salah sekarang:** Dikonfirmasi lewat pencarian menyeluruh — tidak ada icon lonceng, tidak ada dropdown notifikasi, tidak ada model `Notification` di manapun. Satu-satunya hal yang mirip notifikasi adalah badge kecil jumlah komentar belum selesai di `components/layout/dashboard-sidebar.tsx` (baris 57-72), tapi itu **hanya untuk role dengan permission `reports:resolve_comment`** (terapis/admin) dan cuma nge-badge menu "Laporan" — bukan lonceng umum. `components/layout/header.tsx` sengaja `return null` di semua rute `/dashboard/*` (baris 24), dan `dashboard-layout.tsx` tidak punya top bar sama sekali.

**Kenapa rusak:** Bukan bug — memang belum pernah dibangun sama sekali. Ini pekerjaan fitur baru dari nol.

**File yang perlu dibuat/diubah:**
- Baru: `models/Notification.ts`
- Baru: `app/api/notifications/route.ts` (GET list) + endpoint mark-as-read
- Baru: `components/layout/notification-bell.tsx`
- `components/layout/dashboard-sidebar.tsx` atau `dashboard-layout.tsx` — tempat memasang lonceng
- Titik pemicu (trigger) yang sudah ada datanya, tinggal ditambah efek samping: `POST /api/reports/[id]/comments`, `PATCH /api/invoices/[id]`, `POST /api/reports`

**Cara perbaikinnya (bertahap):**
1. Buat model `Notification`: `{ recipientId, type: 'new_invoice'|'new_comment'|'new_report', title, body, link, isRead: boolean, createdAt }`.
2. Di titik-titik pemicu yang sudah ada di atas, tambahkan satu baris `Notification.create({...})` setelah aksi utamanya berhasil (misal setelah comment berhasil dibuat, buat notif untuk pihak lain — terapis kalau yang komentar parent, parent kalau yang komentar terapis).
3. Buat `GET /api/notifications?unread=true` dan `PATCH /api/notifications/[id]/read`.
4. Buat komponen `NotificationBell` — icon lonceng + badge angka + dropdown list — dipasang di sidebar/layout untuk semua role (bukan cuma admin/terapis).
5. Untuk update "real-time tanpa refresh" (lihat juga Admin #4.9): mulai dengan polling `setInterval` tiap 15-30 detik di komponen bell tsb — sudah cukup untuk kebutuhan "muncul otomatis tanpa refresh manual". Kalau ingin benar-benar instan, baru pertimbangkan Server-Sent Events/WebSocket (effort jauh lebih besar, sarankan fase 2 terpisah).

**Effort:** M (model + endpoint + polling) → L (kalau langsung real-time push)

---

### 1.3 Ganti "Halo Citra..." → "Halo Parent" + perbesar font
**Yang salah sekarang:** `app/dashboard/page.tsx`, baris 208-218:
```tsx
<h1 className="text-xl font-bold text-gray-900">
  Selamat datang kembali, {user?.name?.split(" ")[0]}!
</h1>
```
Baris ini dipakai untuk **semua role** (admin/super_admin/terapis/parent) dan selalu menampilkan nama depan user.

**Kenapa perlu diubah:** Klien minta khusus role parent, sapaan digenerikkan (bukan nama personal) dan fontnya diperbesar dari `text-xl` (20px) saat ini.

**File:** `app/dashboard/page.tsx` (baris 199-220)

**Cara perbaikinnya:**
1. Tambah kondisi `role === "parent"` — kalau parent, render teks statis (misal `"Halo Parent"` atau `"Halo, Orang Tua/Wali!"` — konfirmasi dulu ke klien mau teks Indonesia atau literal Inggris).
2. Role lain (admin/super_admin/terapis) tetap pakai sapaan bernama seperti sekarang.
3. Naikkan ukuran font khusus heading ini, misal `text-2xl md:text-3xl` (klien cuma bilang "perbesar", belum kasih ukuran pasti — pakai ukuran ini dulu lalu minta feedback visual).

**Effort:** S

---

### 1.4 Tanggal janji temu hilang di dashboard
**Yang salah sekarang:** Di `ParentMainContent` bagian "Jadwal Hari Ini & Mendatang" (baris 769-811), yang dirender cuma nama hari (`DAY_LABELS[apt.day]`, misal "Senin") dan jam (`slotTime(apt.hour)`) — tidak ada tanggal kalender. Interface `UpcomingScheduleItem` (baris 75-83) memang tidak punya field `date` sama sekali.

**Kenapa rusak:** `WeeklySchedule` adalah **template mingguan berulang** (cuma nyimpan field `day`, bukan tanggal konkret), dan `parentStats()` di `app/api/dashboard/stats/route.ts` (baris 390-457) tidak pernah menghitung "tanggal aktual kemunculan berikutnya" dari template itu.

**File yang perlu diubah:**
- `app/api/dashboard/stats/route.ts` (`parentStats`)
- `app/dashboard/page.tsx` (interface `UpcomingScheduleItem` baris 75-83, render baris 779-801)

**Cara perbaikinnya:**
1. Perhitungan "tanggal kemunculan berikutnya dari nama hari" **sudah ada** dan dipakai untuk terapis di fungsi `therapistStats()` (baris 340-357, dengan logic `DAY_ORDER.indexOf(day)` diproyeksikan maju dari hari ini). Reuse logic yang sama persis di `parentStats()`.
2. Tambahkan field `date: string (YYYY-MM-DD)` ke tiap item `upcomingSchedule` yang dikembalikan API.
3. Di frontend, tambahkan `date` ke interface `UpcomingScheduleItem`, lalu render, misal: `new Date(apt.date + "T00:00:00").toLocaleDateString("id-ID", {weekday:"long", day:"numeric", month:"short"})` di samping/pengganti nama hari yang sudah ada.

**Effort:** S–M

---

### 1.5 Widget "Sisa Sesi Anda" dengan font besar
**Yang salah sekarang:** Tidak ada widget ini di `ParentMainContent`. Tapi logika hitung sisa sesi **sudah ada** di tempat lain: `app/api/children/[id]/tokens/route.ts` (baris 89-102) sudah menghitung `remainingSessions` per paket/transaksi topup (`Math.max(0, amount - used)`), dan sudah dipakai di `app/dashboard/schedules/page.tsx` (baris 504, 530) untuk keperluan assignment paket.

**Kenapa rusak:** Perhitungannya sudah ada tapi cuma per-anak lewat endpoint admin-oriented (`/api/children/[id]/tokens`), belum ada versi agregat untuk ditampilkan di dashboard parent.

**File yang perlu diubah:**
- `app/api/dashboard/stats/route.ts` (`parentStats`) — tambah agregasi
- `app/dashboard/page.tsx` (`ParentMainContent`) — widget baru
- Referensi logic: `app/api/children/[id]/tokens/route.ts`

**Cara perbaikinnya:**
1. Di `parentStats()`, untuk tiap anak milik parent tsb, query `TokenTransaction` (topup, terapi) + hitung jumlah sesi `Session` yang sudah completed (pola yang sama seperti fungsi `buildCompletedCountByPackage` yang sudah ada di tempat lain) untuk menghitung total sisa sesi per anak (dijumlahkan lintas paket aktif).
2. Kembalikan sebagai `sessionBalances: [{ childId, childName, remaining }]`.
3. Tambahkan card/widget baru "Sisa Sesi Anda" di `ParentMainContent`, tampilkan angka per anak dengan font besar-tebal (misal `text-4xl font-bold`), gaya visual serupa `AdminStatsCards` (baris 319-403) tapi disederhanakan.

**Effort:** M

---

### 1.6 Dual tanggal laporan (tanggal sesi vs tanggal upload)
**Yang salah sekarang:** `models/Report.ts` sudah punya `sessionDate` (baris 38, kapan terapi berlangsung) dan otomatis punya `createdAt` (dari `timestamps: true`, baris 121) — tapi tidak ada field eksplisit "tanggal upload". Di UI:
- List view (`ReportListItem`, baris 1039-1046) cuma tampilkan satu kolom "Tgl Sesi" (`report.sessionDate`).
- Grid view (`ReportCard`, baris 1142-1147) cuma satu baris tanggal (`sessionDate ?? dueDate`).
- Hanya dialog detail (`ReportViewDialog`, baris 597-613) yang sudah menampilkan **dua-duanya** ("Tanggal Dibuat" dari `createdAt` dan "Tanggal Sesi" dari `sessionDate`).

**Kenapa rusak:** List/grid (tampilan utama yang paling sering dilihat parent) cuma tampilkan satu tanggal, jadi klien mengira cuma ada satu tanggal (dan salah label).

**File:** `app/dashboard/reports/page.tsx` (`ReportListItem` baris 1000-1076, `ReportCard` baris 1079-1197)

**Cara perbaikinnya:**
1. **Tidak perlu ubah schema** — `createdAt` sudah cukup reliable dipakai sebagai "Tanggal Upload" (kecuali klien maunya spesifik tanggal file media di-attach, bukan tanggal report dibuat — kalau begitu pakai `mediaFiles[0].uploadedAt` yang juga sudah ada per-file di model, tapi ini butuh konfirmasi ke klien dulu; rekomendasi pakai `createdAt` karena tidak perlu perubahan backend).
2. Tambahkan kolom/baris kedua di list view dan grid view untuk menampilkan tanggal upload di samping tanggal sesi yang sudah ada.
3. Perjelas label: "Tgl Sesi" vs "Tgl Upload" (saat ini di list view labelnya ambigu, cuma "Tgl Sesi").

**Effort:** S

---

### 1.7 Template download Laporan Harian 🔗 *Sistem PDF (epic)*
**Yang salah sekarang:** Tombol "Unduh" di `ReportListItem` (baris 1002, 1068-1072) dan `ReportCard` (baris 1082, 1180-1190) **tidak generate dokumen apapun** — cuma menghitung `downloadUrl = report.mediaFiles?.[0]?.url ?? report.fileUrl` lalu `window.open(downloadUrl, "_blank")`. Artinya "download" = buka file media pertama yang di-upload terapis (bisa jadi foto/video, bukan dokumen laporan). Kalau report tidak punya media sama sekali, tombolnya bahkan tidak muncul. Tidak ada library PDF apapun di `package.json`.

**Kenapa rusak:** Fitur "generate dokumen laporan" belum pernah dibangun — yang ada sekarang cuma jalan pintas ke file mentah.

**File yang perlu dibuat/diubah:**
- `package.json` — tambah dependency
- Baru: `components/reports/report-pdf-template.tsx`
- Baru: `app/api/reports/[id]/pdf/route.ts`
- `app/dashboard/reports/page.tsx` — ganti target tombol unduh
- Sumber data: `models/Report.ts` (title, description, content, sessionDate, therapistName, childName, mediaFiles)

**Cara perbaikinnya:**
1. Tambah dependency `@react-pdf/renderer` (murni JS, tidak butuh headless browser — cocok jalan di Next.js API route/serverless, berbeda dengan `puppeteer` yang butuh environment browser).
2. Desain satu template komponen PDF: header/logo klinik, nama anak, terapis, tanggal sesi, tanggal upload, isi/catatan laporan, thumbnail media kalau memungkinkan.
3. Buat endpoint `GET /api/reports/[id]/pdf` yang generate dan stream PDF-nya.
4. Ganti tombol "Unduh Laporan Harian" supaya mengarah ke endpoint baru ini, bukan `mediaFiles[0].url`.
5. **Kerjakan bareng dengan 1.8** (download invoice) karena infrastrukturnya (library PDF, endpoint pattern) sama persis — lebih hemat dikerjakan sekali jalan.

**Effort:** L (perlu embed thumbnail media, layout lebih kompleks dari invoice)

---

### 1.8 Download invoice tidak berfungsi 🔗 *Sistem PDF (epic)*
**Yang salah sekarang:** Di `app/dashboard/invoices/page.tsx`, tampilan parent (baris 242-368) menampilkan card invoice (jumlah, jatuh tempo, status, upload bukti bayar) **tapi sama sekali tidak ada tombol "Download"/"Unduh Invoice"**. Tidak ada endpoint PDF/export untuk invoice di `app/api/invoices/*`.

**Kenapa rusak:** Sama seperti 1.7 — belum pernah dibangun. "Broken" yang dilaporkan klien kemungkinan karena mereka berekspektasi fitur ini ada (mungkin dari mockup desain) padahal di kode belum ada tombolnya sama sekali.

**File yang perlu dibuat/diubah:**
- Baru: `components/invoices/invoice-pdf-template.tsx`
- Baru: `app/api/invoices/[id]/pdf/route.ts`
- `app/dashboard/invoices/page.tsx` — tambah tombol "Unduh Invoice" di card parent
- Referensi gaya visual: `docs/INVOICE_TEMPLATE.md` yang **sudah ada** — tapi itu template billing kontrak developer ke klien (Termin 1-4), **bukan** invoice pasien, jadi cuma dipakai sebagai referensi gaya header/nomor invoice, bukan dipakai langsung

**Cara perbaikinnya:**
1. Reuse library PDF yang sama dengan 1.7 (`@react-pdf/renderer`).
2. Desain template invoice pasien: nomor invoice, data klinik, nama anak/orang tua, breakdown paket/jenis terapi/jumlah sesi, total harga, tanggal jatuh tempo, status bayar.
3. Buat `GET /api/invoices/[id]/pdf`, auth-gated sama seperti `GET /api/invoices/[id]` yang sudah ada (parent cuma bisa akses invoice miliknya sendiri).
4. Tambahkan tombol "Unduh Invoice" di tiap card invoice parent.

**Effort:** M (lebih sederhana dari 1.7 karena datanya lebih terstruktur, tidak perlu embed media)

---

### 1.9 Styling komentar — background abu-abu perlu dirapikan
**Yang salah sekarang:** Di `ReportViewDialog` (`app/dashboard/reports/page.tsx`, baris 723-863): komentar yang sudah selesai (`resolved`) pakai `bg-gray-50 opacity-60` (baris 744) — kesannya pudar/washed-out. Reply/balasan bersarang pakai kotak abu-abu flat: `<div className="flex-1 bg-gray-50 rounded-lg px-3 py-2">` (baris 823). Blok "Isi Laporan" di atasnya juga pakai `bg-gray-50` (baris 591) yang bikin dua elemen berbeda terlihat serupa dan membingungkan secara visual.

**Kenapa perlu diubah:** Murni masalah visual/CSS, bukan bug fungsional — klien merasa tampilannya "kurang rapi".

**File:** `app/dashboard/reports/page.tsx` (baris 741-836)

**Cara perbaikinnya:**
1. Ganti kotak abu-abu solid pada reply dengan treatment lebih halus, misal background putih + `border-l-2 border-teal-100 pl-3` (garis aksen kiri) alih-alih fill abu-abu penuh.
2. Untuk komentar resolved, jangan pakai `opacity-60` (kesan pudar/mati) — pakai badge kecil "Selesai" saja dengan teks normal, supaya tetap terbaca jelas tapi tetap terlihat beda dari yang belum selesai.
3. Karena "ugly" itu subjektif, sebaiknya buat 1 mockup/preview dulu dan minta approval visual dari klien sebelum di-hardcode ke banyak tempat.

**Effort:** S

---

### 1.10 Icon notifikasi komentar tampil ke parent (seharusnya cuma terapis/admin)
**Yang salah sekarang:** Ada 2 mekanisme terkait, satu sudah benar satu belum:
1. **Badge di sidebar** (`dashboard-sidebar.tsx`, baris 62-72) — **sudah benar**, dibungkus permission check `reports:resolve_comment` yang memang tidak dimiliki parent.
2. **Bug-nya di sini**: badge `unresolvedCommentCount` per-laporan di list/grid ditampilkan **tanpa pengecekan permission** untuk semua role termasuk parent:
   - `ReportListItem`, baris 1021-1026
   - `ReportCard`, baris 1163-1168
   Backend `app/api/reports/route.ts` (baris 75-94) juga menghitung dan mengirim `unresolvedCommentCount` ke semua role tanpa filter, termasuk ke response yang diterima parent.

**Kenapa rusak:** Inkonsistensi — badge sidebar sudah dikasih permission guard, tapi badge di list/grid laporan lupa dikasih guard yang sama.

**File:** `app/dashboard/reports/page.tsx` (baris 1021-1026 dan 1163-1168), opsional `app/api/reports/route.ts` (baris 91-94)

**Cara perbaikinnya:**
1. Bungkus kedua render badge tsb dengan `usePermissions().hasPermission('reports:resolve_comment')` — permission yang sama yang sudah dipakai untuk `canResolve` (baris 532) dan badge sidebar.
2. Untuk keamanan berlapis (defense in depth), di `app/api/reports/route.ts`, jangan sertakan field `unresolvedCommentCount` sama sekali di response kalau `user.role === 'parent'`.

**Effort:** S

---

## 2. POV Super Admin

### 2.1 Edit Paket Asesmen error "invalid" — BUG KONKRET
**Yang salah sekarang:** Form frontend (`app/dashboard/super-admin/packages/page.tsx`, `handleSave()` baris 108-135) selalu mengirim seluruh objek form termasuk `therapyType`, baik saat create maupun edit. Skema Zod untuk **create** (`app/api/super-admin/packages/route.ts` baris 9-15) sudah benar (`therapyType: z.enum(['OT','TW','both','assessment'])`), TAPI skema Zod untuk **update** salah:
```ts
// app/api/super-admin/packages/[id]/route.ts, baris 14-21
const updateSchema = z.object({
  ...
  therapyType: z.enum(['OT', 'TW', 'both']).optional(),   // <-- 'assessment' KELUPAAN
  ...
});
```

**Kenapa rusak:** Setiap kali Super Admin membuka dialog edit pada paket yang `therapyType === 'assessment'` lalu klik "Simpan Perubahan", body PUT berisi `therapyType: "assessment"`. `updateSchema.safeParse` gagal, API balikin `ErrorResponse.badRequest('Invalid input', ...)` — inilah pesan "Invalid" yang dilihat user.

**File:** `app/api/super-admin/packages/[id]/route.ts` (baris 18)

**Cara perbaikinnya:**
1. Ubah baris 18 jadi: `therapyType: z.enum(['OT', 'TW', 'both', 'assessment']).optional(),`
2. Opsional (konsistensi): route CREATE punya validasi tambahan "kalau `assessment`, `sessions` harus `1`" — route UPDATE belum punya validasi yang sama, sebaiknya ditambahkan juga supaya tidak ada celah lewat jalur edit.

**Effort:** S (perbaikan 1 baris + validasi tambahan opsional)

---

### 2.2 Gabungkan Paket OT & TW jadi satu tipe
**Yang salah sekarang:** Model `Package` (`models/Package.ts` baris 13) **sudah mendukung** `therapyType: 'OT' | 'TW' | 'both' | 'assessment'`, dan opsi `'both'` ("OT & TW") **sudah bisa dipilih hari ini** di UI create package Super Admin (`app/dashboard/super-admin/packages/page.tsx` baris 317-332, label "OT & TW"). Jadi datamodel dan UI create **sudah mendukung** paket gabungan.

Masalah sebenarnya: OT-only dan TW-only **masih tetap ada sebagai pilihan terpisah** yang bisa dibuat, dan banyak layar lain belum menghandle nilai `'both'` dengan benar — contoh konkret: `app/dashboard/invoices/page.tsx` (baris 17), `THERAPY_COLOR` cuma punya key `'OT'`/`'TW'`, jadi invoice dari paket gabungan akan tampil tanpa warna/styling yang benar (undefined). Ditemukan juga **dua representasi berbeda** untuk "gabungan" di kode: `models/Package.ts` pakai string `'both'`, tapi ada komentar di `app/dashboard/patients/[id]/page.tsx` baris 909 yang memperlakukan `therapyType: null` sebagai "both" — dua cara berbeda merepresentasikan hal yang sama, berpotensi bug data.

**File yang terpengaruh:**
- `app/dashboard/super-admin/packages/page.tsx` (tombol create, baris 317-332)
- `app/dashboard/invoices/page.tsx` (baris 17-41, `THERAPY_COLOR` dan type `Invoice['therapyType']`)
- `models/Invoice.ts`, `models/TokenTransaction.ts`, `models/WeeklySchedule.ts` — cek apakah enum `therapyType` masing-masing sudah termasuk `'both'`
- `app/dashboard/patients/[id]/page.tsx` (baris 909, representasi `null` vs `'both'`)

**Cara perbaikinnya:**
1. **Konfirmasi dulu ke klien**: apakah maksud "gabung" itu (a) hapus total opsi OT-only/TW-only dari create form, hanya sisakan `both`/`assessment`, atau (b) tetap boleh dibuat tapi harus tampil digabung di semua laporan/invoice.
2. Audit dan satukan representasi "both" — pilih satu cara (rekomendasi: pakai string `'both'` yang sudah ada di model `Package`, hapus penggunaan `null`-sebagai-both di `patients/[id]/page.tsx`), lalu migrasi data lama kalau perlu.
3. Perbaiki `THERAPY_COLOR`/type union di `app/dashboard/invoices/page.tsx` supaya menghandle `'both'` dengan benar.
4. Kalau opsi (a) dipilih: update tombol create package supaya cuma tampilkan `both`/`assessment`, dan buat script migrasi untuk paket lama yang masih OT-only/TW-only.

**Effort:** M

---

### 2.3 Field Harga & Jumlah Sesi tidak bisa dikosongkan — BUG KONKRET
**Yang salah sekarang:** `app/dashboard/super-admin/packages/page.tsx`:
```tsx
// Input Jumlah Sesi, baris 291-302
<Input type="number" min={1}
  value={form.therapyType === "assessment" ? 1 : form.sessions}
  onChange={(e) => {
    if (form.therapyType !== "assessment") {
      setForm({ ...form, sessions: parseInt(e.target.value) || 1 });
    }
  }}
/>

// Input Harga, baris 305-312
<Input type="number" min={0}
  value={form.price}
  onChange={(e) => setForm({ ...form, price: parseInt(e.target.value) || 0 })}
/>
```

**Kenapa rusak:** Bug klasik controlled-input. Saat user select-all lalu hapus isi field, `e.target.value` jadi `""`, `parseInt("")` menghasilkan `NaN`, dan `NaN || 0` (atau `|| 1`) langsung memaksa nilai balik ke `0`/`1` di setiap keystroke — jadi field terlihat "snap back" ke 0 dan user tidak bisa benar-benar mengosongkan field untuk ketik ulang angka baru.

**File:** `app/dashboard/super-admin/packages/page.tsx` (baris 291-312, default form baris 48)

**Cara perbaikinnya:**
1. Simpan value input sebagai string kosong sementara saat field dikosongkan, bukan langsung dipaksa jadi angka:
```tsx
onChange={(e) => setForm({ ...form, price: e.target.value === "" ? "" : parseInt(e.target.value) })}
```
2. Longgarkan tipe TypeScript state form untuk `price`/`sessions` jadi `number | string` selama proses edit.
3. Koersi ke number cuma sekali, di saat submit (`handleSave()`), misal `Number(form.price) || 0`, dengan validasi menangkap nilai kosong/invalid sebelum benar-benar submit.
4. Terapkan pola yang sama untuk field `sessions`.

**Effort:** S

---

### 2.4 Download Invoice + template standar 🔗 *Sistem PDF (epic)*
**Sama akar masalahnya dengan Parent 1.8** — belum ada fitur download/PDF invoice di manapun, termasuk di tampilan admin (`app/dashboard/invoices/page.tsx` baris 370-691) dan halaman detail pasien (`app/dashboard/patients/[id]/page.tsx` baris 906-966, yang cuma tampilkan status badge + nomor invoice, tanpa aksi download/print).

`docs/INVOICE_TEMPLATE.md` yang sudah ada di root docs **bukan** template invoice pasien — itu template invoice billing kontrak developer ke klien (Termin 1-4 + maintenance bulanan). Berguna cuma sebagai referensi gaya (format header, info bank, skema penomoran `HB-INV-...`), bukan dipakai langsung.

**Cara perbaikinnya:** Sama seperti 1.8, ditambah:
1. Tambahkan tombol "Unduh Invoice" juga di tampilan admin invoice list dan di halaman detail pasien (`patients/[id]/page.tsx`, dekat status invoice yang sudah ada).
2. Buat dokumentasi template invoice pasien terpisah (`docs/PATIENT_INVOICE_TEMPLATE.md`) mengikuti gaya visual dari `INVOICE_TEMPLATE.md` yang sudah ada, supaya klien bisa review/approve formatnya.

**Effort:** L (untuk keseluruhan fitur baru: desain template + pipeline PDF + integrasi di 2 halaman + endpoint baru) — dikerjakan bareng 1.7/1.8 karena berbagi infrastruktur.

---

### 2.5 Hapus fitur Check-in untuk Super Admin — BUG KONKRET (bonus)
**Yang salah sekarang:** `lib/utils/permissions.ts` baris 184-185 masih memberi `super_admin` permission `attendance:view` dan `attendance:checkin`, plus ada nav "Absensi" untuk role tsb (baris ~588-593). Guard di level API pakai pola "block role parent saja", bukan allow-list eksplisit:
- `app/api/attendance/route.ts` (`GET`, baris 22-26) cuma nge-block `role === 'parent'`
- `app/api/attendance/checkin/route.ts` (`POST`, baris 38-43) juga cuma block `role === 'parent'` — padahal ada komentar kode yang bilang "Only admin and therapist may check-in" (baris 40), tapi cek kodenya tidak benar-benar mengeksklusi `super_admin`.

**Temuan bonus — kalau super_admin benar-benar coba check-in, akan ERROR**: `models/Attendance.ts` baris 24-28 mendefinisikan `userRole: { enum: ['admin', 'therapist'] }` — `'super_admin'` bukan nilai enum yang valid, jadi `Attendance.create({ userRole: 'super_admin', ... })` akan gagal validasi Mongoose. Ini bukan cuma "tidak perlu", tapi memang berpotensi error kalau dipakai.

**File yang perlu diubah:**
- `lib/utils/permissions.ts` (baris ~184-185 dan ~588-593)
- `app/api/attendance/route.ts` (baris 24-26)
- `app/api/attendance/checkin/route.ts` (baris 41-43)
- `app/dashboard/attendance/page.tsx` (tambah guard defense-in-depth)

**Cara perbaikinnya:**
1. Hapus `"attendance:view"` dan `"attendance:checkin"` dari array permission `super_admin` di `permissions.ts`.
2. Hapus entri nav "Absensi" dari array nav `super_admin` di file yang sama.
3. Ubah guard di kedua API route dari pola "tolak kalau parent" jadi allow-list eksplisit: `['admin','therapist'].includes(user.role)`.
4. Tambahkan guard `permissions.hasPermission('attendance:view')` di awal `attendance/page.tsx` (pola yang sama sudah dipakai di `super-admin/packages/page.tsx` baris 159-167) untuk pesan access-denied yang ramah kalau super_admin nyasar ke URL ini langsung.

**Effort:** S

---

### 2.6 Rekap absensi terapis bulanan/rentang tanggal (fitur baru)
**Yang salah sekarang:** "Rekap Mingguan" yang sudah ada (`app/dashboard/attendance/page.tsx` baris 606-680) cuma hitung Senin-Sabtu untuk minggu yang sedang dipilih, dan cara ambil datanya **7 request HTTP terpisah** (`Promise.all` memanggil `/api/attendance?date=...` sekali per hari, baris 190-195) — tidak scalable kalau diperluas ke sebulan. `app/api/attendance/route.ts` cuma dukung query parameter `date` tunggal atau `history=true` (30 hari terakhir milik user sendiri) — tidak ada endpoint agregasi rentang tanggal untuk semua staff sekaligus.

**File yang perlu dibuat/diubah:**
- Baru: `app/api/attendance/recap/route.ts` (atau extend route yang ada dengan parameter `from`/`to`)
- `app/dashboard/attendance/page.tsx` — tambah tab/date-range picker untuk rekap bulanan
- `models/Attendance.ts` — index yang ada sekarang (pada `date` dan `userRole+date`) **sudah cukup mendukung** range query, tidak perlu ubah schema

**Cara perbaikinnya:**
1. Buat endpoint baru `GET /api/attendance/recap?from=YYYY-MM-DD&to=YYYY-MM-DD` yang: ambil semua user aktif role `admin`/`therapist`, ambil semua dokumen `Attendance` dalam rentang **dalam satu query** (bukan loop per hari), group per user menghitung status per hari + total (tepat waktu/telat/absen, persentase kehadiran).
2. Tambah UI "Rekap Bulanan" di halaman attendance — date-range picker (default bulan berjalan), tabel ringkasan per-user (bukan per-hari kalau rentangnya besar).
3. Tambah tombol "Unduh Rekap" (CSV dulu, karena belum ada library PDF — bisa dipakai bareng kalau Epic PDF di 2.4 sudah jalan).

**Effort:** M

---

### 2.7 Chart tren jumlah pasien (fitur baru)
**Yang salah sekarang:** Tidak ada charting library apapun di `package.json` (`recharts`, `chart.js`, `victory`, `d3` — nol hasil pencarian dependency). `app/api/dashboard/stats/route.ts` (`superAdminStats()`, baris 143-241) cuma expose snapshot satu titik waktu: `activePatients: Child.countDocuments({ isActive: true })` (baris 161) — tidak ada data time-series historis. Ada permission `reports:system_analytics` dan import icon `BarChart3Icon` di `app/dashboard/reports/page.tsx` (baris 32) yang menunjukkan chart pernah direncanakan, tapi tidak ada implementasi chart apapun — cuma dekorasi/infrastruktur yang belum dipakai.

`models/Child.ts` sudah punya `timestamps: true` dan index di `createdAt` (`ChildSchema.index({ createdAt: -1 })`) plus flag `isActive` — cukup untuk hitung tren bulanan lewat aggregation MongoDB tanpa perlu ubah schema.

**File yang perlu dibuat/diubah:**
- `package.json` — tambah dependency chart
- Baru/extend: `app/api/super-admin/analytics/patient-trend/route.ts`
- `models/Child.ts` — tidak perlu perubahan
- UI baru: halaman/section analitik Super Admin (`app/dashboard/super-admin/financial/page.tsx` sudah punya import `TrendingUpIcon` yang belum dipakai untuk apapun — kemungkinan memang dulu direncanakan untuk fitur ini, atau bikin halaman baru `app/dashboard/super-admin/analytics/page.tsx`)

**Cara perbaikinnya:**
1. Tambah dependency `recharts` (ringan, idiomatik React).
2. Buat aggregation MongoDB: `Child.aggregate([{ $group: { _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } }, count: { $sum: 1 } } }, { $sort: { _id: 1 } }])` untuk pasien baru per bulan, plus running total kumulatif untuk "pasien aktif dari waktu ke waktu".
3. Buat endpoint `GET /api/super-admin/analytics/patient-trend?months=12` yang mengembalikan `{ month, newPatients, activePatientsCumulative }[]`.
4. Bangun komponen line/area chart yang mengonsumsi data ini, taruh di halaman analitik baru atau di halaman financial yang sudah ada dekat `TrendingUpIcon`.

**Effort:** M–L

---

## 3. POV Terapis

### 3.1 Jadwal terpotong di mobile portrait 🔗 *Pola layout mobile*
**Yang salah sekarang:** Tabel jadwal mingguan di `/dashboard/schedules` (`app/dashboard/schedules/page.tsx`, baris 1864-1995) adalah HTML `<table>` biasa dibungkus `overflow-x-auto` (baris 1866). Tabelnya sendiri `min-w-[720px]` (baris 1867), tiap 6 kolom hari (Senin-Sabtu) punya `min-w-[130px]` tambahan (baris 1884), plus kolom jam `w-24` (baris 1871). Total lebar minimum ≈ 96px + 6×130px = 876px+. Ada juga komponen legacy `components/schedule/weekly-schedule-table.tsx` dengan pola serupa (`min-w-[160px]` per kolom, baris 134/145) — cek dulu apakah masih dipakai sebelum diubah.

**Kenapa rusak:** Di layar HP portrait (lebar 375-428px), tabel selebar 876px+ cuma bisa dilihat dengan scroll horizontal di dalam `overflow-x-auto`. Tidak ada petunjuk visual bahwa tabelnya bisa di-scroll (tidak ada shadow/gradient di tepi, tidak ada indikator "geser untuk lihat hari lain", terutama parah di Safari iOS yang scrollbar-nya tersembunyi) — jadi terapis mengira datanya hilang, bukan sekadar perlu di-scroll. Tidak ada breakpoint responsif yang mengubah tampilan jadi layout bertumpuk per-hari — grid 7 kolom sama persis di semua ukuran layar.

**File:**
- `app/dashboard/schedules/page.tsx` (baris 1864-1995)
- `components/schedule/weekly-schedule-table.tsx` (baris 122-195) — cek dulu apakah masih dipakai

**Cara perbaikinnya:**
1. Tambahkan tampilan khusus mobile: di bawah breakpoint `sm`/`md`, render tampilan accordion/tab satu-hari-per-waktu (pill pemilih hari + slot jam hari itu ditumpuk vertikal) menggantikan tabel 7 kolom. Gunakan `hidden md:block` pada tabel lama dan `md:hidden` pada tampilan mobile baru.
2. Alternatif minimal (kalau waktu terbatas): tambahkan carousel dengan scroll-snap + tab hari di atas yang otomatis scroll tabel ke kolom terkait, plus indikator visual fade-edge/shadow supaya user sadar ada kolom lain.
3. Rekomendasi: opsi 1 (accordion) lebih tuntas karena feedback klien menunjukkan user sama sekali tidak menyadari ada scroll, bukan cuma kesulitan melakukannya.

**Effort:** M

---

### 3.2 Pelaporan & Analitik terpotong di mobile 🔗 *Pola layout mobile*
**Yang salah sekarang:** List view laporan (`ReportListItem`, `app/dashboard/reports/page.tsx` baris 1001-1076) pakai constant `COL`:
```ts
const COL = {
  type:      'w-20 shrink-0',
  patient:   'hidden sm:block w-32 shrink-0',
  therapist: 'hidden md:block w-36 shrink-0',
  date:      'hidden lg:block w-28 shrink-0',
  status:    'w-20 shrink-0',
  actions:   'w-24 shrink-0',
} as const;
```
Kolom `Pasien` (Nama), `Terapis`, dan `Tgl Sesi` (Tanggal/Sesi) pakai `hidden sm:block`/`md:block`/`lg:block` — di layar di bawah 640px (semua HP dalam mode portrait), ketiga kolom ini **benar-benar tidak dirender** (`display:none`), bukan cuma dipotong visual. Yang tersisa cuma badge Jenis, Judul, Status, dan Aksi.

**Kenapa rusak:** Strategi responsif yang terlalu agresif — menyembunyikan seluruh kolom data alih-alih menata ulang tampilannya. Ini persis sesuai keluhan klien: Nama (Pasien), Tanggal, dan Sesi hilang di mobile portrait. Grid view (`ReportCard`, baris 1079-1197) **TIDAK** punya masalah ini — sudah menampilkan Pasien, Terapis, dan tanggal sesi dalam layout card bertumpuk (baris 1132-1148) — tapi `viewMode` default-nya adalah `'list'` (baris 896: `useState<'grid' | 'list'>('list')`), jadi user mobile mendarat di tampilan yang rusak secara default.

**File:** `app/dashboard/reports/page.tsx` — constant `COL` (990-998), `ReportListItem` (1001-1076), default `viewMode` (baris 896)

**Cara perbaikinnya (2 opsi, bisa dikombinasi):**
1. **Quick win**: ubah default `viewMode` jadi `'grid'` di layar kecil (cek `window.innerWidth < 640` di `useEffect` saat mount, atau switch berbasis CSS) — karena grid view yang sudah ada justru sudah benar dan responsif.
2. **Perbaikan menyeluruh list view**: ganti pola `hidden sm:/md:/lg:block` dengan layout baris bertumpuk 2 baris di mobile — judul di baris 1, lalu baris kedua `flex flex-wrap gap-x-3 text-xs text-gray-500` menampilkan Pasien · Terapis · Tgl Sesi (tetap sebagai kolom terpisah untuk alignment tabel di `md:flex`, tapi ditampilkan inline di bawah judul untuk mobile) — supaya tidak ada data yang hilang di layar HP.

**Effort:** S (opsi 1) sampai M (opsi 2, reflow penuh `ReportListItem`)

---

### 3.3 Rekomendasi CSS/layout responsif (prinsip umum)
Ini bukan item terpisah — ini prinsip yang mendasari perbaikan 3.1 dan 3.2. Ditemukan 2 pola berbeda yang sama-sama gagal di mobile: (a) tabel fixed-width + scroll horizontal tanpa indikator visual (jadwal), dan (b) sembunyikan kolom total lewat `hidden {breakpoint}:block` (laporan). Tidak ada custom breakpoint aneh di config Tailwind — breakpoint default (`sm`=640px, `md`=768px, `lg`=1024px) dipakai dengan benar, masalahnya ada di pilihan layout per-komponen.

**Rekomendasi:** standarkan satu pola untuk semua data tabular di seluruh app: di bawah `md`, render sebagai **stacked card list** (pola yang sudah terbukti bagus di `ReportCard`); di `md:` ke atas, pakai tabel/grid padat yang sudah ada. Terapkan prinsip ini konsisten ke 3.1 dan 3.2, dan idealnya juga ke layar tabular lain di masa depan supaya tidak terulang.

**Effort:** — (tercakup dalam estimasi 3.1 dan 3.2)

---

### 3.4 Upload video lambat
**Yang salah sekarang — alur lengkap yang dikonfirmasi end-to-end:**
1. **Client** (`app/dashboard/reports/new/page.tsx`, baris 239-252): file media di-upload berurutan dalam `for` loop, masing-masing sebagai satu `fetch(..., { body: fd })` dengan seluruh objek `File` dimasukkan ke `FormData` — tanpa chunking, tanpa progress indicator (native `fetch` memang tidak bisa melaporkan progress upload).
2. **Server** (`app/api/reports/[id]/media/route.ts`, baris 66-124): baca **seluruh file ke memory** lewat `Buffer.from(await file.arrayBuffer())` (baris 87), batas ukuran 100MB (`MAX_FILE_SIZE`, baris 21).
3. **Kompresi** (`lib/utils/compress.ts`, `compressVideo`, baris 85-133): seluruh buffer video ditulis ke temp file, lalu **di-transcode ffmpeg secara sinkron** (`fluent-ffmpeg` + `ffmpeg-static`) ke H.264/AAC MP4, CRF 28, max lebar 1280px, `-preset fast`, `+faststart` — ini kerja CPU nyata dan tidak ringan, terjadi **di dalam satu request/response cycle** sebelum apapun di-upload ke storage.
4. **Storage** (`lib/services/r2-storage.ts`, `uploadToR2`, baris 37-59): setelah transcode selesai, baru satu `PutObjectCommand` upload seluruh buffer terkompresi ke Cloudflare R2 (S3-compatible) — **tidak pakai multipart** meski sudah pakai `@aws-sdk/client-s3` (yang sebenarnya support multipart lewat `@aws-sdk/lib-storage`).

**Kenapa terasa lambat:** Tiga faktor yang saling menumpuk, semuanya dalam satu siklus request sinkron: (a) file mentah harus selesai terupload ke server Next.js dulu sebelum apapun terjadi, (b) server lalu transcode ffmpeg penuh secara in-request (CPU + I/O bound, tidak streaming), (c) baru dikirim sekali (non-resumable) ke R2. Untuk video multi-menit di koneksi mobile, ini bisa menambah puluhan detik sampai menit, tanpa feedback progress apapun ke terapis (tombolnya cuma tampilkan spinner "Mengunggah...", tanpa persentase). Ada juga risiko platform: kalau suatu saat deploy ke environment serverless/edge dengan batas durasi request, video besar bisa timeout.

**File yang terlibat:**
- `app/dashboard/reports/new/page.tsx` (baris 239-252) — upload client sekuensial tanpa chunking
- `app/dashboard/reports/[id]/edit/page.tsx` — kemungkinan pola upload yang sama (belum dicek baris per baris, tapi pakai endpoint `/media` yang sama)
- `app/api/reports/[id]/media/route.ts` — buffer seluruh file, panggil compress + upload secara sinkron
- `lib/utils/compress.ts` (`compressVideo`) — transcode ffmpeg sinkron
- `lib/services/r2-storage.ts` (`uploadToR2`) — single-shot `PutObjectCommand`, tanpa multipart

**Cara perbaikinnya (bertahap, urutan ROI dari termurah):**
1. **Quick win UX**: ganti client upload dari `fetch` ke `XMLHttpRequest` (atau `fetch` + `ReadableStream`/`ProgressEvent` polyfill) supaya bisa tampilkan progress bar upload beneran — bikin waktu tunggu terasa jauh lebih pendek meski backend belum berubah sama sekali.
2. **Tunda proses transcoding**: upload file mentah ke R2 dulu (cepat — cuma network PUT, tanpa kerja CPU di-request), langsung respond ke client, baru jalankan kompresi ffmpeg secara asinkron di background job/queue (atau Route Handler terpisah yang dipicu setelah upload) yang re-upload versi terkompresi dan update `report.mediaFiles`. Ini menghilangkan waktu tunggu ffmpeg dari request yang dirasakan user sepenuhnya.
3. **Multipart/chunked upload ke R2** untuk file di atas ambang batas tertentu (misal >8MB) pakai helper `Upload` dari `@aws-sdk/lib-storage` — otomatis handle multipart, dan bisa streaming langsung dari request masuk (bukan buffer seluruh file dulu di memory Node) kalau dipasangkan dengan client upload yang streaming juga.
4. **Presigned R2 upload URL** — browser upload langsung ke R2 (skip double-hop server Next.js untuk file mentah), kompresi terjadi setelahnya via webhook/background step — ini pola standar untuk upload file besar dan akan menghilangkan double-hop "upload ke app server, lalu app server upload lagi ke R2" sepenuhnya.

**Effort:** S (langkah 1, progress bar saja) / M (langkah 2, transcode async + multipart) / L (langkah 4, arsitektur presigned-URL penuh)

---

### 3.5 Tidak ada notifikasi komentar baru untuk terapis 🔗 *Sistem Notifikasi*
**Yang salah sekarang:** Sama seperti temuan di 1.2 — **tidak ada sistem notifikasi apapun** di codebase (tidak ada model `Notification`, tidak ada WebSocket/Socket.IO/Pusher/SSE, tidak ada provider email/push). Yang ada:
- `POST /api/reports/[id]/comments` (`app/api/reports/[id]/comments/route.ts` baris 43-79) cuma membuat dokumen `ReportComment` lalu return — **tidak ada efek samping apapun**, tidak ada event, tidak ada catatan "komentar baru" untuk pihak lain.
- **Badge pull-based**: `GET /api/reports/comments/unresolved-count` menghitung komentar root-level yang belum selesai (khusus terapis, di-scope ke `therapistId` miliknya). Dipanggil dari `dashboard-sidebar.tsx` (baris 62-72) dalam `useEffect` yang keyed pada `[user, pathname, permissions]` — **cuma refetch saat pindah halaman**, bukan interval, bukan push. Kalau terapis diam di satu halaman, komentar baru dari parent tidak akan terlihat sampai mereka klik ke halaman lain.
- Per-laporan `unresolvedCommentCount` juga ditampilkan di list laporan, tapi sama-sama cuma refresh saat page load/navigasi — komentar cuma "ditemukan" kalau user manual buka reportnya (`ReportViewDialog` fetch `/comments` saat dibuka).
- `models/Conversation.ts` punya field `settings.notifications: boolean` (baris 27) — tapi ini cuma preferensi toggle per-percakapan untuk fitur messaging, **tidak ada kode manapun yang membaca flag ini** untuk benar-benar mengirim notifikasi — infrastruktur mati/tidak terpakai.

**File yang terlibat:**
- `app/api/reports/[id]/comments/route.ts` — titik pemicu (perlu ditambah trigger notifikasi saat POST)
- `app/api/reports/comments/unresolved-count/route.ts` — badge pull-based yang sudah ada, kandidat untuk diperluas
- `components/layout/dashboard-sidebar.tsx` (baris 55-72, 120, 140) — logic fetch/tampilan badge saat ini
- `models/ReportComment.ts` — perlu field `notifiedUserIds` atau model sibling baru
- `models/index.ts` — belum ada model `Notification` terdaftar
- `models/Conversation.ts` (baris 27) — flag notifikasi yang mati, terkait catatan dead code di Admin section

**Cara perbaikinnya:** Sama dengan Epic A di 1.2 — begitu sistem `Notification` dibangun, tambahkan trigger di titik ini: setelah `POST /comments` berhasil, buat `Notification` untuk terapis pemilik report tsb (kalau yang komentar parent/admin) atau untuk parent (kalau yang komentar terapis). Upgrade dari polling ke real-time (SSE/WebSocket) bisa jadi fase terpisah kalau dibutuhkan respons instan saat terapis sedang aktif di app. Opsional tambahan: notifikasi email untuk komentar yang masuk saat terapis offline (reuse titik trigger yang sama).

**Effort:** M (model + endpoint polling + toast di sidebar, sama seperti Epic A) / L (real-time pub/sub) / M (tambahan email, bisa paralel/independen)

---

## 4. Rangkuman Fitur & Kebutuhan Admin

### 4.1 Frekuensi terapi mingguan per anak — BUG KONKRET (hardcoded)
**Yang salah sekarang:** `app/dashboard/patients/page.tsx` baris 175 **selalu menulis string hardcoded** `frequency: "2x/minggu"` untuk setiap anak yang punya terapis, tanpa pernah benar-benar dihitung. Tidak pernah ditampilkan lagi sebagai teks "Nx/minggu" di manapun kecuali dipakai ulang di baris 516-517 untuk hal lain yang tidak berkaitan. Halaman detail (`patients/[id]/page.tsx`) bahkan tidak pernah fetch `WeeklySchedule` sama sekali, jadi frekuensi juga tidak muncul di sana.

**Kenapa rusak:** Fitur di-stub dengan konstanta palsu alih-alih dihitung sungguhan. Data untuk menghitungnya sebenarnya sudah ada: jumlah nilai unik `WeeklySchedule.day` per `patientId`.

**File:** `app/dashboard/patients/page.tsx` (baris 58-64, 175), `app/dashboard/patients/[id]/page.tsx`, `app/api/weekly-schedule/route.ts`

**Cara perbaikinnya:**
1. Tambah aggregation: `WeeklySchedule.aggregate([{$group:{_id:'$patientId', days:{$addToSet:'$day'}}}])` (difilter hanya slot yang sedang berlaku).
2. Expose lewat join di `/api/children` atau endpoint baru `GET /api/weekly-schedule/frequency`.
3. Ganti string hardcoded di baris 175 dengan hasil hitung `days.length` + "x/minggu".
4. Tambahkan badge yang sama di halaman detail anak.

**Effort:** S

---

### 4.2 Pencarian anak tidak jalan — BUG KONKRET
**Yang salah sekarang:** Ada 2 sistem search paralel. (1) `components/search/global-search-bar.tsx` + `search-results.tsx` + `models/SearchIndex.ts` — sistem "global search" yang **lengkap dibangun tapi sepenuhnya yatim/tidak dipakai** (pencarian menyeluruh membuktikan nol referensi ke komponen-komponen ini di luar filenya sendiri, dan **tidak ada route `/api/search`**). (2) Search yang benar-benar aktif dipakai adalah filter substring sisi-client biasa di `app/dashboard/patients/page.tsx:349-352`:
```js
filtered = filtered.filter(patient =>
  patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
  patient.diagnosis.toLowerCase().includes(searchTerm.toLowerCase())
);
```

**Kenapa rusak:** `fetchPatients()` (baris 128-211) memanggil `/api/children` **tanpa parameter query apapun**. Skema validasi `childQuerySchema` (`lib/validation/child.ts:205`) default `limit`-nya **10**. Server sebenarnya **sudah mendukung** search sungguhan (`buildChildSearchQuery` di `lib/utils/child.ts:198-200`, regex case-insensitive pada nama) **tapi tidak pernah dipanggil**. Akibatnya: kotak search cuma mencari di antara 10 anak paling baru dibuat — klinik dengan lebih dari 10 anak aktif akan selalu dapat "tidak ditemukan" untuk anak-anak lama.

**File:** `app/dashboard/patients/page.tsx` (128-211, 342-362, 538-544), `app/api/children/route.ts` (28-295), `lib/validation/child.ts` (186-232), `lib/utils/child.ts` (180-203). Dead code terkait untuk dibersihkan: `components/search/*`, `models/SearchIndex.ts`.

**Cara perbaikinnya:**
1. Tambah state search dengan debounce.
2. Panggil `fetchPatients` dengan `?search=<term>&page=1&limit=<n>` — backend **sudah siap** memvalidasi dan menghandle ini dengan benar, tidak perlu perubahan backend.
3. Pakai object `pagination` yang API sebenarnya sudah kembalikan (`route.ts:280`) tapi selama ini dibuang begitu saja oleh frontend.

**Effort:** M (S–M kalau cuma perbaiki pemanggilan fetch tanpa UI pagination penuh)

---

### 4.3 Tambah jadwal susulan di tengah paket berjalan
**Yang salah sekarang:** Tidak ada konsep "sesi tambahan/susulan" vs "sesi reguler" di `models/Session.ts`. Satu-satunya jalur pembuatan slot (`SlotModal` di `app/dashboard/schedules/page.tsx` → `POST /api/weekly-schedule`) selalu memperlakukan penambahan hari/jam baru sebagai **regenerasi ulang seluruh sisa saldo paket** ke slot baru itu ke depannya (`app/api/weekly-schedule/route.ts:397-483`). Kalau paket sudah terjadwal penuh, slot baru tetap tertaut ke `packageId`/`totalSessions` tanpa `effectiveUntil`, menciptakan slot berulang duplikat yang "hantu".

**Bug konkret ditemukan:** `GET /api/weekly-schedule`, `weekSessionMap` (baris 138) key-nya **cuma `packageId`** — jadi dua slot yang berbagi paket yang sama (persis skenario "tambah jadwal susulan") akan bertabrakan dan salah satu kartu menampilkan nomor sesi/status yang salah.

**Jalur alternatif yang lebih aman tapi tidak terpakai**: `POST /api/children/[id]/sessions` (baris 267-288) membuat satu `Session` berdiri sendiri tanpa melibatkan `WeeklySchedule` sama sekali — tapi UI trigger-nya (`PackageSessionModal`, `page.tsx` baris 2154-2163) adalah dead code, tidak pernah dipanggil dari manapun.

**File:** `app/api/weekly-schedule/route.ts` (POST 376-483, bug GET di baris 138), `models/Session.ts` (perlu field kategori/back-ref baru), `app/dashboard/schedules/page.tsx` (SlotModal, `PackageSessionModal` yang mati), `app/api/children/[id]/sessions/route.ts` (bisa dipakai ulang)

**Cara perbaikinnya:**
1. Tambah field `Session.sessionCategory: 'regular'|'extra'`.
2. Buat aksi UI baru "+ Sesi Tambahan" yang memanggil jalur `POST /api/children/[id]/sessions` yang **sudah ada tapi mati** — jauh lebih aman daripada lewat regenerator mingguan massal.
3. Perbaiki key `weekSessionMap` supaya menyertakan hari/jam atau `weeklyScheduleId` sebagai back-reference, bukan cuma `packageId`.
4. Tambahkan guard di blok generasi massal `POST /api/weekly-schedule` supaya tidak jalan lagi kalau pasien sudah punya slot aktif untuk paket tersebut.

**Effort:** L (perubahan schema + dua jalur API + UI baru + perbaikan bug agregasi yang perlu QA terhadap data yang sudah ada)

---

### 4.4 Cari anak di halaman jadwal
**Yang salah sekarang:** `app/dashboard/schedules/page.tsx` tidak punya state `searchTerm` dan tidak ada input search di header manapun (baris 1789-1806). Render grid (`getSlotsForCell`, baris 1746-1747) tidak punya predikat filter nama. Satu-satunya "nama anak" di halaman ini ada di dalam modal pembuatan slot (dropdown pilih pasien), bukan search di grid.

**File:** `app/dashboard/schedules/page.tsx` (tambah state ~1341-1387, input ~1789-1806, filter di 1746-1758)

**Cara perbaikinnya:**
1. Tambah state `searchTerm` + input teks di header halaman.
2. Hitung `filteredSlots` via `useMemo` yang filter `slot.patientName`.
3. Sambungkan ke `getSlotsForCell`.
4. Perlu keputusan dengan klien: highlight sel yang cocok, atau sembunyikan yang tidak cocok (menyembunyikan akan merusak struktur grid hari/jam — highlight lebih aman).

**Effort:** S

---

### 4.5 Filter jadwal per terapis
**Yang salah sekarang:** Tidak ada state `therapistFilter` untuk grid utama. `allTherapists` (baris 1349) **sudah di-fetch di client** (dipakai untuk dropdown modal) tapi tidak pernah dipakai sebagai filter grid. "Legend terapis" (baris 1839-1862) cuma key statis "Jadwal Anda / Terapis lain", bukan filter fungsional.

**File:** sama seperti 4.4 (cocok dikerjakan bareng)

**Cara perbaikinnya:**
1. Tambah state `therapistFilter` + `<select>` yang diisi dari `allTherapists` yang sudah ada.
2. Gabungkan ke `useMemo` filter yang sama dengan 4.4.

**Effort:** S (bundel jadi satu PR dengan 4.4)

---

### 4.6 Detail Profil Anak — field yang hilang
Catatan: `components/child-profile/child-profile-layout.tsx` adalah dead code (nol pemakaian) — halaman aktif yang sebenarnya dipakai adalah `app/dashboard/patients/[id]/page.tsx`.

- **Tanggal mulai terapi**: Tidak ada di model `Child`; yang ada cuma `createdAt` (ditampilkan sebagai "Terdaftar Sejak" — tanggal pendaftaran, bukan tanggal mulai terapi). Proxy terbaik: `WeeklySchedule.effectiveFrom` paling awal lintas slot aktif. Belum ditampilkan. **Fix**: query `WeeklySchedule.findOne({patientId}).sort({effectiveFrom:1})`, tambahkan ke card "Informasi Dasar".
- **Hari-hari jadwal terapi**: Cuma ada di `WeeklySchedule.day` per slot, belum ditampilkan di halaman ini sama sekali. **Fix**: query hari-hari unik dari slot aktif anak tsb, render section baru "Jadwal Terapi".
- **Kontak orang tua**: **Sudah lengkap diimplementasikan** — `patients/[id]/page.tsx:1082-1115` sudah tampilkan nama/email/telepon parent. Tidak ada gap (cuma perlu verifikasi: cek apakah data parent demo memang punya field `phone` terisi, karena baris ini otomatis tersembunyi kalau kosong).
- **Alamat lengkap**: **Sama sekali tidak ada untuk siapapun yang terhubung ke anak.** `models/User.ts` punya `profile.address` tapi field ini **tidak pernah diisi form manapun dan tidak pernah di-select API manapun** (semua tempat hardcode `select('name email phone')`) — field yang benar-benar mati.

**File:** `app/dashboard/patients/[id]/page.tsx` (594-634, 1082-1115), `models/Child.ts`, `models/WeeklySchedule.ts`, `models/User.ts`, `app/api/children/[id]/route.ts` (47-55), `lib/utils/child.ts` (23-90)

**Cara perbaikinnya:**
1. Tanggal mulai terapi & hari jadwal — cukup query tambahan ke `WeeklySchedule`, tidak perlu ubah schema.
2. Alamat — tambah input form di form create/edit parent, simpan ke `User.profile.address`, perluas string `select` dan `formatChildForResponse` supaya field ini ikut terbawa, tampilkan di card "Orang Tua".
3. **Perlu keputusan**: pakai alamat keluarga/parent (reuse field yang sudah ada di `User` — direkomendasikan, lebih murah) vs alamat khusus per-anak (konsep baru yang belum ada sama sekali).

**Effort:** Tanggal mulai terapi S · Hari jadwal S–M · Kontak orang tua tidak ada kerjaan (cuma verifikasi) · Alamat S–M · **Gabungan M**

---

### 4.7 Hapus field "keterangan" dari biodata anak
**Yang salah sekarang:** Tidak ada field bernama literal "keterangan" yang terkait biodata anak (dua tempat berlabel "Keterangan" di kode adalah form cuti terapis dan legend grid jadwal — tidak berkaitan). Field yang dimaksud klien kemungkinan besar adalah **"Catatan Medis"** (`medicalInfo.notes`) — field teks bebas di data anak.

**Semua lokasi yang perlu disentuh (scope lengkap penghapusan):**
1. `models/Child.ts` (schema 94-98, interface baris 14)
2. `lib/validation/child.ts` (64-67, 105, 141)
3. `lib/utils/child.ts` (74, 278-280, 285-286)
4. `app/api/children/[id]/route.ts` (154, allowlist tulis untuk terapis)
5. `app/dashboard/patients/[id]/page.tsx` — type (50), state edit (120), populate saat dibuka (433), payload save (453), **blok tampilan (681-688)**, **textarea edit (1390-1398)**
6. Tidak ada di modal **pembuatan** anak — penghapusan cuma menyentuh edit/lihat.

**Cara perbaikinnya (rekomendasi):** Hapus di level UI saja — hilangkan blok tampilan (681-688) dan textarea edit + wiring state-nya (120, 433, 453, 1390-1398); **biarkan schema/API tetap ada** supaya data lama yang sudah tersimpan tidak hilang. Pastikan saat save, field `notes` **tidak dikirim sama sekali** di body PATCH (bukan dikirim sebagai `""`) supaya tidak diam-diam menghapus data lama yang sudah ada. Penghapusan total dari schema adalah opsi terpisah yang lebih besar (perlu keputusan migrasi data) kalau memang benar-benar diinginkan.

**Effort:** S

---

### 4.8 Admin bisa edit & hapus invoice yang sudah diterbitkan
**Yang salah sekarang:** `models/Invoice.ts` status enum cuma `['unpaid','paid','overdue']` (tidak ada flag soft-delete). `app/api/invoices/[id]/route.ts` cuma punya `GET` dan `PATCH` (admin-only), dan **`PATCH` cuma menerima `{dueDate, status, notes, isVisibleToParent}`** — tidak bisa edit `amount`, `sessions`, `packageType`, dll. **Tidak ada handler `DELETE` sama sekali** di file ini. Di UI (`app/dashboard/invoices/page.tsx`), yang ada cuma inline-edit `dueDate` (497-533), toggle paid/unpaid (540-564), dan toggle visibility (590-609) — **tidak ada form edit amount/sessions dan tidak ada tombol hapus di manapun**. Tidak ada guard server-side yang mencegah edit `dueDate`/`status`/`notes` pada invoice yang sudah `paid` hari ini.

**File:** `models/Invoice.ts`, `app/api/invoices/[id]/route.ts`, `app/dashboard/invoices/page.tsx`. Permission `invoices:manage` **sudah ada** di `lib/utils/permissions.ts`, tidak perlu bikin permission baru.

**Cara perbaikinnya:**
1. Tambah `isActive: Boolean` (default `true`) ke `Invoice` untuk soft-delete, filter field ini di semua query list/detail.
2. Perluas `PATCH` supaya bisa menerima `amount/sessions/packageType/discountAmount`, dengan guard yang memblokir edit field finansial kalau `status === 'paid'` (kecuali ada override paksa eksplisit).
3. Tambah handler `DELETE` (admin-only, soft-delete, diblokir/perlu konfirmasi tambahan untuk invoice yang sudah `paid`).
4. Tambah modal "Edit" (amount/sessions/notes/packageType) dan tombol "Hapus" dengan dialog konfirmasi di halaman invoice, pakai pola `Dialog` yang sudah ada di tempat lain di app.

**Effort:** M

---

### 4.9 Notifikasi auto-hilang real-time 🔗 *Sistem Notifikasi*
**Yang salah sekarang:** Sama seperti 1.2/3.5 — **tidak ada model Notification atau UI lonceng/dropdown**. Yang paling mendekati: (1) badge unresolved-comment di sidebar — fetch sekali saat mount/pindah halaman saja, tanpa interval/websocket; (2) hook `useConversations()` (`lib/hooks/useConversations.ts:53-116`) — fetch sekali saat mount; model backingnya `models/Conversation.ts` punya method instance `markAsRead()`/`incrementUnreadCount()` (baris 205-228) yang **berfungsi tapi dead code — tidak pernah dipanggil dari route API manapun**, jadi unread count tidak pernah benar-benar update; (3) papan pengumuman (announcement wall) fetch sekali saat mount tanpa konsep read/unread sama sekali.

**Konfirmasi tidak ada infra real-time:** pencarian menyeluruh untuk `setInterval|socket.io|Pusher|EventSource|WebSocket|SWR|useSWR|react-query|useQuery` **nol hasil** di seluruh codebase — setiap fetch data di app ini adalah `useEffect` sekali-jalan. Ini pekerjaan infrastruktur baru total, bukan perluasan dari sesuatu yang sudah ada.

**File:** `components/layout/dashboard-sidebar.tsx`, `lib/hooks/useConversations.ts`, `app/api/conversations/[id]/messages/route.ts` (tidak pernah memanggil `incrementUnreadCount`), `app/api/reports/comments/unresolved-count/route.ts`

**Cara perbaikinnya (bertahap):**
1. **Quick win murah**: sambungkan method `incrementUnreadCount`/`markAsRead` yang **sudah ditulis lengkap tapi tidak pernah dipanggil** — panggil dari route kirim-pesan dan route baru "tandai sudah dibaca". Update state React secara optimistic saat user melakukan aksi baca sendiri (ini langsung memperbaiki kasus "aksi saya sendiri butuh refresh untuk terlihat").
2. Tambah polling ringan (`setInterval`, 15-30 detik) ke badge sidebar dan `useEffect` list percakapan — tidak perlu infra baru, cocok dengan gaya fetch sederhana yang sudah dipakai app ini, dan sudah memenuhi kebutuhan "hilang otomatis tanpa refresh manual" untuk sebagian besar kasus.
3. Untuk push instan sungguhan (bukan cuma polling N-detik): bangun Server-Sent Events (`ReadableStream` + `EventSource`) — ini arsitektur baru karena belum ada bentuk apapun yang serupa di app (butuh in-process pub/sub, atau layanan hosted seperti Pusher/Ably kalau deployment bukan single-instance).

**Effort:** Langkah 1-2 (sambungkan dead code + polling) S–M · Langkah 3 (real-time push sungguhan) L

---

### 4.10 Color-coding terapis untuk jadwal
**Yang salah sekarang:** Tidak ada model `Therapist` terpisah — terapis adalah dokumen `User` dengan `role: 'therapist'`. `User.profile` tidak punya field `color`. Warna di grid jadwal saat ini di-key berdasarkan **jenis terapi** (`SlotCard` di `app/dashboard/schedules/page.tsx:235-259` — OT=biru, TW=ungu, HB=hijau), bukan identitas terapis — jadi semua terapis OT kartunya terlihat identik. `app/api/therapists/route.ts` **cuma `GET`** — tidak ada endpoint `PATCH`/edit terapis sama sekali. `app/dashboard/therapists/page.tsx` tidak punya UI color-picker.

**File:** `models/User.ts` (tambah `profile.color`), baru: `app/api/therapists/[id]/route.ts` (belum ada dalam bentuk apapun hari ini), `app/dashboard/therapists/page.tsx` (tambah UI picker), `app/dashboard/schedules/page.tsx` (`SlotCard` baris 209-320, interface `TherapistOption` baris 187-191)

**Cara perbaikinnya:**
1. Tambah `profile.color` (string hex, atau palet preset kurasi supaya konsisten) ke model `User`.
2. Buat endpoint baru `PATCH /api/therapists/[id]` (belum ada bentuk apapun hari ini).
3. Tambah color-picker di halaman edit terapis.
4. Terapkan warna terapis sebagai aksen tambahan di `SlotCard` (misal border kiri) — **bukan mengganti** warna jenis-terapi yang sudah ada, tapi ditambahkan sebagai lapisan kedua. Perluas legend supaya admin juga bisa lihat key warna per-terapis.

**Effort:** M

---

### 4.11 Absensi Anak (Nama Anak, Jenis Terapi, Terapis)
**Yang salah sekarang:** `app/dashboard/attendance/page.tsx` + `app/api/attendance/*` + `models/Attendance.ts` mengimplementasikan **absensi clock-in/out staff** (check-in berbasis GPS untuk user `admin`/`therapist`, status tepat-waktu/telat/absen), dikonfirmasi lewat schema:
```ts
userId, userName, userRole: 'admin'|'therapist', date, checkInAt,
checkInLocation: {lat,lng}, isWithinLocation, status: 'on-time'|'late'
```
**Ini sama sekali tidak berhubungan dengan anak.** Tidak ada konsep "absensi anak" di manapun dalam kode — tidak ada model, halaman, atau route API yang melacak kehadiran per-anak per-sesi sebagai list view terpisah. Sumber data terdekat adalah model `Session`, yang memang sudah melacak per-anak, per-terapis dengan `status` mirip-kehadiran (`completed`/`scheduled`/`cancelled`/`no-show`), tapi `Session.type` adalah `'in-person'|'video'|'phone'` (medium sesi), **bukan** "Jenis Terapi" — klasifikasi itu ada satu langkah lagi di `WeeklySchedule.therapyType` atau lewat `Session.packageId → TokenTransaction.therapyType`.

**Kenapa rusak:** "Absensi Anak" yang diminta klien **belum ada sama sekali** — perlu dibangun sebagai view baru, paling natural sebagai list di atas dokumen `Session` (yang sudah punya `childId`, `therapistId`, `date`, `status`) di-join ke `Child.name` dan sumber jenis-terapi (`WeeklySchedule`/`TokenTransaction`), **bukan** memakai ulang fitur "Absensi" staff yang sudah ada — itu domain yang sama sekali berbeda, jangan disamakan saat estimasi/scoping.

**File:** halaman baru (mis. `app/dashboard/attendance/children/page.tsx` atau tab baru di halaman Absensi yang sudah ada — perlu keputusan penamaan/IA dengan klien karena "Absensi" saat ini 100% berarti absensi staff), route API baru (mis. `app/api/attendance/children/route.ts`), `models/Session.ts` (sebagai sumber data utama), `models/WeeklySchedule.ts`/`models/TokenTransaction.ts` (untuk join jenis terapi)

**Cara perbaikinnya:**
1. Bangun list view admin baru berbasis `Session.find({...}).populate('childId','name').populate('therapistId','name')`, di-join ke jenis terapi lewat slot `WeeklySchedule` atau `TokenTransaction.therapyType` sesi tsb.
2. Tampilkan Nama Anak / Jenis Terapi / Terapis / tanggal / status.
3. **Klarifikasi dulu ke klien**: apakah ini halaman baru berdiri sendiri, atau tab/section di dalam halaman Absensi yang sudah ada — karena tumpang tindih nama berpotensi membingungkan kalau digabung begitu saja tanpa penjelasan yang jelas di UI.

**Effort:** M (list view baru di atas data `Session` yang sudah ada — tidak perlu schema baru untuk 3 field ini, tapi tetap kerja UI/API yang genuinely baru, bukan perluasan fitur Absensi yang sudah ada)

---

### 4.12 Detail Pertemuan & Sesi Paket (Nama Anak, Jenis Terapi, Terapis, Counter Sesi, Kategori Sesi)
**Yang salah sekarang:** Analog terdekat yang sudah ada adalah modal **"Kelola Sesi"** di `app/dashboard/schedules/page.tsx:2181-2262`, yang **sudah menampilkan**:
- Nama Anak (`rescheduleSlot.patientName`, baris 2192) — sudah ada
- Terapis (`rescheduleSlot.therapistName`, baris 2193) — sudah ada
- **Counter Sesi sudah diimplementasikan** persis dalam bentuk "N/M" yang diminta, cuma frasenya bahasa Indonesia: `Sesi ke-{sessionNumber} dari {total}` (baris 2196), di-backing oleh `sessionProgress: {completed, total, sessionNumber}` yang dihitung di `app/api/weekly-schedule/route.ts` dan dikonsumsi di `page.tsx:233`.
- Jenis Terapi (OT/TW/HB) — **datanya sudah tersedia** di objek slot (`WeeklySlot.therapyType`, interface baris 147) tapi **belum ditampilkan** di dalam modal ini (cuma dipakai untuk warna background kartu di tempat lain).
- Kategori/Jenis Sesi (Evaluasi/Hero Bridge/Asesmen/Screening) — **tidak ada representasi apapun** di schema manapun. Enum `WeeklySchedule.therapyType` cuma `['OT','TW','HB']`; enum `TokenTransaction.therapyType` cuma `['OT','TW','assessment']`; `Assessment` adalah collection terpisah sendiri untuk janji asesmen OT/TW. Pencarian menyeluruh untuk kata "Screening" dan "Evaluasi" **nol hasil** di seluruh codebase — dua kategori ini tidak punya representasi apapun dengan nama apapun, dan "Hero Bridge"/"Asesmen" cuma ada sebagai pecahan dari konsep `therapyType`/model terpisah yang lebih sempit di atas, bukan sebagai satu field kategori sesi yang menyatukan semuanya.

**Kenapa rusak (yang butuh field baru):** Field identitas dan counter memang sudah dibangun dan tinggal ditampilkan di satu tempat lagi (tambahkan tampilan `therapyType` ke modal yang sudah ada). Field kategori yang diminta klien (Evaluasi/Hero Bridge/Asesmen/Screening sebagai satu enum yang menyatukan semua jenis pertemuan) adalah konsep yang genuinely baru dan tidak memetakan ke schema manapun yang ada saat ini.

**File:** `app/dashboard/schedules/page.tsx` (2190-2209, interface `WeeklySlot` 140-158), `app/api/weekly-schedule/route.ts` (perhitungan `sessionProgress`), `models/Session.ts` (perlu field baru), `models/WeeklySchedule.ts`, `models/Assessment.ts`, `models/TokenTransaction.ts`

**Cara perbaikinnya:**
1. **Quick win**: render `rescheduleSlot.therapyType` sebagai badge di modal "Kelola Sesi" yang sudah ada — datanya sudah tersedia, biaya implementasi nyaris nol.
2. Untuk field kategori: tambah `Session.sessionCategory: 'evaluasi'|'hero_bridge'|'asesmen'|'screening'|'regular'` (atau nama lain, perlu dikonfirmasi ke klien), rekonsiliasi/backfill terhadap collection `Assessment` yang sudah ada dan kasus `WeeklySchedule.therapyType='HB'` yang sudah ada. **Perlu keputusan desain data dengan klien dulu**: apakah field baru ini menggantikan atau melengkapi `therapyType`/`Assessment` yang sudah ada — karena "Asesmen" sudah punya collection sendiri, menyatukannya ke satu enum di `Session` punya implikasi ke data model yang perlu dipikirkan matang.
3. Setelah field-nya jelas, tampilkan sebagai badge tambahan di samping counter/nama/terapis yang sudah ada di modal yang sama.

**Effort:** Tampilkan jenis terapi di modal S · Field Kategori/Jenis Sesi baru (schema + rekonsiliasi dengan konsep Assessment/therapyType yang sudah ada + UI) M–L

---

## 🧹 Dead Code yang Ditemukan (bonus, di luar checklist klien)

Ditemukan selama investigasi — tidak wajib dikerjakan, tapi baik dibersihkan supaya tidak membingungkan developer berikutnya:

- `components/search/global-search-bar.tsx`, `components/search/search-results.tsx`, `models/SearchIndex.ts` — sistem search global lengkap yang **tidak pernah dipasang** di halaman manapun, dan tidak ada `/api/search` route.
- `components/child-profile/child-profile-layout.tsx` — komponen profil anak yang tidak dipakai (halaman aktif adalah `app/dashboard/patients/[id]/page.tsx`).
- `PackageSessionModal` di `app/dashboard/schedules/page.tsx:2154-2163` — trigger UI-nya tidak pernah dipanggil dari manapun, padahal endpoint backend-nya (`POST /api/children/[id]/sessions`) justru berguna untuk item Admin 4.3 di atas.
- `models/Conversation.ts` method `markAsRead()`/`incrementUnreadCount()` — ditulis lengkap tapi tidak pernah dipanggil (lihat Admin 4.9).

---

## 📊 Ringkasan Prioritas & Effort

**Quick wins (S, bisa dikerjakan segera, dampak langsung terlihat ke klien):**
- Super Admin 2.1 (fix enum edit paket — 1 baris kode)
- Super Admin 2.3 (fix input harga/sesi tidak bisa dikosongkan)
- Super Admin 2.5 (hapus check-in super admin)
- Parent 1.3 (Halo Parent + font), 1.6 (dual tanggal), 1.9 (styling komentar), 1.10 (sembunyikan icon)
- Admin 4.1 (frekuensi terapi), 4.4+4.5 (search+filter jadwal, bundel), 4.7 (hapus keterangan)

**Perlu keputusan produk dari klien dulu sebelum dikerjakan:**
- Super Admin 2.2 (gabung OT/TW — hapus opsi lama atau cuma diarahkan?)
- Admin 4.6 (alamat: reuse field keluarga atau field baru per-anak?)
- Admin 4.11 (Absensi Anak: halaman baru atau tab di Absensi lama?)
- Admin 4.12 (kategori sesi: field baru menggantikan/melengkapi Assessment model yang sudah ada?)

**Epic besar (butuh infrastruktur baru, kerjakan sebagai proyek tersendiri):**
- Sistem Notifikasi — Parent 1.2, Terapis 3.5, Admin 4.9 (M–L)
- Sistem PDF/Invoice Template — Parent 1.7/1.8, Super Admin 2.4 (M–L)
- Layout responsif mobile — Terapis 3.1/3.2 (S–M)
- Admin 4.3 — jadwal susulan mid-paket (L, ada bug data yang perlu diperbaiki juga)
- Terapis 3.4 — optimasi upload video (S→L bertahap)
