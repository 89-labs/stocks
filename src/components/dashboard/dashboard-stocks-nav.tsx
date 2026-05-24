"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { BarChart3, Star } from "lucide-react";

const TABS = [
  { href: "/dashboard/stocks", label: "All stocks", icon: BarChart3, exact: true },
  { href: "/dashboard/stocks/watchlist", label: "My watchlist", icon: Star, exact: false },
] as const;

export function DashboardStocksNav() {
  const pathname = usePathname();

  return (
    <nav className="flex gap-1 rounded-2xl border border-slate-200/80 bg-white p-1 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      {TABS.map(({ href, label, icon: Icon, exact }) => {
        const active = exact
          ? pathname === href ||
            (href === "/dashboard/stocks" &&
              pathname.startsWith("/dashboard/stocks/") &&
              !pathname.startsWith("/dashboard/stocks/watchlist"))
          : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors sm:flex-none",
              active
                ? "bg-emerald-50 text-[#00A651] dark:bg-emerald-950/40"
                : "text-slate-500 hover:bg-slate-50 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-slate-100"
            )}
          >
            <Icon className="h-4 w-4 shrink-0" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
