CREATE TABLE IF NOT EXISTS "users" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "telegram_user_id" bigint UNIQUE NOT NULL,
  "chat_id" bigint NOT NULL,
  "username" text,
  "first_name" text,
  "timezone" text DEFAULT 'America/Argentina/Buenos_Aires',
  "language_mode" text DEFAULT 'es_ru',
  "created_at" timestamp DEFAULT NOW(),
  "last_seen_at" timestamp DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "reminder_settings" (
  "user_id" uuid PRIMARY KEY REFERENCES "users"("id"),
  "enabled" boolean DEFAULT true,
  "time_local" text DEFAULT '09:00',
  "timezone" text DEFAULT 'America/Argentina/Buenos_Aires',
  "last_sent_at" timestamp
);

CREATE TABLE IF NOT EXISTS "questions" (
  "id" text PRIMARY KEY,
  "jurisdiction" text,
  "license_class" text,
  "category" text,
  "question_es" text NOT NULL,
  "question_ru" text,
  "type" text DEFAULT 'single_choice',
  "correct_option_ids" jsonb NOT NULL,
  "media" jsonb,
  "explanation_ru" text,
  "source" jsonb,
  "status" text DEFAULT 'active',
  "created_at" timestamp DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "quiz_sessions" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" uuid REFERENCES "users"("id"),
  "mode" text NOT NULL,
  "status" text DEFAULT 'active',
  "question_ids" jsonb,
  "current_index" integer DEFAULT 0,
  "score" integer DEFAULT 0,
  "total" integer,
  "started_at" timestamp DEFAULT NOW(),
  "completed_at" timestamp
);

CREATE TABLE IF NOT EXISTS "attempts" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" uuid REFERENCES "users"("id"),
  "session_id" uuid REFERENCES "quiz_sessions"("id"),
  "question_id" text REFERENCES "questions"("id"),
  "selected_option_ids" jsonb,
  "is_correct" boolean,
  "answered_at" timestamp DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "user_question_stats" (
  "user_id" uuid REFERENCES "users"("id"),
  "question_id" text REFERENCES "questions"("id"),
  "attempts_count" integer DEFAULT 0,
  "correct_count" integer DEFAULT 0,
  "wrong_count" integer DEFAULT 0,
  "correct_streak" integer DEFAULT 0,
  "last_answered_at" timestamp,
  "status" text DEFAULT 'new',
  PRIMARY KEY ("user_id", "question_id")
);
