import { connectMongoose } from "@/lib/db/mongoose";
import { DailyMarketBrief } from "@/lib/db/models";
import { cacheDelete, cacheGet, cacheSet } from "@/lib/cache/redis";
import { getAnalysisDateKey } from "@/lib/dashboard/daily-stock-research";

const GENERATION_LOCK_MS = 10 * 60 * 1000;
const POLL_INTERVAL_MS = 2000;
const POLL_MAX_MS = 120_000;
const BRIEF_REDIS_TTL_SEC = 86_400;

export interface DailyMarketBriefRecord {
  analysisDate: string;
  text: string;
  generatedAt: string;
}

function briefCacheKey(analysisDate: string): string {
  return `ai:daily-brief:${analysisDate}`;
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

function docToBrief(doc: {
  analysisDate: string;
  brief?: string | null;
  generatedAt?: Date | null;
}): DailyMarketBriefRecord | null {
  if (!doc.brief?.trim()) return null;
  return {
    analysisDate: doc.analysisDate,
    text: doc.brief,
    generatedAt: (doc.generatedAt ?? new Date()).toISOString(),
  };
}

async function waitForCompleteBrief(
  analysisDate: string
): Promise<DailyMarketBriefRecord | null> {
  const started = Date.now();

  while (Date.now() - started < POLL_MAX_MS) {
    await connectMongoose();
    const doc = await DailyMarketBrief.findOne({
      analysisDate,
      status: "complete",
    }).lean();

    const brief = doc ? docToBrief(doc) : null;
    if (brief) return brief;

    const pending = await DailyMarketBrief.findOne({ analysisDate }).lean();
    if (!pending) return null;
    if (pending.status === "failed") {
      throw new Error(pending.errorMessage ?? "Daily market brief generation failed");
    }

    await sleep(POLL_INTERVAL_MS);
  }

  throw new Error("Timed out waiting for daily market brief");
}

async function tryAcquireGenerationLock(analysisDate: string): Promise<boolean> {
  await connectMongoose();
  const now = new Date();
  const lockExpiresAt = new Date(now.getTime() + GENERATION_LOCK_MS);

  const reclaimed = await DailyMarketBrief.findOneAndUpdate(
    {
      analysisDate,
      status: "generating",
      lockExpiresAt: { $lt: now },
    },
    { $set: { lockExpiresAt, updatedAt: now } }
  );
  if (reclaimed) return true;

  try {
    await DailyMarketBrief.create({
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

async function saveCompleteBrief(
  analysisDate: string,
  brief: string,
  generatedAt: string
): Promise<void> {
  await connectMongoose();
  await DailyMarketBrief.findOneAndUpdate(
    { analysisDate },
    {
      $set: {
        analysisDate,
        status: "complete",
        brief,
        generatedAt: new Date(generatedAt),
        lockExpiresAt: null,
        errorMessage: null,
      },
    },
    { upsert: true }
  );
}

async function markGenerationFailed(analysisDate: string, message: string): Promise<void> {
  await connectMongoose();
  await DailyMarketBrief.findOneAndUpdate(
    { analysisDate },
    { $set: { status: "failed", errorMessage: message, lockExpiresAt: null } }
  );
}

export async function getDailyMarketBriefFromDb(
  analysisDate = getAnalysisDateKey()
): Promise<DailyMarketBriefRecord | null> {
  await connectMongoose();
  const doc = await DailyMarketBrief.findOne({
    analysisDate,
    status: "complete",
  }).lean();

  return doc ? docToBrief(doc) : null;
}

async function generateMarketBriefWithWorkflow(): Promise<{
  brief: string;
  generatedAt: string;
}> {
  const { mastra } = await import("@/mastra");
  const workflow = mastra.getWorkflow("marketBriefWorkflow");
  const run = await workflow.createRun();
  const analysisDate = getAnalysisDateKey();

  const result = await run.start({
    inputData: { date: analysisDate },
  });

  if (result.status !== "success") {
    throw new Error("Market brief workflow did not complete");
  }

  return {
    brief: result.result?.brief ?? "",
    generatedAt: result.result?.generatedAt ?? new Date().toISOString(),
  };
}

async function getOrCreateDailyMarketBrief(options?: {
  refresh?: boolean;
}): Promise<{
  record: DailyMarketBriefRecord;
  fromCache: boolean;
  analysisDate: string;
}> {
  const analysisDate = getAnalysisDateKey();

  if (!options?.refresh) {
    const redisHit = await cacheGet<DailyMarketBriefRecord>(briefCacheKey(analysisDate));
    if (redisHit?.text && redisHit.analysisDate === analysisDate) {
      return { record: redisHit, fromCache: true, analysisDate };
    }

    const existing = await getDailyMarketBriefFromDb(analysisDate);
    if (existing) {
      await cacheSet(briefCacheKey(analysisDate), existing, BRIEF_REDIS_TTL_SEC);
      return { record: existing, fromCache: true, analysisDate };
    }
  } else {
    await connectMongoose();
    await DailyMarketBrief.deleteOne({ analysisDate });
    await cacheDelete(briefCacheKey(analysisDate));
  }

  const acquired = await tryAcquireGenerationLock(analysisDate);

  if (!acquired) {
    const waited = await waitForCompleteBrief(analysisDate);
    if (waited) {
      await cacheSet(briefCacheKey(analysisDate), waited, BRIEF_REDIS_TTL_SEC);
      return { record: waited, fromCache: true, analysisDate };
    }
    throw new Error("Could not load or generate daily market brief");
  }

  try {
    const { brief, generatedAt } = await generateMarketBriefWithWorkflow();
    if (!brief.trim()) {
      throw new Error("Market brief workflow returned empty text");
    }

    await saveCompleteBrief(analysisDate, brief, generatedAt);
    const record: DailyMarketBriefRecord = { analysisDate, text: brief, generatedAt };
    await cacheSet(briefCacheKey(analysisDate), record, BRIEF_REDIS_TTL_SEC);

    return { record, fromCache: false, analysisDate };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Generation failed";
    await markGenerationFailed(analysisDate, message);
    throw err;
  }
}

/**
 * Returns today's shared NGX market brief. Only the first request of the day
 * runs the AI workflow; concurrent requests wait for the same DB record.
 */
export async function getCachedDailyMarketBrief(options?: {
  refresh?: boolean;
}): Promise<(DailyMarketBriefRecord & { fromCache: boolean }) | null> {
  try {
    const { record, fromCache } = await getOrCreateDailyMarketBrief(options);
    return { ...record, fromCache };
  } catch (err) {
    console.error("[NaijaStocks] daily market brief failed:", err);
    return null;
  }
}
