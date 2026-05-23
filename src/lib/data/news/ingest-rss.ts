import Parser from "rss-parser";
import type { NewsArticle } from "@/types";
import { NGX_UNIVERSE } from "../ngx-universe";
import {
  NEWS_FEED_FETCH_TIMEOUT_MS,
  NEWS_MAX_ITEMS_PER_FEED,
  NEWS_TARGET_COUNT,
  RSS_FEEDS,
  type NewsFeedConfig,
} from "./constants";
import { FALLBACK_NEWS } from "./fallback-articles";
import { generateSummary, scoreSentiment } from "./sentiment";

const parser = new Parser({
  timeout: NEWS_FEED_FETCH_TIMEOUT_MS,
  headers: {
    "User-Agent": "NaijaStocks/1.0 (NGX market news aggregator)",
    Accept: "application/rss+xml, application/xml, text/xml",
  },
});

function extractTickers(text: string): string[] {
  const upper = text.toUpperCase();
  return NGX_UNIVERSE.filter(
    (s) => upper.includes(s.ticker) || upper.includes(s.name.toUpperCase())
  )
    .map((s) => s.ticker)
    .slice(0, 5);
}

function canonicalKey(url: string, title: string): string {
  if (url.startsWith("http")) {
    try {
      const u = new URL(url);
      return `${u.hostname}${u.pathname}`.toLowerCase();
    } catch {
      // fall through
    }
  }
  return title.toLowerCase().trim().slice(0, 160);
}

function inferSegment(
  title: string,
  content: string,
  defaultSegment: string
): string {
  const t = `${title} ${content}`.toLowerCase();
  if (/\b(ngx|all-share|equit(y|ies)|stock market|bourse)\b/.test(t)) return "Markets";
  if (/\b(cbn|mpr|inflation|fx|naira|monetary|fiscal|gdp)\b/.test(t)) return "Economy";
  if (/\b(oil|crude|gas|opec|petrol|energy)\b/.test(t)) return "Commodities";
  if (/\b(bank|banking|lending|loan|deposit)\b/.test(t)) return "Banking";
  if (/\b(earnings|dividend|ceo|plc|acquisition|merger)\b/.test(t)) return "Corporate";
  if (/\b(tech|fintech|startup|digital)\b/.test(t)) return "Technology";
  return defaultSegment;
}

function toArticle(
  item: Parser.Item,
  feed: NewsFeedConfig
): NewsArticle | null {
  const title = (item.title || "").trim();
  if (!title || title.length < 12) return null;

  const content = item.contentSnippet || item.content || item.summary || "";
  const url = (item.link || "").trim() || "#";
  const { sentiment, score } = scoreSentiment(`${title} ${content}`);
  const segment = inferSegment(title, content, feed.segment);

  return {
    id: `${feed.source}-${item.guid || url || title}`.slice(0, 120),
    title,
    summary: generateSummary(title, content),
    url,
    source: feed.source,
    publishedAt: item.isoDate || item.pubDate || new Date().toISOString(),
    sentiment,
    sentimentScore: score,
    segment,
    tickers: extractTickers(`${title} ${content}`),
  };
}

async function parseFeed(feed: NewsFeedConfig): Promise<NewsArticle[]> {
  const parsed = await Promise.race([
    parser.parseURL(feed.url),
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("Feed timeout")), NEWS_FEED_FETCH_TIMEOUT_MS)
    ),
  ]);

  const articles: NewsArticle[] = [];
  for (const item of parsed.items.slice(0, NEWS_MAX_ITEMS_PER_FEED)) {
    const article = toArticle(item, feed);
    if (article) articles.push(article);
  }
  return articles;
}

function dedupeAndSort(articles: NewsArticle[]): NewsArticle[] {
  const seen = new Set<string>();
  const unique: NewsArticle[] = [];

  for (const article of articles) {
    const key = canonicalKey(article.url, article.title);
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(article);
  }

  return unique.sort(
    (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  );
}

function padToTarget(articles: NewsArticle[]): NewsArticle[] {
  if (articles.length >= NEWS_TARGET_COUNT) {
    return articles.slice(0, NEWS_TARGET_COUNT);
  }

  const seen = new Set(articles.map((a) => canonicalKey(a.url, a.title)));
  for (const fallback of FALLBACK_NEWS) {
    if (articles.length >= NEWS_TARGET_COUNT) break;
    const key = canonicalKey(fallback.url, fallback.title);
    if (seen.has(key)) continue;
    seen.add(key);
    articles.push({
      ...fallback,
      id: `fallback-${articles.length}-${fallback.id}`,
      publishedAt: new Date(
        Date.now() - articles.length * 3_600_000
      ).toISOString(),
    });
  }

  return articles.slice(0, NEWS_TARGET_COUNT);
}

/** Fetch and normalize up to NEWS_TARGET_COUNT articles from all configured RSS feeds */
export async function ingestMarketNews(): Promise<NewsArticle[]> {
  const results = await Promise.allSettled(RSS_FEEDS.map((feed) => parseFeed(feed)));

  const merged: NewsArticle[] = [];
  for (const result of results) {
    if (result.status === "fulfilled") {
      merged.push(...result.value);
    }
  }

  const sorted = dedupeAndSort(merged);
  if (sorted.length === 0) {
    return padToTarget([...FALLBACK_NEWS]);
  }

  return padToTarget(sorted);
}
