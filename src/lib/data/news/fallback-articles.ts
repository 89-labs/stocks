import type { NewsArticle } from "@/types";

/** Curated headlines used only when RSS feeds return fewer than the target count */
export const FALLBACK_NEWS: NewsArticle[] = [
  {
    id: "fallback-ngx-rally",
    title: "NGX All-Share Index gains as banking stocks lead rally",
    summary:
      "The Nigerian Exchange closed higher on strong buying interest in banking and industrial counters. GTCO and Zenith Bank were among the top gainers.",
    url: "https://businessday.ng",
    source: "BusinessDay",
    publishedAt: new Date().toISOString(),
    sentiment: "bullish",
    sentimentScore: 1.5,
    segment: "Markets",
    tickers: ["GTCO", "ZENITHBANK"],
  },
  {
    id: "fallback-cbn-mpr",
    title: "CBN holds MPR steady amid inflation and FX management focus",
    summary:
      "The Central Bank of Nigeria kept its benchmark rate unchanged at the latest MPC meeting. Markets are watching liquidity and naira stability.",
    url: "https://nairametrics.com",
    source: "Nairametrics",
    publishedAt: new Date(Date.now() - 3_600_000).toISOString(),
    sentiment: "neutral",
    sentimentScore: -0.3,
    segment: "Economy",
  },
  {
    id: "fallback-dangcem",
    title: "Dangote Cement reports earnings momentum, board reviews dividend",
    summary:
      "Dangote Cement Plc highlighted volume growth across key markets. Investors are focused on margin trends and cash returns.",
    url: "https://guardian.ng",
    source: "The Guardian Nigeria",
    publishedAt: new Date(Date.now() - 7_200_000).toISOString(),
    sentiment: "bullish",
    sentimentScore: 2,
    segment: "Corporate",
    tickers: ["DANGCEM"],
  },
  {
    id: "fallback-mtn",
    title: "MTN Nigeria expands network coverage as data revenue grows",
    summary:
      "MTN Nigeria Communications outlined capex plans for 5G and fibre. Analysts expect ARPU trends to remain central to the equity story.",
    url: "https://nairametrics.com",
    source: "Nairametrics",
    publishedAt: new Date(Date.now() - 10_800_000).toISOString(),
    sentiment: "bullish",
    sentimentScore: 1.2,
    segment: "Corporate",
    tickers: ["MTNN"],
  },
  {
    id: "fallback-oil",
    title: "Oil price volatility keeps Nigerian energy stocks in focus",
    summary:
      "Crude movements and OPEC+ guidance remain key drivers for Seplat, Ardova, and other NGX-listed energy names.",
    url: "https://businessday.ng",
    source: "BusinessDay",
    publishedAt: new Date(Date.now() - 14_400_000).toISOString(),
    sentiment: "bearish",
    sentimentScore: -1,
    segment: "Commodities",
    tickers: ["SEPLAT", "ARDOVA"],
  },
];
