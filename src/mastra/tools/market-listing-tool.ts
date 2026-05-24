import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { StockDataService } from "@/lib/data/stock-data-service";

export const marketListingTool = createTool({
  id: "get-market-listing",
  description:
    "Get the full list of all NGX-listed stocks with their current prices and percentage changes. Use this for market-wide screening, sector rotation analysis, and finding gainers or losers.",
  inputSchema: z.object({}),
  outputSchema: z.object({
    stocks: z.array(
      z.object({
        code: z.string(),
        name: z.string(),
        latestPrice: z.number(),
        changePercent: z.number(),
        volume: z.number(),
        sector: z.string().optional(),
      })
    ),
  }),
  execute: async () => {
    const stocks = await StockDataService.getAllStocks();
    return {
      stocks: stocks.map((s) => ({
        code: s.ticker,
        name: s.name,
        latestPrice: s.price,
        changePercent: s.changePercent,
        volume: s.volume,
        sector: s.sector,
      })),
    };
  },
});
