"use client";

import { useEffect, useRef, useState } from "react";
import { formatNumber, type NumberFormat } from "@/lib/format";

/**
 * Animated count-up for dashboard figures.
 * Accepts a serializable format kind (Server Components cannot pass functions).
 * Respects prefers-reduced-motion: renders the final value immediately.
 */
export function CountUp({
  value,
  kind = "raw",
  duration = 900,
  className,
}: {
  value: number;
  kind?: NumberFormat;
  duration?: number;
  className?: string;
}) {
  const [display, setDisplay] = useState(value);
  const fromRef = useRef(value);
  const frameRef = useRef<number | null>(null);

  useEffect(() => {
    const reduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced || fromRef.current === value) {
      fromRef.current = value;
      setDisplay(value);
      return;
    }

    const from = fromRef.current;
    const start = performance.now();

    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(from + (value - from) * eased);
      if (t < 1) {
        frameRef.current = requestAnimationFrame(tick);
      } else {
        fromRef.current = value;
      }
    };

    frameRef.current = requestAnimationFrame(tick);
    return () => {
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
    };
  }, [value, duration]);

  return <span className={className}>{formatNumber(display, kind)}</span>;
}
