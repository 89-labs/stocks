import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { StockDataService } from "@/lib/data/stock-data-service";
import { TopMoversList } from "@/components/stocks/top-movers-list";
import { MOVER_PAGE_META, TOP_MOVERS_FULL } from "@/lib/data/movers";

import { NGX_PULSE_PAGE_REVALIDATE } from "@/lib/data/ngx-pulse-cache";

export const revalidate = NGX_PULSE_PAGE_REVALIDATE;

export const metadata = {
  title: "Top Losers — NGX",
  description: MOVER_PAGE_META.losers.description,
};

export default async function TopLosersPage() {
  const stocks = await StockDataService.getTopMovers("losers", TOP_MOVERS_FULL);

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
      <Link
        href="/"
        className="mb-6 inline-flex items-center gap-2 text-sm text-primary hover:underline"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to market overview
      </Link>

      <div className="mb-8">
        <h1 className={`text-3xl font-bold ${MOVER_PAGE_META.losers.titleClass}`}>
          Top Losers
        </h1>
        <p className="mt-1 text-neutral-secondary">
          {MOVER_PAGE_META.losers.description} Showing up to {TOP_MOVERS_FULL} stocks.
        </p>
        <p className="mt-2 text-sm text-neutral-secondary">
          {stocks.length} {stocks.length === 1 ? "stock" : "stocks"} ranked by change %
        </p>
      </div>

      <TopMoversList stocks={stocks} />
    </div>
  );
}
