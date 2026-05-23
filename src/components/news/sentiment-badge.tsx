import { Badge } from "@/components/ui/badge";
import type { NewsArticle } from "@/types";

interface SentimentBadgeProps {
  sentiment: NewsArticle["sentiment"];
}

export function SentimentBadge({ sentiment }: SentimentBadgeProps) {
  const labels = {
    bullish: "Bullish",
    bearish: "Bearish",
    neutral: "Neutral",
  };

  return (
    <Badge variant={sentiment}>{labels[sentiment]}</Badge>
  );
}
