import { Redis } from "@upstash/redis";

/** Namespace all app keys to avoid collisions if the DB is shared. */
const CACHE_KEY_PREFIX = "naijastocks:";

let redis: Redis | null | undefined;

export function isRedisConfigured(): boolean {
  return Boolean(
    process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
  );
}

/**
 * Lazy singleton Upstash Redis client (HTTP/REST — no TCP, ideal for serverless).
 * Uses UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN from the environment.
 */
export function getRedis(): Redis | null {
  if (redis !== undefined) return redis;

  if (!isRedisConfigured()) {
    redis = null;
    return null;
  }

  redis = Redis.fromEnv();
  return redis;
}

function cacheKey(key: string): string {
  return key.startsWith(CACHE_KEY_PREFIX) ? key : `${CACHE_KEY_PREFIX}${key}`;
}

export const CACHE_TTL = {
  QUOTE: 300,
  NEWS: 10_800,
  FINANCIALS: 86400,
  MARKET: 300,
  OHLCV: 3600,
  AI_RESEARCH: 21_600,
} as const;

export async function cacheGet<T>(key: string): Promise<T | null> {
  const client = getRedis();
  if (!client) return null;
  try {
    return await client.get<T>(cacheKey(key));
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
    await client.set(cacheKey(key), value, { ex: ttlSeconds });
  } catch {
    // Graceful degradation
  }
}

export async function cacheDelete(key: string): Promise<void> {
  const client = getRedis();
  if (!client) return;
  try {
    await client.del(cacheKey(key));
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
