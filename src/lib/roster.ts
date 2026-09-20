import { prisma } from './db';

export function normalizeName(name: string): string {
  return name.trim().toLowerCase();
}

export async function getActivePersonByName(name: string) {
  return prisma.person.findFirst({
    where: { name: normalizeName(name), isActive: true },
  });
}

export async function activeRoster() {
  return prisma.person.findMany({
    where: { isActive: true },
    orderBy: { displayName: 'asc' },
  });
}
