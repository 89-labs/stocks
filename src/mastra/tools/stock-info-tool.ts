import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { getStockInfo } from "@/lib/data/stock-data-service";

export const stockInfoTool = createTool({
  id: "get-stock-info",
  description:
    "Get company metadata for an NGX stock: full company name, sector, and exchange. Call this before analysis to understand what sector the company operates in.",
  inputSchema: z.object({
    ticker: z.string().describe("NGX ticker symbol"),
  }),
  outputSchema: z.object({
    code: z.string(),
    name: z.string(),
    sector: z.string().optional(),
    exchange: z.string().optional(),
  }),
  execute: async (inputData) => {
    const info = await getStockInfo(inputData.ticker);
    return {
      code: info.code,
      name: info.name,
      sector: info.sector,
      exchange: info.exchange,
    };
  },
});
