"use client";

import { useEffect, useState } from "react";
import { useTelegram } from "@/components/telegram-provider";

export default function MiniApp() {
  const { webApp } = useTelegram();
  const [auth, setAuth] = useState<"loading" | "ok" | "fail">("loading");
  const [screen, setScreen] = useState<"home" | "question" | "results" | "settings">("home");
  const [mode, setMode] = useState<"practice" | "exam" | "mistakes">("practice");
  const [questions, setQuestions] = useState<any[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState<any>(null);
  const [results, setResults] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [settings, setSettings] = useState<any>({});

  useEffect(() => {
    if (!webApp) return;
    const initData = webApp.initData;
    if (!initData) {
      setAuth("fail");
      return;
    }
    fetch("/api/auth/telegram", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ initData }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.ok) {
          setAuth("ok");
          loadProfile();
        } else {
          setAuth("fail");
        }
      })
      .catch(() => setAuth("fail"));
  }, [webApp]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const m = params.get("mode");
    if (m === "exam") startMode("exam");
    else if (m === "practice") startMode("practice");
    else if (m === "settings") setScreen("settings");
  }, []);

  async function loadProfile() {
    const r = await fetch("/api/me");
    if (!r.ok) return;
    const data = await r.json();
    setProfile(data);
  }

  async function startMode(m: "practice" | "exam" | "mistakes") {
    setMode(m);
    setScreen("question");
    setCurrentIndex(0);
    setScore(0);
    setFeedback(null);

    const res = await fetch("/api/sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mode: m }),
    });
    const sess = await res.json();
    setSessionId(sess.sessionId);

    const qRes = await fetch(`/api/questions?mode=${m}&limit=${sess.total}`);
    const qData = await qRes.json();
    setQuestions(qData.questions ?? []);
  }

  async function answer(optionId: string) {
    if (!sessionId || !questions[currentIndex]) return;
    const question = questions[currentIndex];

    const res = await fetch(`/api/sessions/${sessionId}/answer`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        question_id: question.id,
        selected_option_ids: [optionId],
      }),
    });
    const data = await res.json();
    setScore(data.score);

    if (mode === "practice" || mode === "mistakes") {
      setFeedback({
        isCorrect: data.isCorrect,
        correctOptionIds: data.correctOptionIds,
        selected: optionId,
        explanation: question.explanationRu,
      });
    }

    if (data.isComplete) {
      finishSession(sessionId);
    } else if (mode !== "practice" && mode !== "mistakes") {
      setCurrentIndex((i) => i + 1);
    }
  }

  function nextQuestion() {
    setFeedback(null);
    setCurrentIndex((i) => i + 1);
  }

  async function finishSession(sid: string) {
    const res = await fetch(`/api/sessions/${sid}/complete`, { method: "POST" });
    const data = await res.json();
    setResults(data);
    setScreen("results");
  }

  async function saveSettings() {
    await fetch("/api/me", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        languageMode: settings.languageMode,
        timezone: settings.timezone,
        examQuestionCount: settings.examQuestionCount,
        reminder: settings.reminder,
      }),
    });
    await loadProfile();
    setScreen("home");
  }

  if (auth === "loading") {
    return (
      <div className="flex flex-1 items-center justify-center p-6">
        <div className="text-lg">Загрузка...</div>
      </div>
    );
  }

  if (auth === "fail") {
    return (
      <div className="flex flex-1 items-center justify-center p-6">
        <div className="text-center text-red-600">
          Не удалось авторизоваться. Откройте приложение через Telegram.
        </div>
      </div>
    );
  }

  if (screen === "settings") {
    return (
      <div className="flex flex-1 flex-col p-4 gap-4">
        <h1 className="text-xl font-semibold">Настройки</h1>
        <label className="flex flex-col gap-1">
          <span className="text-sm text-[var(--tg-theme-hint-color)]">Режим языка</span>
          <select
            className="rounded-lg border p-2 bg-[var(--tg-theme-secondary-bg-color)]"
            value={settings.languageMode || profile?.user?.languageMode || "es_ru"}
            onChange={(e) => setSettings({ ...settings, languageMode: e.target.value })}
          >
            <option value="es_ru">ES + RU</option>
            <option value="es_only">Только ES</option>
            <option value="ru_only">Только RU</option>
          </select>
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-sm text-[var(--tg-theme-hint-color)]">Часовой пояс</span>
          <input
            className="rounded-lg border p-2 bg-[var(--tg-theme-secondary-bg-color)]"
            value={settings.timezone || profile?.user?.timezone || "America/Argentina/Buenos_Aires"}
            onChange={(e) => setSettings({ ...settings, timezone: e.target.value })}
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-sm text-[var(--tg-theme-hint-color)]">Вопросов в экзамене</span>
          <input
            type="number"
            className="rounded-lg border p-2 bg-[var(--tg-theme-secondary-bg-color)]"
            value={settings.examQuestionCount || profile?.user?.examQuestionCount || 40}
            onChange={(e) => setSettings({ ...settings, examQuestionCount: parseInt(e.target.value) })}
          />
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={settings.reminder?.enabled ?? profile?.reminder?.enabled ?? true}
            onChange={(e) =>
              setSettings({
                ...settings,
                reminder: {
                  ...settings.reminder,
                  enabled: e.target.checked,
                  timeLocal: settings.reminder?.timeLocal ?? profile?.reminder?.timeLocal ?? "09:00",
                },
              })
            }
          />
          <span>Напоминания</span>
        </label>
        {((settings.reminder?.enabled ?? profile?.reminder?.enabled ?? true)) && (
          <label className="flex flex-col gap-1">
            <span className="text-sm text-[var(--tg-theme-hint-color)]">Время напоминания</span>
            <input
              type="time"
              className="rounded-lg border p-2 bg-[var(--tg-theme-secondary-bg-color)]"
              value={settings.reminder?.timeLocal ?? profile?.reminder?.timeLocal ?? "09:00"}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  reminder: {
                    ...settings.reminder,
                    enabled: true,
                    timeLocal: e.target.value,
                  },
                })
              }
            />
          </label>
        )}
        <div className="flex gap-2 mt-4">
          <button
            className="flex-1 rounded-lg p-3 font-medium text-white"
            style={{ background: "var(--tg-theme-button-color)" }}
            onClick={saveSettings}
          >
            Сохранить
          </button>
          <button
            className="flex-1 rounded-lg p-3 font-medium"
            style={{ background: "var(--tg-theme-secondary-bg-color)" }}
            onClick={() => setScreen("home")}
          >
            Назад
          </button>
        </div>
      </div>
    );
  }

  if (screen === "results") {
    return (
      <div className="flex flex-1 flex-col p-4 gap-4">
        <h1 className="text-xl font-semibold">Результаты</h1>
        <div className="rounded-xl p-4" style={{ background: "var(--tg-theme-secondary-bg-color)" }}>
          <div className="text-lg">
            {results?.score} / {results?.total} ({results?.percentage}%)
          </div>
          <div className={`font-semibold mt-1 ${results?.passed ? "text-green-600" : "text-red-600"}`}>
            {results?.passed ? "Сдано ✅" : "Не сдано ❌"}
          </div>
        </div>
        {results?.wrongQuestions?.length > 0 && (
          <div>
            <h2 className="font-medium mb-2">Ошибки:</h2>
            <div className="flex flex-col gap-2">
              {results.wrongQuestions.map((wq: any) => (
                <div key={wq.id} className="rounded-lg p-3 text-sm" style={{ background: "var(--tg-theme-secondary-bg-color)" }}>
                  <div className="text-[var(--tg-theme-hint-color)]">{wq.questionEs}</div>
                  <div className="mt-1">{wq.questionRu}</div>
                </div>
              ))}
            </div>
          </div>
        )}
        <div className="flex flex-col gap-2 mt-2">
          {results?.wrongQuestions?.length > 0 && (
            <button
              className="w-full rounded-lg p-3 font-medium text-white"
              style={{ background: "var(--tg-theme-button-color)" }}
              onClick={() => startMode("mistakes")}
            >
              Повторить ошибки
            </button>
          )}
          <button
            className="w-full rounded-lg p-3 font-medium text-white"
            style={{ background: "var(--tg-theme-button-color)" }}
            onClick={() => startMode(mode === "exam" ? "exam" : "practice")}
          >
            Новый {mode === "exam" ? "экзамен" : "прогон"}
          </button>
          <button
            className="w-full rounded-lg p-3 font-medium"
            style={{ background: "var(--tg-theme-secondary-bg-color)" }}
            onClick={() => setScreen("home")}
          >
            На главную
          </button>
        </div>
      </div>
    );
  }

  if (screen === "question") {
    const q = questions[currentIndex];
    if (!q) {
      return (
        <div className="flex flex-1 items-center justify-center p-6">
          <div>Загрузка вопросов...</div>
        </div>
      );
    }

    const langMode = profile?.user?.languageMode || "es_ru";

    return (
      <div className="flex flex-1 flex-col p-4 gap-4">
        <div className="flex justify-between text-sm text-[var(--tg-theme-hint-color)]">
          <span>
            {currentIndex + 1} / {questions.length}
          </span>
          <span>{mode === "exam" ? "Экзамен" : mode === "mistakes" ? "Ошибки" : "Тренировка"}</span>
        </div>

        {q.media?.url && (
          <img
            src={q.media.url}
            alt="question"
            className="w-full rounded-xl object-contain max-h-64"
          />
        )}

        <div>
          {(langMode === "es_ru" || langMode === "es_only") && (
            <div className="text-base font-medium leading-snug">{q.questionEs}</div>
          )}
          {(langMode === "es_ru" || langMode === "ru_only") && (
            <div className="text-sm text-[var(--tg-theme-hint-color)] mt-1 leading-snug">{q.questionRu}</div>
          )}
        </div>

        <div className="flex flex-col gap-2">
          {q.options.map((opt: any) => {
            let btnStyle: React.CSSProperties = {};
            if (feedback) {
              if (feedback.correctOptionIds.includes(opt.id)) {
                btnStyle = { background: "#d1fae5", color: "#065f46", borderColor: "#10b981" };
              } else if (feedback.selected === opt.id) {
                btnStyle = { background: "#fee2e2", color: "#991b1b", borderColor: "#ef4444" };
              }
            }
            return (
              <button
                key={opt.id}
                disabled={!!feedback}
                className="w-full rounded-lg border p-3 text-left transition active:scale-[0.98]"
                style={{
                  background: "var(--tg-theme-secondary-bg-color)",
                  ...btnStyle,
                }}
                onClick={() => answer(opt.id)}
              >
                {(langMode === "es_ru" || langMode === "es_only") && (
                  <div className="text-sm">{opt.textEs}</div>
                )}
                {(langMode === "es_ru" || langMode === "ru_only") && (
                  <div className="text-xs text-[var(--tg-theme-hint-color)] mt-0.5">{opt.textRu}</div>
                )}
              </button>
            );
          })}
        </div>

        {feedback && (
          <div className="rounded-lg p-3" style={{ background: "var(--tg-theme-secondary-bg-color)" }}>
            <div className={`font-medium ${feedback.isCorrect ? "text-green-600" : "text-red-600"}`}>
              {feedback.isCorrect ? "Правильно! ✅" : "Неправильно ❌"}
            </div>
            {feedback.explanation && (
              <div className="text-sm mt-1">{feedback.explanation}</div>
            )}
            <button
              className="mt-3 w-full rounded-lg p-3 font-medium text-white"
              style={{ background: "var(--tg-theme-button-color)" }}
              onClick={nextQuestion}
            >
              Далее
            </button>
          </div>
        )}

        {!feedback && mode === "exam" && (
          <button
            className="w-full rounded-lg p-3 font-medium"
            style={{ background: "var(--tg-theme-secondary-bg-color)" }}
            onClick={() => sessionId && finishSession(sessionId)}
          >
            Завершить экзамен
          </button>
        )}
      </div>
    );
  }

  // Home
  return (
    <div className="flex flex-1 flex-col p-4 gap-4">
      <div className="rounded-xl p-4" style={{ background: "var(--tg-theme-secondary-bg-color)" }}>
        <h1 className="text-lg font-semibold">
          Привет{profile?.user?.firstName ? ", " + profile.user.firstName : ""}! 🚗
        </h1>
        <p className="text-sm text-[var(--tg-theme-hint-color)] mt-1">
          Готовься к экзамену CABA (категория B)
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <button
          className="rounded-xl p-4 text-left transition active:scale-[0.98] text-white"
          style={{ background: "var(--tg-theme-button-color)" }}
          onClick={() => startMode("practice")}
        >
          <div className="font-medium">Тренировка</div>
          <div className="text-xs opacity-90 mt-1">20 случайных вопросов</div>
        </button>
        <button
          className="rounded-xl p-4 text-left transition active:scale-[0.98] text-white"
          style={{ background: "var(--tg-theme-button-color)" }}
          onClick={() => startMode("exam")}
        >
          <div className="font-medium">Экзамен</div>
          <div className="text-xs opacity-90 mt-1">{profile?.user?.examQuestionCount || 40} вопросов</div>
        </button>
        <button
          className="rounded-xl p-4 text-left transition active:scale-[0.98]"
          style={{ background: "var(--tg-theme-secondary-bg-color)" }}
          onClick={() => startMode("mistakes")}
        >
          <div className="font-medium">Ошибки</div>
          <div className="text-xs text-[var(--tg-theme-hint-color)] mt-1">Повторить слабые</div>
        </button>
        <button
          className="rounded-xl p-4 text-left transition active:scale-[0.98]"
          style={{ background: "var(--tg-theme-secondary-bg-color)" }}
          onClick={() => setScreen("settings")}
        >
          <div className="font-medium">Настройки</div>
          <div className="text-xs text-[var(--tg-theme-hint-color)] mt-1">Язык, время, напоминания</div>
        </button>
      </div>

      <div className="rounded-xl p-4 text-sm" style={{ background: "var(--tg-theme-secondary-bg-color)" }}>
        <div className="flex justify-between">
          <span className="text-[var(--tg-theme-hint-color)]">Сегодня пройдено:</span>
          <span className="font-medium">{profile?.stats?.todaySessions ?? 0} сессий</span>
        </div>
        <div className="flex justify-between mt-1">
          <span className="text-[var(--tg-theme-hint-color)]">Точность:</span>
          <span className="font-medium">{profile?.stats?.accuracy ?? 0}%</span>
        </div>
      </div>
    </div>
  );
}
