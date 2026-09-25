"use client";

import Image from "next/image";
import { useRef, useSyncExternalStore } from "react";
import { motion, useInView } from "motion/react";
import { CalendarCheckIcon, HeartIcon } from "lucide-react";
import { BlurFade } from "@/components/magicui/blur-fade";
import { WhatsAppIcon } from "@/components/icons/whatsapp-icon";
import { useMagnetic } from "@/lib/hooks/use-magnetic";
import { COMPANY, CONTACT, FINAL_CTA, LANDING_IMAGES, whatsappUrl } from "@/lib/content/landing";
import { cn } from "@/lib/utils";
import { useReducedMotionLive } from "@/lib/hooks/use-reduced-motion";

// Focus ring that stays visible on the coral band.
const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-brand-coral";

// Decorative hearts floating around the visual.
const HEARTS: Array<{ className: string; size: string; delay: number }> = [
  { className: "-left-10 top-4 sm:-left-16", size: "size-6", delay: 0 },
  { className: "-right-8 top-0 sm:-right-14", size: "size-4", delay: 0.8 },
  { className: "-right-12 bottom-6 sm:-right-20", size: "size-7", delay: 1.6 },
  { className: "-left-6 bottom-0 sm:-left-12", size: "size-3.5", delay: 2.2 },
];

const RINGS = [
  { size: 240, tone: "border-white/30 bg-white/[0.06]" },
  { size: 330, tone: "border-white/20 bg-white/[0.04]" },
  { size: 430, tone: "border-white/15 bg-white/[0.02]" },
  { size: 540, tone: "border-white/10" },
];

// false during SSR and hydration, true afterwards — used to start the ambient
// loops only on the client so the server HTML and first client render match.
const noopSubscribe = () => () => {};
function useHydrated() {
  return useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false
  );
}

function CtaVisual({ animate }: { animate: boolean }) {
  const image = LANDING_IMAGES.finalCta;

  return (
    <div className="relative mx-auto size-36 sm:size-44">
      {/* Soft ripple rings. The wrapper centers with the `translate` property and
          the inner ring breathes with `scale`, so the two never fight; with
          reduced motion the rings simply stay at rest. */}
      <div aria-hidden="true" className="pointer-events-none">
        {RINGS.map((ring, index) => (
          <span
            key={ring.size}
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
            style={{ width: ring.size, height: ring.size }}
          >
            <motion.span
              className={cn("block size-full rounded-full border", ring.tone)}
              animate={animate ? { scale: [1, 0.94, 1] } : undefined}
              transition={
                animate ? { duration: 3.2, repeat: Infinity, ease: "easeInOut", delay: index * 0.18 } : undefined
              }
            />
          </span>
        ))}
      </div>

      {HEARTS.map((heart) => (
        <motion.span
          key={heart.className}
          aria-hidden="true"
          className={cn("pointer-events-none absolute text-white/40", heart.className)}
          animate={animate ? { y: [0, -8, 0], rotate: [0, -6, 0] } : undefined}
          transition={animate ? { duration: 4.5, repeat: Infinity, ease: "easeInOut", delay: heart.delay } : undefined}
        >
          <HeartIcon className={cn(heart.size, "fill-current")} />
        </motion.span>
      ))}

      <div className="relative size-full overflow-hidden rounded-full bg-white shadow-2xl shadow-black/20 ring-8 ring-white/20">
        {image ? (
          <Image src={image} alt="" fill sizes="(min-width: 640px) 176px, 144px" className="object-cover" />
        ) : (
          <div className="grid size-full place-items-center bg-linear-to-br from-white to-brand-coral-tint">
            <Image
              src="/images/logo-heartybridge.png"
              alt=""
              width={120}
              height={120}
              className="size-[86%] object-contain"
            />
          </div>
        )}
      </div>
    </div>
  );
}

export function FinalCtaSection() {
  const reduce = useReducedMotionLive();
  const hydrated = useHydrated();
  const magnetic = useMagnetic(6);
  // The ring/heart loops are JS-driven: run them only near the viewport.
  const sectionRef = useRef<HTMLElement>(null);
  const inView = useInView(sectionRef, { margin: "200px" });

  const reveal = (delay: number) => ({
    inView: !reduce,
    delay: reduce ? 0 : delay,
    duration: reduce ? 0 : 0.55,
  });

  return (
    <section
      ref={sectionRef}
      id="mulai"
      aria-labelledby="mulai-title"
      className="relative isolate overflow-hidden bg-linear-to-br from-brand-coral via-[#b01a2f] to-[#8e1325] py-20 text-white sm:py-24"
    >
      {/* ambient glows, kept to the corners so they never sit behind text */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -left-32 -top-32 size-80 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -bottom-40 -right-24 size-96 rounded-full bg-black/15 blur-3xl" />
        <HeartIcon className="absolute left-[6%] top-[14%] hidden size-10 rotate-[-14deg] fill-current text-white/10 md:block" />
        <HeartIcon className="absolute right-[8%] top-[22%] hidden size-14 rotate-12 fill-current text-white/10 md:block" />
        <HeartIcon className="absolute bottom-[12%] left-[12%] hidden size-8 rotate-6 fill-current text-white/10 lg:block" />
      </div>

      <div className="mx-auto flex max-w-7xl flex-col items-center px-4 text-center sm:px-6">
        <BlurFade {...reveal(0)} className="pt-6 pb-4">
          <CtaVisual animate={hydrated && !reduce && inView} />
        </BlurFade>

        <BlurFade {...reveal(0.15)} className="mt-12 max-w-3xl">
          <h2
            id="mulai-title"
            className="text-3xl font-bold leading-tight tracking-tight text-white text-balance sm:text-4xl lg:text-5xl"
          >
            <span aria-hidden="true">“</span>
            {FINAL_CTA.quote}
            <span aria-hidden="true">”</span>
          </h2>
        </BlurFade>

        <BlurFade {...reveal(0.3)} className="mt-5 max-w-2xl">
          <p className="text-base text-white/90 text-pretty sm:text-lg">{FINAL_CTA.subtitle}</p>
        </BlurFade>

        <BlurFade {...reveal(0.45)} className="mt-9 w-full sm:w-auto">
          <div className="flex w-full flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-center">
            <motion.a
              href={whatsappUrl()}
              target="_blank"
              rel="noopener noreferrer"
              style={magnetic.style}
              {...magnetic.handlers}
              className={cn(
                "inline-flex min-h-14 items-center justify-center gap-2.5 rounded-full bg-white px-7 text-base font-semibold text-brand-coral shadow-lg shadow-black/15 transition-colors hover:bg-brand-coral-tint",
                focusRing
              )}
            >
              <WhatsAppIcon className="size-5" />
              {FINAL_CTA.primary}
              <span className="sr-only"> (membuka tab baru)</span>
            </motion.a>
            <a
              href={CONTACT.bookingUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                "inline-flex min-h-14 items-center justify-center gap-2.5 rounded-full border-2 border-white/85 px-7 text-base font-semibold text-white transition-colors hover:bg-white/10",
                focusRing
              )}
            >
              <CalendarCheckIcon aria-hidden="true" className="size-5" />
              {FINAL_CTA.secondary}
              <span className="sr-only"> (membuka tab baru)</span>
            </a>
          </div>
          <p className="mt-6 text-sm font-medium tracking-wide text-white/90">
            {COMPANY.shortName} · {COMPANY.tagline}
          </p>
        </BlurFade>
      </div>
    </section>
  );
}
