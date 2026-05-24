"use client";

import { useMemo, useState } from "react";
import { useTheme } from "next-themes";
import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
} from "recharts";
import { cn, formatNGN } from "@/lib/utils";
import {
  indexForecastChartData,
  forecastSummaryStats,
} from "@/lib/charts/forecast-chart-data";
import { StockForecastChart } from "@/components/dashboard/stock-forecast-chart";
import type { PredictionChartSeries } from "@/lib/dashboard/actions";

interface MultiStockPredictionChartProps {
  series: PredictionChartSeries[];
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

function mergeIndexedSeries(items: PredictionChartSeries[]) {
  const labelOrder: string[] = [];
  const labelSet = new Set<string>();
  const indexedByTicker = new Map<string, ReturnType<typeof indexForecastChartData>>();

  for (const item of items) {
    const points = indexForecastChartData(item.forecast);
    indexedByTicker.set(item.ticker, points);
    for (const p of points) {
      if (!labelSet.has(p.label)) {
        labelSet.add(p.label);
        labelOrder.push(p.label);
      }
    }
  }

  const chartData = labelOrder.map((label) => {
    const row: Record<string, number | string | [number, number]> = { label };
    for (const item of items) {
      const pt = indexedByTicker.get(item.ticker)?.find((p) => p.label === label);
      if (!pt) continue;
      if (pt.close != null) row[`${item.ticker}_close`] = pt.close;
      if (pt.base != null) row[`${item.ticker}_base`] = pt.base;
      if (pt.bear != null) row[`${item.ticker}_bear`] = pt.bear;
      if (pt.bull != null) row[`${item.ticker}_bull`] = pt.bull;
      if (pt.scenarioRange) row[`${item.ticker}_range`] = pt.scenarioRange;
    }
    return row;
  });

  return chartData;
}

export function MultiStockPredictionChart({
  series,
  loading = false,
  title = "AI prediction outlook",
  subtitle,
  mobileSingleSelect = false,
}: MultiStockPredictionChartProps) {
  const chartColors = useChartColors();
  const [hidden, setHidden] = useState<Set<string>>(new Set());
  const [mobileTicker, setMobileTicker] = useState(series[0]?.ticker ?? "");

  const visibleSeries = useMemo(() => {
    let filtered = series.filter((s) => !hidden.has(s.ticker));
    if (mobileSingleSelect && typeof window !== "undefined" && window.innerWidth < 768) {
      filtered = filtered.filter((s) => s.ticker === mobileTicker);
      if (filtered.length === 0 && series[0]) filtered = [series[0]];
    }
    return filtered;
  }, [series, hidden, mobileSingleSelect, mobileTicker]);

  const chartData = useMemo(
    () => (visibleSeries.length > 1 ? mergeIndexedSeries(visibleSeries) : []),
    [visibleSeries]
  );

  const toggleTicker = (ticker: string) => {
    setHidden((prev) => {
      const next = new Set(prev);
      if (next.has(ticker)) next.delete(ticker);
      else next.add(ticker);
      return next;
    });
  };

  const singleStock = visibleSeries.length === 1 ? visibleSeries[0] : null;

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-card-bg">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-neutral-heading">{title}</h2>
          {subtitle && (
            <p className="mt-0.5 text-sm text-neutral-secondary">{subtitle}</p>
          )}
        </div>
        <div className="rounded-full bg-violet-50 px-3 py-1 text-[11px] font-medium text-violet-700 dark:bg-violet-950 dark:text-violet-300">
          Same data as stock AI tab
        </div>
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
            <span className="text-sm text-neutral-secondary">Updating predictions…</span>
          </div>
        )}

        {visibleSeries.length === 0 ? (
          <p className="py-16 text-center text-sm text-neutral-secondary">
            No AI prediction data available.
          </p>
        ) : singleStock ? (
          <StockForecastChart forecast={singleStock.forecast} />
        ) : (
          <ResponsiveContainer width="100%" height={320}>
            <ComposedChart data={chartData} margin={{ top: 8, right: 12, left: 4, bottom: 0 }}>
              <CartesianGrid strokeDasharray="4 6" stroke={chartColors.grid} vertical={false} />
              <XAxis
                dataKey="label"
                axisLine={false}
                tickLine={false}
                tick={{ fill: chartColors.axis, fontSize: 11 }}
                interval="preserveStartEnd"
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: chartColors.axis, fontSize: 11 }}
                tickFormatter={(v) => `${Number(v).toFixed(0)}`}
                width={48}
              />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (!active || !payload?.length) return null;
                  return (
                    <div
                      className="rounded-lg border p-3 text-xs shadow-lg"
                      style={{
                        backgroundColor: chartColors.tooltipBg,
                        borderColor: chartColors.tooltipBorder,
                        color: "#f8fafc",
                      }}
                    >
                      <p className="mb-2 text-slate-400">{String(label)}</p>
                      {payload.map((entry) => {
                        const key = String(entry.dataKey);
                        const ticker = key.replace(/_(close|base|bear|bull|range)$/, "");
                        const s = series.find((x) => x.ticker === ticker);
                        const cp = s?.forecast.currentPrice ?? 0;
                        const raw =
                          cp > 0 && typeof entry.value === "number"
                            ? (entry.value / 100) * cp
                            : null;
                        return (
                          <div key={key} className="flex items-center gap-2 py-0.5">
                            <span
                              className="h-2 w-2 rounded-full"
                              style={{ backgroundColor: s?.color ?? "#fff" }}
                            />
                            <span className="font-medium">{ticker}</span>
                            <span>
                              {raw != null
                                ? formatNGN(raw)
                                : Array.isArray(entry.value)
                                  ? `${entry.value.map((v) => Number(v).toFixed(0)).join("–")} idx`
                                  : `${Number(entry.value).toFixed(1)} idx`}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  );
                }}
              />
              <ReferenceLine y={100} stroke="#94a3b8" strokeDasharray="4 4" />
              <ReferenceLine x="Now" stroke="#94a3b8" strokeDasharray="4 4" />

              {visibleSeries.map((s) => (
                <Area
                  key={`${s.ticker}-close`}
                  type="monotone"
                  dataKey={`${s.ticker}_close`}
                  name={`${s.ticker} history`}
                  stroke={s.color}
                  strokeWidth={2}
                  fill={s.color}
                  fillOpacity={0.1}
                  dot={false}
                  connectNulls
                />
              ))}
              {visibleSeries.map((s) => (
                <Area
                  key={`${s.ticker}-base`}
                  type="monotone"
                  dataKey={`${s.ticker}_base`}
                  name={`${s.ticker} AI base`}
                  stroke={s.color}
                  strokeWidth={2}
                  strokeDasharray="6 4"
                  fill={s.color}
                  fillOpacity={0.06}
                  dot={{ r: 2, fill: s.color, strokeWidth: 0 }}
                  connectNulls
                />
              ))}
            </ComposedChart>
          </ResponsiveContainer>
        )}
      </div>

      {series.length > 0 && (
        <>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[520px] text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-left text-slate-400 dark:border-slate-800">
                  <th className="pb-2 pr-3 font-medium">Stock</th>
                  <th className="pb-2 pr-3 font-medium text-right">Current</th>
                  <th className="pb-2 pr-3 font-medium text-right">5Y annualised</th>
                  <th className="pb-2 pr-3 font-medium text-right">AI 12M target</th>
                  <th className="pb-2 font-medium text-right">AI 12M return</th>
                </tr>
              </thead>
              <tbody>
                {series.map((s) => {
                  const stats = forecastSummaryStats(s.forecast);
                  return (
                    <tr
                      key={s.ticker}
                      className="border-b border-slate-50 dark:border-slate-800/80"
                    >
                      <td className="py-2 pr-3">
                        <span className="inline-flex items-center gap-1.5 font-semibold text-slate-800 dark:text-slate-100">
                          <span
                            className="h-2 w-2 shrink-0 rounded-full"
                            style={{ backgroundColor: s.color }}
                          />
                          {s.ticker}
                        </span>
                      </td>
                      <td className="py-2 pr-3 text-right">{formatNGN(stats.currentPrice)}</td>
                      <td
                        className={cn(
                          "py-2 pr-3 text-right font-medium",
                          stats.annualizedReturn5YPct >= 0 ? "text-green-600" : "text-red-500"
                        )}
                      >
                        {stats.annualizedReturn5YPct >= 0 ? "+" : ""}
                        {stats.annualizedReturn5YPct.toFixed(1)}%
                      </td>
                      <td className="py-2 pr-3 text-right">{formatNGN(stats.targetPrice12M)}</td>
                      <td
                        className={cn(
                          "py-2 text-right font-medium",
                          stats.forecastReturnPct >= 0 ? "text-green-600" : "text-red-500"
                        )}
                      >
                        {stats.forecastReturnPct >= 0 ? "+" : ""}
                        {stats.forecastReturnPct.toFixed(1)}%
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

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
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: s.color }} />
                  {s.ticker}
                </button>
              );
            })}
          </div>
        </>
      )}

      <p className="mt-3 text-[11px] text-slate-400">
        Uses the same daily AI forecast saved in MongoDB as each stock&apos;s AI Prediction tab. With
        one stock selected, the chart matches exactly (NGN prices). With multiple stocks, values are
        indexed to 100 = today&apos;s price.
      </p>
    </div>
  );
}
