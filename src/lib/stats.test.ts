import { describe, it, expect } from 'vitest';
import { moodOverTime, teamVibe, perPersonSummary, distribution } from './stats';
import { sampleEntries } from '@/test/fixtures';

describe('stats', () => {
  it('moodOverTime groups by person', () => {
    const r = moodOverTime(sampleEntries);
    expect(r.ana).toEqual([
      { date: '2026-01-01', mood: 4 },
      { date: '2026-01-02', mood: 8 },
      { date: '2026-01-03', mood: 6 },
    ]);
  });
  it('teamVibe averages per date', () => {
    const r = teamVibe(sampleEntries);
    expect(r.find(d => d.date === '2026-01-03')).toEqual({ date: '2026-01-03', avg: 8 });
  });
  it('perPersonSummary computes avg/best/worst/latest/streak', () => {
    const r = perPersonSummary(sampleEntries);
    const ana = r.find(p => p.person === 'ana')!;
    expect(ana.avg).toBeCloseTo(6, 5);
    expect(ana.best).toBe(8);
    expect(ana.worst).toBe(4);
    expect(ana.latestEmoji).toBe('😊');
    expect(ana.streak).toBe(3); // consecutive days ending on the latest entry
  });
  it('distribution counts moods 1..10', () => {
    const r = distribution(sampleEntries);
    expect(r[10]).toBe(1);
    expect(r[4]).toBe(1);
    expect(r[7]).toBe(0);
  });
});
