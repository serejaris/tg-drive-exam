# 001-caba-exam-mvp

Telegram Mini App для подготовки к теоретическому экзамену на права в CABA, Аргентина (категория B).

## Стек

| Компонент | Технология |
|-----------|------------|
| Frontend | Vite + React + TypeScript |
| State | Zustand |
| Backend | Express + grammY (Telegram Bot) |
| Database | PostgreSQL (Railway) |
| ORM | Drizzle ORM |
| Deployment | Railway |

## Как запустить локально

### 1. Установка зависимостей

```bash
cd 001-caba-exam-mvp
npm install
cd frontend && npm install && cd ..
cd server && npm install && cd ..
```

### 2. Переменные окружения

Скопируй `.env.example` в `.env` и заполни значения:

```bash
cp .env.example .env
```

Минимально для локального запуска нужен только `TELEGRAM_BOT_TOKEN`.

### 3. Запуск

```bash
# Frontend (dev server на :5173)
npm run dev:frontend

# Server (dev на :3000, бот в polling режиме)
npm run dev:server

# Или оба одновременно
npm run dev
```

### 4. База данных

Для локальной разработки нужен PostgreSQL. Создай базу и примени миграции:

```bash
cd server
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/caba_exam npx drizzle-kit migrate
```

## Деплой на Railway

### 1. Создание проекта

```bash
cd 001-caba-exam-mvp
railway init -n "caba-exam-001"
```

### 2. Добавление PostgreSQL

```bash
railway add -d postgres
```

Автоматически появится `DATABASE_URL` в переменных окружения.

### 3. Установка переменных

```bash
railway variables --set "TELEGRAM_BOT_TOKEN=<твой_токен>"
railway variables --set "TELEGRAM_BOT_USERNAME=<username_бота>"
railway variables --set "BOT_WEBHOOK_SECRET=<случайный_секрет>"
railway variables --set "CRON_SECRET=<другой_секрет>"
railway variables --set "APP_URL=<railway_url>"
railway variables --set "NODE_ENV=production"
```

### 4. Деплой

```bash
railway up
```

### 5. Настройка Telegram webhook

После деплоя получи URL:

```bash
railway status
```

Установи webhook:

```bash
curl -X POST "https://api.telegram.org/bot<token>/setWebhook" \
  -d "url=https://<railway_url>/api/telegram/webhook/<secret>"
```

### 6. Подключение Mini App

В BotFather:
1. `/newapp` или выбери существующего бота
2. Укажи URL мини-приложения (твой Railway URL)
3. Готово!

## Функции MVP

- **Практика** — 20 случайных вопросов с мгновенным фидбеком и объяснениями
- **Экзамен** — 40 вопросов без подсказок, результат только в конце
- **Ошибки** — повтор вопросов, на которых были ошибки (2 правильных ответа подряд = выучено)
- **Билингва** — переключатель ES+RU / ES only / RU only
- **Прогресс** — статистика, серия, результаты по категориям (localStorage)
- **Бот** — команды `/start`, `/practice`, `/exam`, `/settings`, `/status`
- **Напоминания** — ежедневные уведомления в выбранное время

## Структура

```
001-caba-exam-mvp/
├── data/                          # Вопросы (ES+RU)
├── frontend/                      # React Mini App
│   ├── src/
│   │   ├── components/            # QuestionCard, ProgressBar, LanguageToggle
│   │   ├── screens/               # Home, Practice, Exam, Results, Mistakes, Settings
│   │   ├── hooks/                 # useExam, useProgress
│   │   └── utils/                 # shuffle, scoring, telegram
│   └── index.html                 # Telegram WebApp SDK
├── server/                        # Express + grammY
│   └── src/
│       ├── bot.ts                 # Telegram bot commands
│       ├── cron/reminders.ts      # Daily reminder scheduler
│       ├── db/                    # Drizzle schema + connection
│       └── utils/telegram-auth.ts # initData validation
├── db/migrations/                 # SQL миграции
└── railway.toml                   # Railway deploy config
```

## Известные ограничения

- 40 вопросов (starter pack) — при расширении базы нужно добавить админку
- Прогресс хранится в localStorage на клиенте; серверная статистика минимальна
- Медиа (изображения знаков) загружаются с внешних URL — могут быть недоступны
- Вопросы помечены как `manual_review_required` — нужна валидация против официальных материалов
- Таймер на экзамене не реализован (можно добавить позже)
