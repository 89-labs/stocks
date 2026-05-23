/** Market news cache and ingestion settings */
export const NEWS_TARGET_COUNT = 100;
export const NEWS_PAGE_SIZE = 20;
/** Fresh ingest at most every 3 hours */
export const NEWS_CACHE_TTL_SECONDS = 3 * 60 * 60;
export const NEWS_REFRESH_INTERVAL_MS = NEWS_CACHE_TTL_SECONDS * 1000;
export const NEWS_MAX_ITEMS_PER_FEED = 25;
export const NEWS_FEED_FETCH_TIMEOUT_MS = 12_000;

export interface NewsFeedConfig {
  url: string;
  source: string;
  segment: string;
}

export const RSS_FEEDS: NewsFeedConfig[] = [
  { url: "https://businessday.ng/feed/", source: "BusinessDay", segment: "Business" },
  { url: "https://businessday.ng/category/markets/feed/", source: "BusinessDay", segment: "Markets" },
  { url: "https://businessday.ng/category/business/feed/", source: "BusinessDay", segment: "Business" },
  { url: "https://nairametrics.com/feed/", source: "Nairametrics", segment: "Markets" },
  { url: "https://nairametrics.com/category/financial-market/feed/", source: "Nairametrics", segment: "Markets" },
  { url: "https://nairametrics.com/category/banking/feed/", source: "Nairametrics", segment: "Banking" },
  { url: "https://nairametrics.com/category/companies/feed/", source: "Nairametrics", segment: "Corporate" },
  { url: "https://guardian.ng/category/business-economy/feed/", source: "The Guardian Nigeria", segment: "Business" },
  { url: "https://guardian.ng/category/business-economy/business/feed/", source: "The Guardian Nigeria", segment: "Business" },
  { url: "https://punchng.com/topics/business/feed/", source: "Punch Nigeria", segment: "Business" },
  { url: "https://www.premiumtimesng.com/category/business/feed/", source: "Premium Times", segment: "Business" },
  { url: "https://www.vanguardngr.com/category/business-news/feed/", source: "Vanguard", segment: "Business" },
  { url: "https://leadership.ng/category/business-news/feed/", source: "Leadership", segment: "Business" },
  { url: "https://techpoint.africa/feed/", source: "Techpoint Africa", segment: "Technology" },
  { url: "https://technext.ng/feed/", source: "Technext", segment: "Technology" },
  {
    url: "https://news.google.com/rss/search?q=Nigeria+NGX+OR+%22Nigerian+Exchange%22+stocks&hl=en-NG&gl=NG&ceid=NG:en",
    source: "Google News",
    segment: "Markets",
  },
  {
    url: "https://news.google.com/rss/search?q=Nigeria+CBN+inflation+economy&hl=en-NG&gl=NG&ceid=NG:en",
    source: "Google News",
    segment: "Economy",
  },
  {
    url: "https://news.google.com/rss/search?q=Nigeria+banking+dividend+earnings&hl=en-NG&gl=NG&ceid=NG:en",
    source: "Google News",
    segment: "Banking",
  },
  {
    url: "https://news.google.com/rss/search?q=Nigeria+oil+gas+Seplat+NNPC&hl=en-NG&gl=NG&ceid=NG:en",
    source: "Google News",
    segment: "Commodities",
  },
  {
    url: "https://news.google.com/rss/search?q=Dangote+MTN+Nigeria+corporate&hl=en-NG&gl=NG&ceid=NG:en",
    source: "Google News",
    segment: "Corporate",
  },
];

export const NEWS_SEGMENTS = [
  "Markets",
  "Business",
  "Economy",
  "Corporate",
  "Commodities",
  "Banking",
  "Technology",
] as const;
