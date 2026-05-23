import { NextResponse } from "next/server";
import { NewsService } from "@/lib/data/news-service";
import { NEWS_PAGE_SIZE } from "@/lib/data/news/constants";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const ticker = searchParams.get("ticker");

  if (ticker) {
    const articles = await NewsService.getNewsForTicker(ticker);
    return NextResponse.json(articles);
  }

  const segment = searchParams.get("segment") || undefined;
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
  const pageSize = Math.min(
    50,
    Math.max(1, parseInt(searchParams.get("pageSize") || String(NEWS_PAGE_SIZE), 10))
  );

  const result = await NewsService.listNews({ segment, page, pageSize });
  return NextResponse.json(result);
}
