"use client";

import type { ReactNode } from "react";
import { BlurFade } from "@/components/magicui/blur-fade";

interface PageCtaProps {
  title: string;
  subtitle: string;
  children: ReactNode;
}

export function PageCta({ title, subtitle, children }: PageCtaProps) {
  return (
    <section className="relative overflow-hidden bg-linear-to-b from-rose-50 via-white to-white py-16">
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div className="h-[300px] w-[500px] rounded-full bg-brand-coral-light/20 blur-3xl" />
      </div>
      <div className="relative max-w-3xl mx-auto px-6 text-center">
        <BlurFade delay={0}>
          <h2 className="text-3xl font-bold text-gray-900 mb-4">{title}</h2>
          <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">{subtitle}</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">{children}</div>
        </BlurFade>
      </div>
    </section>
  );
}
