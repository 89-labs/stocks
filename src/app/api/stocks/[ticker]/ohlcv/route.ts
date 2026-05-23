import { NextResponse } from "next/server";
import { StockDataService } from "@/lib/data/stock-data-service";
import { TIMEFRAME_KLINE } from "@/lib/data/itick-timeframe";
import type { Timeframe } from "@/types";

const MAX_DAYS = 1825;
const TIMEFRAMES = Object.keys(TIMEFRAME_KLINE) as Timeframe[];

export async function GET(
  request: Request,
  { params }: { params: Promise<{ ticker: string }> }
) {
  const { ticker } = await params;
  const { searchParams } = new URL(request.url);
  const days = Math.min(
    MAX_DAYS,
    Math.max(1, parseInt(searchParams.get("days") || "30", 10))
  );
  const timeframeParam = searchParams.get("timeframe")?.toUpperCase();
  const timeframe = TIMEFRAMES.includes(timeframeParam as Timeframe)
    ? (timeframeParam as Timeframe)
    : undefined;

  if (searchParams.get("refresh") === "1") {
    StockDataService.invalidateCaches(ticker);
  }

  const data = await StockDataService.getOHLCV(ticker, days, { timeframe });
  if (!data.length) {
    return NextResponse.json({ error: "Stock not found" }, { status: 404 });
  }

  return NextResponse.json(data);
}
