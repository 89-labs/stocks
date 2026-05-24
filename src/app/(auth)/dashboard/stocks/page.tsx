import { getNgxPulseCacheStatus } from "@/lib/data/ngx-pulse-cache";
import { LISTINGS_PAGE_SIZE, NGX_LISTINGS_LIMIT } from "@/lib/data/ngx-universe";
import { RefreshMarketData } from "@/components/stocks/refresh-market-data";
import { DashboardStockListings } from "@/components/dashboard/dashboard-stock-listings";
import { DashboardStocksNav } from "@/components/dashboard/dashboard-stocks-nav";
import { DashboardHeader, DashboardPageShell } from "@/components/dashboard/dashboard-ui";

export const dynamic = "force-dynamic";

function formatPulseTime(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-NG", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export default async function DashboardStocksMarketPage() {
  const pulse = await getNgxPulseCacheStatus();

  return (
    <DashboardPageShell>
      <DashboardHeader
        eyebrow="Market"
        title="NGX stock listings"
        description={`Browse all ${NGX_LISTINGS_LIMIT} Nigerian Exchange equities, filter by sector, and open any ticker in your research workspace.`}
        actions={<RefreshMarketData listings />}
        meta={
          <p className="text-xs text-slate-500 dark:text-slate-400">
            NGX Pulse last updated {formatPulseTime(pulse.lastRefreshedAt)}
            {pulse.nextRefreshAt && !pulse.canRefreshNow
              ? ` · next refresh ${formatPulseTime(pulse.nextRefreshAt)}`
              : ""}
            {pulse.dailyLimitReached ? " · daily API limit reached" : ""}
            {" · "}
            {LISTINGS_PAGE_SIZE} per page
          </p>
        }
      />

      <DashboardStocksNav />
      <DashboardStockListings />
    </DashboardPageShell>
  );
}
