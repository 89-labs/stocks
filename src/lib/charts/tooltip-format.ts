import { formatNGN } from "@/lib/utils";

/** Format Recharts tooltip values, including range tuples [low, high]. */
export function formatChartTooltipValue(value: unknown): string {
  if (Array.isArray(value)) {
    const nums = value.map((v) => Number(v)).filter((n) => Number.isFinite(n));
    if (nums.length >= 2) return `${formatNGN(nums[0]!)} – ${formatNGN(nums[1]!)}`;
    if (nums.length === 1) return formatNGN(nums[0]!);
  }
  const n = Number(value);
  return formatNGN(Number.isFinite(n) ? n : 0);
}
