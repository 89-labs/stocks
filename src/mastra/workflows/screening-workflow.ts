import { createWorkflow, createStep } from "@mastra/core/workflows";
import { z } from "zod";

const screenStep = createStep({
  id: "screen-stocks",
  inputSchema: z.object({ query: z.string(), userId: z.string() }),
  outputSchema: z.object({ results: z.string(), query: z.string() }),
  execute: async ({ inputData, mastra: m }) => {
    if (!m) throw new Error("Mastra runtime not available");
    const agent = m.getAgentById("stockScreenerAgent");
    const result = await agent.generate(
      `Screen the NGX market for: "${inputData.query}". Return top 5 matching stocks as JSON.`,
      {
        memory: {
          thread: `screener-${inputData.userId}`,
          resource: inputData.userId,
        },
      }
    );
    return { results: result.text, query: inputData.query };
  },
});

export const screeningWorkflow = createWorkflow({
  id: "screeningWorkflow",
  inputSchema: z.object({ query: z.string(), userId: z.string() }),
  outputSchema: z.object({ results: z.string(), query: z.string() }),
})
  .then(screenStep)
  .commit();
