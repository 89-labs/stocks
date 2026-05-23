import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth";
import { connectMongoose } from "@/lib/db/mongoose";
import { ResearchHistory } from "@/lib/db/models";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { ticker } = await request.json();
  if (!ticker) {
    return NextResponse.json({ error: "Ticker required" }, { status: 400 });
  }

  await connectMongoose();
  await ResearchHistory.create({
    userId: session.user.id,
    ticker: String(ticker).toUpperCase(),
  });

  return NextResponse.json({ success: true });
}
