"use client";

import { useId } from "react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
  Legend,
} from "recharts";
import { formatNGN } from "@/lib/utils";
import { buildForecastChartData } from "@/lib/charts/forecast-chart-data";
import type { StockGrowthForecast } from "@/types/stock-forecast";

const HIST_STROKE = "#00A651";
const BASE_STROKE = "#2563eb";

interface StockForecastChartProps {
  forecast: StockGrowthForecast;
}

function useChartColors() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const isDark = mounted && resolvedTheme === "dark";
  return {
    grid: isDark ? "#334155" : "#e2e8f0",
    axis: isDark ? "#94a3b8" : "#64748b",
  };
}

export function StockForecastChart({ forecast }: StockForecastChartProps) {
  const chartColors = useChartColors();
  const uid = useId().replace(/:/g, "");
  const histGradId = `forecast-hist-${uid}`;
  const baseGradId = `forecast-base-${uid}`;
  const bandGradId = `forecast-band-${uid}`;

  const chartData = buildForecastChartData(forecast);

  return (
    <div className="h-80 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id={histGradId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={HIST_STROKE} stopOpacity={0.32} />
              <stop offset="55%" stopColor={HIST_STROKE} stopOpacity={0.1} />
              <stop offset="100%" stopColor={HIST_STROKE} stopOpacity={0} />
            </linearGradient>
            <linearGradient id={baseGradId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={BASE_STROKE} stopOpacity={0.28} />
              <stop offset="55%" stopColor={BASE_STROKE} stopOpacity={0.08} />
              <stop offset="100%" stopColor={BASE_STROKE} stopOpacity={0} />
            </linearGradient>
            <linearGradient id={bandGradId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#16a34a" stopOpacity={0.18} />
              <stop offset="100%" stopColor="#dc2626" stopOpacity={0.06} />
            </linearGradient>
          </defs>

          <CartesianGrid
            strokeDasharray="4 6"
            stroke={chartColors.grid}
            vertical={false}
          />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 11, fill: chartColors.axis }}
            axisLine={false}
            tickLine={false}
            interval="preserveStartEnd"
          />
          <YAxis
            tick={{ fontSize: 11, fill: chartColors.axis }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => `₦${Number(v).toLocaleString()}`}
            width={72}
          />
          <Tooltip
            formatter={(value, name) => [
              formatNGN(Number(value ?? 0)),
              String(name),
            ]}
            labelFormatter={(label) => String(label)}
            contentStyle={{ fontSize: 12 }}
          />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <ReferenceLine x="Now" stroke="#94a3b8" strokeDasharray="4 4" />

          {/* Bear–bull scenario band (forecast only) */}
          <Area
            type="monotone"
            dataKey="scenarioRange"
            name="Scenario range"
            stroke="none"
            fill={`url(#${bandGradId})`}
            connectNulls
            isAnimationActive={false}
          />

          {/* 5-year historical price */}
          <Area
            type="monotone"
            dataKey="close"
            name="Historical"
            stroke={HIST_STROKE}
            strokeWidth={2}
            fill={`url(#${histGradId})`}
            dot={false}
            connectNulls
            activeDot={{ r: 4, strokeWidth: 2 }}
          />

          {/* 12-month base forecast */}
          <Area
            type="monotone"
            dataKey="base"
            name="Base forecast"
            stroke={BASE_STROKE}
            strokeWidth={2}
            strokeDasharray="6 4"
            fill={`url(#${baseGradId})`}
            dot={{ r: 3, fill: BASE_STROKE, strokeWidth: 0 }}
            connectNulls
            activeDot={{ r: 4, strokeWidth: 2 }}
          />

          {/* Bear / bull bounds */}
          <Line
            type="monotone"
            dataKey="bear"
            name="Bear"
            stroke="#dc2626"
            strokeWidth={1.5}
            strokeDasharray="4 4"
            dot={false}
            connectNulls
          />
          <Line
            type="monotone"
            dataKey="bull"
            name="Bull"
            stroke="#16a34a"
            strokeWidth={1.5}
            strokeDasharray="4 4"
            dot={false}
            connectNulls
          />
        </ComposedChart>
      </ResponsiveContainer>
      <p className="mt-2 text-xs text-slate-500">
        5-year weekly history (filled green) and 12-month base forecast (filled blue) with bear / bull
        bounds. Target date: {forecast.targetDate}.
      </p>
    </div>
  );
}
