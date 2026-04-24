// Load questions from public directory at runtime
import type { Question, TestRules } from '../types';

let cachedQuestions: Question[] | null = null;
let cachedTestRules: TestRules | null = null;

async function loadJson<T>(path: string): Promise<T> {
  const res = await fetch(path);
  if (!res.ok) throw new Error(`Failed to load ${path}`);
  return res.json();
}

export async function loadQuestions(): Promise<Question[]> {
  if (cachedQuestions) return cachedQuestions;

  const raw = await loadJson<any[]>('/data/questions.caba.b.starter40.es-ru.json');
  cachedQuestions = raw.map((q) => ({
    id: q.id,
    country: q.country || 'AR',
    jurisdiction: q.jurisdiction || 'CABA',
    license_classes: q.license_classes || ['B'],
    category: q.category || 'general',
    question: q.question || q.question_es || '',
    question_ru: q.question_ru || '',
    type: q.type || 'single_choice',
    options: (q.options || []).map((opt: any) => ({
      id: opt.id,
      text: opt.text || opt.text_es || '',
      text_ru: opt.text_ru || '',
    })),
    correct_option_ids: q.correct_option_ids || [],
    eliminatory: q.eliminatory ?? false,
    tags: q.tags || [],
    source: q.source || { title: '', url: '', page: null, original_question_no: null, retrieved_at: '' },
    status: q.status || 'active',
    notes: q.notes || '',
    notes_ru: q.notes_ru || '',
    media: q.media,
  }));

  return cachedQuestions;
}

export async function loadTestRules(): Promise<TestRules> {
  if (cachedTestRules) return cachedTestRules;
  cachedTestRules = await loadJson<TestRules>('/data/test_rules.json');
  return cachedTestRules;
}

// Synchronous getters (call after load)
export function getQuestions(): Question[] {
  if (!cachedQuestions) throw new Error('Questions not loaded yet');
  return cachedQuestions;
}

export function getTestRules(): TestRules {
  if (!cachedTestRules) return { country: 'AR', jurisdiction: 'CABA', license_class: 'B', questions_per_run: 40, selection: 'random', shuffle_questions: true, shuffle_options: true, pass_rule: { type: 'percentage', threshold: 0.75, note: '' }, source_of_truth: '' };
  return cachedTestRules;
}

export function getQuestionById(id: string): Question | undefined {
  return getQuestions().find((q) => q.id === id);
}

export function getQuestionsByIds(ids: string[]): Question[] {
  return ids.map((id) => getQuestionById(id)).filter(Boolean) as Question[];
}
