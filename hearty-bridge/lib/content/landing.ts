// Single source of truth for the public landing page (`/`), footer, and the
// JSON-LD in `app/layout.tsx`. Every fact here comes from
// `docs/COMPANY PROFILE`. Items marked `needsConfirmation` are drafted copy
// the client has not approved yet — keep the flag until they do.

export const COMPANY = {
  name: "Hearty Bridge Early Intervention Center",
  shortName: "Hearty Bridge",
  tagline: "Grow Up with Hug",
  foundedAt: "2023-09-08",
  foundedLabel: "8 September 2023",
  city: "Batam",
  parent: {
    name: "PT Humanika",
    since: 2003,
    focus: "layanan pendidikan, pengembangan anak, dan sumber daya manusia",
  },
  domain: "heartybridge.id",
  siteUrl: "https://heartybridge.id",
} as const;

const ADDRESS = {
  street: "Puri Casablanca No. A-18, Sukajadi",
  district: "Kec. Batam Kota",
  city: "Kota Batam",
  region: "Kepulauan Riau",
  postalCode: "29432",
} as const;

export const CONTACT = {
  whatsappDisplay: "0811-1112-8899",
  // wa.me needs the international form without "+" or leading 0
  whatsappNumber: "6281111128899",
  phoneE164: "+6281111128899",
  email: "heartybridge08@gmail.com",
  address: {
    ...ADDRESS,
    full: `${ADDRESS.street}, ${ADDRESS.district}, ${ADDRESS.city}, ${ADDRESS.region} ${ADDRESS.postalCode}`,
  },
  mapsUrl: "https://maps.app.goo.gl/VNAUuGta4vXZPpoo8",
  bookingUrl: "https://lynk.id/heartybridge",
  bookingLabel: "lynk.id/heartybridge",
} as const;

export const SOCIALS = [
  { id: "instagram", label: "Instagram", handle: "@heartybridge_", url: "https://www.instagram.com/heartybridge_/" },
  { id: "tiktok", label: "TikTok", handle: "@heartybridge_", url: "https://www.tiktok.com/@heartybridge_" },
  // Profile only gives the page name, not a URL — render as text until the client sends the link.
  { id: "facebook", label: "Facebook", handle: "Hearty Bridge Early Intervention Center", url: null },
] as const;

// Asia/Jakarta (WIB). `day` follows JS getDay(): 0 = Minggu … 6 = Sabtu.
export const OPENING_HOURS = [
  { label: "Senin – Jumat", days: [1, 2, 3, 4, 5], open: "09:00", close: "18:00" },
  { label: "Sabtu", days: [6], open: "09:00", close: "17:00" },
] as const;

// "09:00" → "09.00": Indonesian time notation for display. OPENING_HOURS keeps
// the colon form because the JSON-LD in app/layout.tsx needs it.
export function formatHour(hhmm: string): string {
  return hhmm.replace(":", ".");
}

export type WhatsAppTopic =
  | { kind: "general" }
  | { kind: "service"; serviceName: string }
  | { kind: "partnership" };

export function whatsappText(topic: WhatsAppTopic = { kind: "general" }): string {
  switch (topic.kind) {
    case "service":
      return `Halo Hearty Bridge, saya ingin bertanya tentang layanan ${topic.serviceName}.`;
    case "partnership":
      return "Halo Hearty Bridge, saya tertarik menjajaki kerja sama dengan Hearty Bridge.";
    default:
      return "Halo Hearty Bridge, saya ingin konsultasi tentang tumbuh kembang anak saya.";
  }
}

export function whatsappUrl(text: string = whatsappText()): string {
  return `https://wa.me/${CONTACT.whatsappNumber}?text=${encodeURIComponent(text)}`;
}

// ── Hero ──────────────────────────────────────────────────────────────────

export const HERO = {
  eyebrow: "Early Intervention Center • Batam",
  // One entry per visual line (D3: headline rises line by line).
  headlineLines: ["Pusat terapi anak", "& tumbuh kembang", "di Batam"],
  highlightLineIndex: 1,
  subtitle:
    "Hearty Bridge mendampingi anak tumbuh percaya diri, bahagia, dan mandiri — lewat asesmen, terapi okupasi, terapi wicara, aquatic therapy, psikolog klinis, dan homecare. Pendekatan holistik, hangat, dan profesional.",
  trustChips: [
    "Tanpa rujukan dokter",
    "Terapis lulusan bidangnya & bersertifikat",
    "Bayi hingga remaja",
  ],
  primaryCta: "Konsultasi via WhatsApp",
  secondaryCta: "Lihat alur layanan",
  loginHint: "Sudah menjadi klien?",
  loginCta: "Masuk ke platform",
} as const;

// ── Layanan (8, confirmed by client) ──────────────────────────────────────

export type ServiceId =
  | "asesmen"
  | "screening"
  | "okupasi"
  | "wicara"
  | "aquatic"
  | "homecare"
  | "psikolog"
  | "hero-bridge";

export interface Service {
  id: ServiceId;
  name: string;
  short: string;
  description: string;
  details?: string[];
  /** How the service reads after "layanan" in a sentence, when `name` would repeat words. */
  inquiryName?: string;
  needsConfirmation?: boolean;
}

export const SERVICES: Service[] = [
  {
    id: "asesmen",
    name: "Asesmen Tumbuh Kembang",
    short: "Mengenal kemampuan & kebutuhan anak",
    description:
      "Asesmen sesuai kebutuhan untuk mengetahui kemampuan, kebutuhan, serta area perkembangan anak yang perlu mendapatkan intervensi.",
  },
  {
    id: "screening",
    name: "Pemeriksaan Awal (Screening)",
    short: "Gambaran awal sebelum melangkah",
    // Profile has no description yet — drafted, awaiting client confirmation.
    description:
      "Pemeriksaan awal untuk melihat gambaran kondisi dan kebutuhan anak, sebagai dasar menentukan langkah dan layanan berikutnya.",
    needsConfirmation: true,
  },
  {
    id: "okupasi",
    name: "Terapi Okupasi",
    short: "Motorik, sensorik & kemandirian",
    description:
      "Membantu anak lebih mandiri melalui stimulasi motorik, sensorik, dan perilaku secara holistik.",
  },
  {
    id: "wicara",
    name: "Terapi Wicara",
    short: "Bicara & percaya diri berkomunikasi",
    description: "Meningkatkan kemampuan bicara dan kepercayaan diri anak dalam berkomunikasi.",
  },
  {
    id: "aquatic",
    name: "Aquatic Therapy",
    short: "Terapi okupasi berbasis air",
    description:
      "Terapi okupasi berbasis air untuk melatih koordinasi, keseimbangan, dan fokus anak dalam suasana menyenangkan.",
    details: [
      "Dilaksanakan di kolam yang disepakati bersama orang tua. Belum punya pilihan kolam? Tim kami bantu menentukan lokasi yang sesuai kebutuhan terapi dan pertimbangan keamanan.",
      "Sebelum mulai, anak melalui screening kondisi dan kebutuhan terkait aktivitas di air.",
      "Orang tua mendapat informasi mengenai hal-hal yang perlu diperhatikan dan prosedur keselamatan sebelum memberikan persetujuan.",
    ],
  },
  {
    id: "homecare",
    name: "Layanan Homecare",
    inquiryName: "homecare",
    short: "Terapi di rumah, radius ±10 km",
    description:
      "Terapi di rumah untuk area dengan jarak maksimal ±10 km dari Hearty Bridge Early Intervention Center, dengan mempertimbangkan ketersediaan terapis dan jadwal layanan.",
    details: ["Pelaksanaan disesuaikan dengan kebutuhan anak serta kondisi lingkungan tempat terapi."],
  },
  {
    id: "psikolog",
    name: "Psikolog Klinis",
    short: "Emosi, sosial & perilaku",
    description:
      "Mendampingi keluarga mengenal perkembangan emosional, sosial, dan perilaku anak secara profesional.",
  },
  {
    id: "hero-bridge",
    name: "Hero Bridge (Konsultasi Keluarga)",
    inquiryName: "Hero Bridge (konsultasi keluarga)",
    short: "Anak, orang tua & terapis satu tim",
    description:
      "Program kolaboratif yang memperkuat hubungan anak, orang tua, dan terapis dalam proses terapi.",
  },
];

/** Service name as it reads after "layanan" in a pre-filled message. */
export function serviceInquiryName(service: Service): string {
  return service.inquiryName ?? service.name;
}

export const SERVICES_COPY = {
  eyebrow: "Layanan Kami",
  title: `${SERVICES.length} layanan, satu tim untuk tumbuh kembang anak`,
  // Profile §7 alur step 4 ("berdasarkan hasil asesmen …") + WHY_US "personal".
  subtitle:
    "Program terapi disusun berdasarkan hasil asesmen dan disesuaikan dengan kebutuhan, kemampuan, serta tahap perkembangan masing-masing anak.",
  tablistLabel: "Pilih layanan",
  inquiryCta: "Tanya tentang layanan ini",
  whatsappCta: "atau chat via WhatsApp",
  newTabHint: "(membuka tab baru)",
} as const;

// ── Kondisi yang ditangani ────────────────────────────────────────────────
// Names from profile §6, except "Wicara & Bahasa" (profile: "Terapi Wicara &
// Bahasa", a therapy rather than a condition): that rename needsConfirmation,
// together with the open question on the 6 categories. The one-liners are
// drafted copy (needsConfirmation).

export const CONDITIONS = [
  {
    id: "asd",
    name: "Autisme (ASD)",
    description: "Pendampingan komunikasi, interaksi, regulasi sensorik, dan kemandirian sehari-hari.",
  },
  {
    id: "wicara-bahasa",
    name: "Wicara & Bahasa",
    description: "Untuk anak yang terlambat bicara, sulit dipahami, atau belum lancar memahami bahasa.",
  },
  {
    id: "adhd",
    name: "ADHD",
    description: "Melatih fokus, pengendalian diri, dan keteraturan dalam aktivitas sehari-hari.",
  },
  {
    id: "emosi-perilaku",
    name: "Emosional & Perilaku",
    description: "Membantu anak mengenali dan mengelola emosi serta perilakunya, bersama orang tua.",
  },
  {
    id: "belajar",
    name: "Kesulitan Belajar",
    description: "Mendukung kesiapan belajar anak: perhatian, motorik halus, dan pemahaman.",
  },
  {
    id: "perkembangan",
    name: "Keterlambatan Perkembangan",
    description: "Intervensi dini saat tahapan motorik, bicara, atau kemandirian anak belum sesuai usianya.",
  },
] as const;

export const CONDITIONS_COPY = {
  eyebrow: "Kondisi yang Kami Dampingi",
  title: "Setiap anak unik, begitu juga kebutuhannya",
  subtitle:
    "Program terapi disesuaikan dengan kebutuhan, kemampuan, karakter, dan tahap perkembangan masing-masing anak.",
  notSureTitle: "Belum yakin anak Anda butuh apa?",
  notSureBody:
    "Orang tua dapat langsung berkonsultasi tanpa membawa diagnosis atau surat rujukan dokter. Jika diperlukan, kami lakukan asesmen atau konsultasi perkembangan untuk memahami kebutuhan anak dan menentukan layanan yang sesuai.",
  notSureCta: "Konsultasi dulu",
} as const;

// ── Alur layanan (A5 journey) ─────────────────────────────────────────────
// Titles and descriptions follow profile §7. The `parentRole` chips are
// drafted copy: needsConfirmation.

export const JOURNEY_COPY = {
  eyebrow: "Alur Layanan",
  title: "Perjalanan si kecil bersama Hearty Bridge",
  subtitle: "Enam langkah, dari cerita pertama Anda sampai evaluasi berkala. Setiap langkah membangun jembatan tumbuh kembangnya.",
  skip: "Lewati alur",
  finale: "Grow Up with Hug",
} as const;

export const JOURNEY_STEPS = [
  {
    id: "intake",
    title: "Intake Awal",
    description:
      "Orang tua mengisi data dan informasi awal mengenai anak — kebutuhan, keluhan, riwayat perkembangan, serta informasi lain yang diperlukan sebagai dasar pelayanan.",
    parentRole: "Ceritakan kondisi si kecil apa adanya.",
  },
  {
    id: "asesmen",
    title: "Asesmen",
    description:
      "Anak menjalani asesmen sesuai kebutuhan untuk mengetahui kemampuan, kebutuhan, serta area perkembangan yang perlu mendapatkan intervensi.",
    parentRole: "Kehadiran Anda disesuaikan dengan kebutuhan anak.",
  },
  {
    id: "hasil",
    title: "Penyampaian Hasil Asesmen",
    description:
      "Terapis menjelaskan hasil asesmen kepada orang tua — kekuatan anak, area yang masih perlu dikembangkan, serta rekomendasi intervensi.",
    parentRole: "Tanyakan apa pun yang belum jelas.",
  },
  {
    id: "program",
    title: "Penyusunan Program Terapi",
    description:
      "Berdasarkan hasil asesmen, terapis menentukan tujuan dan program terapi yang disesuaikan dengan kebutuhan anak. Frekuensi dibahas bersama orang tua sebelum program dimulai.",
    parentRole: "Diskusikan rekomendasi frekuensi bersama terapis.",
  },
  {
    id: "terapi",
    title: "Pelaksanaan Terapi",
    description:
      "Anak mulai mengikuti sesi terapi sesuai program dan frekuensi yang telah ditentukan. Orang tua dapat diberikan home program untuk dilanjutkan di rumah.",
    parentRole: "Lanjutkan aktivitas sederhana di rumah.",
  },
  {
    id: "evaluasi",
    title: "Evaluasi Berkala",
    description:
      "Perkembangan anak dipantau dan dievaluasi secara berkala untuk melihat pencapaian tujuan terapi serta menentukan penyesuaian program selanjutnya.",
    parentRole: "Rayakan setiap langkah kecilnya.",
  },
] as const;

// Shown as the band right after the journey (its background must match the
// journey's final frame — C7 pattern 3).
export const SESSION_FACTS = [
  { id: "durasi", value: "±60", unit: "menit", label: "Durasi satu sesi terapi" },
  { id: "frekuensi", value: "2–3×", unit: "per minggu", label: "Umumnya direkomendasikan, disesuaikan hasil asesmen" },
  { id: "individual", value: "1 : 1", unit: "individual", label: "Sebagian besar program; kelompok untuk kebutuhan tertentu" },
  { id: "usia", value: "Bayi", unit: "hingga remaja", label: "Termasuk balita dan anak usia sekolah" },
] as const;

// ── Mengapa Hearty Bridge (6) ─────────────────────────────────────────────

export const WHY_US = [
  {
    id: "profesional",
    title: "Terapis profesional dan kompeten",
    description:
      "Didukung terapis yang memiliki latar belakang pendidikan dan kompetensi di bidangnya, serta bersertifikat.",
  },
  {
    id: "personal",
    title: "Pendekatan personal untuk setiap anak",
    description:
      "Program terapi disesuaikan dengan kebutuhan, kemampuan, karakter, dan tahap perkembangan masing-masing anak.",
  },
  {
    id: "fungsional",
    title: "Berfokus pada kemampuan fungsional",
    description:
      "Keterampilan yang dipelajari diarahkan agar bisa diterapkan dalam aktivitas sehari-hari, bermain, belajar, dan kemandirian anak.",
  },
  {
    id: "keluarga",
    title: "Melibatkan keluarga",
    description:
      "Perkembangan anak tidak hanya terjadi di ruang terapi. Orang tua menjadi bagian penting dan mendapat arahan yang bisa diterapkan di rumah.",
  },
  {
    id: "kolaborasi",
    title: "Melihat anak secara menyeluruh",
    description:
      "Kebutuhan anak dapat ditinjau dari berbagai aspek perkembangan melalui terapi okupasi, terapi wicara, konsultasi perkembangan, dan konsultasi keluarga.",
  },
  {
    id: "lingkungan",
    title: "Lingkungan ramah & menyenangkan",
    description:
      "Suasana terapi yang aman, hangat, menyenangkan, dan penuh kasih agar anak nyaman belajar dan berkembang.",
  },
] as const;

// subtitle: drafted copy, needsConfirmation.
export const WHY_US_COPY = {
  eyebrow: "Mengapa Hearty Bridge?",
  title: "Hangat untuk anak, jelas untuk orang tua",
  subtitle: "Enam hal yang kami jaga di setiap sesi.",
} as const;

// ── Tentang kami ──────────────────────────────────────────────────────────

export const ABOUT = {
  eyebrow: "Tentang Kami",
  title: "Jembatan hangat untuk tumbuh kembang anak",
  paragraphs: [
    `${COMPANY.name} berdiri pada ${COMPANY.foundedLabel} di ${COMPANY.city}, di bawah naungan ${COMPANY.parent.name} — perusahaan yang berpengalaman sejak ${COMPANY.parent.since} di bidang ${COMPANY.parent.focus}.`,
    "Dengan fondasi pengalaman itu, Hearty Bridge fokus pada intervensi dini dan tumbuh kembang anak secara profesional dan penuh kasih — membantu anak-anak tumbuh dengan percaya diri, bahagia, dan mandiri.",
  ],
  milestones: [
    { value: String(COMPANY.parent.since), label: `Pengalaman ${COMPANY.parent.name} di pendidikan & pengembangan anak` },
    {
      value: COMPANY.foundedAt.slice(0, 4),
      // "8 September 2023" -> "8 September"
      label: `${COMPANY.shortName} berdiri di ${COMPANY.city}, ${COMPANY.foundedLabel.replace(/\s\d{4}$/, "")}`,
    },
    { value: "8", label: "Layanan tumbuh kembang dalam satu tim" },
    { value: "6", label: "Hari layanan setiap pekan, Senin – Sabtu" },
  ],
  vision:
    "Menjadi pilihan utama keluarga di Batam untuk intervensi dini dan terapi anak dengan pendekatan holistik, hangat, dan profesional.",
  missions: [
    "Memberikan layanan terapi berkualitas tinggi dengan standar profesional.",
    "Memastikan seluruh terapis adalah lulusan bidangnya dan bersertifikat.",
    "Menerapkan pendekatan individual sesuai kebutuhan unik tiap anak.",
    "Melibatkan orang tua secara aktif dalam proses terapi.",
    "Membangun lingkungan ramah anak dan menyenangkan.",
  ],
} as const;

// ── Tim (roles from profile; only one name is confirmed) ─────────────────

export const TEAM_COPY = {
  eyebrow: "Tim Kami",
  title: "Tenaga profesional di setiap langkah",
  subtitle: "Psikolog dan terapis yang bekerja sebagai satu tim untuk si kecil.",
} as const;

export const TEAM_ROLES = [
  { id: "psikolog", role: "Psikolog Anak & Orangtua", focus: "Fokus pada aspek emosional dan sosial.", name: null },
  { id: "okupasi", role: "Terapis Okupasi", focus: "Membantu anak mengembangkan motorik dan kemandirian.", name: "Miss Adea" },
  { id: "wicara", role: "Terapis Wicara", focus: "Membantu anak berkomunikasi secara efektif.", name: null },
  { id: "aquatic", role: "Terapis Aquatic", focus: "Stimulasi sensorik melalui media air.", name: null },
  { id: "koordinator", role: "Koordinator Edukasi & Komunitas", focus: "Fasilitator program kolaborasi.", name: null },
] as const;

// ── Kolaborasi & kemitraan ────────────────────────────────────────────────

export const COLLABORATION = {
  eyebrow: "Kolaborasi & Kemitraan",
  title: "Setiap kerja sama adalah jembatan kecil menuju perubahan positif",
  leadQuote: "Perkembangan terbaik terjadi ketika anak tumbuh dalam lingkungan yang saling mendukung.",
  body: [
    "Anak belajar bukan hanya dari ruang terapi, tapi juga dari kehidupan sehari-hari. Kami percaya setiap lingkungan yang peduli dapat menjadi bagian dari proses tumbuh kembang anak.",
    "Hearty Bridge siap menjadi mitra tumbuh kembang anak — di sekolah, komunitas, maupun ruang bermain.",
  ],
  goals: [
    "Membangun jejaring positif antara lembaga, keluarga, dan komunitas.",
    "Menciptakan pengalaman yang bermakna bagi anak dan orang-orang di sekitarnya.",
    "Mendorong budaya empati, dukungan, dan kolaborasi lintas bidang.",
    "Menumbuhkan kesadaran bahwa setiap anak unik dan pantas mendapat ruang untuk berkembang.",
  ],
  forms: ["Kegiatan edukatif bersama", "Berbagi pengetahuan", "Pelatihan", "Pendampingan", "Kemitraan jangka panjang"],
  quotes: [
    "Ketika kita tumbuh bersama, anak-anak pun tumbuh lebih baik.",
    "Karena setiap langkah kecil anak, pantas dirayakan bersama.",
  ],
  cta: "Ajukan kerja sama",
} as const;

// ── Instagram ─────────────────────────────────────────────────────────────

export const INSTAGRAM_FEED = {
  title: "Cerita & edukasi dari Instagram kami",
  // "360+ konten edukasi" is from profile §12 (@heartybridge_).
  contentCount: "360+",
  subtitleSuffix: "Ikuti untuk kabar dan tips terbaru dari Hearty Bridge.",
  posts: [
    { url: "https://instagram.com/p/DPVVUvBDwqM", label: "Postingan pilihan dari Instagram Hearty Bridge" },
    {
      url: "https://instagram.com/p/Dbmnz4BvpCU",
      // Describes an external post that the profile cannot confirm.
      label: "Miss Adea, Terapis Okupasi, menjelaskan anak aktif & stimulasi sensorik",
      needsConfirmation: true,
    },
    { url: "https://instagram.com/p/Da6zYOcvFWc", label: "Video pilihan dari Instagram Hearty Bridge" },
  ],
} as const;

// ── FAQ (answers taken from profile section 7) ────────────────────────────

export const FAQ = [
  {
    q: "Apakah perlu rujukan dokter atau diagnosis terlebih dahulu?",
    a: "Tidak. Orang tua dapat langsung menghubungi Hearty Bridge untuk berkonsultasi tanpa membawa diagnosis atau surat rujukan dokter. Jika diperlukan, kami dapat melakukan asesmen atau konsultasi perkembangan untuk membantu memahami kebutuhan anak dan menentukan layanan yang sesuai.",
  },
  {
    q: "Usia berapa saja yang dilayani?",
    a: "Kami melayani bayi, balita, anak usia sekolah, hingga remaja, dengan program yang disesuaikan dengan kebutuhan dan tahap perkembangan masing-masing anak.",
  },
  {
    q: "Berapa lama satu sesi terapi?",
    a: "Satu sesi terapi umumnya berlangsung ±60 menit.",
  },
  {
    q: "Berapa kali terapi dalam seminggu?",
    a: "Umumnya direkomendasikan 2–3 kali per minggu, namun dapat disesuaikan dengan kebutuhan, tujuan terapi, kondisi anak, serta hasil asesmen. Rekomendasi frekuensi dibahas bersama orang tua sebelum program terapi dimulai.",
  },
  {
    q: "Apakah terapi dilakukan individual atau kelompok?",
    a: "Sebagian besar program dilakukan secara individual, sehingga terapis dapat memberikan intervensi yang lebih sesuai dengan kebutuhan setiap anak. Program kelompok dapat diberikan pada kegiatan atau kebutuhan tertentu, terutama untuk mendukung keterampilan sosial dan interaksi.",
  },
  {
    q: "Apakah orang tua ikut dalam sesi terapi?",
    a: "Keterlibatan orang tua merupakan bagian penting dari proses terapi. Kehadiran orang tua di ruang terapi disesuaikan dengan kebutuhan anak dan tujuan sesi. Orang tua juga dapat diberikan home program atau rekomendasi aktivitas sederhana untuk dilakukan di rumah.",
  },
  {
    q: "Apakah bisa terapi di rumah (homecare)?",
    a: "Bisa, untuk area dengan jarak maksimal ±10 km dari Hearty Bridge Early Intervention Center, dengan mempertimbangkan ketersediaan terapis dan jadwal layanan. Pelaksanaannya disesuaikan dengan kebutuhan anak serta kondisi lingkungan tempat terapi.",
  },
  {
    q: "Di mana aquatic therapy dilakukan?",
    a: "Di kolam yang disepakati bersama orang tua. Jika belum punya pilihan kolam, tim kami membantu menentukan lokasi berdasarkan kebutuhan terapi dan pertimbangan keamanan. Sebelum mulai, anak melalui screening terkait aktivitas di air, dan orang tua mendapat informasi prosedur keselamatan sebelum memberikan persetujuan.",
  },
] as const;

// ── Kontak & CTA akhir ────────────────────────────────────────────────────

export const CONTACT_COPY = {
  eyebrow: "Kontak & Lokasi",
  title: "Mari ngobrol tentang si kecil",
  // The visit wording and `hoursNote` are drafted copy (needsConfirmation): the
  // profile covers neither walk-ins nor holiday hours.
  subtitle:
    "Ceritakan kebutuhan anak Anda lewat WhatsApp, booking jadwal online, atau kunjungi center kami di Batam Kota (hubungi kami dulu untuk jadwal).",
  whatsappLabel: "WhatsApp",
  emailLabel: "Email",
  addressLabel: "Alamat",
  bookingLabel: "Booking online",
  hoursLabel: "Jam operasional",
  hoursNote: "Jam dapat berbeda pada hari libur nasional.",
  mapsCta: "Buka di Google Maps",
  inquiryCta: "Tulis pesan untuk kami",
} as const;

export const FINAL_CTA = {
  quote: "Setiap anak berhak tumbuh dengan pelukan.",
  subtitle: "Langkah pertama cukup satu pesan. Tanpa rujukan dokter, tanpa harus yakin dulu.",
  primary: "Konsultasi via WhatsApp",
  secondary: "Booking jadwal online",
} as const;

// Sticky CTA labels (H3). These buttons open the inquiry form, so none of
// them may promise WhatsApp.
export const STICKY_CTA = {
  consult: "Konsultasi sekarang",
  askService: "Tanya layanan ini",
} as const;

// ── Optional image slots ──────────────────────────────────────────────────
// Every section must render well while these are `null`. Once an image is
// generated/photographed, drop it in `public/images/landing/` and set the path.

export const LANDING_IMAGES: Record<string, string | null> = {
  hero: null,
  journeyIntake: null,
  journeyAsesmen: null,
  journeyHasil: null,
  journeyProgram: null,
  journeyTerapi: null,
  journeyEvaluasi: null,
  aboutCenter: null,
  collaboration: null,
  finalCta: null,
};
