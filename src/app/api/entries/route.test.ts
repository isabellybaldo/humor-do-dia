// @vitest-environment node
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { prisma } from '@/lib/db';
import { POST, GET } from './route';

beforeAll(async () => {
  await prisma.person.upsert({
    where: { name: 'ana' },
    update: { isActive: true },
    create: { name: 'ana', displayName: 'Ana', isActive: true },
  });
});
afterAll(async () => {
  await prisma.moodEntry.deleteMany({ where: { person: { name: 'ana' } } });
  await prisma.person.deleteMany({ where: { name: 'ana' } });
});

function req(body: unknown) {
  return new Request('http://t/api/entries', {
    method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('/api/entries', () => {
  it('rejects unknown name with 422', async () => {
    const res = await POST(req({ name: 'nobody', mood: 5 }));
    expect(res.status).toBe(422);
  });
  it('rejects invalid mood with 422', async () => {
    const res = await POST(req({ name: 'ana', mood: 99 }));
    expect(res.status).toBe(422);
  });
  it('upserts a mood and appears on today board', async () => {
    const res = await POST(req({ name: 'Ana', mood: 7, note: 'ok' }));
    expect(res.status).toBe(200);
    const board = await (await GET()).json();
    const ana = board.find((e: any) => e.person === 'ana');
    expect(ana.mood).toBe(7);
    // re-post edits same day
    await POST(req({ name: 'ana', mood: 9 }));
    const board2 = await (await GET()).json();
    expect(board2.find((e: any) => e.person === 'ana').mood).toBe(9);
  });
});
