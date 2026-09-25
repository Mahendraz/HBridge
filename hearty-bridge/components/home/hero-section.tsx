"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, type PointerEvent, type ReactNode } from "react";
import {
  motion,
  useInView,
  useSpring,
  useTransform,
  type MotionValue,
} from "motion/react";
import { ArrowDown, Check } from "lucide-react";
import { AnimatedGradientText } from "@/components/magicui/animated-gradient-text";
import { WhatsAppIcon } from "@/components/icons/whatsapp-icon";
import { SERVICE_ICONS } from "@/components/home/services-marquee";
import { useFinePointer } from "@/lib/hooks/use-fine-pointer";
import { useMagnetic } from "@/lib/hooks/use-magnetic";
import {
  COMPANY,
  HERO,
  LANDING_IMAGES,
  SERVICES,
  whatsappText,
  whatsappUrl,
  type ServiceId,
} from "@/lib/content/landing";
import { cn } from "@/lib/utils";
import { useReducedMotionLive } from "@/lib/hooks/use-reduced-motion";

// Alt text for the optional hero photo (LANDING_IMAGES.hero). Adjust once the
// real photo exists so it describes what is actually in it.
export const HERO_IMAGE_ALT = `Suasana di ${COMPANY.name}`;

const SINE_IN_OUT = [0.37, 0, 0.63, 1] as const;

// F4: max pointer-parallax shift in px for a layer with depth 1.
const MAX_SHIFT = 12;

const FOCUS_RING =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-coral focus-visible:ring-offset-2";

type ChipTone = "coral" | "teal";

interface FloatingChip {
  id: ServiceId;
  /** absolute position inside the visual box */
  position: string;
  tone: ChipTone;
  /** F4 parallax depth, 0..1 */
  depth: number;
  /** D2 idle bob — durations deliberately not multiples of each other */
  bob: { amp: number; duration: number; delay: number };
  /** also shown below the sm breakpoint */
  mobile: boolean;
}

const FLOATING_CHIPS: FloatingChip[] = [
  {
    id: "okupasi",
    position: "left-[1%] top-[4%] sm:left-[3%] sm:top-[9%]",
    tone: "coral",
    depth: 1,
    bob: { amp: 7, duration: 5.2, delay: 0 },
    mobile: true,
  },
  {
    id: "wicara",
    position: "right-0 top-[21%] sm:right-[1%] sm:top-[22%]",
    tone: "teal",
    depth: 0.7,
    bob: { amp: 9, duration: 6.7, delay: 0.6 },
    mobile: true,
  },
  {
    id: "aquatic",
    position: "left-0 bottom-[19%] sm:bottom-[24%]",
    tone: "teal",
    depth: 0.85,
    bob: { amp: 8, duration: 7.9, delay: 1.1 },
    mobile: true,
  },
  {
    id: "psikolog",
    position: "right-[3%] bottom-[4%] sm:right-[6%] sm:bottom-[8%]",
    tone: "coral",
    depth: 0.6,
    bob: { amp: 6, duration: 5.9, delay: 0.3 },
    mobile: true,
  },
  {
    id: "homecare",
    position: "left-[34%] top-0",
    tone: "coral",
    depth: 0.5,
    bob: { amp: 7, duration: 8.6, delay: 1.6 },
    mobile: false,
  },
  {
    id: "asesmen",
    position: "left-[24%] bottom-0",
    tone: "teal",
    depth: 0.9,
    bob: { amp: 6, duration: 6.3, delay: 0.9 },
    mobile: false,
  },
];

const SERVICE_BY_ID = new Map(SERVICES.map((s) => [s.id, s]));

// "Hero Bridge (Konsultasi Keluarga)" -> "Hero Bridge" for compact chips.
function chipLabel(id: ServiceId): string {
  return (SERVICE_BY_ID.get(id)?.name ?? id).replace(/\s*\(.*\)\s*$/, "");
}

// ── Motion helpers ────────────────────────────────────────────────────────

interface ParallaxLayerProps {
  depth: number;
  px: MotionValue<number>;
  py: MotionValue<number>;
  className?: string;
  children?: ReactNode;
  decorative?: boolean;
}

function ParallaxLayer({ depth, px, py, className, children, decorative = true }: ParallaxLayerProps) {
  const x = useTransform(px, (v) => v * MAX_SHIFT * depth);
  const y = useTransform(py, (v) => v * MAX_SHIFT * depth);
  return (
    <motion.div aria-hidden={decorative ? true : undefined} style={{ x, y }} className={className}>
      {children}
    </motion.div>
  );
}

function Bob({
  active,
  amp,
  duration,
  delay,
  children,
}: {
  active: boolean;
  amp: number;
  duration: number;
  delay: number;
  children: ReactNode;
}) {
  return (
    <motion.div
      initial={{ y: 0 }}
      animate={active ? { y: -amp } : { y: 0 }}
      transition={
        active
          ? { duration, delay, repeat: Infinity, repeatType: "reverse", ease: SINE_IN_OUT }
          : { duration: 0.4 }
      }
    >
      {children}
    </motion.div>
  );
}

function ServiceChip({ id, tone }: { id: ServiceId; tone: ChipTone }) {
  const Icon = SERVICE_ICONS[id];
  return (
    <span className="flex items-center gap-2 whitespace-nowrap rounded-full bg-white/95 py-1.5 pl-1.5 pr-3.5 text-xs font-semibold text-gray-800 shadow-[0_12px_30px_-14px_rgba(196,30,52,0.45)] ring-1 ring-rose-100 sm:py-2 sm:pl-2 sm:pr-4 sm:text-sm">
      <span
        className={cn(
          "flex size-7 items-center justify-center rounded-full sm:size-8",
          tone === "coral" ? "bg-brand-coral-tint text-brand-coral" : "bg-teal-50 text-teal-700"
        )}
      >
        <Icon className="size-3.5 sm:size-4" aria-hidden="true" />
      </span>
      {chipLabel(id)}
    </span>
  );
}

// ── Visual column ─────────────────────────────────────────────────────────

function HeroVisual({
  px,
  py,
  idleOn,
  breatheOn,
}: {
  px: MotionValue<number>;
  py: MotionValue<number>;
  idleOn: boolean;
  breatheOn: boolean;
}) {
  const photo = LANDING_IMAGES.hero;

  return (
    <>
      {/* Main soft blob — slow 14s breathing (F4 companion). */}
      <ParallaxLayer depth={0.35} px={px} py={py} className="absolute inset-0 flex items-center justify-center">
        <motion.div
          initial={{ scale: 1 }}
          animate={breatheOn ? { scale: 1.04 } : { scale: 1 }}
          transition={
            breatheOn
              ? { duration: 14, repeat: Infinity, repeatType: "reverse", ease: SINE_IN_OUT }
              : { duration: 0.6 }
          }
          className="size-[min(96cqh,100cqw)] rounded-[42%_58%_55%_45%/48%_42%_58%_52%] bg-linear-to-br from-brand-coral-tint via-rose-50 to-teal-50"
        />
      </ParallaxLayer>

      {/* Teal glow + dot grid for depth */}
      <ParallaxLayer depth={0.55} px={px} py={py} className="absolute bottom-[6%] right-[4%]">
        <div className="size-24 rounded-full bg-teal-100/80 blur-2xl sm:size-36" />
      </ParallaxLayer>
      <ParallaxLayer depth={0.2} px={px} py={py} className="absolute left-[4%] top-[2%] sm:left-[8%]">
        <div className="size-20 bg-[radial-gradient(var(--brand-teal)_1.3px,transparent_1.5px)] bg-size-[14px_14px] opacity-30 sm:size-28" />
      </ParallaxLayer>

      {photo ? (
        <ParallaxLayer
          depth={0.45}
          px={px}
          py={py}
          decorative={false}
          className="absolute inset-x-[4%] inset-y-[3%] sm:inset-x-[8%] sm:inset-y-[5%]"
        >
          <div className="relative size-full overflow-hidden rounded-[2rem] bg-white shadow-[0_30px_70px_-30px_rgba(196,30,52,0.45)] ring-8 ring-white">
            <Image
              src={photo}
              alt={HERO_IMAGE_ALT}
              fill
              preload
              sizes="(min-width: 1024px) 520px, (min-width: 640px) 560px, 100vw"
              className="object-cover"
            />
          </div>
        </ParallaxLayer>
      ) : (
        <>
          {/* Concentric rings */}
          <ParallaxLayer depth={0.6} px={px} py={py} className="absolute inset-0">
            <div className="absolute left-1/2 top-1/2 size-[min(101cqh,100cqw)] -translate-x-1/2 -translate-y-1/2 rounded-full border border-rose-100" />
            <motion.div
              initial={{ rotate: 0 }}
              animate={idleOn ? { rotate: 360 } : { rotate: 0 }}
              transition={idleOn ? { duration: 97, repeat: Infinity, ease: "linear" } : { duration: 0 }}
              className="absolute left-1/2 top-1/2 size-[min(83cqh,83cqw)] -translate-x-1/2 -translate-y-1/2 rounded-full border border-dashed border-teal-300/80"
            >
              <span className="absolute left-1/2 top-0 size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand-coral-light" />
              <span className="absolute bottom-0 left-1/2 size-2 -translate-x-1/2 translate-y-1/2 rounded-full bg-brand-teal" />
            </motion.div>
            <div className="absolute left-1/2 top-1/2 size-[min(66cqh,66cqw)] -translate-x-1/2 -translate-y-1/2 rounded-full border border-brand-coral-light/60 bg-white/40" />
          </ParallaxLayer>

          {/* Logo on a white circle */}
          <ParallaxLayer depth={0.8} px={px} py={py} className="absolute inset-0 flex items-center justify-center">
            <div className="relative size-[min(54cqh,60cqw)] overflow-hidden rounded-full bg-white shadow-[0_28px_60px_-24px_rgba(196,30,52,0.45)] ring-8 ring-white/70 sm:size-[min(50cqh,56cqw)]">
              {/* The PNG's wordmark sits above its vertical centre; nudge it down. */}
              <div className="absolute inset-0 translate-y-[8%]">
                <Image
                  src="/images/logo-heartybridge.png"
                  alt=""
                  fill
                  loading="eager"
                  sizes="(min-width: 1024px) 280px, (min-width: 640px) 200px, 160px"
                  className="object-contain"
                />
              </div>
            </div>
          </ParallaxLayer>
        </>
      )}

      {/* Orbiting service chips — D2 idle bob + F4 parallax */}
      {FLOATING_CHIPS.map((chip) => (
        <ParallaxLayer
          key={chip.id}
          depth={chip.depth}
          px={px}
          py={py}
          className={cn("absolute z-10", chip.position, !chip.mobile && "hidden sm:block")}
        >
          <Bob active={idleOn} {...chip.bob}>
            <ServiceChip id={chip.id} tone={chip.tone} />
          </Bob>
        </ParallaxLayer>
      ))}
    </>
  );
}

// ── Section ───────────────────────────────────────────────────────────────

export function HeroSection() {
  const reduce = useReducedMotionLive() === true;
  const finePointer = useFinePointer();
  const parallaxOn = finePointer && !reduce;

  const visualRef = useRef<HTMLDivElement>(null);
  const visualInView = useInView(visualRef, { margin: "80px" });
  const idleOn = !reduce && visualInView;
  const breatheOn = parallaxOn && visualInView;

  const px = useSpring(0, { stiffness: 70, damping: 18, mass: 0.6 });
  const py = useSpring(0, { stiffness: 70, damping: 18, mass: 0.6 });

  useEffect(() => {
    if (!parallaxOn) {
      px.set(0);
      py.set(0);
    }
  }, [parallaxOn, px, py]);

  const onPointerMove = useCallback(
    (e: PointerEvent<HTMLElement>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const nx = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const ny = ((e.clientY - rect.top) / rect.height) * 2 - 1;
      px.set(Math.max(-1, Math.min(1, nx)));
      py.set(Math.max(-1, Math.min(1, ny)));
    },
    [px, py]
  );

  const onPointerLeave = useCallback(() => {
    px.set(0);
    py.set(0);
  }, [px, py]);

  const magnetic = useMagnetic(6);

  // Entrance (D3 + fade-up) is CSS (`hb-rise` / `hb-fade-up` / `hb-settle` in
  // globals.css), so it plays from the server HTML before hydration and the
  // LCP text is never held back by the client bundle. Short delays for the
  // same reason; reduced motion drops the animation (final state at once).
  const delay = (seconds: number) => ({ animationDelay: `${seconds}s` });

  const lineCount = HERO.headlineLines.length;

  return (
    <section
      id="home"
      aria-labelledby="home-title"
      onPointerMove={parallaxOn ? onPointerMove : undefined}
      onPointerLeave={parallaxOn ? onPointerLeave : undefined}
      className="relative isolate flex flex-col justify-center overflow-hidden bg-linear-to-b from-rose-50 to-white lg:min-h-[calc(100svh-8.75rem)]"
    >
      {/* Ambient glows */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-40 -top-40 -z-10 size-[26rem] rounded-full bg-brand-coral-tint/70 blur-3xl sm:size-[32rem]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-48 right-[-10rem] -z-10 hidden size-[30rem] rounded-full bg-teal-50 blur-3xl lg:block"
      />

      <div className="mx-auto grid w-full max-w-7xl items-center gap-10 px-4 pb-14 pt-10 sm:gap-12 sm:px-6 sm:pb-20 sm:pt-16 lg:grid-cols-[1.08fr_0.92fr] lg:gap-8 lg:py-12 xl:gap-12">
        {/* Copy */}
        <div className="relative z-10 min-w-0">
          <p
            style={delay(0)}
            className="hb-fade-up inline-flex items-center gap-2 rounded-full border border-brand-coral-light/70 bg-white/80 px-3.5 py-1.5 text-xs font-semibold text-brand-coral shadow-sm backdrop-blur sm:text-sm"
          >
            <span aria-hidden="true" className="size-2 rounded-full bg-brand-teal" />
            {HERO.eyebrow}
          </p>

          {/* D3: each line rises out of its own mask */}
          <h1
            id="home-title"
            className="mt-5 text-4xl font-bold leading-[1.06] tracking-tight text-gray-900 text-balance sm:text-6xl lg:text-[clamp(3rem,5.2vw,4.25rem)]"
          >
            {HERO.headlineLines.map((line, i) => (
              <span key={line} className="-mb-[0.14em] block overflow-hidden pb-[0.14em]">
                <span className="hb-rise block" style={delay(0.05 + i * 0.08)}>
                  {i === HERO.highlightLineIndex ? (
                    <AnimatedGradientText colorFrom="#c41e34" colorTo="#f0475a" speed={1.2}>
                      {line}
                    </AnimatedGradientText>
                  ) : (
                    line
                  )}
                  {/* keeps a word gap in textContent / screen readers between lines */}
                  {i < lineCount - 1 ? " " : null}
                </span>
              </span>
            ))}
          </h1>

          <p
            style={delay(0.1)}
            className="hb-fade-up mt-6 max-w-xl text-base leading-relaxed text-gray-600 text-pretty sm:text-lg"
          >
            {HERO.subtitle}
          </p>

          <ul style={delay(0.15)} className="hb-fade-up mt-6 flex flex-wrap gap-2" aria-label="Keunggulan layanan">
            {HERO.trustChips.map((chip) => (
              <li
                key={chip}
                className="inline-flex items-center gap-2 rounded-full border border-teal-100 bg-white/85 py-1.5 pl-1.5 pr-3 text-sm font-medium text-gray-700 shadow-sm"
              >
                <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-teal-600 text-white">
                  <Check className="size-3" strokeWidth={3} aria-hidden="true" />
                </span>
                {chip}
              </li>
            ))}
          </ul>

          <div style={delay(0.15)} className="hb-fade-up mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
            {/* F2 magnetic primary CTA */}
            <motion.div style={magnetic.style} {...magnetic.handlers} className="w-full sm:w-auto">
              <a
                href={whatsappUrl(whatsappText())}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                  "group relative inline-flex h-14 w-full items-center justify-center gap-2.5 overflow-hidden rounded-full bg-brand-coral px-7 text-base font-semibold text-white shadow-lg shadow-brand-coral/25 transition-colors hover:bg-[#a8192d] sm:w-auto",
                  FOCUS_RING
                )}
              >
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-y-0 left-0 w-1/3 -translate-x-[150%] -skew-x-12 bg-white/20 transition-transform duration-700 ease-out group-hover:translate-x-[400%] motion-reduce:hidden"
                />
                <WhatsAppIcon className="size-5 shrink-0" />
                {HERO.primaryCta}
                <span className="sr-only"> (membuka WhatsApp di tab baru)</span>
              </a>
            </motion.div>

            <a
              href="#alur"
              className={cn(
                "group inline-flex h-14 items-center justify-center gap-2 rounded-full border border-gray-300 bg-white/80 px-7 text-base font-semibold text-gray-800 transition-colors hover:border-brand-coral hover:text-brand-coral",
                FOCUS_RING
              )}
            >
              {HERO.secondaryCta}
              <ArrowDown
                className="size-4 transition-transform group-hover:translate-y-0.5 motion-reduce:transition-none"
                aria-hidden="true"
              />
            </a>
          </div>

          <p
            style={delay(0.15)}
            className="hb-fade-up mt-4 flex flex-wrap items-center gap-x-1.5 text-sm text-gray-600"
          >
            {HERO.loginHint}
            <Link
              href="/auth/login"
              className={cn(
                "inline-flex min-h-11 items-center rounded-sm font-semibold text-teal-700 underline decoration-teal-300 underline-offset-4 transition-colors hover:text-teal-800 hover:decoration-teal-600",
                FOCUS_RING
              )}
            >
              {HERO.loginCta}
            </Link>
          </p>
        </div>

        {/* Visual: scale-only settle, so the logo paints at once */}
        <div
          ref={visualRef}
          className="hb-settle relative mx-auto h-[280px] w-full max-w-[560px] [container-type:size] sm:h-[400px] lg:h-[540px]"
        >
          <HeroVisual px={px} py={py} idleOn={idleOn} breatheOn={breatheOn} />
        </div>
      </div>
    </section>
  );
}
