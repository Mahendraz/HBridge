"use client"

import React, { useEffect, useId, useMemo, useRef, useState } from "react"
import { motion } from "motion/react"
import { cn } from "@/lib/utils"

interface DotPatternProps extends React.SVGProps<SVGSVGElement> {
  width?: number
  height?: number
  x?: number
  y?: number
  cx?: number
  cy?: number
  cr?: number
  className?: string
  glow?: boolean
  [key: string]: unknown
}

export function DotPattern({
  width = 16,
  height = 16,
  x = 0,
  y = 0,
  cx = 1,
  cy = 1,
  cr = 1,
  className,
  glow = false,
  ...props
}: DotPatternProps) {
  const id = useId()
  const containerRef = useRef<SVGSVGElement>(null)
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 })

  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const { width, height } = containerRef.current.getBoundingClientRect()
        setDimensions({ width, height })
      }
    }
    updateDimensions()
    window.addEventListener("resize", updateDimensions)
    return () => window.removeEventListener("resize", updateDimensions)
  }, [])

  const dots = useMemo(
    () =>
      Array.from(
        {
          length:
            Math.ceil(dimensions.width / width) *
            Math.ceil(dimensions.height / height),
        },
        (_, i) => {
          const cols = Math.ceil(dimensions.width / width)
          const col = i % cols
          const row = Math.floor(i / cols)
          return {
            x: col * width + cx + x,
            y: row * height + cy + y,
            // Only the glow variant animates per-dot, so only it needs
            // randomized timing — skip the impure Math.random calls
            // entirely for the (default) static pattern.
            delay: glow ? Math.random() * 5 : 0,
            duration: glow ? Math.random() * 3 + 2 : 0,
          }
        }
      ),
    [dimensions.width, dimensions.height, width, height, cx, cy, x, y, glow]
  )

  return (
    <svg
      ref={containerRef}
      aria-hidden="true"
      className={cn(
        "pointer-events-none absolute inset-0 h-full w-full text-teal-400/30",
        className
      )}
      {...props}
    >
      <defs>
        <radialGradient id={`${id}-gradient`}>
          <stop offset="0%" stopColor="currentColor" stopOpacity="1" />
          <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
        </radialGradient>
      </defs>
      {glow
        ? dots.map((dot) => (
            <motion.circle
              key={`${dot.x}-${dot.y}`}
              cx={dot.x}
              cy={dot.y}
              r={cr}
              fill={`url(#${id}-gradient)`}
              initial={{ opacity: 0.4, scale: 1 }}
              animate={{ opacity: [0.4, 1, 0.4], scale: [1, 1.5, 1] }}
              transition={{
                duration: dot.duration,
                repeat: Infinity,
                repeatType: "reverse",
                delay: dot.delay,
                ease: "easeInOut",
              }}
            />
          ))
        : // Plain (non-animated) circles avoid mounting a Framer Motion
          // component per dot — a dense pattern can be thousands of dots,
          // and motion.circle's tracking overhead per instance is the
          // difference between an instant paint and a visibly heavy mount.
          dots.map((dot) => (
            <circle key={`${dot.x}-${dot.y}`} cx={dot.x} cy={dot.y} r={cr} fill="currentColor" />
          ))}
    </svg>
  )
}
