import { useEffect } from 'react';
import { useExam } from '../hooks/useExam';
import { useProgress } from '../hooks/useProgress';
import { QuestionCard } from '../components/QuestionCard';
import { ProgressBar } from '../components/ProgressBar';
import { isTelegramWebApp } from '../utils/telegram';
import type { Screen } from '../types';

interface MistakesScreenProps {
  onNavigate: (screen: Screen, params?: Record<string, any>) => void;
}

export const MistakesScreen: React.FC<MistakesScreenProps> = ({ onNavigate }) => {
  const exam = useExam();
  const progress = useProgress();

  // Start mistakes review on mount
  useEffect(() => {
    if (exam.questions.length === 0) {
      const mistakeIds = progress.getMistakeQuestionIds();
      if (mistakeIds.length === 0) {
        onNavigate('home');
        return;
      }
      exam.startExam('mistakes', mistakeIds);
    }
  }, []);

  // Setup back button
  useEffect(() => {
    if (isTelegramWebApp()) {
      const handleBack = () => onNavigate('home');
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

      // Update mastery tracking
      const isCorrect = exam.isCorrect(currentQuestion.id);
      progress.updateCategoryStats(
        currentQuestion.id,
        isCorrect,
        currentQuestion.category
      );
    }
  };

  const handleNext = () => {
    exam.nextQuestion();
  };

  // If all mistakes reviewed
  useEffect(() => {
    if (exam.isComplete) {
      const results = exam.getResults();
      if (results) {
        onNavigate('results', { results, mode: 'mistakes' });
      }
    }
  }, [exam.isComplete]);

  return (
    <div className="mistakes-screen">
      <ProgressBar current={exam.currentIndex} total={exam.questions.length} />

      <div className="mistakes-header">
        <h2>Повторение ошибок</h2>
        <p className="mistakes-hint">Ответьте правильно 2 раза подряд, чтобы выучить вопрос</p>
      </div>

      <QuestionCard
        question={currentQuestion}
        languageMode={progress.progress.settings.languageMode}
        mode="practice"
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
