"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn, formatNGN } from "@/lib/utils";
import {
  TIMEFRAMES,
  TIMEFRAME_DAYS,
  estimateLoadedDays,
  sliceOHLCVByDays,
} from "@/lib/charts/timeframe";
import type { OHLCV, Timeframe } from "@/types";

const CHART_STROKE = "#00A651";

function useChartColors() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const isDark = mounted && resolvedTheme === "dark";
  return {
    grid: isDark ? "#334155" : "#e2e8f0",
    axis: isDark ? "#94a3b8" : "#64748b",
    tooltipBg: isDark ? "#1e293b" : "#ffffff",
    tooltipBorder: isDark ? "#334155" : "#e2e8f0",
    tooltipText: isDark ? "#f8fafc" : "#0f172a",
    tooltipLabel: isDark ? "#94a3b8" : "#64748b",
    activeDotStroke: isDark ? "#1e293b" : "#ffffff",
  };
}

interface StockChartProps {
  ticker: string;
  initialData: OHLCV[];
  /** Bump to refetch series after a parent refresh */
  refreshToken?: number;
}

async function fetchOHLCV(ticker: string, days: number, bust = false): Promise<OHLCV[]> {
  const params = new URLSearchParams({ days: String(days) });
  if (bust) params.set("refresh", "1");
  const res = await fetch(`/api/stocks/${ticker}/ohlcv?${params}`, { cache: "no-store" });
  if (!res.ok) return [];
  return (await res.json()) as OHLCV[];
}

export function StockChart({ ticker, initialData, refreshToken = 0 }: StockChartProps) {
  const chartColors = useChartColors();
  const [activeTimeframe, setActiveTimeframe] = useState<Timeframe>("1M");
  const [series, setSeries] = useState<OHLCV[]>(initialData);
  const [loadedDays, setLoadedDays] = useState(() =>
    initialData.length > 0 ? estimateLoadedDays(initialData) : TIMEFRAME_DAYS["1M"]
  );
  const [loading, setLoading] = useState(false);

  const gradientId = `area-fill-${ticker}`;
  const activeDays = TIMEFRAME_DAYS[activeTimeframe];

  const ensureSeries = useCallback(
    async (days: number, bust = false) => {
      if (!bust && days <= loadedDays && series.length > 0) return;
      setLoading(true);
      try {
        const data = await fetchOHLCV(ticker, days, bust);
        if (data.length > 0) {
          setSeries(data);
          setLoadedDays(days);
        }
      } finally {
        setLoading(false);
      }
    },
    [ticker, loadedDays, series.length]
  );

  useEffect(() => {
    if (refreshToken === 0) return;
    setSeries(initialData);
    if (initialData.length > 0) {
      setLoadedDays(estimateLoadedDays(initialData));
    }
  }, [initialData, refreshToken]);

  useEffect(() => {
    if (refreshToken > 0) {
      void ensureSeries(Math.max(activeDays, loadedDays), true);
    }
  }, [refreshToken, activeDays, loadedDays, ensureSeries]);

  const handleTimeframe = async (tf: (typeof TIMEFRAMES)[number]) => {
    setActiveTimeframe(tf.label);
    await ensureSeries(tf.days);
  };

  const displayData = useMemo(
    () => sliceOHLCVByDays(series, activeDays),
    [series, activeDays]
  );

  const chartData = displayData.map((d) => ({
    ...d,
    displayDate:
      activeDays <= 1
        ? new Date(d.date).toLocaleTimeString("en-NG", { hour: "2-digit", minute: "2-digit" })
        : new Date(d.date).toLocaleDateString("en-NG", { month: "short", day: "numeric" }),
  }));

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <CardTitle className="flex items-center gap-2">
            {ticker} Price Chart
            {loading && (
              <span className="text-xs font-normal text-neutral-secondary">Updating…</span>
            )}
          </CardTitle>
          <div className="flex overflow-hidden rounded-lg border border-border">
            {TIMEFRAMES.map((tf) => (
              <button
                key={tf.label}
                type="button"
                onClick={() => void handleTimeframe(tf)}
                disabled={loading}
                className={cn(
                  "px-2.5 py-1 text-xs font-medium",
                  activeTimeframe === tf.label
                    ? "bg-primary text-white"
                    : "text-neutral-secondary hover:bg-muted"
                )}
              >
                {tf.label}
              </button>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-xl border border-border bg-gradient-to-b from-card-bg to-muted/90 p-4 shadow-sm">
          {chartData.length === 0 ? (
            <p className="py-16 text-center text-sm text-neutral-secondary">
              No chart data for this period.
            </p>
          ) : (
            <ResponsiveContainer width="100%" height={350}>
              <AreaChart
                data={chartData}
                margin={{ top: 8, right: 12, left: 4, bottom: 0 }}
              >
                <defs>
                  <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={CHART_STROKE} stopOpacity={0.28} />
                    <stop offset="55%" stopColor={CHART_STROKE} stopOpacity={0.08} />
                    <stop offset="100%" stopColor={CHART_STROKE} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="4 6"
                  stroke={chartColors.grid}
                  vertical={false}
                />
                <XAxis
                  dataKey="displayDate"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: chartColors.axis, fontSize: 11 }}
                  interval="preserveStartEnd"
                  dy={8}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: chartColors.axis, fontSize: 11 }}
                  domain={["auto", "auto"]}
                  tickFormatter={(v) => `₦${v}`}
                  width={72}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: chartColors.tooltipBg,
                    border: `1px solid ${chartColors.tooltipBorder}`,
                    borderRadius: "10px",
                    boxShadow: "0 4px 12px rgba(15, 23, 42, 0.08)",
                    color: chartColors.tooltipText,
                    fontSize: "13px",
                  }}
                  labelStyle={{ color: chartColors.tooltipLabel, marginBottom: 4 }}
                  formatter={(value) => [formatNGN(Number(value)), "Close"]}
                  cursor={{ stroke: chartColors.grid, strokeWidth: 1 }}
                />
                <Area
                  type="monotone"
                  dataKey="close"
                  stroke={CHART_STROKE}
                  strokeWidth={2.5}
                  fill={`url(#${gradientId})`}
                  dot={false}
                  activeDot={{
                    r: 5,
                    fill: CHART_STROKE,
                    stroke: chartColors.activeDotStroke,
                    strokeWidth: 2,
                  }}
                  animationDuration={400}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export function MiniSparkline({ data }: { data: number[] }) {
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const isPositive = data[data.length - 1] >= data[0];

  const points = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * 60;
      const y = 20 - ((v - min) / range) * 16;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <svg width="60" height="24" className="inline-block">
      <polyline
        points={points}
        fill="none"
        stroke={isPositive ? "#16A34A" : "#DC2626"}
        strokeWidth="1.5"
      />
    </svg>
  );
}
