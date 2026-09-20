// @vitest-environment node
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { prisma } from '@/lib/db';
import { GET } from './route';

// Unique person name so this file doesn't collide with entries/route.test.ts,
// which also seeds/cleans a person and runs in parallel against the same DB.
const PERSON = 'statsperson';

beforeAll(async () => {
  const p = await prisma.person.upsert({
    where: { name: PERSON }, update: { isActive: true },
    create: { name: PERSON, displayName: 'Stats Person' },
  });
  await prisma.moodEntry.createMany({
    data: [
      { personId: p.id, date: new Date('2026-01-01T00:00:00Z'), mood: 4, emoji: '😕' },
      { personId: p.id, date: new Date('2026-01-02T00:00:00Z'), mood: 8, emoji: '😎' },
    ],
    skipDuplicates: true,
  });
});
afterAll(async () => {
  await prisma.moodEntry.deleteMany({ where: { person: { name: PERSON } } });
  await prisma.person.deleteMany({ where: { name: PERSON } });
});

describe('/api/stats', () => {
  it('returns the four aggregation blocks', async () => {
    const data = await (await GET()).json();
    expect(data).toHaveProperty('moodOverTime');
    expect(data).toHaveProperty('teamVibe');
    expect(data).toHaveProperty('perPerson');
    expect(data).toHaveProperty('distribution');
    expect(data.moodOverTime[PERSON].length).toBeGreaterThanOrEqual(2);
  });
});
