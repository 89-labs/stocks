import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth";
import { connectMongoose } from "@/lib/db/mongoose";
import { Transaction } from "@/lib/db/models";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { ticker, type, quantity, price, fees, date } = await request.json();

  if (!ticker || !type || !quantity || !price || !date) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }
  if (type !== "BUY" && type !== "SELL") {
    return NextResponse.json({ error: "Invalid transaction type" }, { status: 400 });
  }

  await connectMongoose();
  const tx = await Transaction.create({
    userId: session.user.id,
    ticker: String(ticker).toUpperCase(),
    type,
    quantity: Number(quantity),
    price: Number(price),
    fees: Number(fees || 0),
    date: new Date(date),
  });

  return NextResponse.json(tx);
}
