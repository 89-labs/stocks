# NaijaStocks

Nigerian Stock Exchange (NGX) analysis platform built with Next.js 16, TypeScript, Tailwind CSS, MongoDB, and Mongoose. Live NGX quotes are pulled from Yahoo Finance with no API key required.

## Quick Start

```bash
npm install
cp .env.example .env.local
# Edit .env.local — only MONGODB_URI is required to enable auth-gated features
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment Variables

See [`.env.example`](.env.example). Only `MONGODB_URI` and `NEXTAUTH_SECRET` are required.

| Variable | Required | Purpose |
|---|---|---|
| `MONGODB_URI` | Yes (for auth features) | MongoDB connection string (Atlas free tier works) |
| `MONGODB_DB` | No | Defaults to `naijastocks` |
| `NEXTAUTH_URL` / `NEXTAUTH_SECRET` | Yes (for auth) | Authentication |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | No | Google OAuth |
| `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` | No | Upstash caching + rate limiting (graceful fallback) |
| `TWELVE_DATA_API_KEY` | No | Secondary quote source |
| `GROQ_API_KEY` | No | AI predictions & briefs via Mastra agents (graceful fallback) |

## Data Sources

Quotes and OHLCV: `yahoo-finance2` (NGX tickers with `.LG` suffix, e.g. `DANGCEM.LG`, `GTCO.LG`, `MTNN.LG`). NGX All-Share Index pulled from `^NGSEINDX`. No API key needed.

Live polling: the home and stock detail pages refresh quotes every 60 seconds client-side; server caches: 60 s in-memory + 5 min Redis.

News: RSS feeds from BusinessDay, Nairametrics, The Guardian Nigeria, parsed with `rss-parser`. Sentiment scored with a Nigerian-finance keyword lexicon.

## Deploy to Vercel

1. Push to GitHub
2. Import the project in Vercel
3. Set environment variables from `.env.example`
4. Deploy

## Features

- **Market Overview** — NGX All-Share Index, top movers, economic indicators, news
- **Stock Listings** — Searchable, filterable table with ISR (5 min)
- **Stock Detail** — Live quote, chart, financials, AI predictions, trade simulator
- **News** — RSS aggregation with sentiment scoring
- **AI Insights** — Daily market brief with sector signals
- **Auth** — Google OAuth + email magic link (NextAuth.js + MongoDB adapter)
- **Watchlist / Portfolio / History** — Auth-gated with soft preview gates
- **Light mode only** — clean, on-brand visual identity
