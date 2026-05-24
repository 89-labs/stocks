import { groq } from "@ai-sdk/groq";

/** Default LLM for all NGX Mastra agents (tool-calling + structured JSON). */
export const agentModel = groq("llama-3.3-70b-versatile");
