// @vitest-environment node
import { describe, it, expect, beforeAll } from 'vitest';
import bcrypt from 'bcryptjs';
import { verifyCredentials, signSession, verifySession } from './auth';

beforeAll(() => {
  process.env.ADMIN_USERNAME = 'admin';
  process.env.ADMIN_PASSWORD_HASH = bcrypt.hashSync('s3cret', 10);
  process.env.SESSION_SECRET = 'x'.repeat(48);
});

describe('auth', () => {
  it('accepts correct credentials', async () => {
    expect(await verifyCredentials('admin', 's3cret')).toBe(true);
  });
  it('rejects wrong username or password', async () => {
    expect(await verifyCredentials('admin', 'nope')).toBe(false);
    expect(await verifyCredentials('root', 's3cret')).toBe(false);
  });
  it('signs and verifies a session token', async () => {
    const token = await signSession('admin');
    expect(await verifySession(token)).toBe(true);
    expect(await verifySession('garbage')).toBe(false);
  });
});
