"use client";

import { useRef, useState, useTransition, useMemo, useEffect } from "react";
import { MultiStockChart, type ChartSeries } from "@/components/charts/MultiStockChart";
import { CorrelationMatrix } from "@/components/charts/CorrelationMatrix";
import { fetchMultiStockKlines } from "@/lib/dashboard/actions";
import type { Timeframe } from "@/types";
import { cn } from "@/lib/utils";
import { DashboardCard, PanelHeader } from "@/components/dashboard/dashboard-ui";

interface ComparisonSectionProps {
  tickers: string[];
  initialSeries: ChartSeries[];
}

export function ComparisonSection({ tickers, initialSeries }: ComparisonSectionProps) {
  const [series, setSeries] = useState(initialSeries);
  const [timeframe, setTimeframe] = useState<Timeframe>("1M");
  const [normalise, setNormalise] = useState(false);
  const [pending, startTransition] = useTransition();
  const fetchGenRef = useRef(0);
  const visible = tickers.length >= 2;

  useEffect(() => {
    if (tickers.length < 2) return;
    const gen = ++fetchGenRef.current;
    const timer = setTimeout(() => {
      startTransition(async () => {
        if (fetchGenRef.current !== gen) return;
        const data = await fetchMultiStockKlines(tickers, timeframe);
        if (fetchGenRef.current !== gen) return;
        setSeries(data);
      });
    }, 350);
    return () => clearTimeout(timer);
  }, [tickers.join(",")]); // eslint-disable-line react-hooks/exhaustive-deps

  const closesByTicker = useMemo(() => {
    const map: Record<string, number[]> = {};
    for (const s of series) {
      map[s.ticker] = s.data.map((b) => b.close);
    }
    return map;
  }, [series]);

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

  if (tickers.length < 2) return null;

  return (
    <div
      className={cn(
        "overflow-hidden transition-all duration-300",
        visible ? "max-h-[2000px] opacity-100" : "max-h-0 opacity-0"
      )}
    >
      <DashboardCard>
        <PanelHeader
          title="Comparison chart"
          description="Normalise performance or inspect raw prices across selected equities."
          action={
            <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300">
            <input
              type="checkbox"
              checked={normalise}
              onChange={(e) => setNormalise(e.target.checked)}
              className="rounded border-slate-300"
            />
            Normalise (base 100)
          </label>
          }
        />
        <MultiStockChart
          series={series}
          normalise={normalise}
          timeframes={["1W", "1M", "3M", "1Y"]}
          activeTimeframe={timeframe}
          onTimeframeChange={handleTimeframe}
          loading={pending}
          title=""
          mobileSingleSelect
        />
        <CorrelationMatrix tickers={tickers} closesByTicker={closesByTicker} />
      </DashboardCard>
    </div>
  );
}
