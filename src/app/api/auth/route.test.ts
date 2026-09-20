// @vitest-environment node
import { describe, it, expect, beforeAll } from 'vitest';
import bcrypt from 'bcryptjs';
import { POST } from './route';

beforeAll(() => {
  process.env.ADMIN_USERNAME = 'admin';
  process.env.ADMIN_PASSWORD_HASH = bcrypt.hashSync('s3cret', 10);
  process.env.SESSION_SECRET = 'y'.repeat(48);
});

function form(u: string, p: string) {
  const body = new URLSearchParams({ username: u, password: p });
  return new Request('http://t/api/auth', { method: 'POST', body });
}

describe('/api/auth', () => {
  it('sets a session cookie on valid login', async () => {
    const res = await POST(form('admin', 's3cret'));
    expect(res.status).toBe(200);
    expect(res.headers.get('set-cookie')).toMatch(/hdd_session=/);
  });
  it('401 on bad login', async () => {
    const res = await POST(form('admin', 'wrong'));
    expect(res.status).toBe(401);
  });
});
