import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";

const styles = StyleSheet.create({
  page: { padding: 40, fontSize: 11, fontFamily: "Helvetica", color: "#1f2937" },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16, borderBottom: "2 solid #0d9488", paddingBottom: 12 },
  clinicName: { fontSize: 16, fontWeight: 700, color: "#0d9488" },
  clinicTagline: { fontSize: 9, color: "#6b7280", marginTop: 2 },
  docLabelBlock: { alignItems: "flex-end" },
  docLabel: { fontSize: 14, fontWeight: 700, color: "#1f2937" },
  invoiceNumber: { fontSize: 9, color: "#6b7280", marginTop: 2, fontFamily: "Helvetica" },
  metaGrid: { flexDirection: "row", flexWrap: "wrap", marginBottom: 16, gap: 8 },
  metaBox: { width: "48%", backgroundColor: "#f9fafb", borderRadius: 4, padding: 8, marginBottom: 8 },
  metaLabel: { fontSize: 8, color: "#6b7280", marginBottom: 2, textTransform: "uppercase" },
  metaValue: { fontSize: 11, fontWeight: 500 },
  table: { marginTop: 8, marginBottom: 16, borderTop: "1 solid #e5e7eb" },
  tableRow: { flexDirection: "row", paddingVertical: 8, borderBottom: "1 solid #e5e7eb" },
  tableHeaderRow: { flexDirection: "row", paddingVertical: 6, backgroundColor: "#f0fdfa" },
  colDesc: { flex: 3, fontSize: 10, paddingHorizontal: 6 },
  colQty: { flex: 1, fontSize: 10, textAlign: "center" },
  colAmount: { flex: 1.4, fontSize: 10, textAlign: "right", paddingHorizontal: 6 },
  headerCell: { fontSize: 8, fontWeight: 700, color: "#0d9488", textTransform: "uppercase" },
  totalsBlock: { alignItems: "flex-end", marginTop: 4 },
  totalRow: { flexDirection: "row", justifyContent: "space-between", width: 220, marginBottom: 4 },
  totalLabel: { fontSize: 10, color: "#6b7280" },
  totalValue: { fontSize: 10, fontWeight: 500 },
  grandTotalRow: { flexDirection: "row", justifyContent: "space-between", width: 220, paddingTop: 6, borderTop: "1 solid #d1d5db" },
  grandTotalLabel: { fontSize: 11, fontWeight: 700 },
  grandTotalValue: { fontSize: 13, fontWeight: 700, color: "#0d9488" },
  statusBadge: { alignSelf: "flex-start", fontSize: 9, fontWeight: 700, paddingVertical: 3, paddingHorizontal: 8, borderRadius: 10, marginTop: 12 },
  notes: { marginTop: 16, fontSize: 9, color: "#6b7280", fontStyle: "italic" },
  footer: { position: "absolute", bottom: 30, left: 40, right: 40, fontSize: 8, color: "#9ca3af", textAlign: "center", borderTop: "1 solid #e5e7eb", paddingTop: 8 },
});

function formatDate(d?: string | Date | null): string {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("id-ID", { day: "2-digit", month: "long", year: "numeric" });
}

function formatRupiah(amount: number): string {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(amount);
}

const STATUS_LABEL: Record<string, string> = { paid: "LUNAS", unpaid: "BELUM DIBAYAR", overdue: "JATUH TEMPO" };
const STATUS_STYLE: Record<string, { backgroundColor: string; color: string }> = {
  paid: { backgroundColor: "#dcfce7", color: "#15803d" },
  unpaid: { backgroundColor: "#fef9c3", color: "#a16207" },
  overdue: { backgroundColor: "#fee2e2", color: "#b91c1c" },
};

export interface InvoicePdfData {
  invoiceNumber: string;
  childName: string;
  parentName: string;
  packageType: string;
  therapyType: string;
  sessions: number;
  originalAmount: number;
  discountAmount: number;
  amount: number;
  dueDate: string;
  status: string;
  paidAt?: string | null;
  createdAt: string;
  notes?: string;
}

export function InvoicePdfDocument({ invoice }: { invoice: InvoicePdfData }) {
  return (
    <Document title={`Invoice ${invoice.invoiceNumber}`}>
      <Page size="A4" style={styles.page}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.clinicName}>Hearty Bridge</Text>
            <Text style={styles.clinicTagline}>Menghubungkan anak dan terapis dengan penuh kasih</Text>
          </View>
          <View style={styles.docLabelBlock}>
            <Text style={styles.docLabel}>INVOICE</Text>
            <Text style={styles.invoiceNumber}>{invoice.invoiceNumber}</Text>
          </View>
        </View>

        <View style={styles.metaGrid}>
          <View style={styles.metaBox}>
            <Text style={styles.metaLabel}>Nama Anak</Text>
            <Text style={styles.metaValue}>{invoice.childName}</Text>
          </View>
          <View style={styles.metaBox}>
            <Text style={styles.metaLabel}>Nama Orang Tua</Text>
            <Text style={styles.metaValue}>{invoice.parentName}</Text>
          </View>
          <View style={styles.metaBox}>
            <Text style={styles.metaLabel}>Tanggal Terbit</Text>
            <Text style={styles.metaValue}>{formatDate(invoice.createdAt)}</Text>
          </View>
          <View style={styles.metaBox}>
            <Text style={styles.metaLabel}>Jatuh Tempo</Text>
            <Text style={styles.metaValue}>{formatDate(invoice.dueDate)}</Text>
          </View>
        </View>

        <View style={styles.table}>
          <View style={styles.tableHeaderRow}>
            <Text style={[styles.colDesc, styles.headerCell]}>Deskripsi</Text>
            <Text style={[styles.colQty, styles.headerCell]}>Sesi</Text>
            <Text style={[styles.colAmount, styles.headerCell]}>Jumlah</Text>
          </View>
          <View style={styles.tableRow}>
            <Text style={styles.colDesc}>Paket {invoice.packageType} — Terapi {invoice.therapyType}</Text>
            <Text style={styles.colQty}>{invoice.sessions}</Text>
            <Text style={styles.colAmount}>{formatRupiah(invoice.originalAmount || invoice.amount)}</Text>
          </View>
        </View>

        <View style={styles.totalsBlock}>
          {invoice.discountAmount > 0 && (
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Diskon</Text>
              <Text style={styles.totalValue}>- {formatRupiah(invoice.discountAmount)}</Text>
            </View>
          )}
          <View style={styles.grandTotalRow}>
            <Text style={styles.grandTotalLabel}>Total Tagihan</Text>
            <Text style={styles.grandTotalValue}>{formatRupiah(invoice.amount)}</Text>
          </View>
        </View>

        <Text style={[styles.statusBadge, STATUS_STYLE[invoice.status] ?? STATUS_STYLE.unpaid]}>
          {STATUS_LABEL[invoice.status] ?? invoice.status.toUpperCase()}
          {invoice.status === "paid" && invoice.paidAt ? ` — ${formatDate(invoice.paidAt)}` : ""}
        </Text>

        {invoice.notes && <Text style={styles.notes}>{invoice.notes}</Text>}

        <Text style={styles.footer} fixed>
          Dokumen ini dihasilkan otomatis oleh sistem Hearty Bridge pada {formatDate(new Date().toISOString())}.
        </Text>
      </Page>
    </Document>
  );
}
