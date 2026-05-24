import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth";
import { mastra } from "@/mastra";

export const maxDuration = 60;

function stripCodeFences(raw: string): string {
  return raw
    .replace(/```json/gi, "")
    .replace(/```/g, "")
    .trim();
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  const body = (await req.json().catch(() => ({}))) as { query?: string };
  const query = body.query?.trim();
  if (!query) {
    return NextResponse.json({ error: "Query required" }, { status: 400 });
  }

  try {
    const workflow = mastra.getWorkflow("screeningWorkflow");
    const run = await workflow.createRun();
    const result = await run.start({
      inputData: {
        query,
        userId: session?.user?.email ?? session?.user?.id ?? "guest",
      },
    });

    if (result.status !== "success") {
      console.error(
        "[NaijaStocks] screeningWorkflow did not complete:",
        result
      );
      return NextResponse.json(
        { error: "Screening failed" },
        { status: 500 }
      );
    }

    const raw = stripCodeFences(result.result?.results ?? "[]");
    let stocks: unknown[] = [];
    try {
      const parsed = JSON.parse(raw);
      stocks = Array.isArray(parsed) ? parsed : [];
    } catch (parseErr) {
      console.error("[NaijaStocks] screener JSON parse failed:", parseErr);
      return NextResponse.json(
        { error: "Screening failed: invalid model output" },
        { status: 502 }
      );
    }

    return NextResponse.json({ stocks, query });
  } catch (err) {
    console.error("[NaijaStocks] screen route error:", err);
    return NextResponse.json(
      { error: "Screening failed" },
      { status: 500 }
    );
  }
}
