"use client";

import { BlurFade } from "@/components/magicui/blur-fade";
import { cn } from "@/lib/utils";
import { useReducedMotionLive } from "@/lib/hooks/use-reduced-motion";

interface SectionHeadingProps {
  eyebrow: string;
  title: string;
  subtitle?: string;
  tone?: "coral" | "teal";
  align?: "center" | "left";
  className?: string;
  /** id for aria-labelledby on the parent <section> */
  titleId?: string;
}

// Shared eyebrow + h2 + subtitle used by every landing section, so spacing
// and type scale stay identical across the page.
export function SectionHeading({
  eyebrow,
  title,
  subtitle,
  tone = "coral",
  align = "center",
  className,
  titleId,
}: SectionHeadingProps) {
  // Reduced motion: jump straight to the final state. The motion-reduce
  // classes also cover the frame before hydration, when the inline
  // opacity/blur from `initial` is already in the markup.
  const reduce = useReducedMotionLive();
  const staticProps = reduce ? { animate: "visible", transition: { duration: 0 } } : {};

  return (
    <BlurFade
      inView
      {...staticProps}
      className={cn(
        align === "center" ? "text-center mx-auto" : "text-left",
        "max-w-3xl motion-reduce:opacity-100! motion-reduce:transform-none! motion-reduce:filter-none!",
        className
      )}
    >
      <span
        className={cn(
          "inline-flex items-center rounded-full border px-4 py-1.5 text-sm font-semibold mb-4",
          tone === "coral"
            ? "border-brand-coral-light bg-brand-coral-tint text-brand-coral"
            : "border-teal-200 bg-teal-50 text-teal-700"
        )}
      >
        {eyebrow}
      </span>
      <h2 id={titleId} className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl text-balance">
        {title}
      </h2>
      {subtitle && <p className="mt-4 text-base sm:text-lg text-gray-600 text-pretty">{subtitle}</p>}
    </BlurFade>
  );
}
