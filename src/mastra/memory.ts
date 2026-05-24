import { Memory } from "@mastra/memory";
import { LibSQLStore } from "@mastra/libsql";

const MASTRA_DB_URL = process.env.MASTRA_DB_URL ?? "file:./mastra.db";

/**
 * Single libSQL store shared across the Mastra instance and per-agent memory.
 * Defined in its own module so agent files can import the memory without
 * pulling in `src/mastra/index.ts` (which registers the agents themselves and
 * would otherwise create a circular import).
 */
export const mastraStorage = new LibSQLStore({
  id: "naijastocks-storage",
  url: MASTRA_DB_URL,
  ...(process.env.MASTRA_DB_AUTH_TOKEN
    ? { authToken: process.env.MASTRA_DB_AUTH_TOKEN }
    : {}),
});

export const sharedMemory = new Memory({
  storage: mastraStorage,
  options: {
    lastMessages: 20,
    semanticRecall: false,
  },
});
