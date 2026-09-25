"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { MenuIcon, XIcon, LogOutIcon, LayoutDashboardIcon } from "lucide-react";
import { useAuth } from "@/lib/contexts/auth-context";
import { WhatsAppIcon } from "@/components/icons/whatsapp-icon";
import { BrandMark } from "@/components/layout/brand-mark";
import { COMPANY, whatsappUrl } from "@/lib/content/landing";
import { cn } from "@/lib/utils";

// "/#…" so the links also work from /auth pages (they navigate home first).
const navigation = [
  { id: "home", name: "Beranda", href: "/#home" },
  { id: "services", name: "Layanan", href: "/#services" },
  { id: "alur", name: "Alur", href: "/#alur" },
  { id: "about", name: "Tentang", href: "/#about" },
  { id: "faq", name: "FAQ", href: "/#faq" },
  { id: "contact", name: "Kontak", href: "/#contact" },
] as const;

type NavId = (typeof navigation)[number]["id"];

// Landing section id -> the nav item it belongs to (scroll-spy).
const SECTION_TO_NAV: Record<string, NavId> = {
  home: "home",
  kondisi: "services",
  services: "services",
  alur: "alur",
  fakta: "alur",
  keunggulan: "alur",
  about: "about",
  tim: "about",
  kolaborasi: "about",
  instagram: "about",
  faq: "faq",
  contact: "contact",
  mulai: "contact",
};

const SECTION_IDS = Object.keys(SECTION_TO_NAV);

const FOCUS_RING =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-coral focus-visible:ring-offset-2";

// Which landing section sits under the viewport's midline. The ids are looked
// up on every check instead of observed once, so it keeps working when the
// page content changes under the persistent header (client navigation).
function useActiveNav(enabled: boolean): NavId | null {
  const [active, setActive] = useState<NavId | null>(null);

  useEffect(() => {
    if (!enabled) return;
    let frame = 0;

    const check = () => {
      frame = 0;
      const mid = window.innerHeight / 2;
      let found: NavId | null = null;
      for (const id of SECTION_IDS) {
        const el = document.getElementById(id);
        if (!el) continue;
        const r = el.getBoundingClientRect();
        if (r.top <= mid && r.bottom >= mid) {
          found = SECTION_TO_NAV[id];
          // #fakta sits after #alur; later matches win, so keep scanning.
        }
      }
      setActive(found);
    };

    const schedule = () => {
      if (!frame) frame = window.requestAnimationFrame(check);
    };

    schedule();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, [enabled]);

  return enabled ? active : null;
}

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const isDashboard = pathname?.startsWith("/dashboard") ?? false;
  const activeNav = useActiveNav(pathname === "/" && !isDashboard);

  // Escape closes the mobile menu. Focus inside the menu goes back to the
  // toggle; otherwise it would drop to <body> once the menu is hidden.
  useEffect(() => {
    if (!isMenuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      const inMenu = document.getElementById("mobile-menu")?.contains(document.activeElement) ?? false;
      setIsMenuOpen(false);
      if (inMenu) toggleRef.current?.focus();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isMenuOpen]);

  // Don't show public header on dashboard pages — they have their own sidebar nav
  if (isDashboard) return null;

  const closeMenu = () => setIsMenuOpen(false);

  return (
    // Exactly 4rem tall (the journey stage pins at top-16 below it), so the
    // bottom hairline is a box-shadow instead of a border.
    <header className="sticky top-0 z-50 bg-white/85 shadow-[0_1px_0_rgb(229_231_235/0.8),0_1px_3px_rgb(0_0_0/0.05)] backdrop-blur-lg">
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
        <div className="flex h-16 items-center justify-between gap-4">
          {/* Logo */}
          <Link href="/" className={cn("flex shrink-0 items-center gap-2 rounded-lg", FOCUS_RING)}>
            <BrandMark className="size-10" />
            <span className="leading-tight">
              <span className="block text-xl font-bold text-gray-900">
                Hearty<span className="text-teal-700">Bridge</span>
              </span>
              <span className="block text-[11px] font-semibold tracking-wide text-brand-coral">
                {COMPANY.tagline}
              </span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav aria-label="Navigasi utama" className="hidden items-center gap-1 lg:flex">
            {navigation.map((item) => {
              const isActive = activeNav === item.id;
              return (
                <Link
                  key={item.id}
                  href={item.href}
                  aria-current={isActive ? "location" : undefined}
                  className={cn(
                    "inline-flex min-h-11 items-center rounded-lg px-3 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-brand-coral-tint text-brand-coral"
                      : "text-gray-600 hover:bg-gray-100 hover:text-gray-900",
                    FOCUS_RING
                  )}
                >
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* Desktop actions */}
          <div className="hidden items-center gap-2 lg:flex">
            <a
              href={whatsappUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                "inline-flex min-h-11 items-center gap-2 rounded-full bg-brand-coral px-4 text-sm font-semibold text-white shadow-sm shadow-brand-coral/25 transition-colors hover:bg-[#a81a2d]",
                FOCUS_RING
              )}
            >
              <WhatsAppIcon className="size-4" />
              Konsultasi
              <span className="sr-only">(WhatsApp, membuka tab baru)</span>
            </a>
            {user ? (
              <>
                <Link
                  href="/dashboard"
                  className={cn(
                    "inline-flex min-h-11 items-center gap-2 rounded-full px-3 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100",
                    FOCUS_RING
                  )}
                >
                  <span
                    aria-hidden="true"
                    className="flex size-7 items-center justify-center rounded-full bg-teal-100 text-xs font-bold text-teal-700"
                  >
                    {user.name.charAt(0).toUpperCase()}
                  </span>
                  <span className="max-w-[120px] truncate">{user.name}</span>
                </Link>
                <button
                  type="button"
                  onClick={logout}
                  className={cn(
                    "inline-flex min-h-11 items-center gap-1.5 rounded-full border border-gray-300 bg-white px-4 text-sm font-medium text-gray-600 transition-colors hover:border-red-200 hover:text-red-600",
                    FOCUS_RING
                  )}
                >
                  <LogOutIcon className="size-4" aria-hidden="true" />
                  Keluar
                </button>
              </>
            ) : (
              <Link
                href="/auth/login"
                className={cn(
                  "inline-flex min-h-11 items-center rounded-full border border-gray-300 bg-white px-4 text-sm font-semibold text-gray-800 transition-colors hover:border-brand-coral hover:text-brand-coral",
                  FOCUS_RING
                )}
              >
                Masuk
              </Link>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            ref={toggleRef}
            type="button"
            className={cn(
              "inline-flex size-11 items-center justify-center rounded-lg text-gray-700 transition-colors hover:bg-gray-100 hover:text-gray-900 lg:hidden",
              FOCUS_RING
            )}
            aria-label={isMenuOpen ? "Tutup menu" : "Buka menu"}
            aria-expanded={isMenuOpen}
            aria-controls="mobile-menu"
            onClick={() => setIsMenuOpen((v) => !v)}
          >
            {isMenuOpen ? <XIcon className="size-5" aria-hidden="true" /> : <MenuIcon className="size-5" aria-hidden="true" />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Menu: drops below the bar so the header stays 4rem. */}
      <div
        id="mobile-menu"
        hidden={!isMenuOpen}
        className="absolute inset-x-0 top-full max-h-[calc(100svh-4rem)] overflow-y-auto border-b border-gray-200 bg-white shadow-lg lg:hidden"
      >
        <nav aria-label="Navigasi utama (seluler)" className="mx-auto max-w-7xl px-4 py-3 sm:px-6">
          <ul className="space-y-1">
            {navigation.map((item) => {
              const isActive = activeNav === item.id;
              return (
                <li key={item.id}>
                  <Link
                    href={item.href}
                    aria-current={isActive ? "location" : undefined}
                    onClick={closeMenu}
                    className={cn(
                      "flex min-h-11 items-center rounded-lg px-3 text-base font-medium transition-colors",
                      isActive
                        ? "bg-brand-coral-tint text-brand-coral"
                        : "text-gray-700 hover:bg-teal-50 hover:text-teal-700",
                      FOCUS_RING
                    )}
                  >
                    {item.name}
                  </Link>
                </li>
              );
            })}
          </ul>

          <div className="mt-3 space-y-2 border-t border-gray-100 pt-3">
            <a
              href={whatsappUrl()}
              target="_blank"
              rel="noopener noreferrer"
              onClick={closeMenu}
              className={cn(
                "flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-brand-coral px-5 text-base font-semibold text-white shadow-sm transition-colors hover:bg-[#a81a2d]",
                FOCUS_RING
              )}
            >
              <WhatsAppIcon className="size-5" />
              Konsultasi via WhatsApp
              <span className="sr-only">(membuka tab baru)</span>
            </a>
            {user ? (
              <>
                <Link
                  href="/dashboard"
                  onClick={closeMenu}
                  className={cn(
                    "flex min-h-11 w-full items-center gap-2 rounded-full px-4 text-base font-medium text-gray-700 transition-colors hover:bg-gray-100",
                    FOCUS_RING
                  )}
                >
                  <LayoutDashboardIcon className="size-4" aria-hidden="true" />
                  <span className="truncate">{user.name}</span>
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    logout();
                    closeMenu();
                  }}
                  className={cn(
                    "flex min-h-11 w-full items-center gap-2 rounded-full border border-gray-300 bg-white px-4 text-base font-medium text-gray-600 transition-colors hover:text-red-600",
                    FOCUS_RING
                  )}
                >
                  <LogOutIcon className="size-4" aria-hidden="true" />
                  Keluar
                </button>
              </>
            ) : (
              <Link
                href="/auth/login"
                onClick={closeMenu}
                className={cn(
                  "flex min-h-12 w-full items-center justify-center rounded-full border border-gray-300 bg-white px-5 text-base font-semibold text-gray-800 transition-colors hover:border-brand-coral hover:text-brand-coral",
                  FOCUS_RING
                )}
              >
                Masuk
              </Link>
            )}
          </div>
        </nav>
      </div>
    </header>
  );
}
