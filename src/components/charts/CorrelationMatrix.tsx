"use client";

import { buildCorrelationMatrix } from "@/lib/charts/correlation";
import { cn } from "@/lib/utils";

interface CorrelationMatrixProps {
  tickers: string[];
  closesByTicker: Record<string, number[]>;
}

function cellColor(value: number): string {
  if (value >= 0.5) return "bg-green-500/80 text-white";
  if (value >= 0.2) return "bg-green-300/70 text-green-900";
  if (value >= -0.2) return "bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200";
  if (value >= -0.5) return "bg-red-300/70 text-red-900";
  return "bg-red-500/80 text-white";
}

export function CorrelationMatrix({ tickers, closesByTicker }: CorrelationMatrixProps) {
  const { matrix } = buildCorrelationMatrix(tickers, closesByTicker);

  if (tickers.length < 2) return null;

  return (
    <div className="mt-6 overflow-x-auto">
      <h3 className="mb-3 text-sm font-semibold text-neutral-heading">
        Correlation matrix
      </h3>
      <table className="text-xs">
        <thead>
          <tr>
            <th className="p-1" />
            {tickers.map((t) => (
              <th key={t} className="p-1 font-mono font-semibold text-neutral-secondary">
                {t}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {tickers.map((rowTicker, i) => (
            <tr key={rowTicker}>
              <td className="p-1 font-mono font-semibold text-neutral-secondary">{rowTicker}</td>
              {matrix[i].map((val, j) => (
                <td key={`${rowTicker}-${tickers[j]}`} className="p-0.5">
                  <div
                    className={cn(
                      "flex h-10 w-10 items-center justify-center rounded font-medium",
                      cellColor(val)
                    )}
                  >
                    {val.toFixed(2)}
                  </div>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
