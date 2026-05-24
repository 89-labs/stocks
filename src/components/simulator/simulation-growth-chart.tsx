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
import type { SimulationProjectionPoint } from "@/types";

const BASE_STROKE = "#2563eb";
const INVESTED_STROKE = "#64748b";

interface SimulationGrowthChartProps {
  points: SimulationProjectionPoint[];
  amount: number;
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

export function SimulationGrowthChart({ points, amount }: SimulationGrowthChartProps) {
  const chartColors = useChartColors();
  const uid = useId().replace(/:/g, "");
  const baseGradId = `sim-base-${uid}`;
  const bandGradId = `sim-band-${uid}`;

  const chartData = points.map((p) => ({
    ...p,
    scenarioRange: [p.bear, p.bull] as [number, number],
  }));

  return (
    <div className="w-full">
      <ResponsiveContainer width="100%" height={280}>
        <ComposedChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id={baseGradId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={BASE_STROKE} stopOpacity={0.35} />
              <stop offset="55%" stopColor={BASE_STROKE} stopOpacity={0.1} />
              <stop offset="100%" stopColor={BASE_STROKE} stopOpacity={0} />
            </linearGradient>
            <linearGradient id={bandGradId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#16a34a" stopOpacity={0.2} />
              <stop offset="100%" stopColor="#dc2626" stopOpacity={0.08} />
            </linearGradient>
          </defs>

          <CartesianGrid strokeDasharray="4 6" stroke={chartColors.grid} vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 11, fill: chartColors.axis }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 11, fill: chartColors.axis }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => `₦${(Number(v) / 1000).toFixed(0)}k`}
            width={56}
          />
          <Tooltip
            formatter={(value, name) => [formatNGN(Number(value ?? 0)), String(name)]}
            labelFormatter={(label) => String(label)}
            contentStyle={{ fontSize: 12 }}
          />
          <Legend wrapperStyle={{ fontSize: 11 }} />
          <ReferenceLine
            y={amount}
            stroke={INVESTED_STROKE}
            strokeDasharray="5 5"
            label={{
              value: "Amount invested",
              position: "insideTopRight",
              fontSize: 10,
              fill: chartColors.axis,
            }}
          />

          <Area
            type="monotone"
            dataKey="scenarioRange"
            name="Bear–bull range"
            stroke="none"
            fill={`url(#${bandGradId})`}
            connectNulls
            isAnimationActive={false}
          />
          <Area
            type="monotone"
            dataKey="base"
            name="Base portfolio"
            stroke={BASE_STROKE}
            strokeWidth={2}
            fill={`url(#${baseGradId})`}
            dot={{ r: 3, fill: BASE_STROKE, strokeWidth: 0 }}
            connectNulls
            activeDot={{ r: 5 }}
          />
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
        Projected portfolio value from today&apos;s AI forecast. Dashed line = your investment amount.
      </p>
    </div>
  );
}
