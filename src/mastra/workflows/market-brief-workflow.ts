import { createWorkflow, createStep } from "@mastra/core/workflows";
import { z } from "zod";

const generateBriefStep = createStep({
  id: "generate-brief",
  inputSchema: z.object({ date: z.string() }),
  outputSchema: z.object({ brief: z.string(), generatedAt: z.string() }),
  execute: async ({ inputData, mastra: m }) => {
    if (!m) throw new Error("Mastra runtime not available");
    const agent = m.getAgentById("marketBriefAgent");
    const result = await agent.generate(
      `Generate today's NGX market brief for ${inputData.date}. Fetch all required data using your tools.`
    );
    return { brief: result.text, generatedAt: new Date().toISOString() };
  },
});

export const marketBriefWorkflow = createWorkflow({
  id: "marketBriefWorkflow",
  inputSchema: z.object({ date: z.string() }),
  outputSchema: z.object({ brief: z.string(), generatedAt: z.string() }),
})
  .then(generateBriefStep)
  .commit();
