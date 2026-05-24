import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth";
import { getAIRateLimit, checkRateLimit } from "@/lib/cache/rate-limit";
import { getCachedStockResearch } from "@/lib/dashboard/stock-forecast";
import { headers } from "next/headers";

export const maxDuration = 120;

async function enforceRateLimit() {
  const session = await getServerSession(authOptions);
  if (session) return null;

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
  return null;
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ ticker: string }> }
) {
  const { ticker } = await params;
  const normalizedTicker = ticker.toUpperCase();
  const refresh = new URL(req.url).searchParams.get("refresh") === "1";

  try {
    const research = await getCachedStockResearch(normalizedTicker, { refresh });
    if (!research) {
      return NextResponse.json(
        { error: "Research not available", ticker: normalizedTicker },
        { status: 404 }
      );
    }
    return NextResponse.json(research);
  } catch (err) {
    console.error(`[NaijaStocks] research GET failed for ${normalizedTicker}:`, err);
    return NextResponse.json(
      { error: "Research failed", ticker: normalizedTicker },
      { status: 500 }
    );
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ ticker: string }> }
) {
  const rateLimited = await enforceRateLimit();
  if (rateLimited) return rateLimited;

  const { ticker } = await params;
  const normalizedTicker = ticker.toUpperCase();
  await req.json().catch(() => ({}));

  try {
    const research = await getCachedStockResearch(normalizedTicker, { refresh: true });
    if (!research) {
      return NextResponse.json(
        { error: "Research generation failed", ticker: normalizedTicker },
        { status: 500 }
      );
    }
    return NextResponse.json(research);
  } catch (err) {
    console.error(`[NaijaStocks] research POST failed for ${normalizedTicker}:`, err);
    return NextResponse.json(
      { error: "Research failed", ticker: normalizedTicker },
      { status: 500 }
    );
  }
}
