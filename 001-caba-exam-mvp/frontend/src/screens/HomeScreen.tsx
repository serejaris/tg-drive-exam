import React from 'react';
import type { Screen } from '../types';
import { useProgress } from '../hooks/useProgress';
import { LanguageToggle } from '../components/LanguageToggle';

interface HomeScreenProps {
  onNavigate: (screen: Screen) => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({ onNavigate }) => {
  const progress = useProgress();
  const totalAttempts = progress.getTotalAttempts();
  const lastScore = progress.getLastScore();
  const streak = progress.getStreak();

  return (
    <div className="home-screen">
      <div className="home-header">
        <h1>Экзамен CABA B</h1>
        <p className="home-subtitle">Подготовка к теоретическому экзамену</p>
      </div>

      <LanguageToggle
        mode={progress.progress.settings.languageMode}
        onChange={(mode) => progress.updateSettings({ languageMode: mode })}
      />

      {/* Stats */}
      {totalAttempts > 0 && (
        <div className="home-stats">
          <div className="stat-card">
            <span className="stat-value">{totalAttempts}</span>
            <span className="stat-label">Попыток</span>
          </div>
          <div className="stat-card">
            <span className="stat-value">
              {lastScore !== null ? `${Math.round(lastScore * 100)}%` : '—'}
            </span>
            <span className="stat-label">Последний результат</span>
          </div>
          <div className="stat-card">
            <span className="stat-value">{streak}</span>
            <span className="stat-label">Серия</span>
          </div>
        </div>
      )}

      {/* Action buttons */}
      <div className="home-actions">
        <button className="action-btn practice" onClick={() => onNavigate('practice')}>
          <span className="action-icon">📝</span>
          <span className="action-title">Практика</span>
          <span className="action-desc">20 вопросов с подсказками</span>
        </button>

        <button className="action-btn exam" onClick={() => onNavigate('exam')}>
          <span className="action-icon">🎓</span>
          <span className="action-title">Экзамен</span>
          <span className="action-desc">40 вопросов, без подсказок</span>
        </button>

        <button
          className="action-btn mistakes"
          onClick={() => onNavigate('mistakes')}
          disabled={progress.getMistakeQuestionIds().length === 0}
        >
          <span className="action-icon">❌</span>
          <span className="action-title">Ошибки</span>
          <span className="action-desc">
            {progress.getMistakeQuestionIds().length > 0
              ? `${progress.getMistakeQuestionIds().length} вопросов`
              : 'Нет ошибок'}
          </span>
        </button>

        <button className="action-btn settings" onClick={() => onNavigate('settings')}>
          <span className="action-icon">⚙️</span>
          <span className="action-title">Настройки</span>
          <span className="action-desc">Язык, напоминания</span>
        </button>
      </div>
    </div>
  );
};
