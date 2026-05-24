"use client";

import { useState, useTransition, useEffect } from "react";
import { Search } from "lucide-react";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { searchStockListing, addToWatchlist } from "@/lib/dashboard/actions";
import { DashboardCard } from "@/components/dashboard/dashboard-ui";

interface StockSearchProps {
  onAdded?: () => void;
}

export function StockSearch({ onAdded }: StockSearchProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<{ code: string; name: string }[]>([]);
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const debouncedQuery = useDebouncedValue(query, 300);

  useEffect(() => {
    if (debouncedQuery.length < 1) {
      return;
    }
    let cancelled = false;
    void searchStockListing(debouncedQuery).then((matches) => {
      if (!cancelled) {
        setResults(matches);
        setOpen(matches.length > 0);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [debouncedQuery]);

  const handleSelect = (code: string) => {
    startTransition(async () => {
      await addToWatchlist(code);
      setQuery("");
      setOpen(false);
      onAdded?.();
    });
  };

  return (
    <DashboardCard className="relative p-3">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            if (e.target.value.length < 1) {
              setResults([]);
              setOpen(false);
            }
          }}
          onFocus={() => results.length > 0 && setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 200)}
          placeholder="Search ticker or company name…"
          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-10 py-3 text-sm outline-none transition-colors focus:border-[#00A651] focus:bg-white focus:ring-2 focus:ring-[#00A651]/10 dark:border-slate-800 dark:bg-slate-950 dark:focus:bg-slate-900"
        />
      </div>
      {open && results.length > 0 && (
        <ul className="absolute left-3 right-3 z-20 mt-2 max-h-60 overflow-auto rounded-xl border border-slate-200 bg-white p-1 shadow-xl shadow-slate-200/70 dark:border-slate-800 dark:bg-slate-900 dark:shadow-none">
          {results.map((item) => (
            <li key={item.code}>
              <button
                type="button"
                disabled={pending}
                onMouseDown={() => handleSelect(item.code)}
                className="flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left text-sm transition-colors hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                <span className="font-mono font-semibold text-slate-900 dark:text-slate-100">
                  {item.code}
                </span>
                <span className="ml-2 truncate text-slate-500 dark:text-slate-400">{item.name}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </DashboardCard>
  );
}
