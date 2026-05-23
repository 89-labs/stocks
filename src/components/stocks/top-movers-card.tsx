import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StockRow } from "@/components/stocks/stock-card";
import type { Stock } from "@/types";

interface TopMoversCardProps {
  title: string;
  titleClassName?: string;
  stocks: Stock[];
  seeMoreHref: string;
}

export function TopMoversCard({
  title,
  titleClassName,
  stocks,
  seeMoreHref,
}: TopMoversCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <CardTitle className={titleClassName}>{title}</CardTitle>
        <Link
          href={seeMoreHref}
          className="flex items-center gap-1 text-sm font-medium text-primary hover:underline"
        >
          See more
          <ArrowRight className="h-4 w-4" />
        </Link>
      </CardHeader>
      <CardContent className="p-0">
        {stocks.length === 0 ? (
          <p className="px-4 py-6 text-center text-sm text-neutral-secondary">
            No movers in this category right now.
          </p>
        ) : (
          stocks.map((s) => <StockRow key={s.ticker} stock={s} />)
        )}
      </CardContent>
    </Card>
  );
}
