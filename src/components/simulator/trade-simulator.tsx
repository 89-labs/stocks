"use client";

import { useState } from "react";
import { useSession, signIn } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatNGN, AI_DISCLAIMER } from "@/lib/utils";
import { ScenarioTable } from "./scenario-table";
import type { SimulationResult } from "@/types";
import { Lock } from "lucide-react";

interface TradeSimulatorProps {
  ticker: string;
  currentPrice: number;
  companyName: string;
}

export function TradeSimulator({ ticker, currentPrice, companyName }: TradeSimulatorProps) {
  const { data: session } = useSession();
  const [amount, setAmount] = useState(100000);
  const [result, setResult] = useState<SimulationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [limitReached, setLimitReached] = useState(false);

  const handleSimulate = async () => {
    setLoading(true);
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

      const data = await res.json();
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
        <CardTitle>Trade Simulator</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="text-sm font-medium text-neutral-heading">
            Investment Amount (NGN)
          </label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value))}
            min={1000}
            step={1000}
            className="mt-1 w-full rounded-lg border border-border bg-card-bg px-4 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        <Button onClick={handleSimulate} disabled={loading} className="w-full">
          {loading ? "Simulating..." : `Simulate ${formatNGN(amount)} Investment`}
        </Button>

        {result && (
          <div className="space-y-4 border-t border-border pt-4">
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <div>
                <p className="text-xs text-neutral-secondary">Shares</p>
                <p className="font-semibold text-neutral-heading">{result.shares}</p>
              </div>
              <div>
                <p className="text-xs text-neutral-secondary">Price/Share</p>
                <p className="font-semibold text-neutral-heading">{formatNGN(result.pricePerShare)}</p>
              </div>
              <div>
                <p className="text-xs text-neutral-secondary">Total Fees</p>
                <p className="font-semibold text-neutral-heading">{formatNGN(result.fees.total)}</p>
              </div>
              <div>
                <p className="text-xs text-neutral-secondary">Net Invested</p>
                <p className="font-semibold text-neutral-heading">
                  {formatNGN(result.shares * result.pricePerShare + result.fees.total)}
                </p>
              </div>
            </div>

            <div className="rounded-lg bg-muted p-3">
              <p className="text-xs font-medium text-neutral-secondary">Fee Breakdown</p>
              <div className="mt-1 grid grid-cols-3 gap-2 text-xs">
                <span>SEC Levy: {formatNGN(result.fees.secLevy)}</span>
                <span>NSE Fee: {formatNGN(result.fees.nseFee)}</span>
                <span>Broker: {formatNGN(result.fees.brokerCommission)}</span>
              </div>
            </div>

            {result.narrative && (
              <p className="text-sm text-neutral-secondary">{result.narrative}</p>
            )}

            <ScenarioTable scenarios={result.scenarios} invested={result.amount} />

            <p className="text-xs text-neutral-secondary italic">{AI_DISCLAIMER}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
