"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signIn, signOut } from "next-auth/react";
import {
  BarChart3,
  Home,
  LineChart,
  Newspaper,
  Sparkles,
  Star,
  Briefcase,
  History,
  LogIn,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/layout/theme-toggle";

const publicNav = [
  { href: "/", label: "Home", icon: Home },
  { href: "/stocks", label: "Stocks", icon: BarChart3 },
  { href: "/news", label: "News", icon: Newspaper },
  { href: "/insights", label: "Insights", icon: Sparkles },
];

const authNav = [
  { href: "/watchlist", label: "Watchlist", icon: Star },
  { href: "/portfolio", label: "Portfolio", icon: Briefcase },
  { href: "/history", label: "History", icon: History },
];

export function Header() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-card-bg/90 backdrop-blur-md supports-[backdrop-filter]:bg-card-bg/80">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2">
          <LineChart className="h-7 w-7 text-primary" />
          <span className="text-xl font-bold text-neutral-heading">
            Naija<span className="text-primary">Stocks</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {[...publicNav, ...(session ? authNav : [])].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                pathname === item.href
                  ? "bg-primary/10 text-primary"
                  : "text-neutral-secondary hover:bg-muted hover:text-neutral-heading"
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          {session ? (
            <div className="hidden items-center gap-2 sm:flex">
              <span className="text-sm text-neutral-secondary">
                {session.user?.name || session.user?.email}
              </span>
              <Button variant="ghost" size="sm" onClick={() => signOut()}>
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <Button
              variant="default"
              size="sm"
              onClick={() => signIn()}
              className="hidden sm:flex"
            >
              <LogIn className="h-4 w-4" />
              Sign In
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {mobileOpen && (
        <nav className="border-t border-border px-4 py-3 md:hidden">
          {[...publicNav, ...(session ? authNav : [])].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium",
                pathname === item.href
                  ? "bg-primary/10 text-primary"
                  : "text-neutral-secondary"
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          ))}
          <div className="mt-3 border-t border-border pt-3">
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-neutral-secondary">
              Appearance
            </p>
            <ThemeToggle className="w-full justify-center" />
          </div>
          {!session && (
            <Button
              variant="default"
              size="sm"
              onClick={() => signIn()}
              className="mt-2 w-full"
            >
              Sign In
            </Button>
          )}
        </nav>
      )}
    </header>
  );
}

export function MobileBottomNav() {
  const pathname = usePathname();
  const { data: session } = useSession();

  const items = [
    ...publicNav.slice(0, 4),
    ...(session
      ? [authNav[0]]
      : [{ href: "/auth/signin", label: "Sign In", icon: LogIn }]),
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card-bg md:hidden">
      <div className="flex items-center justify-around py-2">
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex flex-col items-center gap-0.5 px-2 py-1 text-[10px] font-medium",
              pathname === item.href ? "text-primary" : "text-neutral-secondary"
            )}
          >
            <item.icon className="h-5 w-5" />
            {item.label}
          </Link>
        ))}
      </div>
    </nav>
  );
}

export function Footer() {
  return (
    <footer className="border-t border-border bg-card-bg py-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          <div className="flex items-center gap-2">
            <LineChart className="h-5 w-5 text-primary" />
            <span className="font-semibold text-neutral-heading">NaijaStocks</span>
          </div>
          <p className="text-center text-sm text-neutral-secondary">
            Nigerian Stock Exchange analysis platform. Data for educational purposes only.
          </p>
          <p className="text-xs text-neutral-secondary">
            © {new Date().getFullYear()} NaijaStocks
          </p>
        </div>
      </div>
    </footer>
  );
}
