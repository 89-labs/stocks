"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatNGN } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { DashboardCard, PanelHeader } from "@/components/dashboard/dashboard-ui";

interface ScreenerResult {
  rank: number;
  ticker: string;
  name: string;
  price: number;
  reasoning: string;
}

interface SavedScreen {
  query: string;
  ranAt: string;
}

export function AiScreener({
  savedScreens,
}: {
  savedScreens: SavedScreen[];
}) {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<ScreenerResult[]>([]);

  const runQuery = async (q: string) => {
    if (!q.trim()) return;
    setLoading(true);
    setResults([]);
    try {
      const res = await fetch("/api/ai/screener", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: q }),
      });
      const data = await res.json();
      setResults(data.results ?? []);
      setQuery(q);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardCard className="sticky top-5">
      <PanelHeader
        title="Stock AI screener"
        description="Describe a screen in plain English and get ranked matches."
      />
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void runQuery(query);
        }}
        className="space-y-3"
      >
        <textarea
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder='e.g. "Show me undervalued banking stocks"'
          rows={3}
          className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition-colors focus:border-[#00A651] focus:bg-white focus:ring-2 focus:ring-[#00A651]/10 dark:border-slate-800 dark:bg-slate-950 dark:focus:bg-slate-900"
        />
        <Button type="submit" disabled={loading || !query.trim()} className="w-full">
          {loading ? "Analysing…" : "Run screener"}
        </Button>
      </form>

      {loading && (
        <div className="mt-4 space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full animate-pulse rounded-xl" />
          ))}
        </div>
      )}

      {!loading && results.length > 0 && (
        <div className="mt-4 space-y-3">
          {results.map((r) => (
            <div
              key={r.ticker}
              className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-950/50"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="mr-2 text-xs font-bold text-primary">#{r.rank}</span>
                  <span className="font-mono font-bold">{r.ticker}</span>
                  <p className="text-xs text-neutral-secondary">{r.name}</p>
                </div>
                <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  {formatNGN(r.price)}
                </span>
              </div>
              <p className="mt-2 text-sm text-neutral-secondary">{r.reasoning}</p>
              <Link
                href={`/dashboard/stocks/${r.ticker}#ai`}
                className="mt-3 inline-flex text-xs font-medium text-primary hover:underline"
              >
                Analyse →
              </Link>
            </div>
          ))}
        </div>
      )}

      {savedScreens.length > 0 && (
        <div className="mt-6 border-t border-slate-200 pt-4 dark:border-slate-700">
          <h3 className="mb-3 text-sm font-semibold text-neutral-heading">Saved screens</h3>
          <ul className="space-y-2">
            {savedScreens.map((s, i) => (
              <li
                key={`${s.query}-${i}`}
                className="flex items-center justify-between gap-2 rounded-lg bg-slate-50 px-3 py-2 dark:bg-slate-800/50"
              >
                <span className="truncate text-xs text-neutral-secondary">{s.query}</span>
                <button
                  type="button"
                  onClick={() => void runQuery(s.query)}
                  className="shrink-0 text-xs font-medium text-primary hover:underline"
                >
                  Re-run
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </DashboardCard>
  );
}

interface SectorCard {
  sector: string;
  changePercent: number;
  signal: "Accumulate" | "Hold" | "Distribute";
  rationale: string;
}

export function SectorSignalsGrid({ sectors }: { sectors: SectorCard[] }) {
  const signalColor = {
    Accumulate: "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400",
    Hold: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
    Distribute: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400",
  };

  return (
    <DashboardCard>
      <PanelHeader
        title="Sector rotation signals"
        description="AI-assisted read on where sector strength is gathering or fading."
      />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {sectors.map((s) => (
          <div
            key={s.sector}
            className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-950/50"
          >
            <div className="flex items-center justify-between">
              <p className="font-semibold text-slate-950 dark:text-slate-50">{s.sector}</p>
              <span
                className={cn(
                  "rounded-full px-2 py-0.5 text-xs font-medium",
                  s.changePercent >= 0 ? "text-green-600" : "text-red-600"
                )}
              >
                {s.changePercent >= 0 ? "+" : ""}
                {s.changePercent.toFixed(2)}%
              </span>
            </div>
            <span
              className={cn(
                "mt-2 inline-block rounded-full px-2 py-0.5 text-xs font-medium",
                signalColor[s.signal]
              )}
            >
              {s.signal}
            </span>
            <p className="mt-2 text-xs text-neutral-secondary">{s.rationale}</p>
          </div>
        ))}
      </div>
    </DashboardCard>
  );
}

export function MacroWatchSection({
  factors,
}: {
  factors: { label: string; value: string; change24h: number; commentary: string }[];
}) {
  return (
    <DashboardCard>
      <PanelHeader
        title="Macro watch"
        description="Key Nigerian market variables and their likely equity-market implications."
      />
      <div className="grid gap-4 sm:grid-cols-3">
        {factors.map((f) => (
          <div
            key={f.label}
            className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-950/50"
          >
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
              {f.label}
            </p>
            <p className="mt-1 text-xl font-semibold text-slate-950 dark:text-slate-50">{f.value}</p>
            {f.change24h !== 0 && (
              <p
                className={cn(
                  "text-xs font-medium",
                  f.change24h >= 0 ? "text-green-600" : "text-red-600"
                )}
              >
                {f.change24h >= 0 ? "+" : ""}
                {f.change24h.toFixed(2)}% (24h)
              </p>
            )}
            <p className="mt-2 text-xs text-neutral-secondary">{f.commentary}</p>
          </div>
        ))}
      </div>
    </DashboardCard>
  );
}
