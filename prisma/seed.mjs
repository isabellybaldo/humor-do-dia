import { PrismaClient } from '@prisma/client';
import { coworkers, coworkerGifs, husband, husbandGifs } from '../src/app/appData.js';

const prisma = new PrismaClient();

function cap(s) { return s.charAt(0).toUpperCase() + s.slice(1); }

async function main() {
  const people = [];
  for (const name of coworkers) {
    people.push({ name, displayName: cap(name), gifUrl: coworkerGifs[name] ?? null, isSweetheart: false });
  }
  for (const name of husband) {
    people.push({ name, displayName: cap(name), gifUrl: husbandGifs[name] ?? null, isSweetheart: true });
  }
  for (const p of people) {
    await prisma.person.upsert({ where: { name: p.name }, update: {}, create: p });
  }
  console.log(`seeded ${people.length} people`);
}

main().finally(() => prisma.$disconnect());
