import { NextResponse } from "next/server";
import { StockDataService } from "@/lib/data/stock-data-service";
import { LISTINGS_PAGE_SIZE } from "@/lib/data/ngx-universe";
import type { Sector } from "@/types";
import type { StockSortField } from "@/lib/api/stocks-list";

const SORT_FIELDS: StockSortField[] = ["ticker", "price", "change", "volume", "marketCap"];
const SECTORS: Sector[] = [
  "Banking",
  "Oil & Gas",
  "Consumer Goods",
  "Industrial",
  "Telecoms",
  "Agriculture",
  "Insurance",
  "Healthcare",
];

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const q = searchParams.get("q") || "";
  const sectorParam = searchParams.get("sector") || "";
  const sortParam = searchParams.get("sort") || "ticker";
  const dirParam = searchParams.get("dir") === "desc" ? "desc" : "asc";
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
  const pageSize = Math.min(
    50,
    Math.max(1, parseInt(searchParams.get("pageSize") || String(LISTINGS_PAGE_SIZE), 10))
  );

  const sortBy = SORT_FIELDS.includes(sortParam as StockSortField)
    ? (sortParam as StockSortField)
    : "ticker";
  const sector = SECTORS.includes(sectorParam as Sector) ? (sectorParam as Sector) : undefined;

  const result = await StockDataService.searchStocks(
    q,
    sector,
    sortBy,
    dirParam,
    page,
    pageSize
  );

  return NextResponse.json(result);
}
