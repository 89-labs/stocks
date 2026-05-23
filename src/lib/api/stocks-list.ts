import type { Sector, Stock } from "@/types";
import { LISTINGS_PAGE_SIZE } from "@/lib/data/ngx-universe";

export type StockSortField = "ticker" | "price" | "change" | "volume" | "marketCap";

export interface StocksListParams {
  q?: string;
  sector?: Sector | "";
  sort?: StockSortField;
  dir?: "asc" | "desc";
  page?: number;
  pageSize?: number;
}

export interface StocksListResponse {
  items: Stock[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export function buildStocksListUrl(params: StocksListParams = {}): string {
  const sp = new URLSearchParams();
  const page = params.page ?? 1;
  const pageSize = params.pageSize ?? LISTINGS_PAGE_SIZE;

  sp.set("page", String(page));
  sp.set("pageSize", String(pageSize));
  if (params.q?.trim()) sp.set("q", params.q.trim());
  if (params.sector) sp.set("sector", params.sector);
  if (params.sort) sp.set("sort", params.sort);
  if (params.dir) sp.set("dir", params.dir);

  return `/api/stocks?${sp.toString()}`;
}

export async function fetchStocksList(url: string): Promise<StocksListResponse> {
  const res = await fetch(url);
  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(err.error ?? "Failed to load stocks");
  }
  return res.json() as Promise<StocksListResponse>;
}
