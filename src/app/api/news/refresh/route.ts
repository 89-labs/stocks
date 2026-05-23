import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { NewsService } from "@/lib/data/news-service";

function isAuthorizedCron(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const auth = request.headers.get("authorization");
  return auth === `Bearer ${secret}`;
}

/** Re-ingest RSS feeds and warm the 3-hour news cache */
export async function GET(request: Request) {
  if (!isAuthorizedCron(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const bundle = await NewsService.refreshNews();
  revalidatePath("/news");
  revalidatePath("/");

  return NextResponse.json({
    ok: true,
    count: bundle.articles.length,
    refreshedAt: bundle.refreshedAt,
  });
}

export async function POST() {
  const bundle = await NewsService.refreshNews();
  revalidatePath("/news");
  revalidatePath("/");

  return NextResponse.json({
    ok: true,
    count: bundle.articles.length,
    refreshedAt: bundle.refreshedAt,
  });
}
