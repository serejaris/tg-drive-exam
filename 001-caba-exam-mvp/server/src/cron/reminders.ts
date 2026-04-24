import cron from 'node-cron';
import { Bot, InlineKeyboard } from 'grammy';
import type { Pool } from 'pg';

interface ReminderConfig {
  userId: string;
  chatId: number;
  timezone: string;
  timeLocal: string;
  firstName: string;
}

export function startReminderScheduler(bot: Bot, pool: Pool | null) {
  if (!pool) {
    console.log('No database connection, reminder scheduler disabled');
    return;
  }

  // Check every minute for users who should receive reminders
  cron.schedule('* * * * *', async () => {
    try {
      const now = new Date();
      const currentHour = now.getUTCHours();
      const currentMinute = now.getUTCMinutes();

      // Get users who should be reminded now
      const result = await pool.query<ReminderConfig>(
        `SELECT u.id as user_id, u.chat_id, u.timezone, rs.time_local, u.first_name
         FROM users u
         JOIN reminder_settings rs ON u.id = rs.user_id
         WHERE rs.enabled = true
           AND EXTRACT(HOUR FROM rs.time_local::time) = $1
           AND EXTRACT(MINUTE FROM rs.time_local::time) = $2
           AND (rs.last_sent_at IS NULL OR rs.last_sent_at < NOW() - INTERVAL '23 hours')`,
        [currentHour, currentMinute]
      );

      for (const user of result.rows) {
        try {
          const kb = new InlineKeyboard()
            .webApp('Начать тренировку', process.env.APP_URL || '')
            .row()
            .webApp('Пройти экзамен', `${process.env.APP_URL || ''}?mode=exam`);

          await bot.api.sendMessage(
            user.chatId,
            `Пора потренироваться! 🚗\n\n` +
            `Сегодня цель: 20 вопросов или 1 тестовый экзамен.\n\n` +
            `Несколько минут сегодня помогут сдать экзамен быстрее! 💪`,
            { reply_markup: kb }
          );

          // Update last_sent_at
          await pool.query(
            `UPDATE reminder_settings SET last_sent_at = NOW() WHERE user_id = $1`,
            [user.userId]
          );

          console.log(`Sent reminder to user ${user.userId}`);
        } catch (err: any) {
          // If bot can't reach user, mark them as unavailable
          if (err.error_code === 403 || err.description?.includes('blocked')) {
            await pool.query(
              `UPDATE reminder_settings SET enabled = false WHERE user_id = $1`,
              [user.userId]
            );
            console.log(`Disabled reminders for user ${user.userId} (blocked)`);
          } else {
            console.error(`Failed to send reminder to user ${user.userId}:`, err);
          }
        }
      }
    } catch (err) {
      console.error('Reminder scheduler error:', err);
    }
  });

  console.log('Reminder scheduler started');
}
