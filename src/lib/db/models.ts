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
