"use client";

import useSWR from "swr";
import {
  buildStocksListUrl,
  fetchStocksList,
  type StocksListParams,
  type StocksListResponse,
} from "@/lib/api/stocks-list";
import { LISTINGS_PAGE_SIZE } from "@/lib/data/ngx-universe";
import type { Sector } from "@/types";
import type { StockSortField } from "@/lib/api/stocks-list";

export function useStocksListFromSearchParams(searchParams: URLSearchParams) {
  const params: StocksListParams = {
    q: searchParams.get("q") || undefined,
    sector: (searchParams.get("sector") as Sector) || undefined,
    sort: (searchParams.get("sort") as StockSortField) || "ticker",
    dir: searchParams.get("dir") === "desc" ? "desc" : "asc",
    page: Math.max(1, parseInt(searchParams.get("page") || "1", 10)),
    pageSize: LISTINGS_PAGE_SIZE,
  };

  const key = buildStocksListUrl(params);

  return useSWR<StocksListResponse>(key, fetchStocksList, {
    keepPreviousData: true,
    revalidateOnFocus: true,
  });
}
