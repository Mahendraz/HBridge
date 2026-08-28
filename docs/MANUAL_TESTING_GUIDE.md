# Panduan Manual Testing — Hearty Bridge

**URL Aplikasi:** https://heartybridge.id
**Terakhir diperbarui:** Juni 2026

---

## Akun Test

| Role | Nama | Email | Password | ID |
|------|------|-------|----------|----|
| Super Admin | Super Admin | superadmin@heartybridge.com | `SuperAdmin2024!` | `6a3ee9f5eb7af44a5538d661` |
| Admin | Admin | admin@heartybridge.com | `Admin@HB2024!` | — |
| Admin | Citra | citra@hb.com | `Citra@HB2024!` |
| Terapis | Dinda | dinda@hb.com | `Dinda@HB2024!` |
| Terapis | Haya | haya@hb.com | `Haya@HB2024!` |
| Terapis | Dhea | dhea@hb.com | `Dhea@HB2024!` |
| Orang Tua | Budi Santoso | budi@hbridge.id | `parent123` |
| Orang Tua | Dewi Rahayu | dewi@hbridge.id | `parent123` |
| Orang Tua | Ahmad Fauzi | ahmad@hbridge.id | `parent123` |
| Orang Tua | Siti Nurhaliza | siti@hbridge.id | `parent123` |
| Orang Tua | Hendra Kusuma | hendra@hbridge.id | `parent123` |
| Orang Tua | Ratna Wulandari | ratna@hbridge.id | `parent123` |
| Orang Tua | Doni Prasetyo | doni@hbridge.id | `parent123` |
| Orang Tua | Anita Setiawan | anita@hbridge.id | `parent123` |
| Orang Tua | Rudi Hermawan | rudi@hbridge.id | `parent123` |
| Orang Tua | Maya Indah | maya@hbridge.id | `parent123` |
| Orang Tua | Eko Wahyudi | eko@hbridge.id | `parent123` |
| Orang Tua | Fitri Handayani | fitri@hbridge.id | `parent123` |
| Orang Tua | Agus Supriyadi | agus@hbridge.id | `parent123` |
| Orang Tua | Lina Marlina | lina@hbridge.id | `parent123` |

> **Semua akun orang tua:** password = `parent123`
> Di-seed via `scripts/seed-patients.js`. Jalankan ulang script untuk reset data.

## Data yang Ada (setelah seed)

| Data | Jumlah |
|------|--------|
| Orang Tua | 14 |
| Anak | 18 (4 parents × 2 anak, 10 parents × 1 anak) |
| Paket | 3 — Silver (8 sesi/Rp1.6jt), Gold (12/Rp2.4jt), Diamond (16/Rp3.2jt) |
| Jadwal Mingguan | 18 slot — 3 per hari, Senin–Sabtu |
| Sesi | ~119 completed (historis 1–7 minggu ke belakang) |
| Laporan | ~71 (campuran draft + completed, ~60% dari sesi) |
| Invoice | 18 — 40% paid · 30% unpaid · 20% overdue · 10% not submitted |

**Therapist assignment:** Dinda → Haya → Dhea → round-robin per anak

---

## 1. Login & Autentikasi

**URL:** `/auth/login`

| # | Langkah | Ekspektasi |
|---|---------|-----------|
| 1 | Login sebagai Admin (`admin@heartybridge.com` / `Admin@HB2024!`) | Masuk ke dashboard admin |
| 2 | Login sebagai Terapis (`dinda@hb.com` / `Dinda@HB2024!`) | Masuk ke dashboard terapis |
| 3 | Login sebagai Orang Tua (`sinta.amelia@gmail.com` / `Sinta@HB2024!`) | Masuk ke dashboard orang tua |
| 4 | Login password salah | Tampil pesan error |
| 5 | Login email tidak terdaftar | Tampil pesan error |
| 6 | Klik Logout | Redirect ke halaman login |
| 7 | Akses `/dashboard` tanpa login | Redirect ke login |

---

## 2. Dashboard

**URL:** `/dashboard`

### Sebagai Admin
- Tampil statistik: total terapis, total pasien, sesi hari ini
- Tampil upcoming schedules

### Sebagai Terapis (Dinda)
- Tampil statistik terkait pasien & jadwal Dinda

### Sebagai Orang Tua (Sinta)
- Tampil 2 statistik: **Sesi yang Sudah Dilalui** + **Sesi yang Tersisa** (token: 3)

---

## 3. Jadwal Mingguan

**URL:** `/dashboard/schedules`

| # | Langkah | Ekspektasi |
|---|---------|-----------|
| 1 | Login sebagai **Admin** → buka Jadwal | Tampil tabel jadwal semua terapis |
| 2 | Lihat slot Senin 09:00 (Zahra Amelia / Dinda) | Ada ikon ✅ atau ⚠️ |
| 3 | Klik ⚠️ (slot tanpa laporan) | Redirect ke `/dashboard/reports/new?childId=...&sessionDate=...&sessionHour=9&therapyType=OT` |
| 4 | Login sebagai **Terapis (Dinda)** → buka Jadwal | Tampil hanya jadwal Dinda |
| 5 | Slot masa lalu tanpa laporan → ikon ⚠️ tersedia | Bisa klik meski sudah lewat |
| 6 | Slot sudah ada laporan → ikon ✅ | Tidak ada tombol buat laporan |
| 7 | Tambah jadwal baru (Admin) | Form muncul, simpan berhasil |

---

## 4. Laporan

**URL:** `/dashboard/reports`

### Buat Laporan dari Jadwal (flow utama)
| # | Langkah | Ekspektasi |
|---|---------|-----------|
| 1 | Login sebagai Dinda → Jadwal → klik ⚠️ di slot Zahra Amelia | Redirect ke halaman buat laporan |
| 2 | Halaman baru terbuka | Nama Zahra Amelia, tanggal sesi, jam 09:00, OT sudah terisi |
| 3 | Judul otomatis terisi | "Laporan Sesi — Zahra Amelia — [tanggal]" |
| 4 | Isi deskripsi & konten → Simpan | Laporan tersimpan, redirect ke daftar laporan |

### Buat Laporan Manual
| # | Langkah | Ekspektasi |
|---|---------|-----------|
| 5 | Login Dinda → Laporan → "Buat Laporan" | Form kosong terbuka |
| 6 | Pilih pasien | Hanya tampil **Zahra Amelia** (pasien milik Dinda) |
| 7 | Coba POST laporan untuk pasien orang lain via URL manipulation | Error 403 |

### Orang Tua Lihat Laporan
| # | Langkah | Ekspektasi |
|---|---------|-----------|
| 8 | Login Sinta → Laporan | Tampil laporan milik Zahra Amelia |
| 9 | Tidak ada tombol buat laporan | Menu buat laporan tidak muncul |

---

## 5. Data Pasien / Anak Saya

**URL:** `/dashboard/patients`

| # | Langkah | Ekspektasi |
|---|---------|-----------|
| 1 | Login **Admin** → Pasien | Tampil semua anak aktif |
| 2 | Login **Dinda** → Pasien | Hanya tampil **Zahra Amelia** |
| 3 | Login **Sinta** → Anak Saya | Tampil Zahra Amelia |
| 4 | Sinta: lihat "Terapis yang Ditugaskan" | Tampil nama Dinda (bukan "-") |
| 5 | Sinta: klik "Hubungi" | Redirect ke Pesan, conversation dengan Dinda terbuka/dibuat otomatis |
| 6 | Login **Hendra** → Anak Saya | List kosong (tidak ada anak) |

---

## 6. Absensi

**URL:** `/dashboard/attendance`

| # | Langkah | Ekspektasi |
|---|---------|-----------|
| 1 | Login **Admin** → Absensi | Tampil daftar semua staff (hadir/tidak hadir) |
| 2 | Login **Terapis (Dinda)** → Absensi | Tampil daftar semua staff (sama seperti admin) |
| 3 | Tombol "Check In" di halaman absensi | Hanya bisa check-in untuk diri sendiri |
| 4 | Admin check-in | Absensi admin tercatat |
| 5 | Dinda check-in | Absensi Dinda tercatat |
| 6 | Check-in dua kali di hari yang sama | Tombol berubah jadi sudah check-in / tidak bisa dua kali |
| 7 | Lihat riwayat 30 hari | Data historis absensi tampil |

---

## 7. Pesan

**URL:** `/dashboard/messages`

| # | Langkah | Ekspektasi |
|---|---------|-----------|
| 1 | Login Sinta → Anak Saya → klik "Hubungi" di kartu Zahra | Redirect ke Pesan, auto-open chat dengan Dinda |
| 2 | Kirim pesan ke Dinda | Pesan terkirim |
| 3 | Login Dinda → Pesan | Percakapan dari Sinta tersedia |
| 4 | Dinda balas pesan | Reply terkirim |
| 5 | Login Admin → Pesan → buat percakapan baru | Bisa pilih peserta dari semua user |

---

## 8. Dokumen

**URL:** `/dashboard/documents`

| # | Langkah | Ekspektasi |
|---|---------|-----------|
| 1 | Login Admin → Dokumen → Upload dokumen | Form upload tersedia |
| 2 | Set akses: "Dibagikan" / "Hanya Terapis" / "Hanya Orang Tua" | Opsi tersedia |
| 3 | Login Sinta → Dokumen | Hanya tampil dokumen dengan akses "Dibagikan" atau "Hanya Orang Tua" |
| 4 | Login Dinda → Dokumen | Tampil dokumen sesuai akses terapis |
| 5 | Klik nama dokumen | Buka / unduh dokumen |

---

## 9. Profil

**URL:** `/dashboard/profile`

| # | Langkah | Ekspektasi |
|---|---------|-----------|
| 1 | Login sebagai siapapun → Profil | Data profil tampil |
| 2 | Edit nama / nomor telepon → Simpan | Perubahan tersimpan |
| 3 | Ganti password (isi password lama yang benar) | Password berhasil diubah |
| 4 | Ganti password (isi password lama yang salah) | Error tampil |

---

## 10. Manajemen User (Admin)

**URL:** `/dashboard/settings` atau menu Admin

| # | Langkah | Ekspektasi |
|---|---------|-----------|
| 1 | Login Admin → lihat daftar semua user | Tampil semua admin, terapis, orang tua |
| 2 | Nonaktifkan user | `isActive: false`, user tidak bisa login |
| 3 | Aktifkan kembali | User bisa login lagi |

---

## 11. Pencarian Global

| # | Langkah | Ekspektasi |
|---|---------|-----------|
| 1 | Klik search bar di header | Search box terbuka |
| 2 | Ketik "Zahra" | Muncul hasil: anak / laporan / dokumen terkait |
| 3 | Login sebagai Sinta → cari "Zahra" | Hanya hasil milik Sinta |

---

## Checklist Singkat per Role

### Admin
- [ ] Login ✓
- [ ] Dashboard stats tampil ✓
- [ ] Jadwal: lihat semua slot, tambah jadwal baru ✓
- [ ] Laporan: lihat semua laporan ✓
- [ ] Pasien: lihat semua anak ✓
- [ ] Absensi: lihat semua staff + check-in diri sendiri ✓
- [ ] Pesan: buat percakapan ✓
- [ ] Dokumen: upload & atur akses ✓

### Terapis (Dinda)
- [ ] Login ✓
- [ ] Jadwal: hanya slot Dinda ✓
- [ ] Klik ⚠️ → redirect ke buat laporan dengan data terisi ✓
- [ ] Laporan: hanya untuk Zahra Amelia (pasien Dinda) ✓
- [ ] Pasien: hanya Zahra Amelia ✓
- [ ] Absensi: lihat semua staff + check-in diri sendiri ✓

### Orang Tua (Sinta)
- [ ] Login ✓
- [ ] Dashboard: 2 stats (Sesi dilalui + Sesi tersisa 3 token) ✓
- [ ] Anak Saya: Zahra Amelia tampil + terapis = Dinda ✓
- [ ] Klik "Hubungi" → otomatis chat dengan Dinda ✓
- [ ] Laporan: lihat laporan Zahra tanpa bisa buat baru ✓
- [ ] Absensi: tidak ada akses ✓

---

*Untuk reset password akun, jalankan: `node scripts/reset-staff-known-pw.js`*
