import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { ChangeIndicator } from "@/components/ui/change-indicator";
import { formatNGN } from "@/lib/utils";
import type { Stock } from "@/types";

interface TopMoversListProps {
  stocks: Stock[];
}

export function TopMoversList({ stocks }: TopMoversListProps) {
  if (stocks.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-sm text-neutral-secondary">
          No stocks match this category right now.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        <ol className="divide-y divide-border">
          {stocks.map((stock, index) => (
            <li key={stock.ticker}>
              <Link
                href={`/stocks/${stock.ticker}`}
                className="flex items-center gap-4 px-4 py-3 transition-colors hover:bg-muted"
              >
                <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-muted text-sm font-semibold text-neutral-secondary">
                  {index + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-neutral-heading">{stock.ticker}</p>
                  <p className="truncate text-xs text-neutral-secondary">{stock.name}</p>
                  <span className="mt-1 inline-block rounded-full bg-muted px-2 py-0.5 text-xs text-neutral-secondary">
                    {stock.sector}
                  </span>
                </div>
                <div className="text-right">
                  <p className="font-medium text-neutral-heading">{formatNGN(stock.price)}</p>
                  <ChangeIndicator value={stock.changePercent} className="text-sm" />
                </div>
              </Link>
            </li>
          ))}
        </ol>
      </CardContent>
    </Card>
  );
}
