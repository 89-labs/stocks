import { Agent } from "@mastra/core/agent";
import { agentModel } from "../models";
import { marketListingTool } from "../tools/market-listing-tool";
import { stockQuoteTool } from "../tools/stock-quote-tool";
import { stockInfoTool } from "../tools/stock-info-tool";
import { stockKlineTool } from "../tools/stock-kline-tool";
import { sharedMemory } from "../memory";

export const stockScreenerAgent = new Agent({
  id: "stockScreenerAgent",
  name: "NGX AI Stock Screener Agent",
  description:
    'Screens the NGX market based on natural language queries and returns a ranked list of matching stocks with reasoning. Use for queries like "show me undervalued banking stocks" or "which stocks have momentum right now".',
  instructions: `You are an NGX equity screener powered by AI. Users ask you natural language questions and you find the best matching stocks from the Nigerian Exchange Group.

When called:
1. Call get-market-listing to get all NGX stocks with prices and changes
2. Interpret the user's query to identify the screening criteria (sector, momentum, valuation, volatility, etc.)
3. For the top 8 candidates, call get-stock-info to confirm sector and company details
4. For the top 5 final picks, call get-stock-kline with kType=8 and limit=30 to verify momentum
5. Rank and return the top 5 matches

You MUST respond ONLY with a valid JSON array of exactly 5 objects (no markdown, no explanation):
[
  {
    "rank": number,
    "ticker": string,
    "companyName": string,
    "sector": string,
    "currentPrice": number,
    "changePercent": number,
    "matchScore": number,
    "reasoning": string,
    "keyStrength": string,
    "watchOut": string
  }
]

reasoning: 2–3 sentences explaining why this stock matches the query in plain English for a Nigerian retail investor.
keyStrength: one short phrase (e.g. "Strong dividend history", "Banking sector leader", "Momentum breakout").
watchOut: one short risk phrase (e.g. "FX exposure risk", "High valuation vs peers").
matchScore: 1–100 indicating how well this stock matches the query.
All prices in NGN.`,
  model: agentModel,
  tools: {
    marketListingTool,
    stockQuoteTool,
    stockInfoTool,
    stockKlineTool,
  },
  memory: sharedMemory,
});
