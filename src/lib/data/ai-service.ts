import Anthropic from "@anthropic-ai/sdk";
import type { AIPrediction, MarketBrief, SimulationResult } from "@/types";
import { AI_DISCLAIMER } from "@/lib/utils";
import { StockDataService } from "./stock-data-service";

function getAnthropicClient(): Anthropic | null {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;
  return new Anthropic({ apiKey });
}

function linearRegressionForecast(
  prices: number[],
  daysAhead: number
): { price: number; low: number; high: number; confidence: number } {
  const n = prices.length;
  if (n < 2) {
    const last = prices[0] || 100;
    return { price: last, low: last * 0.95, high: last * 1.05, confidence: 0.3 };
  }

  let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
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

    let reasoning = `${companyName} (${ticker}) is currently trading at ₦${currentPrice.toFixed(2)}. Based on recent price trends and linear regression analysis, the model suggests `;

    const direction30 = pred30.price > currentPrice ? "upward" : "downward";
    reasoning += `a ${direction30} trajectory over the next 30 days, with a base case target of ₦${pred30.price.toFixed(2)}. `;
    reasoning += `Key factors include sector performance, CBN monetary policy, and NGN/USD exchange rate movements. `;
    reasoning += `Confidence is ${(pred30.confidence * 100).toFixed(0)}% based on historical volatility.`;

    const client = getAnthropicClient();
    if (client) {
      try {
        const response = await client.messages.create({
          model: "claude-sonnet-4-20250514",
          max_tokens: 300,
          messages: [
            {
              role: "user",
              content: `Provide a 2-3 sentence plain-English stock analysis for ${companyName} (${ticker}) currently at ₦${currentPrice}. 30-day forecast: ₦${pred30.price}. Focus on Nigerian market context. Be concise.`,
            },
          ],
        });
        const text = response.content[0];
        if (text.type === "text") reasoning = text.text;
      } catch {
        // Use fallback reasoning
      }
    }

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
    const secLevy = amount * 0.003;
    const nseFee = amount * 0.003;
    const brokerCommission = amount * 0.014;
    const totalFees = secLevy + nseFee + brokerCommission;
    const netAmount = amount - totalFees;
    const shares = Math.floor(netAmount / currentPrice);
    const actualSpent = shares * currentPrice;

    const ohlcv = await StockDataService.getOHLCV(ticker, 30);
    const prices =
      ohlcv.length > 1 ? ohlcv.map((d) => d.close) : [currentPrice * 0.97, currentPrice];
    const pred = linearRegressionForecast(prices, 30);
    const volatility = currentPrice
      ? (Math.max(...prices) - Math.min(...prices)) / currentPrice
      : 0.05;

    const scenarios: SimulationResult["scenarios"] = [
      {
        label: "bear",
        projectedPrice: Math.round(currentPrice * (1 - volatility) * 100) / 100,
        projectedValue: 0,
        gainLoss: 0,
        gainLossPercent: 0,
      },
      {
        label: "base",
        projectedPrice: pred.price,
        projectedValue: 0,
        gainLoss: 0,
        gainLossPercent: 0,
      },
      {
        label: "bull",
        projectedPrice: Math.round(currentPrice * (1 + volatility) * 100) / 100,
        projectedValue: 0,
        gainLoss: 0,
        gainLossPercent: 0,
      },
    ];

    for (const s of scenarios) {
      s.projectedValue = shares * s.projectedPrice;
      s.gainLoss = s.projectedValue - actualSpent - totalFees;
      s.gainLossPercent = (s.gainLoss / amount) * 100;
    }

    let narrative = `If you invest ₦${amount.toLocaleString()} in ${companyName}, you'd purchase approximately ${shares} shares at ₦${currentPrice.toFixed(2)} each after fees.`;

    const client = getAnthropicClient();
    if (client) {
      try {
        const response = await client.messages.create({
          model: "claude-sonnet-4-20250514",
          max_tokens: 200,
          messages: [
            {
              role: "user",
              content: `Write 2 sentences about simulating a ₦${amount} investment in ${ticker} (${companyName}) at ₦${currentPrice}/share, buying ${shares} shares. Mention Nigerian broker fees. Educational only.`,
            },
          ],
        });
        const text = response.content[0];
        if (text.type === "text") narrative = text.text;
      } catch {
        // Use fallback
      }
    }

    return {
      ticker,
      amount,
      shares,
      pricePerShare: currentPrice,
      fees: { secLevy, nseFee, brokerCommission, total: totalFees },
      scenarios,
      narrative,
    };
  }

  static async generateMarketBrief(): Promise<MarketBrief> {
    const today = new Date().toISOString().split("T")[0];

    let summary =
      "The NGX All-Share Index showed modest gains today, led by banking and industrial sectors. " +
      "Investors remain cautious ahead of the next CBN MPC meeting, with forex liquidity concerns persisting.";

    let sectorSignals = [
      { sector: "Banking", signal: "Strong earnings season driving inflows", direction: "in" as const },
      { sector: "Oil & Gas", signal: "Crude price volatility weighing on sentiment", direction: "out" as const },
      { sector: "Telecoms", signal: "5G expansion supporting growth outlook", direction: "in" as const },
      { sector: "Consumer Goods", signal: "Inflation pressure on margins", direction: "neutral" as const },
    ];

    let macroWatchpoints = [
      "CBN MPC meeting — interest rate decision expected",
      "OPEC+ production quota review",
      "NGN/USD exchange rate stability",
      "Q1 corporate earnings season",
    ];

    const client = getAnthropicClient();
    if (client) {
      try {
        const response = await client.messages.create({
          model: "claude-sonnet-4-20250514",
          max_tokens: 600,
          messages: [
            {
              role: "user",
              content: `Generate a daily Nigerian stock market brief for ${today}. Include: 1) A 3-sentence market summary, 2) 4 sector rotation signals (sector, signal, direction: in/out/neutral), 3) 4 macro watchpoints for Nigeria. Return as JSON with keys: summary, sectorSignals (array of {sector, signal, direction}), macroWatchpoints (array of strings).`,
            },
          ],
        });
        const text = response.content[0];
        if (text.type === "text") {
          const jsonMatch = text.text.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            summary = parsed.summary || summary;
            if (parsed.sectorSignals) sectorSignals = parsed.sectorSignals;
            if (parsed.macroWatchpoints) macroWatchpoints = parsed.macroWatchpoints;
          }
        }
      } catch {
        // Use fallback
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

  static async summariseArticle(title: string, content: string): Promise<string> {
    const client = getAnthropicClient();
    if (!client) return content.slice(0, 200) + "...";

    try {
      const response = await client.messages.create({
        model: "claude-sonnet-4-20250514",
        max_tokens: 100,
        messages: [
          {
            role: "user",
            content: `Summarise this Nigerian financial news article in exactly 2 sentences:\n\nTitle: ${title}\n\n${content.slice(0, 1000)}`,
          },
        ],
      });
      const text = response.content[0];
      if (text.type === "text") return text.text;
    } catch {
      // Fallback
    }
    return content.slice(0, 200) + "...";
  }
}
