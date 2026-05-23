import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth";
import { connectMongoose } from "@/lib/db/mongoose";
import { SavedBrief } from "@/lib/db/models";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { content } = await request.json();
  if (!content) {
    return NextResponse.json({ error: "Content required" }, { status: 400 });
  }

  await connectMongoose();
  const brief = await SavedBrief.create({
    userId: session.user.id,
    content,
  });

  return NextResponse.json(brief);
}
