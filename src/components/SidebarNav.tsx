"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const nav = [
  {
    href: "/dashboard",
    label: "Tableau de bord",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="h-[18px] w-[18px]">
        <path d="M12 3l9 8h-3v9h-4v-6H10v6H6v-9H3l9-8z" />
      </svg>
    ),
  },
  {
    href: "/calendar",
    label: "Calendrier",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-[18px] w-[18px]">
        <rect x="3" y="4.5" width="18" height="16" rx="2.5" />
        <path d="M3 9.5h18M8 2.5v4M16 2.5v4" strokeLinecap="round" />
        <rect x="7" y="12.5" width="4" height="4" rx="1" fill="currentColor" stroke="none" />
      </svg>
    ),
  },
  {
    href: "/payslips",
    label: "Bulletins",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-[18px] w-[18px]">
        <path d="M6 2.5h9l4 4v15H6V2.5z" strokeLinejoin="round" />
        <path d="M14.5 2.5v5h5M9 13h7M9 16.5h7" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    href: "/exports",
    label: "Exports",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-[18px] w-[18px]">
        <path d="M12 3v12m0 0l-4.5-4.5M12 15l4.5-4.5M4 17v3.5h16V17" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    href: "/settings",
    label: "Paramètres",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-[18px] w-[18px]">
        <circle cx="12" cy="12" r="3.2" />
        <path d="M19 12a7 7 0 0 0-.14-1.4l2-1.55-2-3.46-2.35.95A7 7 0 0 0 14.1 5.1L13.75 2.6h-3.5L9.9 5.1a7 7 0 0 0-2.42 1.44l-2.35-.95-2 3.46 2 1.55a7 7 0 0 0 0 2.8l-2 1.55 2 3.46 2.35-.95a7 7 0 0 0 2.42 1.44l.35 2.5h3.5l.35-2.5a7 7 0 0 0 2.41-1.44l2.35.95 2-3.46-2-1.55c.1-.46.14-.93.14-1.4z" strokeLinejoin="round" />
      </svg>
    ),
  },
];

export function SidebarNav() {
  const pathname = usePathname();
  return (
    <nav className="mt-6 flex flex-col gap-1">
      {nav.map((n) => {
        const active = pathname === n.href || (n.href === "/dashboard" && pathname === "/");
        return (
          <Link
            key={n.href}
            href={n.href}
            className={`flex items-center gap-3 rounded-xl px-4 py-2.5 text-[13.5px] font-medium transition ${
              active
                ? "bg-[#e3edfb] text-[#1d5dbf]"
                : "text-[#5b6b82] hover:bg-[#f1f5fb] hover:text-[#1e2a3b]"
            }`}
          >
            <span className={active ? "text-[#1d5dbf]" : "text-[#7b8aa0]"}>{n.icon}</span>
            {n.label}
          </Link>
        );
      })}
    </nav>
  );
}
