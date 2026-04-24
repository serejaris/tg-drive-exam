# PRD: Telegram Mini App для подготовки к теоретическому экзамену на права в CABA

Версия: 1.0 MVP
Дата: 2026-04-24
Язык документа: русский
Целевая юрисдикция: CABA, Argentina
Категория: B, автомобили
Основной пользователь: человек, который не знает испанский и хочет быстро выучить билеты для сдачи теоретического экзамена

---

## 1. Краткое описание

Нужно создать Telegram-бота и Telegram Mini App для ежедневной подготовки к теоретическому экзамену на водительские права в CABA. Бот каждый день присылает пользователю напоминание потренироваться и кнопку для запуска mini app. Mini app показывает вопросы экзамена, изображения дорожных знаков/ситуаций, оригинальный текст на испанском и русский перевод. Пользователь проходит тренировку или симуляцию экзамена, получает результат, видит ошибки и повторяет слабые вопросы.

MVP должен быть достаточно простым, чтобы AI-агент мог реализовать его быстро, но достаточно полезным, чтобы реально помогать готовиться к экзамену.

---

## 2. Цели продукта

### 2.1 Главная цель

Помочь пользователю как можно быстрее выучить билеты CABA категории B и уверенно сдать теоретический экзамен.

### 2.2 Вторичные цели

1. Автоматизировать привычку ежедневной подготовки через Telegram-напоминания.
2. Убрать языковой барьер: каждый вопрос и каждый вариант ответа должны быть видны на испанском и русском.
3. Отслеживать прогресс: правильность, ошибки, повторение сложных вопросов.
4. Сделать app удобным для демонстрации на стриме по vibe coding и тестированию AI-моделей.

---

## 3. Не-цели MVP

В MVP не нужно:

1. Делать полноценную публичную платформу для многих юрисдикций.
2. Делать платежи, подписки, Telegram Stars.
3. Делать сложную админку.
4. Делать социальные функции, рейтинги, группы.
5. Делать идеальную систему spaced repetition. Достаточно простого повторения ошибок и статистики.
6. Гарантировать юридическую актуальность всех вопросов без ручной валидации. Нужно явно пометить источник и дату импорта.

---

## 4. Исходные предположения

1. Экзамен CABA — multiple choice; официальная страница CABA указывает, что экзамен состоит из вопросов с вариантами ответа и длится 45 минут.
2. Для MVP вопросник берется из подготовленного JSON/JSONL content pack или импортируется агентом из публичного/официального источника.
3. Количество вопросов в тренировочном прогоне должно быть конфигурируемым. По умолчанию для этого MVP использовать 40 вопросов, потому что пользователь хочет «экзамен/прогон» на 40 вопросов.
4. Порог прохождения должен быть конфигурируемым. По умолчанию использовать 85% или значение из `test_rules.json`, если оно есть в content pack.
5. Пользователь не знает испанский, поэтому русский перевод обязателен, но испанский оригинал нельзя скрывать: задача — одновременно учить содержание и узнавать формулировки экзамена.

---

## 5. Пользовательские сценарии

### 5.1 Первый запуск

1. Пользователь открывает Telegram-бота и нажимает `/start`.
2. Бот приветствует пользователя и объясняет, что приложение помогает готовиться к экзамену CABA категории B.
3. Бот предлагает кнопку `Открыть тренировку`.
4. Mini app открывается внутри Telegram.
5. Пользователь видит короткий onboarding:
   - цель: подготовка к теоретическому экзамену;
   - язык: показывать ES + RU;
   - ежедневное напоминание: выбрать время.
6. Пользователь сохраняет настройки.

### 5.2 Ежедневное напоминание

1. В выбранное время бот отправляет сообщение:
   - «Пора потренироваться: 10 минут сегодня помогут сдать экзамен быстрее.»
   - кнопки: `Начать тренировку`, `Пройти экзамен`, `Настройки`.
2. При нажатии кнопки открывается mini app.
3. Если пользователь прошел тренировку сегодня, в напоминании на следующий день учитывается streak/progress.

### 5.3 Тренировка

1. Пользователь нажимает `Тренировка`.
2. App показывает вопрос:
   - изображение, если есть;
   - вопрос на испанском;
   - перевод вопроса на русский;
   - варианты ответа на испанском;
   - перевод вариантов на русский.
3. Пользователь выбирает ответ.
4. App показывает результат:
   - правильно/неправильно;
   - правильный вариант;
   - короткое объяснение на русском, если есть.
5. После завершения показывается summary:
   - сколько правильных;
   - процент;
   - список ошибок;
   - кнопка `Повторить ошибки`.

### 5.4 Симуляция экзамена

1. Пользователь нажимает `Экзамен`.
2. App выбирает N вопросов, по умолчанию 40.
3. Вопросы перемешиваются.
4. Варианты ответа перемешиваются, но correct_option_ids остаются корректными.
5. Во время экзамена можно видеть прогресс: `12 / 40`.
6. Таймер опционален для MVP, но должен быть легко включаемым через конфиг.
7. До завершения экзамена app не показывает правильные ответы.
8. После завершения показывает результат и ошибки.

### 5.5 Повторение ошибок

1. Пользователь нажимает `Повторить ошибки`.
2. App выбирает вопросы, которые пользователь отвечал неправильно.
3. В этом режиме ответы показываются сразу после выбора.
4. Вопрос считается «выученным», если пользователь ответил правильно несколько раз подряд. Для MVP достаточно `2 раза подряд`.

### 5.6 Настройки

Пользователь может изменить:

1. Время ежедневного напоминания.
2. Часовой пояс, по умолчанию `America/Argentina/Buenos_Aires`.
3. Режим отображения:
   - ES + RU, default;
   - только ES;
   - только RU — допустимо, но не рекомендовано.
4. Количество вопросов в тренировке.
5. Включить/выключить напоминания.

---

## 6. Функциональные требования

### 6.1 Telegram-бот

Команды:

- `/start` — регистрация пользователя, приветствие, кнопка открытия mini app.
- `/practice` — отправить кнопку открытия mini app в режиме тренировки.
- `/exam` — отправить кнопку открытия mini app в режиме экзамена.
- `/settings` — отправить кнопку открытия настроек.
- `/status` — показать краткий прогресс: streak, решено сегодня, accuracy.

Сообщение ежедневного напоминания:

```text
Пора потренироваться 🚗
Сегодня цель: 20 вопросов или 1 тестовый экзамен.

[Начать тренировку] [Пройти экзамен]
```

Требования:

1. Бот должен сохранять `telegram_user_id` и `chat_id` после `/start`.
2. Бот должен отправлять inline keyboard с кнопкой `web_app` или ссылкой на mini app.
3. Бот должен уметь отправлять ежедневные напоминания по расписанию.
4. Если пользователь отключил напоминания, бот не должен их отправлять.
5. Если Telegram возвращает ошибку отправки, сохранить событие в лог и отключить/пометить пользователя как недоступного после нескольких неудач.

### 6.2 Mini App

Экран 1: Home

- Приветствие.
- Сегодняшний прогресс.
- Кнопки:
  - `Тренировка`;
  - `Экзамен`;
  - `Ошибки`;
  - `Настройки`.

Экран 2: Question

Поля:

- image/media block;
- `question_es`;
- `question_ru`;
- options list:
  - `option.text_es`;
  - `option.text_ru`;
- progress indicator;
- primary action.

Поведение:

- В режиме тренировки показывать feedback сразу.
- В режиме экзамена feedback показывать только в конце.
- Сохранять каждую попытку.
- Не терять текущую сессию при закрытии mini app.

Экран 3: Results

Показать:

- score;
- percentage;
- pass/fail по текущему конфигу;
- количество ошибок;
- список вопросов с ошибками;
- CTA:
  - `Повторить ошибки`;
  - `Новый экзамен`;
  - `На главную`.

Экран 4: Settings

Показать:

- reminder enabled toggle;
- reminder time;
- timezone;
- display language mode;
- exam question count;
- save button.

### 6.3 Content import

MVP должен поддерживать импорт из JSON/JSONL.

Минимальная структура вопроса:

```json
{
  "id": "ar-caba-b-001",
  "jurisdiction": "CABA",
  "license_classes": ["B"],
  "category": "seniales",
  "question_es": "Determine qué indica la señal...",
  "question_ru": "Определите, что означает этот знак...",
  "options": [
    {
      "id": "a",
      "text_es": "Cruce de peatones.",
      "text_ru": "Пешеходный переход."
    }
  ],
  "correct_option_ids": ["a"],
  "media": {
    "type": "image",
    "url": "https://..."
  },
  "explanation_ru": "Краткое объяснение ответа.",
  "source": {
    "title": "...",
    "url": "...",
    "retrieved_at": "2026-04-24"
  }
}
```

Если исходный pack содержит поля `question` и `options[].text` на испанском без RU-перевода, агент должен:

1. Считать их испанским оригиналом.
2. Создать `question_es` и `options[].text_es`.
3. Сгенерировать `question_ru` и `options[].text_ru` через LLM/translation provider.
4. Сохранить переводы в базе, не переводить заново на каждом открытии.
5. Сохранить исходный JSON рядом как `raw_content` или в отдельной таблице.

---

## 7. Модель данных

### 7.1 users

- `id` UUID
- `telegram_user_id` bigint unique
- `chat_id` bigint
- `username` text nullable
- `first_name` text nullable
- `timezone` text default `America/Argentina/Buenos_Aires`
- `language_mode` enum: `es_ru`, `es_only`, `ru_only`
- `created_at` timestamp
- `last_seen_at` timestamp

### 7.2 reminder_settings

- `user_id` UUID FK
- `enabled` boolean default true
- `time_local` time default `09:00`
- `timezone` text default `America/Argentina/Buenos_Aires`
- `last_sent_at` timestamp nullable

### 7.3 questions

- `id` text primary key
- `jurisdiction` text
- `license_class` text
- `category` text
- `question_es` text
- `question_ru` text
- `type` enum: `single_choice`, `multiple_choice`, `true_false`
- `correct_option_ids` jsonb
- `media` jsonb nullable
- `explanation_ru` text nullable
- `source` jsonb
- `status` text
- `created_at` timestamp
- `updated_at` timestamp

### 7.4 question_options

- `id` UUID
- `question_id` text FK
- `option_id` text
- `text_es` text
- `text_ru` text
- `sort_order` int

### 7.5 quiz_sessions

- `id` UUID
- `user_id` UUID FK
- `mode` enum: `practice`, `exam`, `mistakes`
- `status` enum: `active`, `completed`, `abandoned`
- `question_ids` jsonb
- `current_index` int
- `score` int default 0
- `total` int
- `started_at` timestamp
- `completed_at` timestamp nullable

### 7.6 attempts

- `id` UUID
- `user_id` UUID FK
- `session_id` UUID FK
- `question_id` text FK
- `selected_option_ids` jsonb
- `is_correct` boolean
- `answered_at` timestamp

### 7.7 user_question_stats

- `user_id` UUID FK
- `question_id` text FK
- `attempts_count` int
- `correct_count` int
- `wrong_count` int
- `correct_streak` int
- `last_answered_at` timestamp nullable
- `status` enum: `new`, `learning`, `mastered`, `weak`

---

## 8. API требования

### 8.1 Auth

Mini app frontend получает `Telegram.WebApp.initData` и отправляет его на backend. Backend обязан валидировать подпись initData через bot token. Нельзя доверять `initDataUnsafe`.

Endpoints:

- `POST /api/auth/telegram`
  - input: `{ initData: string }`
  - output: session token или httpOnly session cookie

### 8.2 User

- `GET /api/me`
- `PATCH /api/me/settings`

### 8.3 Questions

- `GET /api/questions?mode=practice&limit=20`
- `GET /api/questions/:id`

### 8.4 Sessions

- `POST /api/sessions`
  - input: `{ mode: "practice" | "exam" | "mistakes", limit?: number }`
- `GET /api/sessions/:id`
- `POST /api/sessions/:id/answer`
  - input: `{ question_id: string, selected_option_ids: string[] }`
- `POST /api/sessions/:id/complete`

### 8.5 Bot webhook

- `POST /api/telegram/webhook/:secret`

### 8.6 Cron reminders

- `POST /api/cron/send-reminders`
  - protected by `CRON_SECRET`.

---

## 9. UX требования

1. Интерфейс должен быть mobile-first.
2. Вопрос и ответы должны быть легко читаемыми внутри Telegram.
3. Испанский текст должен быть визуально первым, русский — под ним меньшим или вторичным блоком.
4. Изображения знаков должны быть крупными, кликабельными/масштабируемыми, если возможно.
5. Кнопки ответов должны занимать всю ширину экрана.
6. Нужно использовать Telegram theme params, чтобы app выглядел нормально в светлой и темной теме.
7. Должна быть возможность быстро перейти к следующему вопросу.

---

## 10. Рекомендованный стек

Весь продукт хостится на **Railway** — один проект, один деплой, одна биллинг-карточка. База данных тоже создаётся внутри Railway.

Frontend/backend:

- Next.js + TypeScript
- React
- Telegram WebApp JS API
- Tailwind CSS или CSS modules
- Деплой как Railway service из GitHub-репозитория, авто-redeploy на push в `main`

Bot:

- grammY или Telegraf
- Telegram Bot API webhook, поднятый тем же Next.js-сервисом на Railway (`/api/telegram/webhook/:secret`)

Database:

- **Railway Postgres** — добавляется в проект как plugin/service в один клик
- Connection string Railway автоматически прокидывает в переменную `DATABASE_URL` основного сервиса
- Миграции: Prisma / Drizzle / raw SQL — на выбор агента, запускаются как Railway deploy hook или отдельным `release`-командой

Storage для изображений:

- Railway Volume, прикрученный к сервису, **или** внешний bucket (Cloudflare R2 / Supabase Storage)
- Для самого MVP допустимо положить картинки в `/public/images` репозитория

Hosting (итог):

- Один Railway project с двумя service'ами:
  1. `web` — Next.js (UI + API + bot webhook)
  2. `db` — Railway Postgres
- Cron-напоминания: **Railway Cron** (нативные scheduled jobs Railway), вызывает `/api/cron/send-reminders` с `CRON_SECRET`. Альтернатива — отдельный worker-service на Railway с node-cron.

---

## 11. Безопасность

1. Хранить `TELEGRAM_BOT_TOKEN` только в environment variables Railway service.
2. Не коммитить `.env`.
3. Валидировать Telegram initData на backend.
4. Защитить cron endpoint через `CRON_SECRET`.
5. Защитить webhook secret path.
6. Не хранить лишние персональные данные.
7. Логировать ошибки без утечки токенов.
8. Не доверять данным, пришедшим с frontend, включая selected options и user id.

---

## 12. Критерии приемки MVP

MVP считается готовым, если:

1. `/start` в Telegram-боте работает.
2. Бот отправляет кнопку, открывающую Telegram Mini App.
3. Mini App открывается внутри Telegram.
4. Backend валидирует Telegram initData.
5. Пользователь видит список режимов: тренировка, экзамен, ошибки, настройки.
6. Вопросы загружаются из DB или JSON seed.
7. Каждый вопрос показывает испанский оригинал и русский перевод.
8. Изображения показываются, если у вопроса есть `media.url`.
9. Пользователь может отвечать на вопросы.
10. Ответы сохраняются в базе.
11. Режим экзамена показывает результат в конце.
12. Режим тренировки показывает feedback после каждого вопроса.
13. Есть экран результатов.
14. Есть повторение ошибок.
15. Пользователь может выбрать время ежедневного напоминания.
16. Cron/scheduler отправляет ежедневное Telegram-сообщение с кнопкой открытия app.
17. Есть README с инструкциями запуска и деплоя на Railway.
18. Есть `.env.example`.
19. Есть seed/import script для вопросов.
20. Есть минимальные тесты или хотя бы manual QA checklist.

---

## 13. Manual QA checklist

1. Запустить bot locally или на Railway staging environment.
2. Отправить `/start`.
3. Нажать `Открыть тренировку`.
4. Проверить, что mini app открывается.
5. Проверить, что пользователь создан в DB.
6. Начать тренировку.
7. Ответить правильно.
8. Ответить неправильно.
9. Проверить, что attempt сохранен.
10. Пройти экзамен до конца.
11. Проверить score.
12. Перейти в `Ошибки`.
13. Проверить, что там есть неправильные вопросы.
14. Поменять время напоминания.
15. Запустить cron endpoint вручную.
16. Проверить, что бот прислал напоминание.
17. Проверить темную тему Telegram.
18. Проверить вопрос с картинкой.
19. Перезагрузить mini app во время сессии.
20. Проверить, что сессия восстановилась или корректно началась заново.

---

## 14. Пререквизиты

Чтобы приложение работало, нужны:

### 14.1 Telegram

1. Telegram account.
2. Созданный бот через `@BotFather`.
3. Bot token.
4. Bot username.
5. Настроенный Mini App URL или menu button через BotFather после деплоя на Railway.

### 14.2 Hosting / URL

1. Аккаунт на [Railway](https://railway.app/).
2. Railway project с двумя service'ами: `web` (Next.js) и `db` (Postgres).
3. Публичный HTTPS URL Railway-сервиса (`*.up.railway.app` по умолчанию) для mini app и Telegram webhook.
4. Кастомный домен — опционально, привязывается в Railway settings.

### 14.3 Database

1. Railway Postgres plugin, добавленный в тот же project.
2. Connection string из Railway (автоматически прокидывается в `DATABASE_URL`).
3. Миграции таблиц (Prisma / Drizzle / raw SQL).
4. Seed/import script для вопросов.

### 14.4 Secrets / environment variables

Минимальный `.env` (на Railway задаются через Variables в service settings):

```bash
TELEGRAM_BOT_TOKEN=
TELEGRAM_BOT_USERNAME=
WEBAPP_URL=https://your-service.up.railway.app
DATABASE_URL=                # автоматически от Railway Postgres
BOT_WEBHOOK_SECRET=
CRON_SECRET=
APP_TIMEZONE=America/Argentina/Buenos_Aires
TRANSLATION_PROVIDER=openai_or_other
TRANSLATION_API_KEY=
```

Если переводы уже есть в content pack, `TRANSLATION_API_KEY` не нужен.

### 14.5 Content

1. JSON/JSONL с вопросами CABA B.
2. Испанский оригинал вопросов.
3. Русский перевод вопросов и вариантов.
4. Изображения знаков/ситуаций: либо внешние URL, либо локальные assets.
5. Источники и дата импорта.

### 14.6 AI-agent access

Если пользователь хочет «ничего не делать руками», агентам нужно дать:

1. Доступ к репозиторию GitHub.
2. Доступ к Railway project (или permission создать новый).
3. Bot token или возможность создать бота через Telegram/BotFather.
4. Content pack.
5. Translation API key, если нужно генерировать русский перевод.

---

## 15. Риски

1. Вопросы могут быть не полностью официальными или устаревшими.
   - Митигация: хранить source, дату импорта, статус `manual_review_required`.
2. Русский перевод может исказить юридический смысл.
   - Митигация: показывать испанский оригинал первым, перевод использовать как помощь.
3. Telegram reminders не придут, если пользователь заблокировал бота.
   - Митигация: логировать ошибки отправки, показывать статус в настройках.
4. Внешние картинки могут перестать открываться.
   - Митигация: скачать media в Railway Volume или внешний bucket.
5. Разные агенты могут по-разному интерпретировать PRD.
   - Митигация: использовать критерии приемки и manual QA checklist.

---

## 16. Roadmap после MVP

1. Расширить базу до 200+ вопросов.
2. Добавить автоматическое скачивание картинок в local storage / Railway Volume.
3. Добавить spaced repetition.
4. Добавить объяснения на русском для каждого вопроса.
5. Добавить режим «только дорожные знаки».
6. Добавить режим «только слабые темы».
7. Добавить экспорт прогресса.
8. Добавить админку для редактирования переводов.
9. Добавить сравнение официального manual text с вопросами.
10. Добавить голосовое объяснение/аудио на русском.
