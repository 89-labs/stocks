import type {
  EconomicIndicator,
  MarketSummary,
  OHLCV,
  Quote,
  Sector,
  Stock,
  Timeframe,
} from "@/types";
import type {
  KlineBar,
  MarketHoliday,
  StockInfo,
  StockListItem,
  StockQuote,
} from "@/types/stock";
import { ITickError } from "@/types/stock";
import { getITickApiKey, getITickBaseUrl, iTickGet } from "@/lib/data/ITickClient";
import {
  isIntradayKType,
  klineCacheTtlSeconds,
  TIMEFRAME_KLINE,
  timeframeFromDays,
} from "@/lib/data/itick-timeframe";
import { NGX_UNIVERSE, lookupTicker, getBaseline, type NGXEntry } from "./ngx-universe";
import { getCachedNgxPulseStocks, getNgxPulseRefreshSeconds } from "./ngx-pulse-cache";
import {
  mergeNgxPulseIntoStock,
  normalizePulseSector,
  ngxPulseToStockQuote,
  type NgxPulseStock,
} from "./ngx-pulse-service";
import { memClear, memGetOrSet } from "@/lib/cache/memory";
import { cacheDelete, cacheGet, cacheGetOrSet, CACHE_TTL } from "@/lib/cache/redis";

const REGION = "NG" as const;
const EXCHANGE = "NGX";
/** Free tier rate-limits large batch quote requests */
const QUOTES_BATCH_SIZE = Math.min(
  20,
  Math.max(1, parseInt(process.env.ITICK_QUOTES_BATCH_SIZE || "5", 10))
);
const QUOTES_BATCH_DELAY_MS = Math.max(
  100,
  parseInt(process.env.ITICK_QUOTES_BATCH_DELAY_MS || "600", 10)
);
/** Delay between sequential /stock/kline calls (free tier: "your request is too much") */
const KLINE_REQUEST_DELAY_MS = Math.max(
  200,
  parseInt(process.env.ITICK_KLINE_DELAY_MS || "550", 10)
);
/** Max tickers to refresh via batch API on listings load (free tier) */
const LIVE_QUOTES_LIMIT = Math.min(
  NGX_UNIVERSE.length,
  Math.max(5, parseInt(process.env.ITICK_LIVE_QUOTES_LIMIT || "30", 10))
);

let itickRateLimitedUntil = 0;
let itickRateLimitWarned = false;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isValidITickQuoteRow(row: ITickQuoteRow | null | undefined): row is ITickQuoteRow {
  return Boolean(row?.s) && typeof row?.ld === "number" && Number.isFinite(row.ld);
}

function isValidITickInfoRow(row: ITickInfoRow | null | undefined): row is ITickInfoRow {
  return Boolean(row?.c);
}

function parseBatchQuoteData(
  data: Record<string, ITickQuoteRow | null> | ITickQuoteRow[] | null | undefined
): Map<string, ITickQuoteRow> {
  const byCode = new Map<string, ITickQuoteRow>();
  if (!data) return byCode;
  const rows = Array.isArray(data) ? data : Object.values(data);
  for (const row of rows) {
    if (isValidITickQuoteRow(row)) {
      byCode.set(row.s.toUpperCase(), row);
    }
  }
  return byCode;
}

async function pulseStockQuote(code: string): Promise<StockQuote | null> {
  const rows = await getCachedNgxPulseStocks();
  const row = rows.find((r) => r.symbol.toUpperCase() === code);
  if (!row || row.current_price <= 0) return null;
  return ngxPulseToStockQuote(row);
}

/** Listings + market overview follow NGX Pulse refresh window (default 20 min) */
const PULSE_LIST_TTL = getNgxPulseRefreshSeconds();

const HOT_TTL = {
  QUOTE: 60,
  OHLCV: 600,
  MARKET: PULSE_LIST_TTL,
  ECONOMIC: 3600,
  LISTING: 86_400,
  INFO: 86_400,
  HOLIDAYS: 86_400,
  PULSE_LIST: PULSE_LIST_TTL,
} as const;

interface ITickQuoteRow {
  s: string;
  ld: number;
  o: number;
  p: number;
  h: number;
  l: number;
  v: number;
  tu: number;
  ch: number;
  chp: number;
  t: number;
  ts: 0 | 1 | 2 | 3;
}

interface ITickKlineRow {
  t: number;
  o: number;
  h: number;
  l: number;
  c: number;
  v: number;
  tu: number;
}

interface ITickSymbolRow {
  c: string;
  n: string;
  e: string;
}

interface ITickInfoRow {
  c: string;
  n: string;
  e?: string;
  i?: string;
  s?: string;
}

interface ITickHolidayMarket {
  c: string;
  r?: string;
  v?: string;
}

let itickAuthWarned = false;

function isITickRateLimitError(err: unknown): boolean {
  if (!(err instanceof ITickError)) return false;
  if (err.code === 429) return true;
  if (err.code === 1) return true;
  const msg = err.msg.toLowerCase();
  return msg.includes("too much") || msg.includes("rate") || msg.includes("limit");
}

function isITickRateLimited(): boolean {
  return Date.now() < itickRateLimitedUntil;
}

function markITickRateLimited(cooldownMs = 90_000): void {
  itickRateLimitedUntil = Date.now() + cooldownMs;
}

function isITickMissingDataError(err: unknown): boolean {
  return err instanceof ITickError && (err.code === 404 || /no (quote|data)/i.test(err.msg));
}

function logITickFailure(context: string, err: unknown): void {
  if (isITickMissingDataError(err)) return;
  if (err instanceof ITickError) {
    if (isITickRateLimitError(err)) {
      markITickRateLimited();
      if (!itickRateLimitWarned) {
        itickRateLimitWarned = true;
        console.warn(
          "[NaijaStocks] iTick rate limit reached — pausing live quote fetches ~90s. " +
            "Using cached/baseline prices. Lower ITICK_LIVE_QUOTES_LIMIT or upgrade your plan."
        );
      }
      return;
    }
    if (err.code === 401 && !itickAuthWarned) {
      itickAuthWarned = true;
      console.warn(
        `[NaijaStocks] iTick 401 at ${getITickBaseUrl()}. ` +
          "Check ITICK_API_KEY; free keys need ITICK_BASE_URL=https://api-free.itick.org — https://itick.org/dashboard"
      );
      return;
    }
    if (err.code === -1 && err.msg.includes("not configured") && !itickAuthWarned) {
      itickAuthWarned = true;
      console.warn("[NaijaStocks] ITICK_API_KEY is not set — using reference prices");
      return;
    }
  }
  console.error(`[NaijaStocks] iTick ${context} failed:`, err);
}

function getPriorityQuoteCodes(): string[] {
  return NGX_UNIVERSE.slice(0, LIVE_QUOTES_LIMIT).map((e) => e.ticker);
}

async function withStaleFallback<T>(
  cacheKey: string,
  ttlSeconds: number,
  fetcher: () => Promise<T>,
  fallback?: T
): Promise<T> {
  try {
    const { data, stale } = await cacheGetOrSet(cacheKey, ttlSeconds, fetcher);
    if (!stale) return data;
    if (Array.isArray(data)) return data;
    if (data && typeof data === "object") {
      return { ...(data as Record<string, unknown>), stale: true } as T;
    }
    return data;
  } catch (err) {
    logITickFailure(cacheKey, err);
    const cached = await cacheGet<{ data: T; cachedAt: number }>(cacheKey);
    if (cached?.data !== undefined) {
      if (Array.isArray(cached.data)) return cached.data;
      if (cached.data && typeof cached.data === "object") {
        return { ...(cached.data as Record<string, unknown>), stale: true } as T;
      }
      return cached.data;
    }
    if (fallback !== undefined) return fallback;
    throw err;
  }
}

function mapQuoteRow(row: ITickQuoteRow, stale = false): StockQuote {
  if (!isValidITickQuoteRow(row)) {
    throw new ITickError(404, "Invalid or empty iTick quote row");
  }
  return {
    symbol: row.s,
    latestPrice: row.ld,
    open: row.o,
    previousClose: row.p,
    high: row.h,
    low: row.l,
    volume: row.v,
    turnover: row.tu,
    change: row.ch,
    changePercent: row.chp,
    timestamp: row.t,
    tradingStatus: row.ts,
    stale,
  };
}

function mapKlineRow(row: ITickKlineRow): KlineBar {
  return {
    timestamp: row.t,
    open: row.o,
    high: row.h,
    low: row.l,
    close: row.c,
    volume: row.v,
    turnover: row.tu,
  };
}

export async function getStockListing(): Promise<StockListItem[]> {
  if (!getITickApiKey()) return [];

  return withStaleFallback(
    "itick:listing:NG",
    HOT_TTL.LISTING,
    async () => {
    const rows = await iTickGet<ITickSymbolRow[]>("/symbol/list", {
      type: "stock",
      region: REGION,
      exchange: EXCHANGE,
    });
    return rows
      .filter((row): row is ITickSymbolRow => Boolean(row?.c))
      .map((row) => ({
        code: row.c,
        name: row.n,
        exchange: row.e || EXCHANGE,
        region: REGION,
      }));
    },
    []
  );
}

function baselineStockQuote(code: string): StockQuote | undefined {
  const normalized = code.toUpperCase();
  const entry = lookupTicker(normalized);
  const baseline = entry ? getBaseline(entry.ticker) : getBaseline(normalized);
  if (!baseline) return undefined;
  return {
    symbol: normalized,
    latestPrice: baseline.price,
    open: baseline.price - baseline.change,
    previousClose: baseline.price - baseline.change,
    high: baseline.high52w,
    low: baseline.low52w,
    volume: baseline.volume,
    turnover: 0,
    change: baseline.change,
    changePercent: baseline.changePercent,
    timestamp: Date.now(),
    tradingStatus: 0,
    stale: true,
  };
}

/** Live quote via iTick (detail pages, charts companion) — not used for the stock list */
export async function getStockQuote(code: string): Promise<StockQuote> {
  const normalized = code.toUpperCase();
  const cacheKey = `itick:quote:${normalized}`;
  const fallback = baselineStockQuote(normalized);

  if (isITickRateLimited()) {
    const cached = await cacheGet<{ data: StockQuote; cachedAt: number }>(cacheKey);
    if (cached?.data) {
      return { ...cached.data, stale: true };
    }
    if (fallback) return fallback;
    throw new ITickError(429, "Rate limited");
  }

  return withStaleFallback(
    cacheKey,
    CACHE_TTL.QUOTE,
    async () => {
      const row = await iTickGet<ITickQuoteRow | null>("/stock/quote", {
        region: REGION,
        code: normalized,
      });
      if (isValidITickQuoteRow(row)) {
        return mapQuoteRow(row);
      }

      const fromPulse = await pulseStockQuote(normalized);
      if (fromPulse) return fromPulse;

      if (fallback) return fallback;

      throw new ITickError(404, `No quote for ${normalized}`);
    },
    fallback
  );
}

async function fetchQuoteChunk(codes: string[], attempt = 0): Promise<StockQuote[]> {
  if (isITickRateLimited()) return [];

  try {
    const data = await iTickGet<Record<string, ITickQuoteRow | null> | ITickQuoteRow[] | null>(
      "/stock/quotes",
      {
      region: REGION,
      codes: codes.join(","),
    });
    const byCode = parseBatchQuoteData(data);
    return codes
      .map((code) => {
        const row = byCode.get(code);
        return row ? mapQuoteRow(row) : null;
      })
      .filter((q): q is StockQuote => q !== null);
  } catch (err) {
    if (isITickRateLimitError(err) && attempt < 2) {
      const waitMs = (attempt + 1) * 2000;
      markITickRateLimited(waitMs);
      await sleep(waitMs);
      return fetchQuoteChunk(codes, attempt + 1);
    }
    throw err;
  }
}

export async function getBatchStockQuotes(codes: string[]): Promise<StockQuote[]> {
  if (!codes.length || !getITickApiKey()) return [];
  const normalized = [...new Set(codes.map((c) => c.toUpperCase()))].sort();
  const cacheKey = `itick:quotes:v2:${normalized.length}:${normalized[0]}:${normalized[normalized.length - 1]}`;
  if (isITickRateLimited()) {
    const cached = await cacheGet<{ data: StockQuote[]; cachedAt: number }>(cacheKey);
    return cached?.data ?? [];
  }

  return withStaleFallback(
    cacheKey,
    CACHE_TTL.QUOTE,
    async () => {
      const quotes: StockQuote[] = [];

      for (let i = 0; i < normalized.length; i += QUOTES_BATCH_SIZE) {
        if (isITickRateLimited()) break;

        const chunk = normalized.slice(i, i + QUOTES_BATCH_SIZE);
        try {
          quotes.push(...(await fetchQuoteChunk(chunk)));
        } catch (err) {
          logITickFailure(`quotes chunk (${chunk.length})`, err);
          if (isITickRateLimited()) break;
        }

        if (i + QUOTES_BATCH_SIZE < normalized.length) {
          await sleep(QUOTES_BATCH_DELAY_MS);
        }
      }

      return quotes;
    },
    []
  );
}

export async function getStockKline(
  code: string,
  kType: number,
  limit: number,
  et?: number
): Promise<KlineBar[]> {
  if (!getITickApiKey()) return [];

  const normalized = code.toUpperCase();
  const ttl = klineCacheTtlSeconds(kType);
  const now = Date.now();
  const end =
    et ??
    (isIntradayKType(kType)
      ? Math.floor(now / (ttl * 1000)) * ttl * 1000
      : Math.floor(now / 86_400_000) * 86_400_000);
  const cacheKey = `itick:kline:${normalized}:${kType}:${limit}:${end}`;

  if (isITickRateLimited()) {
    const cached = await cacheGet<{ data: KlineBar[]; cachedAt: number }>(cacheKey);
    return cached?.data ?? [];
  }

  return withStaleFallback(
    cacheKey,
    ttl,
    async () => {
    const rows = await iTickGet<ITickKlineRow[] | null>("/stock/kline", {
      region: REGION,
      code: normalized,
      kType,
      limit,
      et: end,
    });
    return (rows ?? []).filter((row) => row?.t != null && row.c != null).map(mapKlineRow);
    },
    []
  );
}

export async function getStockInfo(code: string): Promise<StockInfo> {
  const normalized = code.toUpperCase();
  const cacheKey = `itick:info:${normalized}`;
  const entry = lookupTicker(normalized);
  const fallback: StockInfo = {
    code: normalized,
    name: entry?.name ?? normalized,
    sector: entry?.sector,
    exchange: EXCHANGE,
  };
  if (!getITickApiKey()) return fallback;
  if (isITickRateLimited()) {
    const cached = await cacheGet<{ data: StockInfo; cachedAt: number }>(cacheKey);
    return cached?.data ?? fallback;
  }

  return withStaleFallback<StockInfo>(
    cacheKey,
    HOT_TTL.INFO,
    async () => {
      const row = await iTickGet<ITickInfoRow | null>("/stock/info", {
        type: "stock",
        region: REGION,
        code: normalized,
      });
      if (!isValidITickInfoRow(row)) {
        return fallback;
      }
      return {
        code: row.c,
        name: row.n,
        sector: row.i ?? row.s,
        exchange: row.e ?? EXCHANGE,
      };
    },
    fallback
  );
}

export async function getMarketHolidays(): Promise<MarketHoliday[]> {
  if (!getITickApiKey()) return [];

  return withStaleFallback(
    "itick:holidays:NG",
    HOT_TTL.HOLIDAYS,
    async () => {
    let rows: ITickHolidayMarket[];
    try {
      rows = await iTickGet<ITickHolidayMarket[]>("/symbol/holidays", {
        region: REGION,
      });
    } catch {
      rows = await iTickGet<ITickHolidayMarket[]>("/symbol/v2/holidays", {});
    }

    const ng =
      rows.find((r) => r.c === REGION || r.c === "NGX") ??
      rows.find((r) => r.r?.toLowerCase().includes("nigeria"));

    if (!ng?.v) return [];

    let dates: string[] = [];
    try {
      dates = JSON.parse(ng.v) as string[];
    } catch {
      return [];
    }

    return dates.map((date) => ({
      date,
      name: ng.r ? `${ng.r} market holiday` : "Market closed",
    }));
    },
    []
  );
}

export function stockQuoteToAppQuote(q: StockQuote): Quote {
  return {
    ticker: q.symbol,
    price: q.latestPrice,
    change: q.change,
    changePercent: q.changePercent,
    volume: q.volume,
    high: q.high,
    low: q.low,
    open: q.open,
    previousClose: q.previousClose,
    timestamp: new Date(q.timestamp).toISOString(),
    stale: q.stale,
  };
}

export function klineBarsToOHLCV(bars: KlineBar[], intraday: boolean): OHLCV[] {
  return bars.map((bar) => ({
    date: intraday
      ? new Date(bar.timestamp).toISOString()
      : new Date(bar.timestamp).toISOString().split("T")[0],
    open: bar.open,
    high: bar.high,
    low: bar.low,
    close: bar.close,
    volume: bar.volume,
  }));
}

export async function getStockKlineForTimeframe(
  code: string,
  timeframe: Timeframe,
  et?: number
): Promise<KlineBar[]> {
  const { kType, limit } = TIMEFRAME_KLINE[timeframe];
  return getStockKline(code, kType, limit, et);
}

/**
 * Fetch klines for multiple tickers without bursting iTick (parallel calls trigger "too much").
 */
export async function getBatchStockKlinesForTimeframe(
  codes: string[],
  timeframe: Timeframe
): Promise<Map<string, KlineBar[]>> {
  const result = new Map<string, KlineBar[]>();
  const normalized = [...new Set(codes.map((c) => c.toUpperCase()))].filter(Boolean);
  if (!normalized.length) return result;

  for (let i = 0; i < normalized.length; i++) {
    const code = normalized[i]!;
    const bars = await getStockKlineForTimeframe(code, timeframe);
    result.set(code, bars);

    if (i < normalized.length - 1 && getITickApiKey() && !isITickRateLimited()) {
      await sleep(KLINE_REQUEST_DELAY_MS);
    }
  }

  return result;
}

function buildStockFromBaseline(entry: NGXEntry, stale = true): Stock {
  const b = getBaseline(entry.ticker);
  if (!b) {
    return {
      ticker: entry.ticker,
      name: entry.name,
      sector: entry.sector,
      price: 0,
      change: 0,
      changePercent: 0,
      volume: 0,
      marketCap: 0,
      high52w: 0,
      low52w: 0,
      stale,
    };
  }
  return {
    ticker: entry.ticker,
    name: entry.name,
    sector: entry.sector,
    price: b.price,
    change: b.change,
    changePercent: b.changePercent,
    volume: b.volume,
    marketCap: entry.sharesOutstanding ? entry.sharesOutstanding * b.price : 0,
    high52w: b.high52w,
    low52w: b.low52w,
    peRatio: b.peRatio,
    eps: b.eps,
    dividendYield: b.dividendYield,
    stale,
  };
}

function buildStock(entry: NGXEntry, quote: StockQuote | null): Stock {
  if (!quote || quote.latestPrice <= 0) {
    return buildStockFromBaseline(entry, true);
  }
  const baseline = getBaseline(entry.ticker);
  return {
    ticker: entry.ticker,
    name: entry.name,
    sector: entry.sector,
    price: quote.latestPrice,
    change: quote.change,
    changePercent: quote.changePercent,
    volume: quote.volume,
    marketCap: entry.sharesOutstanding
      ? entry.sharesOutstanding * quote.latestPrice
      : 0,
    high52w: quote.high || baseline?.high52w || quote.latestPrice,
    low52w: quote.low || baseline?.low52w || quote.latestPrice,
    peRatio: baseline?.peRatio,
    eps: baseline?.eps,
    dividendYield: baseline?.dividendYield,
    stale: quote.stale,
  };
}

function fetchStocksFromBaselines(): Stock[] {
  return NGX_UNIVERSE.map((entry) => buildStockFromBaseline(entry, true));
}

/** NGX Pulse only — used for listings, home, movers, search */
function buildStocksFromPulse(pulseRows: NgxPulseStock[]): Stock[] {
  const pulseByTicker = new Map(pulseRows.map((r) => [r.symbol.toUpperCase(), r]));

  return NGX_UNIVERSE.map((entry) => {
    const pulseRow = pulseByTicker.get(entry.ticker);
    if (pulseRow && pulseRow.current_price > 0) {
      return mergeNgxPulseIntoStock(entry, pulseRow);
    }
    return buildStockFromBaseline(entry, true);
  });
}

async function buildStockDetailFromITick(entry: NGXEntry): Promise<Stock> {
  const code = entry.ticker;
  let quote: StockQuote | null = null;

  if (getITickApiKey() && !isITickRateLimited()) {
    try {
      quote = await getStockQuote(code);
    } catch (err) {
      if (!isITickMissingDataError(err)) {
        logITickFailure(`detail quote ${code}`, err);
      }
    }
  }

  if (!quote || quote.latestPrice <= 0) {
    const fromPulse = await pulseStockQuote(code);
    if (fromPulse) quote = fromPulse;
  }

  let info: StockInfo | null = null;
  if (getITickApiKey() && !isITickRateLimited()) {
    try {
      info = await getStockInfo(code);
    } catch {
      /* optional enrichment */
    }
  }

  const name = info?.name?.trim() || entry.name;
  const sector = info?.sector
    ? normalizePulseSector(info.sector, entry.sector)
    : entry.sector;

  if (quote && quote.latestPrice > 0) {
    const baseline = getBaseline(code);
    return {
      ticker: code,
      name,
      sector,
      price: quote.latestPrice,
      change: quote.change,
      changePercent: quote.changePercent,
      volume: quote.volume,
      marketCap: entry.sharesOutstanding
        ? entry.sharesOutstanding * quote.latestPrice
        : 0,
      high52w: quote.high || baseline?.high52w || quote.latestPrice,
      low52w: quote.low || baseline?.low52w || quote.latestPrice,
      peRatio: baseline?.peRatio,
      eps: baseline?.eps,
      dividendYield: baseline?.dividendYield,
      stale: quote.stale,
    };
  }

  return buildStockFromBaseline({ ...entry, name, sector }, true);
}

async function fetchAllStocks(): Promise<Stock[]> {
  const pulseRows = await getCachedNgxPulseStocks();
  if (pulseRows.length > 0) {
    return buildStocksFromPulse(pulseRows);
  }

  if (!getITickApiKey()) {
    return fetchStocksFromBaselines();
  }

  let quotes: StockQuote[] = [];
  if (!isITickRateLimited()) {
    try {
      quotes = await getBatchStockQuotes(getPriorityQuoteCodes());
    } catch (err) {
      logITickFailure("batch quotes", err);
    }
  }

  const quoteByTicker = new Map(quotes.map((q) => [q.symbol.toUpperCase(), q]));

  return NGX_UNIVERSE.map((entry) => {
    const quote = quoteByTicker.get(entry.ticker) ?? null;
    return buildStock(entry, quote);
  });
}

async function fetchExchangeRate(): Promise<number | null> {
  const apiKey = process.env.EXCHANGE_RATE_API_KEY;
  if (!apiKey) return null;
  try {
    const res = await fetch(
      `https://v6.exchangerate-api.com/v6/${apiKey}/pair/USD/NGN`,
      { next: { revalidate: 3600 } }
    );
    if (res.ok) {
      const data = await res.json();
      if (data.conversion_rate) return data.conversion_rate as number;
    }
  } catch {
    /* graceful degradation */
  }
  return null;
}

export class StockDataService {
  static async getAllStocks(): Promise<Stock[]> {
    return memGetOrSet<Stock[]>("stocks:all", HOT_TTL.PULSE_LIST, async () => {
      try {
        const { data } = await cacheGetOrSet<Stock[]>(
          "stocks:all",
          HOT_TTL.PULSE_LIST,
          fetchAllStocks
        );
        return data.length > 0 ? data : fetchStocksFromBaselines();
      } catch (err) {
        logITickFailure("getAllStocks", err);
        return fetchStocksFromBaselines();
      }
    });
  }

  /** Listing row from NGX Pulse cache (same source as getAllStocks) */
  static async getStock(ticker: string): Promise<Stock | null> {
    const stocks = await this.getAllStocks();
    return stocks.find((s) => s.ticker.toUpperCase() === ticker.toUpperCase()) ?? null;
  }

  /** Detail page: live quote + metadata from iTick */
  static async getStockDetail(ticker: string): Promise<Stock | null> {
    const entry = lookupTicker(ticker);
    if (!entry) return null;
    const code = entry.ticker;

    return memGetOrSet(`stock:detail:${code}`, HOT_TTL.QUOTE, async () => {
      try {
        const { data } = await cacheGetOrSet<Stock>(
          `stock:detail:${code}`,
          CACHE_TTL.QUOTE,
          () => buildStockDetailFromITick(entry)
        );
        return data;
      } catch (err) {
        logITickFailure(`getStockDetail ${code}`, err);
        return buildStockFromBaseline(entry, true);
      }
    });
  }

  static async getQuote(ticker: string): Promise<Quote | null> {
    const entry = lookupTicker(ticker);
    const code = entry?.ticker ?? ticker.toUpperCase();

    return memGetOrSet(`quote:${code}`, HOT_TTL.QUOTE, async () => {
      try {
        const q = await getStockQuote(code);
        return stockQuoteToAppQuote(q);
      } catch {
        const baseline = entry ? getBaseline(entry.ticker) : null;
        if (!baseline) return null;
        return {
          ticker: code,
          price: baseline.price,
          change: baseline.change,
          changePercent: baseline.changePercent,
          volume: baseline.volume,
          high: baseline.high52w,
          low: baseline.low52w,
          open: baseline.price - baseline.change,
          previousClose: baseline.price - baseline.change,
          timestamp: new Date().toISOString(),
          stale: true,
        };
      }
    });
  }

  static async getOHLCV(
    ticker: string,
    days: number,
    options?: { timeframe?: Timeframe; et?: number }
  ): Promise<OHLCV[]> {
    const entry = lookupTicker(ticker);
    const code = entry?.ticker ?? ticker.toUpperCase();
    const timeframe = options?.timeframe ?? timeframeFromDays(days);
    const { kType } = TIMEFRAME_KLINE[timeframe];
    const cacheSuffix = options?.timeframe ? `tf:${timeframe}` : `days:${days}`;

    return memGetOrSet(`ohlcv:${code}:${cacheSuffix}`, HOT_TTL.OHLCV, async () => {
      try {
        const bars = await getStockKlineForTimeframe(code, timeframe, options?.et);
        if (bars.length > 0) {
          return klineBarsToOHLCV(bars, isIntradayKType(kType));
        }
      } catch (err) {
        console.error(`[NaijaStocks] iTick kline failed for ${code}:`, err);
      }

      let price = getBaseline(code)?.price;
      if (!price && getITickApiKey() && !isITickRateLimited()) {
        try {
          const q = await getStockQuote(code);
          if (q.latestPrice > 0) price = q.latestPrice;
        } catch {
          /* use baseline below */
        }
      }
      return generateOHLCVFromPrice(price || 100, days);
    });
  }

  static async getMarketSummary(): Promise<MarketSummary> {
    return memGetOrSet("market:summary", HOT_TTL.MARKET, async () => {
      const stocks = await this.getAllStocks();

      const valid = stocks.filter((s) => s.price > 0);
      const totalMarketCap = valid.reduce((sum, s) => sum + s.marketCap, 0);
      const totalVolume = valid.reduce((sum, s) => sum + s.volume, 0);
      const advancers = valid.filter((s) => s.changePercent > 0).length;
      const decliners = valid.filter((s) => s.changePercent < 0).length;
      const unchanged = valid.length - advancers - decliners;
      const fallbackAvg = valid.length
        ? valid.reduce((sum, s) => sum + s.changePercent, 0) / valid.length
        : 0;

      const hasLiveQuotes = valid.some((s) => !s.stale);

      const indexProxy = valid.length
        ? valid.reduce((sum, s) => sum + s.price, 0) / valid.length
        : 0;

      return {
        allShareIndex: hasLiveQuotes ? indexProxy : 0,
        allShareChange: fallbackAvg * 100,
        allShareChangePercent: fallbackAvg,
        marketCap: totalMarketCap,
        totalVolume,
        advancers,
        decliners,
        unchanged,
        stale: !hasLiveQuotes,
      };
    });
  }

  static async getTopMovers(type: "gainers" | "losers" | "volume", limit = 5) {
    const stocks = (await this.getAllStocks()).filter((s) => s.price > 0);
    if (type === "gainers") {
      return [...stocks]
        .filter((s) => s.changePercent > 0)
        .sort((a, b) => b.changePercent - a.changePercent)
        .slice(0, limit);
    }
    if (type === "losers") {
      return [...stocks]
        .filter((s) => s.changePercent < 0)
        .sort((a, b) => a.changePercent - b.changePercent)
        .slice(0, limit);
    }
    return [...stocks].sort((a, b) => b.volume - a.volume).slice(0, limit);
  }

  static async getStocksBySector(sector: Sector): Promise<Stock[]> {
    const stocks = await this.getAllStocks();
    return stocks.filter((s) => s.sector === sector);
  }

  static async getEconomicIndicators(): Promise<EconomicIndicator[]> {
    return memGetOrSet("indicators", HOT_TTL.ECONOMIC, async () => {
      const usdNgn = await fetchExchangeRate();
      const stocks = await this.getAllStocks();
      const valid = stocks.filter((s) => s.price > 0 && !s.stale);
      const avgChange = valid.length
        ? valid.reduce((sum, s) => sum + s.changePercent, 0) / valid.length
        : 0;

      return [
        {
          label: "NGN/USD Rate",
          value: usdNgn ? `₦${usdNgn.toFixed(2)}` : "—",
          trend: "neutral",
        },
        {
          label: "CBN MPR",
          value: "27.50%",
          change: "Unchanged",
          trend: "neutral",
        },
        {
          label: "Inflation Rate",
          value: "33.40%",
          change: "Latest NBS print",
          trend: "neutral",
        },
        {
          label: "NGX All-Share",
          value: valid.length
            ? valid.length.toLocaleString("en-NG") + " live tickers"
            : "—",
          change: valid.length ? `${avgChange.toFixed(2)}% avg` : undefined,
          trend: !valid.length ? "neutral" : avgChange >= 0 ? "up" : "down",
        },
      ];
    });
  }

  static async searchStocks(
    query: string,
    sector?: Sector,
    sortBy: "ticker" | "price" | "change" | "volume" | "marketCap" = "ticker",
    sortDir: "asc" | "desc" = "asc",
    page = 1,
    pageSize = 50
  ) {
    let stocks = await this.getAllStocks();

    if (query) {
      const q = query.toLowerCase();
      stocks = stocks.filter(
        (s) => s.ticker.toLowerCase().includes(q) || s.name.toLowerCase().includes(q)
      );
    }
    if (sector) stocks = stocks.filter((s) => s.sector === sector);

    stocks.sort((a, b) => {
      const dir = sortDir === "asc" ? 1 : -1;
      switch (sortBy) {
        case "price":
          return (a.price - b.price) * dir;
        case "change":
          return (a.changePercent - b.changePercent) * dir;
        case "volume":
          return (a.volume - b.volume) * dir;
        case "marketCap":
          return (a.marketCap - b.marketCap) * dir;
        default:
          return a.ticker.localeCompare(b.ticker) * dir;
      }
    });

    const total = stocks.length;
    const start = (page - 1) * pageSize;
    const items = stocks.slice(start, start + pageSize);
    return { items, total, page, pageSize, totalPages: Math.max(1, Math.ceil(total / pageSize)) };
  }

  static async isMarketOpen(): Promise<boolean> {
    const holidays = await getMarketHolidays();
    const today = new Date().toISOString().split("T")[0];
    if (holidays.some((h) => h.date === today)) return false;
    const day = new Date().getDay();
    return day !== 0 && day !== 6;
  }

  static invalidateCaches(ticker?: string): void {
    const t = ticker?.toUpperCase();
    const timeframes: Timeframe[] = ["1D", "1W", "1M", "3M", "1Y", "5Y"];
    const OHLCV_DAYS = [1, 5, 7, 30, 90, 365, 1825];

    if (t) {
      memClear(
        (k) =>
          k === `quote:${t}` ||
          k === `stock:detail:${t}` ||
          k.startsWith(`ohlcv:${t}:`)
      );
      void cacheDelete(`itick:quote:${t}`);
      void cacheDelete(`itick:info:${t}`);
      void cacheDelete(`stock:detail:${t}`);
      for (const tf of timeframes) {
        void cacheDelete(`ohlcv:${t}:tf:${tf}`);
        memClear((k) => k === `ohlcv:${t}:tf:${tf}`);
      }
      for (const days of OHLCV_DAYS) {
        void cacheDelete(`ohlcv:${t}:days:${days}`);
      }
      return;
    }

    memClear(
      (k) =>
        k === "stocks:all" ||
        k.startsWith("quote:") ||
        k.startsWith("ohlcv:") ||
        k === "market:summary"
    );
    void cacheDelete("stocks:all");
    void cacheDelete("itick:listing:NG");
    void cacheDelete("market:summary");
    void cacheDelete("itick:holidays:NG");
  }
}

function generateOHLCVFromPrice(basePrice: number, days: number): OHLCV[] {
  const data: OHLCV[] = [];
  let price = basePrice * 0.98;
  const now = new Date();
  let added = 0;
  for (let i = days; i >= 0 && added < days; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    if (date.getDay() === 0 || date.getDay() === 6) continue;
    const volatility = basePrice * 0.012;
    const change = (Math.random() - 0.48) * volatility;
    const open = price;
    const close = Math.max(open + change, basePrice * 0.5);
    const high = Math.max(open, close) + Math.random() * volatility * 0.4;
    const low = Math.min(open, close) - Math.random() * volatility * 0.4;
    data.push({
      date: date.toISOString().split("T")[0],
      open: Math.round(open * 100) / 100,
      high: Math.round(high * 100) / 100,
      low: Math.round(low * 100) / 100,
      close: Math.round(close * 100) / 100,
      volume: Math.floor(500000 + Math.random() * 1500000),
    });
    price = close;
    added++;
  }
  return data;
}
