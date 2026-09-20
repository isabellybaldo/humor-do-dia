import { emojiMap } from '@/app/appData.js';

export function pickEmoji(level: number): string {
  const lvl = Math.min(10, Math.max(1, Math.round(level)));
  const set: string[] = emojiMap[lvl] ?? emojiMap[5];
  return set[Math.floor(Math.random() * set.length)];
}
