import { NextResponse } from "next/server";
import {
  getStockKline,
  getStockKlineForTimeframe,
  klineBarsToOHLCV,
} from "@/lib/data/stock-data-service";
import { TIMEFRAME_KLINE, isIntradayKType } from "@/lib/data/itick-timeframe";
import type { Timeframe } from "@/types";

const TIMEFRAMES = Object.keys(TIMEFRAME_KLINE) as Timeframe[];

export async function GET(
  request: Request,
  { params }: { params: Promise<{ ticker: string }> }
) {
  const { ticker } = await params;
  const { searchParams } = new URL(request.url);
  const timeframeParam = searchParams.get("timeframe")?.toUpperCase();

  if (timeframeParam && TIMEFRAMES.includes(timeframeParam as Timeframe)) {
    const bars = await getStockKlineForTimeframe(ticker, timeframeParam as Timeframe);
    const { kType } = TIMEFRAME_KLINE[timeframeParam as Timeframe];
    return NextResponse.json(klineBarsToOHLCV(bars, isIntradayKType(kType)));
  }

  const kType = parseInt(searchParams.get("kType") || "8", 10);
  const limit = Math.min(500, Math.max(1, parseInt(searchParams.get("limit") || "30", 10)));
  const etParam = searchParams.get("et");
  const et = etParam ? parseInt(etParam, 10) : undefined;

  const bars = await getStockKline(ticker, kType, limit, et);
  return NextResponse.json(klineBarsToOHLCV(bars, isIntradayKType(kType)));
}
