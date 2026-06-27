# Dashboard Views Per Role — Hearty Bridge

> Hasil eksplorasi per 2026-06-27. Mencakup semua halaman dashboard dan perbedaan tampilan/aksi per role.

---

## Navigasi Sidebar

| Halaman | admin | therapist | super_admin | parent |
|---------|-------|-----------|-------------|--------|
| Dashboard | ✅ | ✅ | ✅ | ✅ |
| Pasien / Anak Saya | ✅ | ✅ | ✅ | ✅ |
| Terapis | ✅ | ❌ | ✅ | ❌ |
| Jadwal / Janji Temu | ✅ | ✅ | ✅ | ✅ |
| Laporan | ✅ | ✅ | ✅ | ✅ |
| Absensi | ✅ | ✅ | ✅ | ❌ |
| Invoicing | ✅ | ❌ | ✅ | ✅ (read-only) |
| Kelola Paket | ❌ | ❌ | ✅ | ❌ |
| Laporan Keuangan | ❌ | ❌ | ✅ | ❌ |

> Badge unresolved comment di menu "Laporan" muncul untuk `admin`, `therapist`, dan `super_admin`.

---

## `/dashboard` — Halaman Utama

### admin & therapist
- Stats cards: Total Users, Total Terapis, Total Pasien, Pertumbuhan Pengguna
- Quick Actions (berdasarkan permission): Tambah Pasien, Buat Laporan, Kelola Jadwal
- Widget jadwal minggu ini

### parent
- Stats cards: Anak Saya, Janji Berikutnya, Update Progress, Laporan Terbaru
- Quick actions: Lihat Progress Anak, Hubungi Terapis, Lihat Jadwal

### super_admin
- Sama dengan `admin` — load data via `loadAdminData()`
- Stats cards: Total Pengguna, Terapis Aktif, Pasien Aktif
- Welcome message: "Kelola sistem praktik terapi Anda"

---

## `/dashboard/patients` — Halaman Pasien

### admin
- Title: "Daftar Pasien"
- Tampilkan semua pasien, dikelompokkan per orang tua
- Tombol: **"Tambah Orang Tua"** (buat akun parent baru via `/api/admin/users`) + **"Tambah Pasien"**

### therapist
- Title: "Pasien Saya"
- Hanya tampilkan pasien yang di-assign ke terapis ini
- Tombol: **"Tambah Pasien"** saja (tanpa "Tambah Orang Tua")

### parent
- Title: "Anak Saya"
- Tampilan berbeda: card detail per anak dengan:
  - Paket terapi (Gold / Platinum / Diamond), saldo token, jenis terapi
  - Tombol **"Hubungi Terapis"**
  - Link ke progress & laporan per anak

### super_admin
- Tidak ada branch eksplisit → jatuh ke tampilan admin
- Fungsional, tapi tidak intentional

---

## `/dashboard/schedules` — Jadwal

### admin & super_admin
- Grid mingguan Senin–Sabtu, jam 09.00–16.00
- Bisa **buat, edit, hapus** slot manapun
- Modal dropdown berisi semua pasien & semua terapis

### therapist
- Grid yang sama
- Tombol **"Buat Laporan"** muncul pada slot milik terapis ini (`isOwn = true`)
- Indikator "laporan sudah dibuat" per slot
- Tidak bisa edit slot milik terapis lain

### parent
- Grid yang sama tapi `isParentView = true` → **read-only**
- Tidak ada tombol buat/edit
- Hanya lihat sesi terjadwal anak mereka

---

## `/dashboard/reports` — Laporan

### Semua role
- List laporan sesuai scope akses masing-masing
- Semua bisa tambah komentar, balasan, dan reaksi emoji

### Perbedaan per role

| Fitur | admin | therapist | super_admin | parent |
|-------|-------|-----------|-------------|--------|
| Lihat semua laporan | ✅ | Hanya assigned | ✅ | Hanya anak sendiri |
| Resolve komentar | ✅ | Hanya laporan sendiri | ✅ | ❌ |
| Buat laporan | ✅ | ✅ | ✅ | ❌ |
| Tambah komentar | ✅ | ✅ | ✅ | ✅ |

```ts
// Logika canResolve (sudah difix):
const canResolve = user?.role === 'admin' ||
  user?.role === 'super_admin' ||
  (user?.role === 'therapist' && report.therapistId === user?._id)
```

---

## `/dashboard/attendance` — Absensi

Hanya untuk `admin`, `therapist`, `super_admin`. Parent tidak punya akses.

**Semua tiga role melihat tampilan yang sama:**
- Panel "Status Saya Hari Ini" dengan tombol check-in GPS
- Hasil check-in: Tepat Waktu / Terlambat, validasi lokasi GPS
- Tabel absensi semua staff untuk tanggal yang dipilih
- Grid rekap mingguan per staff
- Date picker untuk lihat histori

Tidak ada pembedaan tampilan antara admin/therapist/super_admin di halaman ini.

---

## `/dashboard/invoices` — Invoicing

### admin & super_admin
```ts
// Sudah difix:
const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';
```
Fitur management: edit due date, toggle visibilitas ke parent, tandai lunas, lihat bukti pembayaran, filter by visibility.

### parent
- List invoice yang visible untuk mereka (read-only)
- Bisa **upload bukti pembayaran** (file + pesan)
- Lihat status pengajuan pembayaran

### therapist
- Tidak ada akses (tidak muncul di sidebar)

---

## `/dashboard/super-admin/packages` — Kelola Paket (super_admin only)

Full CRUD paket terapi:
- List: nama, jumlah sesi, harga, jenis terapi (OT / TW / keduanya), status aktif
- Buat & edit via dialog form
- Toggle aktif/nonaktif per paket
- API: `/api/super-admin/packages`

---

## `/dashboard/super-admin/financial` — Laporan Keuangan (super_admin only)

**Tab Invoices:**
- Summary cards: total revenue, pending, overdue
- List invoice lengkap dengan filter status & rentang tanggal
- Bisa lihat bukti pembayaran

**Tab Transactions:**
- Histori transaksi token (topup/potong per anak)
- Saldo sebelum & sesudah per transaksi

---

## `/dashboard/messages` — Pesan

**Semua role:** langsung redirect ke `/dashboard` — halaman belum diimplementasi.

---

## Bugs — Sudah Difix (2026-06-27)

| # | File | Bug | Status |
|---|------|-----|--------|
| 1 | `app/dashboard/page.tsx` | `super_admin` tidak ada di switch-case data loading & stats cards | ✅ Fixed |
| 2 | `app/dashboard/reports/page.tsx` | `canResolve` tidak mencakup `super_admin` | ✅ Fixed |
| 3 | `app/dashboard/invoices/page.tsx` | `isAdmin` hanya cek `=== 'admin'`, bukan `super_admin` | ✅ Fixed |
| 4 | `components/layout/dashboard-sidebar.tsx` | Badge unresolved comment tidak muncul untuk `super_admin` | ✅ Fixed |
| 5 | `CLAUDE.md` (app-level) | Daftar roles tidak menyebut `super_admin` | ✅ Fixed |
