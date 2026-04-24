import React, { useEffect } from 'react';
import { useExam } from '../hooks/useExam';
import { useProgress } from '../hooks/useProgress';
import { QuestionCard } from '../components/QuestionCard';
import { ProgressBar } from '../components/ProgressBar';
import { isTelegramWebApp } from '../utils/telegram';
import type { Screen } from '../types';

interface ExamScreenProps {
  onNavigate: (screen: Screen, params?: Record<string, any>) => void;
}

export const ExamScreen: React.FC<ExamScreenProps> = ({ onNavigate }) => {
  const exam = useExam();
  const progress = useProgress();

  // Start exam on mount (40 questions)
  useEffect(() => {
    if (exam.questions.length === 0) {
      exam.startExam('exam');
    }
  }, []);

  // Setup back button
  useEffect(() => {
    if (isTelegramWebApp()) {
      const handleBack = () => {
        if (confirm('Выйти из экзамена? Прогресс будет потерян.')) {
          exam.reset();
          onNavigate('home');
        }
      };
      window.Telegram!.WebApp.BackButton.show();
      window.Telegram!.WebApp.BackButton.onClick(handleBack);
      return () => {
        window.Telegram!.WebApp.BackButton.offClick(handleBack);
        window.Telegram!.WebApp.BackButton.hide();
      };
    }
  }, [onNavigate]);

  const currentQuestion = exam.questions[exam.currentIndex];
  if (!currentQuestion) return null;

  const currentAnswer = exam.answers[currentQuestion.id] || null;
  const isAnswered = !!currentAnswer;

  const handleSelect = (optionId: string) => {
    if (!isAnswered) {
      exam.answerQuestion(currentQuestion.id, optionId);
    }
  };

  const handleNext = () => {
    exam.nextQuestion();
  };

  // If exam is complete, go to results
  useEffect(() => {
    if (exam.isComplete) {
      const results = exam.getResults();
      if (results) {
        progress.recordResult(
          'exam',
          results.score,
          results.total,
          results.passed,
          results.mistakes.map((q) => q.id)
        );
        onNavigate('results', { results, mode: 'exam' });
      }
    }
  }, [exam.isComplete]);

  return (
    <div className="exam-screen">
      <ProgressBar current={exam.currentIndex} total={exam.questions.length} />

      <QuestionCard
        question={currentQuestion}
        languageMode={progress.progress.settings.languageMode}
        mode="exam"
        selectedAnswer={currentAnswer}
        isAnswered={isAnswered}
        onSelect={handleSelect}
      />

      {isAnswered && (
        <button className="next-btn" onClick={handleNext}>
          {exam.currentIndex < exam.questions.length - 1 ? 'Далее' : 'Завершить'}
        </button>
      )}
    </div>
  );
};
