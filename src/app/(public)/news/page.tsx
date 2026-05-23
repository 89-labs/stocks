import { Suspense } from "react";
import { NewsListings } from "@/components/news/news-listings";
import { NewsTableSkeleton } from "@/components/ui/skeleton";
import { NEWS_TARGET_COUNT } from "@/lib/data/news/constants";

/** ISR aligned with 3-hour news cache */
export const revalidate = 10_800;

export default function NewsPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-neutral-heading">Market News</h1>
        <p className="mt-1 text-neutral-secondary">
          Up to {NEWS_TARGET_COUNT} headlines from Nigerian business sources · refreshed every 3
          hours
        </p>
      </div>

      <Suspense fallback={<NewsTableSkeleton />}>
        <NewsListings />
      </Suspense>
    </div>
  );
}
