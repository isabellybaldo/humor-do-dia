import { describe, it, expect } from 'vitest';
import { pickEmoji } from './emoji';
import { emojiMap } from '@/app/appData.js';

describe('pickEmoji', () => {
  it('returns an emoji from the level set', () => {
    const e = pickEmoji(5);
    expect(emojiMap[5]).toContain(e);
  });
  it('clamps out-of-range levels', () => {
    expect(typeof pickEmoji(999)).toBe('string');
    expect(pickEmoji(999).length).toBeGreaterThan(0);
  });
});
