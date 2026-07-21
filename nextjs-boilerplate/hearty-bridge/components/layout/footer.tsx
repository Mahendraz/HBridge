"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { HeartIcon, MailIcon, PhoneIcon, MapPinIcon } from "lucide-react";

export function Footer() {
  const pathname = usePathname();

  // Don't show public footer on dashboard pages
  if (pathname?.startsWith("/dashboard")) return null;

  const mainLinks = [
    { name: "Tentang Kami", href: "/about" },
    { name: "Layanan", href: "/services" },
    { name: "Kontak", href: "/contact" },
    { name: "Kebijakan Privasi", href: "/privacy" },
    { name: "Syarat & Ketentuan", href: "/terms" },
  ];

  const supportLinks = [
    { name: "Pusat Bantuan", href: "/help" },
    { name: "Keamanan & Kepercayaan", href: "/safety" },
    { name: "Panduan Komunitas", href: "/guidelines" },
    { name: "Aksesibilitas", href: "/accessibility" },
  ];

  return (
    <footer className="bg-gray-50 border-t border-gray-200">
      <div className="mx-auto max-w-7xl px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Logo and Description */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center space-x-2 mb-4">
              <HeartIcon className="h-8 w-8 text-teal-600" />
              <span className="text-xl font-bold text-gray-900">Hearty Bridge</span>
            </div>
            <p className="text-gray-600 text-sm max-w-md">
              Menghubungkan anak dan terapis dengan penuh kasih. Kami menyediakan platform terpercaya
              bagi orang tua untuk menemukan terapis berkualitas dan bagi terapis untuk menjangkau
              keluarga yang membutuhkan keahlian mereka.
            </p>
            <div className="mt-6 space-y-2">
              <div className="flex items-center text-sm text-gray-600">
                <MailIcon className="h-4 w-4 mr-2" />
                <span>hello@heartybridge.com</span>
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <PhoneIcon className="h-4 w-4 mr-2" />
                <span>1-800-HEARTY-1</span>
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <MapPinIcon className="h-4 w-4 mr-2" />
                <span>Tersedia secara nasional</span>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 tracking-wider uppercase mb-4">
              Tautan Cepat
            </h3>
            <ul className="space-y-3">
              {mainLinks.map((item) => (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    className="text-sm text-gray-600 hover:text-teal-600 transition-colors"
                  >
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 tracking-wider uppercase mb-4">
              Dukungan
            </h3>
            <ul className="space-y-3">
              {supportLinks.map((item) => (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    className="text-sm text-gray-600 hover:text-teal-600 transition-colors"
                  >
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="mt-8 pt-8 border-t border-gray-200">
          <div className="flex flex-col md:flex-row md:justify-between items-center">
            <p className="text-sm text-gray-500">
              © 2024 Hearty Bridge. Hak cipta dilindungi.
            </p>
            <div className="mt-4 md:mt-0">
              <p className="text-xs text-gray-500">
                Platform teknologi kesehatan • Sesuai HIPAA • Aman & terpercaya
              </p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
