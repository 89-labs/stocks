import type { Quote, Sector, Stock } from "@/types";
import type { StockQuote } from "@/types/stock";
import type { NGXEntry } from "./ngx-universe";
import { getBaseline } from "./ngx-universe";

const NGX_PULSE_BASE = "https://ngxpulse.ng/api";

const KNOWN_SECTORS: Sector[] = [
  "Banking",
  "Oil & Gas",
  "Consumer Goods",
  "Industrial",
  "Telecoms",
  "Agriculture",
  "Insurance",
  "Healthcare",
];

export interface NgxPulseStock {
  symbol: string;
  name: string;
  current_price: number;
  previous_close?: number;
  change_percent?: number;
  volume?: number;
  market_cap?: number;
  shares_outstanding?: number;
  sector?: string;
  pe_ratio?: number;
}

interface NgxPulseStocksResponse {
  stocks?: NgxPulseStock[];
  total?: number;
}

export function getNgxPulseApiKey(): string | undefined {
  const key = process.env.NGX_PULSE_API_KEY?.trim();
  return key || undefined;
}

export function normalizePulseSector(sector: string | undefined, fallback: Sector): Sector {
  if (!sector) return fallback;
  const match = KNOWN_SECTORS.find((s) => s.toLowerCase() === sector.toLowerCase());
  return match ?? fallback;
}

export async function fetchNgxPulseStocks(): Promise<NgxPulseStock[] | null> {
  const apiKey = getNgxPulseApiKey();
  if (!apiKey) return null;

  try {
    const res = await fetch(`${NGX_PULSE_BASE}/ngxdata/stocks`, {
      headers: {
        "X-API-Key": apiKey,
        Accept: "application/json",
      },
      cache: "no-store",
    });

    if (!res.ok) {
      console.warn(`[NaijaStocks] NGX Pulse stocks HTTP ${res.status}`);
      return null;
    }

    const data = (await res.json()) as NgxPulseStock[] | NgxPulseStocksResponse;
    if (Array.isArray(data)) return data;
    if (data.stocks?.length) return data.stocks;
    return null;
  } catch (err) {
    console.warn("[NaijaStocks] NGX Pulse fetch failed:", err);
    return null;
  }
}

export function ngxPulseToQuote(row: NgxPulseStock): Quote {
  const price = row.current_price;
  const prev = row.previous_close ?? price / (1 + (row.change_percent ?? 0) / 100);
  const change = price - prev;
  return {
    ticker: row.symbol.toUpperCase(),
    price,
    change,
    changePercent: row.change_percent ?? (prev ? (change / prev) * 100 : 0),
    volume: row.volume ?? 0,
    high: price,
    low: price,
    open: prev,
    previousClose: prev,
    timestamp: new Date().toISOString(),
    stale: false,
  };
}

export function ngxPulseToStockQuote(row: NgxPulseStock): StockQuote {
  const quote = ngxPulseToQuote(row);
  return {
    symbol: quote.ticker,
    latestPrice: quote.price,
    open: quote.open,
    previousClose: quote.previousClose,
    high: quote.high,
    low: quote.low,
    volume: quote.volume,
    turnover: 0,
    change: quote.change,
    changePercent: quote.changePercent,
    timestamp: Date.now(),
    tradingStatus: 0,
    stale: false,
  };
}

export function mergeNgxPulseIntoStock(entry: NGXEntry, row: NgxPulseStock): Stock {
  const quote = ngxPulseToQuote(row);
  const sector = normalizePulseSector(row.sector, entry.sector);
  const marketCap =
    row.market_cap ??
    (row.shares_outstanding
      ? row.shares_outstanding * quote.price
      : entry.sharesOutstanding
        ? entry.sharesOutstanding * quote.price
        : 0);

  const baseline = getBaseline(entry.ticker);

  return {
    ticker: entry.ticker,
    name: row.name || entry.name,
    sector,
    price: quote.price,
    change: quote.change,
    changePercent: quote.changePercent,
    volume: quote.volume,
    marketCap,
    high52w: baseline?.high52w ?? quote.high,
    low52w: baseline?.low52w ?? quote.low,
    peRatio: row.pe_ratio ?? baseline?.peRatio,
    eps: baseline?.eps,
    dividendYield: baseline?.dividendYield,
    stale: false,
  };
}

export async function getNgxPulseQuote(ticker: string): Promise<Quote | null> {
  const { getCachedNgxPulseStocks: getPulse } = await import("./ngx-pulse-cache");
  const code = ticker.toUpperCase();
  const rows = await getPulse();
  const row = rows.find((r) => r.symbol.toUpperCase() === code);
  if (!row || row.current_price <= 0) return null;
  return ngxPulseToQuote(row);
}
