import { pgTable, text, uuid, integer, boolean, timestamp, jsonb, bigint, primaryKey } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  telegramUserId: bigint('telegram_user_id', { mode: 'number' }).unique().notNull(),
  chatId: bigint('chat_id', { mode: 'number' }).notNull(),
  username: text('username'),
  firstName: text('first_name'),
  timezone: text('timezone').default('America/Argentina/Buenos_Aires'),
  languageMode: text('language_mode').default('es_ru'),
  createdAt: timestamp('created_at').defaultNow(),
  lastSeenAt: timestamp('last_seen_at').defaultNow(),
});

export const reminderSettings = pgTable('reminder_settings', {
  userId: uuid('user_id').primaryKey().references(() => users.id),
  enabled: boolean('enabled').default(true),
  timeLocal: text('time_local').default('09:00'),
  timezone: text('timezone').default('America/Argentina/Buenos_Aires'),
  lastSentAt: timestamp('last_sent_at'),
});

export const questions = pgTable('questions', {
  id: text('id').primaryKey(),
  jurisdiction: text('jurisdiction'),
  licenseClass: text('license_class'),
  category: text('category'),
  questionEs: text('question_es').notNull(),
  questionRu: text('question_ru'),
  type: text('type').default('single_choice'),
  correctOptionIds: jsonb('correct_option_ids').$type<string[]>().notNull(),
  media: jsonb('media'),
  explanationRu: text('explanation_ru'),
  source: jsonb('source'),
  status: text('status').default('active'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const quizSessions = pgTable('quiz_sessions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id),
  mode: text('mode').notNull(),
  status: text('status').default('active'),
  questionIds: jsonb('question_ids').$type<string[]>(),
  currentIndex: integer('current_index').default(0),
  score: integer('score').default(0),
  total: integer('total'),
  startedAt: timestamp('started_at').defaultNow(),
  completedAt: timestamp('completed_at'),
});

export const attempts = pgTable('attempts', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id),
  sessionId: uuid('session_id').references(() => quizSessions.id),
  questionId: text('question_id').references(() => questions.id),
  selectedOptionIds: jsonb('selected_option_ids').$type<string[]>(),
  isCorrect: boolean('is_correct'),
  answeredAt: timestamp('answered_at').defaultNow(),
});

export const userQuestionStats = pgTable('user_question_stats', {
  userId: uuid('user_id').references(() => users.id),
  questionId: text('question_id').references(() => questions.id),
  attemptsCount: integer('attempts_count').default(0),
  correctCount: integer('correct_count').default(0),
  wrongCount: integer('wrong_count').default(0),
  correctStreak: integer('correct_streak').default(0),
  lastAnsweredAt: timestamp('last_answered_at'),
  status: text('status').default('new'),
}, (t) => ({
  pk: primaryKey({ columns: [t.userId, t.questionId] }),
}));
