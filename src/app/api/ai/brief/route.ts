import { NextResponse } from "next/server";
import { getCachedDailyMarketBrief } from "@/lib/dashboard/daily-market-brief";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

export async function GET(request: Request) {
  try {
    const refresh = new URL(request.url).searchParams.get("refresh") === "1";
    const result = await getCachedDailyMarketBrief({ refresh });

    if (!result?.text) {
      return NextResponse.json(
        { error: "Brief generation failed" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      brief: result.text,
      text: result.text,
      generatedAt: result.generatedAt,
      analysisDate: result.analysisDate,
      fromCache: result.fromCache,
    });
  } catch (err) {
    console.error("[NaijaStocks] brief route error:", err);
    return NextResponse.json(
      { error: "Brief generation failed" },
      { status: 500 }
    );
  }
}
