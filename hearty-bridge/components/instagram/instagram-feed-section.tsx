"use client";

import { InstagramIcon } from "@/components/icons/instagram-icon";
import { SectionHeading } from "@/components/home/section-heading";
import { INSTAGRAM_FEED, SOCIALS } from "@/lib/content/landing";
import { cn } from "@/lib/utils";
import { InstagramPostEmbed } from "./instagram-post-embed";

const INSTAGRAM = SOCIALS.find((s) => s.id === "instagram")!;
const FEATURED_POSTS = INSTAGRAM_FEED.posts;

// Until Instagram's embed.js runs, each post is a <blockquote class="instagram-media">
// holding a plain link. The site CSP (script-src 'self') blocks embed.js, so that
// link is what visitors actually see: these descendant rules turn it into a
// designed tile. When embed.js does run, the blockquote is swapped for an
// iframe and none of this applies.
const FALLBACK_TILE = cn(
  "[&_blockquote>a]:flex [&_blockquote>a]:aspect-[4/5] [&_blockquote>a]:flex-col [&_blockquote>a]:items-start [&_blockquote>a]:justify-end [&_blockquote>a]:gap-3",
  "[&_blockquote>a]:rounded-[11px] [&_blockquote>a]:bg-linear-to-br [&_blockquote>a]:from-brand-coral-tint [&_blockquote>a]:via-white [&_blockquote>a]:to-teal-50 [&_blockquote>a]:p-6",
  "[&_blockquote>a]:text-left [&_blockquote>a]:text-lg [&_blockquote>a]:font-semibold [&_blockquote>a]:leading-snug [&_blockquote>a]:text-gray-900 [&_blockquote>a]:text-balance",
  "[&_blockquote>a]:transition-shadow [&_blockquote>a:hover]:shadow-lg [&_blockquote>a:hover]:shadow-brand-coral/10",
  "[&_blockquote>a:focus-visible]:outline-none [&_blockquote>a:focus-visible]:ring-2 [&_blockquote>a:focus-visible]:ring-brand-coral [&_blockquote>a:focus-visible]:ring-offset-2",
  // eyebrow above the label, call to action below it
  "[&_blockquote>a]:before:mb-auto [&_blockquote>a]:before:rounded-full [&_blockquote>a]:before:border [&_blockquote>a]:before:border-brand-coral-light [&_blockquote>a]:before:bg-white [&_blockquote>a]:before:px-3 [&_blockquote>a]:before:py-1 [&_blockquote>a]:before:text-xs [&_blockquote>a]:before:font-semibold [&_blockquote>a]:before:text-brand-coral",
  // String.raw keeps the backslash (Tailwind's escape for a literal "_") the same
  // in the source Tailwind scans and in the class name rendered at runtime.
  String.raw`[&_blockquote>a]:before:content-['@heartybridge\_']`,
  "[&_blockquote>a]:after:text-sm [&_blockquote>a]:after:font-semibold [&_blockquote>a]:after:text-brand-coral [&_blockquote>a]:after:content-['Buka_di_Instagram_→']"
);

export function InstagramFeedSection() {
  return (
    <section id="instagram" aria-labelledby="instagram-title" className="relative bg-white py-20 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <SectionHeading
          eyebrow={INSTAGRAM.handle}
          title={INSTAGRAM_FEED.title}
          subtitle={`${INSTAGRAM_FEED.contentCount} konten edukasi di ${INSTAGRAM.handle}. ${INSTAGRAM_FEED.subtitleSuffix}`}
          titleId="instagram-title"
        />

        {/* While loading, embed.js positions each iframe absolutely at width 100%
            (with an inline min-width of 326px). Without a positioned ancestor
            that 100% resolved against the whole section and pushed the page
            wider (375px: +16px, 768px: +136px), so the embed's own wrapper
            (<li> > div, max 400px) is made `relative` to contain it. */}
        <ul
          role="list"
          className={cn(
            "mt-12 grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3",
            "[&>li>div]:relative [&_iframe]:min-w-0!",
            FALLBACK_TILE
          )}
        >
          {FEATURED_POSTS.map((post, i) => (
            <li key={post.url} className={cn("min-w-0", i === FEATURED_POSTS.length - 1 && "md:col-span-2 lg:col-span-1")}>
              <InstagramPostEmbed url={post.url} fallbackLabel={post.label} />
            </li>
          ))}
        </ul>

        <div className="mt-12 text-center">
          <a
            href={INSTAGRAM.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-12 items-center gap-2 rounded-full bg-brand-coral px-6 text-sm font-semibold text-white shadow-sm shadow-brand-coral/25 transition-colors hover:bg-[#a81a2d] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-coral focus-visible:ring-offset-2"
          >
            <InstagramIcon className="h-5 w-5" aria-hidden="true" />
            Ikuti {INSTAGRAM.handle} di Instagram
            <span className="sr-only">(membuka tab baru)</span>
          </a>
        </div>
      </div>
    </section>
  );
}
