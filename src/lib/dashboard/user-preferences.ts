import { connectMongoose } from "@/lib/db/mongoose";
import { UserPreferences } from "@/lib/db/models";

export interface UserPrefs {
  displayName?: string;
  defaultTimeframe: "1D" | "1W" | "1M" | "3M" | "1Y";
  currencyDisplay: "NGN" | "NGN_USD";
  numberFormat: "full" | "compact";
}

const DEFAULTS: UserPrefs = {
  defaultTimeframe: "1M",
  currencyDisplay: "NGN",
  numberFormat: "full",
};

export async function getUserPreferences(userId: string): Promise<UserPrefs> {
  await connectMongoose();
  const doc = await UserPreferences.findOne({ userId }).lean();
  if (!doc) return DEFAULTS;
  return {
    displayName: doc.displayName ?? undefined,
    defaultTimeframe: (doc.defaultTimeframe as UserPrefs["defaultTimeframe"]) ?? "1M",
    currencyDisplay: (doc.currencyDisplay as UserPrefs["currencyDisplay"]) ?? "NGN",
    numberFormat: (doc.numberFormat as UserPrefs["numberFormat"]) ?? "full",
  };
}
