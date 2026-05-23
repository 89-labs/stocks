export const TOP_MOVERS_PREVIEW = 5;
export const TOP_MOVERS_FULL = 50;

export type MoverType = "gainers" | "losers" | "volume";

export const MOVER_PAGE_META: Record<
  "gainers" | "losers",
  { title: string; description: string; href: string; titleClass: string }
> = {
  gainers: {
    title: "Top Gainers",
    description: "NGX stocks with the largest positive price change today.",
    href: "/market/gainers",
    titleClass: "text-gain",
  },
  losers: {
    title: "Top Losers",
    description: "NGX stocks with the largest negative price change today.",
    href: "/market/losers",
    titleClass: "text-loss",
  },
};
