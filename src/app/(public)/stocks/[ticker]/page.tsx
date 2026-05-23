import { notFound } from "next/navigation";
import { StockDataService } from "@/lib/data/stock-data-service";
import { NewsService } from "@/lib/data/news-service";
import { StockDetailShell } from "@/components/stocks/stock-detail-shell";
import { AIPredictionPanel } from "@/components/stocks/ai-prediction-panel";
import { TradeSimulator } from "@/components/simulator/trade-simulator";
import { BrokerCards, RelatedStocks } from "@/components/stocks/broker-cards";
import { NewsList } from "@/components/news/news-card";
import { RecordResearchVisit } from "@/components/stocks/record-research-visit";
import { TIMEFRAME_DAYS } from "@/lib/charts/timeframe";

export const revalidate = 300;

interface PageProps {
  params: Promise<{ ticker: string }>;
}

export async function generateStaticParams() {
  const stocks = await StockDataService.getAllStocks();
  return stocks.map((s) => ({ ticker: s.ticker }));
}

export async function generateMetadata({ params }: PageProps) {
  const { ticker } = await params;
  const stock = await StockDataService.getStockDetail(ticker);
  if (!stock) return { title: "Stock Not Found" };
  return {
    title: `${stock.ticker} — ${stock.name}`,
    description: `Live quote, charts, AI predictions, and analysis for ${stock.name} (${stock.ticker}) on the NGX.`,
  };
}

export default async function StockDetailPage({ params }: PageProps) {
  const { ticker } = await params;
  const stock = await StockDataService.getStockDetail(ticker);

  if (!stock) notFound();

  const [quote, ohlcv, news, relatedStocks] = await Promise.all([
    StockDataService.getQuote(ticker),
    StockDataService.getOHLCV(ticker, TIMEFRAME_DAYS["1Y"]),
    NewsService.getNewsForTicker(ticker),
    StockDataService.getStocksBySector(stock.sector),
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
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <RecordResearchVisit ticker={stock.ticker} />

      <StockDetailShell stock={stock} quote={quote} initialOhlcv={ohlcv}>
        <AIPredictionPanel
          ticker={stock.ticker}
          currentPrice={stock.price}
          companyName={stock.name}
        />

        <TradeSimulator
          ticker={stock.ticker}
          currentPrice={stock.price}
          companyName={stock.name}
        />

        <BrokerCards />

        {news.length > 0 && (
          <section>
            <h2 className="mb-4 text-lg font-semibold text-neutral-heading">
              News for {stock.ticker}
            </h2>
            <NewsList articles={news.slice(0, 6)} />
          </section>
        )}

        {related.length > 0 && <RelatedStocks stocks={related} />}
      </StockDetailShell>
    </div>
  );
}
