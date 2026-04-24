import { create } from 'zustand';
import type { ProgressData, ProgressRecord, ExamMode } from '../types';

const STORAGE_KEY = 'caba-exam-progress';

const defaultProgress: ProgressData = {
  history: [],
  mistakeIds: [],
  mistakeCorrectCounts: {},
  categoryStats: {},
  settings: {
    languageMode: 'es_ru',
    reminderEnabled: false,
    reminderTime: '09:00',
  },
};

function loadProgress(): ProgressData {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return { ...defaultProgress, ...JSON.parse(stored) };
    }
  } catch (e) {
    console.error('Failed to load progress:', e);
  }
  return defaultProgress;
}

function saveProgress(data: ProgressData): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.error('Failed to save progress:', e);
  }
}

interface ProgressStore {
  progress: ProgressData;
  recordResult: (mode: ExamMode, score: number, total: number, passed: boolean, mistakeIds: string[]) => void;
  getMistakeQuestionIds: () => string[];
  updateCategoryStats: (questionId: string, isCorrect: boolean, category: string) => void;
  updateSettings: (updates: Partial<ProgressData['settings']>) => void;
  getTotalAttempts: () => number;
  getLastScore: () => number | null;
  getStreak: () => number;
  getCategoryStats: () => Record<string, { correct: number; total: number }>;
}

export const useProgress = create<ProgressStore>((set, get) => ({
  progress: loadProgress(),

  recordResult: (mode: ExamMode, score: number, total: number, passed: boolean, mistakeIds: string[]) => {
    set((state) => {
      const newProgress = { ...state.progress };

      // Add to history
      const record: ProgressRecord = {
        date: new Date().toISOString().split('T')[0],
        mode,
        score,
        total,
        passed,
      };
      newProgress.history = [...newProgress.history, record];

      // Update mistake IDs (add new ones, remove mastered ones)
      const existingMistakes = new Set(newProgress.mistakeIds);
      mistakeIds.forEach((id) => existingMistakes.add(id));
      newProgress.mistakeIds = Array.from(existingMistakes);

      saveProgress(newProgress);
      return { progress: newProgress };
    });
  },

  getMistakeQuestionIds: () => {
    return get().progress.mistakeIds;
  },

  updateCategoryStats: (questionId: string, isCorrect: boolean, category: string) => {
    set((state) => {
      const newProgress = { ...state.progress };
      const stats = { ...newProgress.categoryStats };

      if (!stats[category]) {
        stats[category] = { correct: 0, total: 0 };
      }

      stats[category] = {
        correct: stats[category].correct + (isCorrect ? 1 : 0),
        total: stats[category].total + 1,
      };

      // Track correct counts for mistake mastery (2 correct = mastered)
      const correctCounts = { ...newProgress.mistakeCorrectCounts };
      if (isCorrect) {
        correctCounts[questionId] = (correctCounts[questionId] || 0) + 1;
      }

      // Remove mastered questions (2 consecutive correct)
      newProgress.mistakeIds = newProgress.mistakeIds.filter((id) => {
        if (correctCounts[id] >= 2) {
          delete correctCounts[id];
          return false;
        }
        return true;
      });

      newProgress.categoryStats = stats;
      newProgress.mistakeCorrectCounts = correctCounts;

      saveProgress(newProgress);
      return { progress: newProgress };
    });
  },

  updateSettings: (updates) => {
    set((state) => {
      const newProgress = {
        ...state.progress,
        settings: { ...state.progress.settings, ...updates },
      };
      saveProgress(newProgress);
      return { progress: newProgress };
    });
  },

  getTotalAttempts: () => {
    return get().progress.history.length;
  },

  getLastScore: () => {
    const history = get().progress.history;
    if (history.length === 0) return null;
    const last = history[history.length - 1];
    return last.score / last.total;
  },

  getStreak: () => {
    const history = get().progress.history;
    if (history.length === 0) return 0;

    let streak = 0;
    for (let i = history.length - 1; i >= 0; i--) {
      if (history[i].passed) {
        streak++;
      } else {
        break;
      }
    }
    return streak;
  },

  getCategoryStats: () => {
    return get().progress.categoryStats;
  },
}));
