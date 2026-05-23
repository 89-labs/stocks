import { NextResponse } from "next/server";
import { AIService } from "@/lib/data/ai-service";

export async function POST(request: Request) {
  const body = await request.json();
  const { title, content } = body;

  if (!title) {
    return NextResponse.json({ error: "Title required" }, { status: 400 });
  }

  const summary = await AIService.summariseArticle(title, content || "");
  return NextResponse.json({ summary });
}
