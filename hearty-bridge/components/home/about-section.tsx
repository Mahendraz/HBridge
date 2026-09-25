"use client";

import { useRef, type ReactNode } from "react";
import Image from "next/image";
import { motion, useInView } from "motion/react";
import { CheckIcon, MapPinIcon, QuoteIcon } from "lucide-react";
import { BlurFade } from "@/components/magicui/blur-fade";
import { Ripple } from "@/components/magicui/ripple";
import { SectionHeading } from "@/components/home/section-heading";
import { ABOUT, COMPANY, CONTACT, LANDING_IMAGES } from "@/lib/content/landing";
import { cn } from "@/lib/utils";
import { useReducedMotionSafe } from "@/lib/hooks/use-reduced-motion";

// Also pins the final state in CSS so nothing sits hidden before hydration.
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

// ── Brand fallback for the `aboutCenter` image slot ────────────────────────

function HugMotif() {
  const reduce = useReducedMotionSafe();
  // The heartbeat loop only runs while the motif is on (or near) screen.
  const ref = useRef<SVGSVGElement>(null);
  const inView = useInView(ref, { margin: "200px" });

  const heart = (
    <>
      <path
        d="M100 128 C 62 104, 48 82, 60 63 C 72 45, 92 49, 100 65 C 108 49, 128 45, 140 63 C 152 82, 138 104, 100 128 Z"
        fill="#c41e34"
      />
      <path d="M78 70 C 73 76, 72 83, 74 89" fill="none" stroke="#ffffff" strokeWidth="5" strokeLinecap="round" opacity="0.55" />
    </>
  );

  return (
    <svg ref={ref} viewBox="0 0 200 200" className="relative h-auto w-36 sm:w-44" aria-hidden="true" focusable="false">
      {/* soft halo */}
      <circle cx="100" cy="100" r="88" fill="#ffffff" opacity="0.7" />
      {/* two arms cradling the heart, echoing the hands in the logo */}
      <path d="M36 88 C 30 134, 60 164, 96 168" fill="none" stroke="#2fa8a0" strokeWidth="14" strokeLinecap="round" />
      <path d="M164 88 C 170 134, 140 164, 104 168" fill="none" stroke="#f4a3ac" strokeWidth="14" strokeLinecap="round" />
      {reduce || !inView ? (
        heart
      ) : (
        <motion.g
          animate={{ scale: [1, 1.06, 1] }}
          transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut" }}
        >
          {heart}
        </motion.g>
      )}
      {/* the little "spark" strokes from the logo */}
      <g stroke="#f4a3ac" strokeWidth="5" strokeLinecap="round">
        <path d="M150 34 L 156 22" />
        <path d="M162 44 L 174 36" />
        <path d="M140 30 L 139 17" />
      </g>
    </svg>
  );
}

function AboutVisual() {
  const src = LANDING_IMAGES.aboutCenter;

  if (src) {
    return (
      <div className="relative aspect-[4/5] w-full overflow-hidden rounded-3xl shadow-sm ring-1 ring-gray-200 sm:aspect-[16/10] lg:aspect-[4/5]">
        <Image
          src={src}
          alt={`${COMPANY.name}, ${COMPANY.city}`}
          fill
          sizes="(min-width: 1024px) 40vw, 100vw"
          className="object-cover"
        />
      </div>
    );
  }

  return (
    <div className="relative isolate flex aspect-[4/5] w-full flex-col items-center overflow-hidden rounded-3xl bg-gradient-to-br from-brand-coral-tint via-white to-teal-50 p-6 shadow-sm ring-1 ring-gray-200/70 sm:aspect-[16/10] sm:p-8 lg:aspect-[4/5]">
      <span className="absolute left-5 top-5 z-10 inline-flex items-center gap-1.5 rounded-full bg-white/90 px-3 py-1.5 text-xs font-semibold text-gray-700 shadow-sm ring-1 ring-gray-200">
        <MapPinIcon className="h-3.5 w-3.5 text-brand-coral" aria-hidden="true" />
        {COMPANY.city}, {CONTACT.address.region}
      </span>

      <div className="relative flex w-full flex-1 items-center justify-center">
        <Ripple mainCircleSize={170} numCircles={6} mainCircleOpacity={0.5} color="#f4a3ac" />
        <HugMotif />
      </div>

      <div className="relative z-10 flex w-full max-w-[18rem] flex-col items-center">
        <div className="w-full rounded-2xl bg-white px-4 py-3 shadow-sm ring-1 ring-gray-100">
          {/* Crops the square logo file to its name + "Early Intervention Center" lines */}
          <div className="relative aspect-[432/100] w-full">
            <Image
              src="/images/logo-heartybridge.png"
              alt={COMPANY.name}
              fill
              sizes="(min-width: 640px) 288px, 256px"
              className="object-cover object-[50%_35%]"
            />
          </div>
        </div>
        <p className="mt-3 flex w-full overflow-hidden rounded-lg text-sm font-bold tracking-[0.2em] shadow-sm">
          <span className="flex-1 bg-teal-700 px-3 py-2 text-center text-white">{COMPANY.tagline}</span>
          <span className="w-10 shrink-0 bg-brand-coral" aria-hidden="true" />
        </p>
      </div>
    </div>
  );
}

// ── Section ────────────────────────────────────────────────────────────────

export function AboutSection() {
  return (
    <section id="about" aria-labelledby="about-title" className="relative overflow-hidden bg-gray-50 py-20 sm:py-24">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-24 top-10 h-72 w-72 rounded-full bg-brand-coral-tint/70 blur-3xl"
      />
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-16">
          {/* Story + milestones */}
          <div className="lg:col-span-7">
            <SectionHeading eyebrow={ABOUT.eyebrow} title={ABOUT.title} align="left" titleId="about-title" />

            <div className="mt-6 max-w-2xl space-y-4">
              {ABOUT.paragraphs.map((paragraph, i) => (
                <Reveal key={i} delay={0.08 + i * 0.06}>
                  <p className="text-base leading-relaxed text-gray-600 text-pretty sm:text-lg">{paragraph}</p>
                </Reveal>
              ))}
            </div>

            <ul className="mt-10 grid grid-cols-2 gap-3 sm:gap-4">
              {ABOUT.milestones.map((milestone, i) => (
                <li key={milestone.value + milestone.label} className="flex">
                  <Reveal
                    delay={0.12 + i * 0.07}
                    className="relative flex w-full flex-col overflow-hidden rounded-2xl bg-white p-4 shadow-sm ring-1 ring-gray-200/70 sm:p-6"
                  >
                    <span
                      aria-hidden="true"
                      className={cn("absolute inset-x-0 top-0 h-1", i % 2 === 0 ? "bg-brand-coral" : "bg-brand-teal")}
                    />
                    <span className="text-3xl font-bold tracking-tight text-brand-coral tabular-nums sm:text-4xl">
                      {milestone.value}
                    </span>
                    <span className="mt-2 text-sm leading-snug text-gray-600">{milestone.label}</span>
                  </Reveal>
                </li>
              ))}
            </ul>
          </div>

          {/* Image slot / brand card */}
          <Reveal delay={0.1} className="lg:col-span-5 lg:pt-4">
            <AboutVisual />
          </Reveal>
        </div>

        {/* Visi & Misi */}
        <div className="mt-16 grid grid-cols-1 gap-6 lg:mt-20 lg:grid-cols-12">
          <Reveal className="lg:col-span-5">
            <div className="relative h-full overflow-hidden rounded-3xl bg-white p-8 shadow-sm ring-1 ring-gray-200/70 sm:p-10">
              <span aria-hidden="true" className="absolute inset-y-0 left-0 w-1.5 bg-brand-teal" />
              {/* Floated, not absolute: the vision text wraps around the glyph
                  instead of running underneath it. */}
              <QuoteIcon
                aria-hidden="true"
                className="pointer-events-none float-right -mr-2 -mt-2 mb-2 ml-4 h-16 w-16 text-teal-100 sm:-mr-4 sm:-mt-4 sm:h-20 sm:w-20"
              />
              <h3 className="relative text-sm font-semibold uppercase tracking-[0.18em] text-teal-700">Visi</h3>
              <p className="relative mt-4 text-xl font-semibold leading-snug text-gray-900 text-balance sm:text-2xl">
                {ABOUT.vision}
              </p>
            </div>
          </Reveal>

          <Reveal delay={0.08} className="lg:col-span-7">
            <div className="h-full rounded-3xl bg-white p-8 shadow-sm ring-1 ring-gray-200/70 sm:p-10">
              <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-coral">Misi</h3>
              <ul className="mt-5 space-y-4">
                {ABOUT.missions.map((mission) => (
                  <li key={mission} className="flex items-start gap-3">
                    <span
                      aria-hidden="true"
                      className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-coral-tint"
                    >
                      <CheckIcon className="h-3.5 w-3.5 text-brand-coral" strokeWidth={3} />
                    </span>
                    <span className="text-base leading-relaxed text-gray-700">{mission}</span>
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
