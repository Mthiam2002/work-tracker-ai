import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ThemeToggle } from "@/components/ThemeToggle";

const nav = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/calendar", label: "Calendrier" },
  { href: "/payslips", label: "Bulletins" },
  { href: "/settings", label: "Paramètres" },
];

export default async function ProtectedLayout({
    children,
    }: {
    children: React.ReactNode;
    }) {
    const { userId } = await auth();

    if (!userId) {
        redirect("/sign-in");
    }

    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-black">
        <header className="sticky top-0 z-10 border-b border-zinc-200/70 bg-white/80 backdrop-blur dark:border-white/10 dark:bg-black/60">
          <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-3 px-6 py-3">
            <Link href="/dashboard" className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4">
                  <circle cx="12" cy="12" r="9" />
                  <path d="M12 7v5l3 2" strokeLinecap="round" />
                </svg>
              </span>
              <span className="hidden text-[15px] font-semibold tracking-tight sm:inline">Work Tracker</span>
            </Link>
            <nav className="flex items-center gap-1 text-sm">
              {nav.map((n) => (
                <Link
                  key={n.href}
                  href={n.href}
                  className="rounded-full px-3 py-2 font-medium text-zinc-600 transition hover:bg-zinc-100 hover:text-zinc-950 dark:text-zinc-400 dark:hover:bg-white/10 dark:hover:text-white"
                >
                  {n.label}
                </Link>
              ))}
            </nav>
            <ThemeToggle />
          </div>
        </header>
        {children}
      </div>
    );
}
