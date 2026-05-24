"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();

  return (
    <div className="flex flex-1 items-center justify-center p-8">
      <div className="max-w-md rounded-xl border border-slate-200 bg-white p-8 text-center dark:border-slate-700 dark:bg-card-bg">
        <h2 className="text-xl font-bold text-neutral-heading">Couldn&apos;t load dashboard</h2>
        <p className="mt-2 text-sm text-neutral-secondary">
          {error.message || "Something went wrong loading your dashboard data."}
        </p>
        <p className="mt-2 text-xs text-neutral-secondary">
          Check your internet connection and try again.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Button onClick={() => reset()}>Try again</Button>
          <Button variant="outline" onClick={() => router.refresh()}>
            Refresh page
          </Button>
        </div>
      </div>
    </div>
  );
}
