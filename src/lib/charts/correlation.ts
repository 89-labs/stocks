/** Pearson correlation coefficient between two numeric series */
export function pearsonCorrelation(a: number[], b: number[]): number {
  const n = Math.min(a.length, b.length);
  if (n < 2) return 0;

  const xs = a.slice(-n);
  const ys = b.slice(-n);
  const meanX = xs.reduce((s, v) => s + v, 0) / n;
  const meanY = ys.reduce((s, v) => s + v, 0) / n;

  let num = 0;
  let denX = 0;
  let denY = 0;
  for (let i = 0; i < n; i++) {
    const dx = xs[i] - meanX;
    const dy = ys[i] - meanY;
    num += dx * dy;
    denX += dx * dx;
    denY += dy * dy;
  }
  const den = Math.sqrt(denX * denY);
  if (den === 0) return 0;
  return num / den;
}

export function buildCorrelationMatrix(
  tickers: string[],
  closesByTicker: Record<string, number[]>
): { tickers: string[]; matrix: number[][] } {
  const matrix = tickers.map((t1) =>
    tickers.map((t2) => {
      if (t1 === t2) return 1;
      return pearsonCorrelation(closesByTicker[t1] ?? [], closesByTicker[t2] ?? []);
    })
  );
  return { tickers, matrix };
}
