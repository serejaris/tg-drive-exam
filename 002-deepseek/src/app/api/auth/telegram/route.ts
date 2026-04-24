import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { v4 as uuid } from "uuid";
import { validateInitData } from "@/lib/telegram-auth";
import { db } from "@/lib/db";
import { users, reminderSettings } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { initData } = body;

    if (!initData) {
      return NextResponse.json({ error: "Missing initData" }, { status: 400 });
    }

    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    if (!botToken) {
      return NextResponse.json({ error: "Server config error" }, { status: 500 });
    }

    const parsed = validateInitData(initData, botToken);

    // Upsert user
    const existingUser = await db.query.users.findFirst({
      where: eq(users.telegramUserId, parsed.user.id),
    });

    let userId: string;
    if (existingUser) {
      userId = existingUser.id;
      await db
        .update(users)
        .set({
          firstName: parsed.user.first_name || existingUser.firstName,
          username: parsed.user.username || existingUser.username,
          lastSeenAt: new Date(),
        })
        .where(eq(users.id, userId));
    } else {
      userId = uuid();
      await db.insert(users).values({
        id: userId,
        telegramUserId: parsed.user.id,
        chatId: parsed.user.id, // chat_id = user_id in Mini App context
        username: parsed.user.username || null,
        firstName: parsed.user.first_name || null,
      });

      // Create default reminder settings
      await db.insert(reminderSettings).values({
        id: uuid(),
        userId,
      });
    }

    // Set session cookie
    const cookieStore = await cookies();
    cookieStore.set("session", userId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 30 * 24 * 60 * 60, // 30 days
    });

    return NextResponse.json({ ok: true, userId });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Auth failed";
    return NextResponse.json({ error: message }, { status: 401 });
  }
}
