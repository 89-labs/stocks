"use client";

import { useRef, useState, useTransition } from "react";
import { LineChart } from "lucide-react";
import { MultiStockChart, type ChartSeries } from "@/components/charts/MultiStockChart";
import { fetchMultiStockKlines } from "@/lib/dashboard/actions";
import type { Timeframe } from "@/types";
import { timeframeLabel } from "@/lib/charts/timeframe";
import { DashboardCard, EmptyState, PanelHeader } from "@/components/dashboard/dashboard-ui";

interface PortfolioChartClientProps {
  tickers: string[];
  initialSeries: ChartSeries[];
  defaultTimeframe: Timeframe;
}

export function PortfolioChartClient({
  tickers,
  initialSeries,
  defaultTimeframe,
}: PortfolioChartClientProps) {
  const [series, setSeries] = useState(initialSeries);
  const [timeframe, setTimeframe] = useState<Timeframe>(defaultTimeframe);
  const [pending, startTransition] = useTransition();
  const fetchGenRef = useRef(0);

  if (tickers.length === 0) {
    return (
      <DashboardCard>
        <PanelHeader
          title="Portfolio performance"
          description="Combined chart of selected stocks"
          action={
            <div className="hidden gap-1 sm:flex">
            {(["1D", "1W", "1M", "3M", "1Y"] as const).map((tf) => (
              <button
                key={tf}
                type="button"
                disabled
                className="rounded-lg border border-slate-200 px-2.5 py-1 text-[11px] text-slate-400 transition-colors duration-150 dark:border-slate-700"
              >
                {tf}
              </button>
            ))}
          </div>
          }
        />
        <EmptyState
          icon={LineChart}
          title="No stocks selected"
          description="Add stocks to your watchlist to track portfolio performance and compare holdings over time."
          actionHref="/dashboard/stocks/watchlist"
          actionLabel="Add stocks to watchlist"
        />
      </DashboardCard>
    );
  }

  const handleTimeframe = (tf: Timeframe) => {
    setTimeframe(tf);
    const gen = ++fetchGenRef.current;
    startTransition(async () => {
      await new Promise((r) => setTimeout(r, 350));
      if (fetchGenRef.current !== gen) return;
      const data = await fetchMultiStockKlines(tickers, tf);
      if (fetchGenRef.current !== gen) return;
      setSeries(data);
    });
  };

  return (
    <div>
      <MultiStockChart
        series={series}
        activeTimeframe={timeframe}
        onTimeframeChange={handleTimeframe}
        loading={pending}
        title="Portfolio performance"
        subtitle={`Combined chart of selected stocks · ${timeframeLabel(timeframe)}`}
        mobileSingleSelect
      />
    </div>
  );
}
