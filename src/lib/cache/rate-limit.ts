import { Ratelimit } from "@upstash/ratelimit";
import { getRedis } from "./redis";

let aiRateLimit: Ratelimit | null = null;
let simRateLimit: Ratelimit | null = null;

export function getAIRateLimit(): Ratelimit | null {
  const redis = getRedis();
  if (!redis) return null;

  if (!aiRateLimit) {
    aiRateLimit = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(20, "1 h"),
      prefix: "naijastocks:ai",
    });
  }
  return aiRateLimit;
}

export function getSimRateLimit(): Ratelimit | null {
  const redis = getRedis();
  if (!redis) return null;

  if (!simRateLimit) {
    simRateLimit = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(3, "1 d"),
      prefix: "naijastocks:sim",
    });
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
