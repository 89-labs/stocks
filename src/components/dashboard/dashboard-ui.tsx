import Link from "next/link";
import type { ComponentType, ReactNode } from "react";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

export function DashboardPageShell({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <main className="flex-1 overflow-y-auto bg-[radial-gradient(circle_at_top_left,rgba(0,166,81,0.08),transparent_26rem),linear-gradient(180deg,#f8fafc_0%,#eef2f7_100%)] dark:bg-[radial-gradient(circle_at_top_left,rgba(0,166,81,0.12),transparent_26rem),linear-gradient(180deg,#020617_0%,#0f172a_100%)]">
      <div
        className={cn(
          "animate-in fade-in mx-auto flex w-full max-w-[1440px] flex-col gap-6 px-4 py-5 duration-200 sm:px-6 lg:px-8",
          className
        )}
      >
        {children}
      </div>
    </main>
  );
}

export function DashboardHeader({
  eyebrow,
  title,
  description,
  actions,
  meta,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
  meta?: ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-[1.35rem] border border-white/70 bg-white/85 p-5 shadow-sm shadow-slate-200/70 backdrop-blur dark:border-slate-800 dark:bg-slate-950/80 dark:shadow-none sm:p-6">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          {eyebrow && (
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#00A651]">
              {eyebrow}
            </p>
          )}
          <h1 className="text-2xl font-semibold tracking-[-0.03em] text-slate-950 dark:text-slate-50 sm:text-3xl">
            {title}
          </h1>
          {description && (
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500 dark:text-slate-400">
              {description}
            </p>
          )}
          {meta && <div className="mt-4">{meta}</div>}
        </div>
        {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
      </div>
    </section>
  );
}

export function DashboardCard({
  children,
  className,
  padded = true,
}: {
  children: ReactNode;
  className?: string;
  padded?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-white/70 bg-white/90 shadow-sm shadow-slate-200/60 backdrop-blur dark:border-slate-800 dark:bg-slate-900/85 dark:shadow-none",
        padded && "p-5",
        className
      )}
    >
      {children}
    </div>
  );
}

export function PanelHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-4 flex items-start justify-between gap-4">
      <div>
        <h2 className="text-sm font-semibold tracking-[-0.01em] text-slate-950 dark:text-slate-50">
          {title}
        </h2>
        {description && (
          <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">
            {description}
          </p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

export function MetricCard({
  label,
  value,
  sub,
  icon: Icon,
  tone = "green",
}: {
  label: string;
  value: string;
  sub?: ReactNode;
  icon?: ComponentType<{ className?: string }>;
  tone?: "green" | "blue" | "amber" | "red" | "slate";
}) {
  const tones = {
    green: "from-emerald-500/12 text-emerald-700 dark:text-emerald-300",
    blue: "from-blue-500/12 text-blue-700 dark:text-blue-300",
    amber: "from-amber-500/14 text-amber-700 dark:text-amber-300",
    red: "from-red-500/12 text-red-700 dark:text-red-300",
    slate: "from-slate-500/10 text-slate-700 dark:text-slate-300",
  };

  return (
    <DashboardCard className={cn("relative overflow-hidden bg-gradient-to-br to-white dark:to-slate-900", tones[tone])}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-slate-400">
            {label}
          </p>
          <p className="mt-3 text-2xl font-semibold tracking-[-0.03em] text-slate-950 dark:text-slate-50">
            {value}
          </p>
          {sub && <div className="mt-2 text-xs text-slate-500 dark:text-slate-400">{sub}</div>}
        </div>
        {Icon && (
          <div className="rounded-xl bg-white/80 p-2 shadow-sm dark:bg-slate-950/60">
            <Icon className="h-4 w-4" />
          </div>
        )}
      </div>
    </DashboardCard>
  );
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionHref,
  actionLabel,
}: {
  icon?: ComponentType<{ className?: string }>;
  title: string;
  description: string;
  actionHref?: string;
  actionLabel?: string;
}) {
  return (
    <div className="flex min-h-[220px] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/70 px-6 py-10 text-center dark:border-slate-700 dark:bg-slate-950/40">
      {Icon && (
        <div className="mb-4 rounded-2xl bg-emerald-50 p-3 text-[#00A651] dark:bg-emerald-950/60">
          <Icon className="h-6 w-6" />
        </div>
      )}
      <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">{title}</h3>
      <p className="mt-1 max-w-sm text-xs leading-5 text-slate-500 dark:text-slate-400">
        {description}
      </p>
      {actionHref && actionLabel && (
        <Link
          href={actionHref}
          className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#00A651] px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-[#008A44]"
        >
          {actionLabel}
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      )}
    </div>
  );
}

export function ToolbarButton({
  children,
  href,
  variant = "secondary",
}: {
  children: ReactNode;
  href?: string;
  variant?: "primary" | "secondary";
}) {
  const className = cn(
    "inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-semibold transition-colors",
    variant === "primary"
      ? "bg-[#00A651] text-white hover:bg-[#008A44]"
      : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
  );

  if (href) {
    return (
      <Link href={href} className={className}>
        {children}
      </Link>
    );
  }

  return (
    <button type="button" className={className}>
      {children}
    </button>
  );
}
