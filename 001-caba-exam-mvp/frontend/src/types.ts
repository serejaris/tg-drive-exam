export interface Option {
  id: string;
  text: string;
  text_ru: string;
}

export interface Question {
  id: string;
  country: string;
  jurisdiction: string;
  license_classes: string[];
  category: string;
  question: string; // Spanish original (question_es)
  question_ru: string;
  type: 'single_choice' | 'multiple_choice' | 'true_false';
  options: Option[];
  correct_option_ids: string[];
  eliminatory: boolean;
  tags: string[];
  source: {
    title: string;
    url: string;
    page: string | null;
    original_question_no: string | null;
    retrieved_at: string;
  };
  status: string;
  notes: string;
  notes_ru: string;
  media?: {
    type: string;
    url: string;
  };
}

export interface TestRules {
  country: string;
  jurisdiction: string;
  license_class: string;
  questions_per_run: number;
  selection: string;
  shuffle_questions: boolean;
  shuffle_options: boolean;
  pass_rule: {
    type: string;
    threshold: number;
    note: string;
  };
  source_of_truth: string;
}

export type ExamMode = 'practice' | 'exam' | 'mistakes';
export type LanguageMode = 'es_ru' | 'es_only' | 'ru_only';
export type Screen = 'home' | 'practice' | 'exam' | 'results' | 'mistakes' | 'settings';

export interface ProgressRecord {
  date: string;
  mode: ExamMode;
  score: number;
  total: number;
  passed: boolean;
}

export interface CategoryStats {
  correct: number;
  total: number;
}

export interface ProgressData {
  history: ProgressRecord[];
  mistakeIds: string[];
  mistakeCorrectCounts: Record<string, number>; // tracks consecutive correct for mastery
  categoryStats: Record<string, CategoryStats>;
  settings: {
    languageMode: LanguageMode;
    reminderEnabled: boolean;
    reminderTime: string;
  };
}

export interface ExamState {
  mode: ExamMode;
  questions: Question[];
  currentIndex: number;
  answers: Record<string, string[]>; // questionId -> selected option ids
  isComplete: boolean;
}

export interface ExamResult {
  score: number;
  total: number;
  percentage: number;
  passed: boolean;
  mistakes: Question[];
}
