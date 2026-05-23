import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth";
import { connectMongoose } from "@/lib/db/mongoose";
import { Watchlist } from "@/lib/db/models";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { name } = await request.json();
  if (!name) {
    return NextResponse.json({ error: "Name required" }, { status: 400 });
  }

  await connectMongoose();
  const wl = await Watchlist.create({ userId: session.user.id, name, items: [] });
  return NextResponse.json(wl);
}

export async function PUT(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { watchlistId, ticker } = await request.json();
  if (!watchlistId || !ticker) {
    return NextResponse.json({ error: "watchlistId and ticker required" }, { status: 400 });
  }

  await connectMongoose();
  const updated = await Watchlist.findOneAndUpdate(
    { _id: watchlistId, userId: session.user.id },
    { $addToSet: { items: { ticker: String(ticker).toUpperCase() } } },
    { new: true }
  );

  if (!updated) {
    return NextResponse.json({ error: "Watchlist not found" }, { status: 404 });
  }
  return NextResponse.json(updated);
}
