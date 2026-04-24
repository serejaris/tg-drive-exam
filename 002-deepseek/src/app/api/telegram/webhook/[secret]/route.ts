import { NextRequest, NextResponse } from "next/server";
import { bot } from "@/lib/bot";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ secret: string }> }
) {
  try {
    const { secret } = await params;
    const expectedSecret = process.env.BOT_WEBHOOK_SECRET;

    if (secret !== expectedSecret) {
      return NextResponse.json({ error: "Invalid secret" }, { status: 401 });
    }

    const body = await request.json();
    await bot.handleUpdate(body);

    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Webhook error";
    console.error("Webhook error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
