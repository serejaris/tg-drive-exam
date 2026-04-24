import { NextRequest, NextResponse } from "next/server";
import { getUserId } from "@/lib/get-user-id";
import { db } from "@/lib/db";
import { reminderSettings, users } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { getCurrentHourLocal } from "@/lib/utils";

export async function POST(request: NextRequest) {
  try {
    // Validate cron secret
    const secret = request.headers.get("x-cron-secret") || request.headers.get("X-Cron-Secret");
    if (secret !== process.env.CRON_SECRET) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const webappUrl = process.env.WEBAPP_URL;

    if (!botToken || !webappUrl) {
      return NextResponse.json({ error: "Server config error" }, { status: 500 });
    }

    // Get all enabled reminder settings
    const allReminders = await db.query.reminderSettings.findMany({
      where: eq(reminderSettings.enabled, true),
      with: { user: true },
    });

    const results: { ok: boolean; chatId: number; error?: string }[] = [];

    for (const reminder of allReminders) {
      if (!reminder.user) continue;

      // Check if it's time to send (match the hour)
      const currentHour = getCurrentHourLocal(reminder.timezone);
      const reminderHour = parseInt(reminder.timeLocal.split(":")[0], 10);

      if (currentHour !== reminderHour) continue;

      try {
        const text = "🚗 Пора потренироваться!\nСегодня цель: 20 вопросов или 1 тестовый экзамен.";

        const keyboard = {
          inline_keyboard: [
            [
              {
                text: "Начать тренировку",
                web_app: { url: `${webappUrl}?mode=practice` },
              },
              {
                text: "Пройти экзамен",
                web_app: { url: `${webappUrl}?mode=exam` },
              },
            ],
          ],
        };

        const tgResponse = await fetch(
          `https://api.telegram.org/bot${botToken}/sendMessage`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              chat_id: reminder.user.chatId,
              text,
              reply_markup: keyboard,
            }),
          }
        );

        const tgData = await tgResponse.json();

        if (tgData.ok) {
          await db
            .update(reminderSettings)
            .set({ lastSentAt: new Date() })
            .where(eq(reminderSettings.id, reminder.id));

          results.push({ ok: true, chatId: reminder.user.chatId });
        } else {
          results.push({
            ok: false,
            chatId: reminder.user.chatId,
            error: tgData.description || "Unknown error",
          });
        }
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : "Send failed";
        results.push({ ok: false, chatId: reminder.user.chatId, error: msg });
      }
    }

    return NextResponse.json({
      data: { sent: results.filter((r) => r.ok).length, total: results.length, results },
    });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Failed to send reminders";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
