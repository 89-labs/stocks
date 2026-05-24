import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { getStockKline } from "@/lib/data/stock-data-service";

export const stockKlineTool = createTool({
  id: "get-stock-kline",
  description:
    "Get historical OHLCV (candlestick) price data for an NGX stock. Use kType 8 for daily bars. Returns an array of price bars for trend, volatility, and momentum analysis.",
  inputSchema: z.object({
    ticker: z.string().describe("NGX ticker symbol"),
    kType: z
      .number()
      .describe(
        "Bar type: 8=daily, 9=weekly, 5=1hour. Use 8 for most analysis."
      ),
    limit: z
      .number()
      .describe(
        "Number of bars to return. Use 60 for 3-month, 252 for 1-year, 1260 for ~5-year analysis."
      ),
  }),
  outputSchema: z.object({
    bars: z.array(
      z.object({
        timestamp: z.number(),
        open: z.number(),
        high: z.number(),
        low: z.number(),
        close: z.number(),
        volume: z.number(),
      })
    ),
  }),
  execute: async (inputData) => {
    const bars = await getStockKline(
      inputData.ticker,
      inputData.kType,
      inputData.limit
    );
    return {
      bars: bars.map((b) => ({
        timestamp: b.timestamp,
        open: b.open,
        high: b.high,
        low: b.low,
        close: b.close,
        volume: b.volume,
      })),
    };
  },
});
