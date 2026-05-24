"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Search, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChangeIndicator } from "@/components/ui/change-indicator";
import { formatNGN, formatCompactNGN, formatVolume, cn } from "@/lib/utils";
import { SECTORS } from "@/lib/data/ngx-universe";
import type { Stock } from "@/types";
import type { StocksListResponse } from "@/lib/api/stocks-list";

function StockTableRow({
  stock,
  striped,
  detailPath = "/stocks",
}: {
  stock: Stock;
  striped: boolean;
  detailPath?: string;
}) {
  const router = useRouter();

  const goToStock = () => router.push(`${detailPath}/${stock.ticker}`);

  const onKeyDown = (e: React.KeyboardEvent<HTMLTableRowElement>) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      goToStock();
    }
  };

  return (
    <tr
      role="link"
      tabIndex={0}
      onClick={goToStock}
      onKeyDown={onKeyDown}
      aria-label={`View ${stock.ticker} — ${stock.name}`}
      className={cn(
        "cursor-pointer border-b border-border transition-colors hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary",
        striped ? "bg-muted/50" : "bg-card-bg"
      )}
    >
      <td className="px-4 py-3 font-semibold text-primary">{stock.ticker}</td>
      <td className="px-4 py-3 text-neutral-secondary">{stock.name}</td>
      <td className="px-4 py-3">
        <span className="rounded-full bg-muted px-2 py-0.5 text-xs">{stock.sector}</span>
      </td>
      <td className="px-4 py-3 text-right font-medium text-neutral-heading">
        {formatNGN(stock.price)}
      </td>
      <td className="px-4 py-3 text-right">
        <ChangeIndicator value={stock.changePercent} />
      </td>
      <td className="px-4 py-3 text-right text-neutral-secondary">
        {formatVolume(stock.volume)}
      </td>
      <td className="px-4 py-3 text-right text-neutral-secondary">
        {formatCompactNGN(stock.marketCap)}
      </td>
    </tr>
  );
}

const SEARCH_DEBOUNCE_MS = 350;

interface StockTableProps {
  data: StocksListResponse;
  isValidating?: boolean;
  /** Base URL for listing pagination/search (no query string). */
  basePath?: string;
  /** Base path for stock detail pages (ticker appended). */
  detailPath?: string;
}

export function StockTable({
  data,
  isValidating,
  basePath = "/stocks",
  detailPath = "/stocks",
}: StockTableProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { items: stocks, total, page, pageSize, totalPages } = data;

  const urlQuery = searchParams.get("q") || "";
  const urlSector = searchParams.get("sector") || "";
  const urlSort = searchParams.get("sort") || "ticker";

  const [query, setQuery] = useState(urlQuery);
  const debouncedQuery = useDebouncedValue(query.trim(), SEARCH_DEBOUNCE_MS);
  const [sector, setSector] = useState(urlSector);
  const [sortBy, setSortBy] = useState(urlSort);

  useEffect(() => {
    setQuery(urlQuery);
  }, [urlQuery]);

  useEffect(() => {
    setSector(urlSector);
    setSortBy(urlSort);
  }, [urlSector, urlSort]);

  const replaceParams = useCallback(
    (updates: Record<string, string>) => {
      const params = new URLSearchParams(searchParams.toString());
      Object.entries(updates).forEach(([k, v]) => {
        if (v) params.set(k, v);
        else params.delete(k);
      });
      router.replace(`${basePath}?${params.toString()}`, { scroll: false });
    },
    [router, searchParams, basePath]
  );

  const updateParams = useCallback(
    (updates: Record<string, string>) => {
      replaceParams(updates);
    },
    [replaceParams]
  );

  useEffect(() => {
    if (debouncedQuery === urlQuery) return;
    replaceParams({ q: debouncedQuery, page: "1" });
  }, [debouncedQuery, urlQuery, replaceParams]);

  const isDebouncing = query.trim() !== debouncedQuery;
  const isSearching = isDebouncing || (isValidating && debouncedQuery.length > 0);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-md flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-secondary" />
          <input
            type="search"
            placeholder="Search by ticker or company name..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Search stocks"
            autoComplete="off"
            className="w-full rounded-lg border border-border bg-input-bg py-2.5 pl-10 pr-24 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
          {isSearching && (
            <span className="pointer-events-none absolute right-3 top-1/2 flex -translate-y-1/2 items-center gap-1 text-xs text-neutral-secondary">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Searching
            </span>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <select
            value={sector}
            onChange={(e) => updateParams({ sector: e.target.value, page: "1" })}
            className="rounded-lg border border-border bg-input-bg px-3 py-2 text-sm text-foreground"
          >
            <option value="">All Sectors</option>
            {SECTORS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <select
            value={sortBy}
            onChange={(e) => updateParams({ sort: e.target.value, page: "1" })}
            className="rounded-lg border border-border bg-input-bg px-3 py-2 text-sm text-foreground"
          >
            <option value="ticker">Ticker</option>
            <option value="price">Price</option>
            <option value="change">Change %</option>
            <option value="volume">Volume</option>
            <option value="marketCap">Market Cap</option>
          </select>
        </div>
      </div>

      <Card
        className={cn(
          "overflow-hidden transition-opacity",
          (isValidating || isDebouncing) && "opacity-70"
        )}
      >
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-muted">
              <tr className="border-b border-border">
                <th className="px-4 py-3 text-left font-semibold text-neutral-heading">Ticker</th>
                <th className="px-4 py-3 text-left font-semibold text-neutral-heading">Company</th>
                <th className="px-4 py-3 text-left font-semibold text-neutral-heading">Sector</th>
                <th className="px-4 py-3 text-right font-semibold text-neutral-heading">Price</th>
                <th className="px-4 py-3 text-right font-semibold text-neutral-heading">Change</th>
                <th className="px-4 py-3 text-right font-semibold text-neutral-heading">Volume</th>
                <th className="px-4 py-3 text-right font-semibold text-neutral-heading">Market Cap</th>
              </tr>
            </thead>
            <tbody>
              {stocks.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-neutral-secondary">
                    No stocks match your filters.
                  </td>
                </tr>
              ) : (
                stocks.map((stock, i) => (
                  <StockTableRow
                    key={stock.ticker}
                    stock={stock}
                    striped={i % 2 !== 0}
                    detailPath={detailPath}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="flex flex-wrap items-center justify-between gap-4">
        <p className="text-sm text-neutral-secondary">
          {total === 0
            ? "No results"
            : `Showing ${(page - 1) * pageSize + 1}–${Math.min(page * pageSize, total)} of ${total} stocks`}
        </p>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1 || isValidating}
            onClick={() => updateParams({ page: String(page - 1) })}
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </Button>
          <span className="flex items-center px-3 text-sm text-neutral-secondary">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages || isValidating}
            onClick={() => updateParams({ page: String(page + 1) })}
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
