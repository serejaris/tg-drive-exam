import { create } from 'zustand';
import type { ExamMode, Question, ExamState, ExamResult } from '../types';
import { shuffle } from '../utils/shuffle';
import { getQuestions, getQuestionById } from '../data/loader';
import { calculateScore, hasPassed, getPassThreshold } from '../utils/scoring';

interface ExamStore extends ExamState {
  startExam: (mode: ExamMode, questionIds?: string[]) => void;
  answerQuestion: (questionId: string, optionId: string) => void;
  nextQuestion: () => void;
  isCorrect: (questionId: string) => boolean;
  getResults: () => ExamResult | null;
  reset: () => void;
}

export const useExam = create<ExamStore>((set, get) => ({
  mode: 'practice',
  questions: [],
  currentIndex: 0,
  answers: {},
  isComplete: false,

  startExam: (mode: ExamMode, questionIds?: string[]) => {
    let selectedQuestions: Question[];
    const allQuestions = getQuestions();

    if (questionIds && questionIds.length > 0) {
      // Mistakes mode: use specific question IDs
      selectedQuestions = questionIds
        .map((id) => getQuestionById(id))
        .filter(Boolean) as Question[];
    } else {
      // Practice or exam: use all questions
      selectedQuestions = [...allQuestions];
    }

    // Shuffle questions based on mode settings
    const shuffled = shuffle(selectedQuestions);

    // Shuffle options within each question
    const shuffledWithOptions = shuffled.map((q) => ({
      ...q,
      options: shuffle(q.options),
    }));

    set({
      mode,
      questions: shuffledWithOptions,
      currentIndex: 0,
      answers: {},
      isComplete: false,
    });
  },

  answerQuestion: (questionId: string, optionId: string) => {
    set((state) => ({
      answers: {
        ...state.answers,
        [questionId]: [optionId],
      },
    }));
  },

  nextQuestion: () => {
    const { currentIndex, questions: qs } = get();
    if (currentIndex < qs.length - 1) {
      set({ currentIndex: currentIndex + 1 });
    } else {
      set({ isComplete: true });
    }
  },

  isCorrect: (questionId: string) => {
    const { answers } = get();
    const question = getQuestionById(questionId);
    if (!question || !answers[questionId]) return false;

    return (
      answers[questionId].length === question.correct_option_ids.length &&
      answers[questionId].every((id) => question.correct_option_ids.includes(id))
    );
  },

  getResults: () => {
    const { questions: qs, answers } = get();
    if (qs.length === 0) return null;

    let correct = 0;
    const mistakes: Question[] = [];

    qs.forEach((q) => {
      if (answers[q.id]) {
        const isCorrect =
          answers[q.id].length === q.correct_option_ids.length &&
          answers[q.id].every((id) => q.correct_option_ids.includes(id));

        if (isCorrect) {
          correct++;
        } else {
          mistakes.push(q);
        }
      } else {
        mistakes.push(q);
      }
    });

    const total = qs.length;
    const percentage = calculateScore(correct, total);
    const passed = hasPassed(percentage, getPassThreshold());

    return { score: correct, total, percentage, passed, mistakes };
  },

  reset: () => {
    set({
      mode: 'practice',
      questions: [],
      currentIndex: 0,
      answers: {},
      isComplete: false,
    });
  },
}));
