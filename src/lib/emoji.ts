import { emojiMap } from '@/app/appData.js';

function setForLevel(level: number): string[] {
  const lvl = Math.min(10, Math.max(1, Math.round(level)));
  const map = emojiMap as Record<number, string[]>;
  return map[lvl] ?? map[5];
}

export function pickEmoji(level: number): string {
  const set = setForLevel(level);
  return set[Math.floor(Math.random() * set.length)];
}

// WYSIWYG: keep the client's chosen emoji only if it belongs to this mood
// level's set; otherwise pick one server-side. Prevents arbitrary/injected emoji.
export function resolveEmoji(level: number, candidate?: string): string {
  const set = setForLevel(level);
  if (candidate && set.includes(candidate)) return candidate;
  return set[Math.floor(Math.random() * set.length)];
}
