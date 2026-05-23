import { StockDataService } from "@/lib/data/stock-data-service";
import { NewsService } from "@/lib/data/news-service";
import { MarketStat, TrendingCarousel, StockRow } from "@/components/stocks/stock-card";
import { TopMoversCard } from "@/components/stocks/top-movers-card";
import { MOVER_PAGE_META, TOP_MOVERS_PREVIEW } from "@/lib/data/movers";
import { NewsList } from "@/components/news/news-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChangeIndicator } from "@/components/ui/change-indicator";
import { formatCompactNGN } from "@/lib/utils";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { NGX_PULSE_PAGE_REVALIDATE } from "@/lib/data/ngx-pulse-cache";

export const revalidate = NGX_PULSE_PAGE_REVALIDATE;

export default async function HomePage() {
  const [summary, gainers, losers, volumeLeaders, indicators, news, trending] =
    await Promise.all([
      StockDataService.getMarketSummary(),
      StockDataService.getTopMovers("gainers", TOP_MOVERS_PREVIEW),
      StockDataService.getTopMovers("losers", TOP_MOVERS_PREVIEW),
      StockDataService.getTopMovers("volume", 5),
      StockDataService.getEconomicIndicators(),
      NewsService.fetchAllNews(),
      StockDataService.getTopMovers("gainers", 8),
    ]);

  const allStocks = await StockDataService.getAllStocks();
  const usingReferenceOnly = allStocks.every((s) => s.stale);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-neutral-heading">Market Overview</h1>
        <p className="mt-1 text-neutral-secondary">
          Live NGX market summary and Nigerian economic indicators
        </p>
        {usingReferenceOnly && (
          <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950/50 dark:text-amber-200">
            Stock prices are reference data until a live feed is connected. Add{" "}
            <code className="rounded bg-amber-100 px-1 dark:bg-amber-900/60">NGX_PULSE_API_KEY</code>{" "}
            (<a href="https://ngxpulse.ng/api" className="font-medium underline" target="_blank" rel="noopener noreferrer">
              ngxpulse.ng/api
            </a>
            ) for NGX board prices and/or <code className="rounded bg-amber-100 px-1 dark:bg-amber-900/60">ITICK_API_KEY</code> for
            charts and supplemental quotes.
          </p>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MarketStat
          label="NGX All-Share Index"
          value={summary.allShareIndex.toLocaleString("en-NG", { minimumFractionDigits: 2 })}
          change={summary.allShareChangePercent}
        />
        <MarketStat
          label="Total Market Cap"
          value={formatCompactNGN(summary.marketCap)}
        />
        <MarketStat
          label="Total Volume"
          value={summary.totalVolume.toLocaleString()}
        />
        <MarketStat
          label="Advancers / Decliners"
          value={`${summary.advancers} / ${summary.decliners}`}
        />
      </div>

      <section className="mt-8">
        <h2 className="mb-4 text-lg font-semibold text-neutral-heading">
          Economic Indicators
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {indicators.map((ind) => (
            <Card key={ind.label}>
              <CardContent className="p-4">
                <p className="text-xs font-medium uppercase tracking-wide text-neutral-secondary">
                  {ind.label}
                </p>
                <p className="mt-1 text-xl font-bold text-neutral-heading">{ind.value}</p>
                {ind.change && (
                  <p className={`mt-1 text-xs ${
                    ind.trend === "up" ? "text-gain" : ind.trend === "down" ? "text-loss" : "text-neutral-secondary"
                  }`}>
                    {ind.change}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="mt-8">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-neutral-heading">Trending Stocks</h2>
          <Link href="/stocks" className="flex items-center gap-1 text-sm text-primary hover:underline">
            View all <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <TrendingCarousel stocks={trending} />
      </section>

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <TopMoversCard
          title="Top Gainers"
          titleClassName={MOVER_PAGE_META.gainers.titleClass}
          stocks={gainers}
          seeMoreHref={MOVER_PAGE_META.gainers.href}
        />

        <TopMoversCard
          title="Top Losers"
          titleClassName={MOVER_PAGE_META.losers.titleClass}
          stocks={losers}
          seeMoreHref={MOVER_PAGE_META.losers.href}
        />

        <Card>
          <CardHeader>
            <CardTitle>Volume Leaders</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {volumeLeaders.map((s) => (
              <StockRow key={s.ticker} stock={s} />
            ))}
          </CardContent>
        </Card>
      </div>

      <section className="mt-8">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-neutral-heading">Market News</h2>
          <Link href="/news" className="flex items-center gap-1 text-sm text-primary hover:underline">
            All news <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <NewsList articles={news.slice(0, 6)} />
      </section>
    </div>
  );
}
