import { z } from "zod";
import { cacheGet, cacheSet } from "@/lib/cache/redis";
import {
  getStockInfo,
  getStockKline,
  getStockQuote,
} from "@/lib/data/stock-data-service";
import { NewsService } from "@/lib/data/news-service";
import { AI_DISCLAIMER } from "@/lib/utils";
import type { KlineBar } from "@/types/stock";
import type {
  ForecastChartPoint,
  HistoryChartPoint,
  StockGrowthForecast,
  StockHistoricalSummary,
  StockResearch,
} from "@/types/stock-forecast";
import {
  getAnalysisDateKey,
  getDailyResearchFromDb,
  getOrCreateDailyStockResearch,
} from "@/lib/dashboard/daily-stock-research";

/** ~5 years of NGX trading days */
export const HISTORY_BAR_LIMIT = 1260;
/** ~1 year forward */
export const FORECAST_HORIZON_DAYS = 252;
/** @deprecated Redis TTL — DB is the source of truth; Redis is a warm cache only */
export const RESEARCH_CACHE_TTL_SEC = 6 * 60 * 60;

export interface StockResearchResult extends StockResearch {
  fromCache: boolean;
  analysisDate: string;
  source: "db" | "generated";
}

const agentForecastSchema = z.object({
  forecast: z.object({
    expectedPrice: z.number(),
    bear: z.object({ price: z.number(), return: z.number() }),
    base: z.object({ price: z.number(), return: z.number() }),
    bull: z.object({ price: z.number(), return: z.number() }),
    confidence: z.enum(["low", "medium", "high"]),
    momentumSignal: z.enum(["bullish", "neutral", "bearish"]),
  }),
  forecastChart: z.array(
    z.object({
      label: z.string(),
      bear: z.number(),
      base: z.number(),
      bull: z.number(),
    })
  ),
  keyDrivers: z.array(z.string()).min(1),
  newsSentiment: z.object({
    label: z.enum(["bullish", "neutral", "bearish"]),
    summary: z.string(),
  }),
  marketSpeculation: z.array(z.string()),
  reasoning: z.string(),
  riskFactors: z.array(z.string()),
  volatilityNote: z.string(),
});

function researchCacheKey(ticker: string): string {
  return `ai:research:${ticker.toUpperCase()}`;
}

function forecastCacheKey(ticker: string): string {
  return `ai:forecast:${ticker.toUpperCase()}`;
}

function stripCodeFences(raw: string): string {
  return raw
    .replace(/^\s*```(?:json)?/i, "")
    .replace(/```\s*$/, "")
    .trim();
}

function parseAgentJson<T>(raw: string, schema: z.ZodType<T>): T | null {
  try {
    const cleaned = stripCodeFences(raw);
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (!match) return null;
    const parsed = schema.safeParse(JSON.parse(match[0]));
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

function sampleWeekly(bars: KlineBar[]): HistoryChartPoint[] {
  if (bars.length === 0) return [];

  const sorted = [...bars].sort((a, b) => a.timestamp - b.timestamp);
  const weekly: HistoryChartPoint[] = [];

  for (const bar of sorted) {
    const date = new Date(bar.timestamp).toISOString().slice(0, 10);
    const weekKey = date.slice(0, 7);
    const last = weekly[weekly.length - 1];
    if (!last || !last.date.startsWith(weekKey)) {
      weekly.push({ date, close: bar.close });
    } else {
      last.date = date;
      last.close = bar.close;
    }
  }

  if (weekly.length <= 270) return weekly;
  const step = Math.ceil(weekly.length / 260);
  return weekly.filter((_, i) => i % step === 0 || i === weekly.length - 1);
}

function computeHistoricalSummary(
  bars: KlineBar[],
  currentPrice: number
): StockHistoricalSummary {
  const sorted = [...bars].sort((a, b) => a.timestamp - b.timestamp);
  const closes = sorted.map((b) => b.close);
  const startPrice = closes[0] ?? currentPrice;
  const endPrice = closes[closes.length - 1] ?? currentPrice;
  const years = Math.max(sorted.length / 252, 0.25);
  const totalReturn = startPrice ? (endPrice - startPrice) / startPrice : 0;
  const annualizedReturn =
    startPrice > 0 && years > 0
      ? Math.pow(endPrice / startPrice, 1 / years) - 1
      : totalReturn;

  const dailyReturns: number[] = [];
  for (let i = 1; i < closes.length; i++) {
    if (closes[i - 1]) {
      dailyReturns.push((closes[i] - closes[i - 1]) / closes[i - 1]);
    }
  }
  const mean =
    dailyReturns.reduce((sum, r) => sum + r, 0) / (dailyReturns.length || 1);
  const variance =
    dailyReturns.reduce((sum, r) => sum + (r - mean) ** 2, 0) /
    (dailyReturns.length || 1);
  const volatility = Math.sqrt(variance) * Math.sqrt(252);

  const periodHigh = sorted.length
    ? Math.max(...sorted.map((b) => b.high))
    : currentPrice;
  const periodLow = sorted.length
    ? Math.min(...sorted.map((b) => b.low))
    : currentPrice;

  let trend: StockHistoricalSummary["trend"] = "sideways";
  if (totalReturn > 0.08) trend = "uptrend";
  else if (totalReturn < -0.08) trend = "downtrend";

  return {
    periodYears: 5,
    barCount: sorted.length,
    startDate: sorted[0]
      ? new Date(sorted[0].timestamp).toISOString().slice(0, 10)
      : new Date().toISOString().slice(0, 10),
    endDate: sorted[sorted.length - 1]
      ? new Date(sorted[sorted.length - 1].timestamp).toISOString().slice(0, 10)
      : new Date().toISOString().slice(0, 10),
    startPrice: Math.round(startPrice * 100) / 100,
    endPrice: Math.round(endPrice * 100) / 100,
    totalReturn: Math.round(totalReturn * 10000) / 10000,
    annualizedReturn: Math.round(annualizedReturn * 10000) / 10000,
    volatility: Math.round(volatility * 10000) / 10000,
    periodHigh: Math.round(periodHigh * 100) / 100,
    periodLow: Math.round(periodLow * 100) / 100,
    trend,
  };
}

function addForecastDates(
  points: z.infer<typeof agentForecastSchema>["forecastChart"]
): ForecastChartPoint[] {
  const now = Date.now();
  const monthOffsets: Record<string, number> = {
    "3M": 3,
    "6M": 6,
    "9M": 9,
    "12M": 12,
  };

  return points.map((p) => {
    const months = monthOffsets[p.label] ?? 12;
    const date = new Date(now);
    date.setMonth(date.getMonth() + months);
    return {
      ...p,
      date: date.toISOString().slice(0, 10),
    };
  });
}

function fallbackAgentForecast(
  currentPrice: number,
  summary: StockHistoricalSummary
): z.infer<typeof agentForecastSchema> {
  const drift = summary.annualizedReturn || 0.05;
  const vol = summary.volatility || 0.2;
  const basePrice = currentPrice * (1 + drift);
  const bearPrice = currentPrice * (1 + drift - vol);
  const bullPrice = currentPrice * (1 + drift + vol);

  const mk = (price: number) => ({
    price: Math.round(price * 100) / 100,
    return: Math.round(((price - currentPrice) / currentPrice) * 10000) / 10000,
  });

  const interpolate = (months: number) => {
    const factor = months / 12;
    return {
      bear: Math.round((currentPrice + (bearPrice - currentPrice) * factor) * 100) / 100,
      base: Math.round((currentPrice + (basePrice - currentPrice) * factor) * 100) / 100,
      bull: Math.round((currentPrice + (bullPrice - currentPrice) * factor) * 100) / 100,
    };
  };

  return {
    forecast: {
      expectedPrice: mk(basePrice).price,
      bear: mk(bearPrice),
      base: mk(basePrice),
      bull: mk(bullPrice),
      confidence: summary.barCount > 400 ? "medium" : "low",
      momentumSignal:
        summary.trend === "uptrend"
          ? "bullish"
          : summary.trend === "downtrend"
            ? "bearish"
            : "neutral",
    },
    forecastChart: (["3M", "6M", "9M", "12M"] as const).map((label) => ({
      label,
      ...interpolate(label === "3M" ? 3 : label === "6M" ? 6 : label === "9M" ? 9 : 12),
    })),
    keyDrivers: [
      "Five-year price trend and annualised return",
      "NGX sector dynamics and CBN monetary policy",
      "NGN/USD exchange rate and inflation environment",
    ],
    newsSentiment: {
      label: "neutral",
      summary: "Insufficient news signal — quantitative trend used as primary input.",
    },
    marketSpeculation: [
      "Model extrapolates historical drift and volatility when live news signal is limited.",
    ],
    reasoning:
      `Based on ${summary.barCount} daily bars over ~${summary.periodYears} years, ` +
      `${summary.trend} price action, and ${(summary.annualizedReturn * 100).toFixed(1)}% ` +
      `annualised return, the base-case 12-month target is ₦${mk(basePrice).price.toFixed(2)}.`,
    riskFactors: [
      "Nigerian macro volatility (FX, inflation, policy shifts)",
      "Liquidity constraints on NGX mid/small caps",
      "Model risk from limited or incomplete historical data",
    ],
    volatilityNote: `Annualised volatility ~${(summary.volatility * 100).toFixed(1)}% from historical daily returns.`,
  };
}

function formatNewsContext(
  articles: Awaited<ReturnType<typeof NewsService.getNewsForTicker>>
): string {
  if (articles.length === 0) return "No ticker-specific headlines found.";
  return articles
    .slice(0, 12)
    .map(
      (a, i) =>
        `${i + 1}. [${a.source}] ${a.title} (${a.sentiment ?? "neutral"}) — ${a.summary.slice(0, 180)}`
    )
    .join("\n");
}

async function fetchResearchInputs(ticker: string) {
  const normalized = ticker.toUpperCase();
  const [quote, info, bars, news] = await Promise.all([
    getStockQuote(normalized),
    getStockInfo(normalized),
    getStockKline(normalized, 8, HISTORY_BAR_LIMIT),
    NewsService.getNewsForTicker(normalized),
  ]);

  const currentPrice =
    quote?.latestPrice ?? bars[bars.length - 1]?.close ?? 0;
  const historyChart = sampleWeekly(bars);
  const historicalSummary = computeHistoricalSummary(bars, currentPrice);
  const newsContext = formatNewsContext(news);

  return {
    normalized,
    companyName: info.name,
    currentPrice,
    bars,
    historyChart,
    historicalSummary,
    newsContext,
  };
}

function buildForecastPrompt(input: {
  ticker: string;
  companyName: string;
  currentPrice: number;
  historicalSummary: StockHistoricalSummary;
  historyChart: HistoryChartPoint[];
  newsContext: string;
}): string {
  const recent = input.historyChart.slice(-12);
  return `Generate a 12-month NGX stock growth forecast for ${input.companyName} (${input.ticker}).

CURRENT PRICE: ₦${input.currentPrice.toFixed(2)}

5-YEAR HISTORY SUMMARY (pre-computed from ${input.historicalSummary.barCount} daily bars):
- Period: ${input.historicalSummary.startDate} → ${input.historicalSummary.endDate}
- Start → end price: ₦${input.historicalSummary.startPrice} → ₦${input.historicalSummary.endPrice}
- Total return: ${(input.historicalSummary.totalReturn * 100).toFixed(1)}%
- Annualised return: ${(input.historicalSummary.annualizedReturn * 100).toFixed(1)}%
- Annualised volatility: ${(input.historicalSummary.volatility * 100).toFixed(1)}%
- Period high/low: ₦${input.historicalSummary.periodHigh} / ₦${input.historicalSummary.periodLow}
- Trend: ${input.historicalSummary.trend}

RECENT WEEKLY CLOSES (last 12 weeks):
${recent.map((p) => `${p.date}: ₦${p.close}`).join("\n")}

NEWS & MARKET HEADLINES:
${input.newsContext}

Use the history, news sentiment, and Nigerian market context (CBN policy, NGN/USD, sector trends, oil where relevant) to produce bear/base/bull 12-month scenarios.

Respond ONLY with valid JSON (no markdown fences):
{
  "forecast": {
    "expectedPrice": number,
    "bear": { "price": number, "return": number },
    "base": { "price": number, "return": number },
    "bull": { "price": number, "return": number },
    "confidence": "low" | "medium" | "high",
    "momentumSignal": "bullish" | "neutral" | "bearish"
  },
  "forecastChart": [
    { "label": "3M", "bear": number, "base": number, "bull": number },
    { "label": "6M", "bear": number, "base": number, "bull": number },
    { "label": "9M", "bear": number, "base": number, "bull": number },
    { "label": "12M", "bear": number, "base": number, "bull": number }
  ],
  "keyDrivers": string[],
  "newsSentiment": { "label": "bullish" | "neutral" | "bearish", "summary": string },
  "marketSpeculation": string[],
  "reasoning": string,
  "riskFactors": string[],
  "volatilityNote": string
}

Returns are decimals (0.12 = +12%). All prices in NGN, rounded to 2 dp. expectedPrice should equal base.price.`;
}

function buildAnalysisPrompt(input: {
  ticker: string;
  companyName: string;
  currentPrice: number;
  historicalSummary: StockHistoricalSummary;
  newsContext: string;
  forecastReasoning: string;
}): string {
  return `Write a comprehensive NGX stock research analysis for ${input.companyName} (${input.ticker}).

Current price: ₦${input.currentPrice.toFixed(2)}
5-year trend: ${input.historicalSummary.trend}, annualised return ${(input.historicalSummary.annualizedReturn * 100).toFixed(1)}%, volatility ${(input.historicalSummary.volatility * 100).toFixed(1)}%
Period range: ₦${input.historicalSummary.periodLow} – ₦${input.historicalSummary.periodHigh}

News context:
${input.newsContext}

12-month forecast summary:
${input.forecastReasoning}

Structure exactly as:
## Summary
## Price Analysis
## Key Drivers
## Sentiment
## Risk Factors
## 12-Month Outlook
## Disclaimer
End disclaimer with: "This analysis is AI-generated for educational purposes only. It is not financial advice."

Do NOT call tools — use the data above. Plain English for Nigerian investors. Prices in ₦.`;
}

export async function generateStockGrowthForecast(
  ticker: string,
  prefetched?: Awaited<ReturnType<typeof fetchResearchInputs>>
): Promise<StockGrowthForecast> {
  const input = prefetched ?? (await fetchResearchInputs(ticker));
  const targetDate = new Date();
  targetDate.setDate(targetDate.getDate() + FORECAST_HORIZON_DAYS);

  let agentPayload = null;
  if (process.env.GROQ_API_KEY) {
    try {
      const { mastra } = await import("@/mastra");
      const agent = mastra.getAgentById("predictionAgent");
      const result = await agent.generate(
        buildForecastPrompt({
          ticker: input.normalized,
          companyName: input.companyName,
          currentPrice: input.currentPrice,
          historicalSummary: input.historicalSummary,
          historyChart: input.historyChart,
          newsContext: input.newsContext,
        })
      );
      agentPayload = parseAgentJson(result.text, agentForecastSchema);
    } catch (err) {
      console.error(`[NaijaStocks] forecast agent failed for ${input.normalized}:`, err);
    }
  }

  const payload =
    agentPayload ?? fallbackAgentForecast(input.currentPrice, input.historicalSummary);

  return {
    ticker: input.normalized,
    companyName: input.companyName,
    currentPrice: input.currentPrice,
    generatedAt: new Date().toISOString(),
    targetDate: targetDate.toISOString().slice(0, 10),
    historicalSummary: input.historicalSummary,
    historyChart: input.historyChart,
    forecast: {
      horizonDays: FORECAST_HORIZON_DAYS,
      expectedPrice: payload.forecast.expectedPrice,
      bear: payload.forecast.bear,
      base: payload.forecast.base,
      bull: payload.forecast.bull,
      confidence: payload.forecast.confidence,
      momentumSignal: payload.forecast.momentumSignal,
    },
    forecastChart: addForecastDates(payload.forecastChart),
    keyDrivers: payload.keyDrivers,
    newsSentiment: payload.newsSentiment,
    marketSpeculation: payload.marketSpeculation,
    reasoning: payload.reasoning,
    riskFactors: payload.riskFactors,
    volatilityNote: payload.volatilityNote,
    disclaimer: AI_DISCLAIMER,
  };
}

async function generateStockAnalysisText(
  input: Awaited<ReturnType<typeof fetchResearchInputs>>,
  forecastReasoning: string
): Promise<string> {
  if (!process.env.GROQ_API_KEY) {
    return (
      `## Summary\n${input.companyName} (${input.normalized}) is trading at ₦${input.currentPrice.toFixed(2)}.\n\n` +
      `## 12-Month Outlook\n${forecastReasoning}\n\n## Disclaimer\n${AI_DISCLAIMER}`
    );
  }

  try {
    const { mastra } = await import("@/mastra");
    const agent = mastra.getAgentById("stockAnalysisAgent");
    const result = await agent.generate(
      buildAnalysisPrompt({
        ticker: input.normalized,
        companyName: input.companyName,
        currentPrice: input.currentPrice,
        historicalSummary: input.historicalSummary,
        newsContext: input.newsContext,
        forecastReasoning,
      })
    );
    return result.text.trim();
  } catch (err) {
    console.error(`[NaijaStocks] analysis agent failed for ${input.normalized}:`, err);
    return forecastReasoning;
  }
}

export async function generateStockResearch(ticker: string): Promise<StockResearch> {
  const input = await fetchResearchInputs(ticker);
  const forecast = await generateStockGrowthForecast(ticker, input);
  const analysis = await generateStockAnalysisText(input, forecast.reasoning);

  return {
    ticker: input.normalized,
    companyName: input.companyName,
    generatedAt: new Date().toISOString(),
    analysis,
    forecast,
  };
}

export async function getCachedStockResearch(
  ticker: string,
  options?: { refresh?: boolean }
): Promise<StockResearchResult | null> {
  const normalized = ticker.toUpperCase();
  const analysisDate = getAnalysisDateKey();

  if (!options?.refresh) {
    const redisHit = await cacheGet<{
      research: StockResearch;
      analysisDate: string;
    }>(researchCacheKey(normalized));
    if (redisHit?.research && redisHit.analysisDate === analysisDate) {
      return {
        ...redisHit.research,
        fromCache: true,
        analysisDate,
        source: "db",
      };
    }
  }

  try {
    const { research, fromCache } = await getOrCreateDailyStockResearch(
      normalized,
      () => generateStockResearch(normalized),
      { refresh: options?.refresh }
    );

    await cacheSet(
      researchCacheKey(normalized),
      { research, analysisDate },
      RESEARCH_CACHE_TTL_SEC
    );
    await cacheSet(
      forecastCacheKey(normalized),
      research.forecast,
      RESEARCH_CACHE_TTL_SEC
    );

    return {
      ...research,
      fromCache,
      analysisDate,
      source: fromCache ? "db" : "generated",
    };
  } catch (err) {
    console.error(`[NaijaStocks] daily research failed for ${normalized}:`, err);
    return null;
  }
}

export async function getCachedStockForecast(
  ticker: string,
  options?: { refresh?: boolean }
): Promise<(StockGrowthForecast & { fromCache: boolean; analysisDate: string }) | null> {
  const normalized = ticker.toUpperCase();
  const analysisDate = getAnalysisDateKey();

  if (!options?.refresh) {
    const cached = await cacheGet<StockGrowthForecast>(forecastCacheKey(normalized));
    if (cached) return { ...cached, fromCache: true, analysisDate };

    const dbResearch = await getDailyResearchFromDb(normalized, analysisDate);
    if (dbResearch?.forecast) {
      return {
        ...dbResearch.forecast,
        fromCache: true,
        analysisDate,
      };
    }
  }

  const research = await getCachedStockResearch(normalized, options);
  return research
    ? {
        ...research.forecast,
        fromCache: research.fromCache,
        analysisDate: research.analysisDate,
      }
    : null;
}
