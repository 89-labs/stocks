import type { NewsArticle } from "@/types";

const NIGERIAN_FINANCE_LEXICON: Record<string, number> = {
  profit: 1,
  growth: 1,
  surge: 1,
  rally: 1,
  gain: 1,
  bullish: 1,
  dividend: 0.5,
  expansion: 1,
  recovery: 1,
  "record high": 1.5,
  outperform: 1,
  upgrade: 1,
  loss: -1,
  decline: -1,
  crash: -1.5,
  bearish: -1,
  downgrade: -1,
  "profit-taking": -0.5,
  "forex scarcity": -1,
  "cbn tightening": -0.8,
  inflation: -0.7,
  devaluation: -1.2,
  recession: -1.5,
  default: -1.5,
  sanction: -1,
  strike: -0.8,
  uncertainty: -0.6,
};

export function scoreSentiment(text: string): {
  sentiment: NewsArticle["sentiment"];
  score: number;
} {
  const lower = text.toLowerCase();
  let score = 0;

  for (const [term, weight] of Object.entries(NIGERIAN_FINANCE_LEXICON)) {
    if (lower.includes(term)) score += weight;
  }

  if (score > 0.5) return { sentiment: "bullish", score };
  if (score < -0.5) return { sentiment: "bearish", score };
  return { sentiment: "neutral", score };
}

export function generateSummary(title: string, content: string): string {
  const text = content || title;
  const sentences = text.replace(/<[^>]*>/g, "").split(/[.!?]+/).filter(Boolean);
  if (sentences.length === 0) return title;
  const summary = sentences.slice(0, 2).join(". ").trim();
  return summary.length > 200 ? `${summary.slice(0, 197)}...` : `${summary}.`;
}
