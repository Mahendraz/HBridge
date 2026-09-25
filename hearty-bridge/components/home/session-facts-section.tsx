"use client";

import { motion } from "motion/react";
import { ArrowRightIcon, BabyIcon, CalendarDaysIcon, Clock3Icon, UserRoundIcon, type LucideIcon } from "lucide-react";
import { useInquiry } from "@/components/home/inquiry-context";
import { WhatsAppIcon } from "@/components/icons/whatsapp-icon";
import { useMagnetic } from "@/lib/hooks/use-magnetic";
import { HERO, JOURNEY_STEPS, SESSION_FACTS, whatsappText, whatsappUrl } from "@/lib/content/landing";
import { cn } from "@/lib/utils";

type FactId = (typeof SESSION_FACTS)[number]["id"];

const FACT_ICONS: Record<FactId, LucideIcon> = {
  durasi: Clock3Icon,
  frekuensi: CalendarDaysIcon,
  individual: UserRoundIcon,
  usia: BabyIcon,
};

const TITLE_ID = "fakta-title";

const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-coral focus-visible:ring-offset-2 focus-visible:ring-offset-teal-50";

// The band right after the journey. Keep the background exactly bg-teal-50:
// the journey's last pinned frame uses the same class, so the pin releases
// into this section without a visible seam (web-business C7 pattern 3).
export function SessionFactsSection() {
  const { open } = useInquiry();
  const magnetic = useMagnetic(6);

  return (
    <section id="fakta" aria-labelledby={TITLE_ID} className="relative bg-teal-50 py-20 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <h2
          id={TITLE_ID}
          className="mx-auto max-w-2xl text-center text-2xl font-bold tracking-tight text-gray-900 text-balance sm:text-3xl"
        >
          Yang perlu Ayah &amp; Bunda ketahui
        </h2>

        <ul role="list" className="mt-10 grid grid-cols-2 gap-3 sm:mt-12 sm:gap-4 lg:grid-cols-4 lg:gap-5">
          {SESSION_FACTS.map((fact) => {
            const Icon = FACT_ICONS[fact.id];
            return (
              <li
                key={fact.id}
                className="flex flex-col rounded-3xl bg-white p-4 shadow-sm ring-1 ring-teal-100 sm:p-6"
              >
                <span
                  aria-hidden="true"
                  className="grid size-9 place-items-center rounded-xl bg-teal-50 text-teal-700 sm:size-10"
                >
                  <Icon className="size-5" />
                </span>
                <p className="mt-4 sm:mt-5">
                  <span className="block text-3xl font-bold leading-none tracking-tight text-teal-700 tabular-nums sm:text-4xl lg:text-5xl">
                    {fact.value}
                  </span>
                  <span className="mt-2 block text-xs font-semibold uppercase tracking-[0.14em] text-teal-800">
                    {fact.unit}
                  </span>
                </p>
                <p className="mt-3 text-sm leading-snug text-gray-600 text-pretty">{fact.label}</p>
              </li>
            );
          })}
        </ul>

        <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:mt-12 sm:flex-row sm:gap-4">
          <motion.button
            type="button"
            onClick={() => open({ kind: "general" })}
            style={magnetic.style}
            {...magnetic.handlers}
            className={cn(
              focusRing,
              "inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-brand-coral px-7 text-base font-semibold text-white shadow-lg shadow-brand-coral/25 transition-colors hover:bg-[#a8192d] sm:w-auto"
            )}
          >
            {`Mulai dari ${JOURNEY_STEPS[0].title}`}
            <ArrowRightIcon aria-hidden="true" className="size-5" />
          </motion.button>
          <a
            href={whatsappUrl(whatsappText({ kind: "general" }))}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              focusRing,
              "inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-white/70 px-6 text-base font-semibold text-teal-800 ring-1 ring-teal-200 transition-colors hover:bg-white sm:w-auto"
            )}
          >
            <WhatsAppIcon className="size-5 text-teal-700" />
            {HERO.primaryCta}
            <span className="sr-only"> (membuka tab baru)</span>
          </a>
        </div>
      </div>
    </section>
  );
}
