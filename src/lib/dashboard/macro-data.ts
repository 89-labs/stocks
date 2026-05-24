import { cacheGet, cacheSet } from "@/lib/cache/redis";
import { iTickGet, getITickApiKey } from "@/lib/data/ITickClient";
import { getUsdNgnRate } from "./exchange-rate";

export interface MacroFactor {
  label: string;
  value: string;
  change24h: number;
  unit?: string;
}

export async function getMacroFactors(): Promise<MacroFactor[]> {
  const cached = await cacheGet<MacroFactor[]>("macro:factors");
  if (cached) return cached;

  const [fx, crude, cbnRate] = await Promise.all([
    getUsdNgnRate(),
    getBrentCrudePrice(),
    Promise.resolve({ value: "27.50%", change: 0 }),
  ]);

  const factors: MacroFactor[] = [
    {
      label: "CBN Monetary Policy Rate",
      value: cbnRate.value,
      change24h: cbnRate.change,
    },
    {
      label: "NGN/USD Exchange Rate",
      value: `₦${fx.rate.toLocaleString("en-NG", { maximumFractionDigits: 2 })}`,
      change24h: fx.change24h,
    },
    {
      label: "Brent Crude Oil",
      value: crude.value,
      change24h: crude.change24h,
      unit: "USD/bbl",
    },
  ];

  await cacheSet("macro:factors", factors, 3600);
  return factors;
}

async function getBrentCrudePrice(): Promise<{ value: string; change24h: number }> {
  if (!getITickApiKey()) {
    return { value: "$78.50", change24h: 0 };
  }

  try {
    interface FuturesRow {
      ld?: number;
      chp?: number;
    }
    const row = await iTickGet<FuturesRow | null>("/futures/quote", {
      region: "US",
      code: "CL",
    });
    if (row?.ld) {
      return {
        value: `$${row.ld.toFixed(2)}`,
        change24h: row.chp ?? 0,
      };
    }
  } catch {
    // fallback
  }
  return { value: "$78.50", change24h: 0 };
}
