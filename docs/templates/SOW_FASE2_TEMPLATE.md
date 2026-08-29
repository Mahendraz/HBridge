# STATEMENT OF WORK (SOW) — FASE 2
## Platform Hearty Bridge — Deployment & Pengembangan Lanjutan

---

**Nomor SOW:** HB-SOW2-[TAHUN]-[NOMOR]
**Tanggal:** [Tanggal]
**Referensi Kontrak:** HB-KONTR-[TAHUN]-[NOMOR]

---

## PARA PIHAK

| | Pihak Pertama | Pihak Kedua |
|-|---------------|-------------|
| **Nama** | [Nama Developer] | [Nama PIC Klinik] |
| **Lembaga** | — | [Nama Klinik] |
| **Email** | [Email] | [Email PIC] |
| **No. HP** | [No. HP] | [No. HP PIC] |

---

## 1. LATAR BELAKANG

SOW ini merupakan kelanjutan dari Fase 1 (penyerahan MVP) yang telah diselesaikan pada **[tanggal serah terima Fase 1]**. Dokumen ini mengatur scope, jadwal, dan pembayaran untuk Fase 2 pengembangan platform Hearty Bridge.

---

## 2. SCOPE PEKERJAAN FASE 2

Centang (✓) item yang disepakati:

### A. Deployment ke Server Produksi
- [ ] Pemilihan dan setup VPS / cloud server (DigitalOcean / Contabo / lainnya)
- [ ] Konfigurasi domain dan SSL certificate (HTTPS)
- [ ] Setup CI/CD pipeline (auto-deploy dari repository)
- [ ] Konfigurasi environment produksi (env variables, secrets)
- [ ] Setup backup database otomatis
- [ ] Monitoring uptime dasar
- **Estimasi:** Rp 2.500.000 – Rp 4.000.000

### B. Modul Super Admin
- [ ] Dashboard super admin terpisah dari admin biasa
- [ ] Manajemen multi-unit / multi-klinik (jika dibutuhkan)
- [ ] Override dan oversight semua data di sistem
- [ ] Laporan agregat lintas klinik
- [ ] Manajemen lisensi / akun klinik
- [ ] Konfigurasi sistem tingkat platform
- **Estimasi:** Rp 5.000.000 – Rp 8.000.000

### C. Sistem Invoicing / Penagihan
- [ ] Generate invoice otomatis per sesi terapi
- [ ] Template invoice yang dapat dikustomisasi
- [ ] Histori tagihan per pasien / orang tua
- [ ] Status pembayaran (belum bayar, lunas, sebagian)
- [ ] Export invoice ke PDF
- [ ] Laporan keuangan bulanan
- [ ] Integrasi notifikasi tagihan via pesan
- **Estimasi:** Rp 4.000.000 – Rp 7.000.000

### D. Fitur Tambahan Lainnya *(TBD)*

| No. | Deskripsi Fitur | Estimasi | Disepakati |
|-----|----------------|---------|------------|
| 1 | [Nama fitur] | Rp | [ ] |
| 2 | [Nama fitur] | Rp | [ ] |
| 3 | [Nama fitur] | Rp | [ ] |

---

## 3. YANG TIDAK TERMASUK DALAM SCOPE INI

- Pengembangan aplikasi mobile (iOS / Android)
- Integrasi payment gateway (Midtrans, Xendit, dll.) — dapat ditambahkan sebagai item terpisah
- Desain ulang UI/UX secara menyeluruh
- Fitur di luar yang tercantum di atas

*Setiap penambahan di luar scope ini akan diproses sebagai Change Order terpisah.*

---

## 4. NILAI DAN PEMBAYARAN FASE 2

### 4.1 Rincian Biaya

| Item | Estimasi |
|------|---------|
| A. Deployment | Rp ________ |
| B. Modul Super Admin | Rp ________ |
| C. Sistem Invoicing | Rp ________ |
| D. Fitur Tambahan | Rp ________ |
| **TOTAL FASE 2** | **Rp ________** |

### 4.2 Jadwal Pembayaran (50/50)

| Termin | Kondisi | Nominal |
|--------|---------|---------|
| **Termin 3** | Saat SOW ini ditandatangani | 50% = Rp ________ |
| **Termin 4** | Setelah seluruh Fase 2 diserahkan dan diterima | 50% = Rp ________ |

---

## 5. ESTIMASI WAKTU PENGERJAAN

| Item | Estimasi Durasi |
|------|----------------|
| Setup Deployment | [X] hari kerja |
| Modul Super Admin | [X] hari kerja |
| Sistem Invoicing | [X] hari kerja |
| Fitur Tambahan | [X] hari kerja |
| Testing & QA | [X] hari kerja |
| **Total Estimasi** | **[X] hari kerja** |

*Pengerjaan dimulai setelah Termin 3 diterima.*

---

## 6. KRITERIA PENERIMAAN (ACCEPTANCE CRITERIA)

Fase 2 dinyatakan selesai dan siap pelunasan jika:

**Deployment:**
- [ ] Aplikasi dapat diakses melalui domain produksi (HTTPS)
- [ ] Semua fitur MVP berjalan normal di environment produksi
- [ ] Backup database berjalan otomatis

**Super Admin:**
- [ ] Super Admin dapat login dengan akses khusus
- [ ] Semua fitur Super Admin berfungsi sesuai scope yang disepakati
- [ ] Data multi-unit tampil dengan benar (jika applicable)

**Invoicing:**
- [ ] Invoice dapat digenerate untuk setiap sesi
- [ ] Export PDF berfungsi
- [ ] Histori tagihan tampil dengan benar
- [ ] Laporan bulanan dapat diakses

**Umum:**
- [ ] Tidak ada bug kritikal yang belum diperbaiki
- [ ] Sesi demo/handover Fase 2 telah dilaksanakan

---

## 7. GARANSI FASE 2

Sama dengan Fase 1: **30 hari kalender** sejak serah terima Fase 2 untuk bug pada fitur yang tercantum dalam scope SOW ini.

---

## 8. PERSETUJUAN

Dengan menandatangani dokumen ini, Para Pihak menyetujui scope, nilai, dan jadwal pembayaran Fase 2 sebagaimana tercantum di atas.

| | Pihak Pertama (Developer) | Pihak Kedua (Client) |
|-|--------------------------|----------------------|
| **Nama** | [Nama Developer] | [Nama PIC Klinik] |
| **Tanda Tangan** | | |
| **Tanggal** | | |

---

*SOW ini merupakan bagian dari Perjanjian Kerja Sama No. HB-KONTR-[TAHUN]-[NOMOR]*
