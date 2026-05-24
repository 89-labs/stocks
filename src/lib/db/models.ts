import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

const WatchlistItemSchema = new Schema(
  {
    ticker: { type: String, required: true, uppercase: true, trim: true },
    addedAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

const WatchlistSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    userId: { type: String, required: true, index: true },
    items: { type: [WatchlistItemSchema], default: [] },
  },
  { timestamps: true }
);

const TransactionSchema = new Schema(
  {
    userId: { type: String, required: true, index: true },
    ticker: { type: String, required: true, uppercase: true, trim: true },
    type: { type: String, required: true, enum: ["BUY", "SELL"] },
    quantity: { type: Number, required: true, min: 0 },
    price: { type: Number, required: true, min: 0 },
    fees: { type: Number, default: 0, min: 0 },
    date: { type: Date, required: true },
    notes: { type: String },
  },
  { timestamps: true }
);

const ResearchHistorySchema = new Schema(
  {
    userId: { type: String, required: true, index: true },
    ticker: { type: String, required: true, uppercase: true, trim: true },
    visitedAt: { type: Date, default: Date.now },
  },
  { timestamps: false }
);
ResearchHistorySchema.index({ userId: 1, visitedAt: -1 });

const SavedBriefSchema = new Schema(
  {
    userId: { type: String, required: true, index: true },
    content: { type: Schema.Types.Mixed, required: true },
    date: { type: Date, default: Date.now },
  },
  { timestamps: false }
);

export type WatchlistDoc = InferSchemaType<typeof WatchlistSchema> & { _id: mongoose.Types.ObjectId };
export type TransactionDoc = InferSchemaType<typeof TransactionSchema> & { _id: mongoose.Types.ObjectId };
export type ResearchHistoryDoc = InferSchemaType<typeof ResearchHistorySchema> & { _id: mongoose.Types.ObjectId };
export type SavedBriefDoc = InferSchemaType<typeof SavedBriefSchema> & { _id: mongoose.Types.ObjectId };

export const Watchlist: Model<WatchlistDoc> =
  (mongoose.models.Watchlist as Model<WatchlistDoc>) ||
  mongoose.model<WatchlistDoc>("Watchlist", WatchlistSchema);

export const Transaction: Model<TransactionDoc> =
  (mongoose.models.Transaction as Model<TransactionDoc>) ||
  mongoose.model<TransactionDoc>("Transaction", TransactionSchema);

export const ResearchHistory: Model<ResearchHistoryDoc> =
  (mongoose.models.ResearchHistory as Model<ResearchHistoryDoc>) ||
  mongoose.model<ResearchHistoryDoc>("ResearchHistory", ResearchHistorySchema);

export const SavedBrief: Model<SavedBriefDoc> =
  (mongoose.models.SavedBrief as Model<SavedBriefDoc>) ||
  mongoose.model<SavedBriefDoc>("SavedBrief", SavedBriefSchema);

const UserPreferencesSchema = new Schema(
  {
    userId: { type: String, required: true, unique: true, index: true },
    displayName: { type: String, trim: true },
    defaultTimeframe: {
      type: String,
      enum: ["1D", "1W", "1M", "3M", "1Y"],
      default: "1M",
    },
    currencyDisplay: { type: String, enum: ["NGN", "NGN_USD"], default: "NGN" },
    numberFormat: { type: String, enum: ["full", "compact"], default: "full" },
  },
  { timestamps: true }
);

const AiScreenSchema = new Schema(
  {
    userId: { type: String, required: true, index: true },
    query: { type: String, required: true, trim: true },
    ranAt: { type: Date, default: Date.now },
  },
  { timestamps: false }
);
AiScreenSchema.index({ userId: 1, ranAt: -1 });

export type UserPreferencesDoc = InferSchemaType<typeof UserPreferencesSchema> & {
  _id: mongoose.Types.ObjectId;
};
export type AiScreenDoc = InferSchemaType<typeof AiScreenSchema> & { _id: mongoose.Types.ObjectId };

export const UserPreferences: Model<UserPreferencesDoc> =
  (mongoose.models.UserPreferences as Model<UserPreferencesDoc>) ||
  mongoose.model<UserPreferencesDoc>("UserPreferences", UserPreferencesSchema);

export const AiScreen: Model<AiScreenDoc> =
  (mongoose.models.AiScreen as Model<AiScreenDoc>) ||
  mongoose.model<AiScreenDoc>("AiScreen", AiScreenSchema);

const DailyStockResearchSchema = new Schema(
  {
    ticker: { type: String, required: true, uppercase: true, trim: true },
    /** Calendar day (Africa/Lagos) the analysis applies to — YYYY-MM-DD */
    analysisDate: { type: String, required: true, trim: true },
    companyName: { type: String, trim: true },
    status: {
      type: String,
      required: true,
      enum: ["generating", "complete", "failed"],
      default: "generating",
    },
    research: { type: Schema.Types.Mixed },
    generatedAt: { type: Date },
    lockExpiresAt: { type: Date },
    errorMessage: { type: String },
  },
  { timestamps: true }
);
DailyStockResearchSchema.index({ ticker: 1, analysisDate: 1 }, { unique: true });
DailyStockResearchSchema.index({ analysisDate: 1, status: 1 });

export type DailyStockResearchDoc = InferSchemaType<typeof DailyStockResearchSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const DailyStockResearch: Model<DailyStockResearchDoc> =
  (mongoose.models.DailyStockResearch as Model<DailyStockResearchDoc>) ||
  mongoose.model<DailyStockResearchDoc>("DailyStockResearch", DailyStockResearchSchema);

const DailyMarketBriefSchema = new Schema(
  {
    /** Calendar day (Africa/Lagos) — YYYY-MM-DD; one shared brief per day */
    analysisDate: { type: String, required: true, trim: true, unique: true },
    status: {
      type: String,
      required: true,
      enum: ["generating", "complete", "failed"],
      default: "generating",
    },
    brief: { type: String },
    generatedAt: { type: Date },
    lockExpiresAt: { type: Date },
    errorMessage: { type: String },
  },
  { timestamps: true }
);
DailyMarketBriefSchema.index({ analysisDate: 1, status: 1 });

export type DailyMarketBriefDoc = InferSchemaType<typeof DailyMarketBriefSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const DailyMarketBrief: Model<DailyMarketBriefDoc> =
  (mongoose.models.DailyMarketBrief as Model<DailyMarketBriefDoc>) ||
  mongoose.model<DailyMarketBriefDoc>("DailyMarketBrief", DailyMarketBriefSchema);
