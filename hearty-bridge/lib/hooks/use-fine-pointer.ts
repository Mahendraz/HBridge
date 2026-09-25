"use client";

import { useSyncExternalStore } from "react";

// True only on devices with a real hover-capable pointer (mouse/trackpad).
// Pointer effects (magnetic buttons, pointer parallax) must be off on touch.
const QUERY = "(hover: hover) and (pointer: fine)";

function subscribe(onChange: () => void) {
  const mql = window.matchMedia(QUERY);
  mql.addEventListener("change", onChange);
  return () => mql.removeEventListener("change", onChange);
}

export function useFinePointer(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(QUERY).matches,
    () => false
  );
}
