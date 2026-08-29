"use client";

import type { ReactNode } from "react";
import { Ripple } from "@/components/magicui/ripple";
import { AnimatedGradientText } from "@/components/magicui/animated-gradient-text";
import { BlurFade } from "@/components/magicui/blur-fade";

interface PageHeroProps {
  badge: string;
  title: string;
  highlight?: string;
  subtitle: string;
  children?: ReactNode;
}

export function PageHero({ badge, title, highlight, subtitle, children }: PageHeroProps) {
  return (
    <section className="relative overflow-hidden bg-linear-to-b from-rose-50 via-white to-white pt-16 pb-20">
      <Ripple mainCircleSize={180} numCircles={6} color="#c41e34" mainCircleOpacity={0.14} />

      <div className="relative mx-auto max-w-4xl px-6 text-center">
        <BlurFade delay={0}>
          <div className="inline-flex items-center gap-2 rounded-full border border-brand-coral-light bg-brand-coral-tint px-4 py-1.5 text-sm font-medium text-brand-coral mb-6">
            <span className="h-1.5 w-1.5 rounded-full bg-brand-coral animate-pulse" />
            {badge}
          </div>
        </BlurFade>

        <BlurFade delay={0.1}>
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl leading-tight">
            {title}
            {highlight && (
              <>
                {" "}
                <AnimatedGradientText
                  colorFrom="#c41e34"
                  colorTo="#f0475a"
                  speed={0.8}
                  className="text-4xl sm:text-5xl font-bold"
                >
                  {highlight}
                </AnimatedGradientText>
              </>
            )}
          </h1>
        </BlurFade>

        <BlurFade delay={0.2}>
          <p className="mt-6 text-lg leading-8 text-gray-600 max-w-2xl mx-auto">
            {subtitle}
          </p>
        </BlurFade>

        {children && (
          <BlurFade delay={0.3}>
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
              {children}
            </div>
          </BlurFade>
        )}
      </div>
    </section>
  );
}
