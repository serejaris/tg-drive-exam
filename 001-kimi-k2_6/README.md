# CABA Exam Prep — Telegram Mini App

Проект для подготовки к теоретическому экзамену на водительские права в CABA (Аргентина), категория B.

## Стек

- Next.js 16 + App Router + TypeScript
- Tailwind CSS
- Prisma 5 + PostgreSQL
- Telegraf (Telegram Bot)
- crypto-js (HMAC валидация Telegram initData)

## Запуск локально

1. Установить зависимости: `npm install`
2. Запустить PostgreSQL и задать `DATABASE_URL` в `.env`
3. Применить миграции и seed:
   ```
   npx prisma migrate dev
   npm run db:seed
   ```
4. Запустить dev-сервер: `npm run dev`
5. Для бота нужен Telegram Bot Token и настроенный webhook. В `.env` задайте `TELEGRAM_BOT_TOKEN`, `WEBAPP_URL`, `BOT_WEBHOOK_SECRET`.

## Что сделано

- [x] Next.js проект с App Router
- [x] Prisma schema и seed для 40 вопросов CABA B (ES+RU)
- [x] API endpoints: auth, me/settings, questions, sessions, attempts, results
- [x] Telegram bot через webhook: команды /start /practice /exam /settings /status
- [x] Mini App: Home, Question, Results, Settings экраны
- [x] Валидация Telegram initData через HMAC
- [x] Mobile-first UI с поддержкой Telegram theme params
- [x] Режимы: тренировка (feedback сразу), экзамен (feedback в конце), повтор ошибок
- [x] Cron endpoint для ежедневных напоминаний
- [x] Сохранение прогресса в БД (attempts, user_question_stats)

## Что не доделано / требует доработки

- [ ] Полноценный cron-расписание (Railway Cron или node-cron)
- [ ] Docker / Docker Compose для локального запуска
- [ ] Юнит-тесты
- [ ] Скачивание изображений в local storage (сейчас внешние URL)
- [ ] Локализация ошибок Telegram API и retry-логика
- [ ] Полноценная статистика streak / история сессий

## Известные проблемы

- Внешние URL картинок могут протухнуть
- Вопросы взяты из публичного симулятора, требуется сверка с официальными материалами (статус `manual_review_required`)
- Для деплоя на Railway нужен PostgreSQL сервис Railway и переменные окружения

## Переменные окружения

См. `.env.example`

Co-Authored-By: Oz <oz-agent@warp.dev>
