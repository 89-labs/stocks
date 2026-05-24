import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth";
import { mastra } from "@/mastra";
import { StockDataService } from "@/lib/data/stock-data-service";
import { connectMongoose } from "@/lib/db/mongoose";
import { AiScreen } from "@/lib/db/models";

export const maxDuration = 60;

interface ScreenerResult {
  rank: number;
  ticker: string;
  name: string;
  price: number;
  reasoning: string;
}

interface ScreenerAgentResult {
  rank?: number;
  ticker?: string;
  companyName?: string;
  name?: string;
  currentPrice?: number;
  price?: number;
  reasoning?: string;
}

function stripCodeFences(raw: string): string {
  return raw
    .replace(/```json/gi, "")
    .replace(/```/g, "")
    .trim();
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { query } = (await request.json().catch(() => ({}))) as { query?: string };
  if (!query || typeof query !== "string") {
    return NextResponse.json({ error: "Query required" }, { status: 400 });
  }

  let results: ScreenerResult[] = [];

  try {
    const workflow = mastra.getWorkflow("screeningWorkflow");
    const run = await workflow.createRun();
    const wf = await run.start({
      inputData: {
        query,
        userId: session.user.email ?? session.user.id,
      },
    });

    if (wf.status === "success") {
      const raw = stripCodeFences(wf.result?.results ?? "[]");
      try {
        const parsed = JSON.parse(raw) as ScreenerAgentResult[];
        if (Array.isArray(parsed)) {
          results = parsed.map((p, i) => ({
            rank: typeof p.rank === "number" ? p.rank : i + 1,
            ticker: p.ticker ?? "",
            name: p.companyName ?? p.name ?? p.ticker ?? "",
            price:
              typeof p.currentPrice === "number"
                ? p.currentPrice
                : typeof p.price === "number"
                  ? p.price
                  : 0,
            reasoning: p.reasoning ?? "",
          }));
        }
      } catch (parseErr) {
        console.error("[NaijaStocks] screener parse failed:", parseErr);
      }
    }
  } catch (err) {
    console.error("[NaijaStocks] screening workflow failed:", err);
  }

  if (results.length === 0) {
    const stocks = await StockDataService.getAllStocks();
    results = stocks.slice(0, 3).map((s, i) => ({
      rank: i + 1,
      ticker: s.ticker,
      name: s.name,
      price: s.price,
      reasoning: `${s.name} is a ${s.sector} stock on the NGX trading at ₦${s.price.toFixed(
        2
      )}.`,
    }));
  }

  await connectMongoose();
  await AiScreen.create({ userId: session.user.id, query: query.trim(), ranAt: new Date() });
  const screens = await AiScreen.find({ userId: session.user.id })
    .sort({ ranAt: -1 })
    .lean();
  if (screens.length > 5) {
    await AiScreen.deleteMany({
      _id: { $in: screens.slice(5).map((s) => s._id) },
    });
  }

  return NextResponse.json({ results });
}
