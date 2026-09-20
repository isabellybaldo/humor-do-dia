import { describe, it, expect } from 'vitest';
import { normalizeName } from './roster';

describe('normalizeName', () => {
  it('lowercases and trims', () => {
    expect(normalizeName('  Gustavo ')).toBe('gustavo');
  });
});
