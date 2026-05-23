import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getNgxPulseCacheStatus } from "@/lib/data/ngx-pulse-cache";
import { StockDataService } from "@/lib/data/stock-data-service";

export async function POST(request: Request) {
  let ticker: string | undefined;
  try {
    const body = (await request.json()) as { ticker?: string };
    ticker = body.ticker?.toUpperCase();
  } catch {
    // no body — refresh all listings
  }

  StockDataService.invalidateCaches(ticker);

  if (ticker) {
    revalidatePath(`/stocks/${ticker}`);
  } else {
    revalidatePath("/stocks");
    revalidatePath("/");
  }

  const pulse = await getNgxPulseCacheStatus();

  return NextResponse.json({
    ok: true,
    ticker: ticker ?? null,
    pulse,
  });
}
