import { Document, Page, Text, View, StyleSheet, Image } from "@react-pdf/renderer";

const styles = StyleSheet.create({
  page: { padding: 40, fontSize: 11, fontFamily: "Helvetica", color: "#1f2937" },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16, borderBottom: "2 solid #0d9488", paddingBottom: 12 },
  clinicName: { fontSize: 16, fontWeight: 700, color: "#0d9488" },
  clinicTagline: { fontSize: 9, color: "#6b7280", marginTop: 2 },
  docLabel: { fontSize: 10, color: "#6b7280", textAlign: "right" },
  title: { fontSize: 15, fontWeight: 700, marginBottom: 12 },
  metaGrid: { flexDirection: "row", flexWrap: "wrap", marginBottom: 16, gap: 8 },
  metaBox: { width: "48%", backgroundColor: "#f9fafb", borderRadius: 4, padding: 8, marginBottom: 8 },
  metaLabel: { fontSize: 8, color: "#6b7280", marginBottom: 2, textTransform: "uppercase" },
  metaValue: { fontSize: 11, fontWeight: 500 },
  section: { marginBottom: 14 },
  sectionTitle: { fontSize: 11, fontWeight: 700, marginBottom: 6, color: "#0d9488" },
  paragraph: { fontSize: 10, lineHeight: 1.5, color: "#374151" },
  mediaGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 6 },
  mediaThumb: { width: 140, height: 105, borderRadius: 4, objectFit: "cover" },
  footer: { position: "absolute", bottom: 30, left: 40, right: 40, fontSize: 8, color: "#9ca3af", textAlign: "center", borderTop: "1 solid #e5e7eb", paddingTop: 8 },
});

function formatDate(d?: string | Date | null): string {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("id-ID", { day: "2-digit", month: "long", year: "numeric" });
}

const TYPE_LABELS: Record<string, string> = {
  progress: "Laporan Harian",
  assessment: "Laporan Asesmen",
  hero_bridge: "Laporan Hero Bridge",
};

export interface ReportPdfData {
  title: string;
  description?: string;
  content?: string;
  type: string;
  childName: string;
  therapistName: string;
  sessionDate?: string | null;
  createdAt: string;
  mediaImages: string[]; // pre-resolved signed URLs, images only
}

export function ReportPdfDocument({ report }: { report: ReportPdfData }) {
  return (
    <Document title={report.title}>
      <Page size="A4" style={styles.page}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.clinicName}>Hearty Bridge</Text>
            <Text style={styles.clinicTagline}>Menghubungkan anak dan terapis dengan penuh kasih</Text>
          </View>
          <Text style={styles.docLabel}>{TYPE_LABELS[report.type] ?? "Laporan Terapi"}</Text>
        </View>

        <Text style={styles.title}>{report.title}</Text>

        <View style={styles.metaGrid}>
          <View style={styles.metaBox}>
            <Text style={styles.metaLabel}>Nama Anak</Text>
            <Text style={styles.metaValue}>{report.childName}</Text>
          </View>
          <View style={styles.metaBox}>
            <Text style={styles.metaLabel}>Terapis</Text>
            <Text style={styles.metaValue}>{report.therapistName}</Text>
          </View>
          <View style={styles.metaBox}>
            <Text style={styles.metaLabel}>Tanggal Sesi</Text>
            <Text style={styles.metaValue}>{formatDate(report.sessionDate)}</Text>
          </View>
          <View style={styles.metaBox}>
            <Text style={styles.metaLabel}>Tanggal Upload</Text>
            <Text style={styles.metaValue}>{formatDate(report.createdAt)}</Text>
          </View>
        </View>

        {report.description && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Ringkasan</Text>
            <Text style={styles.paragraph}>{report.description}</Text>
          </View>
        )}

        {report.content && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Isi Laporan</Text>
            <Text style={styles.paragraph}>{report.content}</Text>
          </View>
        )}

        {report.mediaImages.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Dokumentasi</Text>
            <View style={styles.mediaGrid}>
              {report.mediaImages.map((url, i) => (
                <Image key={i} src={url} style={styles.mediaThumb} />
              ))}
            </View>
          </View>
        )}

        <Text style={styles.footer} fixed>
          Dokumen ini dihasilkan otomatis oleh sistem Hearty Bridge pada {formatDate(new Date().toISOString())}.
        </Text>
      </Page>
    </Document>
  );
}
