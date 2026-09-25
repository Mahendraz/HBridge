"use client";

import { useEffect, useRef, useState, type RefObject } from "react";
import { AnimatePresence, motion, useScroll } from "motion/react";
import { ArrowRightIcon } from "lucide-react";
import { WhatsAppIcon } from "@/components/icons/whatsapp-icon";
import { useInquiry, type InquiryTopic } from "@/components/home/inquiry-context";
import { INQUIRY_PANEL_ID } from "@/components/home/inquiry-panel";
import { useMagnetic } from "@/lib/hooks/use-magnetic";
import { cn } from "@/lib/utils";
import { COLLABORATION, STICKY_CTA, whatsappUrl } from "@/lib/content/landing";
import { useReducedMotionLive } from "@/lib/hooks/use-reduced-motion";

// H3 — sticky CTA per zone. It only shows while the section in the middle of
// the viewport has a CTA (hidden over the hero, the pinned journey, the
// session facts, contact and the final CTA), swaps its label per zone, and
// carries a scroll progress bar. Desktop: floating pill bottom-right, which
// also steps aside while it would sit on an in-content CTA
// (`data-inline-cta`). Mobile: bottom bar. Every label opens the inquiry
// form; the round WhatsApp icon next to it is the direct-chat path.

interface ZoneCta {
  label: string;
  /** null = ask about the service selected in the services explorer. */
  topic: InquiryTopic | null;
}

const GENERAL: InquiryTopic = { kind: "general" };
const CONSULT: ZoneCta = { label: STICKY_CTA.consult, topic: GENERAL };
const ASK_SERVICE: ZoneCta = { label: STICKY_CTA.askService, topic: null };
const PARTNER: ZoneCta = { label: COLLABORATION.cta, topic: { kind: "partnership" } };

// Section id -> CTA (null = hidden in that zone).
const ZONE_CTA: Record<string, ZoneCta | null> = {
  home: null,
  kondisi: CONSULT,
  services: ASK_SERVICE,
  alur: null,
  // #fakta has its own identical CTA pair.
  fakta: null,
  keunggulan: CONSULT,
  about: CONSULT,
  tim: CONSULT,
  kolaborasi: PARTNER,
  instagram: CONSULT,
  faq: CONSULT,
  contact: null,
  mulai: null,
};

const ZONE_IDS = Object.keys(ZONE_CTA);

const FOCUS_RING =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-coral focus-visible:ring-offset-2";

const EASE = [0.22, 1, 0.36, 1] as const;

// Which known section crosses the middle of the viewport. Keeps the last
// zone while the midline sits in a gap/unknown block (e.g. the footer), and
// ignores ids that are not on the page yet.
function useActiveZone(ids: readonly string[]): string | null {
  const [zone, setZone] = useState<string | null>(null);

  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") return;
    const hits = new Set<Element>();

    const pick = () => {
      if (hits.size === 0) return;
      const mid = window.innerHeight / 2;
      let best: Element | null = null;
      let bestDist = Infinity;
      let bestHeight = Infinity;
      for (const el of hits) {
        const r = el.getBoundingClientRect();
        const dist = r.top <= mid && r.bottom >= mid ? 0 : Math.min(Math.abs(r.top - mid), Math.abs(r.bottom - mid));
        // Tie-break on the smaller box so a nested band beats its parent.
        if (dist < bestDist || (dist === bestDist && r.height < bestHeight)) {
          best = el;
          bestDist = dist;
          bestHeight = r.height;
        }
      }
      if (best) setZone(best.id);
    };

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) hits.add(entry.target);
          else hits.delete(entry.target);
        }
        pick();
      },
      // A 1%-tall band across the middle of the viewport.
      { rootMargin: "-49.5% 0px -49.5% 0px", threshold: 0 }
    );

    const observeAll = () => {
      for (const id of ids) {
        const el = document.getElementById(id);
        if (el) io.observe(el);
      }
    };
    observeAll();
    // Sections mounted after hydration (lazy chunks) get picked up here.
    window.addEventListener("load", observeAll);

    return () => {
      window.removeEventListener("load", observeAll);
      io.disconnect();
    };
  }, [ids]);

  return zone;
}

// True while the element in `ref` overlaps an in-content CTA
// (`[data-inline-cta]`), plus a small margin. Checked on scroll/resize; the
// CTAs are looked up each time, so re-rendered ones (the services panel) are
// picked up too.
function useOverlapsInlineCta(ref: RefObject<HTMLElement | null>, enabled: boolean): boolean {
  const [overlaps, setOverlaps] = useState(false);

  useEffect(() => {
    if (!enabled) return;
    const MARGIN = 16;
    let frame = 0;

    const check = () => {
      frame = 0;
      const el = ref.current;
      const box = el?.getBoundingClientRect();
      if (!box || box.width === 0) {
        setOverlaps(false);
        return;
      }
      let hit = false;
      for (const cta of document.querySelectorAll("[data-inline-cta]")) {
        const r = cta.getBoundingClientRect();
        if (
          r.right > box.left - MARGIN &&
          r.left < box.right + MARGIN &&
          r.bottom > box.top - MARGIN &&
          r.top < box.bottom + MARGIN
        ) {
          hit = true;
          break;
        }
      }
      setOverlaps(hit);
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
  }, [ref, enabled]);

  return enabled && overlaps;
}

export function StickyCta() {
  const { isOpen, open, serviceFocus } = useInquiry();
  const reduce = useReducedMotionLive();
  const magnetic = useMagnetic(6);
  const { scrollYProgress } = useScroll();

  const zone = useActiveZone(ZONE_IDS);
  const cta = zone ? ZONE_CTA[zone] ?? null : null;
  const visible = cta !== null && !isOpen;

  // Keep the last label while the bar animates out.
  const [shown, setShown] = useState<ZoneCta>(CONSULT);
  if (cta && cta !== shown) setShown(cta);

  // Desktop pill: step aside while it would cover an in-content CTA.
  const pillRef = useRef<HTMLDivElement>(null);
  const coversInlineCta = useOverlapsInlineCta(pillRef, visible);
  const pillVisible = visible && !coversInlineCta;

  // C5: while the bar/pill is up, keyboard focus scrolls controls clear of it
  // (scroll-padding-bottom via html[data-sticky-cta] in globals.css).
  useEffect(() => {
    if (!visible) return;
    const html = document.documentElement;
    html.setAttribute("data-sticky-cta", "");
    return () => html.removeAttribute("data-sticky-cta");
  }, [visible]);

  const enter = { opacity: 1, y: 0 };
  const exit = { opacity: 0, y: 24 };
  const barTransition = reduce ? { duration: 0 } : { duration: 0.28, ease: EASE };

  const labelMotion = {
    initial: reduce ? false : ({ opacity: 0, y: 10 } as const),
    animate: { opacity: 1, y: 0 },
    exit: reduce ? { opacity: 0, transition: { duration: 0 } } : { opacity: 0, y: -10 },
    transition: { duration: 0.2, ease: EASE },
  };

  const hiddenProps = (shownNow: boolean) => (shownNow ? {} : ({ inert: true, "aria-hidden": true } as const));
  const onOpen = () => open(shown.topic ?? { kind: "service", serviceId: serviceFocus });

  return (
    <>
      {/* Mobile: full-width bottom bar */}
      <motion.div
        initial={false}
        animate={visible ? enter : exit}
        transition={barTransition}
        {...hiddenProps(visible)}
        className={cn(
          "fixed inset-x-0 bottom-0 z-40 border-t border-gray-200 bg-white/95 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 shadow-[0_-8px_24px_-12px_rgba(17,24,39,0.18)] backdrop-blur-md md:hidden",
          !visible && "pointer-events-none"
        )}
      >
        <div aria-hidden="true" className="absolute inset-x-0 top-0 h-0.5 bg-gray-100">
          <motion.div className="h-full origin-left bg-brand-coral" style={{ scaleX: scrollYProgress }} />
        </div>
        <div className="mx-auto flex max-w-md items-center gap-3">
          <a
            href={whatsappUrl()}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Chat langsung di WhatsApp (tab baru)"
            className={cn(
              "flex size-12 shrink-0 items-center justify-center rounded-full border border-teal-200 bg-teal-50 text-teal-700 transition-colors hover:bg-teal-100",
              FOCUS_RING
            )}
          >
            <WhatsAppIcon className="size-6" />
          </a>
          <button
            type="button"
            onClick={onOpen}
            aria-haspopup="dialog"
            aria-controls={INQUIRY_PANEL_ID}
            className={cn(
              "relative inline-flex min-h-12 min-w-0 flex-1 items-center justify-center gap-2 overflow-hidden rounded-full bg-brand-coral px-5 text-base font-semibold text-white shadow-md shadow-brand-coral/25 transition-colors hover:bg-[#a81a2d]",
              FOCUS_RING
            )}
          >
            <AnimatePresence mode="popLayout" initial={false}>
              <motion.span key={shown.label} {...labelMotion} className="truncate">
                {shown.label}
              </motion.span>
            </AnimatePresence>
            <ArrowRightIcon className="size-4 shrink-0" aria-hidden="true" />
          </button>
        </div>
      </motion.div>

      {/* Desktop: floating pill bottom-right */}
      <motion.div
        ref={pillRef}
        initial={false}
        animate={pillVisible ? enter : exit}
        transition={barTransition}
        {...hiddenProps(pillVisible)}
        className={cn("fixed bottom-6 right-6 z-40 hidden md:block", !pillVisible && "pointer-events-none")}
      >
        <div className="flex items-center gap-2 rounded-full border border-gray-200 bg-white/90 p-1.5 shadow-lg shadow-gray-900/10 backdrop-blur-md">
          <a
            href={whatsappUrl()}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Chat langsung di WhatsApp (tab baru)"
            className={cn(
              "flex size-11 shrink-0 items-center justify-center rounded-full border border-teal-200 bg-teal-50 text-teal-700 transition-colors hover:bg-teal-100",
              FOCUS_RING
            )}
          >
            <WhatsAppIcon className="size-5" />
          </a>
          <motion.div style={magnetic.style} {...magnetic.handlers}>
            <motion.button
              type="button"
              onClick={onOpen}
              aria-haspopup="dialog"
              aria-controls={INQUIRY_PANEL_ID}
              layout={!reduce}
              transition={{ layout: { duration: 0.25, ease: EASE } }}
              style={{ borderRadius: 9999 }}
              className={cn(
                "relative inline-flex min-h-11 items-center gap-2 overflow-hidden whitespace-nowrap bg-brand-coral px-5 text-sm font-semibold text-white shadow-md shadow-brand-coral/25 transition-colors hover:bg-[#a81a2d]",
                FOCUS_RING
              )}
            >
              <AnimatePresence mode="popLayout" initial={false}>
                <motion.span key={shown.label} {...labelMotion}>
                  {shown.label}
                </motion.span>
              </AnimatePresence>
              <motion.span layout={reduce ? false : "position"} className="inline-flex">
                <ArrowRightIcon className="size-4" aria-hidden="true" />
              </motion.span>
            </motion.button>
          </motion.div>
        </div>
        <div aria-hidden="true" className="mx-6 mt-2 h-1 overflow-hidden rounded-full bg-gray-900/10">
          <motion.div className="h-full origin-left rounded-full bg-brand-coral" style={{ scaleX: scrollYProgress }} />
        </div>
      </motion.div>
    </>
  );
}
