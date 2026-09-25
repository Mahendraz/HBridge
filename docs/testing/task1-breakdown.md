# Task 1: Breakdown Goal & Problem

Sumber: `docs/testing/task1`. Tiap item berisi **Goal**, **Problem**, dan **Keputusan** (hasil klarifikasi). Semua item sudah diklarifikasi; yang masih tebakan ditandai **Asumsi**.

Status: ⬜ belum dibahas · 🟨 sebagian jelas, ada yang perlu dikonfirmasi · ✅ jelas, siap dikerjakan · ⏸ ditunda

---

## A. Orang Tua

### ORT-1 · Sisa terapi per program di dashboard ✅
- **Goal:** Ortu bisa melihat sisa sesi yang dipisah per jenis terapi (Okupasi / Wicara).
- **Problem:** Satu anak bisa ikut 2 program, tapi dashboard cuma menampilkan angka sisa tanpa keterangan program, jadi tidak jelas sisa itu milik program yang mana.
- **Keputusan:**
  - Satu kartu per anak, dengan rincian sisa sesi per program di dalamnya.
  - Kalau ortu punya lebih dari satu anak, dikelompokkan per anak.

### ORT-2 · Nama terapi di jadwal hari ini & mendatang ✅
- **Goal:** Tiap jadwal menampilkan jenis terapi dan terapisnya.
- **Problem:** Jadwal sekarang tidak menunjukkan sesi itu terapi apa.
- **Keputusan:** Tampilkan singkatan (TW/OT) plus nama terapis. Contoh: `OT · Terapis A`.

### ORT-3 · Sesi minus untuk kasbon / utang paket ✅
- **Goal:** Sesi yang sudah berjalan tapi paketnya belum dibayar tetap tercatat, dan sisa sesi jadi minus.
- **Problem:** Saat ini sesi tanpa paket lunas tidak dihitung, jadi utang tidak kelihatan.
- **Keputusan:**
  - Saat kasbon terjadi, paket dan invoice-nya **sudah dibuat, tapi belum lunas**.
  - Selama belum lunas, sesi yang sudah jalan dihitung minus. Minus tampil di sisi ortu **dan** admin, sebagai penanda ada paket yang belum dibayar.
  - Begitu dilunasi, sisa sesi = total sesi paket dikurangi minus tadi.
  - Contoh: paket 10 sesi belum lunas, sudah jalan 3 sesi → sisa tampil **-3**. Setelah lunas → sisa **7**.
  - Minus tidak memotong paket lain; asumsinya ortu tidak beli paket baru selama masih ada utang.

### ORT-4 · Foto di pengumuman tidak bisa diperbesar ✅
- **Goal:** Foto di pengumuman dashboard bisa diklik lalu tampil besar.
- **Problem:** Foto muncul, tapi tidak bisa diperbesar.
- **Keputusan:** Klik foto membuka tampilan besar dalam bentuk card/modal (lightbox) di atas halaman.

### ORT-5 · Jam janji temu tidak bisa di-scroll di HP ✅
- **Goal:** Ortu bisa memilih semua slot jam janji temu di tampilan HP.
- **Problem:** Di HP, daftar jam mentok di 16.00, padahal masih ada slot 17.00. Di desktop normal.
- **Keputusan:** Jam operasional sampai 18.00, jadi slot terakhir 17.00. Perbaikannya di tampilan HP saja.

### ORT-6 · Sinkronisasi sisa sesi dengan riwayat ✅
- **Goal:** Angka sisa sesi/paket di detail anak selalu cocok dengan riwayat sesi dan pembelian.
- **Problem:** Sisa sesi di detail anak tidak sinkron dengan riwayat.
- **Keputusan:** Disinkronkan di halaman detail anak. Dikerjakan bareng ORT-1 dan ORT-3 karena sumber hitungannya sama.

### ORT-7 · Riwayat pembelian & invoice ✅
- **Goal:** Ada halaman riwayat pembelian (termasuk yang sudah lunas). Pop-up invoice di atas hanya untuk yang belum lunas.
- **Problem:** Invoice lunas dan belum lunas masih bercampur, belum ada tempat khusus untuk riwayat.
- **Keputusan:**
  - Invoice di riwayat bisa diunduh/dicetak.
  - Pop-up invoice belum lunas muncul setiap buka dashboard, tapi bisa ditutup.

---

## B. Super Admin

### SA-1 · Format file pengumuman lebih beragam ✅
- **Goal:** Pengumuman bisa menerima lebih banyak format file.
- **Problem:** Hanya PNG dan JPG yang bisa di-upload; format lain ditolak.
- **Keputusan:** Tambah HEIC (iPhone), WEBP, GIF, PDF, dan video.
- **Catatan teknis:** HEIC tidak bisa ditampilkan di Chrome/Android, jadi perlu dikonversi ke JPG saat upload. Video di pengumuman nanti ikut solusi format video dari TRP-3.

### SA-2 · Pasien baru dengan 2 program otomatis ⏸
- **Goal:** Saat mendaftarkan pasien dengan 2 program terapi, kedua program langsung dibuat sekaligus.
- **Problem:** Sekarang harus diinput satu per satu.
- **Keputusan:** Ditunda. Untuk sekarang tetap ditambah satu per satu.

### SA-3 · Reminder ulang tahun terapis ✅
- **Goal:** Super admin mendapat pengingat ulang tahun terapis.
- **Problem:** Belum ada fitur ini.
- **Keputusan:**
  - Tanggal lahir terapis bisa diisi/diubah oleh super admin di data terapis (perlu dicek apakah field-nya sudah ada).
  - Reminder berupa notifikasi di dashboard, sama seperti notifikasi lain.
  - Muncul beberapa hari sebelumnya **dan** di hari-H.
  - Terapis yang berulang tahun **tidak boleh** melihat reminder tentang dirinya sendiri.
  - "Beberapa hari sebelumnya" = mulai H-3.

### SA-4 · Riwayat pembayaran per anak + pencarian ✅
- **Goal:** Super admin bisa melihat riwayat pembayaran tiap anak.
- **Problem:** Belum ada tampilan riwayat pembayaran per anak.
- **Keputusan:**
  - Pencarian nama, filter tanggal, filter status lunas, filter program.
  - Export: pengguna memilih sendiri formatnya saat export (Excel, CSV, atau PDF).

---

## C. Terapis

### TRP-1 · Upload video lambat & harus tunggu konfirmasi ✅
- **Goal:** Upload video terasa cepat dan tidak menghambat terapis.
- **Problem:** Upload baru mulai setelah terapis klik konfirmasi, jadi terapis menunggu lama di akhir. Total video bisa sampai ±100 MB per sesi.
- **Keputusan:**
  - Upload langsung mulai begitu file di-drag & drop atau dipilih, di background. Saat klik konfirmasi, sebagian besar file sudah selesai ter-upload.
  - Terapis bisa menghapus video yang sudah terlanjur ter-upload sebelum konfirmasi.

### TRP-2 · Video dari iPhone tidak bisa diputar ✅
- **Goal:** Video yang sudah di-upload bisa ditonton di semua perangkat.
- **Problem:** Video dari iPhone tidak bisa dilihat. Video dari Android/PC kemungkinan normal (belum dipastikan 100%).
- **Dugaan teknis:** iPhone merekam dalam format HEVC/`.mov`, yang tidak bisa diputar di Chrome/Android. Satu akar masalah dengan TRP-3, jadi dikerjakan bareng.

### TRP-3 · Video dari kamera iPhone gagal di-upload ✅
- **Goal:** Video dari kamera iPhone bisa di-upload seperti video dari Android, PC, atau rekaman langsung di web.
- **Problem:** Android dan PC berhasil, hanya iPhone yang gagal karena formatnya ditolak.
- **Dugaan teknis:** `.mov` / HEVC tidak ada di daftar format yang diizinkan. Supaya bisa diputar di semua perangkat (TRP-2), kemungkinan perlu dikonversi ke MP4 (H.264) setelah upload. Akan dicek di kode.

---

## D. Admin

### ADM-1 · Pilihan ubah jadwal: minggu ini saja atau semua minggu ✅
- **Goal:** Saat admin drag & drop jadwal, admin bisa memilih perubahannya berlaku untuk minggu itu saja atau untuk semua minggu ke depan.
- **Problem:** Sekarang tidak ada pilihan itu saat jadwal dipindah.
- **Keputusan:** Setiap kali jadwal di-drop, muncul konfirmasi dengan dua pilihan:
  - **Hanya minggu ini** (jadwal tidak tetap)
  - **Semua minggu berikutnya** (jadwal tetap)

### ADM-2 · Edit invoice mengikuti jenis layanan/paket ✅
- **Goal:** Admin bisa mengedit invoice untuk semua jenis layanan/paket.
- **Problem:** Edit invoice belum tersedia untuk semua jenis.
- **Keputusan:**
  - Edit invoice harus mengikuti jenis layanan/paket yang ada, bukan diisi bebas. Ganti paket akan mengganti harga dan jumlah sesi mengikuti paket itu.
  - Invoice yang **sudah lunas tidak bisa diedit**.
  - Yang bisa diubah hanya pilihan layanan/paket; harga dan jumlah sesi ikut otomatis, tidak bisa diketik manual.

### ADM-3 · Hapus akun ortu & anak (lewat persetujuan Super Admin) ✅
- **Goal:** Akun ortu dan anak bisa dihapus, dengan persetujuan Super Admin.
- **Problem:** Belum ada opsi hapus akun.
- **Keputusan:**
  - Hanya akun **ortu** dan **anak** yang bisa dihapus. Terapis tidak.
  - Yang dihapus **hanya akunnya**. Riwayat sesi, invoice, dan pembayaran tetap disimpan, jadi laporan (SA-4) dan catatan sesi terapis tidak berubah.
  - Hapus akun ortu ikut menghapus akun anaknya.
  - Alur:
    1. Admin menekan **Ajukan hapus** pada akun ortu/anak.
    2. Permintaan muncul di dashboard Super Admin.
    3. Super Admin mengonfirmasi (atau menolak), baru akun terhapus.
  - Admin tidak bisa menghapus langsung.
- **Asumsi (koreksi kalau salah):**
  - Akun yang dihapus tidak bisa login lagi dan hilang dari daftar pasien aktif, tapi namanya tetap muncul di riwayat lama (misal diberi label "akun dihapus").
  - Super Admin juga bisa menghapus langsung tanpa menunggu pengajuan dari admin.

### ADM-4 · Status terapis: Aktif / Sakit-Izin / Inaktif ✅
- **Goal:** Terapis punya status kehadiran yang jelas.
- **Problem:** Status terapis belum ada.
- **Keputusan:** Label "On Hold" diganti supaya tidak membingungkan. Tiga status:
  - **Aktif:** normal.
  - **Sakit/Izin** (satu status, jangka pendek): tetap terlihat di jadwal, dengan penanda "sedang tidak bisa hadir".
  - **Inaktif** (jangka panjang): tidak muncul di jadwal dan tidak bisa ditambahkan ke jadwal baru.
  - Jadwal yang sudah ada tidak dipindah otomatis. Sistem memberi **peringatan** ke admin bahwa ada jadwal milik terapis Sakit/Izin atau Inaktif, lalu admin yang memindahkannya ke terapis lain.

### ADM-5 · Drag & drop jadwal ke minggu lain ✅
- **Goal:** Admin bisa memindahkan jadwal ke minggu sebelumnya atau berikutnya.
- **Problem:** Drag & drop sekarang hanya bisa di minggu yang sama.
- **Keputusan:** Drag & drop bisa lintas minggu. Tetap memakai konfirmasi dari ADM-1 (minggu itu saja / semua minggu berikutnya).

### ADM-6 · Nama terapis di profil anak ✅
- **Goal:** Profil anak menampilkan nama-nama terapis yang menangani.
- **Problem:** Nama terapis belum tampil di profil anak.
- **Keputusan:** Ditampilkan per program. Contoh: `OT: Terapis A`, `TW: Terapis B`.

### ADM-7 · Komentar terbaru di atas pada notifikasi lonceng ✅
- **Goal:** Di list notifikasi (ikon lonceng), komentar terbaru dari ortu ada di paling atas.
- **Problem:** Komentar baru tidak otomatis naik ke atas, jadi admin susah tahu ortu mana yang baru komentar.
- **Keputusan:** Urutkan notifikasi komentar dari yang paling baru.

### ADM-8 · Ganti nama menu "Asesmen Hearty Bridge" jadi "Absensi" ✅
- **Goal:** Nama menu menjadi "Absensi".
- **Problem:** Nama menu sekarang tidak sesuai fungsinya.
- **Keputusan:** Cukup ganti label. Isi halaman tidak berubah.

---

## Ringkasan status

| Status | Item |
|---|---|
| ✅ Siap dikerjakan | ORT-1 s/d ORT-7, SA-1, SA-3, SA-4, TRP-1 s/d TRP-3, ADM-1 s/d ADM-8 |
| ⏸ Ditunda | SA-2 |

## Catatan keterkaitan
- **ORT-1, ORT-3, ORT-6**: perhitungan sisa sesi. Dikerjakan bareng.
- **ORT-7 & SA-4**: riwayat pembayaran (sisi ortu dan sisi admin).
- **ADM-1 & ADM-5**: drag & drop jadwal plus konfirmasi.
- **TRP-1, TRP-2, TRP-3**: satu alur upload video. TRP-2 dan TRP-3 kemungkinan satu akar masalah (format iPhone).
- **SA-1 & TRP-3**: format file dari iPhone (HEIC/MOV).
