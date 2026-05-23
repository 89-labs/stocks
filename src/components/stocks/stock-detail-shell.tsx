"use client";

import { useState } from "react";
import { PriceHeader, FinancialsGrid } from "@/components/stocks/stock-card";
import { StockChart } from "@/components/charts/stock-chart";
import { RefreshMarketData } from "@/components/stocks/refresh-market-data";
import type { OHLCV, Stock } from "@/types";
import type { Quote } from "@/types";

interface StockDetailShellProps {
  stock: Stock;
  quote: Quote | null;
  initialOhlcv: OHLCV[];
  children: React.ReactNode;
}

export function StockDetailShell({
  stock,
  quote,
  initialOhlcv,
  children,
}: StockDetailShellProps) {
  const [refreshToken, setRefreshToken] = useState(0);
  const [priceKey, setPriceKey] = useState(0);

  const bumpRefresh = () => {
    setRefreshToken((n) => n + 1);
    setPriceKey((n) => n + 1);
  };

  return (
    <>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <PriceHeader
          key={priceKey}
          ticker={stock.ticker}
          name={stock.name}
          price={quote?.price ?? stock.price}
          change={quote?.change ?? stock.change}
          changePercent={quote?.changePercent ?? stock.changePercent}
          high52w={stock.high52w}
          low52w={stock.low52w}
          stale={quote?.stale ?? stock.stale}
        />
        <RefreshMarketData ticker={stock.ticker} onRefreshed={bumpRefresh} />
      </div>

      <div className="mt-8 space-y-8">
        <StockChart
          ticker={stock.ticker}
          initialData={initialOhlcv}
          refreshToken={refreshToken}
        />

        <FinancialsGrid
          peRatio={stock.peRatio}
          eps={stock.eps}
          dividendYield={stock.dividendYield}
          marketCap={stock.marketCap}
        />

        {children}
      </div>
    </>
  );
}
