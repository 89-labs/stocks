"use client";

import { useState } from "react";
import { mutate } from "swr";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { NEWS_REFRESH_INTERVAL_MS } from "@/lib/data/news/constants";

interface NewsMetaBarProps {
  refreshedAt: string;
  total: number;
  targetCount: number;
  stale?: boolean;
  isValidating?: boolean;
  onRefresh?: () => void;
}

function formatRefreshLabel(ms: number): string {
  const hours = ms / (60 * 60 * 1000);
  return hours === 1 ? "1 hour" : `${hours} hours`;
}

export function NewsMetaBar({
  refreshedAt,
  total,
  targetCount,
  stale,
  isValidating,
  onRefresh,
}: NewsMetaBarProps) {
  const [loading, setLoading] = useState(false);
  const updated = new Date(refreshedAt);

  const handleRefresh = async () => {
    setLoading(true);
    try {
      await fetch("/api/news/refresh", { method: "POST" });
      await mutate((key) => typeof key === "string" && key.startsWith("/api/news?"));
      onRefresh?.();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-muted px-4 py-3">
      <div className="text-sm text-neutral-secondary">
        <span className="font-medium text-neutral-heading">{total}</span> of{" "}
        {targetCount} articles
        {stale && (
          <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-800">
            Refreshing cache
          </span>
        )}
        <span className="mt-0.5 block text-xs">
          Last updated {updated.toLocaleString("en-NG")} · auto-refresh every{" "}
          {formatRefreshLabel(NEWS_REFRESH_INTERVAL_MS)}
        </span>
      </div>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={handleRefresh}
        disabled={loading || isValidating}
        className="gap-2"
      >
        <RefreshCw className={cn("h-4 w-4", (loading || isValidating) && "animate-spin")} />
        {loading ? "Refreshing…" : "Refresh now"}
      </Button>
    </div>
  );
}
