"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { MapPinIcon } from "lucide-react";
import { InstagramIcon } from "@/components/icons/instagram-icon";

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
              <Image
                src="/images/logo-heartybridge.png"
                alt="Hearty Bridge"
                width={40}
                height={40}
                className="h-10 w-10 object-contain"
              />
              <span className="text-xl font-bold text-gray-900">Hearty Bridge</span>
            </div>
            <p className="text-gray-600 text-sm max-w-md">
              Pusat Terapi Anak &amp; Tumbuh Kembang di Batam. Mendukung tumbuh kembang anak
              mencapai potensi terbaiknya lewat asesmen, terapi okupasi, terapi wicara, terapi
              akuatik, dan konsultasi keluarga.
            </p>
            <div className="mt-6 space-y-2">
              <div className="flex items-start text-sm text-gray-600">
                <MapPinIcon className="h-4 w-4 mr-2 mt-0.5 shrink-0" />
                <span>Puri Casablanca No. A-18, Sukajadi, Kec. Batam Kota, Kota Batam, Kepulauan Riau 29432</span>
              </div>
              <a
                href="https://www.instagram.com/heartybridge_/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center text-sm text-gray-600 hover:text-brand-coral transition-colors w-fit"
              >
                <InstagramIcon className="h-4 w-4 mr-2" />
                <span>@heartybridge_</span>
              </a>
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
                Pusat Terapi Anak & Tumbuh Kembang • Batam • Grow Up with Hug
              </p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
