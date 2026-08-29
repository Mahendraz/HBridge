"use client";

import Link from "next/link";
import {
  ArrowRightIcon,
  ShieldIcon,
  UsersIcon,
  HeartHandshakeIcon,
  CalendarIcon,
  MessageSquareIcon,
  BarChart3Icon,
} from "lucide-react";
import { AuthGuard } from "@/components/auth/auth-guard";
import { useTranslations } from "next-intl";
import { AnimatedGradientText } from "@/components/magicui/animated-gradient-text";
import { BlurFade } from "@/components/magicui/blur-fade";
import { MagicCard } from "@/components/magicui/magic-card";
import { Meteors } from "@/components/magicui/meteors";
import { ShimmerButton } from "@/components/magicui/shimmer-button";
import { DotPattern } from "@/components/magicui/dot-pattern";
import { InstagramFeedSection } from "@/components/instagram/instagram-feed-section";
import { MapPinIcon } from "lucide-react";
import { InstagramIcon } from "@/components/icons/instagram-icon";

const features = [
  {
    icon: ShieldIcon,
    title: "Terpercaya & Hangat",
    description:
      "Tim kami mendampingi setiap anak dengan pendekatan yang hangat dan profesional. Data tumbuh kembang anak Anda tersimpan aman.",
    color: "text-teal-600",
    bg: "bg-teal-50",
  },
  {
    icon: UsersIcon,
    title: "Tim Terapis Berpengalaman",
    description:
      "Asesmen, terapi okupasi, terapi wicara, terapi akuatik, hingga konsultasi keluarga — semua dalam satu tim di Batam.",
    color: "text-emerald-600",
    bg: "bg-emerald-50",
  },
  {
    icon: HeartHandshakeIcon,
    title: "Perawatan Personal",
    description:
      "Setiap anak unik. Kami menyesuaikan program terapi dengan kebutuhan spesifik putra-putri Anda.",
    color: "text-green-600",
    bg: "bg-green-50",
  },
  {
    icon: CalendarIcon,
    title: "Jadwal Fleksibel",
    description:
      "Atur jadwal sesi terapi langsung dari aplikasi. Pengingat otomatis agar tidak ada sesi yang terlewat.",
    color: "text-teal-600",
    bg: "bg-teal-50",
  },
  {
    icon: MessageSquareIcon,
    title: "Komunikasi Real-time",
    description:
      "Chat langsung dengan terapis, kirim laporan perkembangan, dan dapatkan feedback secara instan kapan saja.",
    color: "text-emerald-600",
    bg: "bg-emerald-50",
  },
  {
    icon: BarChart3Icon,
    title: "Pantau Perkembangan",
    description:
      "Laporan perkembangan terperinci setiap sesi. Lihat progres anak Anda secara visual dan terukur.",
    color: "text-green-600",
    bg: "bg-green-50",
  },
];

export default function Home() {
  const t = useTranslations("home");

  return (
    <AuthGuard requireAuth={false}>
      <div className="min-h-screen bg-white">

        {/* ── HERO ─────────────────────────────────────────────── */}
        <section className="relative overflow-hidden bg-gray-950 pt-20 pb-32">
          <Meteors number={25} />
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="h-[600px] w-[600px] rounded-full bg-teal-500/10 blur-3xl" />
          </div>

          <div className="relative mx-auto max-w-7xl px-6 text-center">
            <BlurFade delay={0} inView>
              <div className="inline-flex items-center gap-2 rounded-full border border-teal-500/30 bg-teal-500/10 px-4 py-1.5 text-sm text-teal-300 mb-8">
                <span className="h-1.5 w-1.5 rounded-full bg-teal-400 animate-pulse" />
                Pusat Terapi Anak & Tumbuh Kembang • Batam
              </div>
            </BlurFade>

            <BlurFade delay={0.1} inView>
              <h1 className="text-5xl font-bold tracking-tight text-white sm:text-7xl leading-tight">
                {t("hero.title")}
                <br />
                <AnimatedGradientText
                  colorFrom="#14b8a6"
                  colorTo="#22c55e"
                  speed={0.8}
                  className="text-5xl sm:text-7xl font-bold"
                >
                  {t("hero.titleHighlight")}
                </AnimatedGradientText>
                <br />
                <span className="text-white">{t("hero.titleEnd")}</span>
              </h1>
            </BlurFade>

            <BlurFade delay={0.2} inView>
              <p className="mt-6 text-lg leading-8 text-gray-400 max-w-2xl mx-auto">
                {t("hero.subtitle")}
              </p>
            </BlurFade>

            <BlurFade delay={0.3} inView>
              <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link href="/auth/login">
                  <ShimmerButton
                    background="rgba(15, 118, 110, 1)"
                    className="text-base px-8 py-3.5 font-semibold"
                  >
                    Masuk ke Platform
                    <ArrowRightIcon className="ml-2 h-5 w-5" />
                  </ShimmerButton>
                </Link>
              </div>
            </BlurFade>
          </div>
        </section>

        {/* ── FEATURES / LAYANAN ──────────────────────────────── */}
        <section className="relative py-24 bg-gray-50 overflow-hidden">
          <DotPattern className="opacity-60" />
          <div className="relative mx-auto max-w-7xl px-6">
            <BlurFade inView>
              <div className="text-center mb-16">
                <span className="inline-flex items-center rounded-full bg-teal-50 border border-teal-200 px-4 py-1.5 text-sm font-semibold text-teal-700 mb-4">
                  Layanan Kami
                </span>
                <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
                  {t("features.title")}
                </h2>
                <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
                  {t("features.subtitle")}
                </p>
              </div>
            </BlurFade>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {features.map((feature, i) => (
                <BlurFade key={feature.title} delay={i * 0.08} inView>
                  <MagicCard
                    className="rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow"
                    gradientColor="#f0fdfa"
                    gradientFrom="#14b8a6"
                    gradientTo="#22c55e"
                  >
                    <div className={`inline-flex p-3 rounded-xl ${feature.bg} mb-4`}>
                      <feature.icon className={`h-6 w-6 ${feature.color}`} />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">{feature.title}</h3>
                    <p className="text-sm text-gray-600 leading-relaxed">{feature.description}</p>
                  </MagicCard>
                </BlurFade>
              ))}
            </div>

            <BlurFade delay={0.5} inView>
              <div className="mt-14 text-center">
                <Link href="/auth/login">
                  <ShimmerButton
                    background="rgba(15, 118, 110, 1)"
                    className="text-base px-8 py-3.5 font-semibold"
                    borderRadius="12px"
                  >
                    Masuk & Mulai Sekarang
                    <ArrowRightIcon className="ml-2 h-5 w-5" />
                  </ShimmerButton>
                </Link>
              </div>
            </BlurFade>
          </div>
        </section>

        {/* ── INSTAGRAM ────────────────────────────────────────── */}
        <InstagramFeedSection />

        {/* ── LOKASI & KONTAK ──────────────────────────────────── */}
        <section className="py-16 bg-gray-950 text-white">
          <div className="mx-auto max-w-5xl px-6 flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="flex items-start gap-3">
              <MapPinIcon className="h-6 w-6 text-teal-400 shrink-0 mt-1" />
              <div>
                <p className="font-semibold text-white">Hearty Bridge Early Intervention Center</p>
                <p className="text-gray-400 text-sm mt-1 max-w-md">
                  Puri Casablanca No. A-18, Sukajadi, Kec. Batam Kota, Kota Batam, Kepulauan Riau 29432
                </p>
              </div>
            </div>
            <a
              href="https://www.instagram.com/heartybridge_/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-xl border border-teal-500/30 bg-teal-500/10 px-5 py-3 text-sm font-semibold text-teal-300 hover:bg-teal-500/20 transition-colors shrink-0"
            >
              <InstagramIcon className="h-5 w-5" />
              @heartybridge_
            </a>
          </div>
        </section>

      </div>
    </AuthGuard>
  );
}
