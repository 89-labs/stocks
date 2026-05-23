import { cacheGet, cacheSet, cacheDelete } from "@/lib/cache/redis";
import { fetchNgxPulseStocks, getNgxPulseApiKey, type NgxPulseStock } from "./ngx-pulse-service";

const STOCKS_KEY = "ngxpulse:stocks";
const META_KEY = "ngxpulse:meta";
/** Keep payload in Redis well past refresh window (gate uses meta timestamps) */
const REDIS_STORE_TTL_SEC = 86_400;

export interface NgxPulseCacheMeta {
  lastFetchedAt: number;
  dailyCount: number;
  dailyDate: string;
}

interface NgxPulseCachePayload {
  stocks: NgxPulseStock[];
  meta: NgxPulseCacheMeta;
}

export interface NgxPulseCacheStatus {
  lastRefreshedAt: string | null;
  nextRefreshAt: string | null;
  refreshIntervalMinutes: number;
  dailyRequestCount: number;
  dailyRequestLimit: number;
  canRefreshNow: boolean;
  dailyLimitReached: boolean;
}

/** In-process fallback when Upstash is not configured */
let memoryPayload: NgxPulseCachePayload | null = null;

function todayUtc(): string {
  return new Date().toISOString().slice(0, 10);
}

export function getNgxPulseRefreshMinutes(): number {
  const n = parseInt(process.env.NGX_PULSE_REFRESH_MINUTES || "20", 10);
  return Number.isFinite(n) && n > 0 ? n : 20;
}

export function getNgxPulseRefreshSeconds(): number {
  return getNgxPulseRefreshMinutes() * 60;
}

/** Next.js ISR — align with NGX Pulse refresh window */
export const NGX_PULSE_PAGE_REVALIDATE = getNgxPulseRefreshSeconds();

export function getNgxPulseRefreshIntervalMs(): number {
  return getNgxPulseRefreshSeconds() * 1000;
}

export function getNgxPulseDailyMaxRequests(): number {
  const n = parseInt(process.env.NGX_PULSE_DAILY_MAX_REQUESTS || "80", 10);
  return Number.isFinite(n) && n > 0 ? n : 80;
}

async function loadPayload(): Promise<NgxPulseCachePayload | null> {
  const [stocks, meta] = await Promise.all([
    cacheGet<NgxPulseStock[]>(STOCKS_KEY),
    cacheGet<NgxPulseCacheMeta>(META_KEY),
  ]);

  if (stocks?.length && meta?.lastFetchedAt) {
    return { stocks, meta };
  }

  if (memoryPayload?.stocks.length && memoryPayload.meta.lastFetchedAt) {
    return memoryPayload;
  }

  return null;
}

async function savePayload(stocks: NgxPulseStock[], meta: NgxPulseCacheMeta): Promise<void> {
  memoryPayload = { stocks, meta };
  await Promise.all([
    cacheSet(STOCKS_KEY, stocks, REDIS_STORE_TTL_SEC),
    cacheSet(META_KEY, meta, REDIS_STORE_TTL_SEC),
  ]);
}

function msUntilNextRefresh(lastFetchedAt: number): number {
  return Math.max(0, getNgxPulseRefreshIntervalMs() - (Date.now() - lastFetchedAt));
}

function effectiveDailyCount(meta: NgxPulseCacheMeta | null): number {
  if (!meta) return 0;
  return meta.dailyDate === todayUtc() ? meta.dailyCount : 0;
}

function isDailyLimitReached(meta: NgxPulseCacheMeta | null): boolean {
  return effectiveDailyCount(meta) >= getNgxPulseDailyMaxRequests();
}

export async function getNgxPulseCacheStatus(): Promise<NgxPulseCacheStatus> {
  const payload = await loadPayload();
  const meta = payload?.meta ?? null;
  const lastFetchedAt = meta?.lastFetchedAt ?? 0;
  const waitMs = lastFetchedAt ? msUntilNextRefresh(lastFetchedAt) : 0;
  const dailyCount = effectiveDailyCount(meta);
  const dailyLimit = getNgxPulseDailyMaxRequests();
  const limitReached = isDailyLimitReached(meta);

  return {
    lastRefreshedAt: lastFetchedAt ? new Date(lastFetchedAt).toISOString() : null,
    nextRefreshAt: lastFetchedAt && waitMs > 0 ? new Date(Date.now() + waitMs).toISOString() : null,
    refreshIntervalMinutes: getNgxPulseRefreshMinutes(),
    dailyRequestCount: dailyCount,
    dailyRequestLimit: dailyLimit,
    canRefreshNow: Boolean(getNgxPulseApiKey()) && waitMs === 0 && !limitReached,
    dailyLimitReached: limitReached,
  };
}

/**
 * NGX Pulse board with a hard refresh gate (default 20 min) and daily API cap (default 80).
 * Never calls the upstream API until the interval has elapsed since lastFetchedAt.
 */
export async function getCachedNgxPulseStocks(): Promise<NgxPulseStock[]> {
  if (!getNgxPulseApiKey()) return [];

  const payload = await loadPayload();
  const meta = payload?.meta ?? null;
  const stocks = payload?.stocks ?? [];
  const now = Date.now();

  if (meta && now - meta.lastFetchedAt < getNgxPulseRefreshIntervalMs()) {
    return stocks;
  }

  if (isDailyLimitReached(meta)) {
    if (stocks.length) {
      if (!meta?.dailyDate || effectiveDailyCount(meta) >= getNgxPulseDailyMaxRequests()) {
        console.warn(
          `[NaijaStocks] NGX Pulse daily limit (${getNgxPulseDailyMaxRequests()}) reached — serving cache`
        );
      }
      return stocks;
    }
    return [];
  }

  const fresh = await fetchNgxPulseStocks();
  if (!fresh?.length) {
    return stocks;
  }

  const today = todayUtc();
  const prevCount = meta?.dailyDate === today ? meta.dailyCount : 0;
  const newMeta: NgxPulseCacheMeta = {
    lastFetchedAt: now,
    dailyCount: prevCount + 1,
    dailyDate: today,
  };

  await savePayload(fresh, newMeta);
  return fresh;
}

/** Clears NGX Pulse cache (forces API on next window if under daily cap) */
export async function clearNgxPulseCache(): Promise<void> {
  memoryPayload = null;
  await Promise.all([cacheDelete(STOCKS_KEY), cacheDelete(META_KEY)]);
}
