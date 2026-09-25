"use client";

import { motion } from "motion/react";
import {
  ArrowRight,
  BookOpen,
  Compass,
  Heart,
  Infinity as InfinityIcon,
  MessageCircle,
  Smile,
  Sprout,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { BlurFade } from "@/components/magicui/blur-fade";
import { SectionHeading } from "@/components/home/section-heading";
import { useInquiry } from "@/components/home/inquiry-context";
import { WhatsAppIcon } from "@/components/icons/whatsapp-icon";
import { useMagnetic } from "@/lib/hooks/use-magnetic";
import { CONDITIONS, CONDITIONS_COPY, whatsappText, whatsappUrl } from "@/lib/content/landing";
import { cn } from "@/lib/utils";
import { useReducedMotionLive } from "@/lib/hooks/use-reduced-motion";

type ConditionId = (typeof CONDITIONS)[number]["id"];

// Infinity instead of the puzzle piece for ASD: the puzzle symbol is widely
// disliked by autistic self-advocates, and parents notice.
const CONDITION_ICONS: Record<ConditionId, LucideIcon> = {
  asd: InfinityIcon,
  "wicara-bahasa": MessageCircle,
  adhd: Zap,
  "emosi-perilaku": Smile,
  belajar: BookOpen,
  perkembangan: Sprout,
};

const TITLE_ID = "kondisi-title";

// BlurFade spreads extra props after its own `animate`/`transition`, so this
// jumps straight to the final state under prefers-reduced-motion while the
// server/client markup stays identical (no hydration mismatch).
const REDUCED_REVEAL = { animate: "visible", transition: { duration: 0 } } as const;

const FOCUS_RING =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-coral focus-visible:ring-offset-2";

export function ConditionsSection() {
  const reduce = useReducedMotionLive();
  const reveal = reduce ? REDUCED_REVEAL : {};

  return (
    <section id="kondisi" aria-labelledby={TITLE_ID} className="relative overflow-hidden bg-white py-20 sm:py-24">
      {/* Soft brand glows — decorative only */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-32 -top-32 h-80 w-80 rounded-full bg-brand-coral-tint opacity-70 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-40 -left-32 h-96 w-96 rounded-full bg-teal-50 opacity-80 blur-3xl"
      />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
        <SectionHeading
          eyebrow={CONDITIONS_COPY.eyebrow}
          title={CONDITIONS_COPY.title}
          subtitle={CONDITIONS_COPY.subtitle}
          titleId={TITLE_ID}
        />

        <ul role="list" className="mt-12 grid grid-cols-1 gap-4 sm:mt-16 sm:gap-5 md:grid-cols-2 lg:grid-cols-3 lg:gap-6">
          {CONDITIONS.map((condition, index) => {
            const Icon = CONDITION_ICONS[condition.id];
            const coral = index % 2 === 0;
            return (
              <li key={condition.id}>
                <BlurFade inView delay={0.05 * index} className="h-full" {...reveal}>
                  <div className="h-full rounded-3xl border border-gray-200/80 bg-white p-6 shadow-sm transition duration-300 hover:border-gray-300 hover:shadow-md motion-safe:hover:-translate-y-0.5 sm:p-7">
                    <div
                      className={cn(
                        "flex h-12 w-12 items-center justify-center rounded-2xl",
                        coral ? "bg-brand-coral-tint text-brand-coral" : "bg-teal-50 text-teal-700"
                      )}
                    >
                      <Icon className="h-6 w-6" aria-hidden="true" />
                    </div>
                    <h3 className="mt-5 text-lg font-semibold text-gray-900 text-balance">{condition.name}</h3>
                    <p className="mt-2 text-base leading-relaxed text-gray-600 text-pretty">{condition.description}</p>
                  </div>
                </BlurFade>
              </li>
            );
          })}
        </ul>

        <BlurFade inView delay={0.1} className="mt-10 sm:mt-14" {...reveal}>
          <NotSureCallout />
        </BlurFade>
      </div>
    </section>
  );
}

function NotSureCallout() {
  const { open } = useInquiry();
  const magnetic = useMagnetic(6);

  return (
    <div className="relative overflow-hidden rounded-3xl border border-brand-coral/30 bg-brand-coral-tint p-6 sm:p-10">
      <Heart
        aria-hidden="true"
        strokeWidth={1.25}
        className="pointer-events-none absolute -bottom-10 -right-8 h-44 w-44 text-brand-coral/10 sm:h-56 sm:w-56"
      />

      <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between lg:gap-12">
        <div className="flex flex-col gap-4 sm:flex-row sm:gap-5">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white text-brand-coral shadow-sm">
            <Compass className="h-6 w-6" aria-hidden="true" />
          </div>
          <div className="max-w-2xl">
            <h3 className="text-xl font-bold tracking-tight text-gray-900 text-balance sm:text-2xl">
              {CONDITIONS_COPY.notSureTitle}
            </h3>
            <p className="mt-2 text-base leading-relaxed text-gray-700 text-pretty">{CONDITIONS_COPY.notSureBody}</p>
          </div>
        </div>

        <div className="flex shrink-0 flex-col items-stretch gap-2 sm:flex-row sm:items-center sm:gap-4 lg:flex-col lg:items-stretch lg:gap-2">
          <motion.button
            data-inline-cta
            type="button"
            onClick={() => open({ kind: "general" })}
            style={magnetic.style}
            {...magnetic.handlers}
            className={cn(
              "inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-brand-coral px-7 py-3 text-base font-semibold text-white shadow-md shadow-brand-coral/20 transition-[filter,box-shadow] hover:shadow-lg hover:brightness-90",
              FOCUS_RING,
              "focus-visible:ring-offset-brand-coral-tint"
            )}
          >
            {CONDITIONS_COPY.notSureCta}
            <ArrowRight className="h-5 w-5" aria-hidden="true" />
          </motion.button>
          <a
            data-inline-cta
            href={whatsappUrl(whatsappText({ kind: "general" }))}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              "inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-3 text-sm font-medium text-teal-800 underline-offset-4 transition-colors hover:text-teal-900 hover:underline",
              FOCUS_RING,
              "focus-visible:ring-offset-brand-coral-tint"
            )}
          >
            <WhatsAppIcon className="h-4 w-4 shrink-0" />
            atau chat langsung via WhatsApp
            <span className="sr-only"> (membuka tab baru)</span>
          </a>
        </div>
      </div>
    </div>
  );
}
