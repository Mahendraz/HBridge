# PROPOSAL PENAWARAN JASA PENGEMBANGAN SISTEM
## Platform Hearty Bridge — Sistem Manajemen Terapi Anak

---

**Kepada Yth.**
[Nama Pimpinan / Manajer]
[Nama Klinik / Lembaga]
[Alamat Klinik]

**Dari:**
[Nama Developer]
[Email] | [No. HP / WhatsApp]

**Tanggal:** [Tanggal Proposal]
**Nomor Proposal:** HB-PROP-[TAHUN]-[NOMOR]

---

## 1. PENDAHULUAN

Dengan hormat,

Terima kasih atas kepercayaan [Nama Klinik] dalam melibatkan kami untuk pengembangan Sistem Manajemen Terapi Anak berbasis web. Melalui proposal ini, kami menyampaikan penawaran resmi untuk pengembangan dan penyerahan platform **Hearty Bridge** — sebuah solusi digital terintegrasi yang dirancang khusus untuk mendukung operasional klinik dan mempererat kolaborasi antara terapis, orang tua, dan tim manajemen.

---

## 2. GAMBARAN SOLUSI

**Hearty Bridge** adalah platform berbasis web modern yang menyediakan ekosistem digital lengkap untuk pengelolaan program terapi anak. Platform ini dibangun menggunakan teknologi terkini dan telah mencapai tahap MVP (Minimum Viable Product) yang siap digunakan.

### Teknologi yang Digunakan
| Komponen | Teknologi |
|----------|-----------|
| Framework | Next.js 16 (React) |
| Bahasa Pemrograman | TypeScript |
| Database | MongoDB (NoSQL Cloud-ready) |
| Penyimpanan File | Cloudflare R2 (Enterprise-grade) |
| Tampilan | Tailwind CSS (Responsive) |
| Keamanan | JWT Authentication, bcrypt hashing |
| Bahasa | Indonesia & English |

---

## 3. FITUR YANG TERSEDIA (MVP)

### A. Manajemen Pengguna & Akses
- Sistem login multi-role (Admin, Terapis, Orang Tua)
- Pendaftaran akun dengan verifikasi
- Manajemen profil dan kata sandi
- Kontrol akses berbasis peran (RBAC)

### B. Manajemen Pasien (Anak)
- Profil lengkap setiap anak (data pribadi, medis, kontak darurat)
- Riwayat kondisi, obat-obatan, dan alergi
- Penugasan terapis ke pasien (oleh admin)
- Sistem token/sesi

### C. Penjadwalan Sesi Terapi
- Jadwal sesi terapi (tatap muka, video, telepon)
- Status sesi: terjadwal, selesai, dibatalkan, tidak hadir
- Catatan sesi, tujuan, dan langkah berikutnya
- Integrasi Google Meet untuk sesi video
- Tampilan jadwal mingguan per terapis

### D. Sistem Pesan (Messaging)
- Pesan langsung antara terapis dan orang tua
- Grup percakapan & saluran dukungan
- Reaksi emoji pada pesan
- Threading (balasan pesan)
- Status baca & notifikasi pesan belum dibaca

### E. Manajemen Dokumen
- Upload dokumen medis, pendidikan, legal
- Kontrol tingkat akses (khusus orang tua / terapis / bersama)
- Peringatan dokumen mendekati kedaluwarsa
- Pencarian berdasarkan teks dan tag

### F. Galeri Media
- Upload foto, video, dan audio perkembangan anak
- Pengelolaan tag dan metadata
- Kontrol privasi (publik/privat)
- Kapasitas file hingga 100MB

### G. Laporan & Progress
- Pembuatan laporan terapi dan assessment
- Tracking perkembangan dengan skor mingguan
- Pelacakan milestone perkembangan anak
- Lampiran media pada laporan

### H. Manajemen Keluarga
- Grup keluarga dengan anggota extended (pengasuh, kontak darurat)
- Pengaturan izin akses per anggota
- Visualisasi pohon keluarga

### I. Absensi Terapis
- Check-in dengan validasi geolokasi
- Tracking ketepatan waktu
- Laporan kehadiran

### J. Dashboard Admin
- Statistik platform (total pengguna, sesi, laporan)
- Log aktivitas sistem
- Manajemen pengguna dan penugasan terapis

### K. Pencarian Global
- Pencarian full-text di seluruh konten
- Filter lanjutan berdasarkan tipe, tanggal, akses
- Saran pencarian otomatis

---

## 4. STRUKTUR PEMBAYARAN

Pengembangan dilakukan dalam 2 fase utama dengan sistem termin yang transparan.

---

### FASE 1 — Penyerahan MVP

**Nilai**: **Rp 25.000.000** (Dua Puluh Lima Juta Rupiah)

| Termin | Kondisi Pembayaran | Nominal |
|--------|-------------------|---------|
| **Termin 1** | Saat perjanjian kerja ditandatangani | **Rp 12.500.000** |
| **Termin 2** | Setelah MVP diserahkan dan diterima client | **Rp 12.500.000** |

**Yang diserahkan dalam Fase 1:**
- Source code lengkap aplikasi Hearty Bridge (MVP)
- Panduan instalasi dan konfigurasi environment
- Dokumentasi API endpoint
- Sesi demo dan serah terima (maks. 2 jam)
- Garansi perbaikan bug selama **30 hari kalender** sejak tanggal serah terima
  *(hanya mencakup bug pada fitur yang sudah ada, bukan permintaan fitur baru)*

---

### FASE 2 — Deployment & Pengembangan Lanjutan

**Estimasi Nilai**: **Rp 12.000.000 – Rp 20.000.000**
*(Nilai final disepakati dalam SOW Fase 2 terpisah)*

Cakupan yang direncanakan:

| Item | Estimasi |
|------|---------|
| Setup deployment (VPS/cloud, domain, SSL, CI/CD) | Rp 2.500.000 – Rp 4.000.000 |
| Modul Super Admin (manajemen multi-unit klinik) | Rp 5.000.000 – Rp 8.000.000 |
| Sistem Invoicing (faktur otomatis, histori, export PDF) | Rp 4.000.000 – Rp 7.000.000 |
| Fitur tambahan (sesuai kebutuhan) | Sesuai kesepakatan |

| Termin | Kondisi Pembayaran | Nominal |
|--------|-------------------|---------|
| **Termin 3** | Saat SOW Fase 2 ditandatangani | 50% dari total Fase 2 |
| **Termin 4** | Setelah Fase 2 selesai dan diterima | 50% dari total Fase 2 |

---

### LAYANAN MAINTENANCE BERKELANJUTAN

Setelah proyek selesai, kami menyediakan paket dukungan bulanan:

| Paket | Biaya/Bulan | Kapasitas Kerja |
|-------|------------|-----------------|
| Lite | Rp 1.500.000 | Maks. 3 jam/bulan |
| **Regular** *(Rekomendasi)* | **Rp 2.500.000** | **Maks. 6 jam/bulan** |
| Pro | Rp 4.000.000 | Maks. 10 jam/bulan |

**Semua paket mencakup:**
- Perbaikan bug dan error
- Update keamanan & dependency
- Monitoring ketersediaan sistem
- Konsultasi teknis via WhatsApp/Telegram

**Tarif di luar paket:**
- Pengembangan fitur baru: Rp 300.000/jam
- Emergency support (< 4 jam respon): Rp 450.000/jam

---

## 5. RINGKASAN INVESTASI

| Komponen | Nilai |
|----------|-------|
| Fase 1 — MVP | Rp 25.000.000 |
| Fase 2 — Deployment + Fitur Lanjutan | Rp 12.000.000 – Rp 20.000.000 |
| **Total Proyek** | **Rp 37.000.000 – Rp 45.000.000** |
| Maintenance (opsional, per bulan) | Rp 1.500.000 – Rp 4.000.000 |

---

## 6. KETENTUAN UMUM

### Kepemilikan
- Setelah seluruh pembayaran dilunasi, seluruh source code menjadi milik penuh [Nama Klinik].
- Sebelum pelunasan, source code berstatus hak pakai (bukan milik).

### Pembayaran
- Metode: Transfer bank / rekening yang akan dikonfirmasi
- Setiap termin dikonfirmasi dengan bukti transfer
- Pekerjaan fase berikutnya dimulai setelah pembayaran termin berjalan diterima

### Garansi
- Garansi bug 30 hari berlaku untuk Fase 1 dan Fase 2 secara terpisah
- Garansi tidak berlaku untuk kerusakan akibat perubahan yang dilakukan pihak lain

### Revisi & Perubahan Scope
- Perubahan di luar scope yang telah disepakati akan dikenakan biaya terpisah
- Permintaan perubahan signifikan diproses melalui Change Order tertulis

### Kerahasiaan
- Semua data pasien dan informasi klinik bersifat rahasia dan tidak akan disebarluaskan

---

## 7. VALIDITAS PROPOSAL

Proposal ini berlaku selama **30 hari** sejak tanggal penerbitan.

---

## 8. PERSETUJUAN

Dengan menandatangani dokumen ini, kedua pihak menyetujui seluruh ketentuan yang tercantum.

| | Developer | Client |
|-|-----------|--------|
| **Nama** | [Nama Developer] | [Nama Perwakilan Klinik] |
| **Jabatan** | Software Developer | [Jabatan] |
| **Tanda Tangan** | | |
| **Tanggal** | | |

---

*Untuk pertanyaan lebih lanjut, hubungi kami di [Email] atau [No. WhatsApp]*
