"use client";

import { useCallback, type PointerEvent } from "react";
import { useSpring } from "motion/react";
import { useFinePointer } from "./use-fine-pointer";
import { useReducedMotionLive } from "./use-reduced-motion";

// F2 — magnetic button: the element leans up to `strength` px toward the
// pointer. Off on touch devices and under prefers-reduced-motion.
export function useMagnetic(strength = 6) {
  const finePointer = useFinePointer();
  const reduce = useReducedMotionLive();
  const enabled = finePointer && !reduce;

  const x = useSpring(0, { stiffness: 300, damping: 20, mass: 0.4 });
  const y = useSpring(0, { stiffness: 300, damping: 20, mass: 0.4 });

  const onPointerMove = useCallback(
    (e: PointerEvent<HTMLElement>) => {
      if (!enabled) return;
      const rect = e.currentTarget.getBoundingClientRect();
      const dx = (e.clientX - (rect.left + rect.width / 2)) / (rect.width / 2);
      const dy = (e.clientY - (rect.top + rect.height / 2)) / (rect.height / 2);
      x.set(Math.max(-1, Math.min(1, dx)) * strength);
      y.set(Math.max(-1, Math.min(1, dy)) * strength);
    },
    [enabled, strength, x, y]
  );

  const onPointerLeave = useCallback(() => {
    x.set(0);
    y.set(0);
  }, [x, y]);

  return {
    style: enabled ? { x, y } : undefined,
    handlers: enabled ? { onPointerMove, onPointerLeave } : {},
  };
}
