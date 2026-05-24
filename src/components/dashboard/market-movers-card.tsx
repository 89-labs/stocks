"use client";

import { useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import type { Stock } from "@/types";

interface MarketMoversCardProps {
  gainers: Stock[];
  losers: Stock[];
}

export function MarketMoversCard({ gainers, losers }: MarketMoversCardProps) {
  const [tab, setTab] = useState<"gainers" | "losers">("gainers");
  const stocks = tab === "gainers" ? gainers : losers;

  return (
    <div className="overflow-hidden rounded-2xl border border-white/70 bg-white/90 shadow-sm shadow-slate-200/60 backdrop-blur dark:border-slate-800 dark:bg-slate-900/85 dark:shadow-none">
      <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 dark:border-slate-800">
        <h3 className="text-[13px] font-medium text-slate-900 dark:text-slate-100">
          Market movers
        </h3>
        <div className="flex gap-0.5">
          {(["gainers", "losers"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={cn(
                "rounded-md px-2.5 py-1 text-[11px] transition-colors duration-150",
                tab === t
                  ? "bg-green-50 font-medium text-green-700 dark:bg-green-950 dark:text-green-400"
                  : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
              )}
            >
              {t === "gainers" ? "Top gainers" : "Top losers"}
            </button>
          ))}
        </div>
      </div>
      <div key={tab} className="animate-in fade-in duration-200">
        {stocks.length === 0 ? (
          <div className="px-4 py-10 text-center text-[12px] text-slate-400">
            Market mover data is temporarily unavailable.
          </div>
        ) : (
          stocks.map((stock) => (
            <Link
              key={stock.ticker}
              href={`/dashboard/stocks/${stock.ticker}`}
              className="grid grid-cols-[minmax(5.75rem,7.25rem)_minmax(0,1fr)_auto] items-center gap-x-3 border-b border-slate-50 px-4 py-2.5 transition-colors duration-100 last:border-0 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-900"
            >
              <span
                className="truncate text-[12px] font-semibold tracking-tight text-slate-900 dark:text-slate-100"
                title={stock.ticker}
              >
                {stock.ticker}
              </span>
              <div className="min-w-0 overflow-hidden">
                <div
                  className="truncate text-[11px] font-medium text-slate-700 dark:text-slate-300"
                  title={stock.name}
                >
                  {stock.name}
                </div>
                {stock.sector ? (
                  <div className="truncate text-[10px] text-slate-400" title={stock.sector}>
                    {stock.sector}
                  </div>
                ) : null}
              </div>
              <div className="shrink-0 pl-1 text-right">
                <div className="text-[12px] font-medium text-slate-900 dark:text-slate-100">
                  ₦{stock.price.toLocaleString("en-NG")}
                </div>
                <span
                  className={cn(
                    "rounded-full px-1.5 py-0.5 text-[10px] font-medium",
                    stock.changePercent >= 0
                      ? "bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-400"
                      : "bg-red-50 text-red-600 dark:bg-red-950 dark:text-red-400"
                  )}
                >
                  {stock.changePercent >= 0 ? "▲" : "▼"} {Math.abs(stock.changePercent).toFixed(2)}%
                </span>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
