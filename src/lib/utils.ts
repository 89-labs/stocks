import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const ngnFormatter = new Intl.NumberFormat("en-NG", {
  style: "currency",
  currency: "NGN",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function formatNGN(value: number): string {
  return ngnFormatter.format(value);
}

export function formatCompactNGN(value: number): string {
  if (value >= 1_000_000_000_000) {
    return `₦${(value / 1_000_000_000_000).toFixed(2)}T`;
  }
  if (value >= 1_000_000_000) {
    return `₦${(value / 1_000_000_000).toFixed(2)}B`;
  }
  if (value >= 1_000_000) {
    return `₦${(value / 1_000_000).toFixed(2)}M`;
  }
  return formatNGN(value);
}

export function formatPercent(value: number, decimals = 2): string {
  const sign = value >= 0 ? "+" : "";
  return `${sign}${value.toFixed(decimals)}%`;
}

export function formatVolume(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  return value.toString();
}

export function getChangeColor(change: number): string {
  if (change > 0) return "text-gain";
  if (change < 0) return "text-loss";
  return "text-neutral-secondary";
}

export function getChangeBgColor(change: number): string {
  if (change > 0) return "bg-gain/10";
  if (change < 0) return "bg-loss/10";
  return "bg-muted";
}

export function getChangeIcon(change: number): string {
  if (change > 0) return "▲";
  if (change < 0) return "▼";
  return "—";
}

export const AI_DISCLAIMER =
  "This is AI-generated analysis for educational purposes only. Not financial advice.";
