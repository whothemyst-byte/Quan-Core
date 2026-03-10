const dailyCounts = new Map<string, { dateKey: string; count: number }>();

function getDateKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function incrementDailyRuns(userId: string, now: Date = new Date()): number {
  const key = getDateKey(now);
  const current = dailyCounts.get(userId);
  if (!current || current.dateKey !== key) {
    dailyCounts.set(userId, { dateKey: key, count: 1 });
    return 1;
  }

  const next = current.count + 1;
  dailyCounts.set(userId, { dateKey: key, count: next });
  return next;
}

export function getDailyRuns(userId: string, now: Date = new Date()): number {
  const key = getDateKey(now);
  const current = dailyCounts.get(userId);
  if (!current || current.dateKey !== key) {
    return 0;
  }
  return current.count;
}

