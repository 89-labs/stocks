"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { StockSearch } from "@/components/dashboard/stock-search";
import { WatchlistTable, type WatchlistRow } from "@/components/dashboard/watchlist-table";
import { ComparisonSection } from "@/components/dashboard/comparison-section";
import type { ChartSeries } from "@/components/charts/MultiStockChart";
import {
  DashboardHeader,
  DashboardPageShell,
  ToolbarButton,
} from "@/components/dashboard/dashboard-ui";
import { DashboardStocksNav } from "@/components/dashboard/dashboard-stocks-nav";
import { Plus, Search } from "lucide-react";

interface StocksPageClientProps {
  rows: WatchlistRow[];
  initialComparisonSeries: ChartSeries[];
}

export function StocksPageClient({ rows, initialComparisonSeries }: StocksPageClientProps) {
  const router = useRouter();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const selectedTickers = [...selected];

  return (
    <DashboardPageShell>
      <DashboardHeader
        eyebrow="Watchlist"
        title="My watchlist"
        description="Curate the NGX equities you care about, compare performance, and jump into deeper research."
        actions={
          <ToolbarButton href="#stock-search" variant="primary">
            <Plus className="h-3.5 w-3.5" />
            Add stock
          </ToolbarButton>
        }
        meta={
          <div className="flex flex-wrap gap-2 text-xs text-slate-500 dark:text-slate-400">
            <span className="rounded-full bg-slate-100 px-3 py-1 dark:bg-slate-900">
              {rows.length} stocks tracked
            </span>
            <span className="rounded-full bg-slate-100 px-3 py-1 dark:bg-slate-900">
              {selected.size} selected for comparison
            </span>
          </div>
        }
      />

      <DashboardStocksNav />

      <section id="stock-search" className="space-y-4">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
          <Search className="h-3.5 w-3.5 text-[#00A651]" />
          Build your watchlist
        </div>
        <StockSearch onAdded={() => router.refresh()} />
        <WatchlistTable rows={rows} selected={selected} onSelectionChange={setSelected} />
      </section>

      <ComparisonSection tickers={selectedTickers} initialSeries={initialComparisonSeries} />
    </DashboardPageShell>
  );
}
