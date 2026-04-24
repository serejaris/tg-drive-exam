import type { ExamResult, ExamMode, Screen } from '../types';
import { hasPassed } from '../utils/scoring';

interface ResultsScreenProps {
  results: ExamResult;
  mode: ExamMode;
  onNavigate: (screen: Screen) => void;
}

export const ResultsScreen: React.FC<ResultsScreenProps> = ({ results, mode, onNavigate }) => {
  const passed = hasPassed(results.percentage);

  return (
    <div className="results-screen">
      <div className="results-header">
        <h1>{mode === 'exam' ? 'Результат экзамена' : 'Результат практики'}</h1>
      </div>

      <div className={`results-score ${passed ? 'passed' : 'failed'}`}>
        <div className="score-circle">
          <span className="score-percentage">{Math.round(results.percentage * 100)}%</span>
        </div>
        <div className="score-details">
          <span className="score-fraction">
            {results.score} из {results.total}
          </span>
          <span className={`score-status ${passed ? 'passed' : 'failed'}`}>
            {passed ? 'СДАНО' : 'НЕ СДАНО'}
          </span>
        </div>
      </div>

      {results.mistakes.length > 0 && (
        <div className="mistakes-section">
          <h2>Ошибки ({results.mistakes.length})</h2>
          <div className="mistakes-list">
            {results.mistakes.map((q) => (
              <div key={q.id} className="mistake-item">
                <div className="mistake-question">
                  {q.question_ru || q.question}
                </div>
                <div className="mistake-answer">
                  Правильный ответ: {q.correct_option_ids.map((id) => id.toUpperCase()).join(', ')}
                </div>
                {q.notes_ru && (
                  <div className="mistake-explanation">{q.notes_ru}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="results-actions">
        {results.mistakes.length > 0 && (
          <button className="action-btn" onClick={() => onNavigate('mistakes')}>
            Повторить ошибки
          </button>
        )}
        <button className="action-btn secondary" onClick={() => onNavigate('home')}>
          На главную
        </button>
      </div>
    </div>
  );
};
