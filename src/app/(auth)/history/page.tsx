import Link from "next/link";
import { getCurrentUser } from "@/lib/auth/session";
import { connectMongoose } from "@/lib/db/mongoose";
import { ResearchHistory } from "@/lib/db/models";
import { AuthGate } from "@/components/auth/auth-gate";
import { Card, CardContent } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default async function HistoryPage() {
  const user = await getCurrentUser();

  if (!user) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <h1 className="mb-8 text-3xl font-bold text-neutral-heading">Research History</h1>
        <AuthGate
          title="Sign in to view research history"
          description="See every stock page you've visited with timestamps."
          preview={
            <Card>
              <CardContent className="p-6 space-y-3">
                {["DANGCEM", "GTCO", "MTNN"].map((t) => (
                  <div key={t} className="flex justify-between text-sm">
                    <span className="font-semibold">{t}</span>
                    <span className="text-neutral-secondary">--/--/----</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          }
        />
      </div>
    );
  }

  await connectMongoose();
  const history = await ResearchHistory.find({ userId: user.id })
    .sort({ visitedAt: -1 })
    .limit(100)
    .lean();

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-neutral-heading">Research History</h1>
        <p className="mt-1 text-neutral-secondary">Stocks you&apos;ve recently viewed</p>
      </div>

      {history.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-neutral-secondary">
            No research history yet. Start browsing stocks to build your history.
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            {history.map((entry) => (
              <Link
                key={String(entry._id)}
                href={`/stocks/${entry.ticker}`}
                className="flex items-center justify-between border-b border-border px-6 py-4 transition-colors hover:bg-muted last:border-b-0"
              >
                <span className="font-semibold text-primary">{entry.ticker}</span>
                <time className="text-sm text-neutral-secondary">
                  {new Date(entry.visitedAt).toLocaleString("en-NG", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </time>
              </Link>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
