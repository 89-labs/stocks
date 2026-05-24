"use client";

import { useMemo, useState } from "react";
import { useTheme } from "next-themes";
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Area,
} from "recharts";
import { enrichKlineWithIndicators } from "@/lib/charts/indicators";
import type { KlineBar } from "@/types/stock";
import { formatNGN } from "@/lib/utils";

interface TechnicalChartProps {
  bars: KlineBar[];
}

function CandleBody({
  x,
  y,
  width,
  height,
  fill,
}: {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  fill?: string;
}) {
  if (x == null || y == null || width == null || height == null) return null;
  const h = Math.max(Math.abs(height), 1);
  return <rect x={x} y={y} width={width} height={h} fill={fill} />;
}

export function TechnicalChart({ bars }: TechnicalChartProps) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const [showMa20, setShowMa20] = useState(true);
  const [showMa50, setShowMa50] = useState(false);
  const [showBB, setShowBB] = useState(false);

  const data = useMemo(() => enrichKlineWithIndicators(bars), [bars]);

  const chartData = data.map((d) => ({
    ...d,
    displayDate: new Date(d.timestamp).toLocaleDateString("en-NG", {
      month: "short",
      day: "numeric",
    }),
    candleColor: d.close >= d.open ? "#16A34A" : "#DC2626",
  }));

  const grid = isDark ? "#334155" : "#e2e8f0";
  const axis = isDark ? "#94a3b8" : "#64748b";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-4 text-sm">
        {[
          { key: "ma20", label: "MA20", checked: showMa20, set: setShowMa20 },
          { key: "ma50", label: "MA50", checked: showMa50, set: setShowMa50 },
          { key: "bb", label: "Bollinger Bands", checked: showBB, set: setShowBB },
        ].map(({ key, label, checked, set }) => (
          <label key={key} className="flex cursor-pointer items-center gap-2">
            <input
              type="checkbox"
              checked={checked}
              onChange={(e) => set(e.target.checked)}
              className="rounded border-slate-300"
            />
            {label}
          </label>
        ))}
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-card-bg">
        <ResponsiveContainer width="100%" height={360}>
          <ComposedChart data={chartData} margin={{ top: 8, right: 12, left: 4, bottom: 0 }}>
            <CartesianGrid strokeDasharray="4 6" stroke={grid} vertical={false} />
            <XAxis
              dataKey="displayDate"
              axisLine={false}
              tickLine={false}
              tick={{ fill: axis, fontSize: 10 }}
              interval="preserveStartEnd"
            />
            <YAxis
              yAxisId="price"
              axisLine={false}
              tickLine={false}
              tick={{ fill: axis, fontSize: 10 }}
              tickFormatter={(v) => `₦${v}`}
              width={64}
              domain={["auto", "auto"]}
            />
            <YAxis
              yAxisId="volume"
              orientation="right"
              axisLine={false}
              tickLine={false}
              tick={{ fill: axis, fontSize: 10 }}
              width={48}
              tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
            />
            <Tooltip
              formatter={(value, name) => {
                if (name === "volume") return [Number(value).toLocaleString(), "Volume"];
                return [formatNGN(Number(value)), String(name)];
              }}
            />
            {showBB && (
              <>
                <Area
                  yAxisId="price"
                  type="monotone"
                  dataKey="bbUpper"
                  stroke="none"
                  fill="#3b82f6"
                  fillOpacity={0.08}
                  connectNulls
                />
                <Area
                  yAxisId="price"
                  type="monotone"
                  dataKey="bbLower"
                  stroke="none"
                  fill="#3b82f6"
                  fillOpacity={0.08}
                  connectNulls
                />
              </>
            )}
            <Bar
              yAxisId="volume"
              dataKey="volume"
              fill={isDark ? "#475569" : "#cbd5e1"}
              opacity={0.5}
              barSize={4}
            />
            <Bar
              yAxisId="price"
              dataKey="close"
              shape={(props: unknown) => {
                const p = props as {
                  x?: number;
                  y?: number;
                  width?: number;
                  payload?: { open: number; close: number; high: number; low: number };
                };
                const { x = 0, width = 4, payload } = p;
                if (!payload) return null;
                const color = payload.close >= payload.open ? "#16A34A" : "#DC2626";
                const scale = 0.4;
                const bodyH = Math.abs(payload.close - payload.open) * scale || 1;
                return (
                  <CandleBody
                    x={x + width * 0.25}
                    y={payload.close}
                    width={width * 0.5}
                    height={bodyH}
                    fill={color}
                  />
                );
              }}
            />
            {showMa20 && (
              <Line
                yAxisId="price"
                type="monotone"
                dataKey="ma20"
                stroke="#f59e0b"
                strokeWidth={1.5}
                dot={false}
                connectNulls
              />
            )}
            {showMa50 && (
              <Line
                yAxisId="price"
                type="monotone"
                dataKey="ma50"
                stroke="#8b5cf6"
                strokeWidth={1.5}
                dot={false}
                connectNulls
              />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-card-bg">
        <h3 className="mb-2 text-sm font-semibold text-neutral-heading">RSI (14)</h3>
        <ResponsiveContainer width="100%" height={120}>
          <ComposedChart data={chartData} margin={{ top: 4, right: 12, left: 4, bottom: 0 }}>
            <CartesianGrid strokeDasharray="4 6" stroke={grid} vertical={false} />
            <XAxis dataKey="displayDate" hide />
            <YAxis domain={[0, 100]} ticks={[30, 50, 70]} tick={{ fill: axis, fontSize: 10 }} width={32} />
            <Line
              type="monotone"
              dataKey="rsi"
              stroke="#6366f1"
              strokeWidth={1.5}
              dot={false}
              connectNulls
            />
            <Line type="monotone" dataKey={() => 70} stroke="#ef4444" strokeDasharray="4 4" dot={false} />
            <Line type="monotone" dataKey={() => 30} stroke="#22c55e" strokeDasharray="4 4" dot={false} />
          </ComposedChart>
        </ResponsiveContainer>
        <div className="mt-1 flex gap-4 text-xs text-neutral-secondary">
          <span className="text-green-600">— 30 Oversold</span>
          <span className="text-red-600">— 70 Overbought</span>
        </div>
      </div>
    </div>
  );
}
