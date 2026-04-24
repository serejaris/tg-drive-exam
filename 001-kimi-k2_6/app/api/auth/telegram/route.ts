import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { validateInitData, parseInitData } from "@/lib/telegram-auth";

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN!;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { initData } = body;

    if (!initData || !validateInitData(initData, BOT_TOKEN)) {
      return NextResponse.json({ error: "Invalid initData" }, { status: 401 });
    }

    const parsed = parseInitData(initData);
    const userJson = parsed["user"];
    if (!userJson) {
      return NextResponse.json({ error: "No user data" }, { status: 400 });
    }

    const tgUser = JSON.parse(decodeURIComponent(userJson));
    const telegramUserId = BigInt(tgUser.id);
    const chatId = BigInt(tgUser.id);

    const user = await prisma.user.upsert({
      where: { telegramUserId },
      update: {
        username: tgUser.username ?? null,
        firstName: tgUser.first_name ?? null,
        lastSeenAt: new Date(),
      },
      create: {
        telegramUserId,
        chatId,
        username: tgUser.username ?? null,
        firstName: tgUser.first_name ?? null,
      },
    });

    await prisma.reminderSetting.upsert({
      where: { userId: user.id },
      update: {},
      create: {
        userId: user.id,
        enabled: true,
        timeLocal: "09:00",
        timezone: "America/Argentina/Buenos_Aires",
      },
    });

    const resp = NextResponse.json({ ok: true, userId: user.id });
    resp.cookies.set("session", user.id, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });
    return resp;
  } catch (e) {
    console.error("Auth error:", e);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
