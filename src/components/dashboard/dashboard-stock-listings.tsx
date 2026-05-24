"use client";

import { Suspense } from "react";
import { StockListings } from "@/components/stocks/stock-listings";
import { StockTableSkeleton } from "@/components/ui/skeleton";

const DASHBOARD_STOCKS_BASE = "/dashboard/stocks";

export function DashboardStockListings() {
  return (
    <Suspense fallback={<StockTableSkeleton />}>
      <StockListings basePath={DASHBOARD_STOCKS_BASE} detailPath={DASHBOARD_STOCKS_BASE} />
    </Suspense>
  );
}
