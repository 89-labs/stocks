"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";

/**
 * Streaming hook for the per-stock AI analysis panel.
 * Wraps Vercel AI SDK `useChat` against the Mastra-backed
 * `/api/ai/analyse/[ticker]` route handler.
 */
export function useStockAnalysis(ticker: string) {
  return useChat({
    transport: new DefaultChatTransport({
      api: `/api/ai/analyse/${encodeURIComponent(ticker)}`,
    }),
  });
}

/**
 * Streaming hook for the general AI market chat panel on the dashboard.
 * Threads are namespaced server-side per signed-in user.
 */
export function useMarketChat() {
  return useChat({
    transport: new DefaultChatTransport({
      api: "/api/ai/chat",
    }),
  });
}
