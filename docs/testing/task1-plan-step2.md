# Task 1 · Step 2: Sisa Sesi & Jadwal

Acuan: `task1-breakdown.md`. Path relatif ke `hearty-bridge/`. Mulai setelah Step 1 selesai.

**Temuan penting:** ada 3 hitungan "sisa sesi" yang berbeda dan tidak saling cocok (`Child.tokenBalance`, `therapyBalance` di API anak, dan hitungan di dashboard ortu). Status invoice tidak pernah dipakai. Ini akar ORT-1, ORT-3, ORT-6. 2A menyatukannya jadi satu helper.

---

## 2A · Sisa sesi & profil anak
**Item:** ORT-3, ORT-6, ORT-1, ORT-2, ADM-6 (kerjakan berurutan)

| Item | Yang dikerjakan |
|---|---|
| ORT-3 | Satu helper hitung sisa sesi per paket per program. Invoice belum lunas → sisa = −(sesi terpakai). Setelah lunas → total paket − terpakai. |
| ORT-6 | Detail anak & daftar pasien pakai helper yang sama, jadi angka sisa cocok dengan riwayat. |
| ORT-1 | Dashboard ortu: satu kartu per anak, rincian sisa per program (OT/TW). |
| ORT-2 | Jadwal hari ini & mendatang: `OT · Nama Terapis`. Ambil dari Session, bukan template jadwal (pakai ulang `buildTodayAppointments`). |
| ADM-6 | Profil anak: nama terapis per program. |

**File:**
- **Baru:** `lib/utils/session-balance.ts`: satu-satunya sumber hitungan sisa sesi
- `app/api/dashboard/stats/route.ts` ⚠: `parentStats()` → `sessionBalances`, `upcomingSchedule`
- `app/dashboard/page.tsx` ⚠: `ParentMainContent`, kartu "Sisa Sesi" & blok jadwal
- `app/api/children/[id]/tokens/route.ts` ⚠: GET `remainingSessions`
- `app/api/children/route.ts`: `therapyBalance`, `sessionProgress`, `childToTherapist`
- `app/api/children/[id]/route.ts` ⚠: GET tambah terapis per program
- `app/api/children/[id]/sessions/route.ts`: riwayat sesi
- `app/api/sessions/[id]/route.ts` ⚠: **hanya** bagian potong token saat sesi selesai
- `app/dashboard/patients/[id]/page.tsx`: kartu Paket Terapi, kartu Terapis
- `app/dashboard/patients/page.tsx` ⚠: kartu paket & terapis di tampilan ortu
- `lib/utils/child.ts`: `formatChildForResponse`
- Baca saja: `models/Child.ts`, `models/TokenTransaction.ts`, `models/Invoice.ts`

---

## 2B · Jadwal & drag-drop
**Item:** ORT-5, ADM-1, ADM-5

| Item | Yang dikerjakan |
|---|---|
| ORT-5 | Tambah slot 17.00. Temuan: `HOURS` cuma 9–16 dan model menolak jam 17, jadi **bukan cuma masalah HP**. Cek juga scroll agenda di HP (`draggable` di tampilan ortu bisa mengganggu scroll sentuh). |
| ADM-1 | Setelah drop, muncul pilihan "Hanya minggu ini" (PATCH Session, sudah ada) atau "Semua minggu berikutnya" (template baru `effectiveFrom` + regenerate). Contek pola `effectiveChoice` di `SlotModal`. |
| ADM-5 | Tombol minggu sebelumnya/berikutnya jadi target drop saat drag, supaya bisa pindah lintas minggu. |

**File:**
- `app/dashboard/schedules/page.tsx` ⚠: `HOURS`, agenda HP, `SlotCard`, `DroppableCell`, `handleCellDrop`/`submitDragReschedule`, navigasi minggu. **Jangan sentuh** `PackageSessionModal` (itu 3A).
- `models/WeeklySchedule.ts`: `hour` max 17
- `app/api/weekly-schedule/route.ts` ⚠: POST template "semua minggu"
- `components/ui/dialog.tsx`: kalau scroll lock ikut jadi penyebab ORT-5
- Tidak perlu ubah `app/api/sessions/[id]/route.ts` (PATCH yang ada sudah cukup untuk "minggu ini").

---

## Pembagian file 2A vs 2B
| File | 2A | 2B |
|---|---|---|
| `app/api/sessions/[id]/route.ts` | potong token | tidak diubah |
| `app/api/weekly-schedule/route.ts` | tidak diubah | POST template |
| `app/dashboard/schedules/page.tsx` | tidak diubah | grid & drag-drop |

## File yang disentuh lagi di Step 3
`app/api/dashboard/stats/route.ts`, `app/dashboard/page.tsx`, `app/api/children/[id]/tokens/route.ts`, `app/api/children/[id]/route.ts`, `app/dashboard/patients/page.tsx`, `app/api/weekly-schedule/route.ts`, `app/dashboard/schedules/page.tsx`
