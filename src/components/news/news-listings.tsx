"use client";

import { useSearchParams } from "next/navigation";
import { useNewsListFromSearchParams } from "@/hooks/use-news-list";
import { NewsList } from "@/components/news/news-card";
import { NewsFilter } from "@/components/news/news-filter";
import { NewsPagination } from "@/components/news/news-pagination";
import { NewsMetaBar } from "@/components/news/news-meta-bar";
import { NewsTableSkeleton } from "@/components/ui/skeleton";
import { NEWS_SEGMENTS } from "@/lib/data/news/constants";

export function NewsListings() {
  const searchParams = useSearchParams();
  const { data, error, isLoading, isValidating, mutate } =
    useNewsListFromSearchParams(searchParams);

  if (isLoading && !data) {
    return <NewsTableSkeleton />;
  }

  if (error) {
    return (
      <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
        {error.message}
      </p>
    );
  }

  if (!data) {
    return <NewsTableSkeleton />;
  }

  return (
    <>
      <NewsMetaBar
        refreshedAt={data.refreshedAt}
        total={data.total}
        targetCount={data.targetCount}
        stale={data.stale}
        isValidating={isValidating}
        onRefresh={() => mutate()}
      />
      <div className="mt-4">
        <NewsFilter
          segments={[...NEWS_SEGMENTS]}
          activeSegment={searchParams.get("segment") || undefined}
        />
      </div>
      <div className="mt-6">
        <NewsList articles={data.items} isValidating={isValidating} />
      </div>
      <NewsPagination data={data} />
    </>
  );
}
