export function shuffleArray<T>(arr: T[]): T[] {
  const shuffled = [...arr];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export function getCurrentHourLocal(timezone: string): number {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    hour: "2-digit",
    hour12: false,
  });
  return parseInt(formatter.format(now), 10);
}

export function getTodayRange(timezone: string): { start: Date; end: Date } {
  const now = new Date();
  const tzDate = new Date(now.toLocaleString("en-US", { timeZone: timezone }));
  const start = new Date(tzDate.getFullYear(), tzDate.getMonth(), tzDate.getDate());
  const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
  return { start, end };
}
