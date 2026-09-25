"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { MessageCircleQuestionMarkIcon, PlusIcon } from "lucide-react";
import { BlurFade } from "@/components/magicui/blur-fade";
import { SectionHeading } from "@/components/home/section-heading";
import { WhatsAppIcon } from "@/components/icons/whatsapp-icon";
import { FAQ, whatsappText, whatsappUrl } from "@/lib/content/landing";
import { cn } from "@/lib/utils";
import { useReducedMotionLive } from "@/lib/hooks/use-reduced-motion";

// The FAQPage JSON-LD for these answers is rendered by app/page.tsx (a
// Server Component), so it is in the initial HTML.

const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-coral focus-visible:ring-offset-2";

export function FaqSection() {
  const reduce = useReducedMotionLive();
  // Several answers may be open at once; the first one starts open.
  const [openItems, setOpenItems] = useState<ReadonlySet<number>>(() => new Set([0]));

  const toggle = (index: number) => {
    setOpenItems((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  return (
    <section id="faq" aria-labelledby="faq-title" className="bg-gray-50 py-20 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <SectionHeading
          eyebrow="Pertanyaan Umum"
          title="Yang sering ditanyakan orang tua"
          subtitle="Jawaban singkat untuk hal-hal yang paling sering ditanyakan sebelum memulai."
          tone="teal"
          titleId="faq-title"
        />

        <BlurFade
          inView={!reduce}
          delay={reduce ? 0 : 0.1}
          duration={reduce ? 0 : 0.4}
          className="mx-auto mt-12 max-w-3xl space-y-3"
        >
          {FAQ.map((item, index) => {
            const isOpen = openItems.has(index);
            const questionId = `faq-question-${index}`;
            const answerId = `faq-answer-${index}`;

            return (
              <div
                key={questionId}
                className={cn(
                  "rounded-2xl border bg-white transition-[border-color,box-shadow] duration-300",
                  isOpen ? "border-brand-coral-light shadow-md shadow-brand-coral/5" : "border-gray-200 shadow-sm"
                )}
              >
                <h3 className="text-base font-semibold text-gray-900 sm:text-lg">
                  <button
                    type="button"
                    id={questionId}
                    aria-expanded={isOpen}
                    aria-controls={answerId}
                    onClick={() => toggle(index)}
                    className={cn(
                      "flex min-h-14 w-full items-start gap-3 rounded-2xl px-5 py-4 text-left sm:px-6 sm:py-5",
                      focusRing
                    )}
                  >
                    <span aria-hidden="true" className="mt-0.5 w-6 shrink-0 text-sm font-bold tabular-nums text-brand-coral sm:mt-1">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <span className="flex-1 text-balance">{item.q}</span>
                    <span
                      aria-hidden="true"
                      className={cn(
                        "grid size-8 shrink-0 place-items-center rounded-full transition-colors duration-300",
                        isOpen ? "bg-brand-coral text-white" : "bg-brand-coral-tint text-brand-coral"
                      )}
                    >
                      <PlusIcon className={cn("size-4 transition-transform duration-300", isOpen && "rotate-45")} />
                    </span>
                  </button>
                </h3>

                <motion.div
                  id={answerId}
                  role="region"
                  aria-labelledby={questionId}
                  aria-hidden={!isOpen}
                  inert={!isOpen}
                  initial={false}
                  animate={isOpen ? { height: "auto", opacity: 1 } : { height: 0, opacity: 0 }}
                  transition={
                    reduce
                      ? { duration: 0 }
                      : { height: { duration: 0.35, ease: [0.22, 1, 0.36, 1] }, opacity: { duration: 0.25 } }
                  }
                  className="overflow-hidden"
                >
                  <p className="px-5 pb-5 leading-relaxed text-gray-600 text-pretty sm:pb-6 sm:pl-[3.75rem] sm:pr-16">
                    {item.a}
                  </p>
                </motion.div>
              </div>
            );
          })}
        </BlurFade>

        <BlurFade
          inView={!reduce}
          delay={reduce ? 0 : 0.15}
          duration={reduce ? 0 : 0.4}
          className="mx-auto mt-10 max-w-3xl"
        >
          <div className="flex flex-col items-center gap-5 rounded-3xl border border-teal-100 bg-white p-6 text-center shadow-sm sm:flex-row sm:p-8 sm:text-left">
            <span
              aria-hidden="true"
              className="grid size-12 shrink-0 place-items-center rounded-2xl bg-teal-50 text-teal-700"
            >
              <MessageCircleQuestionMarkIcon className="size-6" />
            </span>
            <div className="flex-1">
              <p className="text-lg font-semibold text-gray-900 text-balance">Masih ada pertanyaan?</p>
              <p className="mt-1 text-gray-600 text-pretty">Tanyakan langsung ke tim kami lewat WhatsApp.</p>
            </div>
            <a
              data-inline-cta
              href={whatsappUrl(whatsappText({ kind: "general" }))}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                "inline-flex min-h-12 w-full shrink-0 items-center justify-center gap-2 rounded-full bg-brand-coral px-6 font-semibold text-white shadow-sm transition-colors hover:bg-[#a8182c] sm:w-auto",
                focusRing
              )}
            >
              <WhatsAppIcon className="size-5" />
              Tanya via WhatsApp
              <span className="sr-only"> (membuka tab baru)</span>
            </a>
          </div>
        </BlurFade>
      </div>
    </section>
  );
}
