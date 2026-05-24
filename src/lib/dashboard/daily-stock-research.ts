import { connectMongoose } from "@/lib/db/mongoose";
import { DailyStockResearch } from "@/lib/db/models";
import type { StockResearch } from "@/types/stock-forecast";

const ANALYSIS_TIMEZONE = "Africa/Lagos";
const GENERATION_LOCK_MS = 10 * 60 * 1000;
const POLL_INTERVAL_MS = 2000;
const POLL_MAX_MS = 90_000;

export function getAnalysisDateKey(date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: ANALYSIS_TIMEZONE }).format(date);
}

function isDuplicateKeyError(err: unknown): boolean {
  return (
    typeof err === "object" &&
    err !== null &&
    "code" in err &&
    (err as { code: number }).code === 11000
  );
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function docToResearch(doc: {
  research?: unknown;
  analysisDate: string;
}): StockResearch | null {
  if (!doc.research || typeof doc.research !== "object") return null;
  return doc.research as StockResearch;
}

async function waitForCompleteResearch(
  ticker: string,
  analysisDate: string
): Promise<StockResearch | null> {
  const started = Date.now();

  while (Date.now() - started < POLL_MAX_MS) {
    await connectMongoose();
    const doc = await DailyStockResearch.findOne({
      ticker,
      analysisDate,
      status: "complete",
    }).lean();

    const research = doc ? docToResearch(doc) : null;
    if (research) return research;

    const pending = await DailyStockResearch.findOne({ ticker, analysisDate }).lean();
    if (!pending) return null;
    if (pending.status === "failed") {
      throw new Error(pending.errorMessage ?? "Daily research generation failed");
    }

    await sleep(POLL_INTERVAL_MS);
  }

  throw new Error("Timed out waiting for daily stock research");
}

async function tryAcquireGenerationLock(
  ticker: string,
  analysisDate: string
): Promise<boolean> {
  await connectMongoose();
  const now = new Date();
  const lockExpiresAt = new Date(now.getTime() + GENERATION_LOCK_MS);

  const reclaimed = await DailyStockResearch.findOneAndUpdate(
    {
      ticker,
      analysisDate,
      status: "generating",
      lockExpiresAt: { $lt: now },
    },
    { $set: { lockExpiresAt, updatedAt: now } }
  );
  if (reclaimed) return true;

  try {
    await DailyStockResearch.create({
      ticker,
      analysisDate,
      status: "generating",
      lockExpiresAt,
    });
    return true;
  } catch (err) {
    if (isDuplicateKeyError(err)) return false;
    throw err;
  }
}

async function saveCompleteResearch(
  ticker: string,
  analysisDate: string,
  research: StockResearch
): Promise<void> {
  await connectMongoose();
  await DailyStockResearch.findOneAndUpdate(
    { ticker, analysisDate },
    {
      $set: {
        ticker,
        analysisDate,
        companyName: research.companyName,
        status: "complete",
        research,
        generatedAt: new Date(research.generatedAt),
        lockExpiresAt: null,
        errorMessage: null,
      },
    },
    { upsert: true }
  );
}

async function markGenerationFailed(
  ticker: string,
  analysisDate: string,
  message: string
): Promise<void> {
  await connectMongoose();
  await DailyStockResearch.findOneAndUpdate(
    { ticker, analysisDate },
    { $set: { status: "failed", errorMessage: message, lockExpiresAt: null } }
  );
}

export async function getDailyResearchFromDb(
  ticker: string,
  analysisDate = getAnalysisDateKey()
): Promise<StockResearch | null> {
  await connectMongoose();
  const doc = await DailyStockResearch.findOne({
    ticker: ticker.toUpperCase(),
    analysisDate,
    status: "complete",
  }).lean();

  return doc ? docToResearch(doc) : null;
}

/** Batch-read today's completed research for dashboard prediction charts. */
export async function getBatchDailyResearchFromDb(
  tickers: string[],
  analysisDate = getAnalysisDateKey()
): Promise<Record<string, StockResearch>> {
  const normalized = [...new Set(tickers.map((t) => t.toUpperCase()).filter(Boolean))];
  if (normalized.length === 0) return {};

  await connectMongoose();
  const docs = await DailyStockResearch.find({
    ticker: { $in: normalized },
    analysisDate,
    status: "complete",
  }).lean();

  const map: Record<string, StockResearch> = {};
  for (const doc of docs) {
    const research = docToResearch(doc);
    if (research) map[doc.ticker] = research;
  }
  return map;
}

export async function clearDailyResearchForToday(ticker: string): Promise<void> {
  await connectMongoose();
  await DailyStockResearch.deleteOne({
    ticker: ticker.toUpperCase(),
    analysisDate: getAnalysisDateKey(),
  });
}

/**
 * Returns today's shared research for a ticker. Only the first request of the day
 * runs the generator; concurrent requests wait for the same DB record.
 */
export async function getOrCreateDailyStockResearch(
  ticker: string,
  generate: () => Promise<StockResearch>,
  options?: { refresh?: boolean }
): Promise<{
  research: StockResearch;
  fromCache: boolean;
  analysisDate: string;
}> {
  const normalized = ticker.toUpperCase();
  const analysisDate = getAnalysisDateKey();

  if (!options?.refresh) {
    const existing = await getDailyResearchFromDb(normalized, analysisDate);
    if (existing) {
      return { research: existing, fromCache: true, analysisDate };
    }
  } else {
    await clearDailyResearchForToday(normalized);
  }

  const acquired = await tryAcquireGenerationLock(normalized, analysisDate);

  if (!acquired) {
    const waited = await waitForCompleteResearch(normalized, analysisDate);
    if (waited) {
      return { research: waited, fromCache: true, analysisDate };
    }
    throw new Error("Could not load or generate daily research");
  }

  try {
    const research = await generate();
    await saveCompleteResearch(normalized, analysisDate, research);
    return { research, fromCache: false, analysisDate };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Generation failed";
    await markGenerationFailed(normalized, analysisDate, message);
    throw err;
  }
}
