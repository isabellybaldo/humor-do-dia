import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// Liveness + DB readiness probe used by the deploy workflow's verify step.
export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json({ status: 'ok' });
  } catch {
    return NextResponse.json({ status: 'error' }, { status: 503 });
  }
}
