"use client";

import { useState } from "react";
import { useSession, signIn } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatNGN, AI_DISCLAIMER } from "@/lib/utils";
import { ScenarioTable } from "./scenario-table";
import { SimulationGrowthChart } from "./simulation-growth-chart";
import type { SimulationResult } from "@/types";
import { Lock, Sparkles } from "lucide-react";

interface TradeSimulatorProps {
  ticker: string;
  currentPrice: number;
  companyName: string;
}

export function TradeSimulator({ ticker, currentPrice, companyName }: TradeSimulatorProps) {
  const { data: session } = useSession();
  const [amount, setAmount] = useState(100_000);
  const [result, setResult] = useState<SimulationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [limitReached, setLimitReached] = useState(false);

  const handleSimulate = async () => {
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch("/api/simulate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ticker, amount }),
      });

      if (res.status === 429) {
        setLimitReached(true);
        return;
      }

      if (!res.ok) {
        return;
      }

      const data = (await res.json()) as SimulationResult;
      setResult(data);
    } catch {
      // Handle error
    } finally {
      setLoading(false);
    }
  };

  if (limitReached && !session) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-4 p-8 text-center">
          <Lock className="h-10 w-10 text-neutral-secondary" />
          <h3 className="text-lg font-semibold text-neutral-heading">Daily Limit Reached</h3>
          <p className="text-sm text-neutral-secondary">
            Guest users can run 3 simulations per day. Sign in for unlimited access.
          </p>
          <Button onClick={() => signIn()}>Sign In to Continue</Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Trade Simulator
          <Sparkles className="h-4 w-4 text-[#00A651]" aria-hidden />
        </CardTitle>
        <p className="text-sm text-neutral-secondary">
          Project how an investment in {companyName} ({ticker}) could grow using today&apos;s shared
          AI analysis — 5-year history and 12-month price forecast.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="text-sm font-medium text-neutral-heading" htmlFor="sim-amount">
            Investment amount (NGN)
          </label>
          <input
            id="sim-amount"
            type="number"
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value))}
            min={1000}
            step={1000}
            className="mt-1 w-full rounded-lg border border-border bg-card-bg px-4 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
          <p className="mt-1 text-xs text-neutral-secondary">
            Current price: {formatNGN(currentPrice)} · includes typical NGX broker fees
          </p>
        </div>

        <Button onClick={handleSimulate} disabled={loading || amount < 1000} className="w-full">
          {loading ? "Running AI simulation…" : `Simulate ${formatNGN(amount)} investment`}
        </Button>

        {result && (
          <div className="space-y-5 border-t border-border pt-5">
            {result.fromAiAnalysis && (
              <div className="flex flex-wrap gap-2 text-xs">
                <span className="rounded-full bg-emerald-50 px-2.5 py-1 font-medium text-[#00A651] dark:bg-emerald-950">
                  AI analysis
                  {result.analysisDate ? ` · ${result.analysisDate}` : ""}
                </span>
                {result.forecastConfidence && (
                  <span className="rounded-full bg-slate-100 px-2.5 py-1 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                    Confidence: {result.forecastConfidence}
                  </span>
                )}
                {result.newsSentiment && (
                  <span className="rounded-full bg-slate-100 px-2.5 py-1 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                    Sentiment: {result.newsSentiment}
                  </span>
                )}
              </div>
            )}

            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <div>
                <p className="text-xs text-neutral-secondary">Shares</p>
                <p className="font-semibold text-neutral-heading">{result.shares}</p>
              </div>
              <div>
                <p className="text-xs text-neutral-secondary">Price/share</p>
                <p className="font-semibold text-neutral-heading">{formatNGN(result.pricePerShare)}</p>
              </div>
              <div>
                <p className="text-xs text-neutral-secondary">Total fees</p>
                <p className="font-semibold text-neutral-heading">{formatNGN(result.fees.total)}</p>
              </div>
              <div>
                <p className="text-xs text-neutral-secondary">12M base gain</p>
                <p
                  className={`font-semibold ${(result.expectedGainBase ?? 0) >= 0 ? "text-gain" : "text-loss"}`}
                >
                  {result.expectedGainBase != null
                    ? `${result.expectedGainBase >= 0 ? "+" : ""}${formatNGN(result.expectedGainBase)}`
                    : "—"}
                  {result.expectedGainBasePercent != null && (
                    <span className="text-xs font-normal text-neutral-secondary">
                      {" "}
                      ({result.expectedGainBasePercent >= 0 ? "+" : ""}
                      {result.expectedGainBasePercent.toFixed(1)}%)
                    </span>
                  )}
                </p>
              </div>
            </div>

            {result.projectionChart.length > 0 && (
              <div className="rounded-xl border border-border bg-muted/30 p-4">
                <h4 className="mb-3 text-sm font-semibold text-neutral-heading">
                  Portfolio growth projection
                </h4>
                <SimulationGrowthChart points={result.projectionChart} amount={result.amount} />
              </div>
            )}

            <div className="rounded-lg bg-muted p-3">
              <p className="text-xs font-medium text-neutral-secondary">Fee breakdown</p>
              <div className="mt-1 grid grid-cols-3 gap-2 text-xs">
                <span>SEC levy: {formatNGN(result.fees.secLevy)}</span>
                <span>NSE fee: {formatNGN(result.fees.nseFee)}</span>
                <span>Broker: {formatNGN(result.fees.brokerCommission)}</span>
              </div>
            </div>

            {result.narrative && (
              <p className="text-sm leading-relaxed text-neutral-secondary">{result.narrative}</p>
            )}

            <ScenarioTable scenarios={result.scenarios} invested={result.amount} />

            <p className="text-xs italic text-neutral-secondary">{AI_DISCLAIMER}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
