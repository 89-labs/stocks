import type { Sector } from "@/types";
import { NGX_UNIVERSE_EXTRA } from "./ngx-universe-extra";

/** NGX listings shown in the app (cap at 140) */
export const NGX_LISTINGS_LIMIT = 140;
export const LISTINGS_PAGE_SIZE = 20;

export interface NGXBaseline {
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  high52w: number;
  low52w: number;
  peRatio?: number;
  eps?: number;
  dividendYield?: number;
}

export interface NGXEntry {
  ticker: string;
  name: string;
  sector: Sector;
  yahoo: string;
  twelve?: string;
  sharesOutstanding?: number;
}

/** Reference prices used only when live NGX feeds are unavailable */
export const NGX_BASELINES: Record<string, NGXBaseline> = {
  DANGCEM: { price: 285.5, change: 4.2, changePercent: 1.49, volume: 1250000, high52w: 320, low52w: 240, peRatio: 14.2, eps: 20.1, dividendYield: 3.5 },
  BUACEMENT: { price: 98.5, change: 1.2, changePercent: 1.23, volume: 980000, high52w: 115, low52w: 75, peRatio: 16.8, eps: 5.86, dividendYield: 2.1 },
  WAPCO: { price: 32.1, change: -0.4, changePercent: -1.23, volume: 1100000, high52w: 38, low52w: 25, peRatio: 10.5, eps: 3.06, dividendYield: 2.9 },
  GEREGU: { price: 520, change: 12, changePercent: 2.36, volume: 65000, high52w: 580, low52w: 380, peRatio: 15.2, eps: 34.2, dividendYield: 2.0 },
  TRANSCORP: { price: 12.5, change: -0.15, changePercent: -1.19, volume: 2800000, high52w: 15, low52w: 8, peRatio: 8.0, eps: 1.56, dividendYield: 2.5 },
  GTCO: { price: 42.85, change: -0.65, changePercent: -1.49, volume: 8900000, high52w: 52, low52w: 28, peRatio: 4.8, eps: 8.93, dividendYield: 5.2 },
  ZENITHBANK: { price: 38.2, change: 0.8, changePercent: 2.14, volume: 7200000, high52w: 45, low52w: 25, peRatio: 5.1, eps: 7.49, dividendYield: 6.1 },
  ACCESSCORP: { price: 22.5, change: -0.3, changePercent: -1.32, volume: 5600000, high52w: 28, low52w: 15, peRatio: 3.9, eps: 5.77, dividendYield: 4.8 },
  UBA: { price: 28.9, change: 0.45, changePercent: 1.58, volume: 6800000, high52w: 35, low52w: 18, peRatio: 4.2, eps: 6.88, dividendYield: 5.5 },
  STANBIC: { price: 78.5, change: 1.1, changePercent: 1.42, volume: 420000, high52w: 95, low52w: 55, peRatio: 6.2, eps: 12.66, dividendYield: 4.5 },
  FIDELITYBK: { price: 12.85, change: 0.15, changePercent: 1.18, volume: 4500000, high52w: 15, low52w: 8, peRatio: 3.5, eps: 3.67, dividendYield: 3.9 },
  FCMB: { price: 7.85, change: 0.05, changePercent: 0.64, volume: 3200000, high52w: 9.5, low52w: 5.5, peRatio: 3.2, eps: 2.45, dividendYield: 3.0 },
  MTNN: { price: 215, change: 3.5, changePercent: 1.65, volume: 2100000, high52w: 280, low52w: 180, peRatio: 12.5, eps: 17.2, dividendYield: 4.2 },
  AIRTELAFRI: { price: 1850, change: -25, changePercent: -1.33, volume: 450000, high52w: 2100, low52w: 1500, peRatio: 18.3, eps: 101.1, dividendYield: 2.8 },
  SEPLAT: { price: 4200, change: 85, changePercent: 2.06, volume: 120000, high52w: 4800, low52w: 3200, peRatio: 8.2, eps: 512, dividendYield: 7.5 },
  TOTAL: { price: 285, change: 3, changePercent: 1.06, volume: 210000, high52w: 320, low52w: 220, peRatio: 11.0, eps: 25.9, dividendYield: 5.0 },
  NESTLE: { price: 1250, change: -15, changePercent: -1.19, volume: 85000, high52w: 1400, low52w: 950, peRatio: 22.1, eps: 56.6, dividendYield: 3.8 },
  NB: { price: 28.5, change: 0.35, changePercent: 1.24, volume: 3200000, high52w: 35, low52w: 22, peRatio: 15.4, eps: 1.85, dividendYield: 2.5 },
  DANGSUGAR: { price: 52.3, change: -0.7, changePercent: -1.32, volume: 1500000, high52w: 65, low52w: 40, peRatio: 11.2, eps: 4.67, dividendYield: 4.0 },
  FLOURMILL: { price: 38.75, change: 0.25, changePercent: 0.65, volume: 890000, high52w: 45, low52w: 28, peRatio: 7.5, eps: 5.17, dividendYield: 1.8 },
  GUINNESS: { price: 45.2, change: -0.8, changePercent: -1.74, volume: 680000, high52w: 55, low52w: 35, peRatio: 18.5, eps: 2.44, dividendYield: 1.5 },
  PRESCO: { price: 285, change: 5.5, changePercent: 1.97, volume: 180000, high52w: 320, low52w: 200, peRatio: 9.8, eps: 29.1, dividendYield: 3.2 },
  OKOMUOIL: { price: 320, change: 8, changePercent: 2.56, volume: 95000, high52w: 380, low52w: 250, peRatio: 8.5, eps: 37.6, dividendYield: 4.1 },
  CUSTODIAN: { price: 8.5, change: 0.05, changePercent: 0.59, volume: 1200000, high52w: 10, low52w: 6, peRatio: 5.8, eps: 1.47, dividendYield: 6.2 },
  MAYBAKER: { price: 6.2, change: 0.1, changePercent: 1.64, volume: 890000, high52w: 8, low52w: 4.5, peRatio: 12.0, eps: 0.52, dividendYield: 1.2 },
};

const NGX_UNIVERSE_CORE: NGXEntry[] = [
  { ticker: "DANGCEM", name: "Dangote Cement Plc", sector: "Industrial", yahoo: "DANGCEM.LG", twelve: "DANGCEM", sharesOutstanding: 17_040_507_405 },
  { ticker: "BUACEMENT", name: "BUA Cement Plc", sector: "Industrial", yahoo: "BUACEMENT.LG", twelve: "BUACEMENT", sharesOutstanding: 33_864_354_060 },
  { ticker: "WAPCO", name: "Lafarge Africa Plc", sector: "Industrial", yahoo: "WAPCO.LG", twelve: "WAPCO", sharesOutstanding: 16_107_472_676 },
  { ticker: "GEREGU", name: "Geregu Power Plc", sector: "Industrial", yahoo: "GEREGU.LG", twelve: "GEREGU", sharesOutstanding: 2_500_000_000 },
  { ticker: "TRANSCORP", name: "Transcorp Plc", sector: "Industrial", yahoo: "TRANSCORP.LG", twelve: "TRANSCORP", sharesOutstanding: 10_166_667_633 },
  { ticker: "GTCO", name: "GTCO Plc", sector: "Banking", yahoo: "GTCO.LG", twelve: "GTCO", sharesOutstanding: 29_431_179_224 },
  { ticker: "ZENITHBANK", name: "Zenith Bank Plc", sector: "Banking", yahoo: "ZENITHBANK.LG", twelve: "ZENITHBANK", sharesOutstanding: 31_396_493_787 },
  { ticker: "ACCESSCORP", name: "Access Holdings Plc", sector: "Banking", yahoo: "ACCESSCORP.LG", twelve: "ACCESSCORP", sharesOutstanding: 35_545_225_622 },
  { ticker: "UBA", name: "United Bank for Africa Plc", sector: "Banking", yahoo: "UBA.LG", twelve: "UBA", sharesOutstanding: 34_199_421_366 },
  { ticker: "STANBIC", name: "Stanbic IBTC Holdings Plc", sector: "Banking", yahoo: "STANBIC.LG", twelve: "STANBIC", sharesOutstanding: 12_956_624_788 },
  { ticker: "FIDELITYBK", name: "Fidelity Bank Plc", sector: "Banking", yahoo: "FIDELITYBK.LG", twelve: "FIDELITYBK", sharesOutstanding: 32_000_000_000 },
  { ticker: "FCMB", name: "FCMB Group Plc", sector: "Banking", yahoo: "FCMB.LG", twelve: "FCMB", sharesOutstanding: 19_802_710_754 },
  { ticker: "MTNN", name: "MTN Nigeria Communications Plc", sector: "Telecoms", yahoo: "MTNN.LG", twelve: "MTNN", sharesOutstanding: 20_354_513_050 },
  { ticker: "AIRTELAFRI", name: "Airtel Africa Plc", sector: "Telecoms", yahoo: "AIRTELAFRI.LG", twelve: "AIRTELAFRI", sharesOutstanding: 3_758_151_504 },
  { ticker: "SEPLAT", name: "Seplat Energy Plc", sector: "Oil & Gas", yahoo: "SEPLAT.LG", twelve: "SEPLAT", sharesOutstanding: 588_444_561 },
  { ticker: "TOTAL", name: "TotalEnergies Marketing Nigeria Plc", sector: "Oil & Gas", yahoo: "TOTAL.LG", twelve: "TOTAL", sharesOutstanding: 339_521_837 },
  { ticker: "NESTLE", name: "Nestlé Nigeria Plc", sector: "Consumer Goods", yahoo: "NESTLE.LG", twelve: "NESTLE", sharesOutstanding: 792_656_252 },
  { ticker: "NB", name: "Nigerian Breweries Plc", sector: "Consumer Goods", yahoo: "NB.LG", twelve: "NB", sharesOutstanding: 8_020_000_000 },
  { ticker: "DANGSUGAR", name: "Dangote Sugar Refinery Plc", sector: "Consumer Goods", yahoo: "DANGSUGAR.LG", twelve: "DANGSUGAR", sharesOutstanding: 12_146_878_706 },
  { ticker: "FLOURMILL", name: "Flour Mills of Nigeria Plc", sector: "Consumer Goods", yahoo: "FLOURMILL.LG", twelve: "FLOURMILL", sharesOutstanding: 4_100_000_000 },
  { ticker: "GUINNESS", name: "Guinness Nigeria Plc", sector: "Consumer Goods", yahoo: "GUINNESS.LG", twelve: "GUINNESS", sharesOutstanding: 2_190_382_819 },
  { ticker: "PRESCO", name: "Presco Plc", sector: "Agriculture", yahoo: "PRESCO.LG", twelve: "PRESCO", sharesOutstanding: 1_000_000_000 },
  { ticker: "OKOMUOIL", name: "Okomu Oil Palm Company Plc", sector: "Agriculture", yahoo: "OKOMUOIL.LG", twelve: "OKOMUOIL", sharesOutstanding: 953_910_000 },
  { ticker: "CUSTODIAN", name: "Custodian Investment Plc", sector: "Insurance", yahoo: "CUSTODIAN.LG", twelve: "CUSTODIAN", sharesOutstanding: 5_882_352_941 },
  { ticker: "MAYBAKER", name: "May & Baker Nigeria Plc", sector: "Healthcare", yahoo: "MAYBAKER.LG", twelve: "MAYBAKER", sharesOutstanding: 1_723_557_500 },
];

const coreTickers = new Set(NGX_UNIVERSE_CORE.map((s) => s.ticker));

export const NGX_UNIVERSE: NGXEntry[] = [
  ...NGX_UNIVERSE_CORE,
  ...NGX_UNIVERSE_EXTRA.filter((s) => !coreTickers.has(s.ticker)),
].slice(0, NGX_LISTINGS_LIMIT);

const SECTOR_PRICE_BAND: Record<Sector, [number, number]> = {
  Banking: [5, 95],
  "Oil & Gas": [12, 4200],
  "Consumer Goods": [8, 1300],
  Industrial: [0.5, 550],
  Telecoms: [180, 1900],
  Agriculture: [2, 350],
  Insurance: [0.35, 12],
  Healthcare: [2, 45],
};

function hashTicker(ticker: string): number {
  let h = 2_166_136_261;
  for (let i = 0; i < ticker.length; i++) {
    h ^= ticker.charCodeAt(i);
    h = Math.imul(h, 1_677_761_9);
  }
  return Math.abs(h >>> 0);
}

/** Deterministic reference quote when no hand-tuned baseline exists */
export function deriveBaseline(entry: NGXEntry): NGXBaseline {
  const h = hashTicker(entry.ticker);
  const [minP, maxP] = SECTOR_PRICE_BAND[entry.sector];
  const span = maxP - minP;
  const price = Math.round((minP + ((h % 10_000) / 10_000) * span) * 100) / 100;
  const changePercent = Math.round((((h >> 8) % 401) - 200) / 100 * 100) / 100;
  const change = Math.round(price * (changePercent / 100) * 100) / 100;
  const volume = 100_000 + (h % 9_900_000);
  const high52w = Math.round(price * (1.08 + ((h % 17) / 100)) * 100) / 100;
  const low52w = Math.round(price * (0.82 + ((h % 11) / 100)) * 100) / 100;
  const peRatio = Math.round((8 + (h % 22)) * 10) / 10;
  const eps = Math.round((price / peRatio) * 100) / 100;
  const dividendYield = Math.round((1 + (h % 65) / 10) * 10) / 10;

  return {
    price,
    change,
    changePercent,
    volume,
    high52w,
    low52w,
    peRatio,
    eps,
    dividendYield,
  };
}

export const SECTORS: Sector[] = [
  "Banking",
  "Oil & Gas",
  "Consumer Goods",
  "Industrial",
  "Telecoms",
  "Agriculture",
  "Insurance",
  "Healthcare",
];

export const BROKER_LINKS = [
  { name: "Stanbic IBTC", url: "https://www.stanbicibtc.com/nigeria/wealth/stockbroking", description: "Full-service stockbroking with research tools" },
  { name: "GTBank Invest", url: "https://www.gtbank.com/personal-banking/invest", description: "Trade NGX stocks via GTBank mobile app" },
  { name: "ARM Securities", url: "https://www.arm.com.ng/securities", description: "Professional brokerage and portfolio management" },
  { name: "Meristem", url: "https://www.meristemng.com/stockbroking", description: "Award-winning Nigerian stockbroker" },
  { name: "Chaka", url: "https://www.getchaka.com", description: "Digital investing platform for Nigerian stocks" },
];

export function lookupTicker(ticker: string): NGXEntry | undefined {
  const upper = ticker.toUpperCase();
  return NGX_UNIVERSE.find((s) => s.ticker === upper);
}

export function getBaseline(ticker: string): NGXBaseline | undefined {
  const key = ticker.toUpperCase();
  if (NGX_BASELINES[key]) return NGX_BASELINES[key];
  const entry = NGX_UNIVERSE.find((s) => s.ticker === key);
  return entry ? deriveBaseline(entry) : undefined;
}
