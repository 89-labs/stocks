import { connectMongoose } from "@/lib/db/mongoose";
import { ResearchHistory } from "@/lib/db/models";

export async function recordResearchVisit(userId: string, ticker: string) {
  const normalized = ticker.toUpperCase();
  await connectMongoose();
  await ResearchHistory.create({
    userId,
    ticker: normalized,
    visitedAt: new Date(),
  });
}

export async function getResearchVisitCount(userId: string, ticker: string) {
  await connectMongoose();
  return ResearchHistory.countDocuments({ userId, ticker: ticker.toUpperCase() });
}
