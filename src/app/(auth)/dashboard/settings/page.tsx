import { getCurrentUser } from "@/lib/auth/session";
import { getUserPreferences } from "@/lib/dashboard/user-preferences";
import { getUserWatchlistTickers } from "@/lib/dashboard/watchlist";
import { SettingsForm } from "@/components/dashboard/settings-form";
import clientPromise from "@/lib/db/mongo-client";
import { ObjectId } from "mongodb";
import { DashboardHeader, DashboardPageShell } from "@/components/dashboard/dashboard-ui";

export const dynamic = "force-dynamic";

async function getUserCreatedAt(userId: string): Promise<string> {
  try {
    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB || "naijastocks");
    const user = await db.collection("users").findOne({
      _id: new ObjectId(userId),
    });
    if (user?.createdAt) return new Date(user.createdAt as Date).toISOString();
  } catch {
    // fallback
  }
  return new Date().toISOString();
}

export default async function SettingsPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const [prefs, watchlistTickers, createdAt] = await Promise.all([
    getUserPreferences(user.id),
    getUserWatchlistTickers(user.id),
    getUserCreatedAt(user.id),
  ]);

  return (
    <DashboardPageShell className="gap-8">
        <DashboardHeader
          eyebrow="Preferences"
          title="Settings"
          description="Manage your profile, display options, watchlist data, notifications, and account in one place."
          meta={
            <div className="flex flex-wrap gap-2 text-xs text-slate-500 dark:text-slate-400">
              <span className="rounded-full bg-slate-100 px-3 py-1 dark:bg-slate-900">
                {watchlistTickers.length} watchlist stocks
              </span>
              <span className="rounded-full bg-slate-100 px-3 py-1 dark:bg-slate-900">
                Default timeframe {prefs.defaultTimeframe}
              </span>
            </div>
          }
        />
        <SettingsForm
          email={user.email ?? ""}
          createdAt={createdAt}
          prefs={{
            ...prefs,
            displayName: prefs.displayName ?? user.name ?? undefined,
          }}
          watchlistCount={watchlistTickers.length}
        />
    </DashboardPageShell>
  );
}
