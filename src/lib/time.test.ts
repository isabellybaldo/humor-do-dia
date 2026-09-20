import { describe, it, expect } from 'vitest';
import { todayInSaoPaulo } from './time';

describe('todayInSaoPaulo', () => {
  it('returns a UTC-midnight Date for the SP calendar day', () => {
    // 2026-01-01 02:00 UTC is still 2025-12-31 in São Paulo (UTC-3)
    const d = todayInSaoPaulo(new Date('2026-01-01T02:00:00Z'));
    expect(d.toISOString()).toBe('2025-12-31T00:00:00.000Z');
  });
});
