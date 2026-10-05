import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ThemeToggle } from "@/components/ThemeToggle";
import { ReminderBanner } from "@/components/ReminderBanner";
import { SidebarNav } from "@/components/SidebarNav";

function formatTopDate(d: Date) {
  return new Intl.DateTimeFormat("fr-FR", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  })
    .format(d)
    .replace(".", "")
    .replace(/^(\w)/, (m) => m.toUpperCase());
}

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const clerkUser = await currentUser().catch(() => null);
  const firstName = clerkUser?.firstName ?? "Mamoudou";
  const lastName = clerkUser?.lastName ?? "Thiam";
  const fullName = `${firstName} ${lastName}`.trim();
  const initials = `${(firstName[0] ?? "M").toUpperCase()}${(lastName[0] ?? "T").toUpperCase()}`;
  const today = formatTopDate(new Date());

  return (
    <div className="min-h-screen bg-[#eef3f9] font-sans text-[#1e2a3b] antialiased dark:bg-black dark:text-zinc-50">
      <div className="mx-auto flex w-full max-w-[1440px] gap-5 px-4 py-4">
        {/* Sidebar gauche */}
        <aside className="sticky top-4 hidden h-[calc(100vh-2rem)] w-[228px] shrink-0 flex-col rounded-2xl bg-white p-4 shadow-[0_1px_2px_rgba(16,42,80,0.06)] lg:flex dark:bg-zinc-950 dark:shadow-none dark:border dark:border-white/10">
          <Link href="/dashboard" className="flex items-center gap-2.5 px-2 pt-1">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#1d6ff2] text-white">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} className="h-5 w-5">
                <circle cx="12" cy="13" r="8" fill="white" fillOpacity="0.25" stroke="none" />
                <path d="M12 8v5l3.5 2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
            <span className="text-[15px] font-bold tracking-tight text-[#16233a] dark:text-white">Work Tracker</span>
          </Link>

          <SidebarNav />

          <div className="mt-auto flex flex-col gap-3">
            <div className="flex items-center gap-2.5 rounded-xl bg-[#f6f8fc] px-3 py-2.5 dark:bg-white/5">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#1d6ff2] text-[12px] font-bold text-white">
                {initials}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[13px] font-semibold text-[#16233a] dark:text-white">{fullName}</span>
                <span className="block text-[11.5px] text-[#8a97ad]">Employé</span>
              </span>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-3.5 w-3.5 text-[#8a97ad]">
                <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <div className="flex items-center gap-2 rounded-xl border border-[#eef2f7] px-3 py-2.5 text-[12px] text-[#8a97ad] dark:border-white/10">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              En ligne
            </div>
          </div>
        </aside>

        {/* Colonne principale */}
        <div className="min-w-0 flex-1">
          {/* Topbar */}
          <header className="flex items-center gap-3">
            <Link href="/dashboard" className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#1d6ff2] text-white lg:hidden">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} className="h-5 w-5">
                <circle cx="12" cy="12" r="9" />
                <path d="M12 7v5l3 2" strokeLinecap="round" />
              </svg>
            </Link>
            <form action="/dashboard" className="relative max-w-[380px] flex-1">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8a97ad]">
                <circle cx="11" cy="11" r="7" />
                <path d="M20 20l-3.5-3.5" strokeLinecap="round" />
              </svg>
              <input
                name="q"
                placeholder="Rechercher une information, une période, ..."
                className="h-11 w-full rounded-full border border-transparent bg-white pl-10 pr-4 text-[13px] text-[#1e2a3b] shadow-[0_1px_2px_rgba(16,42,80,0.06)] outline-none placeholder:text-[#9aa7bc] focus:border-[#1d6ff2]/40 dark:bg-zinc-950 dark:text-white dark:border-white/10"
              />
            </form>
            <div className="ml-auto flex items-center gap-2.5">
              <button
                type="button"
                title="Notifications"
                className="relative flex h-10 w-10 items-center justify-center rounded-full bg-white text-[#5b6b82] shadow-[0_1px_2px_rgba(16,42,80,0.06)] dark:bg-zinc-950 dark:border dark:border-white/10 dark:text-zinc-300"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-[18px] w-[18px]">
                  <path d="M6 9a6 6 0 1 1 12 0c0 5 2 6 2 6H4s2-1 2-6zM10 20a2 2 0 0 0 4 0" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span className="absolute right-2 top-2 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-red-500 text-[8px] font-bold text-white">
                  2
                </span>
              </button>
              <ThemeToggle />
              <span className="hidden items-center gap-2 rounded-full bg-white px-4 py-2.5 text-[12.5px] font-medium text-[#3d4e68] shadow-[0_1px_2px_rgba(16,42,80,0.06)] sm:flex dark:bg-zinc-950 dark:border dark:border-white/10 dark:text-zinc-300">
                {today}
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-4 w-4 text-[#8a97ad]">
                  <rect x="3" y="4.5" width="18" height="16" rx="2.5" />
                  <path d="M3 9.5h18M8 2.5v4M16 2.5v4" strokeLinecap="round" />
                </svg>
              </span>
            </div>
          </header>

          {/* Nav mobile */}
          <nav className="mt-3 flex gap-1 overflow-x-auto lg:hidden">
            {[
              { href: "/dashboard", label: "Tableau de bord" },
              { href: "/calendar", label: "Calendrier" },
              { href: "/payslips", label: "Bulletins" },
              { href: "/exports", label: "Exports" },
              { href: "/settings", label: "Paramètres" },
            ].map((n) => (
              <Link
                key={n.href}
                href={n.href}
                className="whitespace-nowrap rounded-full bg-white px-4 py-2 text-[13px] font-medium text-[#5b6b82] shadow-sm dark:bg-zinc-950 dark:text-zinc-300 dark:border dark:border-white/10"
              >
                {n.label}
              </Link>
            ))}
          </nav>

          <ReminderBanner />
          {children}
        </div>
      </div>
    </div>
  );
}
