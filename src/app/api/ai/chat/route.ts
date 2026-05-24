import { handleChatStream } from "@mastra/ai-sdk";
import { createUIMessageStreamResponse } from "ai";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth";
import { mastra } from "@/mastra";

export const maxDuration = 60;

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  const params = await req.json().catch(() => ({}));
  const principal = session?.user?.email ?? session?.user?.id ?? "guest";

  const stream = await handleChatStream({
    mastra,
    agentId: "stockAnalysisAgent",
    version: "v6",
    params: {
      ...params,
      memory: {
        ...(params?.memory ?? {}),
        thread: `chat-${principal}`,
        resource: principal,
      },
    },
  });

  return createUIMessageStreamResponse({ stream });
}
