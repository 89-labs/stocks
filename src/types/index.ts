export type Sector =
  | "Banking"
  | "Oil & Gas"
  | "Consumer Goods"
  | "Industrial"
  | "Telecoms"
  | "Agriculture"
  | "Insurance"
  | "Healthcare";

export interface Stock {
  ticker: string;
  name: string;
  sector: Sector;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  marketCap: number;
  high52w: number;
  low52w: number;
  peRatio?: number;
  eps?: number;
  dividendYield?: number;
  /** True when price is from reference data, not a live NGX feed */
  stale?: boolean;
}

export interface Quote {
  ticker: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  high: number;
  low: number;
  open: number;
  previousClose: number;
  timestamp: string;
  stale?: boolean;
}

export interface OHLCV {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface MarketSummary {
  allShareIndex: number;
  allShareChange: number;
  allShareChangePercent: number;
  marketCap: number;
  totalVolume: number;
  advancers: number;
  decliners: number;
  unchanged: number;
  stale?: boolean;
}

export interface EconomicIndicator {
  label: string;
  value: string;
  change?: string;
  trend?: "up" | "down" | "neutral";
}

export interface NewsArticle {
  id: string;
  title: string;
  summary: string;
  url: string;
  source: string;
  publishedAt: string;
  sentiment: "bullish" | "bearish" | "neutral";
  sentimentScore: number;
  tickers?: string[];
  segment?: string;
}

export interface AIPrediction {
  ticker: string;
  currentPrice: number;
  predictions: {
    days: 7 | 30 | 90;
    price: number;
    low: number;
    high: number;
    confidence: number;
  }[];
  reasoning: string;
  disclaimer: string;
}

export interface SimulationProjectionPoint {
  label: string;
  date?: string;
  bear: number;
  base: number;
  bull: number;
  invested: number;
}

export interface SimulationResult {
  ticker: string;
  amount: number;
  shares: number;
  pricePerShare: number;
  fees: {
    secLevy: number;
    nseFee: number;
    brokerCommission: number;
    total: number;
  };
  scenarios: {
    label: "bear" | "base" | "bull";
    projectedPrice: number;
    projectedValue: number;
    gainLoss: number;
    gainLossPercent: number;
  }[];
  /** Portfolio value over time from AI forecast (Now → 12M) */
  projectionChart: SimulationProjectionPoint[];
  narrative?: string;
  analysisSummary?: string;
  forecastConfidence?: "low" | "medium" | "high";
  newsSentiment?: "bullish" | "neutral" | "bearish";
  expectedGainBase?: number;
  expectedGainBasePercent?: number;
  analysisDate?: string;
  fromAiAnalysis?: boolean;
}

export interface BrokerLink {
  name: string;
  url: string;
  description: string;
}

export interface MarketBrief {
  date: string;
  summary: string;
  sectorSignals: { sector: string; signal: string; direction: "in" | "out" | "neutral" }[];
  macroWatchpoints: string[];
  disclaimer: string;
}

export type Timeframe = "1D" | "1W" | "1M" | "3M" | "1Y" | "5Y";
