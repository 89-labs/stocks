import type { AIPrediction, MarketBrief, SimulationResult } from "@/types";
import { AI_DISCLAIMER } from "@/lib/utils";
import { StockDataService } from "./stock-data-service";

/**
 * Legacy helper layer kept for backwards-compatibility with existing UI
 * (AIPredictionPanel, TradeSimulator, InsightsPage, etc.). All AI generation
 * now flows through the Mastra agent registry — there are no direct calls to
 * `@ai-sdk/groq` from this module any more — agents use Groq via Mastra.
 *
 * Heavy data-shape conversions are kept here so callers continue to receive
 * the `AIPrediction`, `SimulationResult`, and `MarketBrief` shapes they
 * already render.
 */

function linearRegressionForecast(
  prices: number[],
  daysAhead: number
): { price: number; low: number; high: number; confidence: number } {
  const n = prices.length;
  if (n < 2) {
    const last = prices[0] || 100;
    return { price: last, low: last * 0.95, high: last * 1.05, confidence: 0.3 };
  }

  let sumX = 0,
    sumY = 0,
    sumXY = 0,
    sumX2 = 0;
  for (let i = 0; i < n; i++) {
    sumX += i;
    sumY += prices[i];
    sumXY += i * prices[i];
    sumX2 += i * i;
  }

  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;
  const predicted = intercept + slope * (n + daysAhead);

  const residuals = prices.map((p, i) => p - (intercept + slope * i));
  const stdDev = Math.sqrt(residuals.reduce((s, r) => s + r * r, 0) / n);
  const confidence = Math.max(0.3, Math.min(0.9, 1 - stdDev / (prices[n - 1] || 1)));

  return {
    price: Math.round(predicted * 100) / 100,
    low: Math.round((predicted - 1.96 * stdDev) * 100) / 100,
    high: Math.round((predicted + 1.96 * stdDev) * 100) / 100,
    confidence: Math.round(confidence * 100) / 100,
  };
}

/**
 * Lazily import the Mastra runtime so this module is safe to use from
 * non-AI code paths (or in test environments without a Groq key).
 */
async function getMastra() {
  const { mastra } = await import("@/mastra");
  return mastra;
}

async function tryGenerateText(
  agentId:
    | "stockAnalysisAgent"
    | "marketBriefAgent"
    | "stockScreenerAgent"
    | "predictionAgent",
  prompt: string
): Promise<string | null> {
  if (!process.env.GROQ_API_KEY) return null;
  try {
    const mastra = await getMastra();
    const agent = mastra.getAgentById(agentId);
    const result = await agent.generate(prompt);
    return result.text;
  } catch (err) {
    console.error(`[NaijaStocks] Mastra agent ${agentId} failed:`, err);
    return null;
  }
}

export class AIService {
  static async predictStock(
    ticker: string,
    currentPrice: number,
    companyName: string
  ): Promise<AIPrediction> {
    const ohlcv = await StockDataService.getOHLCV(ticker, 90);
    const prices =
      ohlcv.length > 1 ? ohlcv.map((d) => d.close) : [currentPrice * 0.95, currentPrice];

    const pred7 = linearRegressionForecast(prices, 7);
    const pred30 = linearRegressionForecast(prices, 30);
    const pred90 = linearRegressionForecast(prices, 90);

    const direction30 = pred30.price > currentPrice ? "upward" : "downward";
    let reasoning =
      `${companyName} (${ticker}) is currently trading at ₦${currentPrice.toFixed(2)}. ` +
      `Based on recent price trends and linear regression analysis, the model suggests a ${direction30} ` +
      `trajectory over the next 30 days, with a base case target of ₦${pred30.price.toFixed(2)}. ` +
      `Key factors include sector performance, CBN monetary policy, and NGN/USD exchange rate movements. ` +
      `Confidence is ${(pred30.confidence * 100).toFixed(0)}% based on historical volatility.`;

    const mastraText = await tryGenerateText(
      "stockAnalysisAgent",
      `Write a 2–3 sentence plain-English analysis for the NGX stock ${companyName} (${ticker}) ` +
        `currently at ₦${currentPrice}. The 30-day quantitative forecast is ₦${pred30.price}. ` +
        `Reference Nigerian market context (CBN policy, NGN/USD, sector dynamics). ` +
        `Do NOT call any tools — answer directly. Be concise.`
    );
    if (mastraText) reasoning = mastraText.trim();

    return {
      ticker,
      currentPrice,
      predictions: [
        { days: 7, ...pred7 },
        { days: 30, ...pred30 },
        { days: 90, ...pred90 },
      ],
      reasoning,
      disclaimer: AI_DISCLAIMER,
    };
  }

  static async simulateTrade(
    ticker: string,
    amount: number,
    currentPrice: number,
    companyName: string
  ): Promise<SimulationResult> {
    const { simulateTradeWithForecast } = await import("@/lib/dashboard/trade-simulation");
    return simulateTradeWithForecast(ticker, amount, currentPrice, companyName);
  }

  static async generateMarketBrief(): Promise<MarketBrief> {
    const today = new Date().toISOString().split("T")[0];

    let summary =
      "The NGX All-Share Index showed modest gains today, led by banking and industrial sectors. " +
      "Investors remain cautious ahead of the next CBN MPC meeting, with forex liquidity concerns persisting.";

    let sectorSignals: MarketBrief["sectorSignals"] = [
      { sector: "Banking", signal: "Strong earnings season driving inflows", direction: "in" },
      { sector: "Oil & Gas", signal: "Crude price volatility weighing on sentiment", direction: "out" },
      { sector: "Telecoms", signal: "5G expansion supporting growth outlook", direction: "in" },
      { sector: "Consumer Goods", signal: "Inflation pressure on margins", direction: "neutral" },
    ];

    let macroWatchpoints: string[] = [
      "CBN MPC meeting — interest rate decision expected",
      "OPEC+ production quota review",
      "NGN/USD exchange rate stability",
      "Q1 corporate earnings season",
    ];

    const mastraText = await tryGenerateText(
      "marketBriefAgent",
      `Generate a structured daily Nigerian stock market brief for ${today}. ` +
        `Respond ONLY with valid JSON, no markdown fences. Schema: ` +
        `{ "summary": string (3 sentences), ` +
        `"sectorSignals": [{ "sector": string, "signal": string, "direction": "in"|"out"|"neutral" }] (exactly 4), ` +
        `"macroWatchpoints": string[] (exactly 4) }. ` +
        `Do NOT call any tools.`
    );

    if (mastraText) {
      try {
        const match = mastraText.match(/\{[\s\S]*\}/);
        if (match) {
          const parsed = JSON.parse(match[0]) as Partial<MarketBrief>;
          if (typeof parsed.summary === "string") summary = parsed.summary;
          if (Array.isArray(parsed.sectorSignals)) sectorSignals = parsed.sectorSignals;
          if (Array.isArray(parsed.macroWatchpoints)) macroWatchpoints = parsed.macroWatchpoints;
        }
      } catch {
        /* fall back to defaults above */
      }
    }

    return {
      date: today,
      summary,
      sectorSignals,
      macroWatchpoints,
      disclaimer: AI_DISCLAIMER,
    };
  }
}
