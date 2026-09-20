// Returns the São Paulo calendar day as a UTC-midnight Date (matches Prisma @db.Date).
export function todayInSaoPaulo(now: Date = new Date()): Date {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(now); // "YYYY-MM-DD"
  return new Date(`${parts}T00:00:00.000Z`);
}
