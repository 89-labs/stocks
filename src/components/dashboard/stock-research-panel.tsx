"use client";

import { useCallback, useEffect, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { DashboardCard, PanelHeader } from "@/components/dashboard/dashboard-ui";
import { StockForecastChart } from "@/components/dashboard/stock-forecast-chart";
import { formatNGN, AI_DISCLAIMER } from "@/lib/utils";
import type { StockResearchResult } from "@/lib/dashboard/stock-forecast";
import type { StockResearch } from "@/types/stock-forecast";

interface StockResearchPanelProps {
  ticker: string;
}

function formatReturn(value: number): string {
  const pct = value * 100;
  return `${pct >= 0 ? "+" : ""}${pct.toFixed(1)}%`;
}

export function StockResearchPanel({ ticker }: StockResearchPanelProps) {
  const [research, setResearch] = useState<StockResearchResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadResearch = useCallback(
    async (refresh = false) => {
      if (refresh) setRefreshing(true);
      else setLoading(true);
      setError(null);

      try {
        const url = `/api/ai/research/${encodeURIComponent(ticker)}${refresh ? "?refresh=1" : ""}`;
        const res = await fetch(url, refresh ? { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" } : undefined);
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error((body as { error?: string }).error ?? "Failed to load research");
        }
        setResearch(await res.json());
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load research");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [ticker]
  );

  useEffect(() => {
    void loadResearch(false);
  }, [loadResearch]);

  if (loading) {
    return (
      <DashboardCard>
        <PanelHeader
          title={`AI research · ${ticker}`}
          description="Loading today's shared analysis (one run per stock per day for all users)…"
        />
        <div className="space-y-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-4 w-full animate-pulse" />
          ))}
        </div>
      </DashboardCard>
    );
  }

  if (error || !research) {
    return (
      <DashboardCard>
        <PanelHeader title={`AI research · ${ticker}`} description={error ?? "Unavailable"} />
        <button
          type="button"
          onClick={() => void loadResearch(true)}
          className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white"
        >
          Retry analysis
        </button>
      </DashboardCard>
    );
  }

  const { forecast, analysis } = research;
  const summary = forecast.historicalSummary;

  return (
    <div className="space-y-6">
      <DashboardCard>
        <PanelHeader
          title={`12-month growth forecast · ${ticker}`}
          description={
            research.fromCache
              ? `Today's shared analysis · ${research.analysisDate} · saved in DB for all users`
              : `First analysis today · ${research.analysisDate} · saved to DB for everyone`
          }
        action={
          <button
            type="button"
            disabled={refreshing}
            onClick={() => void loadResearch(true)}
            className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:text-slate-300"
          >
            {refreshing ? "Regenerating…" : "Refresh"}
          </button>
        }
        />

        <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Stat label="Current" value={formatNGN(forecast.currentPrice)} />
          <Stat
            label="12M base target"
            value={formatNGN(forecast.forecast.base.price)}
            sub={formatReturn(forecast.forecast.base.return)}
          />
          <Stat
            label="5Y annualised"
            value={formatReturn(summary.annualizedReturn)}
            sub={`${summary.trend} · σ ${(summary.volatility * 100).toFixed(0)}%`}
          />
          <Stat
            label="Confidence"
            value={forecast.forecast.confidence}
            sub={`Sentiment: ${forecast.newsSentiment.label}`}
          />
        </div>

        <StockForecastChart forecast={forecast} />

        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          {(["bear", "base", "bull"] as const).map((scenario) => {
            const s = forecast.forecast[scenario];
            return (
              <div
                key={scenario}
                className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/50"
              >
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  {scenario} · 12M
                </p>
                <p className="mt-1 text-lg font-bold text-slate-900 dark:text-slate-100">
                  {formatNGN(s.price)}
                </p>
                <p className="text-sm text-slate-500">{formatReturn(s.return)}</p>
              </div>
            );
          })}
        </div>
      </DashboardCard>

      <DashboardCard>
        <PanelHeader title="Reasoning & drivers" description="News, speculation, and historical context" />
        <p className="mb-4 text-sm leading-7 text-slate-700 dark:text-slate-200">
          {forecast.reasoning}
        </p>
        <div className="grid gap-6 lg:grid-cols-2">
          <div>
            <h4 className="mb-2 text-sm font-semibold text-slate-900 dark:text-slate-100">
              Key drivers
            </h4>
            <ul className="list-disc space-y-1 pl-5 text-sm text-slate-600 dark:text-slate-300">
              {forecast.keyDrivers.map((d) => (
                <li key={d}>{d}</li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="mb-2 text-sm font-semibold text-slate-900 dark:text-slate-100">
              Market speculation
            </h4>
            <ul className="list-disc space-y-1 pl-5 text-sm text-slate-600 dark:text-slate-300">
              {forecast.marketSpeculation.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ul>
          </div>
        </div>
        <p className="mt-4 text-xs text-slate-500">{forecast.volatilityNote}</p>
      </DashboardCard>

      <DashboardCard>
        <PanelHeader
          title={`Full analysis · ${research.companyName}`}
          description="5-year history, news sentiment, and 12-month outlook"
        />
        <article className="prose prose-sm max-w-none whitespace-pre-wrap rounded-2xl bg-slate-50 p-5 text-sm leading-7 text-slate-700 dark:prose-invert dark:bg-slate-950/50 dark:text-slate-200">
          {analysis}
        </article>
        <p className="mt-4 text-xs italic text-slate-500">{AI_DISCLAIMER}</p>
      </DashboardCard>
    </div>
  );
}

function Stat({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900">
      <p className="text-xs font-medium text-slate-500">{label}</p>
      <p className="mt-1 text-base font-bold text-slate-900 dark:text-slate-100">{value}</p>
      {sub && <p className="text-xs text-slate-500">{sub}</p>}
    </div>
  );
}
