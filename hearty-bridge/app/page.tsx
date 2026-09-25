import type { Metadata } from "next";
import { AuthGuard } from "@/components/auth/auth-guard";
import { InquiryProvider } from "@/components/home/inquiry-context";
import { HeroSection } from "@/components/home/hero-section";
import { ServicesMarquee } from "@/components/home/services-marquee";
import { ConditionsSection } from "@/components/home/conditions-section";
import { ServicesExplorer } from "@/components/home/services-explorer";
import { JourneySection } from "@/components/home/journey-section";
import { SessionFactsSection } from "@/components/home/session-facts-section";
import { WhySection } from "@/components/home/why-section";
import { AboutSection } from "@/components/home/about-section";
import { TeamSection } from "@/components/home/team-section";
import { CollaborationSection } from "@/components/home/collaboration-section";
import { InstagramFeedSection } from "@/components/instagram/instagram-feed-section";
import { FaqSection } from "@/components/home/faq-section";
import { ContactSection } from "@/components/home/contact-section";
import { FinalCtaSection } from "@/components/home/final-cta-section";
import { InquiryPanel } from "@/components/home/inquiry-panel";
import { StickyCta } from "@/components/home/sticky-cta";
import { FAQ } from "@/lib/content/landing";

// Only the landing is canonical "/" (the root layout no longer sets it, so
// /auth/* and /dashboard don't claim to be the home page).
export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

// Built from the same FAQ array the accordion renders, so the structured data
// can never drift from the visible answers. Rendered here (a Server Component)
// so it is in the initial HTML. `<` is escaped so an answer can never close
// the <script> tag early.
const FAQ_JSON_LD = JSON.stringify({
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: FAQ.map((item) => ({
    "@type": "Question",
    name: item.q,
    acceptedAnswer: { "@type": "Answer", text: item.a },
  })),
}).replace(/</g, "\\u003c");

// Public landing page. Every section owns its own <section id>, background,
// padding and container, so nothing here adds wrappers or spacing between them.
//
// Constraints the order depends on:
// - JourneySection pins with `position: sticky`, so no ancestor may set
//   overflow hidden/auto/scroll; SessionFactsSection must follow it directly
//   (its teal-50 background continues the journey's final frame).
// - InquiryPanel and StickyCta are position: fixed overlays; keep them outside
//   any element with a transform or filter.
// - No mobile bottom padding for the sticky bar: it hides over #contact and
//   #mulai (the last two sections) and keeps that zone over the footer, so it
//   never covers the end of the page.
// - AuthGuard renders the sections while auth is still loading
//   (renderWhileLoading), so the whole landing is server-rendered; signed-in
//   visitors are redirected to the dashboard once the check resolves.
export default function Home() {
  return (
    <AuthGuard requireAuth={false} renderWhileLoading>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: FAQ_JSON_LD }} />
      <InquiryProvider>
        <HeroSection />
        <ServicesMarquee />
        <ConditionsSection />
        <ServicesExplorer />
        <JourneySection />
        <SessionFactsSection />
        <WhySection />
        <AboutSection />
        <TeamSection />
        <CollaborationSection />
        <InstagramFeedSection />
        <FaqSection />
        <ContactSection />
        <FinalCtaSection />
        <InquiryPanel />
        <StickyCta />
      </InquiryProvider>
    </AuthGuard>
  );
}
