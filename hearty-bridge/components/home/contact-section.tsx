"use client";

import { useMemo, useSyncExternalStore, type ComponentType, type ReactNode, type SVGProps } from "react";
import {
  ArrowUpRightIcon,
  CalendarCheckIcon,
  ClockIcon,
  HeartIcon,
  MailIcon,
  MapPinIcon,
  MessageSquareTextIcon,
  NavigationIcon,
} from "lucide-react";
import { BlurFade } from "@/components/magicui/blur-fade";
import { SectionHeading } from "@/components/home/section-heading";
import { useInquiry } from "@/components/home/inquiry-context";
import { InstagramIcon } from "@/components/icons/instagram-icon";
import { WhatsAppIcon } from "@/components/icons/whatsapp-icon";
import { CONTACT, CONTACT_COPY, OPENING_HOURS, SOCIALS, formatHour, whatsappUrl } from "@/lib/content/landing";
import { cn } from "@/lib/utils";
import { useReducedMotionLive } from "@/lib/hooks/use-reduced-motion";

const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-coral focus-visible:ring-offset-2";

// ── Opening status (Asia/Jakarta) ─────────────────────────────────────────

const DAY_NAMES = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"] as const;
const WEEKDAY_INDEX: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };

type HoursEntry = (typeof OPENING_HOURS)[number];

type OpenStatus =
  | { isOpen: true; day: number; closeAt: string }
  | { isOpen: false; day: number; reopenWhen: string; openAt: string };

function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

function hoursForDay(day: number): HoursEntry | null {
  return OPENING_HOURS.find((entry) => (entry.days as readonly number[]).includes(day)) ?? null;
}

// Days that appear in OPENING_HOURS are open; every other day (Minggu) is closed.
const CLOSED_DAYS = [0, 1, 2, 3, 4, 5, 6].filter((day) => hoursForDay(day) === null);

function jakartaClock(date: Date): { day: number; minutes: number } {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Jakarta",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const get = (type: Intl.DateTimeFormatPartTypes) => parts.find((p) => p.type === type)?.value ?? "";
  const hour = Number(get("hour")) % 24;
  const minute = Number(get("minute"));
  return { day: WEEKDAY_INDEX[get("weekday")] ?? date.getDay(), minutes: hour * 60 + minute };
}

function computeStatus(date: Date): OpenStatus {
  const { day, minutes } = jakartaClock(date);
  const today = hoursForDay(day);

  if (today && minutes >= toMinutes(today.open) && minutes < toMinutes(today.close)) {
    return { isOpen: true, day, closeAt: formatHour(today.close) };
  }
  if (today && minutes < toMinutes(today.open)) {
    return { isOpen: false, day, reopenWhen: "hari ini", openAt: formatHour(today.open) };
  }
  for (let offset = 1; offset <= 7; offset++) {
    const next = (day + offset) % 7;
    const entry = hoursForDay(next);
    if (entry) {
      return {
        isOpen: false,
        day,
        reopenWhen: offset === 1 ? "besok" : DAY_NAMES[next],
        openAt: formatHour(entry.open),
      };
    }
  }
  return { isOpen: false, day, reopenWhen: "", openAt: "" };
}

// The clock is an external store that ticks on each minute boundary (and when
// the tab becomes visible again, since background timers get throttled). The
// server snapshot is null, so SSR and hydration render the same placeholder and
// the live status only appears after mount.
function subscribeMinute(onChange: () => void) {
  let interval: number | undefined;
  const timeout = window.setTimeout(() => {
    onChange();
    interval = window.setInterval(onChange, 60_000);
  }, 60_000 - (Date.now() % 60_000) + 50);
  const onVisibility = () => {
    if (document.visibilityState === "visible") onChange();
  };
  document.addEventListener("visibilitychange", onVisibility);
  return () => {
    window.clearTimeout(timeout);
    if (interval !== undefined) window.clearInterval(interval);
    document.removeEventListener("visibilitychange", onVisibility);
  };
}

const getMinuteSnapshot = () => Math.floor(Date.now() / 60_000);
const getServerMinuteSnapshot = () => null;

function useOpenStatus(): OpenStatus | null {
  const minute = useSyncExternalStore<number | null>(subscribeMinute, getMinuteSnapshot, getServerMinuteSnapshot);
  return useMemo(() => (minute === null ? null : computeStatus(new Date(minute * 60_000))), [minute]);
}

// ── Small brand icons (not in lucide) ─────────────────────────────────────

function TikTokIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M12.53.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
    </svg>
  );
}

function FacebookIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M9.1 23.69v-7.98H6.63v-3.67H9.1v-1.58c0-4.09 1.85-5.98 5.86-5.98.4 0 .96.04 1.47.1.39.05.77.11 1.14.2v3.32l-.65-.03c-.24-.01-.49-.01-.73-.01-.71 0-1.26.1-1.68.31-.28.14-.52.36-.68.62-.26.42-.37 1-.37 1.75v1.3h3.92l-.39 2.1-.29 1.57h-3.25v8.24C19.4 23.24 24 18.18 24 12.04c0-6.63-5.37-12-12-12s-12 5.37-12 12c0 5.63 3.87 10.35 9.1 11.65Z" />
    </svg>
  );
}

const SOCIAL_ICONS: Record<(typeof SOCIALS)[number]["id"], ComponentType<SVGProps<SVGSVGElement>>> = {
  instagram: InstagramIcon,
  tiktok: TikTokIcon,
  facebook: FacebookIcon,
};

// ── Pieces ────────────────────────────────────────────────────────────────

function NewTabHint() {
  return <span className="sr-only"> (membuka tab baru)</span>;
}

interface ContactCardProps {
  href: string;
  external?: boolean;
  icon: ReactNode;
  tone?: "coral" | "teal";
  label: string;
  value: ReactNode;
  hint?: string;
  className?: string;
  valueClassName?: string;
}

function ContactCard({
  href,
  external,
  icon,
  tone = "coral",
  label,
  value,
  hint,
  className,
  valueClassName,
}: ContactCardProps) {
  return (
    <a
      href={href}
      {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      className={cn(
        "group flex min-h-[5.5rem] items-center gap-3.5 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm transition-[border-color,box-shadow,transform] duration-300 hover:border-brand-coral-light hover:shadow-md motion-safe:hover:-translate-y-0.5 sm:p-5",
        focusRing,
        className
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          "grid size-12 shrink-0 place-items-center rounded-2xl",
          tone === "coral" ? "bg-brand-coral-tint text-brand-coral" : "bg-teal-50 text-teal-700"
        )}
      >
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-medium text-gray-500">{label}</span>
        <span
          className={cn(
            "mt-0.5 block text-base font-semibold text-gray-900 [overflow-wrap:anywhere] sm:text-lg",
            valueClassName
          )}
        >
          {value}
        </span>
        {hint && <span className="mt-0.5 block text-sm text-gray-600">{hint}</span>}
      </span>
      <ArrowUpRightIcon
        aria-hidden="true"
        className="size-4 shrink-0 text-gray-400 transition-colors group-hover:text-brand-coral sm:size-5"
      />
      {external && <NewTabHint />}
    </a>
  );
}

// Illustrated street map — decorative, no external tiles (CSP blocks map
// iframes and we don't hotlink map images).
function MapIllustration() {
  return (
    <svg
      viewBox="0 0 400 240"
      preserveAspectRatio="xMidYMid slice"
      className="absolute inset-0 size-full"
      aria-hidden="true"
      focusable="false"
    >
      <rect width="400" height="240" fill="#f0fdfa" />
      {/* park + pond */}
      <rect x="18" y="16" width="118" height="78" rx="18" fill="#ccfbf1" />
      <circle cx="46" cy="44" r="11" fill="#99f6e4" />
      <circle cx="72" cy="62" r="14" fill="#99f6e4" />
      <circle cx="104" cy="40" r="9" fill="#99f6e4" />
      <ellipse cx="338" cy="206" rx="46" ry="22" fill="#b6ece6" />
      {/* blocks */}
      <g fill="#ffffff" stroke="#e5e7eb" strokeWidth="1.5">
        <rect x="168" y="18" width="62" height="44" rx="10" />
        <rect x="244" y="18" width="58" height="44" rx="10" />
        <rect x="316" y="18" width="68" height="70" rx="10" />
        <rect x="18" y="134" width="70" height="44" rx="10" />
        <rect x="18" y="192" width="70" height="34" rx="10" />
        <rect x="102" y="134" width="68" height="92" rx="10" />
        <rect x="244" y="134" width="58" height="42" rx="10" />
      </g>
      <rect x="168" y="134" width="62" height="42" rx="10" fill="#fbe7ea" stroke="#f4a3ac" strokeWidth="1.5" />
      {/* roads: grey edge underlay, then white surface */}
      <g fill="none" strokeLinecap="round">
        <path d="M-10 114 H410" stroke="#e2e8f0" strokeWidth="26" />
        <path d="M152 -10 V250" stroke="#e2e8f0" strokeWidth="20" />
        <path d="M236 -10 V250" stroke="#e2e8f0" strokeWidth="14" />
        <path d="M310 114 C 330 150, 300 180, 318 250" stroke="#e2e8f0" strokeWidth="16" />
        <path d="M-10 114 H410" stroke="#ffffff" strokeWidth="20" />
        <path d="M152 -10 V250" stroke="#ffffff" strokeWidth="14" />
        <path d="M236 -10 V250" stroke="#ffffff" strokeWidth="9" />
        <path d="M310 114 C 330 150, 300 180, 318 250" stroke="#ffffff" strokeWidth="10" />
        <path d="M-10 114 H410" stroke="#cbd5e1" strokeWidth="1.5" strokeDasharray="10 10" />
      </g>
      {/* route from the main road to the center */}
      <path
        d="M152 114 H199 V150"
        fill="none"
        stroke="#c41e34"
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray="2 8"
      />
    </svg>
  );
}

function MapCard() {
  return (
    // Same destination as the "Buka di Google Maps" button next to it, so it is
    // taken out of the tab order and hidden from screen readers to avoid a
    // duplicate stop; pointer users can still click the whole map.
    <a
      href={CONTACT.mapsUrl}
      target="_blank"
      rel="noopener noreferrer"
      tabIndex={-1}
      aria-hidden="true"
      className="group relative block min-h-48 overflow-hidden bg-teal-50 sm:min-h-56 md:min-h-full"
    >
      <MapIllustration />
      <div className="absolute inset-0 flex flex-col items-center justify-center px-4">
        {/* Teardrop pin: a square with one sharp corner, turned 45° so the
            tip points down (~12px below the box); pulse + ground shadow sit on the tip. */}
        <span className="relative block size-14 transition-transform duration-300 motion-safe:group-hover:-translate-y-1">
          <span className="absolute left-1/2 top-[calc(100%+12px)] size-8 -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand-coral/25 motion-safe:animate-ping" />
          <span className="absolute left-1/2 top-[calc(100%+12px)] h-2 w-7 -translate-x-1/2 -translate-y-1/2 rounded-full bg-gray-900/15 blur-[2px]" />
          <span className="relative grid size-14 rotate-45 place-items-center rounded-full rounded-br-none bg-brand-coral text-white shadow-lg shadow-brand-coral/30">
            <HeartIcon className="size-6 -rotate-45 fill-current" />
          </span>
        </span>
        <span className="mt-8 max-w-[90%] rounded-full bg-white/95 px-3.5 py-1.5 text-center text-xs font-semibold text-gray-800 shadow-md sm:text-sm">
          {CONTACT.address.street}
        </span>
      </div>
      <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-white/95 px-2.5 py-1 text-xs font-medium text-gray-700 shadow-sm">
        Google Maps
        <ArrowUpRightIcon className="size-3.5" />
      </span>
    </a>
  );
}

function StatusBadge({ status }: { status: OpenStatus | null }) {
  if (!status) {
    return <span aria-hidden="true" className="block h-9 w-56 max-w-full rounded-full bg-teal-100/70 animate-pulse" />;
  }

  return (
    <p
      className={cn(
        "inline-flex max-w-full flex-wrap items-center gap-x-2 gap-y-0.5 rounded-full border bg-white px-3.5 py-1.5 text-sm shadow-sm",
        status.isOpen ? "border-teal-200 text-teal-800" : "border-brand-coral-light text-gray-700"
      )}
    >
      <span className="relative flex size-2.5 shrink-0" aria-hidden="true">
        {status.isOpen && <span className="absolute inset-0 rounded-full bg-teal-400 opacity-75 motion-safe:animate-ping" />}
        <span className={cn("relative size-2.5 rounded-full", status.isOpen ? "bg-teal-500" : "bg-brand-coral")} />
      </span>
      <span className="font-semibold">{status.isOpen ? "Buka sekarang" : "Tutup sekarang"}</span>
      <span aria-hidden="true" className="text-gray-400">
        ·
      </span>
      <span>
        {status.isOpen
          ? `tutup pukul ${status.closeAt}`
          : `buka lagi ${status.reopenWhen} pukul ${status.openAt}`}
      </span>
    </p>
  );
}

// Monday-first strip of the week built from OPENING_HOURS. It repeats what the
// list below says, so it is hidden from assistive tech.
const WEEK_ORDER = [1, 2, 3, 4, 5, 6, 0];

function WeekStrip({ today }: { today: number | null }) {
  return (
    <ol aria-hidden="true" className="mt-5 grid grid-cols-7 gap-1.5">
      {WEEK_ORDER.map((day) => {
        const isOpenDay = hoursForDay(day) !== null;
        const isToday = today === day;
        return (
          <li
            key={day}
            className={cn(
              "flex flex-col items-center gap-1.5 rounded-xl py-2 text-xs font-semibold transition-colors",
              isToday
                ? "bg-teal-700 text-white shadow-sm"
                : isOpenDay
                  ? "bg-white text-teal-800"
                  : "border border-dashed border-gray-300 text-gray-500"
            )}
          >
            {DAY_NAMES[day].slice(0, 3)}
            <span
              className={cn(
                "size-1.5 rounded-full",
                isToday ? "bg-white" : isOpenDay ? "bg-teal-500" : "bg-gray-300"
              )}
            />
          </li>
        );
      })}
    </ol>
  );
}

function HoursRow({ label, value, isToday, muted }: { label: string; value: string; isToday: boolean; muted?: boolean }) {
  return (
    <li
      aria-current={isToday ? "date" : undefined}
      className={cn(
        "relative flex flex-wrap items-center justify-between gap-x-4 gap-y-1 rounded-xl px-3 py-3",
        isToday && "bg-white shadow-sm ring-1 ring-teal-100"
      )}
    >
      {/* "Today" sits on the row's top edge like a tab so it never pushes the hours onto a second line. */}
      {isToday && (
        <span className="absolute -top-2.5 left-3 rounded-full bg-teal-700 px-2 py-1 text-[11px] font-semibold leading-none text-white">
          Hari ini
        </span>
      )}
      <span className="font-medium text-gray-900">{label}</span>
      <span className={cn("tabular-nums", muted ? "text-gray-500" : "font-semibold text-gray-900")}>{value}</span>
    </li>
  );
}

// ── Section ───────────────────────────────────────────────────────────────

// If the email must wrap in a narrow card, let it break after "@" instead of
// splitting "gmail.com".
const [emailUser, emailDomain] = CONTACT.email.split("@");
const emailWithBreak = (
  <>
    {emailUser}@<wbr />
    {emailDomain}
  </>
);

export function ContactSection() {
  const reduce = useReducedMotionLive();
  const status = useOpenStatus();
  const { open } = useInquiry();

  const reveal = (delay: number) => ({
    inView: !reduce,
    delay: reduce ? 0 : delay,
    duration: reduce ? 0 : 0.45,
  });

  return (
    <section id="contact" aria-labelledby="contact-title" className="bg-white py-20 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <SectionHeading
          eyebrow={CONTACT_COPY.eyebrow}
          title={CONTACT_COPY.title}
          subtitle={CONTACT_COPY.subtitle}
          titleId="contact-title"
        />

        <div className="mt-12 grid gap-6 lg:grid-cols-12 lg:gap-8">
          {/* Left: channels */}
          <div className="flex min-w-0 flex-col gap-4 lg:col-span-7">
            <BlurFade {...reveal(0.05)} className="grid gap-4 sm:grid-cols-2">
              <ContactCard
                href={whatsappUrl()}
                external
                icon={<WhatsAppIcon className="size-6" />}
                label={CONTACT_COPY.whatsappLabel}
                value={CONTACT.whatsappDisplay}
                hint="Kirim pesan kapan saja"
                className="sm:col-span-2"
              />
              <ContactCard
                href={`mailto:${CONTACT.email}`}
                icon={<MailIcon className="size-6" />}
                tone="teal"
                label={CONTACT_COPY.emailLabel}
                value={emailWithBreak}
                valueClassName="sm:text-base"
              />
              <ContactCard
                href={CONTACT.bookingUrl}
                external
                icon={<CalendarCheckIcon className="size-6" />}
                tone="teal"
                label={CONTACT_COPY.bookingLabel}
                value={CONTACT.bookingLabel}
              />
            </BlurFade>

            <BlurFade {...reveal(0.12)}>
              <div className="grid overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm md:grid-cols-2">
                <MapCard />
                <div className="flex flex-col gap-4 p-6 sm:p-7">
                  <div className="flex items-center gap-3">
                    <span
                      aria-hidden="true"
                      className="grid size-12 shrink-0 place-items-center rounded-2xl bg-brand-coral-tint text-brand-coral"
                    >
                      <MapPinIcon className="size-6" />
                    </span>
                    <h3 className="text-sm font-medium text-gray-500">{CONTACT_COPY.addressLabel}</h3>
                  </div>
                  <address className="font-semibold not-italic leading-relaxed text-gray-900 text-pretty">
                    {CONTACT.address.full}
                  </address>
                  <a
                    href={CONTACT.mapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cn(
                      "mt-auto inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full border border-brand-coral-light bg-brand-coral-tint px-5 font-semibold text-brand-coral transition-colors hover:border-brand-coral hover:bg-white sm:w-auto sm:self-start",
                      focusRing
                    )}
                  >
                    <NavigationIcon aria-hidden="true" className="size-4" />
                    {CONTACT_COPY.mapsCta}
                    <NewTabHint />
                  </a>
                </div>
              </div>
            </BlurFade>

            <BlurFade {...reveal(0.18)}>
              <div className="flex flex-col gap-3 rounded-2xl bg-gray-50 p-4 sm:flex-row sm:items-center sm:p-5">
                <h3 className="shrink-0 text-sm font-semibold text-gray-700 sm:pr-2">Ikuti kami</h3>
                <ul className="flex flex-wrap gap-2">
                  {SOCIALS.map((social) => {
                    const Icon = SOCIAL_ICONS[social.id];
                    const chip =
                      "inline-flex min-h-11 max-w-full items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium";
                    return (
                      <li key={social.id} className="max-w-full">
                        {social.url ? (
                          <a
                            href={social.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={cn(
                              chip,
                              "border-gray-200 bg-white text-gray-800 transition-colors hover:border-brand-coral-light hover:text-brand-coral",
                              focusRing
                            )}
                          >
                            <Icon aria-hidden="true" className="size-4 shrink-0" />
                            <span className="sr-only">{social.label} </span>
                            {social.handle}
                            <NewTabHint />
                          </a>
                        ) : (
                          <span className={cn(chip, "border-dashed border-gray-300 bg-transparent text-gray-600")}>
                            <Icon aria-hidden="true" className="size-4 shrink-0" />
                            <span className="sr-only">{social.label}: </span>
                            <span className="min-w-0 [overflow-wrap:anywhere]">{social.handle}</span>
                          </span>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </div>
            </BlurFade>
          </div>

          {/* Right: hours + message */}
          <div className="flex min-w-0 flex-col gap-4 lg:col-span-5">
            <BlurFade {...reveal(0.1)} className="flex-1">
              <div className="flex h-full flex-col rounded-3xl border border-teal-100 bg-teal-50/60 p-5 sm:p-7">
                <div className="flex items-center gap-3">
                  <span
                    aria-hidden="true"
                    className="grid size-12 shrink-0 place-items-center rounded-2xl bg-white text-teal-700 shadow-sm"
                  >
                    <ClockIcon className="size-6" />
                  </span>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{CONTACT_COPY.hoursLabel}</h3>
                    <p className="text-sm text-gray-600">Waktu Indonesia Barat (WIB)</p>
                  </div>
                </div>

                <div className="mt-5 min-h-9">
                  <StatusBadge status={status} />
                </div>

                <WeekStrip today={status?.day ?? null} />

                <ul className="mt-6 space-y-1">
                  {OPENING_HOURS.map((entry) => (
                    <HoursRow
                      key={entry.label}
                      label={entry.label}
                      value={`${formatHour(entry.open)} – ${formatHour(entry.close)}`}
                      isToday={status !== null && (entry.days as readonly number[]).includes(status.day)}
                    />
                  ))}
                  {CLOSED_DAYS.length > 0 && (
                    <HoursRow
                      label={CLOSED_DAYS.map((day) => DAY_NAMES[day]).join(", ")}
                      value="Tutup"
                      muted
                      isToday={status !== null && CLOSED_DAYS.includes(status.day)}
                    />
                  )}
                </ul>
                <p className="mt-3 px-3 text-sm text-gray-600">{CONTACT_COPY.hoursNote}</p>

                {/* On lg the card stretches to the left column's height; this
                    block rides to the bottom so the spare space sits above it. */}
                <div className="mt-6 flex flex-col gap-4 lg:mt-auto lg:pt-6">
                  <p className="flex items-start gap-2.5 rounded-2xl bg-white/80 p-4 text-sm leading-relaxed text-gray-700">
                    <WhatsAppIcon className="mt-0.5 size-4 shrink-0 text-teal-700" />
                    <span>Pesan WhatsApp bisa dikirim kapan saja, termasuk di luar jam operasional.</span>
                  </p>
                  <button
                    type="button"
                    onClick={() => open({ kind: "general" })}
                    className={cn(
                      "inline-flex min-h-14 w-full items-center justify-center gap-2.5 rounded-2xl bg-brand-coral px-6 text-base font-semibold text-white shadow-lg shadow-brand-coral/20 transition-colors hover:bg-[#a8182c]",
                      focusRing
                    )}
                  >
                    <MessageSquareTextIcon aria-hidden="true" className="size-5" />
                    {CONTACT_COPY.inquiryCta}
                  </button>
                </div>
              </div>
            </BlurFade>
          </div>
        </div>
      </div>
    </section>
  );
}
