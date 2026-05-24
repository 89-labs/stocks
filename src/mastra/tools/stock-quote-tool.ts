import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { getStockQuote } from "@/lib/data/stock-data-service";

export const stockQuoteTool = createTool({
  id: "get-stock-quote",
  description:
    "Get the latest real-time price quote for a single NGX-listed stock by its ticker symbol. Returns current price in NGN, percentage change, volume, day range, and trading status.",
  inputSchema: z.object({
    ticker: z
      .string()
      .describe("NGX ticker symbol e.g. DANGCEM, GTCO, AIRTELAFRI"),
  }),
  outputSchema: z.object({
    symbol: z.string(),
    latestPrice: z.number(),
    change: z.number(),
    changePercent: z.number(),
    volume: z.number(),
    high: z.number(),
    low: z.number(),
    open: z.number(),
    previousClose: z.number(),
    tradingStatus: z.number(),
  }),
  execute: async (inputData) => {
    const q = await getStockQuote(inputData.ticker);
    return {
      symbol: q.symbol,
      latestPrice: q.latestPrice,
      change: q.change,
      changePercent: q.changePercent,
      volume: q.volume,
      high: q.high,
      low: q.low,
      open: q.open,
      previousClose: q.previousClose,
      tradingStatus: q.tradingStatus,
    };
  },
});
