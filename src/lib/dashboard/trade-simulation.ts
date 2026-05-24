import { getCachedStockResearch } from "@/lib/dashboard/stock-forecast";
import type { SimulationResult } from "@/types";

function calcFees(amount: number) {
  const secLevy = amount * 0.003;
  const nseFee = amount * 0.003;
  const brokerCommission = amount * 0.014;
  const total = secLevy + nseFee + brokerCommission;
  return { secLevy, nseFee, brokerCommission, total };
}

function buildNarrative(
  companyName: string,
  ticker: string,
  amount: number,
  shares: number,
  currentPrice: number,
  forecastReasoning: string,
  keyDrivers: string[]
): string {
  const drivers =
    keyDrivers.length > 0
      ? ` Key drivers: ${keyDrivers.slice(0, 2).join("; ")}.`
      : "";
  return (
    `Simulating ₦${amount.toLocaleString()} in ${companyName} (${ticker}) buys ~${shares} shares ` +
    `at ₦${currentPrice.toFixed(2)} after NGX fees. Projections use today's shared AI analysis ` +
    `(5-year history + 12-month bear/base/bull forecast).${drivers} ${forecastReasoning}`
  );
}

export async function simulateTradeWithForecast(
  ticker: string,
  amount: number,
  currentPrice: number,
  companyName: string
): Promise<SimulationResult> {
  const normalized = ticker.toUpperCase();
  const fees = calcFees(amount);
  const netAmount = amount - fees.total;
  const shares = Math.floor(netAmount / currentPrice);
  const actualSpent = shares * currentPrice;

  const research = await getCachedStockResearch(normalized);
  const forecast = research?.forecast;

  if (!forecast || shares <= 0) {
    return fallbackSimulation(normalized, amount, currentPrice, companyName, shares, fees);
  }

  const portfolioNow = shares * currentPrice;

  const projectionChart: SimulationResult["projectionChart"] = [
    {
      label: "Now",
      date: new Date().toISOString().slice(0, 10),
      bear: portfolioNow,
      base: portfolioNow,
      bull: portfolioNow,
      invested: amount,
    },
    ...forecast.forecastChart.map((point) => ({
      label: point.label,
      date: point.date,
      bear: Math.round(shares * point.bear * 100) / 100,
      base: Math.round(shares * point.base * 100) / 100,
      bull: Math.round(shares * point.bull * 100) / 100,
      invested: amount,
    })),
  ];

  const scenarioDefs = [
    { label: "bear" as const, price: forecast.forecast.bear.price },
    { label: "base" as const, price: forecast.forecast.base.price },
    { label: "bull" as const, price: forecast.forecast.bull.price },
  ];

  const scenarios: SimulationResult["scenarios"] = scenarioDefs.map(({ label, price }) => {
    const projectedValue = Math.round(shares * price * 100) / 100;
    const gainLoss = projectedValue - actualSpent - fees.total;
    return {
      label,
      projectedPrice: price,
      projectedValue,
      gainLoss: Math.round(gainLoss * 100) / 100,
      gainLossPercent: Math.round((gainLoss / amount) * 1000) / 10,
    };
  });

  const baseScenario = scenarios.find((s) => s.label === "base")!;

  return {
    ticker: normalized,
    amount,
    shares,
    pricePerShare: currentPrice,
    fees,
    scenarios,
    projectionChart,
    narrative: buildNarrative(
      companyName,
      normalized,
      amount,
      shares,
      currentPrice,
      forecast.reasoning,
      forecast.keyDrivers
    ),
    analysisSummary: forecast.reasoning,
    forecastConfidence: forecast.forecast.confidence,
    newsSentiment: forecast.newsSentiment.label,
    expectedGainBase: baseScenario.gainLoss,
    expectedGainBasePercent: baseScenario.gainLossPercent,
    analysisDate: research?.analysisDate,
    fromAiAnalysis: true,
  };
}

function fallbackSimulation(
  ticker: string,
  amount: number,
  currentPrice: number,
  companyName: string,
  shares: number,
  fees: SimulationResult["fees"]
): SimulationResult {
  const actualSpent = shares * currentPrice;
  const vol = 0.08;
  const scenarioDefs = [
    { label: "bear" as const, mult: 1 - vol },
    { label: "base" as const, mult: 1 },
    { label: "bull" as const, mult: 1 + vol },
  ];

  const scenarios = scenarioDefs.map(({ label, mult }) => {
    const projectedPrice = Math.round(currentPrice * mult * 100) / 100;
    const projectedValue = Math.round(shares * projectedPrice * 100) / 100;
    const gainLoss = projectedValue - actualSpent - fees.total;
    return {
      label,
      projectedPrice,
      projectedValue,
      gainLoss: Math.round(gainLoss * 100) / 100,
      gainLossPercent: Math.round((gainLoss / amount) * 1000) / 10,
    };
  });

  const portfolioNow = shares * currentPrice;

  return {
    ticker,
    amount,
    shares,
    pricePerShare: currentPrice,
    fees,
    scenarios,
    projectionChart: [
      {
        label: "Now",
        bear: portfolioNow,
        base: portfolioNow,
        bull: portfolioNow,
        invested: amount,
      },
      {
        label: "12M",
        bear: scenarios[0].projectedValue,
        base: scenarios[1].projectedValue,
        bull: scenarios[2].projectedValue,
        invested: amount,
      },
    ],
    narrative: `Simulating ₦${amount.toLocaleString()} in ${companyName} (${ticker}). AI forecast unavailable — using simplified scenarios.`,
    fromAiAnalysis: false,
  };
}
