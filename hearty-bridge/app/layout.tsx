import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { ErrorBoundary } from "@/components/ui/error";
import { AuthProvider } from "@/lib/contexts/auth-context";
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, getLocale } from 'next-intl/server';
import { COMPANY, CONTACT, OPENING_HOURS, SERVICES, SOCIALS } from "@/lib/content/landing";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const siteUrl = COMPANY.siteUrl;
const ogImage = `${siteUrl}/images/og-image.png`;

const pageTitle = `${COMPANY.shortName} | Pusat Terapi Anak & Tumbuh Kembang di ${COMPANY.city}`;
const serviceList =
  "asesmen tumbuh kembang, screening, terapi okupasi, terapi wicara, aquatic therapy, homecare, psikolog klinis, dan Hero Bridge (konsultasi keluarga)";
const description = `${COMPANY.name}, pusat terapi anak & tumbuh kembang di ${COMPANY.city}: ${serviceList}. ${COMPANY.tagline}.`;
// Search snippets cut at ~155 characters, so the page description is a short
// version; the full `description` stays in the JSON-LD below.
const metaDescription = `${COMPANY.shortName}: pusat terapi anak & tumbuh kembang di ${COMPANY.city} — asesmen, terapi okupasi, terapi wicara, aquatic therapy, psikolog klinis & homecare.`;
const shortDescription = `Asesmen, screening, terapi okupasi, terapi wicara, aquatic therapy, homecare, psikolog klinis, dan konsultasi keluarga Hero Bridge untuk tumbuh kembang anak di ${COMPANY.city}.`;

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: pageTitle,
    template: `%s | ${COMPANY.shortName}`,
  },
  description: metaDescription,
  keywords: [
    "terapi anak Batam",
    "pusat tumbuh kembang anak Batam",
    "early intervention Batam",
    "asesmen tumbuh kembang anak",
    "screening tumbuh kembang",
    "terapi okupasi Batam",
    "terapi wicara Batam",
    "aquatic therapy anak",
    "terapi anak homecare Batam",
    "psikolog klinis anak Batam",
    "konsultasi keluarga",
    "Hero Bridge",
    "autisme",
    "ADHD",
    "anak terlambat bicara",
    "Hearty Bridge",
  ],
  authors: [{ name: COMPANY.name }],
  // The canonical URL is set by app/page.tsx, so other routes don't inherit "/".
  openGraph: {
    type: "website",
    locale: "id_ID",
    url: siteUrl,
    siteName: COMPANY.name,
    title: pageTitle,
    description: `${shortDescription} ${COMPANY.tagline}.`,
    images: [{ url: ogImage, width: 1200, height: 630, alt: `${COMPANY.shortName} — ${COMPANY.tagline}` }],
  },
  twitter: {
    card: "summary_large_image",
    title: pageTitle,
    description: shortDescription,
    images: [ogImage],
  },
  robots: {
    index: true,
    follow: true,
  },
};

// schema.org day names, indexed like JS getDay() (0 = Sunday).
const SCHEMA_DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"] as const;

// Built only from lib/content/landing.ts — no facts that are not in there.
const localBusinessSchema = {
  "@context": "https://schema.org",
  "@type": "MedicalClinic",
  name: COMPANY.name,
  alternateName: COMPANY.shortName,
  slogan: COMPANY.tagline,
  description,
  url: siteUrl,
  logo: `${siteUrl}/images/logo-heartybridge.png`,
  image: ogImage,
  telephone: CONTACT.phoneE164,
  email: CONTACT.email,
  address: {
    "@type": "PostalAddress",
    streetAddress: CONTACT.address.street,
    addressLocality: CONTACT.address.city,
    addressRegion: CONTACT.address.region,
    postalCode: CONTACT.address.postalCode,
    addressCountry: "ID",
  },
  hasMap: CONTACT.mapsUrl,
  openingHoursSpecification: OPENING_HOURS.map((slot) => ({
    "@type": "OpeningHoursSpecification",
    dayOfWeek: slot.days.map((d) => SCHEMA_DAYS[d]),
    opens: slot.open,
    closes: slot.close,
  })),
  foundingDate: COMPANY.foundedAt,
  parentOrganization: {
    "@type": "Organization",
    name: COMPANY.parent.name,
  },
  areaServed: {
    "@type": "City",
    name: COMPANY.city,
  },
  sameAs: SOCIALS.flatMap((social) => (social.url ? [social.url] : [])),
  medicalSpecialty: ["SpeechPathology"],
  availableService: SERVICES.map((service) => ({
    "@type": "MedicalTherapy",
    name: service.name,
    description: service.description,
  })),
};

// `<` escaped so no string in the data can close the script tag.
const jsonLd = JSON.stringify(localBusinessSchema).replace(/</g, "\\u003c");

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
      suppressHydrationWarning
      // globals.css sets `scroll-behavior: smooth`; this tells Next to switch it
      // off for route changes so navigating away doesn't animate the scroll.
      data-scroll-behavior="smooth"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-white">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: jsonLd }}
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
