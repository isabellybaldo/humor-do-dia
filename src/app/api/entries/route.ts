import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getActivePersonByName } from '@/lib/roster';
import { resolveEmoji } from '@/lib/emoji';
import { todayInSaoPaulo } from '@/lib/time';

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const name = typeof body?.name === 'string' ? body.name : '';
  const mood = Number(body?.mood);
  const note = typeof body?.note === 'string' ? body.note : null;

  if (!Number.isInteger(mood) || mood < 1 || mood > 10) {
    return NextResponse.json({ error: 'Humor deve ser um número de 1 a 10.' }, { status: 422 });
  }
  const person = await getActivePersonByName(name);
  if (!person) {
    return NextResponse.json({ error: 'Esse nome não está na lista. Fale com a Isabelly. 🙂' }, { status: 422 });
  }

  const date = todayInSaoPaulo();
  const candidate = typeof body?.emoji === 'string' ? body.emoji : undefined;
  const emoji = resolveEmoji(mood, candidate);
  await prisma.moodEntry.upsert({
    where: { personId_date: { personId: person.id, date } },
    update: { mood, note, emoji },
    create: { personId: person.id, date, mood, note, emoji },
  });
  return NextResponse.json({ ok: true, emoji });
}

export async function GET() {
  const date = todayInSaoPaulo();
  const rows = await prisma.moodEntry.findMany({
    where: { date },
    include: { person: true },
    orderBy: { person: { displayName: 'asc' } },
  });
  return NextResponse.json(
    rows.map(r => ({
      person: r.person.name,
      displayName: r.person.displayName,
      mood: r.mood,
      note: r.note,
      emoji: r.emoji,
      gifUrl: r.person.gifUrl,
      isSweetheart: r.person.isSweetheart,
    })),
  );
}
