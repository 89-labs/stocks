"use client";

import { useEffect, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { DashboardCard, PanelHeader } from "@/components/dashboard/dashboard-ui";

interface AiBriefStreamProps {
  initialText?: string | null;
  initialGeneratedAt?: string | null;
  initialAnalysisDate?: string | null;
  initialFromCache?: boolean;
}

export function AiBriefStream({
  initialText,
  initialGeneratedAt,
  initialAnalysisDate,
  initialFromCache,
}: AiBriefStreamProps) {
  const hasInitial = Boolean(initialText?.trim());
  const [text, setText] = useState(initialText ?? "");
  const [loading, setLoading] = useState(!hasInitial);
  const [generatedAt, setGeneratedAt] = useState<string | null>(
    initialGeneratedAt ?? null
  );
  const [fromCache, setFromCache] = useState(initialFromCache ?? hasInitial);

  useEffect(() => {
    if (hasInitial) return;

    let cancelled = false;

    async function loadBrief() {
      setLoading(true);
      try {
        const res = await fetch("/api/ai/brief");
        const data = await res.json();

        if (!res.ok || cancelled) return;

        setText(data.text ?? data.brief ?? "");
        setGeneratedAt(data.generatedAt ?? null);
        setFromCache(Boolean(data.fromCache));
      } catch {
        if (!cancelled) {
          setText(
            "Unable to load today's brief. Please check your connection and try again."
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadBrief();
    return () => {
      cancelled = true;
    };
  }, [hasInitial]);

  const displayDate = initialAnalysisDate
    ? new Date(`${initialAnalysisDate}T12:00:00`)
    : new Date();

  return (
    <DashboardCard>
      <PanelHeader
        title="Daily market brief"
        description="A concise read on the Nigerian market backdrop for today."
        action={
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-500 dark:bg-slate-950 dark:text-slate-400">
            {displayDate.toLocaleDateString("en-NG", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </span>
        }
      />
      {loading && !text ? (
        <div className="space-y-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-4 w-full animate-pulse" />
          ))}
          <p className="pt-2 text-xs text-slate-400">
            First visit today may take a minute while AI gathers market data…
          </p>
        </div>
      ) : (
        <div className="rounded-2xl bg-slate-50 p-5 text-sm leading-7 text-slate-600 dark:bg-slate-950/50 dark:text-slate-300">
          <p className="whitespace-pre-wrap">{text}</p>
        </div>
      )}
      {generatedAt && (
        <p className="mt-4 text-xs text-slate-500 dark:text-slate-400">
          {fromCache ? "Saved brief" : "Generated"}{" "}
          {new Date(generatedAt).toLocaleString("en-NG")}
          {initialAnalysisDate ? ` · ${initialAnalysisDate}` : ""}
        </p>
      )}
    </DashboardCard>
  );
}
