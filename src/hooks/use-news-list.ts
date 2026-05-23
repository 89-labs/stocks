"use client";

import useSWR from "swr";
import { useSearchParams } from "next/navigation";
import {
  buildNewsListUrl,
  fetchNewsList,
  type NewsListParams,
} from "@/lib/api/news-list";
import { NEWS_PAGE_SIZE, NEWS_REFRESH_INTERVAL_MS } from "@/lib/data/news/constants";
import type { NewsListResult } from "@/lib/data/news-service";

export function useNewsListFromSearchParams(searchParams: URLSearchParams) {
  const params: NewsListParams = {
    segment: searchParams.get("segment") || undefined,
    page: Math.max(1, parseInt(searchParams.get("page") || "1", 10)),
    pageSize: NEWS_PAGE_SIZE,
  };

  const key = buildNewsListUrl(params);

  return useSWR<NewsListResult>(key, fetchNewsList, {
    keepPreviousData: true,
    revalidateOnFocus: false,
    refreshInterval: NEWS_REFRESH_INTERVAL_MS,
  });
}
