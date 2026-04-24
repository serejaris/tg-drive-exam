import {
  pgTable,
  text,
  integer,
  boolean,
  timestamp,
  jsonb,
  pgEnum,
  uniqueIndex,
  primaryKey,
  bigint,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// --- Enums ---

export const languageModeEnum = pgEnum("language_mode", [
  "es_ru",
  "es_only",
  "ru_only",
]);

export const questionTypeEnum = pgEnum("question_type", [
  "single_choice",
  "multiple_choice",
  "true_false",
]);

export const sessionModeEnum = pgEnum("session_mode", [
  "practice",
  "exam",
  "mistakes",
]);

export const sessionStatusEnum = pgEnum("session_status", [
  "active",
  "completed",
  "abandoned",
]);

export const statStatusEnum = pgEnum("stat_status", [
  "new",
  "learning",
  "mastered",
  "weak",
]);

// --- Tables ---

export const users = pgTable(
  "users",
  {
    id: text("id").primaryKey(),
    telegramUserId: bigint("telegram_user_id", { mode: "number" }).notNull().unique(),
    chatId: bigint("chat_id", { mode: "number" }).notNull(),
    username: text("username"),
    firstName: text("first_name"),
    timezone: text("timezone").notNull().default("America/Argentina/Buenos_Aires"),
    languageMode: languageModeEnum("language_mode").notNull().default("es_ru"),
    examQuestionCount: integer("exam_question_count").notNull().default(40),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    lastSeenAt: timestamp("last_seen_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("users_telegram_user_id_idx").on(t.telegramUserId)],
);

export const reminderSettings = pgTable("reminder_settings", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .unique()
    .references(() => users.id, { onDelete: "cascade" }),
  enabled: boolean("enabled").notNull().default(true),
  timeLocal: text("time_local").notNull().default("09:00"),
  timezone: text("timezone").notNull().default("America/Argentina/Buenos_Aires"),
  lastSentAt: timestamp("last_sent_at", { withTimezone: true }),
});

export const questions = pgTable("questions", {
  id: text("id").primaryKey(),
  jurisdiction: text("jurisdiction").notNull(),
  licenseClass: text("license_class").notNull(),
  category: text("category").notNull(),
  questionEs: text("question_es").notNull(),
  questionRu: text("question_ru").notNull(),
  type: questionTypeEnum("type").notNull().default("single_choice"),
  correctOptionIds: jsonb("correct_option_ids").$type<string[]>().notNull(),
  media: jsonb("media").$type<{ type: string; url: string } | null>(),
  explanationRu: text("explanation_ru"),
  source: jsonb("source").$type<{
    title?: string;
    url?: string;
    retrieved_at?: string;
  }>().notNull(),
  status: text("status").notNull().default("manual_review_required"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const questionOptions = pgTable("question_options", {
  id: text("id").primaryKey(),
  questionId: text("question_id")
    .notNull()
    .references(() => questions.id, { onDelete: "cascade" }),
  optionId: text("option_id").notNull(),
  textEs: text("text_es").notNull(),
  textRu: text("text_ru").notNull(),
  sortOrder: integer("sort_order").notNull(),
});

export const quizSessions = pgTable("quiz_sessions", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  mode: sessionModeEnum("mode").notNull(),
  status: sessionStatusEnum("status").notNull().default("active"),
  questionIds: jsonb("question_ids").$type<string[]>().notNull(),
  currentIndex: integer("current_index").notNull().default(0),
  score: integer("score").notNull().default(0),
  total: integer("total").notNull(),
  startedAt: timestamp("started_at", { withTimezone: true }).notNull().defaultNow(),
  completedAt: timestamp("completed_at", { withTimezone: true }),
});

export const attempts = pgTable("attempts", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  sessionId: text("session_id")
    .notNull()
    .references(() => quizSessions.id, { onDelete: "cascade" }),
  questionId: text("question_id")
    .notNull()
    .references(() => questions.id, { onDelete: "cascade" }),
  selectedOptionIds: jsonb("selected_option_ids").$type<string[]>().notNull(),
  isCorrect: boolean("is_correct").notNull(),
  answeredAt: timestamp("answered_at", { withTimezone: true }).notNull().defaultNow(),
});

export const userQuestionStats = pgTable(
  "user_question_stats",
  {
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    questionId: text("question_id")
      .notNull()
      .references(() => questions.id, { onDelete: "cascade" }),
    attemptsCount: integer("attempts_count").notNull().default(0),
    correctCount: integer("correct_count").notNull().default(0),
    wrongCount: integer("wrong_count").notNull().default(0),
    correctStreak: integer("correct_streak").notNull().default(0),
    lastAnsweredAt: timestamp("last_answered_at", { withTimezone: true }),
    status: statStatusEnum("status").notNull().default("new"),
  },
  (t) => [primaryKey({ columns: [t.userId, t.questionId] })],
);

// --- Relations ---

export const usersRelations = relations(users, ({ one, many }) => ({
  reminderSetting: one(reminderSettings, {
    fields: [users.id],
    references: [reminderSettings.userId],
  }),
  quizSessions: many(quizSessions),
  attempts: many(attempts),
  questionStats: many(userQuestionStats),
}));

export const reminderSettingsRelations = relations(reminderSettings, ({ one }) => ({
  user: one(users, {
    fields: [reminderSettings.userId],
    references: [users.id],
  }),
}));

export const questionsRelations = relations(questions, ({ many }) => ({
  options: many(questionOptions),
  attempts: many(attempts),
  stats: many(userQuestionStats),
}));

export const questionOptionsRelations = relations(questionOptions, ({ one }) => ({
  question: one(questions, {
    fields: [questionOptions.questionId],
    references: [questions.id],
  }),
}));

export const quizSessionsRelations = relations(quizSessions, ({ one, many }) => ({
  user: one(users, {
    fields: [quizSessions.userId],
    references: [users.id],
  }),
  attempts: many(attempts),
}));

export const attemptsRelations = relations(attempts, ({ one }) => ({
  user: one(users, {
    fields: [attempts.userId],
    references: [users.id],
  }),
  session: one(quizSessions, {
    fields: [attempts.sessionId],
    references: [quizSessions.id],
  }),
  question: one(questions, {
    fields: [attempts.questionId],
    references: [questions.id],
  }),
}));

export const userQuestionStatsRelations = relations(userQuestionStats, ({ one }) => ({
  user: one(users, {
    fields: [userQuestionStats.userId],
    references: [users.id],
  }),
  question: one(questions, {
    fields: [userQuestionStats.questionId],
    references: [questions.id],
  }),
}));
