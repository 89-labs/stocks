"use client";

import { useEffect, useRef } from "react";
import { useStockAnalysis } from "@/hooks/use-stock-analysis";
import { Skeleton } from "@/components/ui/skeleton";
import { DashboardCard, PanelHeader } from "@/components/dashboard/dashboard-ui";

interface UIMessageTextPart {
  type: "text";
  text: string;
}

function isTextPart(part: unknown): part is UIMessageTextPart {
  return (
    typeof part === "object" &&
    part !== null &&
    (part as { type?: unknown }).type === "text" &&
    typeof (part as { text?: unknown }).text === "string"
  );
}

export function StockAnalysisPanel({ ticker }: { ticker: string }) {
  const { messages, sendMessage, status } = useStockAnalysis(ticker);
  const sentForTicker = useRef<string | null>(null);

  useEffect(() => {
    if (sentForTicker.current === ticker) return;
    sentForTicker.current = ticker;
    void sendMessage({ text: `Analyse ${ticker}` });
  }, [ticker, sendMessage]);

  const analysisMessage = messages.find((m) => m.role === "assistant");
  const analysisText = analysisMessage?.parts
    .filter(isTextPart)
    .map((p) => p.text)
    .join("");

  const isStreaming = status === "streaming" || status === "submitted";

  return (
    <DashboardCard>
      <PanelHeader
        title={`Mastra AI analysis · ${ticker}`}
        description="Agentic analysis from the NGX stock analysis agent. Streamed live via Groq and Mastra."
      />
      {isStreaming && !analysisText ? (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-4 w-full animate-pulse" />
          ))}
        </div>
      ) : (
        <article className="prose prose-sm max-w-none whitespace-pre-wrap rounded-2xl bg-slate-50 p-5 text-sm leading-7 text-slate-700 dark:prose-invert dark:bg-slate-950/50 dark:text-slate-200">
          {analysisText || "No analysis available yet."}
        </article>
      )}
    </DashboardCard>
  );
}
