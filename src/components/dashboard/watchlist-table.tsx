"use client";

import { useState, useMemo, useTransition } from "react";
import Link from "next/link";
import { Trash2, ArrowUpDown, BarChart3 } from "lucide-react";
import { cn, formatNGN, formatVolume } from "@/lib/utils";
import { removeFromWatchlist } from "@/lib/dashboard/actions";
import { MiniSparkline } from "@/components/charts/stock-chart";
import { DashboardCard, EmptyState } from "@/components/dashboard/dashboard-ui";

export interface WatchlistRow {
  ticker: string;
  name: string;
  price: number;
  changePercent: number;
  volume: number;
  sparkline: number[];
}

type SortKey = "ticker" | "name" | "price" | "changePercent" | "volume";
type SortDir = "asc" | "desc";

interface WatchlistTableProps {
  rows: WatchlistRow[];
  selected: Set<string>;
  onSelectionChange: (selected: Set<string>) => void;
}

export function WatchlistTable({ rows, selected, onSelectionChange }: WatchlistTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>("ticker");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [pending, startTransition] = useTransition();

  const sorted = useMemo(() => {
    return [...rows].sort((a, b) => {
      const av = a[sortKey];
      const bv = b[sortKey];
      if (typeof av === "string" && typeof bv === "string") {
        return sortDir === "asc" ? av.localeCompare(bv) : bv.localeCompare(av);
      }
      return sortDir === "asc"
        ? (av as number) - (bv as number)
        : (bv as number) - (av as number);
    });
  }, [rows, sortKey, sortDir]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const toggleSelect = (ticker: string) => {
    const next = new Set(selected);
    if (next.has(ticker)) next.delete(ticker);
    else next.add(ticker);
    onSelectionChange(next);
  };

  const toggleAll = () => {
    if (selected.size === rows.length) onSelectionChange(new Set());
    else onSelectionChange(new Set(rows.map((r) => r.ticker)));
  };

  const handleRemove = (ticker: string) => {
    startTransition(async () => {
      await removeFromWatchlist(ticker);
    });
  };

  const renderSortHeader = (label: string, col: SortKey) => (
    <button
      type="button"
      onClick={() => toggleSort(col)}
      className="inline-flex items-center gap-1 font-semibold text-slate-500 transition-colors hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
    >
      {label}
      <ArrowUpDown className="h-3 w-3" />
    </button>
  );

  if (rows.length === 0) {
    return (
      <DashboardCard>
        <EmptyState
          icon={BarChart3}
          title="Your watchlist is empty"
          description="Search for NGX stocks above to start tracking prices, performance, and AI signals."
        />
      </DashboardCard>
    );
  }

  return (
    <DashboardCard padded={false} className="overflow-hidden">
      <div className="border-b border-slate-100 px-5 py-4 dark:border-slate-800">
        <h2 className="text-sm font-semibold text-slate-950 dark:text-slate-50">
          Watchlist table
        </h2>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          Select two or more stocks to unlock the comparison chart.
        </p>
      </div>
      <div className="overflow-x-auto">
      <table className="w-full min-w-[760px] text-sm">
        <thead className="border-b border-slate-100 bg-slate-50/80 dark:border-slate-800 dark:bg-slate-950/50">
          <tr>
            <th className="px-4 py-3 text-left">
              <input
                type="checkbox"
                checked={selected.size === rows.length && rows.length > 0}
                onChange={toggleAll}
                className="rounded border-slate-300"
              />
            </th>
            <th className="px-4 py-3 text-left">
              {renderSortHeader("Ticker", "ticker")}
            </th>
            <th className="px-4 py-3 text-left">
              {renderSortHeader("Company", "name")}
            </th>
            <th className="px-4 py-3 text-right">
              {renderSortHeader("Price", "price")}
            </th>
            <th className="px-4 py-3 text-right">
              {renderSortHeader("Change", "changePercent")}
            </th>
            <th className="px-4 py-3 text-right">
              {renderSortHeader("Volume", "volume")}
            </th>
            <th className="px-4 py-3 text-center text-xs font-semibold text-slate-500">7D</th>
            <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500">Actions</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((row) => (
            <tr
              key={row.ticker}
              className="border-b border-slate-100 transition-colors duration-100 hover:bg-slate-50/80 last:border-b-0 dark:border-slate-800 dark:hover:bg-slate-950/50"
            >
              <td className="px-4 py-3">
                <input
                  type="checkbox"
                  checked={selected.has(row.ticker)}
                  onChange={() => toggleSelect(row.ticker)}
                  className="rounded border-slate-300"
                />
              </td>
              <td className="px-4 py-3 font-mono font-semibold text-slate-950 dark:text-slate-50">
                {row.ticker}
              </td>
              <td className="max-w-[220px] truncate px-4 py-3 text-slate-500 dark:text-slate-400">
                {row.name}
              </td>
              <td className="px-4 py-3 text-right font-semibold text-slate-900 dark:text-slate-100">
                {formatNGN(row.price)}
              </td>
              <td className="px-4 py-3 text-right">
                <span
                  className={cn(
                    "inline-block rounded-full px-2 py-0.5 text-xs font-medium",
                    row.changePercent >= 0
                      ? "bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-400"
                      : "bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-400"
                  )}
                >
                  {row.changePercent >= 0 ? "+" : ""}
                  {row.changePercent.toFixed(2)}%
                </span>
              </td>
              <td className="px-4 py-3 text-right text-slate-500 dark:text-slate-400">
                {formatVolume(row.volume)}
              </td>
              <td className="px-4 py-3 text-center">
                <MiniSparkline data={row.sparkline.length > 1 ? row.sparkline : [row.price, row.price]} />
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center justify-end gap-2">
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => handleRemove(row.ticker)}
                    className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950"
                    aria-label={`Remove ${row.ticker}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                  <Link
                    href={`/dashboard/stocks/${row.ticker}`}
                    className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 px-2.5 py-1.5 text-xs font-semibold text-[#00A651] transition-colors hover:bg-emerald-100 dark:bg-emerald-950 dark:hover:bg-emerald-900"
                  >
                    <BarChart3 className="h-3.5 w-3.5" />
                    Analyse
                  </Link>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      </div>
    </DashboardCard>
  );
}
