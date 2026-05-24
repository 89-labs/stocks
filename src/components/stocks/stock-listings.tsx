"use client";

import { useSearchParams } from "next/navigation";
import { useStocksListFromSearchParams } from "@/hooks/use-stocks-list";
import { StockTable } from "@/components/stocks/stock-table";
import { StockTableSkeleton } from "@/components/ui/skeleton";

interface StockListingsProps {
  basePath?: string;
  detailPath?: string;
}

export function StockListings({
  basePath = "/stocks",
  detailPath = "/stocks",
}: StockListingsProps) {
  const searchParams = useSearchParams();
  const { data, error, isLoading, isValidating } = useStocksListFromSearchParams(searchParams);

  if (isLoading && !data) {
    return <StockTableSkeleton />;
  }

  if (error) {
    return (
      <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
        {error.message}
      </p>
    );
  }

  if (!data) {
    return <StockTableSkeleton />;
  }

  return (
    <StockTable
      data={data}
      isValidating={isValidating}
      basePath={basePath}
      detailPath={detailPath}
    />
  );
}
