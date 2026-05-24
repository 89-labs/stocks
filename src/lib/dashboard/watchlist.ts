import { connectMongoose } from "@/lib/db/mongoose";
import { Watchlist } from "@/lib/db/models";

export const DEFAULT_WATCHLIST_NAME = "My Watchlist";

export async function getOrCreateDefaultWatchlist(userId: string) {
  await connectMongoose();
  let wl = await Watchlist.findOne({ userId, name: DEFAULT_WATCHLIST_NAME });
  if (!wl) {
    wl = await Watchlist.create({ userId, name: DEFAULT_WATCHLIST_NAME, items: [] });
  }
  return wl;
}

export async function getUserWatchlistTickers(userId: string): Promise<string[]> {
  await connectMongoose();
  const watchlists = await Watchlist.find({ userId }).lean();
  const tickers = new Set<string>();
  for (const wl of watchlists) {
    for (const item of wl.items) {
      tickers.add(item.ticker.toUpperCase());
    }
  }
  return [...tickers];
}

export async function isTickerInWatchlist(userId: string, ticker: string): Promise<boolean> {
  await connectMongoose();
  const count = await Watchlist.countDocuments({
    userId,
    "items.ticker": ticker.toUpperCase(),
  });
  return count > 0;
}
