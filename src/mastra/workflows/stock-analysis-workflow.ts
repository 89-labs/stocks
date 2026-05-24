import { createWorkflow, createStep } from "@mastra/core/workflows";
import { z } from "zod";

const fetchStockDataStep = createStep({
  id: "fetch-stock-data",
  inputSchema: z.object({ ticker: z.string() }),
  outputSchema: z.object({ ticker: z.string(), dataReady: z.boolean() }),
  execute: async ({ inputData }) => {
    return { ticker: inputData.ticker.toUpperCase(), dataReady: true };
  },
});

const runAnalysisStep = createStep({
  id: "run-analysis",
  inputSchema: z.object({ ticker: z.string(), dataReady: z.boolean() }),
  outputSchema: z.object({ ticker: z.string(), analysis: z.string() }),
  execute: async ({ inputData, mastra: m }) => {
    if (!m) throw new Error("Mastra runtime not available");
    const agent = m.getAgentById("stockAnalysisAgent");
    const result = await agent.generate(
      `Perform a full analysis of the NGX stock with ticker: ${inputData.ticker}. Use all available tools.`
    );
    return { ticker: inputData.ticker, analysis: result.text };
  },
});

const runPredictionStep = createStep({
  id: "run-prediction",
  inputSchema: z.object({ ticker: z.string(), analysis: z.string() }),
  outputSchema: z.object({
    ticker: z.string(),
    analysis: z.string(),
    prediction: z.string(),
  }),
  execute: async ({ inputData, mastra: m }) => {
    if (!m) throw new Error("Mastra runtime not available");
    const agent = m.getAgentById("predictionAgent");
    const result = await agent.generate(
      `Generate price predictions for NGX stock: ${inputData.ticker}. Return only valid JSON.`
    );
    return {
      ticker: inputData.ticker,
      analysis: inputData.analysis,
      prediction: result.text,
    };
  },
});

export const stockAnalysisWorkflow = createWorkflow({
  id: "stockAnalysisWorkflow",
  inputSchema: z.object({ ticker: z.string() }),
  outputSchema: z.object({
    ticker: z.string(),
    analysis: z.string(),
    prediction: z.string(),
  }),
})
  .then(fetchStockDataStep)
  .then(runAnalysisStep)
  .then(runPredictionStep)
  .commit();
