import type { NewsArticle } from "@/types";
import { cacheDelete, cacheGet, cacheSet } from "@/lib/cache/redis";
import { memClear, memDelete, memGetOrSet } from "@/lib/cache/memory";
import {
  NEWS_CACHE_TTL_SECONDS,
  NEWS_PAGE_SIZE,
  NEWS_TARGET_COUNT,
} from "@/lib/data/news/constants";
import { ingestMarketNews } from "@/lib/data/news/ingest-rss";

const NEWS_CACHE_KEY = "news:all";
const NEWS_BUNDLE_MEM_KEY = "news:bundle";

export interface NewsBundle {
  articles: NewsArticle[];
  refreshedAt: string;
  stale: boolean;
}

export interface NewsListResult {
  items: NewsArticle[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  refreshedAt: string;
  stale: boolean;
  targetCount: number;
}

async function loadNewsBundle(): Promise<NewsBundle> {
  const cached = await cacheGet<{ data: NewsArticle[]; cachedAt: number }>(NEWS_CACHE_KEY);
  const now = Date.now();

  if (cached) {
    const age = now - cached.cachedAt;
    const isStale = age >= NEWS_CACHE_TTL_SECONDS * 1000;
    if (!isStale) {
      return {
        articles: cached.data.slice(0, NEWS_TARGET_COUNT),
        refreshedAt: new Date(cached.cachedAt).toISOString(),
        stale: false,
      };
    }
  }

  const articles = await ingestMarketNews();
  const cachedAt = Date.now();
  await cacheSet(
    NEWS_CACHE_KEY,
    { data: articles, cachedAt },
    NEWS_CACHE_TTL_SECONDS * 2
  );

  return {
    articles: articles.slice(0, NEWS_TARGET_COUNT),
    refreshedAt: new Date(cachedAt).toISOString(),
    stale: false,
  };
}

function paginateArticles(
  articles: NewsArticle[],
  page: number,
  pageSize: number,
  meta: Pick<NewsBundle, "refreshedAt" | "stale">
): NewsListResult {
  const total = articles.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const start = (safePage - 1) * pageSize;

  return {
    items: articles.slice(start, start + pageSize),
    total,
    page: safePage,
    pageSize,
    totalPages,
    refreshedAt: meta.refreshedAt,
    stale: meta.stale,
    targetCount: NEWS_TARGET_COUNT,
  };
}

export class NewsService {
  /** Full cached bundle (max 100 articles), refreshed every 3 hours */
  static async getNewsBundle(): Promise<NewsBundle> {
    return memGetOrSet<NewsBundle>(NEWS_BUNDLE_MEM_KEY, NEWS_CACHE_TTL_SECONDS, async () => {
      const bundle = await loadNewsBundle();
      return {
        ...bundle,
        refreshedAt: new Date().toISOString(),
      };
    });
  }

  static async fetchAllNews(): Promise<NewsArticle[]> {
    const bundle = await this.getNewsBundle();
    return bundle.articles;
  }

  static async listNews(
    options: {
      segment?: string;
      page?: number;
      pageSize?: number;
    } = {}
  ): Promise<NewsListResult> {
    const bundle = await this.getNewsBundle();
    let articles = bundle.articles;

    if (options.segment) {
      const seg = options.segment.toLowerCase();
      articles = articles.filter((a) => a.segment?.toLowerCase() === seg);
    }

    return paginateArticles(
      articles,
      options.page ?? 1,
      options.pageSize ?? NEWS_PAGE_SIZE,
      { refreshedAt: bundle.refreshedAt, stale: bundle.stale }
    );
  }

  static async getNewsForTicker(ticker: string): Promise<NewsArticle[]> {
    const upper = ticker.toUpperCase();
    const all = await this.fetchAllNews();
    return all.filter(
      (a) =>
        a.tickers?.includes(upper) ||
        a.title.toUpperCase().includes(upper) ||
        a.summary.toUpperCase().includes(upper)
    );
  }

  static async getNewsBySegment(segment?: string): Promise<NewsArticle[]> {
    if (!segment) return this.fetchAllNews();
    const seg = segment.toLowerCase();
    const all = await this.fetchAllNews();
    return all.filter((a) => a.segment?.toLowerCase() === seg);
  }

  /** Force next request to re-ingest from RSS (manual refresh or cron) */
  static invalidateNewsCache(): void {
    memDelete(NEWS_BUNDLE_MEM_KEY);
    memClear((k) => k.startsWith("news:"));
    void cacheDelete(NEWS_CACHE_KEY);
  }

  static async refreshNews(): Promise<NewsBundle> {
    this.invalidateNewsCache();
    return this.getNewsBundle();
  }
}
