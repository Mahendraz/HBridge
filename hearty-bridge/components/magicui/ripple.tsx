import { cn } from "@/lib/utils";

interface RippleProps {
  mainCircleSize?: number;
  mainCircleOpacity?: number;
  numCircles?: number;
  className?: string;
  color?: string;
}

export function Ripple({
  mainCircleSize = 210,
  mainCircleOpacity = 0.24,
  numCircles = 8,
  className,
  color = "#2fa8a0",
}: RippleProps) {
  return (
    <div
      className={cn(
        "pointer-events-none absolute inset-0 select-none [mask-image:linear-gradient(to_bottom,white,transparent)]",
        className
      )}
    >
      {Array.from({ length: numCircles }, (_, i) => {
        const size = mainCircleSize + i * 70;
        const opacity = mainCircleOpacity - i * 0.03;
        const animationDelay = `${i * 0.06}s`;
        const borderStyle = "solid";
        const borderOpacity = 5 + i * 5;

        return (
          <div
            key={i}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-ripple rounded-full border bg-(--ripple-color)/[var(--ripple-bg-opacity)]"
            style={
              {
                width: `${size}px`,
                height: `${size}px`,
                opacity,
                animationDelay,
                borderStyle,
                borderWidth: "1px",
                borderColor: `color-mix(in srgb, ${color} ${borderOpacity}%, transparent)`,
                "--ripple-color": color,
                "--ripple-bg-opacity": "0.02",
              } as React.CSSProperties
            }
          />
        );
      })}
    </div>
  );
}
