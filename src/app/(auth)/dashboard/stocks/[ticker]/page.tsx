import { notFound } from "next/navigation";
import { StockDataService } from "@/lib/data/stock-data-service";
import { NewsService } from "@/lib/data/news-service";
import { getStockKlineForTimeframe } from "@/lib/data/stock-data-service";
import { getCurrentUser } from "@/lib/auth/session";
import { isTickerInWatchlist } from "@/lib/dashboard/watchlist";
import {
  getResearchVisitCount,
  recordResearchVisit,
} from "@/lib/dashboard/research-history";
import { StockDetailTabs } from "@/components/dashboard/stock-detail-tabs";
import { TIMEFRAME_DAYS } from "@/lib/charts/timeframe";
import { DashboardPageShell } from "@/components/dashboard/dashboard-ui";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ ticker: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { ticker } = await params;
  const stock = await StockDataService.getStockDetail(ticker);
  if (!stock) return { title: "Stock Not Found" };
  return {
    title: `${stock.ticker} — ${stock.name}`,
    description: `Research terminal for ${stock.name} (${stock.ticker}) on the NGX.`,
  };
}

export default async function DashboardStockDetailPage({ params }: PageProps) {
  const { ticker } = await params;
  const stock = await StockDataService.getStockDetail(ticker);
  if (!stock) notFound();

  const user = await getCurrentUser();
  if (!user) notFound();

  await recordResearchVisit(user.id, stock.ticker);

  const [quote, ohlcv, news, relatedStocks, klineBars, visitCount, inWatchlist] =
    await Promise.all([
      StockDataService.getQuote(ticker),
      StockDataService.getOHLCV(ticker, TIMEFRAME_DAYS["1Y"]),
      NewsService.getNewsForTicker(ticker),
      StockDataService.getStocksBySector(stock.sector),
      getStockKlineForTimeframe(ticker, "3M"),
      getResearchVisitCount(user.id, stock.ticker),
      isTickerInWatchlist(user.id, stock.ticker),
    ]);

  const related = relatedStocks
    .filter((s) => s.ticker !== stock.ticker)
    .slice(0, 5)
    .map((s) => ({
      ticker: s.ticker,
      name: s.name,
      price: s.price,
      changePercent: s.changePercent,
    }));

  return (
    <DashboardPageShell>
        <StockDetailTabs
          stock={stock}
          quote={quote}
          initialOhlcv={ohlcv}
          klineBars={klineBars}
          news={news}
          related={related}
          visitCount={visitCount}
          inWatchlist={inWatchlist}
        />
    </DashboardPageShell>
  );
}
