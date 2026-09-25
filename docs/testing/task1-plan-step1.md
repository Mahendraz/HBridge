# Task 1 · Step 1: Media, Terapis, Label

Acuan: `task1-breakdown.md`. Path relatif ke `hearty-bridge/`.

**Aturan tabrakan:** task di satu step boleh dikerjakan paralel karena file-nya tidak saling tumpuk. Step dikerjakan berurutan (1 → 2 → 3). File yang disentuh lagi di step lain ditandai ⚠.

---

## 1A · Media: video & pengumuman
**Item:** TRP-1, TRP-2, TRP-3, SA-1, ORT-4, ADM-7

| Item | Yang dikerjakan |
|---|---|
| TRP-1 | Upload mulai saat file di-drop/dipilih, bukan saat simpan. Video bisa dihapus sebelum konfirmasi. |
| TRP-3 | Terima `.mov`/HEVC dari iPhone (termasuk MIME kosong dari iOS). |
| TRP-2 | Video dikonversi ke MP4 H.264 dan bisa diputar langsung (belum ada `<video>` player). |
| SA-1 | Pengumuman terima HEIC (dikonversi ke JPG) dan video. WEBP/GIF/PDF sudah diterima. |
| ORT-4 | Foto pengumuman bisa diklik → lightbox. Ambil `Lightbox` yang sudah ada di halaman laporan jadi komponen bersama. |
| ADM-7 | Komentar terbaru di atas. API bell sudah urut terbaru; yang masih urut lama adalah list komentar laporan. **Cek dulu dengan klien mana yang dimaksud.** |

**File:**
- `app/dashboard/reports/new/page.tsx`, `app/dashboard/reports/[id]/edit/page.tsx`: upload saat drop, `accept`
- `app/dashboard/reports/page.tsx`: video player, sumber Lightbox, urutan komentar
- `app/api/reports/[id]/media/route.ts`: daftar MIME, deteksi `.mov`
- `app/api/reports/[id]/comments/route.ts`: urutan komentar
- `lib/utils/compress.ts`: `compressVideo` (H.264), `compressImage` (HEIC)
- `lib/utils/upload-with-progress.ts`, `lib/services/r2-storage.ts`, `models/Report.ts`
- `app/api/announcements/route.ts`, `app/api/announcements/[id]/route.ts`: daftar MIME
- `models/Announcement.ts`: `fileType` tambah `video`
- `components/dashboard/announcement-wall.tsx`: `accept`, render video, lightbox
- `components/layout/notification-bell.tsx`: hanya kalau ADM-7 ternyata soal bell
- **Baru:** `components/ui/lightbox.tsx`

---

## 1B · Data terapis: ulang tahun & status
**Item:** SA-3, ADM-4

| Item | Yang dikerjakan |
|---|---|
| SA-3 | Field tanggal lahir terapis (belum ada), bisa diisi Super Admin. Widget ulang tahun terapis H-3 s/d hari-H, **hanya untuk Super Admin**. |
| ADM-4 | Status Aktif / Sakit-Izin / Inaktif. Dibangun di atas fitur cuti yang sudah ada (`TherapistLeave`: `cuti` → `sakit_izin`). Sakit/Izin: tetap tampil di jadwal dengan penanda. Inaktif: hilang dari jadwal dan pilihan terapis. Peringatan ke admin kalau terapis itu masih punya jadwal. |

**File:**
- `models/User.ts`, `lib/types/auth.ts`: field tanggal lahir
- `app/api/admin/users/route.ts`, `app/api/admin/users/[id]/route.ts` ⚠: schema tanggal lahir
- `app/api/therapists/route.ts`: kirim tanggal lahir dan status
- `app/dashboard/therapists/page.tsx`: form tanggal lahir, badge & modal status
- `app/api/dashboard/birthdays/route.ts`: data ulang tahun terapis, khusus super_admin
- `models/TherapistLeave.ts`, `app/api/therapist-leaves/route.ts`, `app/api/therapist-leaves/[id]/route.ts`: tipe status
- `app/dashboard/page.tsx` ⚠: **hanya** bagian widget ulang tahun
- `app/dashboard/schedules/page.tsx` ⚠: **hanya** `fetchLeaves`/badge di `SlotCard` dan filter di `fetchDropdownData`

---

## 1C · Label menu
**Item:** ADM-8

- String "Asesmen Hearty Bridge" **tidak ditemukan** di kode. Menu `/dashboard/attendance` sudah bernama "Absensi". **Konfirmasi dulu ke klien** menu mana yang dimaksud (mungkin versi yang ter-deploy beda).
- `lib/utils/permissions.ts` ⚠: `getNavigationItems()`
- `app/dashboard/attendance/page.tsx`: judul halaman

---

## File yang disentuh lagi di step lain
| File | Step 1 | Nanti |
|---|---|---|
| `app/dashboard/page.tsx` | 1B widget ultah | 2A, 3A |
| `app/dashboard/schedules/page.tsx` | 1B badge & filter | 2B, 3A |
| `app/api/admin/users/[id]/route.ts` | 1B tanggal lahir | 3B |
| `lib/utils/permissions.ts` | 1C | 3B |
