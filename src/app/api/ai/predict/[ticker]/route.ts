import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth";
import { getAIRateLimit, checkRateLimit } from "@/lib/cache/rate-limit";
import { getCachedStockForecast } from "@/lib/dashboard/stock-forecast";
import { headers } from "next/headers";

export const maxDuration = 120;

export async function GET(
  req: Request,
  { params }: { params: Promise<{ ticker: string }> }
) {
  const { ticker } = await params;
  const normalizedTicker = ticker.toUpperCase();
  const refresh = new URL(req.url).searchParams.get("refresh") === "1";

  const session = await getServerSession(authOptions);
  if (!session && refresh) {
    const headersList = await headers();
    const ip = headersList.get("x-forwarded-for") || "anonymous";
    const limiter = getAIRateLimit();
    const { success } = await checkRateLimit(limiter, ip);
    if (!success) {
      return NextResponse.json(
        { error: "AI rate limit reached. Sign in for unlimited access." },
        { status: 429 }
      );
    }
  }

  try {
    const forecast = await getCachedStockForecast(normalizedTicker, { refresh });
    if (!forecast) {
      return NextResponse.json(
        { error: "Forecast not available", ticker: normalizedTicker },
        { status: 404 }
      );
    }
    return NextResponse.json(forecast);
  } catch (err) {
    console.error(`[NaijaStocks] prediction failed for ${normalizedTicker}:`, err);
    return NextResponse.json(
      { error: "Prediction failed", ticker: normalizedTicker },
      { status: 500 }
    );
  }
}

export async function POST(
  req: Request,
  context: { params: Promise<{ ticker: string }> }
) {
  await req.json().catch(() => ({}));
  return GET(req, context);
}
