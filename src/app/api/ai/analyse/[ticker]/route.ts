import { handleChatStream } from "@mastra/ai-sdk";
import { createUIMessageStreamResponse } from "ai";
import { mastra } from "@/mastra";

export const maxDuration = 60;

export async function POST(
  req: Request,
  { params }: { params: Promise<{ ticker: string }> }
) {
  const { ticker } = await params;
  const normalizedTicker = ticker.toUpperCase();
  const body = await req.json().catch(() => ({}));

  const stream = await handleChatStream({
    mastra,
    agentId: "stockAnalysisAgent",
    version: "v6",
    params: {
      ...body,
      messages: [
        ...((body?.messages as unknown[] | undefined) ?? []),
        {
          id: `analyse-${normalizedTicker}-${Date.now()}`,
          role: "user" as const,
          parts: [
            {
              type: "text" as const,
              text: `Perform a full analysis of NGX stock: ${normalizedTicker}. Use all available tools.`,
            },
          ],
        },
      ],
    },
  });

  return createUIMessageStreamResponse({ stream });
}
