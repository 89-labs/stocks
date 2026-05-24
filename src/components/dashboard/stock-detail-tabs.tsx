"use client";

import { useEffect, useState } from "react";
import { PriceHeader, FinancialsGrid } from "@/components/stocks/stock-card";
import { StockChart } from "@/components/charts/stock-chart";
import { RefreshMarketData } from "@/components/stocks/refresh-market-data";
import { TechnicalChart } from "@/components/charts/TechnicalChart";
import { StockResearchPanel } from "@/components/dashboard/stock-research-panel";
import { TradeSimulator } from "@/components/simulator/trade-simulator";
import { BrokerCards, RelatedStocks } from "@/components/stocks/broker-cards";
import { NewsList } from "@/components/news/news-card";
import { WatchlistButton } from "@/components/dashboard/watchlist-button";
import { cn } from "@/lib/utils";
import {
  DashboardCard,
  DashboardHeader,
  ToolbarButton,
} from "@/components/dashboard/dashboard-ui";
import type { OHLCV, Stock } from "@/types";
import type { Quote } from "@/types";
import type { KlineBar } from "@/types/stock";
import type { NewsArticle } from "@/types";

const TABS = [
  { id: "overview", label: "Overview" },
  { id: "technicals", label: "Technicals" },
  { id: "ai", label: "AI Prediction" },
  { id: "simulate", label: "Simulate" },
  { id: "news", label: "News" },
] as const;

type TabId = (typeof TABS)[number]["id"];

interface StockDetailTabsProps {
  stock: Stock;
  quote: Quote | null;
  initialOhlcv: OHLCV[];
  klineBars: KlineBar[];
  news: NewsArticle[];
  related: { ticker: string; name: string; price: number; changePercent: number }[];
  visitCount: number;
  inWatchlist: boolean;
}

export function StockDetailTabs({
  stock,
  quote,
  initialOhlcv,
  klineBars,
  news,
  related,
  visitCount,
  inWatchlist,
}: StockDetailTabsProps) {
  const [activeTab, setActiveTab] = useState<TabId>(() => {
    if (typeof window === "undefined") return "overview";
    const hash = window.location.hash.replace("#", "") as TabId;
    return TABS.some((t) => t.id === hash) ? hash : "overview";
  });
  const [refreshToken, setRefreshToken] = useState(0);
  const [priceKey, setPriceKey] = useState(0);

  useEffect(() => {
    const onHash = () => {
      const hash = window.location.hash.replace("#", "") as TabId;
      if (TABS.some((t) => t.id === hash)) setActiveTab(hash);
    };
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  const selectTab = (id: TabId) => {
    setActiveTab(id);
    window.history.replaceState(null, "", `#${id}`);
  };

  const bumpRefresh = () => {
    setRefreshToken((n) => n + 1);
    setPriceKey((n) => n + 1);
  };

  return (
    <>
      <DashboardHeader
        eyebrow="Research terminal"
        title={`${stock.ticker} · ${stock.name}`}
        description="Review price action, fundamentals, technicals, AI predictions, simulations, and market news in one workspace."
        meta={
          <div className="flex flex-wrap items-center gap-2">
            {visitCount > 0 && (
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600 dark:bg-slate-900 dark:text-slate-300">
                Visited {visitCount} time{visitCount !== 1 ? "s" : ""}
              </span>
            )}
            <WatchlistButton ticker={stock.ticker} inWatchlist={inWatchlist} />
          </div>
        }
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <ToolbarButton href="/dashboard/stocks">All stocks</ToolbarButton>
            <RefreshMarketData ticker={stock.ticker} onRefreshed={bumpRefresh} />
          </div>
        }
      />

      <DashboardCard>
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
      </DashboardCard>

      <DashboardCard className="p-2">
        <nav className="flex gap-1 overflow-x-auto">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => selectTab(tab.id)}
              className={cn(
                "whitespace-nowrap rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors",
                activeTab === tab.id
                  ? "bg-emerald-50 text-[#00A651] dark:bg-emerald-950"
                  : "text-slate-500 hover:bg-slate-50 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-slate-100"
              )}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </DashboardCard>

      <div className="space-y-6">
        {activeTab === "overview" && (
          <>
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
            <BrokerCards />
            {related.length > 0 && (
              <RelatedStocks stocks={related} detailPath="/dashboard/stocks" />
            )}
          </>
        )}

        {activeTab === "technicals" && <TechnicalChart bars={klineBars} />}

        {activeTab === "ai" && <StockResearchPanel ticker={stock.ticker} />}

        {activeTab === "simulate" && (
          <TradeSimulator
            ticker={stock.ticker}
            currentPrice={stock.price}
            companyName={stock.name}
          />
        )}

        {activeTab === "news" && (
          <section>
            <h2 className="mb-4 text-lg font-semibold text-neutral-heading">
              News for {stock.ticker}
            </h2>
            {news.length > 0 ? (
              <NewsList articles={news.slice(0, 6)} />
            ) : (
              <p className="text-sm text-neutral-secondary">No recent news for this ticker.</p>
            )}
          </section>
        )}
      </div>
    </>
  );
}
