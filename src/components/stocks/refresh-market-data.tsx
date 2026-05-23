"use client";

import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import { mutate } from "swr";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface RefreshMarketDataProps {
  /** When set, only that stock's quote/chart caches are cleared */
  ticker?: string;
  /** Revalidate SWR-backed listing pages after refresh */
  listings?: boolean;
  className?: string;
  size?: "sm" | "default";
  onRefreshed?: () => void;
}

export function RefreshMarketData({
  ticker,
  listings,
  className,
  size = "default",
  onRefreshed,
}: RefreshMarketDataProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      await fetch("/api/stocks/refresh", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(ticker ? { ticker } : {}),
      });
      if (listings) {
        await mutate((key) => typeof key === "string" && key.startsWith("/api/stocks?"));
      }
      if (ticker) {
        await mutate(`/api/stocks/${ticker}`);
      }
      onRefreshed?.();
      router.refresh();
    } catch {
      if (listings) {
        await mutate((key) => typeof key === "string" && key.startsWith("/api/stocks?"));
      }
      router.refresh();
    } finally {
      setLoading(false);
    }
  }, [router, ticker, listings, onRefreshed]);

  return (
    <Button
      type="button"
      variant="outline"
      size={size}
      onClick={refresh}
      disabled={loading}
      className={cn("gap-2", className)}
      aria-label="Refresh market data"
    >
      <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
      {loading ? "Refreshing…" : "Refresh"}
    </Button>
  );
}
