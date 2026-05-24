import { StockDataService } from "@/lib/data/stock-data-service";
import { getMarketHolidays } from "@/lib/data/stock-data-service";
import { getUserWatchlistTickers } from "@/lib/dashboard/watchlist";
import { getPortfolioValue } from "@/lib/dashboard/portfolio";
import { getCurrentUser } from "@/lib/auth/session";
import { formatNGN, getChangeIcon } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { Activity, Briefcase, LineChart, Star } from "lucide-react";
import { MetricCard } from "@/components/dashboard/dashboard-ui";

async function isMarketOpenNow(): Promise<boolean> {
  const holidays = await getMarketHolidays();
  const today = new Date().toISOString().split("T")[0];
  if (holidays.some((h) => h.date === today)) return false;
  const day = new Date().getDay();
  if (day === 0 || day === 6) return false;
  const hour = new Date().getHours();
  return hour >= 10 && hour < 14;
}

export async function SummaryBar() {
  const user = await getCurrentUser();
  if (!user) return null;

  const [summary, watchlistTickers, portfolioValue, marketOpen] = await Promise.all([
    StockDataService.getMarketSummary(),
    getUserWatchlistTickers(user.id),
    getPortfolioValue(user.id),
    isMarketOpenNow(),
  ]);

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <MetricCard
        label="NGX All-Share"
        value={summary.allShareIndex.toLocaleString("en-NG", { maximumFractionDigits: 2 })}
        icon={LineChart}
        tone="green"
        sub={
          <span
            className={cn(
              "font-semibold",
              summary.allShareChangePercent >= 0 ? "text-green-600" : "text-red-500"
            )}
          >
            {getChangeIcon(summary.allShareChangePercent)}{" "}
            {Math.abs(summary.allShareChangePercent).toFixed(2)}% today
          </span>
        }
      />
      <MetricCard
        label="Market status"
        value={marketOpen ? "Open" : "Closed"}
        icon={Activity}
        tone={marketOpen ? "green" : "red"}
        sub={
          <span className="inline-flex items-center gap-1.5">
            <span
              className={cn(
                "h-1.5 w-1.5 rounded-full",
                marketOpen ? "bg-green-500" : "bg-red-500"
              )}
            />
            {marketOpen ? "Open for trading" : "Opens Mon 10:00 WAT"}
          </span>
        }
      />
      <MetricCard
        label="Watchlist"
        value={String(watchlistTickers.length)}
        icon={Star}
        tone="blue"
        sub="Saved equities under review"
      />
      <MetricCard
        label="Portfolio value"
        value={formatNGN(portfolioValue)}
        icon={Briefcase}
        tone="amber"
        sub="Marked to latest prices"
      />
    </div>
  );
}
