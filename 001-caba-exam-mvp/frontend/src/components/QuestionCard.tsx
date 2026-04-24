import React from 'react';
import type { Question, LanguageMode } from '../types';
import { hapticFeedback } from '../utils/telegram';

interface QuestionCardProps {
  question: Question;
  languageMode: LanguageMode;
  mode: 'practice' | 'exam';
  selectedAnswer: string[] | null;
  isAnswered: boolean;
  onSelect: (optionId: string) => void;
}

export const QuestionCard: React.FC<QuestionCardProps> = ({
  question,
  languageMode,
  mode,
  selectedAnswer,
  isAnswered,
  onSelect,
}) => {
  const isPractice = mode === 'practice';
  const showFeedback = isPractice && isAnswered;

  const isSelected = (optionId: string) => selectedAnswer?.includes(optionId) || false;
  const isCorrect = (optionId: string) => question.correct_option_ids.includes(optionId);

  const getOptionClass = (optionId: string): string => {
    if (!isAnswered) return 'option-btn';
    if (isCorrect(optionId)) return 'option-btn correct';
    if (isSelected(optionId) && !isCorrect(optionId)) return 'option-btn incorrect';
    return 'option-btn';
  };

  return (
    <div className="question-card">
      {/* Media */}
      {question.media?.url && (
        <div className="question-media">
          <img src={question.media.url} alt="Question illustration" />
        </div>
      )}

      {/* Question text */}
      <div className="question-text">
        {(languageMode === 'es_ru' || languageMode === 'es_only') && (
          <p className="question-es">{question.question}</p>
        )}
        {(languageMode === 'es_ru' || languageMode === 'ru_only') && question.question_ru && (
          <p className="question-ru">{question.question_ru}</p>
        )}
      </div>

      {/* Options */}
      <div className="options-list">
        {question.options.map((option) => (
          <button
            key={option.id}
            className={getOptionClass(option.id)}
            disabled={isAnswered}
            onClick={() => {
              hapticFeedback('light');
              onSelect(option.id);
            }}
          >
            <span className="option-label">{option.id.toUpperCase()}</span>
            <span className="option-text">
              {(languageMode === 'es_ru' || languageMode === 'es_only') && option.text}
              {(languageMode === 'es_ru' || languageMode === 'ru_only') && option.text_ru && (
                <span className="option-text-ru">{option.text_ru}</span>
              )}
            </span>
          </button>
        ))}
      </div>

      {/* Feedback (practice mode only) */}
      {showFeedback && (
        <div className="feedback">
          {selectedAnswer && question.correct_option_ids.every((id) => selectedAnswer.includes(id)) ? (
            <div className="feedback-correct">
              <strong>Правильно!</strong>
            </div>
          ) : (
            <div className="feedback-wrong">
              <strong>Неправильно.</strong>
              <p>Правильный ответ: {question.correct_option_ids.map((id) => id.toUpperCase()).join(', ')}</p>
            </div>
          )}
          {question.notes_ru && (
            <div className="explanation">
              <p>{question.notes_ru}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
