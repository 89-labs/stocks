import { connectMongoose } from "@/lib/db/mongoose";
import { AiScreen } from "@/lib/db/models";
import { getCurrentUser } from "@/lib/auth/session";
import { getSectorSignals, getMacroCommentary } from "@/lib/dashboard/ai-data";
import { getDailyMarketBriefFromDb } from "@/lib/dashboard/daily-market-brief";
import { AiBriefStream } from "@/components/dashboard/ai-brief-stream";
import {
  AiScreener,
  SectorSignalsGrid,
  MacroWatchSection,
} from "@/components/dashboard/ai-screener";
import { DashboardHeader, DashboardPageShell } from "@/components/dashboard/dashboard-ui";
import { Sparkles } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AiAnalysisPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  await connectMongoose();
  const [screens, sectorData, macroData, dailyBrief] = await Promise.all([
    AiScreen.find({ userId: user.id }).sort({ ranAt: -1 }).limit(5).lean(),
    getSectorSignals(),
    getMacroCommentary(),
    getDailyMarketBriefFromDb(),
  ]);

  const savedScreens = screens.map((s) => ({
    query: s.query,
    ranAt: s.ranAt.toISOString(),
  }));

  return (
    <DashboardPageShell>
      <DashboardHeader
        eyebrow="Intelligence"
        title="AI market workspace"
        description="Stream a daily NGX brief, review sector and macro signals, and screen stocks with natural-language prompts."
        meta={
          <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-[#00A651] dark:bg-emerald-950">
            <Sparkles className="h-3.5 w-3.5" />
            Groq-powered analysis
          </span>
        }
      />

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_400px]">
          <div className="space-y-8">
            <AiBriefStream
              initialText={dailyBrief?.text}
              initialGeneratedAt={dailyBrief?.generatedAt}
              initialAnalysisDate={dailyBrief?.analysisDate}
              initialFromCache={Boolean(dailyBrief)}
            />
            <SectorSignalsGrid sectors={sectorData.sectors} />
            <MacroWatchSection factors={macroData.factors} />
          </div>
          <div>
            <AiScreener savedScreens={savedScreens} />
          </div>
        </div>
    </DashboardPageShell>
  );
}
