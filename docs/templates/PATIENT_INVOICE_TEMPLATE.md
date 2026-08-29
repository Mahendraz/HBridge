# TEMPLATE INVOICE PASIEN — HEARTY BRIDGE

Template invoice yang ditagihkan klinik ke **orang tua pasien** untuk paket terapi. Berbeda dari
`docs/INVOICE_TEMPLATE.md` (invoice billing kontrak developer ke klien) — dokumen ini dipakai
untuk hal yang genuinely berbeda: penagihan sesi terapi ke orang tua.

Diimplementasikan sebagai PDF via `components/invoices/invoice-pdf-template.tsx`
(`@react-pdf/renderer`), digenerate oleh `GET /api/invoices/[id]/pdf`. Tombol "Unduh Invoice"
tersedia di:
- `/dashboard/invoices` — tampilan parent (card) dan admin (tabel)
- `/dashboard/patients/[id]` — kartu paket per anak, dekat status invoice

---

## Contoh Layout

```
╔══════════════════════════════════════════════════════════════╗
║  Hearty Bridge                                    INVOICE     ║
║  Menghubungkan anak dan terapis dengan penuh kasih            ║
║                                            INV-202608-0001     ║
╠══════════════════════════════════════════════════════════════╣

  NAMA ANAK                    NAMA ORANG TUA
  Radit Santoso                Budi Santoso

  TANGGAL TERBIT                JATUH TEMPO
  15 Agustus 2026                22 Agustus 2026

  ─────────────────────────────────────────────────────────────
  DESKRIPSI                          SESI          JUMLAH
  ─────────────────────────────────────────────────────────────
  Paket Gold — Terapi TW              12         Rp 2.400.000

                                          Total Tagihan
                                          Rp 2.400.000

  [ BELUM DIBAYAR ]

╚══════════════════════════════════════════════════════════════╝
  Dokumen ini dihasilkan otomatis oleh sistem Hearty Bridge
  pada [tanggal unduh].
```

## Sumber Data per Field

| Field di template | Sumber (model `Invoice`) |
|---|---|
| No. Invoice | `invoiceNumber` |
| Nama Anak | `childName` |
| Nama Orang Tua | `User.name` (via `parentId`) |
| Tanggal Terbit | `createdAt` |
| Jatuh Tempo | `dueDate` |
| Deskripsi | `packageType` + label jenis terapi (`therapyType`) |
| Sesi | `sessions` |
| Jumlah | `originalAmount` (sebelum diskon) |
| Diskon (kalau ada) | `discountAmount` |
| Total Tagihan | `amount` (setelah diskon) |
| Status | `status` — `unpaid` → "BELUM DIBAYAR", `paid` → "LUNAS" (+ tanggal `paidAt`), `overdue` → "JATUH TEMPO" |
| Catatan (opsional) | `notes` |

`therapyType` memetakan ke label: `OT` → "OT", `TW` → "TW", `both` → "OT & TW", `assessment` → "Asesmen".

## Penomoran Invoice

Format yang sudah dipakai di kode (`INV-[YYYYMM]-[NNNN]`, mis. `INV-202608-0001`), berbeda dari
skema `HB-INV-...` di `INVOICE_TEMPLATE.md` — tidak diseragamkan karena keduanya melayani domain
berbeda (penagihan pasien vs kontrak developer) dan mengubah skema penomoran invoice pasien yang
sudah berjalan akan memutus referensi ke invoice lama.
