import { describe, it, expect } from 'vitest';
import { pickEmoji, resolveEmoji } from './emoji';
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

describe('resolveEmoji', () => {
  it('keeps a candidate that belongs to the level (WYSIWYG)', () => {
    const candidate = emojiMap[8][0];
    expect(resolveEmoji(8, candidate)).toBe(candidate);
  });
  it('ignores a candidate that is not in the level set', () => {
    const e = resolveEmoji(3, '🚀'); // not a mood-3 emoji
    expect(emojiMap[3]).toContain(e);
  });
  it('picks from the set when no candidate is given', () => {
    const e = resolveEmoji(5);
    expect(emojiMap[5]).toContain(e);
  });
  it('rejects a valid emoji from the WRONG level', () => {
    const fromTen = emojiMap[10].find(x => !emojiMap[1].includes(x));
    const e = resolveEmoji(1, fromTen);
    expect(emojiMap[1]).toContain(e);
  });
});
