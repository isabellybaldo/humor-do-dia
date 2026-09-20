import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { activeRoster, normalizeName } from '@/lib/roster';
import { verifySession, SESSION_COOKIE } from '@/lib/auth';

async function requireAdmin(request: Request): Promise<boolean> {
  const cookie = request.headers.get('cookie') ?? '';
  const match = cookie.match(new RegExp(`${SESSION_COOKIE}=([^;]+)`));
  return verifySession(match?.[1]);
}

export async function GET() {
  return NextResponse.json(await activeRoster());
}

export async function POST(request: Request) {
  if (!(await requireAdmin(request))) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }
  const b = await request.json().catch(() => ({}));
  const name = normalizeName(String(b.name ?? ''));
  if (!name) return NextResponse.json({ error: 'name required' }, { status: 422 });
  const person = await prisma.person.upsert({
    where: { name },
    update: {
      displayName: String(b.displayName ?? name),
      isActive: b.isActive ?? true,
      isSweetheart: b.isSweetheart ?? false,
      gifUrl: b.gifUrl ?? null,
    },
    create: {
      name,
      displayName: String(b.displayName ?? name),
      isActive: b.isActive ?? true,
      isSweetheart: b.isSweetheart ?? false,
      gifUrl: b.gifUrl ?? null,
    },
  });
  return NextResponse.json(person);
}

export async function DELETE(request: Request) {
  if (!(await requireAdmin(request))) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }
  const b = await request.json().catch(() => ({}));
  const name = normalizeName(String(b.name ?? ''));
  await prisma.person.update({ where: { name }, data: { isActive: false } });
  return NextResponse.json({ ok: true });
}
