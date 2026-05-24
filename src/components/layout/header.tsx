"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signIn, signOut } from "next-auth/react";
import {
  BarChart3,
  Home,
  LayoutDashboard,
  LineChart,
  LogIn,
  LogOut,
  Menu,
  Newspaper,
  Sparkles,
  X,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/layout/theme-toggle";

const EXPLORE_NAV = [
  { href: "/", label: "Home", icon: Home },
  { href: "/stocks", label: "Stocks", icon: BarChart3 },
  { href: "/news", label: "News", icon: Newspaper },
  { href: "/insights", label: "Insights", icon: Sparkles },
] as const;

function isNavActive(href: string, pathname: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

function userInitials(name: string): string {
  return (
    name
      .split(/\s+/)
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "U"
  );
}

function NavPill({
  href,
  label,
  active,
  onNavigate,
}: {
  href: string;
  label: string;
  active: boolean;
  onNavigate?: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onNavigate}
      className={cn(
        "relative rounded-lg px-3.5 py-2 text-sm font-semibold transition-colors duration-150",
        active
          ? "bg-white text-[#00A651] shadow-sm dark:bg-slate-800 dark:text-emerald-400"
          : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
      )}
    >
      {label}
      {active && (
        <span className="absolute bottom-1 left-1/2 h-0.5 w-4 -translate-x-1/2 rounded-full bg-[#00A651] dark:bg-emerald-400" />
      )}
    </Link>
  );
}

function UserChip({ onNavigate }: { onNavigate?: () => void }) {
  const { data: session } = useSession();
  const name = session?.user?.name ?? session?.user?.email ?? "Account";

  return (
    <div className="flex items-center gap-1 rounded-2xl border border-slate-200/80 bg-slate-50/90 p-1 pl-1.5 dark:border-slate-700 dark:bg-slate-900/90">
      <Link
        href="/dashboard/settings"
        onClick={onNavigate}
        className="flex min-w-0 items-center gap-2 rounded-xl py-1 pr-1 transition-colors hover:bg-white/80 dark:hover:bg-slate-800"
      >
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-xs font-bold text-[#00A651] shadow-sm dark:bg-slate-950">
          {userInitials(name)}
        </span>
        <span className="hidden max-w-[7.5rem] truncate text-sm font-medium text-slate-800 dark:text-slate-100 lg:block">
          {name}
        </span>
      </Link>
      <button
        type="button"
        onClick={() => {
          onNavigate?.();
          void signOut({ callbackUrl: "/" });
        }}
        className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-white hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
        aria-label="Sign out"
      >
        <LogOut className="h-4 w-4" />
      </button>
    </div>
  );
}

export function Header() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [mobileOpen, setMobileOpen] = useState(false);
  const closeMobile = () => setMobileOpen(false);
  const inDashboard = pathname.startsWith("/dashboard");

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/70 bg-white/85 backdrop-blur-xl dark:border-slate-800/80 dark:bg-slate-950/85">
      <div className="mx-auto flex h-[4.25rem] max-w-[1440px] items-center gap-3 px-4 sm:gap-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="group flex shrink-0 items-center gap-2.5"
          onClick={closeMobile}
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-[#00A651] shadow-sm ring-1 ring-emerald-100/80 transition-transform group-hover:scale-[1.02] dark:bg-emerald-950/40 dark:ring-emerald-900/50">
            <LineChart className="h-5 w-5" strokeWidth={2.25} />
          </span>
          <span className="hidden text-lg font-semibold tracking-[-0.03em] text-slate-900 dark:text-slate-50 sm:block">
            Naija<span className="text-[#00A651]">Stocks</span>
          </span>
        </Link>

        <nav
          className="hidden flex-1 items-center justify-center md:flex"
          aria-label="Main navigation"
        >
          <div className="flex items-center gap-0.5 rounded-2xl border border-slate-200/80 bg-slate-100/60 p-1 dark:border-slate-800 dark:bg-slate-900/60">
            {EXPLORE_NAV.map((item) => (
              <NavPill
                key={item.href}
                href={item.href}
                label={item.label}
                active={isNavActive(item.href, pathname)}
              />
            ))}
          </div>
        </nav>

        <div className="ml-auto flex items-center gap-2 sm:gap-2.5">
          {session ? (
            <>
              <Link
                href="/dashboard"
                className={cn(
                  "hidden items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-semibold transition-colors sm:inline-flex",
                  inDashboard
                    ? "bg-emerald-50 text-[#00A651] ring-1 ring-emerald-100 dark:bg-emerald-950/50 dark:ring-emerald-900/50"
                    : "bg-[#00A651] text-white shadow-sm shadow-emerald-600/20 hover:bg-[#009648]"
                )}
              >
                <LayoutDashboard className="h-4 w-4" />
                Dashboard
              </Link>
              <ThemeToggle variant="icon" className="hidden sm:inline-flex" />
              <div className="hidden sm:block">
                <UserChip />
              </div>
            </>
          ) : (
            <>
              <ThemeToggle variant="icon" className="hidden sm:inline-flex" />
              <Button
                variant="default"
                size="sm"
                onClick={() => signIn(undefined, { callbackUrl: pathname })}
                className="hidden rounded-xl shadow-sm shadow-emerald-600/15 sm:inline-flex"
              >
                <LogIn className="h-4 w-4" />
                Sign in
              </Button>
            </>
          )}

          <button
            type="button"
            className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200/80 bg-white text-slate-600 shadow-sm transition-colors hover:bg-slate-50 md:hidden dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
            onClick={() => setMobileOpen((open) => !open)}
            aria-expanded={mobileOpen}
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="border-t border-slate-200/80 bg-white px-4 py-4 md:hidden dark:border-slate-800 dark:bg-slate-950">
          <p className="mb-2 px-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">
            Explore
          </p>
          <nav className="space-y-0.5">
            {EXPLORE_NAV.map((item) => {
              const active = isNavActive(item.href, pathname);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={closeMobile}
                  className={cn(
                    "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors",
                    active
                      ? "bg-emerald-50 text-[#00A651] dark:bg-emerald-950/40"
                      : "text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-900"
                  )}
                >
                  <item.icon className="h-4 w-4 shrink-0" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="mt-4 border-t border-slate-100 pt-4 dark:border-slate-800">
            <p className="mb-2 px-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">
              Account
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <ThemeToggle variant="segment" className="flex-1" />
              {session ? (
                <>
                  <Link
                    href="/dashboard"
                    onClick={closeMobile}
                    className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#00A651] px-4 py-2.5 text-sm font-semibold text-white"
                  >
                    <LayoutDashboard className="h-4 w-4" />
                    Dashboard
                  </Link>
                  <button
                    type="button"
                    onClick={() => {
                      closeMobile();
                      void signOut({ callbackUrl: "/" });
                    }}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 dark:border-slate-700 dark:text-slate-300"
                  >
                    <LogOut className="h-4 w-4" />
                    Sign out
                  </button>
                </>
              ) : (
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => signIn(undefined, { callbackUrl: pathname })}
                  className="w-full rounded-xl"
                >
                  <LogIn className="h-4 w-4" />
                  Sign in
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

export function MobileBottomNav() {
  const pathname = usePathname();
  const { data: session } = useSession();

  const items = session
    ? [
        EXPLORE_NAV[0],
        EXPLORE_NAV[1],
        EXPLORE_NAV[2],
        { href: "/dashboard", label: "Workspace", icon: LayoutDashboard },
      ]
    : [
        EXPLORE_NAV[0],
        EXPLORE_NAV[1],
        EXPLORE_NAV[2],
        { href: "/auth/signin", label: "Sign in", icon: LogIn },
      ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-slate-200/80 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-lg md:hidden dark:border-slate-800 dark:bg-slate-950/95">
      <div className="flex items-stretch justify-around">
        {items.map((item) => {
          const active =
            item.href === "/dashboard"
              ? pathname.startsWith("/dashboard")
              : isNavActive(item.href, pathname);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex min-w-0 flex-1 flex-col items-center gap-0.5 px-1 py-2.5 text-[10px] font-semibold transition-colors",
                active ? "text-[#00A651]" : "text-slate-400"
              )}
            >
              <item.icon className={cn("h-5 w-5", active && "stroke-[2.25]")} />
              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

export function Footer() {
  return (
    <footer className="border-t border-slate-200/80 bg-white py-10 dark:border-slate-800 dark:bg-slate-950">
      <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-between gap-6 sm:flex-row sm:items-start">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 text-[#00A651] dark:bg-emerald-950/40">
              <LineChart className="h-4 w-4" />
            </span>
            <div>
              <p className="font-semibold text-slate-900 dark:text-slate-50">NaijaStocks</p>
              <p className="text-xs text-slate-500">NGX research &amp; AI insights</p>
            </div>
          </div>
          <p className="max-w-md text-center text-sm leading-relaxed text-slate-500 sm:text-right">
            Nigerian Stock Exchange analysis platform. Market data is for educational purposes
            only — not investment advice.
          </p>
          <p className="text-xs text-slate-400">© {new Date().getFullYear()} NaijaStocks</p>
        </div>
      </div>
    </footer>
  );
}
