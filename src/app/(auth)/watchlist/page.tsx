import Link from "next/link";
import { getCurrentUser } from "@/lib/auth/session";
import { connectMongoose } from "@/lib/db/mongoose";
import { Watchlist } from "@/lib/db/models";
import { AuthGate } from "@/components/auth/auth-gate";
import { Card, CardContent } from "@/components/ui/card";
import { ChangeIndicator } from "@/components/ui/change-indicator";
import { StockDataService } from "@/lib/data/stock-data-service";
import { formatNGN } from "@/lib/utils";
import { WatchlistActions } from "@/components/watchlist/watchlist-actions";

export const dynamic = "force-dynamic";

export default async function WatchlistPage() {
  const user = await getCurrentUser();

  if (!user) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <h1 className="mb-8 text-3xl font-bold text-neutral-heading">Watchlist</h1>
        <AuthGate
          title="Sign in to manage your watchlist"
          description="Save stocks to named watchlists and track your favourite NGX equities."
          preview={
            <Card>
              <CardContent className="p-6">
                <div className="space-y-3">
                  {["DANGCEM", "GTCO", "MTNN"].map((t) => (
                    <div key={t} className="flex justify-between border-b pb-2">
                      <span className="font-semibold">{t}</span>
                      <span>₦---.--</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          }
        />
      </div>
    );
  }

  await connectMongoose();
  const watchlists = await Watchlist.find({ userId: user.id })
    .sort({ updatedAt: -1 })
    .lean();

  const allTickers = watchlists.flatMap((w) => w.items.map((i) => i.ticker));
  const stocks = allTickers.length
    ? (await StockDataService.getAllStocks()).filter((s) => allTickers.includes(s.ticker))
    : [];
  const stockMap = new Map(stocks.map((s) => [s.ticker, s]));

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-neutral-heading">Watchlist</h1>
          <p className="mt-1 text-neutral-secondary">Track your favourite NGX stocks</p>
        </div>
        <WatchlistActions />
      </div>

      {watchlists.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-neutral-secondary">
              No watchlists yet. Browse{" "}
              <Link href="/dashboard/stocks" className="text-primary hover:underline">
                stocks
              </Link>{" "}
              and add them to your watchlist.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {watchlists.map((wl) => (
            <Card key={String(wl._id)}>
              <CardContent className="p-6">
                <h2 className="mb-4 text-lg font-semibold text-neutral-heading">{wl.name}</h2>
                {wl.items.length === 0 ? (
                  <p className="text-sm text-neutral-secondary">No stocks in this watchlist.</p>
                ) : (
                  <div className="space-y-2">
                    {wl.items.map((item, idx) => {
                      const stock = stockMap.get(item.ticker);
                      return (
                        <Link
                          key={`${item.ticker}-${idx}`}
                          href={`/dashboard/stocks/${item.ticker}`}
                          className="flex items-center justify-between rounded-lg px-3 py-2 hover:bg-muted"
                        >
                          <div>
                            <p className="font-semibold text-neutral-heading">{item.ticker}</p>
                            {stock && (
                              <p className="text-xs text-neutral-secondary">{stock.name}</p>
                            )}
                          </div>
                          {stock && (
                            <div className="text-right">
                              <p className="font-medium">{formatNGN(stock.price)}</p>
                              <ChangeIndicator value={stock.changePercent} className="text-xs" />
                            </div>
                          )}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
