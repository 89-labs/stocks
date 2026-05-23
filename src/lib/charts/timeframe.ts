import type { OHLCV, Timeframe } from "@/types";

export const TIMEFRAME_DAYS: Record<Timeframe, number> = {
  "1D": 1,
  "1W": 7,
  "1M": 30,
  "3M": 90,
  "1Y": 365,
  "5Y": 1825,
};

export const TIMEFRAMES: { label: Timeframe; days: number }[] = (
  Object.entries(TIMEFRAME_DAYS) as [Timeframe, number][]
).map(([label, days]) => ({ label, days }));

/** Approximate calendar span covered by the series (for fetch sizing) */
export function estimateLoadedDays(data: OHLCV[]): number {
  if (!data.length) return 0;
  const sorted = [...data].sort((a, b) => a.date.localeCompare(b.date));
  const first = new Date(sorted[0].date);
  const last = new Date(sorted[sorted.length - 1].date);
  const span = Math.ceil((last.getTime() - first.getTime()) / 86_400_000) + 1;
  return Math.max(span, 1);
}

/** Keep rows within the last `days` calendar days */
export function sliceOHLCVByDays(data: OHLCV[], days: number): OHLCV[] {
  if (!data.length) return [];
  const sorted = [...data].sort((a, b) => a.date.localeCompare(b.date));
  const cutoff = new Date();
  cutoff.setHours(0, 0, 0, 0);
  cutoff.setDate(cutoff.getDate() - days);
  const cutoffStr = cutoff.toISOString().split("T")[0];
  const sliced = sorted.filter((d) => d.date >= cutoffStr);
  return sliced.length > 0 ? sliced : sorted.slice(-Math.min(days, sorted.length));
}
