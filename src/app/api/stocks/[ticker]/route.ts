import { NextResponse } from "next/server";
import { StockDataService, getStockInfo } from "@/lib/data/stock-data-service";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ ticker: string }> }
) {
  const { ticker } = await params;
  const [quote] = await Promise.all([
    StockDataService.getQuote(ticker),
    getStockInfo(ticker).catch(() => null),
  ]);

  if (!quote) {
    return NextResponse.json({ error: "Stock not found" }, { status: 404 });
  }

  return NextResponse.json(quote);
}
