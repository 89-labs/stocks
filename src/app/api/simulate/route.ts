import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth";
import { AIService } from "@/lib/data/ai-service";
import { StockDataService } from "@/lib/data/stock-data-service";
import { getSimRateLimit, checkRateLimit } from "@/lib/cache/rate-limit";
import { headers } from "next/headers";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  const body = await request.json();
  const { ticker, amount } = body;

  if (!ticker || !amount || amount < 1000) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  if (!session) {
    const headersList = await headers();
    const ip = headersList.get("x-forwarded-for") || "anonymous";
    const limiter = getSimRateLimit();
    const { success } = await checkRateLimit(limiter, ip);

    if (!success) {
      return NextResponse.json(
        { error: "Daily simulation limit reached. Sign in for unlimited access." },
        { status: 429 }
      );
    }
  }

  const stock = await StockDataService.getStockDetail(ticker);
  if (!stock) {
    return NextResponse.json({ error: "Stock not found" }, { status: 404 });
  }

  const result = await AIService.simulateTrade(
    stock.ticker,
    amount,
    stock.price,
    stock.name
  );

  return NextResponse.json(result);
}
