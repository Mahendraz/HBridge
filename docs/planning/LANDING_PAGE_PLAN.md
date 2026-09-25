# Landing Page Plan — Hearty Bridge (`/`)

Source content: `docs/COMPANY PROFILE`. Code source of truth: `hearty-bridge/lib/content/landing.ts`
(every fact on the page, the footer, and the JSON-LD reads from that one file).

---

## 1. Web-business brief (5 questions)

| Question | Answer for Hearty Bridge |
|---|---|
| Selling a product, a room to enter, or an area to walk around? | None of them. It sells **trust in a service** (child therapy) delivered at one center in Batam, or at home. |
| How many items, linear or branching? | 8 services (choose one, branching), 6 conditions, 5 team roles. There is also **one linear story**: the 6-step service flow from Intake to Evaluasi. |
| Variants (colour/type)? | None, so category E is skipped. |
| Total assets after compression? | Small. Today there is only the logo and the OG image. Even with every optional illustration below, it stays well under 3 MB. |
| Final action? | **Ask** (WhatsApp, the main one), **book** (lynk.id), **visit** (Google Maps). Schools and communities get a separate **partnership** path. |

## 2. Modules picked (and skipped)

| ID | Module | Where on the page | Why |
|---|---|---|---|
| **A3** | Smooth-scroll page | the whole `/` route | A story or landing page with sections in order. This uses native `scroll-behavior: smooth` + `scroll-margin-top`, which already exist in `globals.css`, instead of Lenis. The Next.js app also hosts the dashboard, parents mostly browse on phones, and the anchor-under-header trap is already solved. |
| **A5 + C7** | One pin, stacked scenes, in-place handoff | `#alur`, the 6-step service flow | This is the one continuous story on the page. Rule Z says a continuous story must not change scenes by scrolling the next section into view. A persistent **bridge** gets built plank by plank as the steps advance, and a heart walks across it (the shared element, C7 pattern 2). The final frame dissolves into the `#fakta` background (C7 pattern 3). |
| **B5** | Position indicator | journey step rail `01–06` + "Langkah 03 / 06" | Parents can see where they are and jump to a step. |
| **B4** | Block input under overlay | inquiry panel | Required with H1. Esc closes it, the page underneath is scroll-locked, and focus is trapped. |
| **C0 + C6** | Exit → swap → enter, short crossfade | `#services` service explorer | Eight services, one detail panel at a time. |
| **D2** | Idle motion | hero chips and shapes | Keeps the hero alive without video. |
| **D3** | Headline rises line by line | hero `<h1>` | A calm, confident entrance. |
| **D5** | CSS ambient particles | Aquatic Therapy panel (bubbles) | Cheap, and it fits the service. |
| **D7** (light) | Colour grading per scene | journey background, rose → teal | Signals progress. |
| **F2** | Magnetic button | primary WhatsApp CTAs | Hover devices only. |
| **F4** | Hero pointer parallax | hero visual layers | Hover devices only. |
| **G3 + G5** | No loader, responsive assets | whole page | Assets are small, and `next/image` handles `srcset`. |
| **H1** | Inquiry panel | opened from every section | Replaces the old contact form that only *pretended* to send. It builds a WhatsApp or email message and never fakes success. |
| **H3** | Per-zone sticky CTA | mobile bottom bar / desktop pill | The label changes per zone ("Konsultasi sekarang", "Tanya layanan ini" for the service selected in the explorer, "Ajukan kerja sama"), next to a direct WhatsApp icon link. It hides on the hero, the pinned journey, `#fakta` (which has its own CTA), contact and the final CTA, and whenever it would cover an in-content CTA (`data-inline-cta`). |
| **H4** | Final CTA | `#mulai` | "Setiap anak berhak tumbuh dengan pelukan." |

**Skipped:**
- **A1/A2/A4 + B1–B3:** the page has no discrete viewport steps.
- **C1–C5:** there is no video or plate footage.
- **D1:** needs layered assets with identical framing.
- **D4:** hotspots need real facility photos. It's a good phase-2 idea for a "ruang terapi" tour.
- **D6, D8, E\*, F1, F3, G1, G2, G4:** don't fit this page.
- **H2 (pricing):** no confirmed prices exist. The old page carried fake prices and a fake insurance claim, and both were removed.

## 3. Page map ← company profile

| # | Section (id) | Background | Content (profile §) |
|---|---|---|---|
| 1 | Hero `#home` | rose-50 → white | Tagline, positioning, trust chips: tanpa rujukan dokter, terapis bersertifikat, bayi–remaja (§1, §2, §7) |
| 2 | Services marquee | rose-50 band | 8 services (§5) |
| 3 | Kondisi `#kondisi` | white | 6 conditions + "Belum yakin? Konsultasi tanpa rujukan" (§6, §7) |
| 4 | Layanan `#services` | gray-50 | Explorer for 8 services. Homecare ±10 km and aquatic pool/screening/safety details (§5, §7) |
| 5 | Alur `#alur` | pinned stage, rose → teal | 6-step flow (§7) |
| 6 | Fakta `#fakta` | teal-50 | ±60 min, 2–3×/week, mostly 1:1, bayi–remaja (§7) |
| 7 | Keunggulan `#keunggulan` | white | 6 reasons (§4) |
| 8 | Tentang `#about` | gray-50 | Story (2023, PT Humanika 2003), milestones, vision & mission (§1–3) |
| 9 | Tim `#tim` | white | 5 roles, Miss Adea (§8) |
| 10 | Kolaborasi `#kolaborasi` | deep teal (the one dark band) | Quotes, goals, 5 forms of cooperation, partnership CTA (§9) |
| 11 | Instagram | white | Existing embeds, "360+ konten edukasi" (§12) |
| 12 | FAQ `#faq` | gray-50 | 8 answers taken word-for-word from §7, plus FAQPage JSON-LD |
| 13 | Kontak `#contact` | white | WhatsApp, email, address + Maps, lynk.id, live open/closed status in WIB, socials (§10–12) |
| 14 | CTA akhir `#mulai` | coral | Closing quote + WhatsApp + booking (§9) |

## 4. Visitor scenarios

1. **Worried parent at night, on a phone, came from Instagram** (e.g. a 2-year-old who isn't talking yet).
   - Hero chip "Tanpa rujukan dokter" → Kondisi "Wicara & Bahasa" → "Konsultasi dulu" opens the panel → WhatsApp opens with the child's age and complaint already written.
   - The contact card shows "Tutup sekarang, buka lagi Senin 09.00", but the message can still be sent.
2. **Parent sent by a teacher** (attention or learning concerns). Wants to know it's credible and what happens.
   - Kondisi "ADHD / Kesulitan Belajar" → Layanan (Psikolog Klinis, Terapi Okupasi) → Alur (6 steps, with the parent's role at each step) → Fakta (60 min, 2–3×/week) → Keunggulan → sticky "Mulai dari Intake Awal".
3. **Busy or distant family.**
   - Layanan → Homecare (±10 km, depends on therapist availability) or Aquatic (pool chosen together, screening first) → "Tanya tentang layanan ini" pre-fills that service.
4. **School, community or partner.**
   - Header/nav → Kolaborasi (the dark band) → "Ajukan kerja sama" opens the panel in partnership mode (institution, form of cooperation).
5. **Existing client.**
   - Header "Masuk", or the hero line "Sudah menjadi klien? Masuk ke platform" → dashboard.

## 5. Images to generate (optional — the page already looks finished without them)

Put the files in `hearty-bridge/public/images/landing/` and set the path in `LANDING_IMAGES` (`lib/content/landing.ts`).

**Generate only illustrations.** Photos of therapists, children, or the building must be **real**: an AI-made "photo" of a clinic misleads parents. Children's photos also need written parental consent (profile note C).

Shared style for all prompts:
> soft flat editorial illustration, warm and calm, rounded shapes, subtle paper grain, palette coral #c41e34, blush #fbe7ea, teal #2fa8a0, mint #f0fdfa, cream background, no text, no logos, diverse Indonesian family, modest clothing, no medical equipment that looks clinical or scary

Generate the journey set **one after another**, using the first image as the style reference, so all 6 match (rule Z: strict registration).

| Slot key | File | Size | Prompt (after the shared style) |
|---|---|---|---|
| `hero` | `hero.webp` | 1600×1200, transparent or cream | a mother hugging her toddler on a small arched wooden bridge, a friendly therapist kneeling beside them offering a colorful stacking toy, soft hearts floating |
| `journeyIntake` | `journey-1-intake.webp` | 1200×1200, transparent | a parent filling a clipboard form at a low table while a toddler plays with blocks nearby |
| `journeyAsesmen` | `journey-2-asesmen.webp` | 1200×1200, transparent | a therapist observing a child stacking cups on a play mat, notebook in hand, gentle smile |
| `journeyHasil` | `journey-3-hasil.webp` | 1200×1200, transparent | a therapist explaining simple picture cards to two parents across a small table, reassuring mood |
| `journeyProgram` | `journey-4-program.webp` | 1200×1200, transparent | a planning board with puzzle pieces, a heart and three small goal flags, a pencil — no readable text |
| `journeyTerapi` | `journey-5-terapi.webp` | 1200×1200, transparent | a child on a therapy swing / balance board, therapist spotting, parent watching and smiling |
| `journeyEvaluasi` | `journey-6-evaluasi.webp` | 1200×1200, transparent | a child climbing three soft steps toward a big heart, a parent cheering, small stars |
| `collaboration` | `collaboration.webp` | 1400×1000, transparent (sits on dark teal) | many hands of different sizes forming an arched bridge, small children walking across, light line-art in mint and blush |
| `finalCta` | `final-cta.webp` | 1200×900, transparent (sits on coral) | a child hugging a parent, simple white/cream line-art with a few blush hearts |

**Real photos to ask the client for** (don't generate these):
- `aboutCenter` (exterior or reception)
- a portrait of each therapist
- the therapy rooms
- therapy activity, only with consent
- the logo as SVG

## 6. Still open with the client (copy is drafted and marked in code)

Everything drafted is marked `needsConfirmation` in `lib/content/landing.ts`:

- the Screening description
- the one-liners for the 6 conditions, and the rename of "Terapi Wicara & Bahasa" to "Wicara & Bahasa"
- the "Peran orang tua" chips in the journey steps
- `WHY_US_COPY.subtitle`
- the visit wording in the contact section and the holiday-hours note (the live "Buka sekarang" badge doesn't know about public holidays)
- the Miss Adea Instagram post label
- **Facebook page URL** is missing. It's rendered as plain text for now.
- **Everything in profile note B**: prices, insurance, methods, therapist credentials, testimonials, the number of families served. None of it is on the page until confirmed.
- **Instagram embeds** render: `proxy.ts` returns early for public routes before it sets the CSP, so `/` has no CSP. The first featured post (`FEATURED_POSTS` in `components/instagram/instagram-feed-section.tsx`) is the center's own parent-testimonial video. It's real content, but the client should confirm they want it featured.
