# Task 1 · Step 3: Invoice & Hapus Akun

Acuan: `task1-breakdown.md`. Path relatif ke `hearty-bridge/`. Mulai setelah Step 2 selesai, karena 3A memakai helper `lib/utils/session-balance.ts` dari 2A.

---

## 3A · Invoice & pembayaran
**Item:** ORT-7, ADM-2, SA-4

| Item | Yang dikerjakan |
|---|---|
| ORT-7 | Halaman invoice ortu dipisah: tab "Belum lunas" dan "Riwayat" (lunas). Unduh PDF sudah ada. Pop-up invoice belum lunas di dashboard, muncul tiap buka, bisa ditutup. |
| ADM-2 | Edit invoice pakai dropdown paket/layanan (bukan teks bebas). Harga & jumlah sesi ikut paket. Invoice lunas terkunci. Kalau jumlah sesi berubah, `TokenTransaction`, `tokenBalance`, dan jadwal paket ikut disesuaikan. |
| SA-4 | Riwayat pembayaran per anak: cari nama, filter tanggal/status/program, export (pilih Excel/CSV/PDF). |
| (lanjutan ORT-3) | `PackageSessionModal` di halaman jadwal pakai helper sisa sesi. Sekarang hitungannya bisa minus dengan cara yang salah. |

**File:**
- `app/dashboard/invoices/page.tsx`: tab ortu, modal edit + dropdown paket, bersihkan tipe `packageType` lama
- `app/api/invoices/route.ts`, `app/api/invoices/[id]/route.ts`: PATCH ikut paket, kunci status lunas
- `app/api/invoices/[id]/pdf/route.ts`, `components/invoices/invoice-pdf-template.tsx`: hanya kalau perlu
- `app/api/super-admin/packages/route.ts`: sumber dropdown (baca saja)
- `app/api/children/[id]/tokens/route.ts`: sinkron saldo saat invoice diedit
- `app/api/weekly-schedule/route.ts`: panggil `regeneratePackageSchedule` saat jumlah sesi berubah
- `app/api/dashboard/stats/route.ts`: `parentStats` kirim daftar invoice belum lunas
- `app/dashboard/page.tsx`: pop-up invoice (ganti banner "unseen invoice")
- `app/dashboard/super-admin/financial/page.tsx`: pencarian anak, filter, export
- `app/api/super-admin/financial/route.ts`, `app/api/super-admin/financial/transactions/route.ts`: filter anak/nama
- `app/dashboard/schedules/page.tsx`: **hanya** `PackageSessionModal`
- Contoh export CSV: `app/dashboard/attendance/page.tsx` (baca saja)

---

## 3B · Hapus akun ortu & anak
**Item:** ADM-3

| Yang dikerjakan |
|---|
| Admin klik **Ajukan hapus** → masuk daftar permintaan di dashboard Super Admin → Super Admin setujui/tolak. Yang dihapus hanya akun (tidak bisa login, hilang dari daftar aktif), riwayat sesi dan invoice tetap ada. Hapus ortu ikut akun anaknya. Admin tidak bisa hapus langsung. |

**File:**
- **Baru:** `models/DeletionRequest.ts` (+ export di `models/index.ts`)
- **Baru:** `app/api/deletion-requests/route.ts`, `app/api/deletion-requests/[id]/route.ts`
- **Baru:** halaman persetujuan di `app/dashboard/super-admin/deletion-requests/page.tsx`
- `app/api/children/[id]/route.ts`: DELETE (sekarang hanya ortu, soft delete)
- `app/api/admin/users/[id]/route.ts`: DELETE sekarang bisa dipakai admin, dibatasi ke Super Admin
- `app/dashboard/patients/page.tsx`: tombol "Ajukan hapus" di tampilan admin
- `lib/utils/permissions.ts`: menu halaman persetujuan
- `app/dashboard/layout.tsx`: gate route super admin
- `models/Notification.ts`, `lib/utils/notify.ts`: tipe notifikasi permintaan hapus

---

## Pembagian file 3A vs 3B
Tidak ada file yang sama. 3A tidak menyentuh `patients/page.tsx`, `children/[id]/route.ts`, `permissions.ts`; 3B tidak menyentuh invoice, stats, atau dashboard.
