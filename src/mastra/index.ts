import { Mastra } from "@mastra/core";
import { mastraStorage, sharedMemory } from "./memory";
import { stockAnalysisAgent } from "./agents/stock-analysis-agent";
import { marketBriefAgent } from "./agents/market-brief-agent";
import { stockScreenerAgent } from "./agents/stock-screener-agent";
import { predictionAgent } from "./agents/prediction-agent";
import { stockAnalysisWorkflow } from "./workflows/stock-analysis-workflow";
import { marketBriefWorkflow } from "./workflows/market-brief-workflow";
import { screeningWorkflow } from "./workflows/screening-workflow";

export { sharedMemory };

/**
 * The single Mastra runtime for the NaijaStocks app.
 * Server-only — never import this module from a "use client" file.
 * Agents are registered here so workflows and API routes can resolve them
 * by id (e.g. `mastra.getAgentById("stockAnalysisAgent")`).
 */
export const mastra = new Mastra({
  storage: mastraStorage,
  agents: {
    stockAnalysisAgent,
    marketBriefAgent,
    stockScreenerAgent,
    predictionAgent,
  },
  workflows: {
    stockAnalysisWorkflow,
    marketBriefWorkflow,
    screeningWorkflow,
  },
});
