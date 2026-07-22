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

export const metadata: Metadata = {
  title: "Hearty Bridge - Menghubungkan Anak dan Terapis dengan Penuh Kasih",
  description: "Platform terpercaya yang menghubungkan orang tua dengan terapis berkualitas untuk kebutuhan layanan kesehatan anak. Temukan profesional berlisensi dan perawatan berkualitas.",
  keywords: "terapi anak, terapis, layanan kesehatan, perawatan anak, kesehatan mental",
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
