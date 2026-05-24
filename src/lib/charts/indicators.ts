import type { KlineBar } from "@/types/stock";

export function movingAverage(values: number[], period: number): (number | null)[] {
  return values.map((_, i) => {
    if (i < period - 1) return null;
    const slice = values.slice(i - period + 1, i + 1);
    return slice.reduce((s, v) => s + v, 0) / period;
  });
}

export function bollingerBands(
  values: number[],
  period = 20,
  stdDev = 2
): { upper: (number | null)[]; lower: (number | null)[]; middle: (number | null)[] } {
  const middle = movingAverage(values, period);
  const upper: (number | null)[] = [];
  const lower: (number | null)[] = [];

  for (let i = 0; i < values.length; i++) {
    if (i < period - 1) {
      upper.push(null);
      lower.push(null);
      continue;
    }
    const slice = values.slice(i - period + 1, i + 1);
    const mean = middle[i]!;
    const variance = slice.reduce((s, v) => s + (v - mean) ** 2, 0) / period;
    const sd = Math.sqrt(variance);
    upper.push(mean + stdDev * sd);
    lower.push(mean - stdDev * sd);
  }
  return { upper, lower, middle };
}

export function computeRSI(closes: number[], period = 14): (number | null)[] {
  const rsi: (number | null)[] = [];
  for (let i = 0; i < closes.length; i++) {
    if (i < period) {
      rsi.push(null);
      continue;
    }
    let gains = 0;
    let losses = 0;
    for (let j = i - period + 1; j <= i; j++) {
      const diff = closes[j] - closes[j - 1];
      if (diff >= 0) gains += diff;
      else losses -= diff;
    }
    const avgGain = gains / period;
    const avgLoss = losses / period;
    if (avgLoss === 0) {
      rsi.push(100);
    } else {
      const rs = avgGain / avgLoss;
      rsi.push(100 - 100 / (1 + rs));
    }
  }
  return rsi;
}

export function enrichKlineWithIndicators(bars: KlineBar[]) {
  const closes = bars.map((b) => b.close);
  const ma20 = movingAverage(closes, 20);
  const ma50 = movingAverage(closes, 50);
  const bb = bollingerBands(closes, 20, 2);
  const rsi = computeRSI(closes, 14);

  return bars.map((bar, i) => ({
    ...bar,
    ma20: ma20[i],
    ma50: ma50[i],
    bbUpper: bb.upper[i],
    bbLower: bb.lower[i],
    rsi: rsi[i],
  }));
}
