import { NextResponse } from "next/server";
import { registerAppUser } from "@/lib/auth/app-user";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = await registerAppUser(body);

    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      ok: true,
      user: { id: result.user.id, username: result.user.name, email: result.user.email },
    });
  } catch (err) {
    console.error("[NaijaStocks] register error:", err);
    return NextResponse.json(
      { error: "Could not create account. Please try again." },
      { status: 500 }
    );
  }
}
