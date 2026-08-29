import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { ErrorBoundary } from "@/components/ui/error";
import { AuthProvider } from "@/lib/contexts/auth-context";
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, getLocale } from 'next-intl/server';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const siteUrl = "https://heartybridge.id";
const ogImage = `${siteUrl}/images/og-image.png`;

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Hearty Bridge | Pusat Terapi Anak & Tumbuh Kembang di Batam",
    template: "%s | Hearty Bridge",
  },
  description:
    "Hearty Bridge Early Intervention Center — pusat terapi anak & tumbuh kembang di Batam. Asesmen, terapi okupasi, terapi wicara, terapi akuatik, homecare, dan konsultasi keluarga. Grow Up with Hug.",
  keywords:
    "terapi anak batam, tumbuh kembang anak, terapi okupasi, terapi wicara, speech delay, autisme, early intervention batam, pusat terapi anak",
  authors: [{ name: "Hearty Bridge" }],
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "id_ID",
    url: siteUrl,
    siteName: "Hearty Bridge",
    title: "Hearty Bridge | Pusat Terapi Anak & Tumbuh Kembang di Batam",
    description:
      "Asesmen, terapi okupasi, terapi wicara, terapi akuatik, homecare, dan konsultasi keluarga untuk tumbuh kembang anak di Batam. Grow Up with Hug.",
    images: [{ url: ogImage, width: 1200, height: 630, alt: "Hearty Bridge — Grow Up with Hug" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Hearty Bridge | Pusat Terapi Anak & Tumbuh Kembang di Batam",
    description:
      "Asesmen, terapi okupasi, terapi wicara, terapi akuatik, homecare, dan konsultasi keluarga untuk tumbuh kembang anak di Batam.",
    images: [ogImage],
  },
  robots: {
    index: true,
    follow: true,
  },
};

const localBusinessSchema = {
  "@context": "https://schema.org",
  "@type": "MedicalClinic",
  name: "Hearty Bridge Early Intervention Center",
  alternateName: "Hearty Bridge",
  description:
    "Pusat terapi anak & tumbuh kembang di Batam — asesmen, terapi okupasi, terapi wicara, terapi akuatik, homecare, dan konsultasi keluarga.",
  url: siteUrl,
  logo: `${siteUrl}/images/logo-heartybridge.png`,
  image: ogImage,
  address: {
    "@type": "PostalAddress",
    streetAddress: "Puri Casablanca No. A-18, Sukajadi",
    addressLocality: "Batam Kota",
    addressRegion: "Kepulauan Riau",
    postalCode: "29432",
    addressCountry: "ID",
  },
  areaServed: "Batam",
  medicalSpecialty: ["Occupational Therapy", "Speech-Language Pathology"],
  sameAs: ["https://www.instagram.com/heartybridge_/"],
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <html
      lang={locale}
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-white">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessSchema) }}
        />
        <NextIntlClientProvider messages={messages}>
          <ErrorBoundary>
            <AuthProvider>
              <Header />
              <main className="flex-1">
                {children}
              </main>
              <Footer />
            </AuthProvider>
          </ErrorBoundary>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
