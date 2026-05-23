import { formatNGN } from "@/lib/utils";
import type { SimulationResult } from "@/types";

interface ScenarioTableProps {
  scenarios: SimulationResult["scenarios"];
  invested: number;
}

export function ScenarioTable({ scenarios }: ScenarioTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border">
            <th className="px-3 py-2 text-left font-medium text-neutral-secondary">Scenario</th>
            <th className="px-3 py-2 text-right font-medium text-neutral-secondary">Price</th>
            <th className="px-3 py-2 text-right font-medium text-neutral-secondary">Value</th>
            <th className="px-3 py-2 text-right font-medium text-neutral-secondary">Gain/Loss</th>
          </tr>
        </thead>
        <tbody>
          {scenarios.map((s) => (
            <tr key={s.label} className="border-b border-border">
              <td className="px-3 py-2 capitalize font-medium text-neutral-heading">{s.label}</td>
              <td className="px-3 py-2 text-right">{formatNGN(s.projectedPrice)}</td>
              <td className="px-3 py-2 text-right">{formatNGN(s.projectedValue)}</td>
              <td className={`px-3 py-2 text-right font-semibold ${s.gainLoss >= 0 ? "text-gain" : "text-loss"}`}>
                {s.gainLoss >= 0 ? "+" : ""}{formatNGN(s.gainLoss)} ({s.gainLossPercent.toFixed(1)}%)
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
