import { Redis } from "@upstash/redis";

let redis: Redis | null = null;

export function getRedis(): Redis | null {
  if (redis) return redis;

  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) return null;

  redis = new Redis({ url, token });
  return redis;
}

export const CACHE_TTL = {
  QUOTE: 300,
  NEWS: 10_800,
  FINANCIALS: 86400,
  MARKET: 300,
  OHLCV: 3600,
} as const;

export async function cacheGet<T>(key: string): Promise<T | null> {
  const client = getRedis();
  if (!client) return null;
  try {
    return await client.get<T>(key);
  } catch {
    return null;
  }
}

export async function cacheSet(
  key: string,
  value: unknown,
  ttlSeconds: number
): Promise<void> {
  const client = getRedis();
  if (!client) return;
  try {
    await client.set(key, value, { ex: ttlSeconds });
  } catch {
    // Graceful degradation
  }
}

export async function cacheDelete(key: string): Promise<void> {
  const client = getRedis();
  if (!client) return;
  try {
    await client.del(key);
  } catch {
    // Graceful degradation
  }
}

export async function cacheGetOrSet<T>(
  key: string,
  ttlSeconds: number,
  fetcher: () => Promise<T>
): Promise<{ data: T; stale: boolean }> {
  const cached = await cacheGet<{ data: T; cachedAt: number }>(key);

  if (cached) {
    const age = Date.now() - cached.cachedAt;
    const isStale = age > ttlSeconds * 1000;
    return { data: cached.data, stale: isStale };
  }

  const data = await fetcher();
  await cacheSet(key, { data, cachedAt: Date.now() }, ttlSeconds * 2);
  return { data, stale: false };
}
