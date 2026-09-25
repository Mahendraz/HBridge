"use client";

import { useRef, type ReactNode } from "react";
import { useInView } from "motion/react";
import { BrainIcon, MessageCircleIcon, PuzzleIcon, UsersIcon, WavesIcon, type LucideIcon } from "lucide-react";
import { BlurFade } from "@/components/magicui/blur-fade";
import { BorderBeam } from "@/components/magicui/border-beam";
import { SectionHeading } from "@/components/home/section-heading";
import { InstagramIcon } from "@/components/icons/instagram-icon";
import { SOCIALS, TEAM_COPY, TEAM_ROLES } from "@/lib/content/landing";
import { cn } from "@/lib/utils";
import { useReducedMotionSafe } from "@/lib/hooks/use-reduced-motion";

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

type TeamRoleId = (typeof TEAM_ROLES)[number]["id"];

const ROLE_ICONS: Record<TeamRoleId, LucideIcon> = {
  psikolog: BrainIcon,
  okupasi: PuzzleIcon,
  wicara: MessageCircleIcon,
  aquatic: WavesIcon,
  koordinator: UsersIcon,
};

export function TeamSection() {
  const reduce = useReducedMotionSafe();
  const instagram = SOCIALS.find((social) => social.id === "instagram");
  // The border beams are JS-driven loops: run them only near the viewport.
  const listRef = useRef<HTMLUListElement>(null);
  const inView = useInView(listRef, { margin: "200px" });

  return (
    <section id="tim" aria-labelledby="tim-title" className="bg-white py-20 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <SectionHeading
          eyebrow={TEAM_COPY.eyebrow}
          title={TEAM_COPY.title}
          subtitle={TEAM_COPY.subtitle}
          tone="teal"
          titleId="tim-title"
        />

        {/* flex-wrap + fixed widths so an incomplete last row stays centered */}
        <ul ref={listRef} className="mt-12 flex flex-wrap justify-center gap-6 sm:mt-14">
          {TEAM_ROLES.map((member, i) => {
            const Icon = ROLE_ICONS[member.id];
            const coral = i % 2 === 0;

            return (
              <li
                key={member.id}
                className="flex w-full md:w-[calc(50%-0.75rem)] lg:w-[calc(33.333%-1rem)] xl:w-[calc(20%-1.2rem)]"
              >
                <Reveal delay={0.06 * i} className="flex w-full">
                  <article className="group relative flex w-full flex-col items-center overflow-hidden rounded-3xl border border-gray-200/80 bg-white px-6 pb-7 pt-8 text-center shadow-sm transition-shadow duration-300 hover:shadow-md">
                    {!reduce && inView && (
                      <BorderBeam
                        colorFrom="#c41e34"
                        colorTo="#2fa8a0"
                        size={70}
                        duration={12}
                        delay={i * 2.4}
                        borderWidth={1.5}
                      />
                    )}

                    <div className="relative">
                      <span
                        aria-hidden="true"
                        className={cn(
                          "absolute -inset-2 rounded-full border border-dashed",
                          coral ? "border-brand-coral-light" : "border-teal-200"
                        )}
                      />
                      <div
                        className={cn(
                          "relative flex h-20 w-20 items-center justify-center rounded-full ring-4 ring-white shadow-sm",
                          coral ? "bg-brand-coral-tint" : "bg-teal-50"
                        )}
                      >
                        <Icon
                          aria-hidden="true"
                          className={cn("h-9 w-9", coral ? "text-brand-coral" : "text-teal-700")}
                          strokeWidth={1.75}
                        />
                      </div>
                    </div>

                    <h3 className="mt-6 text-lg font-semibold leading-snug text-gray-900 text-balance">
                      {member.name && (
                        <span className="mb-1 block text-sm font-semibold text-brand-coral">{member.name}</span>
                      )}
                      <span className="block">{member.role}</span>
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-gray-600 text-pretty">{member.focus}</p>
                  </article>
                </Reveal>
              </li>
            );
          })}
        </ul>

        {instagram?.url && (
          <Reveal delay={0.1}>
            <p className="mt-10 flex flex-wrap items-center justify-center gap-x-1 text-center text-sm text-gray-600 sm:text-base">
              <span>Kenalan lebih dekat dengan tim kami di</span>
              <a
                href={instagram.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-11 items-center gap-1.5 rounded-md px-1 font-semibold text-brand-coral underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-coral focus-visible:ring-offset-2"
              >
                <InstagramIcon className="h-4 w-4" aria-hidden="true" />
                {instagram.handle}
                <span className="sr-only">(Instagram, membuka tab baru)</span>
              </a>
            </p>
          </Reveal>
        )}
      </div>
    </section>
  );
}
