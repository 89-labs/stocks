import { redirect } from "next/navigation";
import { Suspense } from "react";
import { StockListings } from "@/components/stocks/stock-listings";
import { RefreshMarketData } from "@/components/stocks/refresh-market-data";
import { StockTableSkeleton } from "@/components/ui/skeleton";
import { LISTINGS_PAGE_SIZE, NGX_LISTINGS_LIMIT } from "@/lib/data/ngx-universe";
import { getNgxPulseCacheStatus } from "@/lib/data/ngx-pulse-cache";
import { getCurrentUser } from "@/lib/auth/session";
import { stocksListQueryString } from "@/lib/dashboard/stocks-list-query";

function formatPulseTime(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-NG", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export default async function StocksPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await getCurrentUser();
  const sp = await searchParams;
  if (user) {
    redirect(`/dashboard/stocks${stocksListQueryString(sp)}`);
  }

  const pulse = await getNgxPulseCacheStatus();

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-neutral-heading">NGX Stock Listings</h1>
          <p className="mt-1 text-neutral-secondary">
            {NGX_LISTINGS_LIMIT} Nigerian Exchange equities · {LISTINGS_PAGE_SIZE} per page
          </p>
          <p className="mt-1 text-xs text-neutral-secondary">
            NGX Pulse last updated {formatPulseTime(pulse.lastRefreshedAt)}
            {pulse.nextRefreshAt && !pulse.canRefreshNow
              ? ` · next refresh ${formatPulseTime(pulse.nextRefreshAt)}`
              : ""}
            {pulse.dailyLimitReached ? " · daily API limit reached" : ""}
          </p>
        </div>
        <RefreshMarketData listings />
      </div>
      <Suspense fallback={<StockTableSkeleton />}>
        <StockListings />
      </Suspense>
    </div>
  );
}
