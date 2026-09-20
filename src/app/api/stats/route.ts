import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { moodOverTime, teamVibe, perPersonSummary, distribution } from '@/lib/stats';

export async function GET() {
  const rows = await prisma.moodEntry.findMany({ include: { person: true } });
  const flat = rows.map(r => ({
    person: r.person.name,
    date: r.date.toISOString().slice(0, 10),
    mood: r.mood,
    emoji: r.emoji,
  }));
  return NextResponse.json({
    moodOverTime: moodOverTime(flat),
    teamVibe: teamVibe(flat),
    perPerson: perPersonSummary(flat),
    distribution: distribution(flat),
  });
}
