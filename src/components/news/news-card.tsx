import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SentimentBadge } from "./sentiment-badge";
import type { NewsArticle } from "@/types";

interface NewsCardProps {
  article: NewsArticle;
}

export function NewsCard({ article }: NewsCardProps) {
  return (
    <Card className="transition-shadow hover:shadow-md">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-primary">{article.source}</span>
              <SentimentBadge sentiment={article.sentiment} />
              {article.segment && (
                <span className="text-xs text-neutral-secondary">{article.segment}</span>
              )}
            </div>
            <h3 className="mt-2 font-semibold text-neutral-heading line-clamp-2">
              {article.url.startsWith("http") ? (
                <a href={article.url} target="_blank" rel="noopener noreferrer" className="hover:text-primary">
                  {article.title}
                </a>
              ) : (
                article.title
              )}
            </h3>
            <p className="mt-2 text-sm text-neutral-secondary line-clamp-3">{article.summary}</p>
            <div className="mt-3 flex items-center justify-between">
              <time className="text-xs text-neutral-secondary">
                {new Date(article.publishedAt).toLocaleDateString("en-NG", {
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </time>
              {article.tickers && article.tickers.length > 0 && (
                <div className="flex gap-1">
                  {article.tickers.slice(0, 3).map((t) => (
                    <Link
                      key={t}
                      href={`/stocks/${t}`}
                      className="rounded bg-primary/10 px-1.5 py-0.5 text-xs font-medium text-primary"
                    >
                      {t}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
          {article.url.startsWith("http") && (
            <ExternalLink className="h-4 w-4 flex-shrink-0 text-neutral-secondary" />
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export function NewsList({
  articles,
  isValidating,
}: {
  articles: NewsArticle[];
  isValidating?: boolean;
}) {
  return (
    <div
      className={`grid gap-4 sm:grid-cols-2 lg:grid-cols-3 transition-opacity ${
        isValidating ? "opacity-70" : ""
      }`}
    >
      {articles.map((article) => (
        <NewsCard key={article.id} article={article} />
      ))}
    </div>
  );
}
