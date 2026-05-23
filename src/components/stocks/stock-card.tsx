"use client";

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { ChangeIndicator } from "@/components/ui/change-indicator";
import { LivePrice } from "@/components/stocks/live-price";
import { formatNGN, formatCompactNGN } from "@/lib/utils";
import type { Stock } from "@/types";

interface StockCardProps {
  stock: Stock;
  compact?: boolean;
}

export function StockCard({ stock, compact }: StockCardProps) {
  return (
    <Link href={`/stocks/${stock.ticker}`}>
      <Card className="transition-shadow hover:shadow-md">
        <CardContent className={compact ? "p-4" : "p-5"}>
          <div className="flex items-start justify-between">
            <div>
              <p className="font-bold text-neutral-heading">{stock.ticker}</p>
              {!compact && (
                <p className="mt-0.5 text-xs text-neutral-secondary line-clamp-1">{stock.name}</p>
              )}
            </div>
            <ChangeIndicator value={stock.changePercent} />
          </div>
          <p className="mt-2 text-lg font-semibold text-neutral-heading">
            {formatNGN(stock.price)}
          </p>
          {!compact && (
            <p className="mt-1 text-xs text-neutral-secondary">
              Vol: {stock.volume.toLocaleString()} · {stock.sector}
            </p>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}

interface StockRowProps {
  stock: Stock;
  sparkline?: number[];
}

export function StockRow({ stock }: StockRowProps) {
  return (
    <Link
      href={`/stocks/${stock.ticker}`}
      className="flex items-center justify-between border-b border-border px-4 py-3 transition-colors hover:bg-muted last:border-b-0"
    >
      <div className="min-w-0 flex-1">
        <p className="font-semibold text-neutral-heading">{stock.ticker}</p>
        <p className="truncate text-xs text-neutral-secondary">{stock.name}</p>
      </div>
      <div className="text-right">
        <p className="font-medium text-neutral-heading">{formatNGN(stock.price)}</p>
        <ChangeIndicator value={stock.changePercent} className="text-xs" />
      </div>
    </Link>
  );
}

interface MarketStatProps {
  label: string;
  value: string;
  change?: number;
}

export function MarketStat({ label, value, change }: MarketStatProps) {
  return (
    <Card>
      <CardContent className="p-4">
        <p className="text-xs font-medium uppercase tracking-wide text-neutral-secondary">{label}</p>
        <p className="mt-1 text-xl font-bold text-neutral-heading">{value}</p>
        {change !== undefined && (
          <div className="mt-1">
            <ChangeIndicator value={change} className="text-sm" />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function TrendingCarousel({ stocks }: { stocks: Stock[] }) {
  return (
    <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
      {stocks.map((stock) => (
        <div key={stock.ticker} className="min-w-[180px] flex-shrink-0">
          <StockCard stock={stock} compact />
        </div>
      ))}
    </div>
  );
}

export function PriceHeader({
  ticker,
  name,
  price,
  change,
  changePercent,
  high52w,
  low52w,
  stale,
}: {
  ticker: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  high52w: number;
  low52w: number;
  stale?: boolean;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-bold text-neutral-heading sm:text-3xl">{ticker}</h1>
        {stale && (
          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-700 dark:bg-amber-950 dark:text-amber-300">
            Stale data
          </span>
        )}
      </div>
      <p className="text-neutral-secondary">{name}</p>
      <LivePrice
        ticker={ticker}
        initialPrice={price}
        initialChange={change}
        initialChangePercent={changePercent}
      />
      <div className="flex gap-6 text-sm text-neutral-secondary">
        <span>52W High: <strong className="text-neutral-heading">{formatNGN(high52w)}</strong></span>
        <span>52W Low: <strong className="text-neutral-heading">{formatNGN(low52w)}</strong></span>
      </div>
    </div>
  );
}

export function FinancialsGrid({
  peRatio,
  eps,
  dividendYield,
  marketCap,
}: {
  peRatio?: number;
  eps?: number;
  dividendYield?: number;
  marketCap: number;
}) {
  const items = [
    { label: "P/E Ratio", value: peRatio?.toFixed(2) ?? "N/A" },
    { label: "EPS", value: eps ? formatNGN(eps) : "N/A" },
    { label: "Dividend Yield", value: dividendYield ? `${dividendYield}%` : "N/A" },
    { label: "Market Cap", value: formatCompactNGN(marketCap) },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
      {items.map((item) => (
        <Card key={item.label}>
          <CardContent className="p-4">
            <p className="text-xs text-neutral-secondary">{item.label}</p>
            <p className="mt-1 text-lg font-semibold text-neutral-heading">{item.value}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
