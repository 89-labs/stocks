import Link from "next/link";
import { cn } from "@/lib/utils";
import type { NewsArticle } from "@/types";

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export function RecentNewsCard({ articles }: { articles: NewsArticle[] }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-white/70 bg-white/90 shadow-sm shadow-slate-200/60 backdrop-blur dark:border-slate-800 dark:bg-slate-900/85 dark:shadow-none">
      <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 dark:border-slate-800">
        <h3 className="text-[13px] font-medium text-slate-900 dark:text-slate-100">
          Recent news
        </h3>
        <Link href="/news" className="text-[11px] text-[#00A651] hover:underline">
          View all →
        </Link>
      </div>
      <ul>
        {articles.map((article) => (
          <li key={article.id}>
            <Link
              href={article.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block cursor-pointer border-b border-slate-50 px-4 py-2.5 transition-colors duration-100 last:border-0 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-900"
            >
              <p className="mb-1.5 line-clamp-2 text-[12px] font-medium leading-snug text-slate-800 dark:text-slate-200">
                {article.title}
              </p>
              <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                <span className="font-medium text-slate-500 dark:text-slate-400">
                  {article.source}
                </span>
                <span>·</span>
                <span>{timeAgo(article.publishedAt)}</span>
                <span
                  className={cn(
                    "ml-1 rounded-full px-1.5 py-0.5 font-medium",
                    article.sentiment === "bullish"
                      ? "bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-400"
                      : article.sentiment === "bearish"
                        ? "bg-red-50 text-red-600 dark:bg-red-950 dark:text-red-400"
                        : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"
                  )}
                >
                  {article.sentiment === "bullish"
                    ? "Bullish"
                    : article.sentiment === "bearish"
                      ? "Bearish"
                      : "Neutral"}
                </span>
              </div>
            </Link>
          </li>
        ))}
        {articles.length === 0 && (
          <li className="px-4 py-10 text-center text-[12px] text-slate-400">
            No market-relevant news available yet.
          </li>
        )}
      </ul>
    </div>
  );
}
