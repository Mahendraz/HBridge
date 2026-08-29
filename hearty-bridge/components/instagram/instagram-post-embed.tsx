"use client";

import { useEffect } from "react";

declare global {
  interface Window {
    instgrm?: { Embeds: { process: () => void } };
  }
}

const SCRIPT_SRC = "https://www.instagram.com/embed.js";

function loadInstagramEmbedScript(onReady: () => void) {
  if (window.instgrm) {
    onReady();
    return;
  }
  const existing = document.querySelector<HTMLScriptElement>(`script[src="${SCRIPT_SRC}"]`);
  if (existing) {
    existing.addEventListener("load", onReady);
    return;
  }
  const script = document.createElement("script");
  script.src = SCRIPT_SRC;
  script.async = true;
  script.onload = onReady;
  document.body.appendChild(script);
}

interface InstagramPostEmbedProps {
  url: string;
  fallbackLabel?: string;
}

export function InstagramPostEmbed({ url, fallbackLabel }: InstagramPostEmbedProps) {
  useEffect(() => {
    loadInstagramEmbedScript(() => window.instgrm?.Embeds.process());
  }, [url]);

  return (
    <div className="mx-auto w-full max-w-[400px]">
      <blockquote
        className="instagram-media"
        data-instgrm-permalink={`${url}?utm_source=ig_embed&utm_campaign=loading`}
        data-instgrm-version="14"
        style={{
          background: "#FFF",
          border: "1px solid #e5e7eb",
          borderRadius: "12px",
          margin: "0 auto",
          maxWidth: "400px",
          minWidth: "280px",
          width: "100%",
        }}
      >
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="block p-4 text-sm text-gray-500"
        >
          {fallbackLabel ?? "Lihat postingan ini di Instagram"}
        </a>
      </blockquote>
    </div>
  );
}
