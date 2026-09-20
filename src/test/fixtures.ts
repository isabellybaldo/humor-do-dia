export type FlatEntry = { person: string; date: string; mood: number; emoji: string };

// Two people over 3 days
export const sampleEntries: FlatEntry[] = [
  { person: 'ana', date: '2026-01-01', mood: 4, emoji: '😕' },
  { person: 'ana', date: '2026-01-02', mood: 8, emoji: '😎' },
  { person: 'ana', date: '2026-01-03', mood: 6, emoji: '😊' },
  { person: 'bob', date: '2026-01-02', mood: 2, emoji: '🙁' },
  { person: 'bob', date: '2026-01-03', mood: 10, emoji: '🤩' },
];
