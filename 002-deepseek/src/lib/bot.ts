import { Bot, InlineKeyboard } from "grammy";

const webappUrl = process.env.WEBAPP_URL || "http://localhost:3000";

export const bot = new Bot(process.env.TELEGRAM_BOT_TOKEN || "placeholder");

// /start
bot.command("start", async (ctx) => {
  const name = ctx.from?.first_name || "друг";

  const keyboard = new InlineKeyboard().webApp(
    "Открыть тренировку",
    webappUrl
  );

  await ctx.reply(
    `Привет, ${name}!\n\n` +
      `Этот бот поможет подготовиться к теоретическому экзамену на права в CABA (Аргентина), категория B.\n\n` +
      `Что здесь есть:\n` +
      `• Тренировка — режим с подсказками после каждого вопроса\n` +
      `• Экзамен — симуляция реального теста (40 вопросов, результат в конце)\n` +
      `• Повторение ошибок — только те вопросы, где ошибался\n` +
      `• Ежедневные напоминания — чтобы не забывать заниматься\n\n` +
      `Все вопросы на испанском и русском.`,
    { reply_markup: keyboard }
  );
});

// /practice
bot.command("practice", async (ctx) => {
  const keyboard = new InlineKeyboard().webApp(
    "Тренировка",
    `${webappUrl}?mode=practice`
  );
  await ctx.reply("Режим тренировки — ответы проверяются сразу после выбора.", {
    reply_markup: keyboard,
  });
});

// /exam
bot.command("exam", async (ctx) => {
  const keyboard = new InlineKeyboard().webApp(
    "Экзамен",
    `${webappUrl}?mode=exam`
  );
  await ctx.reply(
    "Режим экзамена — 40 вопросов, результат показывается в конце.",
    { reply_markup: keyboard }
  );
});

// /settings
bot.command("settings", async (ctx) => {
  const keyboard = new InlineKeyboard().webApp(
    "Настройки",
    `${webappUrl}?mode=settings`
  );
  await ctx.reply("Настройки приложения.", { reply_markup: keyboard });
});

// /status
bot.command("status", async (ctx) => {
  await ctx.reply(
    "Статус: бот работает.\n" +
      "Откройте мини-приложение для просмотра персональной статистики — там же есть кнопка статуса на главном экране."
  );
});
