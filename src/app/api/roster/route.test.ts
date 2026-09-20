// @vitest-environment node
import { describe, it, expect, beforeAll } from 'vitest';
import bcrypt from 'bcryptjs';
import { GET, POST } from './route';
import { signSession, SESSION_COOKIE } from '@/lib/auth';
import { prisma } from '@/lib/db';

beforeAll(() => {
  process.env.ADMIN_USERNAME = 'admin';
  process.env.ADMIN_PASSWORD_HASH = bcrypt.hashSync('s3cret', 10);
  process.env.SESSION_SECRET = 'z'.repeat(48);
});

describe('/api/roster', () => {
  it('GET returns active people (public)', async () => {
    const data = await (await GET()).json();
    expect(Array.isArray(data)).toBe(true);
  });
  it('POST without session is 401', async () => {
    const res = await POST(new Request('http://t/api/roster', {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ name: 'newperson', displayName: 'New' }),
    }));
    expect(res.status).toBe(401);
  });
  it('POST with valid session creates a person', async () => {
    const token = await signSession('admin');
    const res = await POST(new Request('http://t/api/roster', {
      method: 'POST',
      headers: { 'content-type': 'application/json', cookie: `${SESSION_COOKIE}=${token}` },
      body: JSON.stringify({ name: 'NewPerson', displayName: 'New' }),
    }));
    expect(res.status).toBe(200);
    await prisma.person.deleteMany({ where: { name: 'newperson' } });
  });
});
