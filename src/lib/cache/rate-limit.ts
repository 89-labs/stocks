import { Ratelimit } from "@upstash/ratelimit";
import { getRedis, isRedisConfigured } from "./redis";

let aiRateLimit: Ratelimit | null = null;
let simRateLimit: Ratelimit | null = null;

function createRateLimit(
  prefix: string,
  limit: number,
  window: `${number} s` | `${number} m` | `${number} h` | `${number} d`
): Ratelimit {
  const redis = getRedis()!;
  return new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(limit, window),
    prefix,
    analytics: true,
    /** Cuts duplicate Redis calls within the same warm serverless instance. */
    ephemeralCache: new Map(),
  });
}

export function getAIRateLimit(): Ratelimit | null {
  if (!isRedisConfigured() || !getRedis()) return null;

  if (!aiRateLimit) {
    aiRateLimit = createRateLimit("naijastocks:ratelimit:ai", 20, "1 h");
  }
  return aiRateLimit;
}

export function getSimRateLimit(): Ratelimit | null {
  if (!isRedisConfigured() || !getRedis()) return null;

  if (!simRateLimit) {
    simRateLimit = createRateLimit("naijastocks:ratelimit:sim", 3, "1 d");
  }
  return simRateLimit;
}

export async function checkRateLimit(
  limiter: Ratelimit | null,
  identifier: string
): Promise<{ success: boolean; remaining: number }> {
  if (!limiter) return { success: true, remaining: 999 };

  const result = await limiter.limit(identifier);
  return { success: result.success, remaining: result.remaining };
}
