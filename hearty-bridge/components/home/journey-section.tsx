"use client";

import Image from "next/image";
import { useId, useRef, useState, useSyncExternalStore, type CSSProperties, type ReactNode } from "react";
import {
  motion,
  useMotionValueEvent,
  useScroll,
  useTransform,
  type MotionValue,
} from "motion/react";
import {
  ArrowDownIcon,
  ClipboardPenIcon,
  HandHeartIcon,
  HeartIcon,
  MessagesSquareIcon,
  ScanSearchIcon,
  TargetIcon,
  TrendingUpIcon,
  UsersIcon,
  type LucideIcon,
} from "lucide-react";
import { SectionHeading } from "@/components/home/section-heading";
import { COMPANY, JOURNEY_COPY, JOURNEY_STEPS, LANDING_IMAGES } from "@/lib/content/landing";
import { cn } from "@/lib/utils";
import { useReducedMotionLive } from "@/lib/hooks/use-reduced-motion";

// ── Alur layanan ──────────────────────────────────────────────────────────
// web-business A5 + C7 + B5. The six-step story lives in ONE sticky stage
// inside a tall track. Steps are stacked `absolute inset-0` layers, so the
// next step is never seen scrolling in. Every visual change is a pure
// function of the story position `s` (in viewport heights), derived from a
// single scroll progress value — scrubbing back and forth is always exact.
// Reduced motion and very short viewports get a plain timeline instead.

type JourneyStep = (typeof JOURNEY_STEPS)[number];
type StepId = JourneyStep["id"];
type Tone = "coral" | "teal";

const STEP_COUNT = JOURNEY_STEPS.length;
const TITLE_ID = "alur-title";

const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-coral focus-visible:ring-offset-2";

const STEP_ART: Record<StepId, { icon: LucideIcon; imageSlot: string; tone: Tone }> = {
  intake: { icon: ClipboardPenIcon, imageSlot: "journeyIntake", tone: "coral" },
  asesmen: { icon: ScanSearchIcon, imageSlot: "journeyAsesmen", tone: "coral" },
  hasil: { icon: MessagesSquareIcon, imageSlot: "journeyHasil", tone: "coral" },
  program: { icon: TargetIcon, imageSlot: "journeyProgram", tone: "teal" },
  terapi: { icon: HandHeartIcon, imageSlot: "journeyTerapi", tone: "teal" },
  evaluasi: { icon: TrendingUpIcon, imageSlot: "journeyEvaluasi", tone: "teal" },
};

const pad = (n: number) => String(n).padStart(2, "0");

function stepImage(id: StepId): string | null {
  return LANDING_IMAGES[STEP_ART[id].imageSlot] ?? null;
}

// ── Timeline (A5 segments, in viewport heights) ───────────────────────────
// The stage stays pinned for `total` screens of scrolling. The track is one
// screen taller than that (room for the stage itself), so useScroll's
// ["start start", "end end"] range is `total` screens and s = progress * total.

const SEGMENTS = {
  mobile: { intro: 0.25, step: 0.75, outro: 0.6 },
  desktop: { intro: 0.25, step: 0.9, outro: 0.6 },
} as const;

const HANDOFF = 0.25; // share of a step segment spent on each C7 handoff
const FINALE_AT = 0.25; // screens into the outro: the heart lands, the finale takes over
const JUMP_SETTLE = 0.04; // rail jumps land this far past a handoff, so text has settled
const VEIL_PEAK = 0.65;
const RISE_PX = 24;

interface Timeline {
  total: number;
  /** Half of a handoff window. */
  hw: number;
  starts: readonly number[];
  outro: number;
  finale: number;
  /** Layer i hands over to layer i + 1 here; the last one is step 6 → finale. */
  handoffs: readonly number[];
  /** The heart steps onto plank k at plankKeys[k] and off it at plankKeys[k + 1]. */
  plankKeys: readonly number[];
  /** Story positions matching HEART_T. */
  heartKeys: readonly number[];
  /** Rail targets, one per step. */
  jumps: readonly number[];
}

function buildTimeline(segments: { intro: number; step: number; outro: number }): Timeline {
  const starts = JOURNEY_STEPS.map((_, index) => segments.intro + index * segments.step);
  const outro = segments.intro + STEP_COUNT * segments.step;
  const finale = outro + FINALE_AT;
  const hw = (segments.step * HANDOFF) / 2;
  return {
    total: outro + segments.outro,
    hw,
    starts,
    outro,
    finale,
    handoffs: [...starts.slice(1), finale],
    plankKeys: [...starts, outro],
    heartKeys: [0, ...starts, outro, finale],
    jumps: starts.map((start) => start + hw + JUMP_SETTLE),
  };
}

const TIMELINES = {
  mobile: buildTimeline(SEGMENTS.mobile),
  desktop: buildTimeline(SEGMENTS.desktop),
} as const;

// Track height = (total + 1) screens. `svh` keeps it stable while mobile
// browser bars show/hide; the breakpoint matches DESKTOP_QUERY below.
const TRACK_VARS = {
  "--journey-sm": (TIMELINES.mobile.total + 1).toFixed(4),
  "--journey-md": (TIMELINES.desktop.total + 1).toFixed(4),
} as CSSProperties;

// ── Scrub math ────────────────────────────────────────────────────────────

const clamp01 = (v: number) => (v <= 0 ? 0 : v >= 1 ? 1 : v);
const lerp = (a: number, b: number, t: number) => (t >= 1 ? b : a + (b - a) * t);
const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

/** 0 → 1 (eased) while s travels from a to b. */
const ramp = (s: number, a: number, b: number) => easeInOut(clamp01((s - a) / (b - a)));

/** Piecewise-linear lookup; `xs` ascending. */
function interpolate(s: number, xs: readonly number[], ys: readonly number[]): number {
  if (s <= xs[0]) return ys[0];
  for (let i = 1; i < xs.length; i++) {
    if (s <= xs[i]) return lerp(ys[i - 1], ys[i], (s - xs[i - 1]) / (xs[i] - xs[i - 1]));
  }
  return ys[ys.length - 1];
}

/** values[i] while layer i is on stage, eased across each handoff window (D7). */
function graded(s: number, tl: Timeline, values: readonly number[]): number {
  let value = values[0];
  tl.handoffs.forEach((at, i) => {
    value = lerp(value, values[i + 1], ramp(s, at - tl.hw, at + tl.hw));
  });
  return value;
}

/** 0–5 = step layers, 6 = finale. Swaps at each handoff midpoint. */
function layerAt(s: number, tl: Timeline): number {
  let layer = 0;
  for (const at of tl.handoffs) if (s >= at) layer++;
  return layer;
}

/** Rise window of text line `line` for a layer entering at `enterAt`. */
function riseRange(tl: Timeline, enterAt: number | null, line: number): readonly [number, number] | null {
  if (enterAt === null) return null;
  const start = enterAt - tl.hw / 3 + line * ((2 * tl.hw) / 9);
  return [start, start + (2 * tl.hw) / 3];
}

// D7 grading per layer (6 steps + finale). The last TEAL_MIX value must be 1
// and the blooms 0, so the final frame is exactly bg-teal-50 (C7 pattern 3).
const TEAL_MIX = [0, 0.16, 0.32, 0.48, 0.64, 0.8, 1] as const;
const CORAL_BLOOM = [1, 0.85, 0.7, 0.5, 0.35, 0.25, 0] as const;
const TEAL_BLOOM = [0.2, 0.35, 0.5, 0.65, 0.8, 0.9, 0] as const;

// ── Bridge geometry (viewBox 0 0 100 40, stretched to its box) ────────────
// The deck is a parabola whose x is linear in t, so the point at parameter t
// sits at deckX(t) percent of the box width: the heart marker and the rail
// buttons line up with the planks without measuring anything.

const VB_H = 40;
const DECK = { x0: 2, x1: 98, yEnd: 31, yApex: 16 } as const;
const RAIL_RISE = 8;
const T0 = 0.07; // first plank starts
const T1 = 0.93; // last plank ends
const PLANK_W = (T1 - T0) / STEP_COUNT;
const PLANK_GAP = 0.006;
// Heart position along the deck at each of Timeline.heartKeys.
const HEART_T = [0.015, ...JOURNEY_STEPS.map((_, index) => T0 + index * PLANK_W), T1, 0.985];
const HOP_PX = 4;

const deckX = (t: number) => DECK.x0 + (DECK.x1 - DECK.x0) * t;
const deckY = (t: number) => DECK.yEnd - 4 * (DECK.yEnd - DECK.yApex) * t * (1 - t);
const fx = (n: number) => n.toFixed(3);

/** The deck between t = a and t = b as one quadratic Bézier (blossoming). */
function deckPath(a: number, b: number, lift = 0): string {
  const xm = (DECK.x0 + DECK.x1) / 2;
  const yc = 2 * DECK.yApex - DECK.yEnd;
  const w0 = (1 - a) * (1 - b);
  const w1 = (1 - a) * b + a * (1 - b);
  const w2 = a * b;
  const cx = w0 * DECK.x0 + w1 * xm + w2 * DECK.x1;
  const cy = w0 * DECK.yEnd + w1 * yc + w2 * DECK.yEnd - lift;
  return `M ${fx(deckX(a))} ${fx(deckY(a) - lift)} Q ${fx(cx)} ${fx(cy)} ${fx(deckX(b))} ${fx(deckY(b) - lift)}`;
}

const DECK_D = deckPath(0, 1);
const RAIL_D = deckPath(T0, T1, RAIL_RISE);
const POSTS_D = Array.from({ length: STEP_COUNT + 1 }, (_, j) => {
  const t = T0 + j * PLANK_W;
  return `M ${fx(deckX(t))} ${fx(deckY(t))} L ${fx(deckX(t))} ${fx(deckY(t) - RAIL_RISE)}`;
}).join(" ");
const PLANK_D = JOURNEY_STEPS.map((_, k) =>
  deckPath(T0 + k * PLANK_W + PLANK_GAP / 2, T0 + (k + 1) * PLANK_W - PLANK_GAP / 2)
);
const WATER_D = `M 9 37.6 q 2.5 -1.3 5 0${" t 5 0".repeat(15)}`;
const BANK_LEFT_D = "M 0 40 L 0 30.4 C 3 28.9 7 29.4 9.4 31.6 C 10.9 33.1 11.7 36 12 40 Z";
const BANK_RIGHT_D = "M 100 40 L 100 30.4 C 97 28.9 93 29.4 90.6 31.6 C 89.1 33.1 88.3 36 88 40 Z";
// Rail columns span exactly the plank run, so each button sits under its plank.
const RAIL_INSET: CSSProperties = { marginInline: `${fx(deckX(T0))}%` };

const heartAt = (s: number, tl: Timeline) => interpolate(s, tl.heartKeys, HEART_T);
const hopAt = (t: number) => -HOP_PX * Math.abs(Math.sin(((t - T0) / PLANK_W) * Math.PI * 2));
// HeartMarker's wrappers are 1% of the bridge box, so a translate of N·100%
// moves the marker by N% of the box.
const heartX = (t: number) => `${(deckX(t) * 100).toFixed(2)}%`;
const heartY = (t: number) => `${((deckY(t) / VB_H) * 10000).toFixed(2)}%`;

// ── Tier + breakpoint (hydration-safe) ────────────────────────────────────
// motion's useReducedMotion() reads matchMedia during the first client render,
// so branching the markup on it would break hydration. These stores return the
// server snapshot while hydrating and switch right after. While the tier is
// unknown (SSR + hydration) BOTH tiers are rendered and CSS shows the right
// one, so reduced-motion visitors never see the pinned version flash.

const STATIC_QUERY = "(prefers-reduced-motion: reduce), (max-height: 559.98px)";
const DESKTOP_QUERY = "(min-width: 48rem)"; // Tailwind `md`

type Tier = "both" | "pinned" | "static";

function subscribeTo(query: string) {
  return (onChange: () => void) => {
    const mql = window.matchMedia(query);
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  };
}

const subscribeStatic = subscribeTo(STATIC_QUERY);
const subscribeDesktop = subscribeTo(DESKTOP_QUERY);

function useJourneyTier(): Tier {
  return useSyncExternalStore<Tier>(
    subscribeStatic,
    () => (window.matchMedia(STATIC_QUERY).matches ? "static" : "pinned"),
    () => "both"
  );
}

function useIsDesktop(): boolean {
  return useSyncExternalStore(
    subscribeDesktop,
    () => window.matchMedia(DESKTOP_QUERY).matches,
    () => true
  );
}

const PINNED_ONLY = "motion-reduce:hidden [@media(max-height:559.98px)]:hidden";
const STATIC_ONLY = "hidden motion-reduce:block [@media(max-height:559.98px)]:block";

// ── Section ───────────────────────────────────────────────────────────────

export function JourneySection() {
  const tier = useJourneyTier();

  return (
    <section id="alur" aria-labelledby={TITLE_ID} className="relative bg-white">
      <div className="bg-linear-to-b from-white from-60% to-rose-50">
        <div className="mx-auto max-w-7xl px-4 pb-12 pt-20 sm:px-6 sm:pb-16 sm:pt-24">
          <SectionHeading
            eyebrow={JOURNEY_COPY.eyebrow}
            title={JOURNEY_COPY.title}
            subtitle={JOURNEY_COPY.subtitle}
            titleId={TITLE_ID}
          />
        </div>
      </div>

      {tier !== "static" && <JourneyPinned className={tier === "both" ? PINNED_ONLY : undefined} />}
      {tier !== "pinned" && <JourneyStatic className={tier === "both" ? STATIC_ONLY : undefined} />}
    </section>
  );
}

// ── Pinned tier (A5 stage) ────────────────────────────────────────────────

// --hud / --bridge / --rail / --dock size the chrome. Step layers pad by the
// same variables, so text never runs under the header row or the bridge.
const STAGE_CLASS = cn(
  "sticky top-16 h-[calc(100svh_-_4rem)] overflow-hidden bg-rose-50",
  "[--hud:3.25rem] [--bridge:3rem] [--rail:2.75rem] [--dock:calc(var(--bridge)_+_var(--rail)_+_1.5rem)]",
  "md:[--hud:4rem] md:[--bridge:clamp(4.25rem,10svh,6.5rem)] md:[--dock:calc(var(--bridge)_+_var(--rail)_+_2rem)]",
  "lg:[--rail:4.25rem]"
);

function JourneyPinned({ className }: { className?: string }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const isDesktop = useIsDesktop();
  const tl = isDesktop ? TIMELINES.desktop : TIMELINES.mobile;
  const reduce = useReducedMotionLive();

  const { scrollYProgress } = useScroll({ target: trackRef, offset: ["start start", "end end"] });

  // The only React state driven by scrolling: which layer is on stage.
  const [layer, setLayer] = useState(0);
  const layerRef = useRef(0);
  useMotionValueEvent(scrollYProgress, "change", (progress) => {
    const next = layerAt(progress * tl.total, tl);
    if (next !== layerRef.current) {
      layerRef.current = next;
      setLayer(next);
    }
  });
  const activeStep = Math.min(layer, STEP_COUNT - 1);

  const goToStep = (index: number) => {
    const track = trackRef.current;
    if (!track) return;
    const trackTop = track.getBoundingClientRect().top + window.scrollY;
    const range = track.offsetHeight - window.innerHeight;
    window.scrollTo({
      top: Math.round(trackTop + (tl.jumps[index] / tl.total) * range),
      behavior: reduce ? "instant" : "smooth",
    });
  };

  return (
    <div
      ref={trackRef}
      style={TRACK_VARS}
      className={cn(
        // The gradient only shows under the stage when mobile browser bars
        // collapse (100svh < viewport); it ends in the same teal-50.
        "relative h-[calc(var(--journey-sm)*100svh)] bg-linear-to-b from-rose-50 to-teal-50 md:h-[calc(var(--journey-md)*100svh)]",
        className
      )}
    >
      <div className={STAGE_CLASS}>
        <StageBackdrop progress={scrollYProgress} tl={tl} />
        <Hud active={activeStep} />

        <div className="absolute inset-0 z-10">
          {JOURNEY_STEPS.map((step, index) => (
            <StepLayer
              key={step.id}
              step={step}
              index={index}
              progress={scrollYProgress}
              tl={tl}
              active={layer === index}
            />
          ))}
          <FinaleLayer progress={scrollYProgress} tl={tl} active={layer === STEP_COUNT} />
        </div>

        {/* C7 pattern 2: the bridge is the one element shared by every scene,
            so it sits above all step layers. */}
        <div className="absolute inset-x-0 bottom-0 z-20 h-[var(--dock)]">
          <div className="mx-auto flex h-full max-w-7xl flex-col px-4 sm:px-6">
            <div className="relative mt-3 h-[var(--bridge)] shrink-0">
              <LiveBridge progress={scrollYProgress} tl={tl} />
            </div>
            <StepRail active={activeStep} complete={layer === STEP_COUNT} onSelect={goToStep} />
          </div>
        </div>
      </div>
    </div>
  );
}

function StageBackdrop({ progress, tl }: { progress: MotionValue<number>; tl: Timeline }) {
  const tealMix = useTransform(progress, (p) => graded(p * tl.total, tl, TEAL_MIX));
  const coralBloom = useTransform(progress, (p) => graded(p * tl.total, tl, CORAL_BLOOM));
  const tealBloom = useTransform(progress, (p) => graded(p * tl.total, tl, TEAL_BLOOM));
  const bloomDrift = useTransform(progress, (p) => p * -32);

  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0">
      <motion.div className="absolute inset-0 bg-teal-50" style={{ opacity: tealMix }} />
      {/* Starts below the stage's top edge: that edge is visible while the
          stage scrolls in, and a clipped bloom there would show a hard line. */}
      <motion.div
        className="absolute -right-[14%] top-[8%] size-[85vmin] rounded-full bg-[radial-gradient(closest-side,rgba(244,163,172,0.42),transparent)]"
        style={{ opacity: coralBloom, y: bloomDrift }}
      />
      <motion.div
        className="absolute -bottom-[28%] -left-[18%] size-[95vmin] rounded-full bg-[radial-gradient(closest-side,rgba(47,168,160,0.2),transparent)]"
        style={{ opacity: tealBloom }}
      />
    </div>
  );
}

function Hud({ active }: { active: number }) {
  return (
    <div className="absolute inset-x-0 top-0 z-30 h-[var(--hud)]">
      <div className="mx-auto flex h-full max-w-7xl items-center justify-between gap-3 px-4 sm:px-6">
        <p aria-hidden="true" className="text-xs font-semibold text-gray-600 tabular-nums sm:text-sm">
          <span className="hidden sm:inline">{JOURNEY_COPY.eyebrow} · </span>
          Langkah <span className="text-gray-900">{pad(active + 1)}</span> / {pad(STEP_COUNT)}
        </p>
        <p role="status" className="sr-only">
          {`Langkah ${active + 1} dari ${STEP_COUNT}: ${JOURNEY_STEPS[active].title}`}
        </p>
        <a
          href="#fakta"
          className={cn(
            focusRing,
            "inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-full bg-white/80 px-4 text-sm font-medium text-gray-700 shadow-sm ring-1 ring-gray-200 backdrop-blur-sm transition-colors hover:bg-white hover:text-gray-900"
          )}
        >
          {JOURNEY_COPY.skip}
          <ArrowDownIcon aria-hidden="true" className="size-4" />
        </a>
      </div>
    </div>
  );
}

// ── Layers (C7 handoff) ───────────────────────────────────────────────────

interface LayerMotion {
  visibility: MotionValue<string>;
  veil: MotionValue<number>;
  opacity: MotionValue<number>;
  scale: MotionValue<number>;
  filter: MotionValue<string>;
  /** -1 → 1 across the layer's time on stage, for the scrubbed drift. */
  drift: MotionValue<number>;
}

// Around handoff b (window 2·hw): the outgoing layer fades, shrinks to 0.97,
// blurs to 6px and dims to 0.9 over [b − hw, b + hw/3]; the incoming layer's
// coral-tint veil peaks at b; its content fades in from scale 1.04 over
// [b − hw/3, b + hw] while its text lines rise, staggered, in the same window.
function useLayerMotion(
  progress: MotionValue<number>,
  tl: Timeline,
  enterAt: number | null,
  exitAt: number | null
): LayerMotion {
  const { total, hw } = tl;
  const enter = (s: number) => (enterAt === null ? 1 : ramp(s, enterAt - hw / 3, enterAt + hw));
  const exit = (s: number) => (exitAt === null ? 0 : ramp(s, exitAt - hw, exitAt + hw / 3));
  const shownFrom = enterAt === null ? 0 : enterAt - hw;
  const shownTo = exitAt === null ? total : exitAt + hw / 3;

  const visibility = useTransform(progress, (p): string => {
    const s = p * total;
    return s >= shownFrom && s <= shownTo ? "visible" : "hidden";
  });
  const veil = useTransform(progress, (p) => {
    if (enterAt === null) return 0;
    const s = p * total;
    return VEIL_PEAK * (ramp(s, enterAt - hw, enterAt) - ramp(s, enterAt, enterAt + hw));
  });
  const opacity = useTransform(progress, (p) => enter(p * total) * (1 - exit(p * total)));
  const scale = useTransform(progress, (p) => (1 + 0.04 * (1 - enter(p * total))) * (1 - 0.03 * exit(p * total)));
  const filter = useTransform(progress, (p) => {
    const u = exit(p * total);
    return u <= 0 ? "none" : `blur(${(6 * u).toFixed(2)}px) brightness(${(1 - 0.1 * u).toFixed(3)})`;
  });
  const drift = useTransform(progress, (p) => clamp01((p * total - shownFrom) / (shownTo - shownFrom)) * 2 - 1);

  return { visibility, veil, opacity, scale, filter, drift };
}

function LayerShell({ layer, active, children }: { layer: LayerMotion; active: boolean; children: ReactNode }) {
  return (
    <motion.div
      className="absolute inset-0"
      style={{ visibility: layer.visibility }}
      inert={!active}
      aria-hidden={active ? undefined : true}
    >
      {/* The veil lives in the incoming layer: above the outgoing scene,
          below the incoming content. */}
      <motion.div aria-hidden="true" className="absolute inset-0 bg-brand-coral-tint" style={{ opacity: layer.veil }} />
      <motion.div
        className="absolute inset-0 pb-[var(--dock)] pt-[var(--hud)]"
        style={{ opacity: layer.opacity, scale: layer.scale, filter: layer.filter }}
      >
        {children}
      </motion.div>
    </motion.div>
  );
}

function Rise({
  progress,
  total,
  range,
  className,
  children,
}: {
  progress: MotionValue<number>;
  total: number;
  range: readonly [number, number] | null;
  className?: string;
  children: ReactNode;
}) {
  const reveal = useTransform(progress, (p) => (range ? ramp(p * total, range[0], range[1]) : 1));
  const y = useTransform(reveal, (r) => RISE_PX * (1 - r));
  return (
    <motion.div className={className} style={{ y, opacity: reveal }}>
      {children}
    </motion.div>
  );
}

function StepLayer({
  step,
  index,
  progress,
  tl,
  active,
}: {
  step: JourneyStep;
  index: number;
  progress: MotionValue<number>;
  tl: Timeline;
  active: boolean;
}) {
  const enterAt = index === 0 ? null : tl.handoffs[index - 1];
  const layer = useLayerMotion(progress, tl, enterAt, tl.handoffs[index]);
  const line = (n: number) => riseRange(tl, enterAt, n);

  return (
    <LayerShell layer={layer} active={active}>
      <div className="mx-auto grid h-full max-w-7xl grid-rows-[minmax(0,1fr)_auto] gap-4 px-4 py-2 sm:px-6 md:grid-cols-[1.1fr_0.9fr] md:grid-rows-1 md:items-center md:gap-10 md:py-4 lg:gap-16">
        <div className="relative min-h-0 md:order-2 md:h-full">
          <StepVisual step={step} index={index} drift={layer.drift} />
        </div>

        <div className="min-w-0 md:order-1">
          <div className="flex items-baseline gap-3 md:block">
            <Rise progress={progress} total={tl.total} range={line(0)} className="shrink-0">
              <span
                aria-hidden="true"
                className="block text-3xl font-bold leading-none tracking-tight text-brand-coral tabular-nums md:text-[length:clamp(3rem,8svh,4.5rem)]"
              >
                {pad(index + 1)}
              </span>
            </Rise>
            <Rise progress={progress} total={tl.total} range={line(1)} className="min-w-0 md:mt-3">
              <h3 className="text-lg font-bold leading-snug text-gray-900 text-balance sm:text-xl md:text-[length:clamp(1.625rem,4.2svh,2.5rem)] md:leading-tight">
                <span className="sr-only">{`Langkah ${index + 1}: `}</span>
                {step.title}
              </h3>
            </Rise>
          </div>
          <Rise progress={progress} total={tl.total} range={line(2)} className="mt-2 md:mt-4">
            <p className="text-sm leading-normal text-gray-600 text-pretty md:max-w-xl md:text-[length:clamp(1rem,2.1svh,1.125rem)] md:leading-relaxed">
              {step.description}
            </p>
          </Rise>
          <Rise progress={progress} total={tl.total} range={line(3)} className="mt-3 md:mt-6">
            <ParentRoleChip text={step.parentRole} />
          </Rise>
        </div>
      </div>
    </LayerShell>
  );
}

function FinaleLayer({ progress, tl, active }: { progress: MotionValue<number>; tl: Timeline; active: boolean }) {
  const layer = useLayerMotion(progress, tl, tl.finale, null);
  const line = (n: number) => riseRange(tl, tl.finale, n);

  return (
    <LayerShell layer={layer} active={active}>
      <div className="mx-auto flex h-full max-w-7xl flex-col items-center justify-center px-4 text-center sm:px-6">
        <Rise progress={progress} total={tl.total} range={line(0)}>
          <FinaleEmblem />
        </Rise>
        <Rise progress={progress} total={tl.total} range={line(1)} className="mt-5 md:mt-7">
          <p className="text-4xl font-bold tracking-tight text-brand-coral text-balance sm:text-5xl md:text-6xl">
            {JOURNEY_COPY.finale}
          </p>
        </Rise>
        <Rise progress={progress} total={tl.total} range={line(2)} className="mt-3">
          <p className="text-sm font-medium text-teal-800 sm:text-base">{COMPANY.name}</p>
        </Rise>
      </div>
    </LayerShell>
  );
}

function FinaleEmblem() {
  return (
    <div aria-hidden="true" className="relative grid size-24 place-items-center md:size-32">
      <span className="absolute inset-0 rounded-full bg-white/60 ring-1 ring-teal-200" />
      <span className="absolute inset-[13%] rounded-full bg-brand-coral-tint" />
      <span className="relative grid size-[54%] place-items-center rounded-full bg-white shadow-[0_18px_40px_-18px_rgba(196,30,52,0.55)]">
        <HeartIcon className="size-1/2 fill-brand-coral text-brand-coral" />
      </span>
    </div>
  );
}

// ── Step content ──────────────────────────────────────────────────────────

const BLOB_TILT = [0, 38, -24, 64, -48, 16] as const;

const TONE_ART: Record<
  Tone,
  { blob: string; dashed: string; ring: string; disc: string; icon: string; dotA: string; dotB: string }
> = {
  coral: {
    blob: "bg-brand-coral-tint",
    dashed: "border-brand-coral-light/80",
    ring: "border-brand-coral-light/60",
    disc: "shadow-[0_24px_60px_-24px_rgba(196,30,52,0.45)]",
    icon: "text-brand-coral",
    dotA: "bg-brand-teal/70",
    dotB: "bg-brand-coral-light",
  },
  teal: {
    blob: "bg-teal-100",
    dashed: "border-teal-300/80",
    ring: "border-teal-200",
    disc: "shadow-[0_24px_60px_-24px_rgba(15,118,110,0.45)]",
    icon: "text-teal-700",
    dotA: "bg-brand-coral-light",
    dotB: "bg-brand-teal/70",
  },
};

// C7 soft edge: the photo melts into the blob behind it instead of ending on
// a hard frame, and every step's photo reads the same whatever its framing.
const SOFT_EDGE_MASK = "radial-gradient(closest-side, #000 70%, transparent)";
const SOFT_EDGE: CSSProperties = { maskImage: SOFT_EDGE_MASK, WebkitMaskImage: SOFT_EDGE_MASK };

function StepVisual({ step, index, drift }: { step: JourneyStep; index: number; drift: MotionValue<number> }) {
  const art = STEP_ART[step.id];
  const tone = TONE_ART[art.tone];
  const src = stepImage(step.id);
  const Icon = art.icon;

  const tilt = useTransform(drift, (v) => BLOB_TILT[index] + v * 8);
  const float = useTransform(drift, (v) => v * -10);
  const orbit = useTransform(drift, (v) => v * 12);
  const counter = useTransform(drift, (v) => v * -9);

  return (
    // Square that fits the cell: mobile caps it at ~a third of the screen.
    <div className="relative size-full [container-type:size]">
      <div className="absolute left-1/2 top-1/2 size-[min(100cqmin,34svh)] -translate-x-1/2 -translate-y-1/2 md:size-[min(100cqmin,32rem)]">
        <motion.div
          aria-hidden="true"
          className={cn("absolute inset-[3%] rounded-[44%_56%_60%_40%/48%_42%_58%_52%]", tone.blob)}
          style={{ rotate: tilt }}
        />
        {src ? (
          <div className="absolute inset-[4%] overflow-hidden rounded-[2rem]" style={SOFT_EDGE}>
            <Image src={src} alt="" fill sizes="(min-width: 768px) 32rem, 40vh" className="object-cover" />
          </div>
        ) : (
          <div aria-hidden="true" className="absolute inset-0">
            <div className="absolute inset-[13%] rounded-[58%_42%_40%_60%/44%_58%_42%_56%] bg-white/55" />
            <div className={cn("absolute inset-[19%] rounded-full border-2 border-dashed", tone.dashed)} />
            <div className={cn("absolute inset-[26%] rounded-full border", tone.ring)} />
            <motion.div
              className={cn("absolute inset-[31%] grid place-items-center rounded-full bg-white", tone.disc)}
              style={{ y: float }}
            >
              <Icon className={cn("size-[46%]", tone.icon)} strokeWidth={1.5} />
            </motion.div>
            <motion.span
              className={cn("absolute left-[8%] top-[24%] size-[7%] rounded-full", tone.dotA)}
              style={{ x: orbit }}
            />
            <motion.span
              className={cn("absolute bottom-[14%] right-[12%] size-[5%] rounded-full", tone.dotB)}
              style={{ x: counter }}
            />
            <motion.span className="absolute right-[14%] top-[10%] size-[10%]" style={{ y: counter }}>
              <HeartIcon className="size-full fill-brand-coral-light text-brand-coral" strokeWidth={1.75} />
            </motion.span>
          </div>
        )}
      </div>
    </div>
  );
}

function ParentRoleChip({ text, className }: { text: string; className?: string }) {
  return (
    <p
      className={cn(
        "inline-flex max-w-full items-start gap-2 rounded-2xl bg-white/85 px-3 py-2 text-[13px] leading-snug text-gray-700 shadow-sm ring-1 ring-brand-coral-light/60 sm:text-sm",
        className
      )}
    >
      <UsersIcon aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-brand-coral" />
      <span>
        <span className="font-semibold text-gray-900">Peran orang tua:</span> {text}
      </span>
    </p>
  );
}

// ── Position rail (B5) ────────────────────────────────────────────────────

// Badge colours follow the planks: teal = done, coral = current, white = next.
// Once the finale is on stage every step reads as done (06 keeps aria-current).
// No colour transition: coral → teal would pass through a muddy mix.
function StepRail({
  active,
  complete,
  onSelect,
}: {
  active: number;
  complete: boolean;
  onSelect: (index: number) => void;
}) {
  return (
    <nav aria-label="Langkah alur layanan" className="h-[var(--rail)] shrink-0">
      <ol role="list" className="grid h-full grid-cols-6 items-start" style={RAIL_INSET}>
        {JOURNEY_STEPS.map((step, index) => {
          const current = index === active;
          const done = complete || index < active;
          return (
            <li key={step.id} className="flex min-w-0 justify-center">
              {/* aria-label keeps the name identical at every breakpoint (the
                  title is only visible on lg) and contains the visible "01". */}
              <button
                type="button"
                onClick={() => onSelect(index)}
                aria-current={current ? "step" : undefined}
                aria-label={`${pad(index + 1)} ${step.title}`}
                className={cn(
                  focusRing,
                  "group flex min-h-11 w-full min-w-11 flex-col items-center justify-center gap-1 rounded-2xl px-1 lg:justify-start lg:pt-1"
                )}
              >
                <span
                  className={cn(
                    "grid size-8 shrink-0 place-items-center rounded-full text-xs font-bold tabular-nums",
                    current && complete
                      ? "bg-teal-700 text-white shadow-[0_0_0_4px_rgba(15,118,110,0.18)]"
                      : current
                        ? "bg-brand-coral text-white shadow-[0_0_0_4px_rgba(196,30,52,0.16)]"
                        : done
                          ? "bg-teal-700 text-white"
                          : "bg-white text-gray-600 ring-1 ring-gray-300 group-hover:ring-brand-coral-light"
                  )}
                >
                  {pad(index + 1)}
                </span>
                {/* Visible title on lg only; the button's aria-label names it
                    at every breakpoint. */}
                <span
                  className={cn(
                    "hidden max-w-[11rem] text-center text-xs leading-tight text-balance lg:line-clamp-2",
                    current ? "font-semibold text-gray-900" : "text-gray-600"
                  )}
                >
                  {step.title}
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

// ── Bridge (C7 pattern 2: the shared element) ─────────────────────────────

function BridgeArt({ planks, children }: { planks: ReactNode; children?: ReactNode }) {
  // Gradient ids must be unique per instance (both tiers render during SSR).
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const bankLeft = `${uid}-bank-l`;
  const bankRight = `${uid}-bank-r`;

  return (
    <div className="relative size-full">
      <svg
        viewBox={`0 0 100 ${VB_H}`}
        preserveAspectRatio="none"
        aria-hidden="true"
        focusable="false"
        className="absolute inset-0 size-full overflow-visible"
      >
        <defs>
          <linearGradient id={bankLeft} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0.2" className="[stop-color:var(--color-rose-100)]" />
            <stop offset="1" stopOpacity="0" className="[stop-color:var(--color-rose-100)]" />
          </linearGradient>
          <linearGradient id={bankRight} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0.2" className="[stop-color:var(--color-teal-100)]" />
            <stop offset="1" stopOpacity="0" className="[stop-color:var(--color-teal-100)]" />
          </linearGradient>
        </defs>
        <path
          d={WATER_D}
          vectorEffect="non-scaling-stroke"
          strokeLinecap="round"
          className="fill-none stroke-teal-200 [stroke-width:1.5px] md:[stroke-width:2px]"
        />
        <path d={BANK_LEFT_D} fill={`url(#${bankLeft})`} />
        <path d={BANK_RIGHT_D} fill={`url(#${bankRight})`} />
        <path
          d={POSTS_D}
          vectorEffect="non-scaling-stroke"
          strokeLinecap="round"
          className="fill-none stroke-gray-300 [stroke-width:1.5px] md:[stroke-width:2px]"
        />
        <path
          d={RAIL_D}
          vectorEffect="non-scaling-stroke"
          strokeLinecap="round"
          className="fill-none stroke-gray-300 [stroke-width:1.5px] md:[stroke-width:2px]"
        />
        <path
          d={DECK_D}
          vectorEffect="non-scaling-stroke"
          strokeLinecap="round"
          className="fill-none stroke-gray-300 [stroke-width:9px] md:[stroke-width:13px]"
        />
        {planks}
      </svg>
      {children}
    </div>
  );
}

const PLANK_CLASS = "fill-none [stroke-width:5px] md:[stroke-width:8px]";

function PlankPaths({
  d,
  coral,
  teal,
}: {
  d: string;
  coral: MotionValue<number> | number;
  teal: MotionValue<number> | number;
}) {
  return (
    <>
      <path d={d} vectorEffect="non-scaling-stroke" className={cn(PLANK_CLASS, "stroke-white")} />
      <motion.path
        d={d}
        vectorEffect="non-scaling-stroke"
        className={cn(PLANK_CLASS, "stroke-brand-coral")}
        style={{ opacity: coral }}
      />
      <motion.path
        d={d}
        vectorEffect="non-scaling-stroke"
        className={cn(PLANK_CLASS, "stroke-brand-teal")}
        style={{ opacity: teal }}
      />
    </>
  );
}

// Plank k turns coral when the heart steps onto it (step k active) and teal
// once the heart has crossed it (step k done). Coral fades out before teal
// fades in, so the swap passes through the white plank instead of a muddy mix.
function LivePlank({ d, index, progress, tl }: { d: string; index: number; progress: MotionValue<number>; tl: Timeline }) {
  const on = tl.plankKeys[index];
  const off = tl.plankKeys[index + 1];
  const coral = useTransform(progress, (p) => {
    const s = p * tl.total;
    return ramp(s, on - tl.hw, on + tl.hw) * (1 - ramp(s, off - tl.hw, off));
  });
  const teal = useTransform(progress, (p) => ramp(p * tl.total, off, off + tl.hw));
  return <PlankPaths d={d} coral={coral} teal={teal} />;
}

// Percent translations are relative to the element itself: the two wrappers
// are 1% of the bridge box on their axis, so the marker moves by a share of
// the box without measuring it (and without the wrappers spilling out of it).
// The innermost wrapper is 0×0, so hop and scale pivot on the deck point.
function HeartMarker({
  x,
  y,
  hop,
  scale,
}: {
  x: MotionValue<string> | string;
  y: MotionValue<string> | string;
  hop: MotionValue<number> | number;
  scale: MotionValue<number> | number;
}) {
  return (
    <motion.div aria-hidden="true" className="pointer-events-none absolute inset-y-0 left-0 w-[1%]" style={{ x }}>
      <motion.div className="absolute inset-x-0 top-0 h-[1%]" style={{ y }}>
        <motion.div className="absolute left-0 top-0 size-0" style={{ y: hop, scale }}>
          <span className="absolute bottom-1 left-0 grid size-7 -translate-x-1/2 place-items-center rounded-full bg-white shadow-md ring-1 ring-brand-coral-light md:bottom-1.5 md:size-9">
            <HeartIcon className="size-4 fill-brand-coral text-brand-coral md:size-5" strokeWidth={1.75} />
          </span>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}

function LiveBridge({ progress, tl }: { progress: MotionValue<number>; tl: Timeline }) {
  const heartT = useTransform(progress, (p) => heartAt(p * tl.total, tl));
  const x = useTransform(heartT, heartX);
  const y = useTransform(heartT, heartY);
  const hop = useTransform(heartT, hopAt);
  const scale = useTransform(progress, (p) => 1 + 0.18 * ramp(p * tl.total, tl.finale - tl.hw, tl.finale));

  return (
    <BridgeArt
      planks={PLANK_D.map((d, index) => (
        <LivePlank key={d} d={d} index={index} progress={progress} tl={tl} />
      ))}
    >
      <HeartMarker x={x} y={y} hop={hop} scale={scale} />
    </BridgeArt>
  );
}

// ── Static tier (reduced motion / very short viewports) ───────────────────

const HEART_HOME = HEART_T[HEART_T.length - 1];

function StaticBridge() {
  return (
    <BridgeArt planks={PLANK_D.map((d) => <PlankPaths key={d} d={d} coral={0} teal={1} />)}>
      <HeartMarker x={heartX(HEART_HOME)} y={heartY(HEART_HOME)} hop={0} scale={1} />
    </BridgeArt>
  );
}

function JourneyStatic({ className }: { className?: string }) {
  return (
    <div className={cn("bg-linear-to-b from-rose-50 to-teal-50 pb-20 sm:pb-24", className)}>
      <div className="mx-auto max-w-3xl px-4 sm:px-6">
        <div className="relative">
          <span
            aria-hidden="true"
            className="absolute bottom-8 left-5 top-8 w-0.5 -translate-x-1/2 rounded-full bg-linear-to-b from-brand-coral-light to-brand-teal sm:left-6"
          />
          <ol role="list" className="relative space-y-4 sm:space-y-5">
            {JOURNEY_STEPS.map((step, index) => (
              <StaticStep key={step.id} step={step} index={index} />
            ))}
          </ol>
        </div>

        <div className="mt-12 text-center sm:mt-16">
          <p className="text-3xl font-bold tracking-tight text-brand-coral text-balance sm:text-4xl">
            {JOURNEY_COPY.finale}
          </p>
          <p className="mt-2 text-sm font-medium text-teal-800 sm:text-base">{COMPANY.name}</p>
          <div className="relative mx-auto mt-8 h-16 max-w-2xl sm:h-20">
            <StaticBridge />
          </div>
        </div>
      </div>
    </div>
  );
}

function StaticStep({ step, index }: { step: JourneyStep; index: number }) {
  const art = STEP_ART[step.id];
  const src = stepImage(step.id);
  const Icon = art.icon;
  const coral = art.tone === "coral";

  return (
    <li className="relative pl-14 sm:pl-16">
      {/* Decorative numeral: the <ol> already gives screen readers the order */}
      <span
        aria-hidden="true"
        className={cn(
          "absolute left-0 top-5 grid size-10 place-items-center rounded-full text-sm font-bold text-white tabular-nums shadow-sm sm:size-12 sm:text-base",
          coral ? "bg-brand-coral" : "bg-teal-700"
        )}
      >
        {pad(index + 1)}
      </span>
      <div className="rounded-3xl bg-white/90 p-5 shadow-sm ring-1 ring-gray-200/70 sm:p-6">
        <div className="flex items-start gap-4">
          <div className="min-w-0 flex-1">
            <h3 className="text-lg font-semibold text-gray-900 text-balance sm:text-xl">{step.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-gray-600 text-pretty sm:text-base">{step.description}</p>
            <ParentRoleChip text={step.parentRole} className="mt-4" />
          </div>
          {src ? (
            <div className="relative hidden size-16 shrink-0 overflow-hidden rounded-2xl sm:block">
              <Image src={src} alt="" fill sizes="64px" className="object-cover" />
            </div>
          ) : (
            <span
              aria-hidden="true"
              className={cn(
                "hidden size-12 shrink-0 place-items-center rounded-2xl sm:grid",
                coral ? "bg-brand-coral-tint text-brand-coral" : "bg-teal-50 text-teal-700"
              )}
            >
              <Icon className="size-6" />
            </span>
          )}
        </div>
      </div>
    </li>
  );
}
