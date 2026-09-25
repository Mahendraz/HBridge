"use client";

import React from "react";
import { createPortal } from "react-dom";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  ExternalLinkIcon,
  Loader2Icon,
  XIcon,
} from "lucide-react";

export interface LightboxItem {
  key: string;
  url: string;
  fileName: string;
  kind: "image" | "video";
  size?: number;
  /** Video still being transcoded server-side — the raw file may not play everywhere yet. */
  processing?: boolean;
}

function formatSize(bytes: number): string {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / 1024).toFixed(0)} KB`;
}

function LightboxVideo({ item }: { item: LightboxItem }) {
  const [failed, setFailed] = React.useState(false);

  if (failed) {
    return (
      <div className="flex flex-col items-center gap-3 px-8 py-12 text-center text-white/80">
        <p className="text-sm max-w-xs">
          {item.processing
            ? "Video masih dikonversi supaya bisa diputar di semua perangkat. Coba lagi beberapa saat lagi."
            : "Video tidak bisa diputar di browser ini."}
        </p>
        <a
          href={item.url}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-white bg-white/15 hover:bg-white/25 rounded-lg px-3 py-1.5"
        >
          <ExternalLinkIcon className="h-3.5 w-3.5" />
          Buka / unduh file
        </a>
      </div>
    );
  }

  return (
    <video
      src={item.url}
      controls
      autoPlay
      playsInline
      preload="metadata"
      onError={() => setFailed(true)}
      className="block max-w-[92vw] max-h-[80vh] w-auto h-auto bg-black"
    />
  );
}

/**
 * Full-screen viewer for images and videos, with keyboard/arrow navigation.
 * Rendered into document.body so it covers the viewport regardless of the
 * dialog/card it's opened from.
 */
export function Lightbox({
  items,
  startIndex,
  onClose,
}: {
  items: LightboxItem[];
  startIndex: number;
  onClose: () => void;
}) {
  const [idx, setIdx] = React.useState(startIndex);
  const current = items[idx];

  // Keyboard navigation. Capture phase on window + stopPropagation so Escape
  // closes only the lightbox, not the Dialog underneath it (which listens on
  // document).
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") { e.stopPropagation(); onClose(); }
      if (e.key === "ArrowLeft" && idx > 0) setIdx((i) => i - 1);
      if (e.key === "ArrowRight" && idx < items.length - 1) setIdx((i) => i + 1);
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [idx, items.length, onClose]);

  // Lock body scroll while open, restoring whatever was there before (a
  // Dialog underneath may have locked it too)
  React.useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = previous; };
  }, []);

  if (!current || typeof document === "undefined") return null;

  return createPortal(
    // Backdrop — click outside the media to close
    <div
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-black/95 p-4 sm:p-6"
      onClick={onClose}
    >
      {/* Top bar: counter + close */}
      <div
        className="absolute top-0 left-0 right-0 flex items-center justify-between px-4 py-3 sm:px-6"
        onClick={(e) => e.stopPropagation()}
      >
        <span className="text-white/60 text-sm tabular-nums select-none">
          {items.length > 1 ? `${idx + 1} / ${items.length}` : ""}
        </span>
        <div className="flex items-center gap-3">
          <a
            href={current.url}
            target="_blank"
            rel="noreferrer"
            className="text-white/60 hover:text-white transition-colors"
            title="Buka di tab baru"
          >
            <ExternalLinkIcon className="h-5 w-5" />
          </a>
          <button
            onClick={onClose}
            className="text-white/60 hover:text-white transition-colors"
            title="Tutup (Esc)"
          >
            <XIcon className="h-6 w-6" />
          </button>
        </div>
      </div>

      {/* Prev arrow */}
      {idx > 0 && (
        <button
          className="absolute left-2 sm:left-5 top-1/2 -translate-y-1/2 z-10
                     bg-white/10 hover:bg-white/25 active:bg-white/35
                     text-white rounded-full p-2 sm:p-3 transition-colors"
          onClick={(e) => { e.stopPropagation(); setIdx((i) => i - 1); }}
          title="Sebelumnya (←)"
        >
          <ChevronLeftIcon className="h-5 w-5 sm:h-6 sm:w-6" />
        </button>
      )}

      {/* Media card */}
      <div
        className="flex flex-col items-center gap-3 max-w-[92vw] max-h-[88vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative rounded-xl overflow-hidden shadow-2xl ring-1 ring-white/10
                        flex items-center justify-center
                        bg-black/40 max-w-[92vw] max-h-[80vh]">
          {current.kind === "video" ? (
            <LightboxVideo key={current.key} item={current} />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element -- signed R2 URL, not a static/optimizable asset
            <img
              key={current.key}
              src={current.url}
              alt={current.fileName}
              className="block max-w-[92vw] max-h-[80vh] w-auto h-auto object-contain"
              onError={(e) => {
                (e.target as HTMLImageElement).style.opacity = "0.3";
              }}
            />
          )}
        </div>

        {/* Caption */}
        <div className="flex items-center gap-2 text-center">
          <p className="text-white/70 text-xs sm:text-sm truncate max-w-[80vw]">
            {current.fileName}
          </p>
          {!!current.size && current.size > 0 && (
            <span className="text-white/40 text-xs shrink-0">({formatSize(current.size)})</span>
          )}
          {current.processing && (
            <span className="inline-flex items-center gap-1 text-white/50 text-xs shrink-0">
              <Loader2Icon className="h-3 w-3 animate-spin" />
              dikonversi
            </span>
          )}
        </div>

        {/* Dot strip (shows when multiple items) */}
        {items.length > 1 && (
          <div className="flex gap-1.5 mt-1">
            {items.map((item, i) => (
              <button
                key={item.key}
                onClick={() => setIdx(i)}
                className={`h-1.5 rounded-full transition-all duration-200 ${
                  i === idx
                    ? "bg-white w-5"
                    : "bg-white/35 hover:bg-white/60 w-1.5"
                }`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Next arrow */}
      {idx < items.length - 1 && (
        <button
          className="absolute right-2 sm:right-5 top-1/2 -translate-y-1/2 z-10
                     bg-white/10 hover:bg-white/25 active:bg-white/35
                     text-white rounded-full p-2 sm:p-3 transition-colors"
          onClick={(e) => { e.stopPropagation(); setIdx((i) => i + 1); }}
          title="Berikutnya (→)"
        >
          <ChevronRightIcon className="h-5 w-5 sm:h-6 sm:w-6" />
        </button>
      )}
    </div>,
    document.body
  );
}
