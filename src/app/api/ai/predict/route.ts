import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth";
import { AIService } from "@/lib/data/ai-service";
import { getAIRateLimit, checkRateLimit } from "@/lib/cache/rate-limit";
import { headers } from "next/headers";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session) {
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

  const body = await request.json();
  const { ticker, currentPrice, companyName } = body;

  if (!ticker || !currentPrice) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const prediction = await AIService.predictStock(ticker, currentPrice, companyName);
  return NextResponse.json(prediction);
}
