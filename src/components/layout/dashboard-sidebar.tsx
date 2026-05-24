"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import {
  BarChart3,
  CandlestickChart,
  ChevronDown,
  ChevronRight,
  LayoutDashboard,
  LogOut,
  Menu,
  Newspaper,
  PanelLeftClose,
  PanelLeftOpen,
  Settings,
  Sparkles,
  X,
} from "lucide-react";
import { createPortal } from "react-dom";
import { useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { useDashboardSidebar } from "@/components/layout/dashboard-sidebar-context";

function CollapsedTooltip({
  label,
  collapsed,
  children,
}: {
  label: string;
  collapsed: boolean;
  children: ReactNode;
}) {
  const triggerRef = useRef<HTMLSpanElement>(null);
  const [visible, setVisible] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0 });

  if (!collapsed) {
    return <>{children}</>;
  }

  const show = () => {
    const rect = triggerRef.current?.getBoundingClientRect();
    if (!rect) return;
    setCoords({
      top: rect.top + rect.height / 2,
      left: rect.right + 10,
    });
    setVisible(true);
  };

  const hide = () => setVisible(false);

  return (
    <>
      <span
        ref={triggerRef}
        className="block w-full"
        onMouseEnter={show}
        onMouseLeave={hide}
        onFocus={show}
        onBlur={hide}
      >
        {children}
      </span>
      {visible &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            role="tooltip"
            style={{
              position: "fixed",
              top: coords.top,
              left: coords.left,
              transform: "translateY(-50%)",
            }}
            className="pointer-events-none z-[200] flex items-center"
          >
            <span className="whitespace-nowrap rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs font-medium text-white shadow-lg dark:border-slate-600 dark:bg-slate-800">
              {label}
            </span>
          </div>,
          document.body
        )}
    </>
  );
}

const NAV_SECTIONS = [
  {
    label: "Market",
    items: [
      { href: "/dashboard", label: "Overview", icon: LayoutDashboard, exact: true },
      { href: "/dashboard/stocks", label: "Stock market", icon: BarChart3, exact: true },
      { href: "/dashboard/stocks/watchlist", label: "My watchlist", icon: CandlestickChart },
      { href: "/news", label: "News", icon: Newspaper },
    ],
  },
  {
    label: "Intelligence",
    items: [{ href: "/dashboard/ai", label: "AI workspace", icon: Sparkles }],
  },
  {
    label: "Account",
    items: [{ href: "/dashboard/settings", label: "Settings", icon: Settings }],
  },
];

function NavLinks({
  collapsed,
  onNavigate,
}: {
  collapsed: boolean;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();

  return (
    <nav className="flex-1 overflow-y-auto overflow-x-hidden px-2 py-4 md:px-3">
      {NAV_SECTIONS.map((section) => (
        <div key={section.label} className="mb-5 last:mb-0">
          {!collapsed && (
            <div className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">
              {section.label}
            </div>
          )}
          {section.items.map(({ href, label, icon: Icon, exact }) => {
            const active = exact ? pathname === href : pathname.startsWith(href);
            return (
              <CollapsedTooltip key={`${section.label}-${label}`} label={label} collapsed={collapsed}>
                <Link
                  href={href}
                  onClick={onNavigate}
                  className={cn(
                    "group mb-1 flex cursor-pointer items-center rounded-xl text-sm transition-colors duration-150",
                    collapsed ? "justify-center px-2 py-2.5" : "gap-3 px-3 py-2.5",
                    active
                      ? "bg-emerald-50 font-semibold text-[#00A651] shadow-sm shadow-emerald-100/70 dark:bg-emerald-950/35 dark:shadow-none"
                      : "text-slate-500 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-900 dark:hover:text-slate-100"
                  )}
                >
                  <Icon
                    className={cn(
                      "h-[17px] w-[17px] shrink-0 transition-colors",
                      active ? "text-[#00A651]" : "text-slate-400 group-hover:text-slate-500"
                    )}
                  />
                  {!collapsed && (
                    <>
                      <span className="min-w-0 flex-1 truncate">{label}</span>
                      {active && <ChevronRight className="h-3.5 w-3.5 text-[#00A651]" />}
                    </>
                  )}
                </Link>
              </CollapsedTooltip>
            );
          })}
        </div>
      ))}
    </nav>
  );
}

function UserSection({ collapsed }: { collapsed: boolean }) {
  const { data: session } = useSession();
  const name = session?.user?.name ?? session?.user?.email ?? "User";
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="border-t border-slate-100 p-3 dark:border-slate-800 md:p-4">
      {!collapsed && (
        <div className="mb-3 rounded-2xl border border-emerald-100 bg-emerald-50/60 p-3 dark:border-emerald-950 dark:bg-emerald-950/20">
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#00A651]">
            Workspace
          </p>
          <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">
            Personal watchlists, AI screens, and portfolio insights.
          </p>
        </div>
      )}
      <CollapsedTooltip label={name} collapsed={collapsed}>
        <div
          className={cn(
            "flex items-center rounded-2xl bg-slate-50 dark:bg-slate-900",
            collapsed ? "justify-center p-2" : "gap-3 p-2.5"
          )}
        >
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-xs font-semibold text-[#00A651] shadow-sm dark:bg-slate-950">
            {initials || "U"}
          </div>
          {!collapsed && (
            <>
              <div className="min-w-0 flex-1">
                <p className="truncate text-left text-sm font-semibold text-slate-900 dark:text-slate-100">
                  {name}
                </p>
                <p className="truncate text-left text-xs text-slate-400">{session?.user?.email}</p>
              </div>
              <ChevronDown className="h-4 w-4 shrink-0 text-slate-400" />
            </>
          )}
        </div>
      </CollapsedTooltip>
      <CollapsedTooltip label="Sign out" collapsed={collapsed}>
        <button
          type="button"
          onClick={() => void signOut({ callbackUrl: "/", redirect: true })}
          className={cn(
            "mt-2 flex w-full items-center rounded-xl text-xs font-semibold text-slate-500 transition-colors duration-150 hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-900 dark:hover:text-slate-100",
            collapsed ? "justify-center px-2 py-2" : "justify-center gap-2 px-3 py-2"
          )}
        >
          <LogOut className="h-3.5 w-3.5" />
          {!collapsed && "Sign out"}
        </button>
      </CollapsedTooltip>
    </div>
  );
}

function SidebarBrand({ collapsed, onNavigate }: { collapsed: boolean; onNavigate?: () => void }) {
  return (
    <CollapsedTooltip label="NaijaStocks" collapsed={collapsed}>
      <Link
        href="/dashboard"
        onClick={onNavigate}
        className={cn(
          "flex min-w-0 items-center gap-3",
          collapsed && "justify-center"
        )}
      >
        <div
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-sm font-bold text-[#00A651] dark:bg-emerald-950/40",
            !collapsed && "hidden"
          )}
        >
          N
        </div>
        {!collapsed && (
          <div className="min-w-0">
            <div className="text-lg font-semibold tracking-[-0.04em] text-[#00A651]">NaijaStocks</div>
            <div className="text-xs font-medium text-slate-400">Investor workspace</div>
          </div>
        )}
      </Link>
    </CollapsedTooltip>
  );
}

function CollapseToggle({ collapsed }: { collapsed: boolean }) {
  const { toggleCollapsed } = useDashboardSidebar();

  return (
    <CollapsedTooltip
      label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
      collapsed={collapsed}
    >
      <button
        type="button"
        onClick={toggleCollapsed}
        className="hidden shrink-0 rounded-xl border border-slate-200 bg-white p-2 text-slate-500 shadow-sm transition-colors duration-150 hover:bg-slate-50 hover:text-slate-900 md:inline-flex dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        {collapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
      </button>
    </CollapsedTooltip>
  );
}

function DesktopSidebar() {
  const { collapsed } = useDashboardSidebar();

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-30 hidden h-screen flex-col border-r border-white/70 bg-white/95 backdrop-blur transition-[width] duration-300 ease-in-out dark:border-slate-800 dark:bg-slate-950/95 md:flex",
        collapsed ? "w-20" : "w-[272px]"
      )}
    >
      <div
        className={cn(
          "flex shrink-0 items-center border-b border-slate-100 dark:border-slate-800",
          collapsed ? "justify-center px-2 py-4" : "justify-between gap-2 px-4 py-5"
        )}
      >
        <SidebarBrand collapsed={collapsed} />
        {!collapsed && <CollapseToggle collapsed={collapsed} />}
      </div>
      {collapsed && (
        <div className="flex justify-center border-b border-slate-100 px-2 py-2 dark:border-slate-800">
          <CollapseToggle collapsed={collapsed} />
        </div>
      )}
      <NavLinks collapsed={collapsed} />
      <UserSection collapsed={collapsed} />
    </aside>
  );
}

export function DashboardSidebar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  const pageTitle =
    NAV_SECTIONS.flatMap((section) => section.items).find((n) =>
      n.exact ? pathname === n.href : pathname.startsWith(n.href)
    )?.label ?? "Dashboard";

  return (
    <>
      <div className="sticky top-0 z-40 flex h-16 items-center gap-3 border-b border-white/70 bg-white/90 px-4 backdrop-blur md:hidden dark:border-slate-800 dark:bg-slate-950/90">
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          className="rounded-xl border border-slate-200 bg-white p-2 text-slate-600 shadow-sm transition-colors duration-150 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </button>
        <h1 className="text-sm font-semibold text-slate-900 dark:text-slate-100">{pageTitle}</h1>
      </div>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-slate-950/45" onClick={() => setMobileOpen(false)} />
          <aside className="absolute left-0 top-0 flex h-screen w-[272px] flex-col border-r border-slate-100 bg-white shadow-xl dark:border-slate-800 dark:bg-slate-950">
            <div className="flex items-start justify-between border-b border-slate-100 px-5 py-5 dark:border-slate-800">
              <SidebarBrand collapsed={false} onNavigate={() => setMobileOpen(false)} />
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                className="rounded-xl p-1.5 text-slate-500 transition-colors duration-150 hover:bg-slate-50 dark:hover:bg-slate-900"
                aria-label="Close menu"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <NavLinks collapsed={false} onNavigate={() => setMobileOpen(false)} />
            <UserSection collapsed={false} />
          </aside>
        </div>
      )}

      <DesktopSidebar />
    </>
  );
}

export function DashboardMain({ children }: { children: React.ReactNode }) {
  const { sidebarWidth } = useDashboardSidebar();

  return (
    <main
      className="flex min-h-screen min-w-0 flex-1 flex-col overflow-y-auto bg-slate-50 pl-0 transition-[padding-left] duration-300 ease-in-out dark:bg-slate-950 md:pl-(--dashboard-sidebar-pl)"
      style={{ "--dashboard-sidebar-pl": `${sidebarWidth}px` } as React.CSSProperties}
    >
      {children}
    </main>
  );
}
