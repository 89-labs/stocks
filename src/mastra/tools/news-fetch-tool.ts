import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { NewsService } from "@/lib/data/news-service";

export const newsFetchTool = createTool({
  id: "get-market-news",
  description:
    "Fetch the latest Nigerian financial market news from BusinessDay, Nairametrics, Vanguard, and other Nigerian outlets. Optionally filter by a stock ticker or keyword.",
  inputSchema: z.object({
    keyword: z
      .string()
      .optional()
      .describe(
        "Optional stock ticker or keyword to filter news e.g. DANGCEM or CBN"
      ),
    limit: z
      .number()
      .optional()
      .describe("Max number of articles to return, default 10"),
  }),
  outputSchema: z.object({
    articles: z.array(
      z.object({
        headline: z.string(),
        source: z.string(),
        publishedAt: z.string(),
        summary: z.string().optional(),
        sentiment: z.string().optional(),
      })
    ),
  }),
  execute: async (inputData) => {
    const limit = inputData.limit ?? 10;
    const keyword = inputData.keyword?.trim();

    const articles = keyword
      ? await NewsService.getNewsForTicker(keyword)
      : await NewsService.fetchAllNews();

    const filtered = keyword
      ? articles.length > 0
        ? articles
        : (await NewsService.fetchAllNews()).filter((a) => {
            const needle = keyword.toLowerCase();
            return (
              a.title.toLowerCase().includes(needle) ||
              a.summary.toLowerCase().includes(needle)
            );
          })
      : articles;

    return {
      articles: filtered.slice(0, limit).map((a) => ({
        headline: a.title,
        source: a.source,
        publishedAt: a.publishedAt,
        summary: a.summary,
        sentiment: a.sentiment,
      })),
    };
  },
});
