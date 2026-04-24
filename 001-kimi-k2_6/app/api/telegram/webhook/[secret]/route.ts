import { NextRequest, NextResponse } from "next/server";
import { Telegraf } from "telegraf";

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN ?? "");

bot.command("start", async (ctx) => {
  const user = ctx.from;
  if (!user) return;

  const webappUrl = process.env.WEBAPP_URL ?? "";

  await ctx.reply(
    `Привет${user.first_name ? ", " + user.first_name : ""}! 🚗\n\n` +
      `Это тренажёр для подготовки к теоретическому экзамену на права CABA (категория B).\n` +
      `Вопросы на испанском с русским переводом.`,
    {
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: "Открыть тренировку",
              web_app: { url: webappUrl },
            },
          ],
        ],
      },
    }
  );
});

bot.command("practice", async (ctx) => {
  const webappUrl = process.env.WEBAPP_URL ?? "";
  await ctx.reply("Тренировка", {
    reply_markup: {
      inline_keyboard: [
        [
          {
            text: "Начать тренировку",
            web_app: { url: webappUrl + "?mode=practice" },
          },
        ],
      ],
    },
  });
});

bot.command("exam", async (ctx) => {
  const webappUrl = process.env.WEBAPP_URL ?? "";
  await ctx.reply("Экзамен", {
    reply_markup: {
      inline_keyboard: [
        [
          {
            text: "Пройти экзамен",
            web_app: { url: webappUrl + "?mode=exam" },
          },
        ],
      ],
    },
  });
});

bot.command("settings", async (ctx) => {
  const webappUrl = process.env.WEBAPP_URL ?? "";
  await ctx.reply("Настройки", {
    reply_markup: {
      inline_keyboard: [
        [
          {
            text: "Открыть настройки",
            web_app: { url: webappUrl + "?mode=settings" },
          },
        ],
      ],
    },
  });
});

bot.command("status", async (ctx) => {
  // Quick status without DB for now
  await ctx.reply("Статус:\n• Сегодня решено: —\n• Точность: —\n• Streak: —\n\nОткройте приложение для подробной статистики.");
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ secret: string }> }
) {
  const { secret } = await params;
  const expected = process.env.BOT_WEBHOOK_SECRET ?? "";
  if (secret !== expected) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await request.json();
    await bot.handleUpdate(body);
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("Webhook error:", e);
    return NextResponse.json({ ok: true });
  }
}
