import type { NewsListResult } from "@/lib/data/news-service";
import { NEWS_PAGE_SIZE } from "@/lib/data/news/constants";

export interface NewsListParams {
  segment?: string;
  page?: number;
  pageSize?: number;
}

export function buildNewsListUrl(params: NewsListParams = {}): string {
  const sp = new URLSearchParams();
  sp.set("page", String(params.page ?? 1));
  sp.set("pageSize", String(params.pageSize ?? NEWS_PAGE_SIZE));
  if (params.segment?.trim()) sp.set("segment", params.segment.trim());
  return `/api/news?${sp.toString()}`;
}

export async function fetchNewsList(url: string): Promise<NewsListResult> {
  const res = await fetch(url);
  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(err.error ?? "Failed to load news");
  }
  return res.json() as Promise<NewsListResult>;
}
