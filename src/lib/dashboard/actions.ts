"use server";

import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth";
import { connectMongoose } from "@/lib/db/mongoose";
import {
  Watchlist,
  ResearchHistory,
  UserPreferences,
  AiScreen,
  Transaction,
  SavedBrief,
} from "@/lib/db/models";
import { getStockKlineForTimeframe, getBatchStockKlinesForTimeframe, getStockListing } from "@/lib/data/stock-data-service";
import { tickerColor } from "@/lib/charts/ticker-color";
import type { Timeframe } from "@/types";
import type { KlineBar } from "@/types/stock";
import { getOrCreateDefaultWatchlist } from "./watchlist";
import { getBatchDailyResearchFromDb } from "./daily-stock-research";
import clientPromise from "@/lib/db/mongo-client";
import type { StockGrowthForecast } from "@/types/stock-forecast";

export interface PredictionChartSeries {
  ticker: string;
  color: string;
  forecast: StockGrowthForecast;
}

async function requireUserId(): Promise<string> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) throw new Error("Unauthorized");
  return session.user.id;
}

export async function fetchMultiStockKlines(tickers: string[], timeframe: Timeframe) {
  await requireUserId();
  const unique = [...new Set(tickers.map((t) => t.toUpperCase()))];
  const batch = await getBatchStockKlinesForTimeframe(unique, timeframe);

  return unique.map((ticker) => ({
    ticker,
    color: tickerColor(ticker),
    data: batch.get(ticker) ?? [],
  }));
}

export async function fetchBatchStockForecasts(
  tickers: string[]
): Promise<PredictionChartSeries[]> {
  await requireUserId();
  const unique = [...new Set(tickers.map((t) => t.toUpperCase()))];
  const batch = await getBatchDailyResearchFromDb(unique);

  return unique
    .map((ticker) => {
      const research = batch[ticker];
      if (!research?.forecast) return null;

      const forecast = research.forecast;

      return {
        ticker,
        color: tickerColor(ticker),
        forecast,
      };
    })
    .filter((s): s is PredictionChartSeries => s !== null);
}

export async function searchStockListing(query: string) {
  await requireUserId();
  const q = query.trim().toLowerCase();
  if (q.length < 1) return [];

  const listing = await getStockListing();
  return listing
    .filter(
      (item) =>
        item.code.toLowerCase().includes(q) || item.name.toLowerCase().includes(q)
    )
    .slice(0, 10)
    .map((item) => ({ code: item.code, name: item.name }));
}

export async function addToWatchlist(ticker: string) {
  const userId = await requireUserId();
  const normalized = ticker.toUpperCase();
  await connectMongoose();
  const wl = await getOrCreateDefaultWatchlist(userId);
  await Watchlist.findOneAndUpdate(
    { _id: wl._id, userId },
    { $addToSet: { items: { ticker: normalized, addedAt: new Date() } } }
  );
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/stocks");
  revalidatePath("/dashboard/stocks/watchlist");
  revalidatePath(`/dashboard/stocks/${normalized}`);
}

export async function removeFromWatchlist(ticker: string) {
  const userId = await requireUserId();
  const normalized = ticker.toUpperCase();
  await connectMongoose();
  await Watchlist.updateMany(
    { userId },
    { $pull: { items: { ticker: normalized } } }
  );
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/stocks");
  revalidatePath("/dashboard/stocks/watchlist");
  revalidatePath(`/dashboard/stocks/${normalized}`);
}

export async function updateUserProfile(displayName: string) {
  const userId = await requireUserId();
  await connectMongoose();
  await UserPreferences.findOneAndUpdate(
    { userId },
    { displayName: displayName.trim() },
    { upsert: true, new: true }
  );
  revalidatePath("/dashboard/settings");
}

export async function updateDisplayPreferences(prefs: {
  defaultTimeframe?: "1D" | "1W" | "1M" | "3M" | "1Y";
  currencyDisplay?: "NGN" | "NGN_USD";
  numberFormat?: "full" | "compact";
}) {
  const userId = await requireUserId();
  await connectMongoose();
  await UserPreferences.findOneAndUpdate({ userId }, prefs, { upsert: true, new: true });
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/settings");
}

export async function exportWatchlistCsv(): Promise<string> {
  const userId = await requireUserId();
  await connectMongoose();
  const watchlists = await Watchlist.find({ userId }).lean();
  const tickers = [...new Set(watchlists.flatMap((w) => w.items.map((i) => i.ticker)))];
  const { StockDataService } = await import("@/lib/data/stock-data-service");
  const stocks = await StockDataService.getAllStocks();
  const stockMap = new Map(stocks.map((s) => [s.ticker, s]));

  const header = "Ticker,Name,Price\n";
  const rows = tickers.map((t) => {
    const s = stockMap.get(t);
    const name = (s?.name ?? "").replace(/"/g, '""');
    const price = s?.price ?? 0;
    return `${t},"${name}",${price}`;
  });
  return header + rows.join("\n");
}

export async function clearResearchHistory() {
  const userId = await requireUserId();
  await connectMongoose();
  await ResearchHistory.deleteMany({ userId });
  revalidatePath("/dashboard/settings");
}

export async function saveAiScreenQuery(query: string) {
  const userId = await requireUserId();
  await connectMongoose();
  await AiScreen.create({ userId, query: query.trim(), ranAt: new Date() });
  const screens = await AiScreen.find({ userId }).sort({ ranAt: -1 }).lean();
  if (screens.length > 5) {
    const toDelete = screens.slice(5).map((s) => s._id);
    await AiScreen.deleteMany({ _id: { $in: toDelete } });
  }
  revalidatePath("/dashboard/ai");
}

export async function deleteAccount(confirmation: string) {
  if (confirmation !== "DELETE") throw new Error("Invalid confirmation");
  const userId = await requireUserId();
  await connectMongoose();
  await Promise.all([
    Watchlist.deleteMany({ userId }),
    Transaction.deleteMany({ userId }),
    ResearchHistory.deleteMany({ userId }),
    SavedBrief.deleteMany({ userId }),
    AiScreen.deleteMany({ userId }),
    UserPreferences.deleteMany({ userId }),
  ]);

  const client = await clientPromise;
  const db = client.db(process.env.MONGODB_DB || "naijastocks");
  const { ObjectId } = await import("mongodb");
  try {
    await db.collection("users").deleteOne({ _id: new ObjectId(userId) });
  } catch {
    await db.collection("users").deleteOne({ id: userId });
  }
}

export type ChartSeries = { ticker: string; color: string; data: KlineBar[] };

export async function fetchKlinesForTicker(ticker: string, timeframe: Timeframe): Promise<KlineBar[]> {
  await requireUserId();
  return getStockKlineForTimeframe(ticker.toUpperCase(), timeframe);
}
