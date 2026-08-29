# API Endpoints Belum Dipakai di Frontend

> Audit per 2026-06-27. Semua endpoint di bawah sudah **dihapus dari codebase** saat cleanup.
> File ini sekarang berfungsi sebagai catatan jika ada yang perlu di-rebuild.

---

## Yang Sudah Dihapus

### Route files yang dihapus
| Endpoint | Alasan |
|----------|--------|
| `app/api/documents/*` (4 files) | Tidak ada halaman dokumen — fitur belum dibangun |
| `app/api/families/*` (5 files) | Tidak ada halaman keluarga — fitur belum dibangun |
| `app/api/media/*` (4 files) | Tidak ada halaman media — fitur belum dibangun |
| `app/api/search/*` (4 files) | Tidak ada search bar global — fitur belum dibangun |
| `app/api/demo-data/` | Dev seed tool — digantikan `scripts/seed-patients.js` |
| `app/api/admin/activity/` | Data sudah tersedia via `/api/dashboard/stats` |
| `app/api/children/[id]/assign-therapist/` | Tidak ada UI — `TherapistAssignmentModal` juga ikut dihapus |
| `app/api/children/[id]/progress/` | Tidak pernah dipanggil dari halaman manapun |
| `app/api/children/[id]/reports/` | Redundant — frontend langsung pakai `/api/reports` |
| `app/api/children/[id]/tokens/package/[packageId]/` | Tidak ada UI manajemen paket per anak |
| `app/api/conversations/[id]/route.ts` | Frontend hanya pakai list + messages, bukan detail conversation |
| `app/api/conversations/[id]/messages/[messageId]/` | Props di `ChatWindow` tidak diwire dari messages page |
| `app/api/conversations/[id]/messages/[messageId]/reactions/` | Sama — `onReactToMessage` tidak diwire |
| `app/api/conversations/[id]/read/` | Tidak pernah dipanggil — unread count tidak di-reset |

### Dead code yang dihapus
| File | Alasan |
|------|--------|
| `lib/utils/api.ts` | Seluruh file (ApiClient, childrenApi, therapistApi, dashboardApi) — tidak diimport dimanapun |
| `components/admin/therapist-assignment-modal.tsx` | Tidak dirender di halaman manapun |

---

## Jika Perlu Dibangun Ulang

### Conversations (wiring tinggal 1–2 baris)
- Edit/delete pesan — wire `onEditMessage`/`onDeleteMessage` di `app/dashboard/messages/page.tsx` ke endpoint baru
- Reaksi pesan — wire `onReactToMessage` di `ChatWindow`
- Mark as read — fetch `PATCH /api/conversations/[id]/read` otomatis saat conversation dibuka

### Fitur baru yang butuh halaman + backend
- **Dokumen** — halaman `/dashboard/documents` + route `app/api/documents/*`
- **Search global** — search bar di sidebar + route `app/api/search/*`
- **Assign therapist ke anak** — modal di halaman detail pasien + route `app/api/children/[id]/assign-therapist/`
