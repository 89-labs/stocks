import type { StockGrowthForecast } from "@/types/stock-forecast";

/** Match individual AI analysis chart — last 52 weekly history points. */
export const FORECAST_CHART_HISTORY_WEEKS = 52;

export interface ForecastChartPoint {
  label: string;
  close?: number;
  base?: number;
  bear?: number;
  bull?: number;
  scenarioRange?: [number, number];
}

/**
 * Single source of truth for AI forecast chart series (individual + dashboard).
 * Same structure as the stock detail AI Prediction tab chart.
 */
export function buildForecastChartData(
  forecast: StockGrowthForecast
): ForecastChartPoint[] {
  const history = forecast.historyChart.map((p) => ({
    label: p.date.slice(2, 7),
    close: p.close,
  }));

  const bridge: ForecastChartPoint = {
    label: "Now",
    close: forecast.currentPrice,
    base: forecast.currentPrice,
    bear: forecast.currentPrice,
    bull: forecast.currentPrice,
    scenarioRange: [forecast.currentPrice, forecast.currentPrice],
  };

  const future: ForecastChartPoint[] = forecast.forecastChart.map((p) => ({
    label: p.label,
    bear: p.bear,
    base: p.base,
    bull: p.bull,
    scenarioRange: [p.bear, p.bull],
  }));

  return [...history.slice(-FORECAST_CHART_HISTORY_WEEKS), bridge, ...future];
}

/** Index values to 100 = today's price (for multi-stock comparison on one axis). */
export function indexForecastChartData(
  forecast: StockGrowthForecast
): ForecastChartPoint[] {
  const cp = forecast.currentPrice;
  if (cp <= 0) return buildForecastChartData(forecast);

  const scale = (price: number) => Math.round((price / cp) * 1000) / 10;

  return buildForecastChartData(forecast).map((p) => ({
    label: p.label,
    close: p.close != null ? scale(p.close) : undefined,
    base: p.base != null ? scale(p.base) : undefined,
    bear: p.bear != null ? scale(p.bear) : undefined,
    bull: p.bull != null ? scale(p.bull) : undefined,
    scenarioRange: p.scenarioRange
      ? ([scale(p.scenarioRange[0]), scale(p.scenarioRange[1])] as [number, number])
      : undefined,
  }));
}

export function forecastSummaryStats(forecast: StockGrowthForecast) {
  const { historicalSummary, forecast: f } = forecast;
  return {
    currentPrice: forecast.currentPrice,
    targetPrice12M: f.base.price,
    forecastReturnPct: Math.round(f.base.return * 1000) / 10,
    annualizedReturn5YPct: Math.round(historicalSummary.annualizedReturn * 1000) / 10,
    trend: historicalSummary.trend,
    volatilityPct: Math.round(historicalSummary.volatility * 1000) / 10,
    confidence: f.confidence,
  };
}
