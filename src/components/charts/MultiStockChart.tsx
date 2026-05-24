"use client";

import { useMemo, useState } from "react";
import { useTheme } from "next-themes";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { cn, formatNGN } from "@/lib/utils";
import type { KlineBar } from "@/types/stock";
import type { Timeframe } from "@/types";

export interface ChartSeries {
  ticker: string;
  color: string;
  data: KlineBar[];
}

interface MultiStockChartProps {
  series: ChartSeries[];
  normalise?: boolean;
  timeframes?: Timeframe[];
  activeTimeframe?: Timeframe;
  onTimeframeChange?: (tf: Timeframe) => void;
  loading?: boolean;
  title?: string;
  subtitle?: string;
  mobileSingleSelect?: boolean;
}

function useChartColors() {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  return {
    grid: isDark ? "#334155" : "#e2e8f0",
    axis: isDark ? "#94a3b8" : "#64748b",
    tooltipBg: isDark ? "#1e293b" : "#0f172a",
    tooltipBorder: isDark ? "#334155" : "#1e293b",
  };
}

function formatAxisTime(timestamp: number, intraday: boolean) {
  const d = new Date(timestamp);
  if (intraday) {
    return d.toLocaleTimeString("en-NG", { hour: "2-digit", minute: "2-digit" });
  }
  return d.toLocaleDateString("en-NG", { day: "numeric", month: "short" });
}

export function MultiStockChart({
  series,
  normalise = false,
  timeframes = ["1D", "1W", "1M", "3M", "1Y"],
  activeTimeframe = "1M",
  onTimeframeChange,
  loading = false,
  title = "Portfolio performance",
  subtitle,
  mobileSingleSelect = false,
}: MultiStockChartProps) {
  const chartColors = useChartColors();
  const [hidden, setHidden] = useState<Set<string>>(new Set());
  const [mobileTicker, setMobileTicker] = useState(series[0]?.ticker ?? "");

  const visibleSeries = useMemo(() => {
    let filtered = series.filter((s) => !hidden.has(s.ticker));
    if (mobileSingleSelect && typeof window !== "undefined" && window.innerWidth < 768) {
      filtered = filtered.filter((s) => s.ticker === mobileTicker);
      if (filtered.length === 0 && series[0]) {
        filtered = [series[0]];
      }
    }
    return filtered;
  }, [series, hidden, mobileSingleSelect, mobileTicker]);

  const chartData = useMemo(() => {
    if (visibleSeries.length === 0) return [];

    const timestampSet = new Set<number>();
    for (const s of visibleSeries) {
      for (const bar of s.data) timestampSet.add(bar.timestamp);
    }
    const timestamps = [...timestampSet].sort((a, b) => a - b);

    const startPrices: Record<string, number> = {};
    for (const s of visibleSeries) {
      if (s.data.length > 0) startPrices[s.ticker] = s.data[0].close;
    }

    return timestamps.map((ts) => {
      const row: Record<string, number | string> = { timestamp: ts };
      for (const s of visibleSeries) {
        const bar = s.data.find((b) => b.timestamp === ts);
        if (bar) {
          const val = normalise
            ? (bar.close / (startPrices[s.ticker] || bar.close)) * 100
            : bar.close;
          row[s.ticker] = val;
        }
      }
      return row;
    });
  }, [visibleSeries, normalise]);

  const periodStarts = useMemo(() => {
    const starts: Record<string, number> = {};
    for (const s of visibleSeries) {
      if (s.data.length > 0) starts[s.ticker] = s.data[0].close;
    }
    return starts;
  }, [visibleSeries]);

  const intraday = activeTimeframe === "1D";

  const toggleTicker = (ticker: string) => {
    setHidden((prev) => {
      const next = new Set(prev);
      if (next.has(ticker)) next.delete(ticker);
      else next.add(ticker);
      return next;
    });
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-card-bg">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-neutral-heading">{title}</h2>
          {subtitle && (
            <p className="mt-0.5 text-sm text-neutral-secondary">{subtitle}</p>
          )}
        </div>
        {onTimeframeChange && (
          <div className="flex flex-wrap gap-2">
            {timeframes.map((tf) => (
              <button
                key={tf}
                type="button"
                onClick={() => onTimeframeChange(tf)}
                disabled={loading}
                className={cn(
                  "rounded-full px-3 py-1 text-xs font-medium transition-colors",
                  activeTimeframe === tf
                    ? "bg-primary text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"
                )}
              >
                {tf}
              </button>
            ))}
          </div>
        )}
      </div>

      {mobileSingleSelect && series.length > 1 && (
        <div className="mb-3 md:hidden">
          <select
            value={mobileTicker}
            onChange={(e) => setMobileTicker(e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-input-bg"
          >
            {series.map((s) => (
              <option key={s.ticker} value={s.ticker}>
                {s.ticker}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="relative">
        {loading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center rounded-xl bg-white/60 dark:bg-slate-900/60">
            <span className="text-sm text-neutral-secondary">Updating chart…</span>
          </div>
        )}
        {chartData.length === 0 ? (
          <p className="py-16 text-center text-sm text-neutral-secondary">
            No chart data available.
          </p>
        ) : (
          <ResponsiveContainer width="100%" height={320}>
            <AreaChart data={chartData} margin={{ top: 8, right: 12, left: 4, bottom: 0 }}>
              <defs>
                {visibleSeries.map((s) => (
                  <linearGradient
                    key={s.ticker}
                    id={`portfolio-area-${s.ticker}`}
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop offset="0%" stopColor={s.color} stopOpacity={0.28} />
                    <stop offset="55%" stopColor={s.color} stopOpacity={0.08} />
                    <stop offset="100%" stopColor={s.color} stopOpacity={0} />
                  </linearGradient>
                ))}
              </defs>
              <CartesianGrid strokeDasharray="4 6" stroke={chartColors.grid} vertical={false} />
              <XAxis
                dataKey="timestamp"
                axisLine={false}
                tickLine={false}
                tick={{ fill: chartColors.axis, fontSize: 11 }}
                tickFormatter={(ts) => formatAxisTime(Number(ts), intraday)}
                interval="preserveStartEnd"
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: chartColors.axis, fontSize: 11 }}
                tickFormatter={(v) =>
                  normalise
                    ? `${Number(v).toFixed(0)}`
                    : new Intl.NumberFormat("en-NG", {
                        style: "currency",
                        currency: "NGN",
                        maximumFractionDigits: 0,
                      }).format(Number(v))
                }
                width={80}
              />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (!active || !payload?.length) return null;
                  const ts = Number(label);
                  return (
                    <div
                      className="rounded-lg border p-3 text-xs shadow-lg"
                      style={{
                        backgroundColor: chartColors.tooltipBg,
                        borderColor: chartColors.tooltipBorder,
                        color: "#f8fafc",
                      }}
                    >
                      <p className="mb-2 text-slate-400">
                        {formatAxisTime(ts, intraday)}
                      </p>
                      {payload.map((entry) => {
                        const ticker = String(entry.dataKey);
                        const value = Number(entry.value);
                        const start = periodStarts[ticker] ?? value;
                        const changePct = start ? ((value - start) / start) * 100 : 0;
                        const s = series.find((x) => x.ticker === ticker);
                        return (
                          <div key={ticker} className="flex items-center gap-2 py-0.5">
                            <span
                              className="h-2 w-2 rounded-full"
                              style={{ backgroundColor: s?.color ?? "#fff" }}
                            />
                            <span className="font-medium">{ticker}</span>
                            <span>
                              {normalise
                                ? `${value.toFixed(1)} (${changePct >= 0 ? "+" : ""}${changePct.toFixed(2)}%)`
                                : formatNGN(value)}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  );
                }}
              />
              {visibleSeries.map((s) => (
                <Area
                  key={s.ticker}
                  type="monotone"
                  dataKey={s.ticker}
                  stroke={s.color}
                  strokeWidth={2}
                  fill={`url(#portfolio-area-${s.ticker})`}
                  dot={false}
                  connectNulls
                  animationDuration={300}
                  activeDot={{ r: 4, strokeWidth: 2 }}
                />
              ))}
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      {series.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {series.map((s) => {
            const isHidden = hidden.has(s.ticker);
            return (
              <button
                key={s.ticker}
                type="button"
                onClick={() => toggleTicker(s.ticker)}
                className={cn(
                  "flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium transition-all",
                  isHidden
                    ? "bg-slate-100 text-slate-400 line-through dark:bg-slate-800"
                    : "bg-slate-50 text-slate-700 ring-1 ring-slate-200 dark:bg-slate-800 dark:text-slate-200"
                )}
              >
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: s.color }}
                />
                {s.ticker}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
