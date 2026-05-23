import { AIService } from "@/lib/data/ai-service";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AI_DISCLAIMER } from "@/lib/utils";
import { SaveBriefButton } from "@/components/insights/save-brief-button";
import { Sparkles, TrendingUp, TrendingDown, Minus } from "lucide-react";

export const revalidate = 3600;

export default async function InsightsPage() {
  const brief = await AIService.generateMarketBrief();

  const directionIcon = {
    in: TrendingUp,
    out: TrendingDown,
    neutral: Minus,
  };

  const directionColor = {
    in: "text-gain",
    out: "text-loss",
    neutral: "text-neutral-secondary",
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8 flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="h-7 w-7 text-primary" />
            <h1 className="text-3xl font-bold text-neutral-heading">AI Market Insights</h1>
          </div>
          <p className="mt-1 text-neutral-secondary">
            Daily AI-generated market brief for {brief.date}
          </p>
        </div>
        <SaveBriefButton brief={brief} />
      </div>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Today&apos;s Market Brief</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-neutral-secondary leading-relaxed">{brief.summary}</p>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Sector Rotation Signals</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {brief.sectorSignals.map((signal) => {
                const Icon = directionIcon[signal.direction];
                return (
                  <div
                    key={signal.sector}
                    className="flex items-start gap-3 rounded-lg border border-border p-3"
                  >
                    <Icon className={`h-5 w-5 mt-0.5 ${directionColor[signal.direction]}`} />
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-neutral-heading">{signal.sector}</p>
                        <Badge variant={signal.direction === "in" ? "bullish" : signal.direction === "out" ? "bearish" : "neutral"}>
                          {signal.direction === "in" ? "Inflow" : signal.direction === "out" ? "Outflow" : "Neutral"}
                        </Badge>
                      </div>
                      <p className="mt-1 text-sm text-neutral-secondary">{signal.signal}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Macro Watchpoints</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {brief.macroWatchpoints.map((point, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="mt-1.5 h-2 w-2 flex-shrink-0 rounded-full bg-primary" />
                  <span className="text-sm text-neutral-secondary">{point}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      <p className="mt-8 text-xs text-neutral-secondary italic">{AI_DISCLAIMER}</p>
    </div>
  );
}
