# Update Checklist - Catatan Evaluasi & Revisi Fitur (Demo 3)
**Tanggal Demo:** 15 Agustus 2026

---

## 📋 Table of Contents
1. [POV Orang Tua (Parent)](#1-pov-orang-tua-parent)
2. [POV Super Admin](#2-pov-super-admin)
3. [POV Terapis](#3-pov-terapis)
4. [Rangkuman Fitur & Kebutuhan Admin](#4-rangkuman-fitur--kebutuhan-admin)

---

## 1. POV Orang Tua (Parent)
*Pengguna: Citra (Ibu dari Fitra & Fitri)*

### 🔔 Notifikasi & UI Dashboard
* **Notifikasi Invoice:** Notifikasi invoice tidak muncul di dashboard (tidak ada indikator/lonceng notifikasi baru).
* **Lonceng Notifikasi Umum:** Lonceng notifikasi umum tidak tersedia/hilang.
* **Tampilan Kata Sambutan / Reset Password:**
  * Ubah teks judul dari *"Halo Citra..."* menjadi **"Halo Parent"**.
  * Perbesar ukuran font (*font size*) untuk judul ini.
* **Janji Temu (Dashboard):** Tambahkan informasi **tanggal** pada card/bagian janji temu.
* **Sisa Sesi Terapi:** Tambahkan widget/informasi **"Sisa Sesi Anda"** dengan tampilan yang menonjol dan font besar di dashboard.

### 📄 Laporan & Dokumen
* **Dual Tanggal pada Laporan:**
  1. **Tanggal Sesi:** Tanggal ketika sesi terapi berlangsung (saat ini masih berada di judul).
  2. **Tanggal Terupload:** Tanggal dokumen/laporan diunggah ke sistem (saat ini menggunakan label *tgl sesi*).
* **Download Laporan Harian:** Buat template dokumen (Docs/PDF) yang standar untuk pengunduhan Laporan Harian.
* **Download Invoice:** Fitur download invoice saat ini tidak berfungsi / error.

### 💬 Komentar & Visual
* **Styling Komentar:** Perbaiki tampilan latar belakang abu-abu pada komentar parent agar lebih rapi/dibaca dengan jelas.
* **Icon Notifikasi Komentar:** Hilangkan ikon notifikasi komentar pada Laporan Harian sisi Parent (ikon ini hanya boleh muncul di sisi Terapis dan Admin).

---

## 2. POV Super Admin

### 📦 Manajemen Paket & Produk
* **Edit Paket Asesmen:** Perbaiki fungsi edit paket asesmen yang saat ini masih mengalami error *invalid*.
* **Penggabungan Paket OT & TW:** Hapus paket OT (Okupasi Terapi) dan TW (Terapi Wicara) terpisah jika peruntukannya sudah digabung.
* **Input Form Paket:** Perbaiki *default value* / angka (*hardcoded/zero*) yang tidak bisa dihapus pada field **Harga** dan **Jumlah Sesi Terapi** saat menambah paket baru.

### 🧾 Invoice & Dokumentasi
* **Download Invoice:** Fitur download invoice belum berjalan. Sediakan template invoice yang standar.

### ⏱️ Absensi & Rekapitulasi
* **Fitur Check-in Super Admin:** Hapus fitur *check-in* untuk Super Admin (tidak diperlukan).
* **Rekap Absensi Terapis:** Buat fitur untuk menyajikan rekapitulasi hasil absensi terapis bulanan (1 bulan atau rentang beberapa bulan).

### 📊 Analitik & Reporting
* **Tren Pasien:** Tambahkan grafik/fitur analitik untuk mendeteksi kenaikan atau penurunan jumlah pasien.

---

## 3. POV Terapis

### 📱 Responsivitas Mobile (Portrait Mode)
* **Tampilan Jadwal:** Pada posisi HP *portrait*, tampilan tabel/grid jadwal terpotong sehingga beberapa informasi penting tidak terlihat.
* **Pelaporan & Analitik:** Informasi **Nama**, **Tanggal**, dan **Sesi** pada bagian Pelaporan & Analitik terpotong/tidak muncul di layar portrait.
* **Rekomendasi:** Lakukan penyesuaian CSS/layout (*responsive design*) agar seluruh data tetap dapat dibaca dengan jelas di layar ponsel.

### ⚡ Performa & Notifikasi
* **Upload Video:** Proses pengunggahan video terasa lambat. Perlu optimasi kompresi atau *chunked upload*.
* **Notifikasi Komentar Baru:** Belum ada pemberitahuan/notifikasi ketika ada komentar baru pada laporan. Perlu ditambahkan/diperbaiki.

---

## 4. Rangkuman Fitur & Kebutuhan Admin

### 📅 Manajemen Jadwal & Pencarian
* **Jadwal Anak:** Menampilkan frekuensi terapi anak dalam seminggu (contoh: *Terapi 3x dalam seminggu*).
* **Pencarian Anak:** Perbaiki fungsi pencarian berdasarkan nama anak yang belum berjalan.
* **Penambahan Jadwal di Tengah Paket:** Admin dapat menambahkan jadwal terapi susulan/tambahan di pertengahan paket berjalan.
* **Pencarian Jadwal Detail:** Fitur pencarian nama anak di halaman jadwal untuk melihat secara cepat hari dan jam berapa anak tersebut ada sesi terapi.
* **Filter Berdasarkan Terapis:** Fitur filter di halaman jadwal untuk memfilter list jadwal berdasarkan terapis tertentu.

### 👤 Profil Anak & Biodata
* **Detail Profil Anak:**
  * Tanggal mulai terapi.
  * Hari-hari jadwal terapi.
  * Kontak orang tua.
  * Alamat lengkap.
* **Catatan:** Kolom *keterangan* pada biodata dapat dihapus/tidak diperlukan.

### 🧾 Invoice & Sistem Notifikasi
* **Edit & Hapus Invoice:** Admin memiliki wewenang untuk mengedit dan menghapus invoice yang telah diterbitkan.
* **Notifikasi Otomatis:** Notifikasi yang sudah dibuka/dilihat atau selesai diproses harus otomatis hilang tanpa perlu melakukan *refresh* halaman secara manual (*real-time update*).

### 🎨 Tampilan & Tagging Warna Terapis
* Sistem kode warna (*color coding*) jadwal terapi berdasarkan nama terapis (dapat disesuaikan/edited):
  * **Dinda:** Hijau (`#2ECC71`)
  * **Dhea:** Pink (`#FF69B4`)
  * **Haya:** Biru (`#3498DB`)
  * **Rara:** *(Belum ditentukan)*

### 📝 Absensi & Sesi Terapi
* **Absensi Anak:**
  * Menampilkan: Nama Anak, Jenis Terapi, Terapis.
* **Detail Pertemuan & Sesi Paket:**
  * Menampilkan: Nama Anak, Jenis Terapi, Terapis, Counter Sesi (contoh: *1/12*, *2/12*, *3/12*, dst.).
  * Kategori/Jenis Sesi: **Evaluasi**, **Hero Bridge**, **Asesmen**, atau **Screening**.
