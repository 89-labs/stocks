"use client";

import { Sparkles } from "lucide-react";
import { MultiStockPredictionChart } from "@/components/charts/MultiStockPredictionChart";
import { DashboardCard, EmptyState, PanelHeader } from "@/components/dashboard/dashboard-ui";
import type { PredictionChartSeries } from "@/lib/dashboard/actions";

interface PortfolioPredictionChartClientProps {
  tickers: string[];
  initialSeries: PredictionChartSeries[];
  missingTickers: string[];
}

export function PortfolioPredictionChartClient({
  tickers,
  initialSeries,
  missingTickers,
}: PortfolioPredictionChartClientProps) {
  if (tickers.length === 0) {
    return (
      <DashboardCard>
        <PanelHeader
          title="AI prediction outlook"
          description="Compare watchlist stocks against today's AI 12-month forecasts"
        />
        <EmptyState
          icon={Sparkles}
          title="No stocks selected"
          description="Add stocks to your watchlist to compare AI predictions with current performance."
          actionHref="/dashboard/stocks/watchlist"
          actionLabel="Add stocks to watchlist"
        />
      </DashboardCard>
    );
  }

  if (initialSeries.length === 0) {
    return (
      <DashboardCard>
        <PanelHeader
          title="AI prediction outlook"
          description="Compare watchlist stocks against today's AI 12-month forecasts"
        />
        <EmptyState
          icon={Sparkles}
          title="No AI predictions yet today"
          description={`Open any stock's AI Prediction tab to generate today's shared analysis. Missing: ${missingTickers.join(", ")}.`}
          actionHref={`/dashboard/stocks/${tickers[0]}`}
          actionLabel={`Analyse ${tickers[0]}`}
        />
      </DashboardCard>
    );
  }

  return (
    <div className="space-y-3">
      <MultiStockPredictionChart
        series={initialSeries}
        title="AI prediction outlook"
        subtitle={`Same daily AI forecasts as each stock's AI tab · ${initialSeries.length} of ${tickers.length} stocks`}
        mobileSingleSelect
      />
      {missingTickers.length > 0 && (
        <p className="text-center text-xs text-slate-500">
          No prediction yet for: {missingTickers.join(", ")}. Visit each stock&apos;s AI tab to
          generate today&apos;s analysis.
        </p>
      )}
    </div>
  );
}
