import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  const auth = request.headers.get("x-cron-secret");
  if (auth !== (process.env.CRON_SECRET ?? "")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const now = new Date();
  const currentHour = String(now.getHours()).padStart(2, "0") + ":00";

  const reminders = await prisma.reminderSetting.findMany({
    where: {
      enabled: true,
      timeLocal: currentHour,
    },
    include: { user: true },
  });

  const results: { ok: boolean; chatId?: bigint; error?: string }[] = [];

  for (const r of reminders) {
    if (!r.user) continue;
    try {
      const res = await fetch(
        `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: Number(r.user.chatId),
            text:
              `Пора потренироваться 🚗\n` +
              `Сегодня цель: 20 вопросов или 1 тестовый экзамен.`,
            reply_markup: {
              inline_keyboard: [
                [
                  {
                    text: "Начать тренировку",
                    web_app: { url: process.env.WEBAPP_URL ?? "" },
                  },
                ],
                [
                  {
                    text: "Пройти экзамен",
                    web_app: {
                      url: (process.env.WEBAPP_URL ?? "") + "?mode=exam",
                    },
                  },
                ],
              ],
            },
          }),
        }
      );

      if (res.ok) {
        await prisma.reminderSetting.update({
          where: { id: r.id },
          data: { lastSentAt: now },
        });
        results.push({ ok: true, chatId: r.user.chatId });
      } else {
        const err = await res.text();
        results.push({ ok: false, chatId: r.user.chatId, error: err });
      }
    } catch (e: any) {
      results.push({ ok: false, chatId: r.user.chatId, error: e.message });
    }
  }

  return NextResponse.json({ sent: results.length, results });
}
