import type { FlatEntry } from '@/test/fixtures';

export type Point = { date: string; mood: number };

export function moodOverTime(entries: FlatEntry[]): Record<string, Point[]> {
  const out: Record<string, Point[]> = {};
  for (const e of [...entries].sort((a, b) => a.date.localeCompare(b.date))) {
    (out[e.person] ??= []).push({ date: e.date, mood: e.mood });
  }
  return out;
}

export function teamVibe(entries: FlatEntry[]): { date: string; avg: number }[] {
  const byDate: Record<string, number[]> = {};
  for (const e of entries) (byDate[e.date] ??= []).push(e.mood);
  return Object.entries(byDate)
    .map(([date, moods]) => ({ date, avg: moods.reduce((a, b) => a + b, 0) / moods.length }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

export type PersonSummary = {
  person: string; avg: number; best: number; worst: number;
  latestEmoji: string; streak: number;
};

export function perPersonSummary(entries: FlatEntry[]): PersonSummary[] {
  const byPerson: Record<string, FlatEntry[]> = {};
  for (const e of entries) (byPerson[e.person] ??= []).push(e);
  return Object.entries(byPerson).map(([person, list]) => {
    const sorted = [...list].sort((a, b) => a.date.localeCompare(b.date));
    const moods = sorted.map(e => e.mood);
    const last = sorted[sorted.length - 1];
    return {
      person,
      avg: moods.reduce((a, b) => a + b, 0) / moods.length,
      best: Math.max(...moods),
      worst: Math.min(...moods),
      latestEmoji: last.emoji,
      streak: currentStreak(sorted.map(e => e.date)),
    };
  });
}

// Longest run of consecutive calendar days ending on the most recent entry.
function currentStreak(datesAsc: string[]): number {
  if (datesAsc.length === 0) return 0;
  let streak = 1;
  for (let i = datesAsc.length - 1; i > 0; i--) {
    const cur = new Date(datesAsc[i] + 'T00:00:00Z').getTime();
    const prev = new Date(datesAsc[i - 1] + 'T00:00:00Z').getTime();
    if (cur - prev === 86_400_000) streak++;
    else break;
  }
  return streak;
}

export function distribution(entries: FlatEntry[]): Record<number, number> {
  const out: Record<number, number> = {};
  for (let i = 1; i <= 10; i++) out[i] = 0;
  for (const e of entries) out[e.mood] = (out[e.mood] ?? 0) + 1;
  return out;
}
