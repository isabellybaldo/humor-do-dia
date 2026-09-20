import { emojiMap } from '@/app/appData.js';

export function pickEmoji(level: number): string {
  const lvl = Math.min(10, Math.max(1, Math.round(level)));
  const map = emojiMap as Record<number, string[]>;
  const set: string[] = map[lvl] ?? map[5];
  return set[Math.floor(Math.random() * set.length)];
}
