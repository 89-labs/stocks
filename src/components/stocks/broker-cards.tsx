"use client";

import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BROKER_LINKS } from "@/lib/data/ngx-universe";

export function BrokerCards() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Where to Buy</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {BROKER_LINKS.map((broker) => (
            <a
              key={broker.name}
              href={broker.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group rounded-lg border border-border p-4 transition-colors hover:border-primary hover:bg-primary/5"
            >
              <div className="flex items-center justify-between">
                <h4 className="font-semibold text-neutral-heading group-hover:text-primary">
                  {broker.name}
                </h4>
                <ExternalLink className="h-4 w-4 text-neutral-secondary group-hover:text-primary" />
              </div>
              <p className="mt-1 text-xs text-neutral-secondary">{broker.description}</p>
            </a>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export function RelatedStocks({
  stocks,
  detailPath = "/stocks",
}: {
  stocks: { ticker: string; name: string; price: number; changePercent: number }[];
  detailPath?: string;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Related Stocks</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {stocks.map((s) => (
            <Link
              key={s.ticker}
              href={`${detailPath}/${s.ticker}`}
              className="flex items-center justify-between rounded-lg px-3 py-2 transition-colors hover:bg-muted"
            >
              <div>
                <p className="font-medium text-neutral-heading">{s.ticker}</p>
                <p className="text-xs text-neutral-secondary">{s.name}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium">₦{s.price.toFixed(2)}</p>
                <p className={`text-xs font-bold ${s.changePercent >= 0 ? "text-gain" : "text-loss"}`}>
                  {s.changePercent >= 0 ? "▲" : "▼"} {Math.abs(s.changePercent).toFixed(2)}%
                </p>
              </div>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
