# Progress Checklist — Demo 3 Feedback

Checklist eksekusi untuk `docs/TASK_BREAKDOWN.md` (detail teknis per item ada di sana). Urutan mengikuti nomor asli dokumen. Dikerjakan bertahap dari 1.1.

## 1. POV Orang Tua (Parent)
- [x] 1.1 Notifikasi invoice tidak muncul di dashboard — diperbaiki & diverifikasi manual
- [x] 1.2 Lonceng notifikasi umum tidak tersedia — dibuat (model + endpoint + bell + trigger invoice/komentar/laporan), diverifikasi manual via trigger invoice
- [x] 1.3 "Halo Citra..." → "Halo Parent" + perbesar font — diverifikasi manual
- [x] 1.4 Tanggal janji temu hilang di dashboard — diverifikasi manual (juga fix bug offset hari yang salah lewat hari Minggu)
- [x] 1.5 Widget "Sisa Sesi Anda" font besar — diverifikasi manual
- [x] 1.6 Dual tanggal laporan (tgl sesi vs tgl upload) — diverifikasi manual (list & grid view)
- [x] 1.7 Template download Laporan Harian — diverifikasi manual (termasuk fix WebP tidak ter-embed di PDF)
- [x] 1.8 Download invoice tidak berfungsi — dibuat & diverifikasi manual (klik tombol asli, file ter-download)
- [x] 1.9 Styling komentar — background abu-abu — diverifikasi manual
- [x] 1.10 Icon notifikasi komentar tampil ke parent (harusnya cuma terapis/admin) — diverifikasi manual (frontend + API)

## 2. POV Super Admin
- [x] 2.1 Edit Paket Asesmen error "invalid" — diperbaiki & diverifikasi manual (PUT sukses, 200 OK)
- [x] 2.2 Gabungkan Paket OT & TW jadi satu tipe — diverifikasi manual (create form, edit legacy, invoice data)
- [x] 2.3 Field Harga & Jumlah Sesi tidak bisa dikosongkan — diverifikasi manual
- [x] 2.4 Download Invoice + template standar — diverifikasi manual (admin list + detail pasien)
- [x] 2.5 Hapus fitur Check-in untuk Super Admin — diverifikasi manual (nav, page guard, API 403, admin tidak regresi)
- [x] 2.6 Rekap absensi terapis bulanan/rentang tanggal — diverifikasi manual (API + UI + unduh CSV)
- [ ] 2.7 Chart tren jumlah pasien

## 3. POV Terapis
- [ ] 3.1 Jadwal terpotong di mobile portrait
- [ ] 3.2 Pelaporan & Analitik terpotong di mobile
- [ ] 3.3 Rekomendasi CSS/layout responsif (prinsip umum, tercakup di 3.1/3.2)
- [ ] 3.4 Upload video lambat
- [ ] 3.5 Tidak ada notifikasi komentar baru untuk terapis

## 4. Rangkuman Fitur & Kebutuhan Admin
- [ ] 4.1 Frekuensi terapi mingguan per anak
- [ ] 4.2 Pencarian anak tidak jalan
- [ ] 4.3 Tambah jadwal susulan di tengah paket berjalan
- [ ] 4.4 Cari anak di halaman jadwal
- [ ] 4.5 Filter jadwal per terapis
- [ ] 4.6 Detail Profil Anak — field yang hilang
- [ ] 4.7 Hapus field "keterangan" dari biodata anak
- [ ] 4.8 Admin bisa edit & hapus invoice yang sudah diterbitkan
- [ ] 4.9 Notifikasi auto-hilang real-time
- [ ] 4.10 Color-coding terapis untuk jadwal
- [ ] 4.11 Absensi Anak
- [ ] 4.12 Detail Pertemuan & Sesi Paket
