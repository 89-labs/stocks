import { cacheGet, cacheSet } from "@/lib/cache/redis";

const CACHE_KEY = "macro:usd-ngn";
const CACHE_TTL = 3600;

export interface ExchangeRateData {
  rate: number;
  change24h: number;
}

export async function getUsdNgnRate(): Promise<ExchangeRateData> {
  const cached = await cacheGet<ExchangeRateData>(CACHE_KEY);
  if (cached) return cached;

  const apiKey = process.env.EXCHANGE_RATE_API_KEY;
  const fallback = { rate: 1550, change24h: 0 };

  try {
    const url = apiKey
      ? `https://v6.exchangerate-api.com/v6/${apiKey}/pair/USD/NGN`
      : "https://open.er-api.com/v6/latest/USD";
    const res = await fetch(url, { next: { revalidate: 3600 } });
    if (!res.ok) return fallback;
    const data = await res.json();

    let rate: number;
    const change24h = 0;
    if (data.conversion_rate) {
      rate = data.conversion_rate;
    } else if (data.rates?.NGN) {
      rate = data.rates.NGN;
    } else {
      return fallback;
    }

    const result = { rate, change24h };
    await cacheSet(CACHE_KEY, result, CACHE_TTL);
    return result;
  } catch {
    return fallback;
  }
}
