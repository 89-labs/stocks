import { StockDataService } from "@/lib/data/stock-data-service";
import { getMacroFactors } from "@/lib/dashboard/macro-data";
import { cacheGet, cacheSet } from "@/lib/cache/redis";

const SECTOR_CACHE = "ai:sector-signals";
const MACRO_CACHE = "ai:macro-commentary";
const CACHE_TTL = 6 * 3600;

const SECTORS = [
  "Banking",
  "Oil & Gas",
  "Consumer Goods",
  "Industrial",
  "Telecoms",
  "Agriculture",
] as const;

export interface SectorSignal {
  sector: string;
  changePercent: number;
  signal: "Accumulate" | "Hold" | "Distribute";
  rationale: string;
}

export interface MacroCard {
  label: string;
  value: string;
  change24h: number;
  unit?: string;
  commentary: string;
}

/**
 * Lazy import keeps this module loadable in environments that don't bundle
 * the full Mastra runtime (e.g. simple type-only imports).
 */
async function generateWithAgent(
  agentId: "marketBriefAgent" | "stockAnalysisAgent",
  prompt: string
): Promise<string | null> {
  if (!process.env.GROQ_API_KEY) return null;
  try {
    const { mastra } = await import("@/mastra");
    const agent = mastra.getAgentById(agentId);
    const result = await agent.generate(prompt);
    return result.text;
  } catch (err) {
    console.error(`[NaijaStocks] Mastra agent ${agentId} failed:`, err);
    return null;
  }
}

export async function getSectorSignals(): Promise<{
  sectors: SectorSignal[];
  generatedAt: string;
}> {
  const cached = await cacheGet<{ sectors: SectorSignal[]; generatedAt: string }>(
    SECTOR_CACHE
  );
  if (cached) return cached;

  const stocks = await StockDataService.getAllStocks();
  const sectorChanges = SECTORS.map((sector) => {
    const sectorStocks = stocks.filter((s) => s.sector === sector);
    const avgChange =
      sectorStocks.length > 0
        ? sectorStocks.reduce((sum, s) => sum + s.changePercent, 0) /
          sectorStocks.length
        : 0;
    return { sector, changePercent: avgChange };
  });

  let sectors: SectorSignal[] = sectorChanges.map((s) => ({
    sector: s.sector,
    changePercent: s.changePercent,
    signal: "Hold" as const,
    rationale: "Monitoring sector trends.",
  }));

  const context = sectorChanges
    .map(
      (s) =>
        `${s.sector}: ${s.changePercent >= 0 ? "+" : ""}${s.changePercent.toFixed(
          2
        )}% today`
    )
    .join("\n");

  const text = await generateWithAgent(
    "marketBriefAgent",
    `For each NGX sector listed below, provide a signal (Accumulate / Hold / Distribute) and ` +
      `a 1-sentence rationale. Respond ONLY with valid JSON, no markdown fences. ` +
      `Schema: [{ "sector": string, "signal": "Accumulate" | "Hold" | "Distribute", "rationale": string }]. ` +
      `Do NOT call any tools.\n\n${context}`
  );

  if (text) {
    try {
      const match = text.match(/\[[\s\S]*\]/);
      if (match) {
        const parsed = JSON.parse(match[0]) as {
          sector: string;
          signal: string;
          rationale: string;
        }[];
        sectors = sectorChanges.map((s) => {
          const ai = parsed.find((p) => p.sector === s.sector);
          const signal = ["Accumulate", "Hold", "Distribute"].includes(
            ai?.signal ?? ""
          )
            ? (ai!.signal as SectorSignal["signal"])
            : "Hold";
          return {
            sector: s.sector,
            changePercent: s.changePercent,
            signal,
            rationale: ai?.rationale ?? "Neutral outlook.",
          };
        });
      }
    } catch {
      /* keep defaults */
    }
  }

  const result = { sectors, generatedAt: new Date().toISOString() };
  await cacheSet(SECTOR_CACHE, result, CACHE_TTL);
  return result;
}

export async function getMacroCommentary(): Promise<{
  factors: MacroCard[];
  generatedAt: string;
}> {
  const cached = await cacheGet<{ factors: MacroCard[]; generatedAt: string }>(
    MACRO_CACHE
  );
  if (cached) return cached;

  const macroFactors = await getMacroFactors();
  let factors: MacroCard[] = macroFactors.map((f) => ({
    ...f,
    commentary: "This macro factor influences NGX investor sentiment.",
  }));

  const text = await generateWithAgent(
    "marketBriefAgent",
    `Write a 2-sentence NGX market implication for each of the following macro factors. ` +
      `Respond ONLY with valid JSON, no markdown fences. ` +
      `Schema: [{ "label": string, "commentary": string }]. Do NOT call any tools.\n\n` +
      `1. CBN Rate: ${macroFactors[0]?.value}\n` +
      `2. NGN/USD: ${macroFactors[1]?.value}\n` +
      `3. Brent: ${macroFactors[2]?.value}`
  );

  if (text) {
    try {
      const match = text.match(/\[[\s\S]*\]/);
      if (match) {
        const parsed = JSON.parse(match[0]) as { label: string; commentary: string }[];
        factors = macroFactors.map((f, i) => ({
          ...f,
          commentary: parsed[i]?.commentary ?? factors[i].commentary,
        }));
      }
    } catch {
      /* keep defaults */
    }
  }

  const result = { factors, generatedAt: new Date().toISOString() };
  await cacheSet(MACRO_CACHE, result, CACHE_TTL);
  return result;
}
