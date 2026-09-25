"use client";

import Link from "next/link";
import { useSyncExternalStore, type SVGProps } from "react";
import { usePathname } from "next/navigation";
import { CalendarCheckIcon, ClockIcon, MailIcon, MapPinIcon, NavigationIcon } from "lucide-react";
import { InstagramIcon } from "@/components/icons/instagram-icon";
import { WhatsAppIcon } from "@/components/icons/whatsapp-icon";
import { BrandMark } from "@/components/layout/brand-mark";
import {
  COMPANY,
  CONTACT,
  CONTACT_COPY,
  HERO,
  OPENING_HOURS,
  SOCIALS,
  formatHour,
  whatsappUrl,
} from "@/lib/content/landing";
import { cn } from "@/lib/utils";

function TikTokIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M16.6 5.82A4.28 4.28 0 0 1 15.54 3h-3.09v12.4a2.59 2.59 0 0 1-2.59 2.5 2.6 2.6 0 0 1-2.6-2.6 2.6 2.6 0 0 1 3.35-2.49V9.66a5.73 5.73 0 0 0-.75-.05A5.66 5.66 0 0 0 4.2 15.3 5.66 5.66 0 0 0 9.86 21a5.66 5.66 0 0 0 5.67-5.67V9.01a7.3 7.3 0 0 0 4.27 1.37V7.3a4.3 4.3 0 0 1-3.2-1.48z" />
    </svg>
  );
}

function FacebookIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M13.5 21v-7.5h2.53l.38-2.94H13.5V8.69c0-.85.24-1.43 1.46-1.43h1.55V4.63a20.8 20.8 0 0 0-2.27-.12c-2.24 0-3.78 1.37-3.78 3.89v2.16H7.93v2.94h2.53V21h3.04z" />
    </svg>
  );
}

const SOCIAL_ICONS = {
  instagram: InstagramIcon,
  tiktok: TikTokIcon,
  facebook: FacebookIcon,
} as const;

const QUICK_LINKS = [
  { name: "Layanan", href: "/#services" },
  { name: "Alur layanan", href: "/#alur" },
  { name: "Tentang kami", href: "/#about" },
  { name: "FAQ", href: "/#faq" },
  { name: "Kontak & lokasi", href: "/#contact" },
] as const;

const FOCUS_RING =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-coral focus-visible:ring-offset-2 focus-visible:ring-offset-gray-50";

const LINK = cn(
  "inline-flex min-h-11 items-center gap-2.5 rounded-md text-sm text-gray-600 transition-colors hover:text-brand-coral",
  FOCUS_RING
);

const HEADING = "text-sm font-semibold uppercase tracking-wider text-gray-900";

// The current year is read on the client only: `/` and the other static
// routes are prerendered, so a year baked into the HTML would go stale (and
// mismatch on hydration) from 1 January until the next deploy.
const subscribeNoop = () => () => {};
const getYear = () => new Date().getFullYear();
const getServerYear = () => null;

function NewTab() {
  return <span className="sr-only">(membuka tab baru)</span>;
}

export function Footer() {
  const pathname = usePathname();
  const currentYear = useSyncExternalStore<number | null>(subscribeNoop, getYear, getServerYear);

  // Don't show public footer on dashboard pages
  if (pathname?.startsWith("/dashboard")) return null;

  const foundedYear = COMPANY.foundedAt.slice(0, 4);
  const yearRange =
    currentYear !== null && currentYear > Number(foundedYear) ? `${foundedYear}–${currentYear}` : foundedYear;

  return (
    <footer className="border-t border-gray-200 bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-16">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-12 lg:gap-8">
          {/* Brand */}
          <div className="sm:col-span-2 lg:col-span-4">
            <Link href="/" className={cn("inline-flex items-center gap-3 rounded-lg", FOCUS_RING)}>
              <BrandMark className="size-12" />
              <span className="leading-tight">
                <span className="block text-lg font-bold text-gray-900">{COMPANY.shortName}</span>
                <span className="block text-xs font-semibold tracking-wide text-brand-coral">{COMPANY.tagline}</span>
              </span>
            </Link>
            <p className="mt-4 max-w-sm text-sm font-medium text-gray-900">{COMPANY.name}</p>
            <p className="mt-1 max-w-sm text-sm text-gray-600 text-pretty">{HERO.headlineLines.join(" ")}.</p>

            <ul role="list" className="mt-5 flex flex-wrap items-center gap-2" aria-label="Media sosial">
              {SOCIALS.map((social) => {
                const Icon = SOCIAL_ICONS[social.id];
                const inner = (
                  <>
                    <Icon className="size-4 shrink-0" aria-hidden="true" />
                    {social.url ? (
                      <span className="truncate">{social.handle}</span>
                    ) : (
                      <span>
                        {social.label}: {social.handle}
                      </span>
                    )}
                  </>
                );
                return (
                  <li key={social.id} className="max-w-full">
                    {social.url ? (
                      <a
                        href={social.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={`${social.label} ${social.handle} (membuka tab baru)`}
                        className={cn(
                          "inline-flex min-h-11 max-w-full items-center gap-2 rounded-full border border-gray-200 bg-white px-4 text-sm font-medium text-gray-700 transition-colors hover:border-brand-coral hover:text-brand-coral",
                          FOCUS_RING
                        )}
                      >
                        {inner}
                      </a>
                    ) : (
                      <span className="inline-flex min-h-11 max-w-full items-center gap-2 px-1 py-1 text-sm text-gray-600">
                        {inner}
                      </span>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Contact */}
          <div className="lg:col-span-3">
            <h2 className={HEADING}>Kontak</h2>
            <ul role="list" className="mt-3 space-y-0.5">
              <li>
                <a href={whatsappUrl()} target="_blank" rel="noopener noreferrer" className={LINK}>
                  <WhatsAppIcon className="size-4 shrink-0 text-teal-700" />
                  <span>
                    <span className="sr-only">{CONTACT_COPY.whatsappLabel}: </span>
                    {CONTACT.whatsappDisplay}
                  </span>
                  <NewTab />
                </a>
              </li>
              <li>
                <a href={`mailto:${CONTACT.email}`} className={cn(LINK, "break-all")}>
                  <MailIcon className="size-4 shrink-0 text-teal-700" aria-hidden="true" />
                  <span>
                    <span className="sr-only">{CONTACT_COPY.emailLabel}: </span>
                    {CONTACT.email}
                  </span>
                </a>
              </li>
              <li>
                <a href={CONTACT.bookingUrl} target="_blank" rel="noopener noreferrer" className={LINK}>
                  <CalendarCheckIcon className="size-4 shrink-0 text-teal-700" aria-hidden="true" />
                  <span>
                    {CONTACT_COPY.bookingLabel}: {CONTACT.bookingLabel}
                  </span>
                  <NewTab />
                </a>
              </li>
            </ul>
            <address className="mt-3 flex gap-2.5 text-sm not-italic leading-relaxed text-gray-600">
              <MapPinIcon className="mt-0.5 size-4 shrink-0 text-teal-700" aria-hidden="true" />
              <span>
                <span className="sr-only">{CONTACT_COPY.addressLabel}: </span>
                {CONTACT.address.full}
              </span>
            </address>
            <a
              href={CONTACT.mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(LINK, "font-semibold text-brand-coral hover:text-[#a81a2d]")}
            >
              <NavigationIcon className="size-4 shrink-0" aria-hidden="true" />
              {CONTACT_COPY.mapsCta}
              <NewTab />
            </a>
          </div>

          {/* Opening hours */}
          <div className="lg:col-span-2">
            <h2 className={HEADING}>{CONTACT_COPY.hoursLabel}</h2>
            <dl className="mt-4 space-y-3 text-sm">
              {OPENING_HOURS.map((slot) => (
                <div key={slot.label}>
                  <dt className="font-medium text-gray-900">{slot.label}</dt>
                  <dd className="mt-0.5 flex items-center gap-1.5 text-gray-600">
                    <ClockIcon className="size-3.5 shrink-0 text-teal-700" aria-hidden="true" />
                    {formatHour(slot.open)} – {formatHour(slot.close)} WIB
                  </dd>
                </div>
              ))}
            </dl>
          </div>

          {/* Quick links */}
          <nav aria-label="Tautan cepat" className="lg:col-span-3">
            <h2 className={HEADING}>Tautan cepat</h2>
            <ul role="list" className="mt-3 grid grid-cols-2 gap-x-4 sm:grid-cols-1">
              {QUICK_LINKS.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className={LINK}>
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
            <div className="mt-5 rounded-2xl border border-gray-200 bg-white p-4">
              <p className="text-sm text-gray-600">{HERO.loginHint}</p>
              <Link
                href="/auth/login"
                className={cn(
                  "mt-1 inline-flex min-h-11 items-center rounded-md text-sm font-semibold text-teal-700 transition-colors hover:text-teal-800",
                  FOCUS_RING
                )}
              >
                {HERO.loginCta} →
              </Link>
            </div>
          </nav>
        </div>

        <div className="mt-12 flex flex-col gap-3 border-t border-gray-200 pt-8 text-sm text-gray-500 md:flex-row md:items-center md:justify-between">
          <p className="text-pretty">
            © {yearRange} {COMPANY.name} – di bawah naungan {COMPANY.parent.name}
          </p>
          <p className="text-xs font-semibold tracking-wide text-brand-coral">{COMPANY.tagline}</p>
        </div>
      </div>
    </footer>
  );
}
