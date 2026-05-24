import { connectMongoose } from "@/lib/db/mongoose";
import { Transaction } from "@/lib/db/models";
import { StockDataService } from "@/lib/data/stock-data-service";

export async function getPortfolioValue(userId: string): Promise<number> {
  await connectMongoose();
  const transactions = await Transaction.find({ userId }).lean();
  const holdings = new Map<string, number>();

  for (const tx of transactions) {
    const current = holdings.get(tx.ticker) ?? 0;
    if (tx.type === "BUY") {
      holdings.set(tx.ticker, current + tx.quantity);
    } else {
      holdings.set(tx.ticker, current - tx.quantity);
    }
  }

  const active = [...holdings.entries()].filter(([, qty]) => qty > 0);
  if (active.length === 0) return 0;

  const stocks = await StockDataService.getAllStocks();
  const priceMap = new Map(stocks.map((s) => [s.ticker, s.price]));

  return active.reduce((sum, [ticker, qty]) => {
    const price = priceMap.get(ticker) ?? 0;
    return sum + qty * price;
  }, 0);
}
