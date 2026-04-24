import { useEffect } from 'react';
import { useExam } from '../hooks/useExam';
import { useProgress } from '../hooks/useProgress';
import { QuestionCard } from '../components/QuestionCard';
import { ProgressBar } from '../components/ProgressBar';
import { isTelegramWebApp } from '../utils/telegram';
import type { Screen } from '../types';

interface PracticeScreenProps {
  onNavigate: (screen: Screen, params?: Record<string, any>) => void;
}

export const PracticeScreen: React.FC<PracticeScreenProps> = ({ onNavigate }) => {
  const exam = useExam();
  const progress = useProgress();

  // Start practice on mount (20 random questions)
  useEffect(() => {
    if (exam.questions.length === 0) {
      exam.startExam('practice');
      // Limit to 20
      const state = useExam.getState();
      if (state.questions.length > 20) {
        useExam.setState({ questions: state.questions.slice(0, 20) });
      }
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
      progress.updateCategoryStats(
        currentQuestion.id,
        exam.isCorrect(currentQuestion.id),
        currentQuestion.category
      );
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
          'practice',
          results.score,
          results.total,
          results.passed,
          results.mistakes.map((q) => q.id)
        );
        onNavigate('results', { results, mode: 'practice' });
      }
    }
  }, [exam.isComplete]);

  return (
    <div className="practice-screen">
      <ProgressBar current={exam.currentIndex} total={exam.questions.length} />

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
          {exam.currentIndex < exam.questions.length - 1 ? 'Далее' : 'Результаты'}
        </button>
      )}
    </div>
  );
};
