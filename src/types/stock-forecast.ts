export interface HistoryChartPoint {
  date: string;
  close: number;
}

export interface ForecastScenario {
  price: number;
  return: number;
}

export interface ForecastChartPoint {
  label: string;
  date: string;
  bear: number;
  base: number;
  bull: number;
}

export interface StockHistoricalSummary {
  periodYears: number;
  barCount: number;
  startDate: string;
  endDate: string;
  startPrice: number;
  endPrice: number;
  totalReturn: number;
  annualizedReturn: number;
  volatility: number;
  periodHigh: number;
  periodLow: number;
  trend: "uptrend" | "downtrend" | "sideways";
}

export interface StockGrowthForecast {
  ticker: string;
  companyName: string;
  currentPrice: number;
  generatedAt: string;
  targetDate: string;
  historicalSummary: StockHistoricalSummary;
  historyChart: HistoryChartPoint[];
  forecast: {
    horizonDays: number;
    expectedPrice: number;
    bear: ForecastScenario;
    base: ForecastScenario;
    bull: ForecastScenario;
    confidence: "low" | "medium" | "high";
    momentumSignal: "bullish" | "neutral" | "bearish";
  };
  forecastChart: ForecastChartPoint[];
  keyDrivers: string[];
  newsSentiment: {
    label: "bullish" | "neutral" | "bearish";
    summary: string;
  };
  marketSpeculation: string[];
  reasoning: string;
  riskFactors: string[];
  volatilityNote: string;
  disclaimer: string;
}

export interface StockResearch {
  ticker: string;
  companyName: string;
  generatedAt: string;
  analysis: string;
  forecast: StockGrowthForecast;
}
