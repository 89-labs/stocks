import { Suspense } from "react";
import { Bell, Plus, RefreshCw, TrendingUp } from "lucide-react";
import { getCurrentUser } from "@/lib/auth/session";
import { getUserWatchlistTickers } from "@/lib/dashboard/watchlist";
import { getUserPreferences } from "@/lib/dashboard/user-preferences";
import { fetchMultiStockKlines, fetchBatchStockForecasts } from "@/lib/dashboard/actions";
import { StockDataService } from "@/lib/data/stock-data-service";
import { getMarketHolidays } from "@/lib/data/stock-data-service";
import { NewsService } from "@/lib/data/news-service";
import { NGX_UNIVERSE } from "@/lib/data/ngx-universe";
import { getBatchStockQuotes } from "@/lib/data/stock-data-service";
import { getUsdNgnRate } from "@/lib/dashboard/exchange-rate";
import { SummaryBar } from "@/components/dashboard/summary-bar";
import { PortfolioChartClient } from "@/components/dashboard/portfolio-chart-client";
import { PortfolioPredictionChartClient } from "@/components/dashboard/portfolio-prediction-chart-client";
import { MarketMoversCard } from "@/components/dashboard/market-movers-card";
import { RecentNewsCard } from "@/components/dashboard/recent-news-card";
import {
  DashboardCard,
  DashboardHeader,
  DashboardPageShell,
  ToolbarButton,
} from "@/components/dashboard/dashboard-ui";
import { Skeleton } from "@/components/ui/skeleton";

export const dynamic = "force-dynamic";

function SummarySkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <Skeleton key={i} className="h-[132px] rounded-2xl" />
      ))}
    </div>
  );
}

function ChartSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-[440px] rounded-2xl" />
      <Skeleton className="h-[520px] rounded-2xl" />
    </div>
  );
}

function GridSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
      <Skeleton className="h-80 rounded-2xl" />
      <Skeleton className="h-80 rounded-2xl" />
    </div>
  );
}

async function isMarketOpenNow(): Promise<boolean> {
  const holidays = await getMarketHolidays();
  const today = new Date().toISOString().split("T")[0];
  if (holidays.some((h) => h.date === today)) return false;
  const day = new Date().getDay();
  if (day === 0 || day === 6) return false;
  const hour = new Date().getHours();
  return hour >= 10 && hour < 14;
}

function formatNumber(value: number): string {
  return value.toLocaleString("en-NG", { maximumFractionDigits: 2 });
}

async function DashboardTopBar() {
  const isOpen = await isMarketOpenNow();
  const formattedDate = new Date().toLocaleDateString("en-NG", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return (
    <DashboardHeader
      eyebrow="NaijaStocks workspace"
      title="Analysis dashboard"
      description="A polished command center for your Nigerian equities watchlist, macro context, market movement, and AI-assisted research."
      meta={
        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
          <span className="rounded-full bg-slate-100 px-3 py-1 dark:bg-slate-900">
            {formattedDate}
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 dark:bg-slate-900">
            <span className={isOpen ? "h-1.5 w-1.5 rounded-full bg-green-500" : "h-1.5 w-1.5 rounded-full bg-red-500"} />
            NGX market {isOpen ? "open" : "closed"}
          </span>
        </div>
      }
      actions={
        <>
          <ToolbarButton>
            <RefreshCw className="h-3.5 w-3.5" /> Refresh
          </ToolbarButton>
          <ToolbarButton>
            <Bell className="h-3.5 w-3.5" /> Alerts
          </ToolbarButton>
          <ToolbarButton href="/dashboard/stocks">Browse market</ToolbarButton>
          <ToolbarButton href="/dashboard/stocks/watchlist" variant="primary">
            <Plus className="h-3.5 w-3.5" /> Add stock
          </ToolbarButton>
        </>
      }
    />
  );
}

async function MacroStrip() {
  const [summary, fx] = await Promise.all([
    StockDataService.getMarketSummary(),
    getUsdNgnRate(),
  ]);
  const changePercent = summary.allShareChangePercent;
  const tiles = [
    {
      label: "NGX all-share index",
      value: formatNumber(summary.allShareIndex),
      sub: `${changePercent > 0 ? "▲" : "▼"} ${Math.abs(changePercent).toFixed(2)}% today`,
      subClass: changePercent >= 0 ? "text-green-600" : "text-red-500",
    },
    {
      label: "NGN / USD rate",
      value: `₦${fx.rate.toFixed(2)}`,
      sub: "CBN official · live",
      subClass: "text-slate-400",
    },
    {
      label: "CBN policy rate",
      value: "27.50%",
      sub: "Last MPC meeting",
      subClass: "text-slate-400",
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
      {tiles.map((tile) => (
        <DashboardCard key={tile.label} className="p-4">
          <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">
            {tile.label}
          </div>
          <div className="text-xl font-semibold tracking-[-0.02em] text-slate-950 dark:text-slate-50">
            {tile.value}
          </div>
          <div className={`mt-2 text-xs font-medium ${tile.subClass}`}>{tile.sub}</div>
        </DashboardCard>
      ))}
    </div>
  );
}

async function ChartSection() {
  const user = await getCurrentUser();
  if (!user) return null;

  const [tickers, prefs] = await Promise.all([
    getUserWatchlistTickers(user.id),
    getUserPreferences(user.id),
  ]);

  const selected = tickers.slice(0, 8);

  const [initialSeries, predictionSeries] = await Promise.all([
    selected.length > 0
      ? fetchMultiStockKlines(selected, prefs.defaultTimeframe)
      : Promise.resolve([]),
    selected.length > 0 ? fetchBatchStockForecasts(selected) : Promise.resolve([]),
  ]);

  const predictedSet = new Set(predictionSeries.map((s) => s.ticker));
  const missingTickers = selected.filter((t) => !predictedSet.has(t));

  return (
    <div className="space-y-6">
      <PortfolioChartClient
        tickers={selected}
        initialSeries={initialSeries}
        defaultTimeframe={prefs.defaultTimeframe}
      />
      <PortfolioPredictionChartClient
        tickers={selected}
        initialSeries={predictionSeries}
        missingTickers={missingTickers}
      />
    </div>
  );
}

async function MoversAndNews() {
  const topTickers = NGX_UNIVERSE.slice(0, 30).map((e) => e.ticker);
  const [quotes, newsBundle] = await Promise.all([
    getBatchStockQuotes(topTickers),
    NewsService.getNewsBundle(),
  ]);

  const stocks = await StockDataService.getAllStocks();
  const quoteMap = new Map(quotes.map((q) => [q.symbol, q]));

  const enriched = stocks
    .filter((s) => quotes.length === 0 || quoteMap.has(s.ticker))
    .map((s) => {
      const q = quoteMap.get(s.ticker);
      return q ? { ...s, changePercent: q.changePercent, price: q.latestPrice } : s;
    });

  const gainers = [...enriched]
    .sort((a, b) => b.changePercent - a.changePercent)
    .slice(0, 5);
  const losers = [...enriched]
    .sort((a, b) => a.changePercent - b.changePercent)
    .slice(0, 5);

  const news = newsBundle.articles.slice(0, 4);

  return (
    <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
      <MarketMoversCard gainers={gainers} losers={losers} />
      <RecentNewsCard articles={news} />
    </div>
  );
}

export default async function DashboardPage() {
  return (
    <DashboardPageShell>
        <Suspense fallback={<Skeleton className="h-[200px] w-full rounded-2xl" />}>
          <DashboardTopBar />
        </Suspense>

        <Suspense
          fallback={
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-[112px] rounded-2xl" />
              ))}
            </div>
          }
        >
          <MacroStrip />
        </Suspense>

        <Suspense fallback={<SummarySkeleton />}>
          <SummaryBar />
        </Suspense>

        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
          <TrendingUp className="h-3.5 w-3.5 text-[#00A651]" />
          Portfolio intelligence
        </div>

        <Suspense fallback={<ChartSkeleton />}>
          <ChartSection />
        </Suspense>

        <Suspense fallback={<GridSkeleton />}>
          <MoversAndNews />
        </Suspense>
    </DashboardPageShell>
  );
}
