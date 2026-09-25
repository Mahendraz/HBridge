"use client";

import { useCallback, useRef, useSyncExternalStore, type CSSProperties, type KeyboardEvent } from "react";
import { AnimatePresence, LayoutGroup, motion, type Variants } from "motion/react";
import { ArrowRight, CircleCheck } from "lucide-react";
import { SectionHeading } from "@/components/home/section-heading";
import { useInquiry } from "@/components/home/inquiry-context";
import { SERVICE_ICONS } from "@/components/home/services-marquee";
import { WhatsAppIcon } from "@/components/icons/whatsapp-icon";
import { useMagnetic } from "@/lib/hooks/use-magnetic";
import { cn } from "@/lib/utils";
import {
  SERVICES,
  SERVICES_COPY,
  serviceInquiryName,
  whatsappText,
  whatsappUrl,
  type Service,
  type ServiceId,
} from "@/lib/content/landing";
import { useReducedMotionLive, useReducedMotionSafe } from "@/lib/hooks/use-reduced-motion";

const PANEL_ID = "services-panel";
const tabId = (id: ServiceId) => `services-tab-${id}`;

const EASE_OUT: [number, number, number, number] = [0.16, 1, 0.3, 1];

// C0 + C6: old panel leaves (fade, lift, soften), then the new one settles in.
const PANEL_VARIANTS: Variants = {
  initial: { opacity: 0, y: 8, filter: "blur(4px)" },
  animate: { opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: 0.45, ease: EASE_OUT } },
  exit: { opacity: 0, y: -8, filter: "blur(4px)", transition: { duration: 0.25, ease: "easeIn" } },
};

// ── lg breakpoint (drives aria-orientation only; layout is pure CSS) ──────

const LG_QUERY = "(min-width: 1024px)";

function subscribeLg(onChange: () => void) {
  const mql = window.matchMedia(LG_QUERY);
  mql.addEventListener("change", onChange);
  return () => mql.removeEventListener("change", onChange);
}

function useIsDesktop(): boolean {
  return useSyncExternalStore(
    subscribeLg,
    () => window.matchMedia(LG_QUERY).matches,
    () => false
  );
}

// ── D5: aquatic bubbles (keyframes `hb-bubble-rise` live in globals.css) ──

// Deterministic so server and client render the same markup.
// left: % of panel width, size: px, duration/delay: s, drift: px sideways
// sway, rest: % from bottom when frozen under reduced motion.
const BUBBLES = [
  { left: 5, size: 14, duration: 9, delay: -1, drift: 10, rest: 12 },
  { left: 13, size: 22, duration: 12, delay: -6, drift: -12, rest: 48 },
  { left: 21, size: 10, duration: 8, delay: -3.5, drift: 8, rest: 26 },
  { left: 29, size: 18, duration: 11, delay: -8, drift: 14, rest: 70 },
  { left: 38, size: 12, duration: 9.5, delay: -2, drift: -8, rest: 8 },
  { left: 47, size: 26, duration: 14, delay: -10, drift: 12, rest: 36 },
  { left: 56, size: 9, duration: 7.5, delay: -5, drift: -6, rest: 60 },
  { left: 64, size: 16, duration: 10.5, delay: -0.5, drift: 10, rest: 18 },
  { left: 72, size: 20, duration: 13, delay: -7, drift: -14, rest: 52 },
  { left: 80, size: 11, duration: 8.5, delay: -4, drift: 6, rest: 30 },
  { left: 87, size: 15, duration: 11.5, delay: -9, drift: -10, rest: 78 },
  { left: 93, size: 8, duration: 7, delay: -2.5, drift: 5, rest: 14 },
] as const;

const BUBBLE_CLASS =
  "absolute rounded-full border border-teal-300/60 bg-[radial-gradient(circle_at_32%_30%,rgba(255,255,255,0.95),rgba(204,251,241,0.55)_45%,rgba(94,234,212,0.18)_100%)]";

function AquaticBubbles({ reduce }: { reduce: boolean }) {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden [container-type:size]">
      <div className="absolute inset-x-0 bottom-0 h-2/3 bg-linear-to-t from-teal-50 via-teal-50/50 to-transparent" />
      {BUBBLES.map((b, i) => {
        const style: CSSProperties & Record<"--bubble-drift", string> = reduce
          ? {
              left: `${b.left}%`,
              bottom: `${b.rest}%`,
              width: b.size,
              height: b.size,
              opacity: 0.55,
              "--bubble-drift": "0px",
            }
          : {
              left: `${b.left}%`,
              bottom: -b.size - 8,
              width: b.size,
              height: b.size,
              opacity: 0,
              animation: `hb-bubble-rise ${b.duration}s cubic-bezier(0.45, 0, 0.55, 1) ${b.delay}s infinite`,
              "--bubble-drift": `${b.drift}px`,
            };
        return <span key={i} className={BUBBLE_CLASS} style={style} />;
      })}
    </div>
  );
}

// Homecare: quiet dashed "service radius" rings around a home dot.
function HomecareRings() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute -bottom-28 -right-28 size-80 sm:size-96">
      <svg viewBox="0 0 200 200" className="size-full text-teal-200">
        <circle cx="100" cy="100" r="96" fill="none" stroke="currentColor" strokeWidth="1.2" strokeDasharray="3 7" />
        <circle cx="100" cy="100" r="68" fill="none" stroke="currentColor" strokeWidth="1.2" strokeDasharray="3 6" />
        <circle cx="100" cy="100" r="40" fill="none" stroke="currentColor" strokeWidth="1.2" strokeDasharray="3 5" />
        <circle cx="100" cy="100" r="6" className="fill-brand-coral-light" />
      </svg>
    </div>
  );
}

// ── Detail panel pieces ──────────────────────────────────────────────────

const FOCUS_RING =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-coral focus-visible:ring-offset-2";

function InquiryButton({ serviceId }: { serviceId: ServiceId }) {
  const { open } = useInquiry();
  const magnetic = useMagnetic(6);

  return (
    <motion.button
      data-inline-cta
      type="button"
      onClick={() => open({ kind: "service", serviceId })}
      style={magnetic.style}
      {...magnetic.handlers}
      className={cn(
        "inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-brand-coral px-6 text-base font-semibold text-white",
        "shadow-lg shadow-brand-coral/20 transition-colors hover:bg-[#a8182c]",
        FOCUS_RING
      )}
    >
      {SERVICES_COPY.inquiryCta}
      <ArrowRight aria-hidden="true" className="size-5" />
    </motion.button>
  );
}

function ServiceDetail({ service, index }: { service: Service; index: number }) {
  const Icon = SERVICE_ICONS[service.id];
  const isAquatic = service.id === "aquatic";
  const counter = `${String(index + 1).padStart(2, "0")} / ${String(SERVICES.length).padStart(2, "0")}`;

  return (
    <>
      <div className="flex items-start justify-between gap-4">
        <span
          className={cn(
            "flex size-16 shrink-0 items-center justify-center rounded-2xl text-white shadow-lg sm:size-20",
            isAquatic ? "bg-teal-600 shadow-teal-600/20" : "bg-brand-coral shadow-brand-coral/20"
          )}
        >
          <Icon aria-hidden="true" className="size-8 sm:size-10" strokeWidth={1.75} />
        </span>
        <span aria-hidden="true" className="pt-1 text-sm font-semibold tabular-nums text-gray-600">
          {counter}
        </span>
      </div>

      <p className={cn("mt-6 text-sm font-semibold", isAquatic ? "text-teal-700" : "text-brand-coral")}>
        {service.short}
      </p>
      <h3 className="mt-1 text-2xl font-bold tracking-tight text-gray-900 text-balance sm:text-3xl">{service.name}</h3>
      <p className="mt-4 text-base leading-relaxed text-gray-600 text-pretty sm:text-lg">{service.description}</p>

      {service.details && service.details.length > 0 && (
        <ul className="mt-6 space-y-3">
          {service.details.map((detail) => (
            <li key={detail} className="flex gap-3 text-sm leading-relaxed text-gray-700 sm:text-base">
              <CircleCheck aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-teal-600" />
              <span className="text-pretty">{detail}</span>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-auto flex flex-col gap-2 pt-8 sm:flex-row sm:items-center sm:gap-6">
        <InquiryButton serviceId={service.id} />
        <a
          data-inline-cta
          href={whatsappUrl(whatsappText({ kind: "service", serviceName: serviceInquiryName(service) }))}
          target="_blank"
          rel="noopener noreferrer"
          className={cn(
            "inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-2 text-sm font-semibold text-teal-700",
            "underline-offset-4 transition-colors hover:text-teal-800 hover:underline sm:justify-start",
            FOCUS_RING
          )}
        >
          <WhatsAppIcon className="size-5" />
          {SERVICES_COPY.whatsappCta}
          <span className="sr-only"> {SERVICES_COPY.newTabHint}</span>
        </a>
      </div>
    </>
  );
}

// ── Section ──────────────────────────────────────────────────────────────

export function ServicesExplorer() {
  // `reduce` drives transitions; `reduceMarkup` (false until hydrated) picks
  // between the plain and animated panel markup, so SSR and hydration match.
  const reduce = useReducedMotionLive() ?? false;
  const reduceMarkup = useReducedMotionSafe();
  const isDesktop = useIsDesktop();
  // Selection lives in the inquiry context so the sticky CTA can ask about it.
  const { serviceFocus: selected, setServiceFocus: setSelected } = useInquiry();
  const rowRef = useRef<HTMLDivElement>(null);
  const tabRefs = useRef<Partial<Record<ServiceId, HTMLButtonElement | null>>>({});

  const selectedIndex = Math.max(
    0,
    SERVICES.findIndex((s) => s.id === selected)
  );
  const service = SERVICES[selectedIndex];

  const select = useCallback(
    (id: ServiceId, moveFocus = false) => {
      setSelected(id);
      const tab = tabRefs.current[id];
      const row = rowRef.current;
      if (!tab) return;

      // Mobile chip row scrolls on its own; keep the page still and only
      // bring the chip to the middle of the row.
      const rowScrolls = !!row && row.scrollWidth > row.clientWidth + 1;
      if (moveFocus) tab.focus({ preventScroll: rowScrolls });
      if (row && rowScrolls) {
        const left = tab.offsetLeft - (row.clientWidth - tab.offsetWidth) / 2;
        row.scrollTo({ left: Math.max(0, left), behavior: reduce ? "auto" : "smooth" });
      }
    },
    [reduce, setSelected]
  );

  const onTabKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const last = SERVICES.length - 1;
    let next: number;
    switch (e.key) {
      case "ArrowDown":
      case "ArrowRight":
        next = selectedIndex === last ? 0 : selectedIndex + 1;
        break;
      case "ArrowUp":
      case "ArrowLeft":
        next = selectedIndex === 0 ? last : selectedIndex - 1;
        break;
      case "Home":
        next = 0;
        break;
      case "End":
        next = last;
        break;
      default:
        return;
    }
    e.preventDefault();
    select(SERVICES[next].id, true);
  };

  const Decoration =
    service.id === "aquatic" ? (
      <AquaticBubbles reduce={reduce} />
    ) : service.id === "homecare" ? (
      <HomecareRings />
    ) : null;

  return (
    <section
      id="services"
      aria-labelledby="services-title"
      className="relative overflow-x-clip bg-gray-50 py-20 sm:py-24"
    >
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-32 top-10 size-80 rounded-full bg-brand-coral-tint opacity-70 blur-3xl" />
        <div className="absolute -right-32 bottom-0 size-96 rounded-full bg-teal-50 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
        <SectionHeading
          eyebrow={SERVICES_COPY.eyebrow}
          title={SERVICES_COPY.title}
          subtitle={SERVICES_COPY.subtitle}
          titleId="services-title"
        />

        <LayoutGroup id="services-explorer">
          <div className="mt-12 lg:mt-16 lg:grid lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-10">
            {/* Tablist: horizontal chip row (<lg) that scrolls inside the
                container's own gutter, vertical list (lg+). */}
            <motion.div
              ref={rowRef}
              layoutScroll
              role="tablist"
              aria-label={SERVICES_COPY.tablistLabel}
              aria-orientation={isDesktop ? "vertical" : "horizontal"}
              onKeyDown={onTabKeyDown}
              className={cn(
                "relative -mx-4 flex snap-x snap-proximity gap-2 overflow-x-auto px-4 py-2 scroll-px-4 sm:-mx-6 sm:px-6 sm:scroll-px-6",
                "[scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
                "[mask-image:linear-gradient(to_right,transparent,#000_12px,#000_calc(100%-12px),transparent)]",
                "lg:mx-0 lg:snap-none lg:flex-col lg:overflow-visible lg:p-0 lg:[mask-image:none]"
              )}
            >
              {SERVICES.map((s) => {
                const isSelected = s.id === selected;
                const Icon = SERVICE_ICONS[s.id];
                return (
                  <button
                    key={s.id}
                    ref={(el) => {
                      tabRefs.current[s.id] = el;
                    }}
                    id={tabId(s.id)}
                    type="button"
                    role="tab"
                    aria-selected={isSelected}
                    aria-controls={PANEL_ID}
                    tabIndex={isSelected ? 0 : -1}
                    onClick={() => select(s.id)}
                    className={cn(
                      "group relative flex min-h-11 shrink-0 snap-center items-center gap-2 rounded-full border px-4 text-sm font-semibold transition-colors",
                      "lg:w-full lg:gap-4 lg:rounded-2xl lg:border-transparent lg:px-4 lg:py-3 lg:text-left",
                      FOCUS_RING,
                      "focus-visible:ring-offset-gray-50",
                      isSelected
                        ? "border-transparent"
                        : "border-gray-200 bg-white hover:border-brand-coral-light lg:bg-transparent lg:hover:border-transparent lg:hover:bg-white/70"
                    )}
                  >
                    {isSelected && (
                      <motion.span
                        layoutId="services-tab-pill"
                        aria-hidden="true"
                        transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 420, damping: 36 }}
                        className="absolute -inset-px rounded-full bg-brand-coral shadow-md shadow-brand-coral/20 lg:rounded-2xl lg:bg-white lg:shadow-[0_1px_2px_rgba(16,24,40,0.05),0_8px_24px_-10px_rgba(16,24,40,0.18)] lg:ring-1 lg:ring-gray-200/80"
                      />
                    )}
                    <span
                      className={cn(
                        "relative flex shrink-0 items-center justify-center transition-colors lg:size-11 lg:rounded-xl",
                        isSelected
                          ? "text-white lg:bg-brand-coral"
                          : "text-brand-coral lg:border lg:border-gray-200 lg:bg-white"
                      )}
                    >
                      <Icon aria-hidden="true" className="size-4 lg:size-5" />
                    </span>
                    <span className="relative flex min-w-0 flex-col">
                      <span
                        className={cn(
                          "whitespace-nowrap lg:whitespace-normal lg:text-base",
                          isSelected ? "text-white lg:text-gray-900" : "text-gray-800 lg:text-gray-900"
                        )}
                      >
                        {s.name}
                      </span>
                      <span className="hidden text-sm font-normal text-gray-600 lg:block">{s.short}</span>
                    </span>
                    <ArrowRight
                      aria-hidden="true"
                      className={cn(
                        "relative ml-auto hidden size-4 shrink-0 text-brand-coral transition-opacity lg:block",
                        isSelected ? "opacity-100" : "opacity-0"
                      )}
                    />
                  </button>
                );
              })}
            </motion.div>

            {/* Detail panel */}
            <div
              id={PANEL_ID}
              role="tabpanel"
              aria-labelledby={tabId(selected)}
              className={cn(
                "relative mt-6 overflow-hidden rounded-3xl border border-gray-200/80 bg-white lg:mt-0 lg:min-h-[40rem]",
                "shadow-[0_1px_2px_rgba(16,24,40,0.04),0_16px_40px_-16px_rgba(16,24,40,0.14)]"
              )}
            >
              <div
                aria-hidden="true"
                className={cn(
                  "pointer-events-none absolute -right-20 -top-20 size-64 rounded-full blur-3xl transition-colors duration-500",
                  service.id === "aquatic" ? "bg-teal-50" : "bg-brand-coral-tint/70"
                )}
              />

              {reduceMarkup ? (
                Decoration
              ) : (
                <AnimatePresence initial={false}>
                  {Decoration && (
                    <motion.div
                      key={service.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1, transition: { duration: 0.6, delay: 0.15 } }}
                      exit={{ opacity: 0, transition: { duration: 0.25 } }}
                      className="pointer-events-none absolute inset-0"
                    >
                      {Decoration}
                    </motion.div>
                  )}
                </AnimatePresence>
              )}

              {reduceMarkup ? (
                <div key={service.id} className="relative flex h-full flex-col p-6 sm:p-8 lg:p-10">
                  <ServiceDetail service={service} index={selectedIndex} />
                </div>
              ) : (
                <AnimatePresence mode="wait" initial={false}>
                  <motion.div
                    key={service.id}
                    variants={PANEL_VARIANTS}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    className="relative flex h-full flex-col p-6 sm:p-8 lg:p-10"
                  >
                    <ServiceDetail service={service} index={selectedIndex} />
                  </motion.div>
                </AnimatePresence>
              )}
            </div>
          </div>
        </LayoutGroup>
      </div>
    </section>
  );
}
