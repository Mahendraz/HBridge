"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { MenuIcon, XIcon, UserIcon, LogOutIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/contexts/auth-context";
import { ShimmerButton } from "@/components/magicui/shimmer-button";

const navigation = [
  { name: "Beranda", href: "/" },
  { name: "Tentang Kami", href: "/about" },
  { name: "Layanan", href: "/services" },
  { name: "Kontak", href: "/contact" },
];

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, logout, isLoading } = useAuth();
  const pathname = usePathname();

  // Don't show public header on dashboard pages — they have their own sidebar nav
  if (pathname?.startsWith("/dashboard")) return null;

  return (
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-lg border-b border-gray-200/60 shadow-sm">
      <div className="mx-auto max-w-7xl px-6">
        <div className="flex h-16 justify-between items-center">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-2 group">
              <Image
                src="/images/logo-heartybridge.png"
                alt="Hearty Bridge"
                width={36}
                height={36}
                className="h-9 w-9 object-contain"
                priority
              />
              <span className="leading-tight">
                <span className="block text-xl font-bold text-gray-900">
                  Hearty<span className="text-teal-600">Bridge</span>
                </span>
                <span className="block text-[11px] font-semibold tracking-wide text-brand-coral">
                  Grow Up with Hug
                </span>
              </span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-1">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="text-gray-600 hover:text-gray-900 hover:bg-gray-100 px-3 py-2 text-sm font-medium rounded-lg transition-colors"
              >
                {item.name}
              </Link>
            ))}
          </nav>

          {/* Desktop Auth Buttons */}
          <div className="hidden md:flex items-center space-x-3">
            {user ? (
              <div className="flex items-center space-x-3">
                <Link href="/dashboard">
                  <Button variant="ghost" size="sm" className="flex items-center space-x-2 text-gray-700">
                    <div className="h-7 w-7 rounded-full bg-teal-100 flex items-center justify-center text-teal-700 text-xs font-bold">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                    <span className="max-w-[120px] truncate">{user.name}</span>
                  </Button>
                </Link>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={logout}
                  className="flex items-center space-x-1.5 text-gray-600 hover:text-red-600 hover:border-red-200"
                >
                  <LogOutIcon className="h-4 w-4" />
                  <span>Keluar</span>
                </Button>
              </div>
            ) : (
              <Link href="/auth/login">
                <ShimmerButton
                  background="rgba(15, 118, 110, 1)"
                  borderRadius="8px"
                  className="text-sm font-semibold px-4 py-2"
                >
                  Masuk
                </ShimmerButton>
              </Link>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              type="button"
              className="text-gray-600 hover:text-gray-900 p-2 rounded-lg hover:bg-gray-100 transition-colors"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <XIcon className="h-5 w-5" /> : <MenuIcon className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {isMenuOpen && (
          <div className="md:hidden border-t border-gray-100 py-3">
            <div className="space-y-1">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className="block text-gray-700 hover:text-teal-600 hover:bg-teal-50 px-3 py-2.5 text-sm font-medium rounded-lg transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {item.name}
                </Link>
              ))}
            </div>
            <div className="pt-3 mt-3 border-t border-gray-100 space-y-2">
              {user ? (
                <>
                  <Link href="/dashboard" onClick={() => setIsMenuOpen(false)}>
                    <Button variant="ghost" className="w-full justify-start text-gray-700">
                      <UserIcon className="h-4 w-4 mr-2" />
                      {user.name}
                    </Button>
                  </Link>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-gray-600"
                    onClick={() => { logout(); setIsMenuOpen(false); }}
                  >
                    <LogOutIcon className="h-4 w-4 mr-2" />
                    Keluar
                  </Button>
                </>
              ) : (
                <Link href="/auth/login" onClick={() => setIsMenuOpen(false)}>
                  <ShimmerButton
                    background="rgba(15, 118, 110, 1)"
                    borderRadius="8px"
                    className="w-full justify-center text-sm font-semibold py-2.5"
                  >
                    Masuk
                  </ShimmerButton>
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
