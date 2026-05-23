"use client";

import useSWR from "swr";
import { formatNGN, getChangeColor, getChangeIcon, formatPercent } from "@/lib/utils";
import type { Quote } from "@/types";

async function fetchQuote(url: string): Promise<Quote> {
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to load quote");
  return res.json() as Promise<Quote>;
}

interface LivePriceProps {
  ticker: string;
  initialPrice: number;
  initialChange: number;
  initialChangePercent: number;
  intervalMs?: number;
}

export function LivePrice({
  ticker,
  initialPrice,
  initialChange,
  initialChangePercent,
  intervalMs = 60_000,
}: LivePriceProps) {
  const { data: quote } = useSWR<Quote>(`/api/stocks/${ticker}`, fetchQuote, {
    refreshInterval: intervalMs,
    revalidateOnFocus: true,
    fallbackData: {
      ticker,
      price: initialPrice,
      change: initialChange,
      changePercent: initialChangePercent,
      volume: 0,
      high: initialPrice,
      low: initialPrice,
      open: initialPrice,
      previousClose: initialPrice - initialChange,
      timestamp: new Date().toISOString(),
    },
  });

  const price = quote?.price ?? initialPrice;
  const change = quote?.change ?? initialChange;
  const changePercent = quote?.changePercent ?? initialChangePercent;
  const updatedAt = quote?.timestamp
    ? new Date(quote.timestamp).getTime()
    : Date.now();

  return (
    <div className="flex flex-wrap items-baseline gap-3">
      <span className="text-3xl font-bold text-neutral-heading sm:text-4xl">
        {formatNGN(price)}
      </span>
      <span className={`text-lg font-bold ${getChangeColor(changePercent)}`}>
        {getChangeIcon(changePercent)} {formatPercent(changePercent)}
      </span>
      <span className={`text-sm ${change >= 0 ? "text-gain" : "text-loss"}`}>
        {change >= 0 ? "+" : ""}
        {formatNGN(change)}
      </span>
      <span className="text-xs text-neutral-secondary">
        · live · {new Date(updatedAt).toLocaleTimeString("en-NG")}
      </span>
    </div>
  );
}
