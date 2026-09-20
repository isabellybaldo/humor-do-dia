// @vitest-environment node
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { prisma } from '@/lib/db';
import { GET } from './route';

beforeAll(async () => {
  const ana = await prisma.person.upsert({
    where: { name: 'ana' }, update: { isActive: true },
    create: { name: 'ana', displayName: 'Ana' },
  });
  await prisma.moodEntry.createMany({
    data: [
      { personId: ana.id, date: new Date('2026-01-01T00:00:00Z'), mood: 4, emoji: '😕' },
      { personId: ana.id, date: new Date('2026-01-02T00:00:00Z'), mood: 8, emoji: '😎' },
    ],
    skipDuplicates: true,
  });
});
afterAll(async () => {
  await prisma.moodEntry.deleteMany({ where: { person: { name: 'ana' } } });
  await prisma.person.deleteMany({ where: { name: 'ana' } });
});

describe('/api/stats', () => {
  it('returns the four aggregation blocks', async () => {
    const data = await (await GET()).json();
    expect(data).toHaveProperty('moodOverTime');
    expect(data).toHaveProperty('teamVibe');
    expect(data).toHaveProperty('perPerson');
    expect(data).toHaveProperty('distribution');
    expect(data.moodOverTime.ana.length).toBeGreaterThanOrEqual(2);
  });
});
