"use client";

import type { ReactNode } from "react";

type Tone = "accent" | "profit" | "premium" | "warning";

const tones: Record<Tone, { icon: string; tint: string; text: string }> = {
  accent: {
    icon: "bg-accent",
    tint: "text-accent",
    text: "text-accent",
  },
  profit: {
    icon: "bg-profit",
    tint: "text-profit",
    text: "text-profit",
  },
  premium: {
    icon: "bg-premium",
    tint: "text-premium",
    text: "text-premium",
  },
  warning: {
    icon: "bg-orange-400",
    tint: "text-orange-500",
    text: "text-orange-500",
  },
};

/**
 * Dashboard stat card — design tokens (bg-card, border) + hover lift.
 * Pass `index` for stagger entrance animation.
 */
export function StatCard({
  title,
  icon,
  tone = "accent",
  index = 0,
  children,
  footer,
}: {
  title: string;
  icon: ReactNode;
  tone?: Tone;
  index?: number;
  children: ReactNode;
  footer?: ReactNode;
}) {
  const t = tones[tone];
  return (
    <div
      style={{ animationDelay: `${index * 70}ms` }}
      className="group rounded-2xl border border-border bg-card p-4 shadow-[0_1px_2px_rgba(16,42,80,0.06)] transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(16,42,80,0.12)] motion-safe:animate-[card-in_450ms_ease-out_both] dark:shadow-none dark:hover:border-white/20"
    >
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-2 text-[12.5px] font-semibold text-card-foreground">
          <span className={`flex h-7 w-7 items-center justify-center rounded-lg text-white ${t.icon}`}>
            {icon}
          </span>
          {title}
        </span>
      </div>
      {children}
      {footer && <div className="mt-1">{footer}</div>}
    </div>
  );
}
