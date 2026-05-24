"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { addToWatchlist, removeFromWatchlist } from "@/lib/dashboard/actions";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface WatchlistButtonProps {
  ticker: string;
  inWatchlist: boolean;
}

export function WatchlistButton({ ticker, inWatchlist }: WatchlistButtonProps) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const toggle = () => {
    startTransition(async () => {
      if (inWatchlist) await removeFromWatchlist(ticker);
      else await addToWatchlist(ticker);
      router.refresh();
    });
  };

  return (
    <Button
      type="button"
      variant={inWatchlist ? "default" : "outline"}
      size="sm"
      disabled={pending}
      onClick={toggle}
      className={cn(
        !inWatchlist && "border-primary text-primary hover:bg-green-50"
      )}
    >
      {inWatchlist ? "✓ In watchlist" : "+ Add to watchlist"}
    </Button>
  );
}
