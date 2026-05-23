"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatNGN, AI_DISCLAIMER } from "@/lib/utils";
import type { AIPrediction } from "@/types";

interface AIPredictionPanelProps {
  ticker: string;
  currentPrice: number;
  companyName: string;
}

export function AIPredictionPanel({ ticker, currentPrice, companyName }: AIPredictionPanelProps) {
  const [prediction, setPrediction] = useState<AIPrediction | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/ai/predict", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ticker, currentPrice, companyName }),
    })
      .then((r) => r.json())
      .then(setPrediction)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [ticker, currentPrice, companyName]);

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-3">
            <div className="h-4 w-1/3 rounded bg-muted" />
            <div className="h-20 rounded bg-muted" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!prediction) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>AI Price Prediction</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-4">
          {prediction.predictions.map((p) => (
            <div key={p.days} className="rounded-lg bg-muted p-4">
              <p className="text-xs font-medium text-neutral-secondary">{p.days}-Day Forecast</p>
              <p className="mt-1 text-lg font-bold text-neutral-heading">{formatNGN(p.price)}</p>
              <p className="mt-1 text-xs text-neutral-secondary">
                Range: {formatNGN(p.low)} – {formatNGN(p.high)}
              </p>
              <div className="mt-2">
                <div className="h-1.5 rounded-full bg-muted">
                  <div
                    className="h-1.5 rounded-full bg-primary"
                    style={{ width: `${p.confidence * 100}%` }}
                  />
                </div>
                <p className="mt-1 text-xs text-neutral-secondary">
                  {(p.confidence * 100).toFixed(0)}% confidence
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="rounded-lg border border-border p-4">
          <p className="text-sm text-neutral-secondary">{prediction.reasoning}</p>
        </div>

        <p className="text-xs text-neutral-secondary italic">{AI_DISCLAIMER}</p>
      </CardContent>
    </Card>
  );
}
