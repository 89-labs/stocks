export interface StockQuote {
  symbol: string;
  latestPrice: number;
  open: number;
  previousClose: number;
  high: number;
  low: number;
  volume: number;
  turnover: number;
  change: number;
  changePercent: number;
  timestamp: number;
  tradingStatus: 0 | 1 | 2 | 3;
  stale?: boolean;
}

export interface KlineBar {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  turnover: number;
}

export interface StockListItem {
  code: string;
  name: string;
  exchange: string;
  region: string;
}

export interface StockInfo {
  code: string;
  name: string;
  sector?: string;
  exchange?: string;
  listingDate?: string;
}

export interface MarketHoliday {
  date: string;
  name: string;
}

export class ITickError extends Error {
  constructor(
    public code: number,
    public msg: string
  ) {
    super(`iTick error ${code}: ${msg}`);
    this.name = "ITickError";
  }
}
