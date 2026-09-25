"use client";

import { useState, useSyncExternalStore } from "react";
import {
  Brain,
  ClipboardList,
  HeartHandshake,
  House,
  MessageCircle,
  Pause,
  Play,
  Puzzle,
  ScanSearch,
  Waves,
  type LucideIcon,
} from "lucide-react";
import { Marquee } from "@/components/magicui/marquee";
import { SERVICES, type ServiceId } from "@/lib/content/landing";
import { cn } from "@/lib/utils";
import { useReducedMotionLive } from "@/lib/hooks/use-reduced-motion";

// One icon per service, shared by every landing section that lists services.
// NOTE: this module is a client module — import SERVICE_ICONS only from other
// client components ("use client"), never from a Server Component.
export const SERVICE_ICONS: Record<ServiceId, LucideIcon> = {
  asesmen: ClipboardList,
  screening: ScanSearch,
  okupasi: Puzzle,
  wicara: MessageCircle,
  aquatic: Waves,
  homecare: House,
  psikolog: Brain,
  "hero-bridge": HeartHandshake,
};

const noopSubscribe = () => () => {};

// false during SSR and the hydration pass, true afterwards — lets us swap the
// DOM for reduced-motion users without a hydration mismatch.
function useHydrated(): boolean {
  return useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false
  );
}

function ServiceBadge({ id, index }: { id: ServiceId; index: number }) {
  const Icon = SERVICE_ICONS[id];
  const coral = index % 2 === 0;
  return (
    <span
      className={cn(
        "flex size-8 shrink-0 items-center justify-center rounded-full bg-white shadow-sm ring-1",
        coral ? "text-brand-coral ring-rose-100" : "text-teal-700 ring-teal-100"
      )}
    >
      <Icon className="size-4" aria-hidden="true" />
    </span>
  );
}

export function ServicesMarquee({ className }: { className?: string }) {
  const reduce = useReducedMotionLive();
  const hydrated = useHydrated();
  const [paused, setPaused] = useState(false);

  const staticList = hydrated && reduce === true;

  if (staticList) {
    return (
      <div className={cn("border-y border-rose-100 bg-rose-50", className)}>
        <ul className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-x-6 gap-y-3 px-4 py-5 sm:px-6">
          {SERVICES.map((service, i) => (
            <li
              key={service.id}
              className="flex items-center gap-2.5 text-sm font-semibold text-gray-700 sm:text-base"
            >
              <ServiceBadge id={service.id} index={i} />
              {service.name}
            </li>
          ))}
        </ul>
      </div>
    );
  }

  return (
    <div className={cn("relative overflow-hidden border-y border-rose-100 bg-rose-50", className)}>
      {/* Screen readers get the plain list once; the moving copies are decorative. */}
      <ul className="sr-only">
        {SERVICES.map((service) => (
          <li key={service.id}>{service.name}</li>
        ))}
      </ul>

      <Marquee
        pauseOnHover
        aria-hidden="true"
        className={cn(
          "py-4 [--duration:48s] [--gap:1.75rem] sm:py-5",
          "[mask-image:linear-gradient(to_right,transparent,black_6%,black_88%,transparent)]",
          paused && "[&>div]:[animation-play-state:paused]"
        )}
      >
        {SERVICES.map((service, i) => (
          <span key={service.id} className="flex items-center gap-(--gap)">
            <span className="flex items-center gap-2.5 whitespace-nowrap text-sm font-semibold text-gray-700 sm:text-base">
              <ServiceBadge id={service.id} index={i} />
              {service.name}
            </span>
            <span className="size-1.5 shrink-0 rounded-full bg-brand-coral-light" />
          </span>
        ))}
      </Marquee>

      {/* WCAG 2.2.2: auto-moving content needs a pause control. */}
      <button
        type="button"
        onClick={() => setPaused((p) => !p)}
        aria-pressed={paused}
        aria-label="Jeda gerakan daftar layanan"
        className="absolute right-2 top-1/2 flex size-11 -translate-y-1/2 items-center justify-center rounded-full bg-white text-gray-700 shadow-sm ring-1 ring-rose-100 transition-colors hover:text-brand-coral focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-coral focus-visible:ring-offset-2 sm:right-4"
      >
        {paused ? (
          <Play className="size-4" aria-hidden="true" />
        ) : (
          <Pause className="size-4" aria-hidden="true" />
        )}
      </button>
    </div>
  );
}
