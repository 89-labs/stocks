import { getCurrentUser } from "@/lib/auth/session";
import { getUserWatchlistTickers } from "@/lib/dashboard/watchlist";
import { getStockKlineForTimeframe, getStockQuote } from "@/lib/data/stock-data-service";
import { lookupTicker } from "@/lib/data/ngx-universe";
import { tickerColor } from "@/lib/charts/ticker-color";
import { StocksPageClient } from "@/components/dashboard/stocks-page-client";
import type { WatchlistRow } from "@/components/dashboard/watchlist-table";

export const dynamic = "force-dynamic";

async function buildWatchlistRows(tickers: string[]): Promise<WatchlistRow[]> {
  const rows = await Promise.all(
    tickers.map(async (ticker) => {
      const [quote, kline] = await Promise.all([
        getStockQuote(ticker).catch(() => null),
        getStockKlineForTimeframe(ticker, "1W").catch(() => []),
      ]);
      const entry = lookupTicker(ticker);
      return {
        ticker,
        name: entry?.name ?? ticker,
        price: quote?.latestPrice ?? 0,
        changePercent: quote?.changePercent ?? 0,
        volume: quote?.volume ?? 0,
        sparkline: kline.map((b) => b.close),
      };
    })
  );
  return rows;
}

export default async function DashboardWatchlistPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const tickers = await getUserWatchlistTickers(user.id);
  const rows = await buildWatchlistRows(tickers);

  const initialComparisonSeries =
    tickers.length >= 2
      ? await Promise.all(
          tickers.slice(0, 2).map(async (ticker) => ({
            ticker,
            color: tickerColor(ticker),
            data: await getStockKlineForTimeframe(ticker, "1M"),
          }))
        )
      : [];

  return <StocksPageClient rows={rows} initialComparisonSeries={initialComparisonSeries} />;
}
