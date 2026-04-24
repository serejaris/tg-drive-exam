import { Bot, InlineKeyboard } from 'grammy';
import type { Pool } from 'pg';

export function createBot(token: string, pool: Pool | null, appUrl: string) {
  const bot = new Bot(token);

  // /start command
  bot.command('start', async (ctx) => {
    const userId = ctx.from?.id;
    const firstName = ctx.from?.first_name || 'друг';
    const chatId = ctx.chat.id;

    // Save user to DB if pool available
    if (pool) {
      try {
        await pool.query(
          `INSERT INTO users (telegram_user_id, chat_id, first_name, username, last_seen_at)
           VALUES ($1, $2, $3, $4, NOW())
           ON CONFLICT (telegram_user_id) DO UPDATE SET last_seen_at = NOW()`,
          [userId, chatId, firstName, ctx.from?.username || null]
        );

        // Create reminder settings if not exists
        await pool.query(
          `INSERT INTO reminder_settings (user_id, enabled, time_local, timezone)
           SELECT id, true, '09:00', 'America/Argentina/Buenos_Aires'
           FROM users WHERE telegram_user_id = $1
           ON CONFLICT (user_id) DO NOTHING`,
          [userId]
        );
      } catch (err) {
        console.error('Error saving user:', err);
      }
    }

    const kb = new InlineKeyboard()
      .webApp('Начать тренировку', appUrl)
      .row()
      .webApp('Пройти экзамен', `${appUrl}?mode=exam`);

    await ctx.reply(
      `Привет, ${firstName}! 👋\n\n` +
      `Это приложение поможет тебе подготовиться к теоретическому экзамену на права в CABA (категория B).\n\n` +
      `• 40 вопросов с переводом на русский\n` +
      `• Режим практики с подсказками\n` +
      `• Полная симуляция экзамена\n` +
      `• Повторение ошибок для запоминания`,
      { reply_markup: kb }
    );
  });

  // /practice command
  bot.command('practice', async (ctx) => {
    const kb = new InlineKeyboard().webApp('Начать тренировку', appUrl);
    await ctx.reply('Давай потренируемся! 📝', { reply_markup: kb });
  });

  // /exam command
  bot.command('exam', async (ctx) => {
    const kb = new InlineKeyboard().webApp('Пройти экзамен', `${appUrl}?mode=exam`);
    await ctx.reply('Время экзамена! 🎓 Удачи!', { reply_markup: kb });
  });

  // /settings command
  bot.command('settings', async (ctx) => {
    const kb = new InlineKeyboard().webApp('Настройки', `${appUrl}?screen=settings`);
    await ctx.reply('Открой настройки:', { reply_markup: kb });
  });

  // /status command
  bot.command('status', async (ctx) => {
    const userId = ctx.from?.id;

    if (pool && userId) {
      try {
        const result = await pool.query(
          `SELECT COUNT(*) as total_attempts,
                  COUNT(*) FILTER (WHERE passed = true) as passed_attempts
           FROM (
             SELECT qs.*,
                    CASE WHEN qs.score * 1.0 / NULLIF(qs.total, 0) >= 0.75 THEN true ELSE false END as passed
             FROM quiz_sessions qs
             JOIN users u ON qs.user_id = u.id
             WHERE u.telegram_user_id = $1 AND qs.status = 'completed'
           ) stats`,
          [userId]
        );

        const row = result.rows[0];
        if (row && parseInt(row.total_attempts) > 0) {
          const accuracy = Math.round(
            (parseInt(row.passed_attempts) / parseInt(row.total_attempts)) * 100
          );
          await ctx.reply(
            `📊 Твой прогресс:\n` +
            `• Попыток: ${row.total_attempts}\n` +
            `• Сдано: ${row.passed_attempts} (${accuracy}%)\n` +
            `• Порог сдачи: 75%`
          );
          return;
        }
      } catch (err) {
        console.error('Error fetching status:', err);
      }
    }

    await ctx.reply('Пока нет данных. Пройди тренировку или экзамен! 📝');
  });

  // Error handler
  bot.catch((err) => {
    console.error('Bot error:', err);
  });

  return bot;
}
