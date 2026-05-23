import { getCurrentUser } from "@/lib/auth/session";
import { connectMongoose } from "@/lib/db/mongoose";
import { Transaction } from "@/lib/db/models";
import { AuthGate } from "@/components/auth/auth-gate";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StockDataService } from "@/lib/data/stock-data-service";
import { formatNGN } from "@/lib/utils";
import { PortfolioActions } from "@/components/portfolio/portfolio-actions";
import { ChangeIndicator } from "@/components/ui/change-indicator";

export const dynamic = "force-dynamic";

export default async function PortfolioPage() {
  const user = await getCurrentUser();

  if (!user) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <h1 className="mb-8 text-3xl font-bold text-neutral-heading">Portfolio</h1>
        <AuthGate
          title="Sign in to track your portfolio"
          description="Log real buy/sell transactions and see your profit & loss."
          preview={
            <Card>
              <CardContent className="p-6">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-xs text-neutral-secondary">Total Value</p>
                    <p className="text-lg font-bold">₦---</p>
                  </div>
                  <div>
                    <p className="text-xs text-neutral-secondary">Total P&L</p>
                    <p className="text-lg font-bold text-gain">+₦---</p>
                  </div>
                  <div>
                    <p className="text-xs text-neutral-secondary">Holdings</p>
                    <p className="text-lg font-bold">--</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          }
        />
      </div>
    );
  }

  await connectMongoose();
  const transactions = await Transaction.find({ userId: user.id })
    .sort({ date: -1 })
    .lean();

  const holdings = new Map<string, { quantity: number; costBasis: number }>();

  for (const tx of transactions) {
    const current = holdings.get(tx.ticker) || { quantity: 0, costBasis: 0 };
    if (tx.type === "BUY") {
      current.costBasis += tx.quantity * tx.price + (tx.fees || 0);
      current.quantity += tx.quantity;
    } else {
      const avgCost = current.quantity > 0 ? current.costBasis / current.quantity : 0;
      current.costBasis -= tx.quantity * avgCost;
      current.quantity -= tx.quantity;
    }
    holdings.set(tx.ticker, current);
  }

  const activeHoldings = [...holdings.entries()].filter(([, h]) => h.quantity > 0);
  const stocks = await StockDataService.getAllStocks();
  const stockMap = new Map(stocks.map((s) => [s.ticker, s]));

  let totalValue = 0;
  let totalCost = 0;

  const holdingRows = activeHoldings.map(([ticker, h]) => {
    const stock = stockMap.get(ticker);
    const currentPrice = stock?.price ?? 0;
    const value = h.quantity * currentPrice;
    const pnl = value - h.costBasis;
    const pnlPercent = h.costBasis > 0 ? (pnl / h.costBasis) * 100 : 0;
    totalValue += value;
    totalCost += h.costBasis;
    return { ticker, quantity: h.quantity, costBasis: h.costBasis, value, pnl, pnlPercent, stock };
  });

  const totalPnl = totalValue - totalCost;
  const totalPnlPercent = totalCost > 0 ? (totalPnl / totalCost) * 100 : 0;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-neutral-heading">Portfolio</h1>
          <p className="mt-1 text-neutral-secondary">Track your NGX holdings and P&L</p>
        </div>
        <PortfolioActions />
      </div>

      <div className="mb-8 grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-neutral-secondary">Total Value</p>
            <p className="text-2xl font-bold text-neutral-heading">{formatNGN(totalValue)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-neutral-secondary">Total P&L</p>
            <p className={`text-2xl font-bold ${totalPnl >= 0 ? "text-gain" : "text-loss"}`}>
              {totalPnl >= 0 ? "+" : ""}
              {formatNGN(totalPnl)}
            </p>
            <ChangeIndicator value={totalPnlPercent} className="text-sm" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-neutral-secondary">Holdings</p>
            <p className="text-2xl font-bold text-neutral-heading">{holdingRows.length}</p>
          </CardContent>
        </Card>
      </div>

      {holdingRows.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Holdings</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead className="bg-muted">
                <tr>
                  <th className="px-4 py-3 text-left">Ticker</th>
                  <th className="px-4 py-3 text-right">Qty</th>
                  <th className="px-4 py-3 text-right">Avg Cost</th>
                  <th className="px-4 py-3 text-right">Current</th>
                  <th className="px-4 py-3 text-right">Value</th>
                  <th className="px-4 py-3 text-right">P&L</th>
                </tr>
              </thead>
              <tbody>
                {holdingRows.map((h) => (
                  <tr key={h.ticker} className="border-b border-border last:border-b-0">
                    <td className="px-4 py-3 font-semibold">{h.ticker}</td>
                    <td className="px-4 py-3 text-right">{h.quantity}</td>
                    <td className="px-4 py-3 text-right">{formatNGN(h.costBasis / h.quantity)}</td>
                    <td className="px-4 py-3 text-right">{formatNGN(h.stock?.price ?? 0)}</td>
                    <td className="px-4 py-3 text-right">{formatNGN(h.value)}</td>
                    <td className={`px-4 py-3 text-right font-semibold ${h.pnl >= 0 ? "text-gain" : "text-loss"}`}>
                      {h.pnl >= 0 ? "+" : ""}
                      {formatNGN(h.pnl)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-8 text-center text-neutral-secondary">
            No holdings yet. Add a transaction to get started.
          </CardContent>
        </Card>
      )}

      {transactions.length > 0 && (
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Transaction History</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead className="bg-muted">
                <tr>
                  <th className="px-4 py-3 text-left">Date</th>
                  <th className="px-4 py-3 text-left">Ticker</th>
                  <th className="px-4 py-3 text-left">Type</th>
                  <th className="px-4 py-3 text-right">Qty</th>
                  <th className="px-4 py-3 text-right">Price</th>
                  <th className="px-4 py-3 text-right">Fees</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((tx) => (
                  <tr key={String(tx._id)} className="border-b border-border last:border-b-0">
                    <td className="px-4 py-3">{new Date(tx.date).toLocaleDateString("en-NG")}</td>
                    <td className="px-4 py-3 font-semibold">{tx.ticker}</td>
                    <td className="px-4 py-3">
                      <span className={tx.type === "BUY" ? "text-gain" : "text-loss"}>{tx.type}</span>
                    </td>
                    <td className="px-4 py-3 text-right">{tx.quantity}</td>
                    <td className="px-4 py-3 text-right">{formatNGN(tx.price)}</td>
                    <td className="px-4 py-3 text-right">{formatNGN(tx.fees ?? 0)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
