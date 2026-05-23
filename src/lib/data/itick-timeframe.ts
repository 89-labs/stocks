import type { Timeframe } from "@/types";

/** iTick kType + limit for chart timeframe chips */
export const TIMEFRAME_KLINE: Record<Timeframe, { kType: number; limit: number }> = {
  "1D": { kType: 5, limit: 48 },
  "1W": { kType: 5, limit: 120 },
  "1M": { kType: 8, limit: 22 },
  "3M": { kType: 8, limit: 66 },
  "1Y": { kType: 8, limit: 252 },
  "5Y": { kType: 9, limit: 260 },
};

const DAYS_TO_TIMEFRAME: { maxDays: number; timeframe: Timeframe }[] = [
  { maxDays: 1, timeframe: "1D" },
  { maxDays: 7, timeframe: "1W" },
  { maxDays: 30, timeframe: "1M" },
  { maxDays: 90, timeframe: "3M" },
  { maxDays: 365, timeframe: "1Y" },
  { maxDays: Infinity, timeframe: "5Y" },
];

export function timeframeFromDays(days: number): Timeframe {
  for (const row of DAYS_TO_TIMEFRAME) {
    if (days <= row.maxDays) return row.timeframe;
  }
  return "5Y";
}

export function isIntradayKType(kType: number): boolean {
  return kType >= 1 && kType <= 5;
}

export function klineCacheTtlSeconds(kType: number): number {
  return isIntradayKType(kType) ? 60 : 3600;
}
