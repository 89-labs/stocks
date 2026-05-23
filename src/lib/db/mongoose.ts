import mongoose from "mongoose";

declare global {
  var __mongoose: { conn: typeof mongoose | null; promise: Promise<typeof mongoose> | null } | undefined;
}

const cached =
  global.__mongoose ?? (global.__mongoose = { conn: null, promise: null });

export async function connectMongoose(): Promise<typeof mongoose> {
  if (cached.conn) return cached.conn;

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error("MONGODB_URI environment variable is not set");
  }

  if (!cached.promise) {
    cached.promise = mongoose
      .connect(uri, {
        bufferCommands: false,
        dbName: process.env.MONGODB_DB || "naijastocks",
      })
      .then((m) => m);
  }

  cached.conn = await cached.promise;
  return cached.conn;
}
