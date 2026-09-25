"use client";

import { useEffect, useRef, useState, type FocusEvent, type ReactNode } from "react";
import Image from "next/image";
import { motion, useInView } from "motion/react";
import { ArrowRightIcon, HandshakeIcon, PauseIcon, PlayIcon, QuoteIcon } from "lucide-react";
import { BlurFade } from "@/components/magicui/blur-fade";
import { useInquiry } from "@/components/home/inquiry-context";
import { WhatsAppIcon } from "@/components/icons/whatsapp-icon";
import { useMagnetic } from "@/lib/hooks/use-magnetic";
import { COLLABORATION, LANDING_IMAGES, whatsappText, whatsappUrl } from "@/lib/content/landing";
import { cn } from "@/lib/utils";
import { useReducedMotionSafe } from "@/lib/hooks/use-reduced-motion";

// Deep teal (#0f3b38) is this section's own surface; white / teal-100 text on
// it is well above AA.
const ROTATE_MS = 6000;

const REDUCED_FINAL = "motion-reduce:opacity-100! motion-reduce:transform-none! motion-reduce:filter-none!";

function Reveal({ children, className, delay = 0 }: { children: ReactNode; className?: string; delay?: number }) {
  const reduce = useReducedMotionSafe();
  if (reduce) return <div className={className}>{children}</div>;
  return (
    <BlurFade inView delay={delay} className={cn(className, REDUCED_FINAL)}>
      {children}
    </BlurFade>
  );
}

// Focus ring tuned for the dark surface (coral-light on deep teal is ~6:1).
const FOCUS_RING =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-coral-light focus-visible:ring-offset-2 focus-visible:ring-offset-[#0f3b38]";

// ── Fallback for the `collaboration` image slot: a bridge of two hands ──────

const HAND_LEFT = "M44 262 C 58 180, 116 128, 186 136";
const HAND_RIGHT = "M356 262 C 342 180, 284 128, 214 136";
const COMMUNITY = [
  { cx: 92, r: 11, fill: "#2fa8a0", o: 0.9 },
  { cx: 130, r: 16, fill: "#f4a3ac", o: 0.85 },
  { cx: 170, r: 9, fill: "#ffffff", o: 0.55 },
  { cx: 204, r: 14, fill: "#2fa8a0", o: 0.9 },
  { cx: 240, r: 10, fill: "#ffffff", o: 0.55 },
  { cx: 276, r: 15, fill: "#f4a3ac", o: 0.85 },
  { cx: 312, r: 9, fill: "#2fa8a0", o: 0.9 },
] as const;
const HEART = "M200 118 C 176 102, 168 88, 176 76 C 184 65, 196 68, 200 78 C 204 68, 216 65, 224 76 C 232 88, 224 102, 200 118 Z";

function BridgeOfHands() {
  const reduce = useReducedMotionSafe();
  const handStroke = { fill: "none", strokeWidth: 16, strokeLinecap: "round" as const };

  return (
    <svg
      viewBox="0 0 400 320"
      className="h-auto w-full"
      aria-hidden="true"
      focusable="false"
    >
      <circle cx="200" cy="170" r="150" fill="none" stroke="#ffffff" strokeOpacity="0.08" />
      <circle cx="200" cy="170" r="108" fill="none" stroke="#ffffff" strokeOpacity="0.08" />
      <circle cx="200" cy="170" r="66" fill="#2fa8a0" fillOpacity="0.12" />

      {/* the bridge deck the hands form */}
      <path
        d="M44 262 Q 200 188 356 262"
        fill="none"
        stroke="#99f6e4"
        strokeOpacity="0.45"
        strokeWidth="3"
        strokeDasharray="2 12"
        strokeLinecap="round"
      />

      {reduce ? (
        <>
          <path d={HAND_LEFT} stroke="#2fa8a0" {...handStroke} />
          <path d={HAND_RIGHT} stroke="#f4a3ac" {...handStroke} />
          <path d={HEART} fill="#c41e34" stroke="#f4a3ac" strokeWidth="3" />
          {COMMUNITY.map((dot) => (
            <circle key={dot.cx} cx={dot.cx} cy={290 - dot.r} r={dot.r} fill={dot.fill} fillOpacity={dot.o} />
          ))}
        </>
      ) : (
        <>
          <motion.path
            d={HAND_LEFT}
            stroke="#2fa8a0"
            {...handStroke}
            initial={{ pathLength: 0 }}
            whileInView={{ pathLength: 1 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 1.1, ease: "easeInOut" }}
          />
          <motion.path
            d={HAND_RIGHT}
            stroke="#f4a3ac"
            {...handStroke}
            initial={{ pathLength: 0 }}
            whileInView={{ pathLength: 1 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 1.1, ease: "easeInOut" }}
          />
          <motion.path
            d={HEART}
            fill="#c41e34"
            stroke="#f4a3ac"
            strokeWidth="3"
            initial={{ scale: 0, opacity: 0 }}
            whileInView={{ scale: 1, opacity: 1 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ delay: 1, type: "spring", stiffness: 260, damping: 14 }}
          />
          {COMMUNITY.map((dot, i) => (
            <motion.circle
              key={dot.cx}
              cx={dot.cx}
              cy={290 - dot.r}
              r={dot.r}
              fill={dot.fill}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: dot.o, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ delay: 0.4 + i * 0.08, duration: 0.5, ease: "easeOut" }}
            />
          ))}
        </>
      )}
    </svg>
  );
}

function CollaborationVisual() {
  const src = LANDING_IMAGES.collaboration;

  if (src) {
    return (
      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-3xl ring-1 ring-white/15">
        <Image
          src={src}
          alt={COLLABORATION.eyebrow}
          fill
          sizes="(min-width: 1024px) 40vw, 100vw"
          className="object-cover"
        />
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-3xl bg-white/[0.04] px-4 pb-10 pt-6 ring-1 ring-white/10 sm:px-8">
      <BridgeOfHands />
    </div>
  );
}

// ── Quote rotator ───────────────────────────────────────────────────────────

function QuoteRotator({ quotes }: { quotes: readonly string[] }) {
  const reduce = useReducedMotionSafe();
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { margin: "-10% 0px" });
  const [index, setIndex] = useState(0);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [userPaused, setUserPaused] = useState(false);

  const running = !reduce && inView && !hovered && !focused && !userPaused && quotes.length > 1;

  useEffect(() => {
    if (!running) return;
    const id = window.setInterval(() => setIndex((i) => (i + 1) % quotes.length), ROTATE_MS);
    return () => window.clearInterval(id);
  }, [running, quotes.length]);

  const card = "relative rounded-2xl bg-white/[0.07] p-6 ring-1 ring-white/15 backdrop-blur-sm sm:p-7";

  if (reduce) {
    return (
      <div ref={ref} className={card}>
        <QuoteIcon aria-hidden="true" className="h-7 w-7 text-brand-coral-light" />
        <ul className="mt-3 space-y-3">
          {quotes.map((quote) => (
            <li key={quote} className="text-lg font-medium leading-snug text-white">
              “{quote}”
            </li>
          ))}
        </ul>
      </div>
    );
  }

  const handleBlur = (e: FocusEvent<HTMLDivElement>) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setFocused(false);
  };

  return (
    <div
      ref={ref}
      role="group"
      aria-label="Kutipan Hearty Bridge"
      className={card}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocus={() => setFocused(true)}
      onBlur={handleBlur}
    >
      <ul className="sr-only">
        {quotes.map((quote) => (
          <li key={quote}>{quote}</li>
        ))}
      </ul>

      <QuoteIcon aria-hidden="true" className="h-7 w-7 text-brand-coral-light" />

      {/* Stacked in one grid cell so the card keeps the tallest quote's height */}
      <div aria-hidden="true" className="mt-3 grid">
        {quotes.map((quote, i) => (
          <p
            key={quote}
            inert={i !== index}
            className={cn(
              "[grid-area:1/1] text-lg font-medium leading-snug text-white text-balance transition-opacity duration-700 ease-out sm:text-xl",
              i === index ? "opacity-100" : "opacity-0"
            )}
          >
            “{quote}”
          </p>
        ))}
      </div>

      <div className="mt-4 flex items-center justify-between gap-4">
        <div aria-hidden="true" className="flex items-center gap-1.5">
          {quotes.map((quote, i) => (
            <span
              key={quote}
              className={cn(
                "h-1.5 rounded-full transition-all duration-500",
                i === index ? "w-6 bg-brand-coral-light" : "w-1.5 bg-white/35"
              )}
            />
          ))}
        </div>
        <button
          type="button"
          onClick={() => setUserPaused((p) => !p)}
          aria-label={userPaused ? "Lanjutkan pergantian kutipan" : "Jeda pergantian kutipan"}
          className={cn(
            "-mr-2 inline-flex h-11 w-11 items-center justify-center rounded-full text-teal-100 transition-colors hover:bg-white/10 hover:text-white",
            FOCUS_RING
          )}
        >
          {userPaused ? (
            <PlayIcon className="h-4 w-4" aria-hidden="true" />
          ) : (
            <PauseIcon className="h-4 w-4" aria-hidden="true" />
          )}
        </button>
      </div>
    </div>
  );
}

// ── Section ────────────────────────────────────────────────────────────────

export function CollaborationSection() {
  const { open } = useInquiry();
  const magnetic = useMagnetic(6);

  return (
    <section
      id="kolaborasi"
      aria-labelledby="kolaborasi-title"
      className="relative isolate overflow-hidden bg-[#0f3b38] py-20 text-white sm:py-24"
    >
      {/* soft glows */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-32 -top-32 -z-10 h-96 w-96 rounded-full bg-brand-teal/25 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-40 right-0 -z-10 h-96 w-96 rounded-full bg-brand-coral/15 blur-3xl"
      />

      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-12 lg:gap-16">
          {/* Story */}
          <div className="lg:col-span-7">
            <Reveal>
              <span className="inline-flex items-center gap-2 rounded-full border border-teal-300/30 bg-white/10 px-4 py-1.5 text-sm font-semibold text-teal-100">
                <HandshakeIcon className="h-4 w-4" aria-hidden="true" />
                {COLLABORATION.eyebrow}
              </span>
              <h2
                id="kolaborasi-title"
                className="mt-4 text-3xl font-bold tracking-tight text-white text-balance sm:text-4xl"
              >
                {COLLABORATION.title}
              </h2>
            </Reveal>

            <Reveal delay={0.08}>
              <blockquote className="mt-8 border-l-4 border-brand-coral-light pl-5 text-xl font-medium leading-snug text-teal-50 text-balance sm:text-2xl">
                <p>“{COLLABORATION.leadQuote}”</p>
              </blockquote>
            </Reveal>

            <div className="mt-8 max-w-2xl space-y-4">
              {COLLABORATION.body.map((paragraph, i) => (
                <Reveal key={i} delay={0.12 + i * 0.06}>
                  <p className="text-base leading-relaxed text-teal-100 text-pretty sm:text-lg">{paragraph}</p>
                </Reveal>
              ))}
            </div>
          </div>

          {/* Image slot / illustration + rotating quotes */}
          <Reveal delay={0.1} className="lg:col-span-5">
            <CollaborationVisual />
            <div className="relative -mt-8 px-3 sm:px-6">
              <QuoteRotator quotes={COLLABORATION.quotes} />
            </div>
          </Reveal>
        </div>

        <div className="mt-16 grid grid-cols-1 gap-6 lg:mt-20 lg:grid-cols-2">
          {/* Goals */}
          <Reveal className="h-full">
            <div className="h-full rounded-3xl bg-white/[0.05] p-7 ring-1 ring-white/10 sm:p-9">
              <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-teal-200">Tujuan kolaborasi</h3>
              <ul className="mt-6 space-y-5">
                {COLLABORATION.goals.map((goal, i) => (
                  <li key={goal} className="flex items-start gap-4">
                    <span
                      aria-hidden="true"
                      className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-teal/25 text-sm font-semibold text-teal-100 tabular-nums ring-1 ring-teal-300/30"
                    >
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span className="text-base leading-relaxed text-teal-50">{goal}</span>
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>

          {/* Forms + CTA */}
          <Reveal delay={0.08} className="h-full">
            <div className="flex h-full flex-col rounded-3xl bg-white/[0.05] p-7 ring-1 ring-white/10 sm:p-9">
              <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-teal-200">Bentuk kerja sama</h3>
              <ul className="mt-6 flex flex-wrap gap-2.5">
                {COLLABORATION.forms.map((form) => (
                  <li
                    key={form}
                    className="rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-medium text-white"
                  >
                    {form}
                  </li>
                ))}
              </ul>

              <div className="mt-8 flex flex-col gap-3 pt-2 sm:flex-row sm:flex-wrap lg:mt-auto">
                <motion.button
                  data-inline-cta
                  type="button"
                  onClick={() => open({ kind: "partnership" })}
                  style={magnetic.style}
                  {...magnetic.handlers}
                  className={cn(
                    "inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-white px-6 py-3 text-base font-semibold text-teal-800 shadow-lg shadow-black/20 transition-colors hover:bg-teal-50 sm:w-auto",
                    FOCUS_RING
                  )}
                >
                  {COLLABORATION.cta}
                  <ArrowRightIcon className="h-4 w-4" aria-hidden="true" />
                </motion.button>
                <a
                  data-inline-cta
                  href={whatsappUrl(whatsappText({ kind: "partnership" }))}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn(
                    "inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full border border-white/30 px-6 py-3 text-base font-semibold text-white transition-colors hover:bg-white/10 sm:w-auto",
                    FOCUS_RING
                  )}
                >
                  <WhatsAppIcon className="h-5 w-5" />
                  Diskusi via WhatsApp
                  <span className="sr-only">(membuka tab baru)</span>
                </a>
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
