"use client";

import { BadgeCheck, Blocks, Fingerprint, Heart, Network, Users, type LucideIcon } from "lucide-react";
import { BlurFade } from "@/components/magicui/blur-fade";
import { DotPattern } from "@/components/magicui/dot-pattern";
import { MagicCard } from "@/components/magicui/magic-card";
import { SectionHeading } from "@/components/home/section-heading";
import { useFinePointer } from "@/lib/hooks/use-fine-pointer";
import { WHY_US, WHY_US_COPY } from "@/lib/content/landing";
import { cn } from "@/lib/utils";
import { useReducedMotionLive } from "@/lib/hooks/use-reduced-motion";

type WhyItem = (typeof WHY_US)[number];

const WHY_ICONS: Record<WhyItem["id"], LucideIcon> = {
  profesional: BadgeCheck,
  personal: Fingerprint,
  fungsional: Blocks,
  keluarga: Users,
  kolaborasi: Network,
  lingkungan: Heart,
};

const TITLE_ID = "keunggulan-title";

// See conditions-section: BlurFade lets these props override its own, so the
// reduced-motion branch shows the final state at once with identical markup.
const REDUCED_REVEAL = { animate: "visible", transition: { duration: 0 } } as const;

export function WhySection() {
  const reduce = useReducedMotionLive();
  const finePointer = useFinePointer();
  // MagicCard's spotlight follows the pointer: mouse/trackpad only, never
  // under reduced motion. Touch and SSR get the static card.
  const interactive = finePointer && !reduce;
  const reveal = reduce ? REDUCED_REVEAL : {};

  return (
    <section id="keunggulan" aria-labelledby={TITLE_ID} className="relative overflow-hidden bg-white py-20 sm:py-24">
      {/* Faint dot texture behind the heading, fading out downward */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-[28rem] [mask-image:linear-gradient(to_bottom,black_30%,transparent)]"
      >
        <DotPattern width={22} height={22} cx={1} cy={1} cr={1.1} className="text-teal-600/15" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
        <SectionHeading
          eyebrow={WHY_US_COPY.eyebrow}
          title={WHY_US_COPY.title}
          subtitle={WHY_US_COPY.subtitle}
          tone="teal"
          titleId={TITLE_ID}
        />

        <ol role="list" className="mt-12 grid grid-cols-1 gap-4 sm:mt-16 sm:gap-5 md:grid-cols-2 lg:grid-cols-3 lg:gap-6">
          {WHY_US.map((item, index) => (
            <li key={item.id}>
              <BlurFade inView delay={0.05 * index} className="h-full" {...reveal}>
                {interactive ? (
                  <MagicCard
                    className="h-full rounded-3xl shadow-sm"
                    gradientSize={260}
                    gradientFrom="var(--brand-coral-light)"
                    gradientTo="var(--brand-teal)"
                    gradientColor="var(--brand-coral-tint)"
                    gradientOpacity={0.5}
                  >
                    <WhyCardBody item={item} index={index} />
                  </MagicCard>
                ) : (
                  <div className="h-full rounded-3xl border border-gray-200 bg-white shadow-sm">
                    <WhyCardBody item={item} index={index} />
                  </div>
                )}
              </BlurFade>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

function WhyCardBody({ item, index }: { item: WhyItem; index: number }) {
  const Icon = WHY_ICONS[item.id];
  const coral = index % 2 === 0;

  return (
    <div className="flex h-full flex-col p-6 sm:p-7">
      <div className="flex items-start justify-between gap-4">
        <div
          className={cn(
            "flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl",
            coral ? "bg-brand-coral-tint text-brand-coral" : "bg-teal-50 text-teal-700"
          )}
        >
          <Icon className="h-6 w-6" aria-hidden="true" />
        </div>
        {/* Decorative numeral: the <ol> already gives screen readers the order */}
        <span
          aria-hidden="true"
          className="select-none text-5xl font-bold leading-none tracking-tight tabular-nums text-brand-coral-light sm:text-6xl"
        >
          {String(index + 1).padStart(2, "0")}
        </span>
      </div>
      <h3 className="mt-6 text-lg font-semibold text-gray-900 text-balance">{item.title}</h3>
      <p className="mt-2 text-base leading-relaxed text-gray-600 text-pretty">{item.description}</p>
    </div>
  );
}
