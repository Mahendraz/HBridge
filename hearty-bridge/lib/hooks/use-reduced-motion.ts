"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { useReducedMotion } from "motion/react";

const QUERY = "(prefers-reduced-motion: reduce)";

// motion's useReducedMotion() reads the OS setting once, when the component
// mounts (`null` on the server). This returns the same value on the first
// render, so nothing changes there, and then follows the setting live: turning
// on Reduce Motion mid-visit applies without a reload.
export function useReducedMotionLive(): boolean | null {
  const atMount = useReducedMotion();
  const [live, setLive] = useState<boolean | null>(null);

  useEffect(() => {
    const mql = window.matchMedia(QUERY);
    const onChange = () => setLive(mql.matches);
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  return live ?? atMount;
}

const subscribeNoop = () => () => {};

// For branching markup: `false` during SSR and hydration (so server HTML and
// the first client render match), the live preference afterwards.
export function useReducedMotionSafe(): boolean {
  const reduce = useReducedMotionLive();
  const hydrated = useSyncExternalStore(subscribeNoop, () => true, () => false);
  return hydrated && reduce === true;
}
