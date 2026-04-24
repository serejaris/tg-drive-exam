export function calculateScore(correct: number, total: number): number {
  if (total === 0) return 0;
  return correct / total;
}

export function hasPassed(percentage: number, threshold: number = 0.75): boolean {
  return percentage >= threshold;
}

export function getPassThreshold(): number {
  return 0.75; // 75% from test_rules.json
}
