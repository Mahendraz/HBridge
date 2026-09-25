import Image from "next/image";
import { cn } from "@/lib/utils";

// The only logo file is a 1080×1080 canvas with the full lockup in a thin band
// across the middle, so at icon size it shrinks to a smudge. This crops it to
// the "H in two hands" mark (source box x 84–320, y 305–541) inside a square.
// No `priority`/`preload`/eager loading: next/image's `priority` is deprecated,
// and a non-lazy <img> also gets a <link rel=preload> from React during SSR —
// a 40px logo is not worth a preload on every page.
export function BrandMark({ className }: { className?: string }) {
  return (
    <span aria-hidden="true" className={cn("relative block size-10 shrink-0 overflow-hidden", className)}>
      <Image
        src="/images/logo-heartybridge.png"
        alt=""
        width={256}
        height={256}
        className="absolute max-w-none"
        style={{ width: "457.6%", height: "457.6%", left: "-35.6%", top: "-129.2%" }}
      />
    </span>
  );
}
