import express from 'express';
import cors from 'cors';
import { Bot, webhookCallback } from 'grammy';
import { createBot } from './bot.js';
import { startReminderScheduler } from './cron/reminders.js';
import { validateTelegramInitData, parseTelegramUser } from './utils/telegram-auth.js';
import { pool, db } from './db/index.js';
import { questions as seedQuestions } from './db/schema.js';
import { eq } from 'drizzle-orm';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const isProduction = process.env.NODE_ENV === 'production';

// Resolve paths for both dev and production (Railway)
const rootDir = isProduction ? join(__dirname, '../..') : join(__dirname, '../..');
const frontendDist = join(rootDir, 'frontend/dist');
const dataDir = join(rootDir, 'data');

const PORT = parseInt(process.env.PORT || '3000', 10);
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '';
const WEBHOOK_SECRET = process.env.BOT_WEBHOOK_SECRET || '';
const APP_URL = process.env.APP_URL || `http://localhost:${PORT}`;

const app = express();
app.use(cors());
app.use(express.json());

// Serve static frontend in production
if (isProduction) {
  app.use(express.static(frontendDist));
}

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Auth endpoint
app.post('/api/auth/telegram', async (req, res) => {
  const { initData } = req.body;

  if (!initData) {
    return res.status(400).json({ error: 'initData required' });
  }

  const validated = validateTelegramInitData(initData, BOT_TOKEN);
  if (!validated) {
    return res.status(401).json({ error: 'Invalid initData' });
  }

  const userData = parseTelegramUser(validated.user || '{}');
  if (!userData) {
    return res.status(400).json({ error: 'Invalid user data' });
  }

  // Upsert user
  if (pool) {
    try {
      const result = await pool.query(
        `INSERT INTO users (telegram_user_id, chat_id, first_name, username, last_seen_at)
         VALUES ($1, $2, $3, $4, NOW())
         ON CONFLICT (telegram_user_id) DO UPDATE SET last_seen_at = NOW()
         RETURNING id, telegram_user_id, first_name, username`,
        [userData.id, userData.id, userData.first_name, userData.username || null]
      );

      return res.json({
        user: result.rows[0],
      });
    } catch (err) {
      console.error('Error upserting user:', err);
      return res.status(500).json({ error: 'Database error' });
    }
  }

  // Fallback without DB
  return res.json({
    user: {
      id: userData.id,
      telegram_user_id: userData.id,
      first_name: userData.first_name,
      username: userData.username,
    },
  });
});

// Questions endpoint
app.get('/api/questions', (_req, res) => {
  // Serve questions from bundled JSON for now
  try {
    const dataPath = join(dataDir, 'questions.caba.b.starter40.es-ru.json');
    const data = readFileSync(dataPath, 'utf-8');
    res.json(JSON.parse(data));
  } catch (err) {
    res.status(500).json({ error: 'Failed to load questions' });
  }
});

// Telegram webhook
app.post('/api/telegram/webhook/:secret', async (req, res) => {
  if (req.params.secret !== WEBHOOK_SECRET) {
    return res.status(401).send('Unauthorized');
  }

  if (bot) {
    try {
      await bot.handleUpdate(req.body);
      res.status(200).send('OK');
    } catch (err) {
      console.error('Webhook handler error:', err);
      res.status(500).send('Error');
    }
  } else {
    res.status(503).send('Bot not initialized');
  }
});

// Cron endpoint for reminders (protected by CRON_SECRET)
app.post('/api/cron/send-reminders', async (req, res) => {
  const { secret } = req.query;
  if (secret !== process.env.CRON_SECRET) {
    return res.status(401).send('Unauthorized');
  }

  // Reminders run via node-cron internally, this endpoint is for external triggering
  res.json({ status: 'reminder scheduler is running' });
});

// Bot initialization
let bot: Bot | null = null;

async function seedDatabase() {
  if (!db || !pool) {
    console.log('No database connection, skipping seed');
    return;
  }

  try {
    // Load questions from JSON
    const dataPath = join(dataDir, 'questions.caba.b.starter40.es-ru.json');
    const rawQuestions = JSON.parse(readFileSync(dataPath, 'utf-8'));

    // Upsert each question
    for (const q of rawQuestions) {
      await pool.query(
        `INSERT INTO questions (id, jurisdiction, license_class, category, question_es, question_ru, type, correct_option_ids, media, source, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
         ON CONFLICT (id) DO NOTHING`,
        [
          q.id,
          q.jurisdiction || 'CABA',
          (q.license_classes || ['B'])[0],
          q.category || 'general',
          q.question || '',
          q.question_ru || '',
          q.type || 'single_choice',
          JSON.stringify(q.correct_option_ids || []),
          q.media ? JSON.stringify(q.media) : null,
          q.source ? JSON.stringify(q.source) : null,
          q.status || 'active',
        ]
      );
    }

    console.log(`Seeded ${rawQuestions.length} questions`);
  } catch (err) {
    console.error('Seed error:', err);
  }
}

async function start() {
  // Seed database
  await seedDatabase();

  // Initialize bot if token is available
  if (BOT_TOKEN) {
    bot = createBot(BOT_TOKEN, pool, APP_URL);

    if (process.env.NODE_ENV === 'production' && WEBHOOK_SECRET) {
      // Webhook mode for production
      const webhookPath = `/api/telegram/webhook/${WEBHOOK_SECRET}`;
      app.use(webhookPath, webhookCallback(bot, 'express'));
      console.log('Bot running in webhook mode');
    } else {
      // Polling mode for development
      await bot.start({
        drop_pending_updates: true,
      });
      console.log('Bot running in polling mode');
    }

    // Start reminder scheduler
    if (pool) {
      startReminderScheduler(bot, pool);
    }
  } else {
    console.warn('TELEGRAM_BOT_TOKEN not set, bot disabled');
  }

  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`App URL: ${APP_URL}`);
  });
}

start().catch(console.error);
