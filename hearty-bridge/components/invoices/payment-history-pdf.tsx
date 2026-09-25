import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import type { PaymentHistoryRow } from "@/lib/utils/payment-history-export";

const styles = StyleSheet.create({
  page: { padding: 28, fontSize: 8, fontFamily: "Helvetica", color: "#1f2937" },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end", borderBottom: "2 solid #0d9488", paddingBottom: 8, marginBottom: 8 },
  clinicName: { fontSize: 14, fontWeight: 700, color: "#0d9488" },
  title: { fontSize: 11, fontWeight: 700 },
  meta: { fontSize: 8, color: "#6b7280", marginTop: 2 },
  totals: { flexDirection: "row", gap: 16, marginBottom: 8 },
  totalLabel: { fontSize: 7, color: "#6b7280", textTransform: "uppercase" },
  totalValue: { fontSize: 10, fontWeight: 700 },
  headerRow: { flexDirection: "row", backgroundColor: "#f0fdfa", paddingVertical: 4 },
  row: { flexDirection: "row", paddingVertical: 4, borderBottom: "1 solid #e5e7eb" },
  headerCell: { fontSize: 7, fontWeight: 700, color: "#0d9488", textTransform: "uppercase", paddingHorizontal: 3 },
  cell: { fontSize: 8, paddingHorizontal: 3 },
  footer: { position: "absolute", bottom: 16, left: 28, right: 28, fontSize: 7, color: "#9ca3af", textAlign: "center" },
});

export interface PaymentHistoryPdfData {
  filterSummary: string;
  generatedAt: string;
  paidAmount: number;
  unpaidAmount: number;
  rows: PaymentHistoryRow[];
}

function formatRupiah(amount: number): string {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(amount);
}

const COLUMNS: Array<{ key: keyof PaymentHistoryRow; label: string; flex: number; align?: "right" | "center" }> = [
  { key: "invoiceNumber", label: "No. Invoice", flex: 1.3 },
  { key: "createdAt", label: "Tanggal", flex: 1 },
  { key: "childName", label: "Anak", flex: 1.4 },
  { key: "parentName", label: "Orang Tua", flex: 1.4 },
  { key: "packageType", label: "Paket", flex: 1.4 },
  { key: "program", label: "Program", flex: 0.8 },
  { key: "sessions", label: "Sesi", flex: 0.5, align: "center" },
  { key: "amount", label: "Jumlah", flex: 1.2, align: "right" },
  { key: "status", label: "Status", flex: 0.9 },
  { key: "paidAt", label: "Tgl Bayar", flex: 1 },
];

/** Payment history export (SA-4) — one row per invoice, A4 landscape. */
export function PaymentHistoryPdfDocument({ data }: { data: PaymentHistoryPdfData }) {
  return (
    <Document>
      <Page size="A4" orientation="landscape" style={styles.page}>
        <View style={styles.header} fixed>
          <View>
            <Text style={styles.clinicName}>Hearty Bridge</Text>
            <Text style={styles.title}>Riwayat Pembayaran</Text>
          </View>
          <View style={{ alignItems: "flex-end" }}>
            <Text style={styles.meta}>{data.filterSummary}</Text>
            <Text style={styles.meta}>Dicetak {data.generatedAt}</Text>
          </View>
        </View>

        <View style={styles.totals}>
          <View>
            <Text style={styles.totalLabel}>Jumlah invoice</Text>
            <Text style={styles.totalValue}>{data.rows.length}</Text>
          </View>
          <View>
            <Text style={styles.totalLabel}>Sudah dibayar</Text>
            <Text style={styles.totalValue}>{formatRupiah(data.paidAmount)}</Text>
          </View>
          <View>
            <Text style={styles.totalLabel}>Belum dibayar</Text>
            <Text style={styles.totalValue}>{formatRupiah(data.unpaidAmount)}</Text>
          </View>
        </View>

        <View style={styles.headerRow} fixed>
          {COLUMNS.map((c) => (
            <Text key={c.key} style={[styles.headerCell, { flex: c.flex, textAlign: c.align ?? "left" }]}>{c.label}</Text>
          ))}
        </View>
        {data.rows.map((r, i) => (
          <View key={i} style={styles.row} wrap={false}>
            {COLUMNS.map((c) => (
              <Text key={c.key} style={[styles.cell, { flex: c.flex, textAlign: c.align ?? "left" }]}>
                {c.key === "amount" ? formatRupiah(r.amount) : String(r[c.key])}
              </Text>
            ))}
          </View>
        ))}

        <Text
          style={styles.footer}
          render={({ pageNumber, totalPages }) => `Halaman ${pageNumber} dari ${totalPages}`}
          fixed
        />
      </Page>
    </Document>
  );
}
