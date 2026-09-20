# humor-do-dia v2 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn humor-do-dia into a persistent, DB-backed shared mood board with per-person stats, a login-gated roster admin, and a pixel-cute redesign — deployed as a Next.js Node server + Postgres behind Traefik at humor.isoca.space.

**Architecture:** Next.js (App Router) full-stack running as a standalone Node container. React UI + Route Handlers under `src/app/api/**`. Prisma ORM against a Postgres container (internal network, not exposed). Pure aggregation/validation/auth logic isolated in `src/lib/*` so it can be unit-tested without the framework. Admin protected by a signed HTTP-only session cookie.

**Tech Stack:** Next.js 15, React 19, TypeScript (for new `lib`/`api` files), Prisma + Postgres, `jose` (JWT cookie), `bcryptjs`, Recharts, Vitest + @testing-library/react, Docker + docker-compose, Traefik.

**Testing note:** Pure logic in `src/lib` is unit-tested with Vitest. API route handlers are integration-tested against a disposable Postgres (CI service container / local `docker compose`). Set `DATABASE_URL` to the test DB before running API tests. Each task's tests must fail before implementation and pass after.

---

## File Structure

```
humor-do-dia/
├── prisma/
│   ├── schema.prisma            # Person, MoodEntry
│   ├── seed.mjs                 # seed roster from legacy appData lists
│   └── migrations/**            # generated
├── src/
│   ├── app/
│   │   ├── layout.js            # fonts + theme bootstrap
│   │   ├── globals.css          # pixel-cute design system (ported from portfolio)
│   │   ├── page.js              # board + mood form (client)
│   │   ├── stats/page.js        # stats dashboard (client, Recharts)
│   │   ├── admin/page.js        # login + roster CRUD (client)
│   │   ├── appData.js           # KEEP: emojiMap (+ legacy lists used only by seed)
│   │   └── api/
│   │       ├── entries/route.ts # POST upsert mood, GET today board
│   │       ├── stats/route.ts   # GET aggregated stats
│   │       ├── roster/route.ts  # GET public; POST/PATCH/DELETE admin-only
│   │       └── auth/route.ts    # POST login, DELETE logout
│   ├── lib/
│   │   ├── db.ts                # Prisma client singleton
│   │   ├── time.ts             # today() in America/Sao_Paulo
│   │   ├── emoji.ts             # pickEmoji(level) from emojiMap
│   │   ├── roster.ts            # normalizeName + DB lookups
│   │   ├── stats.ts             # pure aggregations
│   │   └── auth.ts              # verifyCredentials + session sign/verify
│   └── test/
│       ├── setup.ts             # vitest setup
│       └── fixtures.ts          # sample entries for stats tests
├── Dockerfile
├── docker-compose.yml
├── .env.example
├── vitest.config.ts
├── next.config.mjs              # output: 'standalone'
├── tsconfig.json
└── package.json
```

---

## Task 1: Dependencies, TypeScript, and config

**Files:**
- Modify: `package.json`
- Create: `tsconfig.json`, `vitest.config.ts`, `src/test/setup.ts`, `.env.example`
- Modify: `next.config.mjs`
- Modify: `.gitignore`

- [ ] **Step 1: Add dependencies**

Run:
```bash
npm install @prisma/client jose bcryptjs recharts
npm install -D prisma typescript @types/node @types/react @types/bcryptjs vitest @vitejs/plugin-react @testing-library/react @testing-library/jest-dom jsdom
```
Expected: installs succeed; `prisma` and `vitest` appear in devDependencies.

- [ ] **Step 2: Create `tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["dom", "dom.iterable", "ES2022"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": { "@/*": ["./src/*"] }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

- [ ] **Step 3: Set `next.config.mjs` to standalone**

Replace the file with:
```js
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  reactStrictMode: true,
};

export default nextConfig;
```
(v2 is a running Node server on its own subdomain, so the old static-export/basePath logic is gone.)

- [ ] **Step 4: Create `vitest.config.ts`**

```ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
  },
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
});
```

- [ ] **Step 5: Create `src/test/setup.ts`**

```ts
import '@testing-library/jest-dom/vitest';
```

- [ ] **Step 6: Create `.env.example`**

```bash
# App (do NOT commit real .env)
DATABASE_URL="postgresql://humor:CHANGE_ME@localhost:5432/humor?schema=public"
ADMIN_USERNAME="admin"
# bcrypt hash of the admin password (generate with: node -e "console.log(require('bcryptjs').hashSync(process.argv[1],10))" 'yourpass')
ADMIN_PASSWORD_HASH="$2a$10$replace_me"
# 32+ byte random string (generate with: node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))")
SESSION_SECRET="replace_me"
```

- [ ] **Step 7: Update `.gitignore`**

Append:
```gitignore
.env
/coverage
```

- [ ] **Step 8: Add test/build scripts to `package.json`**

Set the `scripts` block to:
```json
"scripts": {
  "dev": "next dev",
  "build": "prisma generate && next build",
  "start": "next start",
  "lint": "next lint",
  "test": "vitest run",
  "prisma:seed": "node prisma/seed.mjs"
}
```

- [ ] **Step 9: Verify tooling boots**

Run: `npx vitest run`
Expected: exits 0 with "no test files found" (or similar) — Vitest is wired up.

- [ ] **Step 10: Commit**

```bash
git add package.json package-lock.json tsconfig.json vitest.config.ts src/test/setup.ts .env.example next.config.mjs .gitignore
git commit -m "chore: add prisma, vitest, ts tooling and standalone build"
```

---

## Task 2: Prisma schema, client, migration, seed

**Files:**
- Create: `prisma/schema.prisma`, `prisma/seed.mjs`, `src/lib/db.ts`
- Uses: `src/app/appData.js` (existing `coworkers`, `coworkerGifs`, `husband`, `husbandGifs`)

- [ ] **Step 1: Create `prisma/schema.prisma`**

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model Person {
  id           Int         @id @default(autoincrement())
  name         String      @unique
  displayName  String
  isActive     Boolean     @default(true)
  isSweetheart Boolean     @default(false)
  gifUrl       String?
  createdAt    DateTime    @default(now())
  entries      MoodEntry[]
}

model MoodEntry {
  id        Int      @id @default(autoincrement())
  person    Person   @relation(fields: [personId], references: [id], onDelete: Cascade)
  personId  Int
  date      DateTime @db.Date
  mood      Int
  note      String?
  emoji     String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@unique([personId, date])
}
```

- [ ] **Step 2: Create `src/lib/db.ts` (client singleton)**

```ts
import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
```

- [ ] **Step 3: Create `prisma/seed.mjs`**

```js
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
```

- [ ] **Step 4: Start a local Postgres for dev/test**

Run:
```bash
docker run -d --name humor-pg -e POSTGRES_USER=humor -e POSTGRES_PASSWORD=humor -e POSTGRES_DB=humor -p 5432:5432 postgres:16
```
Set env: `export DATABASE_URL="postgresql://humor:humor@localhost:5432/humor?schema=public"`

- [ ] **Step 5: Create the migration**

Run: `npx prisma migrate dev --name init`
Expected: creates `prisma/migrations/*_init`, applies it, generates the client.

- [ ] **Step 6: Seed and verify**

Run: `npm run prisma:seed`
Expected: prints `seeded N people`. Verify: `npx prisma studio` (optional) or
`node -e "import('@prisma/client').then(async m=>{const p=new m.PrismaClient();console.log(await p.person.count());process.exit(0)})"`
Expected: count equals coworkers+husband length.

- [ ] **Step 7: Commit**

```bash
git add prisma src/lib/db.ts
git commit -m "feat: prisma schema, client, init migration, roster seed"
```

---

## Task 3: `src/lib/time.ts` — today in São Paulo

**Files:**
- Create: `src/lib/time.ts`, `src/lib/time.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, it, expect } from 'vitest';
import { todayInSaoPaulo } from './time';

describe('todayInSaoPaulo', () => {
  it('returns a UTC-midnight Date for the SP calendar day', () => {
    // 2026-01-01 02:00 UTC is still 2025-12-31 in São Paulo (UTC-3)
    const d = todayInSaoPaulo(new Date('2026-01-01T02:00:00Z'));
    expect(d.toISOString()).toBe('2025-12-31T00:00:00.000Z');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/time.test.ts`
Expected: FAIL (module not found).

- [ ] **Step 3: Implement `src/lib/time.ts`**

```ts
// Returns the São Paulo calendar day as a UTC-midnight Date (matches Prisma @db.Date).
export function todayInSaoPaulo(now: Date = new Date()): Date {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(now); // "YYYY-MM-DD"
  return new Date(`${parts}T00:00:00.000Z`);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/time.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/time.ts src/lib/time.test.ts
git commit -m "feat: São Paulo day helper"
```

---

## Task 4: `src/lib/emoji.ts` — server-side emoji picker

**Files:**
- Create: `src/lib/emoji.ts`, `src/lib/emoji.test.ts`
- Uses: `src/app/appData.js` (`emojiMap`)

- [ ] **Step 1: Write the failing test**

```ts
import { describe, it, expect } from 'vitest';
import { pickEmoji } from './emoji';
import { emojiMap } from '@/app/appData.js';

describe('pickEmoji', () => {
  it('returns an emoji from the level set', () => {
    const e = pickEmoji(5);
    expect(emojiMap[5]).toContain(e);
  });
  it('clamps out-of-range levels', () => {
    expect(typeof pickEmoji(999)).toBe('string');
    expect(pickEmoji(999).length).toBeGreaterThan(0);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/emoji.test.ts`
Expected: FAIL (module not found).

- [ ] **Step 3: Implement `src/lib/emoji.ts`**

```ts
import { emojiMap } from '@/app/appData.js';

export function pickEmoji(level: number): string {
  const lvl = Math.min(10, Math.max(1, Math.round(level)));
  const set: string[] = emojiMap[lvl] ?? emojiMap[5];
  return set[Math.floor(Math.random() * set.length)];
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/emoji.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/emoji.ts src/lib/emoji.test.ts
git commit -m "feat: server-side emoji picker"
```

---

## Task 5: `src/lib/stats.ts` — pure aggregations

**Files:**
- Create: `src/lib/stats.ts`, `src/lib/stats.test.ts`, `src/test/fixtures.ts`

- [ ] **Step 1: Create `src/test/fixtures.ts`**

```ts
export type FlatEntry = { person: string; date: string; mood: number; emoji: string };

// Two people over 3 days
export const sampleEntries: FlatEntry[] = [
  { person: 'ana', date: '2026-01-01', mood: 4, emoji: '😕' },
  { person: 'ana', date: '2026-01-02', mood: 8, emoji: '😎' },
  { person: 'ana', date: '2026-01-03', mood: 6, emoji: '😊' },
  { person: 'bob', date: '2026-01-02', mood: 2, emoji: '🙁' },
  { person: 'bob', date: '2026-01-03', mood: 10, emoji: '🤩' },
];
```

- [ ] **Step 2: Write the failing test**

```ts
import { describe, it, expect } from 'vitest';
import { moodOverTime, teamVibe, perPersonSummary, distribution } from './stats';
import { sampleEntries } from '@/test/fixtures';

describe('stats', () => {
  it('moodOverTime groups by person', () => {
    const r = moodOverTime(sampleEntries);
    expect(r.ana).toEqual([
      { date: '2026-01-01', mood: 4 },
      { date: '2026-01-02', mood: 8 },
      { date: '2026-01-03', mood: 6 },
    ]);
  });
  it('teamVibe averages per date', () => {
    const r = teamVibe(sampleEntries);
    expect(r.find(d => d.date === '2026-01-03')).toEqual({ date: '2026-01-03', avg: 8 });
  });
  it('perPersonSummary computes avg/best/worst/latest/streak', () => {
    const r = perPersonSummary(sampleEntries);
    const ana = r.find(p => p.person === 'ana')!;
    expect(ana.avg).toBeCloseTo(6, 5);
    expect(ana.best).toBe(8);
    expect(ana.worst).toBe(4);
    expect(ana.latestEmoji).toBe('😊');
    expect(ana.streak).toBe(3); // consecutive days ending on the latest entry
  });
  it('distribution counts moods 1..10', () => {
    const r = distribution(sampleEntries);
    expect(r[10]).toBe(1);
    expect(r[4]).toBe(1);
    expect(r[7]).toBe(0);
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npx vitest run src/lib/stats.test.ts`
Expected: FAIL (module not found).

- [ ] **Step 4: Implement `src/lib/stats.ts`**

```ts
import type { FlatEntry } from '@/test/fixtures';

export type Point = { date: string; mood: number };

export function moodOverTime(entries: FlatEntry[]): Record<string, Point[]> {
  const out: Record<string, Point[]> = {};
  for (const e of [...entries].sort((a, b) => a.date.localeCompare(b.date))) {
    (out[e.person] ??= []).push({ date: e.date, mood: e.mood });
  }
  return out;
}

export function teamVibe(entries: FlatEntry[]): { date: string; avg: number }[] {
  const byDate: Record<string, number[]> = {};
  for (const e of entries) (byDate[e.date] ??= []).push(e.mood);
  return Object.entries(byDate)
    .map(([date, moods]) => ({ date, avg: moods.reduce((a, b) => a + b, 0) / moods.length }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

export type PersonSummary = {
  person: string; avg: number; best: number; worst: number;
  latestEmoji: string; streak: number;
};

export function perPersonSummary(entries: FlatEntry[]): PersonSummary[] {
  const byPerson: Record<string, FlatEntry[]> = {};
  for (const e of entries) (byPerson[e.person] ??= []).push(e);
  return Object.entries(byPerson).map(([person, list]) => {
    const sorted = [...list].sort((a, b) => a.date.localeCompare(b.date));
    const moods = sorted.map(e => e.mood);
    const last = sorted[sorted.length - 1];
    return {
      person,
      avg: moods.reduce((a, b) => a + b, 0) / moods.length,
      best: Math.max(...moods),
      worst: Math.min(...moods),
      latestEmoji: last.emoji,
      streak: currentStreak(sorted.map(e => e.date)),
    };
  });
}

// Longest run of consecutive calendar days ending on the most recent entry.
function currentStreak(datesAsc: string[]): number {
  if (datesAsc.length === 0) return 0;
  let streak = 1;
  for (let i = datesAsc.length - 1; i > 0; i--) {
    const cur = new Date(datesAsc[i] + 'T00:00:00Z').getTime();
    const prev = new Date(datesAsc[i - 1] + 'T00:00:00Z').getTime();
    if (cur - prev === 86_400_000) streak++;
    else break;
  }
  return streak;
}

export function distribution(entries: FlatEntry[]): Record<number, number> {
  const out: Record<number, number> = {};
  for (let i = 1; i <= 10; i++) out[i] = 0;
  for (const e of entries) out[e.mood] = (out[e.mood] ?? 0) + 1;
  return out;
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run src/lib/stats.test.ts`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/lib/stats.ts src/lib/stats.test.ts src/test/fixtures.ts
git commit -m "feat: pure stats aggregations with tests"
```

---

## Task 6: `src/lib/auth.ts` — credentials + session cookie

**Files:**
- Create: `src/lib/auth.ts`, `src/lib/auth.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/auth.test.ts`
Expected: FAIL (module not found).

- [ ] **Step 3: Implement `src/lib/auth.ts`**

```ts
import bcrypt from 'bcryptjs';
import { SignJWT, jwtVerify } from 'jose';

const secret = () => new TextEncoder().encode(process.env.SESSION_SECRET!);

export async function verifyCredentials(username: string, password: string): Promise<boolean> {
  if (username !== process.env.ADMIN_USERNAME) return false;
  return bcrypt.compare(password, process.env.ADMIN_PASSWORD_HASH ?? '');
}

export async function signSession(sub: string): Promise<string> {
  return new SignJWT({ role: 'admin' })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(sub)
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(secret());
}

export async function verifySession(token: string | undefined): Promise<boolean> {
  if (!token) return false;
  try {
    const { payload } = await jwtVerify(token, secret());
    return payload.role === 'admin';
  } catch {
    return false;
  }
}

export const SESSION_COOKIE = 'hdd_session';
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/auth.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/auth.ts src/lib/auth.test.ts
git commit -m "feat: admin credential check + session sign/verify"
```

---

## Task 7: `src/lib/roster.ts` — name normalization + lookups

**Files:**
- Create: `src/lib/roster.ts`, `src/lib/roster.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, it, expect } from 'vitest';
import { normalizeName } from './roster';

describe('normalizeName', () => {
  it('lowercases and trims', () => {
    expect(normalizeName('  Gustavo ')).toBe('gustavo');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/roster.test.ts`
Expected: FAIL (module not found).

- [ ] **Step 3: Implement `src/lib/roster.ts`**

```ts
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/roster.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/roster.ts src/lib/roster.test.ts
git commit -m "feat: roster normalization + lookups"
```

---

## Task 8: `POST/GET /api/entries` (integration)

**Files:**
- Create: `src/app/api/entries/route.ts`, `src/app/api/entries/route.test.ts`

**Precondition:** local Postgres running (Task 2, Step 4), migrated + seeded, `DATABASE_URL` exported. Tests seed/clean their own person `ana`.

- [ ] **Step 1: Write the failing test**

```ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { prisma } from '@/lib/db';
import { POST, GET } from './route';

beforeAll(async () => {
  await prisma.person.upsert({
    where: { name: 'ana' },
    update: { isActive: true },
    create: { name: 'ana', displayName: 'Ana', isActive: true },
  });
});
afterAll(async () => {
  await prisma.moodEntry.deleteMany({ where: { person: { name: 'ana' } } });
});

function req(body: unknown) {
  return new Request('http://t/api/entries', {
    method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('/api/entries', () => {
  it('rejects unknown name with 422', async () => {
    const res = await POST(req({ name: 'nobody', mood: 5 }));
    expect(res.status).toBe(422);
  });
  it('rejects invalid mood with 422', async () => {
    const res = await POST(req({ name: 'ana', mood: 99 }));
    expect(res.status).toBe(422);
  });
  it('upserts a mood and appears on today board', async () => {
    const res = await POST(req({ name: 'Ana', mood: 7, note: 'ok' }));
    expect(res.status).toBe(200);
    const board = await (await GET()).json();
    const ana = board.find((e: any) => e.person === 'ana');
    expect(ana.mood).toBe(7);
    // re-post edits same day
    await POST(req({ name: 'ana', mood: 9 }));
    const board2 = await (await GET()).json();
    expect(board2.find((e: any) => e.person === 'ana').mood).toBe(9);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/app/api/entries/route.test.ts`
Expected: FAIL (module not found).

- [ ] **Step 3: Implement `src/app/api/entries/route.ts`**

```ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getActivePersonByName } from '@/lib/roster';
import { pickEmoji } from '@/lib/emoji';
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
  const emoji = pickEmoji(mood);
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/app/api/entries/route.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/app/api/entries
git commit -m "feat: /api/entries upsert + today board with roster gate"
```

---

## Task 9: `GET /api/stats`

**Files:**
- Create: `src/app/api/stats/route.ts`, `src/app/api/stats/route.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { prisma } from '@/lib/db';
import { GET } from './route';

beforeAll(async () => {
  const ana = await prisma.person.upsert({
    where: { name: 'ana' }, update: { isActive: true },
    create: { name: 'ana', displayName: 'Ana' },
  });
  await prisma.moodEntry.createMany({
    data: [
      { personId: ana.id, date: new Date('2026-01-01T00:00:00Z'), mood: 4, emoji: '😕' },
      { personId: ana.id, date: new Date('2026-01-02T00:00:00Z'), mood: 8, emoji: '😎' },
    ],
    skipDuplicates: true,
  });
});
afterAll(async () => {
  await prisma.moodEntry.deleteMany({ where: { person: { name: 'ana' } } });
});

describe('/api/stats', () => {
  it('returns the four aggregation blocks', async () => {
    const data = await (await GET()).json();
    expect(data).toHaveProperty('moodOverTime');
    expect(data).toHaveProperty('teamVibe');
    expect(data).toHaveProperty('perPerson');
    expect(data).toHaveProperty('distribution');
    expect(data.moodOverTime.ana.length).toBeGreaterThanOrEqual(2);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/app/api/stats/route.test.ts`
Expected: FAIL (module not found).

- [ ] **Step 3: Implement `src/app/api/stats/route.ts`**

```ts
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/app/api/stats/route.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/app/api/stats
git commit -m "feat: /api/stats aggregations endpoint"
```

---

## Task 10: `/api/auth` login/logout

**Files:**
- Create: `src/app/api/auth/route.ts`, `src/app/api/auth/route.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/app/api/auth/route.test.ts`
Expected: FAIL (module not found).

- [ ] **Step 3: Implement `src/app/api/auth/route.ts`**

```ts
import { NextResponse } from 'next/server';
import { verifyCredentials, signSession, SESSION_COOKIE } from '@/lib/auth';

export async function POST(request: Request) {
  const form = await request.formData();
  const username = String(form.get('username') ?? '');
  const password = String(form.get('password') ?? '');
  if (!(await verifyCredentials(username, password))) {
    return NextResponse.json({ error: 'Login inválido.' }, { status: 401 });
  }
  const token = await signSession(username);
  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true, secure: true, sameSite: 'lax', path: '/', maxAge: 7 * 24 * 3600,
  });
  return res;
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, '', { httpOnly: true, path: '/', maxAge: 0 });
  return res;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/app/api/auth/route.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/app/api/auth
git commit -m "feat: /api/auth login/logout with session cookie"
```

---

## Task 11: `/api/roster` (public GET + admin mutations)

**Files:**
- Create: `src/app/api/roster/route.ts`, `src/app/api/roster/route.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, it, expect, beforeAll } from 'vitest';
import bcrypt from 'bcryptjs';
import { GET, POST } from './route';
import { signSession, SESSION_COOKIE } from '@/lib/auth';
import { prisma } from '@/lib/db';

beforeAll(() => {
  process.env.ADMIN_USERNAME = 'admin';
  process.env.ADMIN_PASSWORD_HASH = bcrypt.hashSync('s3cret', 10);
  process.env.SESSION_SECRET = 'z'.repeat(48);
});

describe('/api/roster', () => {
  it('GET returns active people (public)', async () => {
    const data = await (await GET()).json();
    expect(Array.isArray(data)).toBe(true);
  });
  it('POST without session is 401', async () => {
    const res = await POST(new Request('http://t/api/roster', {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ name: 'newperson', displayName: 'New' }),
    }));
    expect(res.status).toBe(401);
  });
  it('POST with valid session creates a person', async () => {
    const token = await signSession('admin');
    const res = await POST(new Request('http://t/api/roster', {
      method: 'POST',
      headers: { 'content-type': 'application/json', cookie: `${SESSION_COOKIE}=${token}` },
      body: JSON.stringify({ name: 'NewPerson', displayName: 'New' }),
    }));
    expect(res.status).toBe(200);
    await prisma.person.deleteMany({ where: { name: 'newperson' } });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/app/api/roster/route.test.ts`
Expected: FAIL (module not found).

- [ ] **Step 3: Implement `src/app/api/roster/route.ts`**

```ts
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/app/api/roster/route.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/app/api/roster
git commit -m "feat: /api/roster public read + admin-gated mutations"
```

---

## Task 12: Pixel-cute theme (global CSS + layout)

**Files:**
- Modify: `src/app/globals.css` (replace with pixel design system)
- Modify: `src/app/layout.js` (fonts + pre-paint dark theme)

Port the portfolio's design language: pixel headings + legible body, pastel palette, dark
default + light toggle, chunky cards/buttons.

- [ ] **Step 1: Add fonts**

Run: `npm install @fontsource/press-start-2p @fontsource/nunito`

- [ ] **Step 2: Replace `src/app/globals.css`**

```css
@import '@fontsource/press-start-2p/400.css';
@import '@fontsource/nunito/400.css';
@import '@fontsource/nunito/700.css';

:root {
  --pink:#ffb3c6; --lavender:#cdb4f6; --mint:#b8f2cd; --on-accent:#2b2b3a;
  --font-pixel:'Press Start 2P',monospace; --font-body:'Nunito',system-ui,sans-serif;
  --step:4px;
  --bg:#1e1b2e; --text:#f4eeff; --text-soft:#b8afd6; --card:#2a2640; --border:#f4eeff; --shadow:#100d1c; --dot:rgba(205,180,246,.15);
}
[data-theme='light']{ --bg:#fdf6f0; --text:#2b2b3a; --text-soft:#5b5b6e; --card:#fff; --border:#2b2b3a; --shadow:#2b2b3a; --dot:#cdb4f6; }
*{box-sizing:border-box}
body{margin:0;background:var(--bg);color:var(--text);font-family:var(--font-body);font-size:18px;line-height:1.6;
  background-image:radial-gradient(var(--dot) 1px,transparent 1px);background-size:24px 24px;background-attachment:fixed;}
h1,h2,h3{font-family:var(--font-pixel);line-height:1.4}
h1{font-size:20px} h2{font-size:14px} h3{font-size:11px}
main{max-width:760px;margin:0 auto;padding:40px 18px 80px}
a{color:var(--text)}
.pixel-card{background:var(--card);border:var(--step) solid var(--border);box-shadow:calc(var(--step)*2) calc(var(--step)*2) 0 0 var(--shadow);padding:18px;margin-bottom:18px}
.pixel-btn{font-family:var(--font-pixel);font-size:10px;color:var(--on-accent);background:var(--mint);border:var(--step) solid var(--border);box-shadow:var(--step) var(--step) 0 0 var(--shadow);padding:12px 14px;cursor:pointer;text-decoration:none;display:inline-block;margin:6px 8px 6px 0}
.pixel-btn:hover{transform:translate(2px,2px);box-shadow:2px 2px 0 0 var(--shadow)}
.pixel-btn--pink{background:var(--pink)} .pixel-btn--lav{background:var(--lavender)}
.pixel-input{font-family:var(--font-body);font-size:16px;padding:10px;border:3px solid var(--border);background:var(--bg);color:var(--text);width:100%}
.tag{font-family:var(--font-pixel);font-size:8px;color:var(--on-accent);background:var(--lavender);border:2px solid var(--border);padding:4px 6px;margin-right:4px;display:inline-block}
.theme-toggle{position:fixed;top:12px;right:12px;z-index:10;font-size:9px}
.nav a{margin-right:12px;font-family:var(--font-pixel);font-size:9px}
a:focus-visible,.pixel-btn:focus-visible,.pixel-input:focus-visible{outline:3px solid var(--lavender);outline-offset:3px}
```

- [ ] **Step 3: Replace `src/app/layout.js`**

```js
export const metadata = { title: 'Humor do Dia', description: 'O humor do dia da turma.' };

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR" data-theme="dark">
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){var t=localStorage.getItem('theme')||'dark';document.documentElement.setAttribute('data-theme',t);})();`,
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
```

- [ ] **Step 4: Verify build compiles**

Run: `npm run build`
Expected: build succeeds (Prisma generate + Next build). If a page errors because it's rewritten in a later task, that's expected only until Task 13/14 land — at this point `layout.js`/`globals.css` alone must not break the build.

- [ ] **Step 5: Commit**

```bash
git add src/app/globals.css src/app/layout.js package.json package-lock.json
git commit -m "feat: pixel-cute theme (fonts, palette, dark default)"
```

---

## Task 13: Board + mood form (`src/app/page.js`)

**Files:**
- Modify: `src/app/page.js`
- Create: `src/app/ThemeToggle.js`, `src/app/page.test.jsx`

- [ ] **Step 1: Create `src/app/ThemeToggle.js`**

```js
'use client';
import { useEffect, useState } from 'react';

export default function ThemeToggle() {
  const [theme, setTheme] = useState('dark');
  useEffect(() => { setTheme(document.documentElement.getAttribute('data-theme') || 'dark'); }, []);
  function toggle() {
    const next = theme === 'light' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('theme', next);
    setTheme(next);
  }
  return <button className="pixel-btn theme-toggle" onClick={toggle}>{theme === 'light' ? '☾ dark' : '☀ light'}</button>;
}
```

- [ ] **Step 2: Write the failing component test**

```jsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Home from './page';

beforeEach(() => {
  global.fetch = vi.fn(async (url, opts) => {
    if (String(url).includes('/api/roster')) return { ok: true, json: async () => [{ name: 'ana', displayName: 'Ana' }] };
    if (String(url).includes('/api/entries') && opts?.method === 'POST') return { ok: true, json: async () => ({ ok: true, emoji: '😎' }) };
    return { ok: true, json: async () => [] }; // GET today board
  });
});

describe('Home', () => {
  it('submits a mood for a roster name', async () => {
    render(<Home />);
    fireEvent.change(await screen.findByPlaceholderText(/nome/i), { target: { value: 'Ana' } });
    fireEvent.change(screen.getByLabelText(/humor/i), { target: { value: '8' } });
    fireEvent.click(screen.getByRole('button', { name: /salvar/i }));
    await waitFor(() => expect(global.fetch).toHaveBeenCalledWith('/api/entries', expect.objectContaining({ method: 'POST' })));
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npx vitest run src/app/page.test.jsx`
Expected: FAIL (current page.js has no such behavior / imports).

- [ ] **Step 4: Implement `src/app/page.js`**

```js
'use client';
import { useEffect, useState } from 'react';
import Confetti from 'react-confetti';
import ThemeToggle from './ThemeToggle';

export default function Home() {
  const [name, setName] = useState('');
  const [mood, setMood] = useState(5);
  const [note, setNote] = useState('');
  const [board, setBoard] = useState([]);
  const [error, setError] = useState('');
  const [savedEmoji, setSavedEmoji] = useState('');

  async function loadBoard() {
    const res = await fetch('/api/entries');
    setBoard(await res.json());
  }
  useEffect(() => { loadBoard(); }, []);

  async function save(e) {
    e.preventDefault();
    setError('');
    const res = await fetch('/api/entries', {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ name, mood: Number(mood), note }),
    });
    if (!res.ok) { const j = await res.json(); setError(j.error || 'Erro ao salvar.'); return; }
    const j = await res.json();
    setSavedEmoji(j.emoji);
    await loadBoard();
  }

  const me = board.find(b => b.person === name.trim().toLowerCase());

  return (
    <main>
      <ThemeToggle />
      {Number(mood) === 10 && <Confetti />}
      <h1>Humor do Dia</h1>
      <nav className="nav"><a href="/">board</a><a href="/stats">stats</a><a href="/admin">admin</a></nav>

      <form className="pixel-card" onSubmit={save}>
        <p><label>Seu nome:</label><br />
          <input className="pixel-input" placeholder="Digite seu nome" value={name} onChange={e => setName(e.target.value)} /></p>
        <p><label htmlFor="mood">Como está seu humor hoje? (1–10)</label><br />
          <input id="mood" className="pixel-input" type="number" min={1} max={10} value={mood} onChange={e => setMood(e.target.value)} /></p>
        <p><label>Observação (opcional):</label><br />
          <input className="pixel-input" value={note} onChange={e => setNote(e.target.value)} /></p>
        {savedEmoji && <div style={{ fontSize: '2rem' }}>{savedEmoji}</div>}
        {me?.gifUrl && <img src={me.gifUrl} alt="" style={{ maxWidth: 200, borderRadius: 8 }} />}
        {me?.isSweetheart && <div style={{ fontSize: '2rem' }}>{'❤️ '.repeat(5)}</div>}
        {error && <p role="alert" className="tag" style={{ background: 'var(--pink)' }}>{error}</p>}
        <button className="pixel-btn pixel-btn--pink" type="submit">Salvar</button>
      </form>

      <div className="pixel-card">
        <h3>Board de hoje</h3>
        <ul>
          {board.map(b => (
            <li key={b.person}><b>{b.displayName}</b>: {b.mood} <span style={{ fontSize: '1.4em' }}>{b.emoji}</span></li>
          ))}
        </ul>
      </div>
    </main>
  );
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run src/app/page.test.jsx`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/app/page.js src/app/ThemeToggle.js src/app/page.test.jsx
git commit -m "feat: DB-backed board + mood form with pixel theme"
```

---

## Task 14: Stats dashboard (`src/app/stats/page.js`)

**Files:**
- Create: `src/app/stats/page.js`

Charts via Recharts. This page reads `/api/stats` and renders the four views.

- [ ] **Step 1: Implement `src/app/stats/page.js`**

```js
'use client';
import { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import ThemeToggle from '../ThemeToggle';

const COLORS = ['#ffb3c6', '#cdb4f6', '#b8f2cd', '#ffd93d', '#8ecae6', '#ff9f9f'];

export default function Stats() {
  const [data, setData] = useState(null);
  useEffect(() => { fetch('/api/stats').then(r => r.json()).then(setData); }, []);
  if (!data) return <main><p>Carregando…</p></main>;

  const people = Object.keys(data.moodOverTime);
  const dist = Object.entries(data.distribution).map(([mood, count]) => ({ mood, count }));

  return (
    <main>
      <ThemeToggle />
      <h1>Stats</h1>
      <nav className="nav"><a href="/">board</a><a href="/stats">stats</a><a href="/admin">admin</a></nav>

      <div className="pixel-card">
        <h3>Humor ao longo do tempo</h3>
        <ResponsiveContainer width="100%" height={260}>
          <LineChart>
            <XAxis dataKey="date" allowDuplicatedCategory={false} />
            <YAxis domain={[1, 10]} /><Tooltip />
            {people.map((p, i) => (
              <Line key={p} data={data.moodOverTime[p]} dataKey="mood" name={p} stroke={COLORS[i % COLORS.length]} type="stepAfter" dot />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="pixel-card">
        <h3>Vibe da turma (média diária)</h3>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={data.teamVibe}>
            <XAxis dataKey="date" /><YAxis domain={[1, 10]} /><Tooltip />
            <Line dataKey="avg" stroke="#cdb4f6" type="stepAfter" dot />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="pixel-card">
        <h3>Resumo por pessoa</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 12 }}>
          {data.perPerson.map(p => (
            <div key={p.person} className="pixel-card" style={{ margin: 0 }}>
              <b>{p.person}</b> {p.latestEmoji}
              <div className="tag">média {p.avg.toFixed(1)}</div>
              <div className="tag">streak {p.streak}d</div>
              <div className="tag">↑{p.best} ↓{p.worst}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="pixel-card">
        <h3>Distribuição de humores</h3>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={dist}>
            <XAxis dataKey="mood" /><YAxis allowDecimals={false} /><Tooltip />
            <Bar dataKey="count" fill="#b8f2cd" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </main>
  );
}
```

- [ ] **Step 2: Verify build compiles**

Run: `npm run build`
Expected: build succeeds; `/stats` compiles.

- [ ] **Step 3: Commit**

```bash
git add src/app/stats/page.js
git commit -m "feat: stats dashboard with Recharts (pixel styled)"
```

---

## Task 15: Admin page (`src/app/admin/page.js`)

**Files:**
- Create: `src/app/admin/page.js`, `src/app/admin/page.test.jsx`

- [ ] **Step 1: Write the failing component test**

```jsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import Admin from './page';

beforeEach(() => {
  global.fetch = vi.fn(async () => ({ ok: true, json: async () => [] }));
});

describe('Admin', () => {
  it('renders a password-manager-friendly login form', async () => {
    render(<Admin />);
    const user = await screen.findByLabelText(/usuário/i);
    const pass = screen.getByLabelText(/senha/i);
    expect(user).toHaveAttribute('autocomplete', 'username');
    expect(pass).toHaveAttribute('type', 'password');
    expect(pass).toHaveAttribute('autocomplete', 'current-password');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/app/admin/page.test.jsx`
Expected: FAIL (module not found).

- [ ] **Step 3: Implement `src/app/admin/page.js`**

```js
'use client';
import { useEffect, useState } from 'react';
import ThemeToggle from '../ThemeToggle';

export default function Admin() {
  const [authed, setAuthed] = useState(false);
  const [roster, setRoster] = useState([]);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ name: '', displayName: '', gifUrl: '', isSweetheart: false });

  async function loadRoster() {
    const res = await fetch('/api/roster');
    setRoster(await res.json());
  }
  useEffect(() => { loadRoster(); }, []);

  async function login(e) {
    e.preventDefault();
    setError('');
    const fd = new FormData(e.currentTarget);
    const res = await fetch('/api/auth', { method: 'POST', body: fd });
    if (res.ok) { setAuthed(true); await loadRoster(); } else setError('Login inválido.');
  }

  async function savePerson(e) {
    e.preventDefault();
    const res = await fetch('/api/roster', {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify(form),
    });
    if (res.status === 401) { setAuthed(false); return; }
    setForm({ name: '', displayName: '', gifUrl: '', isSweetheart: false });
    await loadRoster();
  }

  async function deactivate(name) {
    await fetch('/api/roster', {
      method: 'DELETE', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ name }),
    });
    await loadRoster();
  }

  return (
    <main>
      <ThemeToggle />
      <h1>Admin</h1>
      <nav className="nav"><a href="/">board</a><a href="/stats">stats</a><a href="/admin">admin</a></nav>

      {!authed && (
        <form className="pixel-card" method="post" action="/api/auth" onSubmit={login}>
          <h3>Login</h3>
          <p><label htmlFor="u">Usuário</label><br />
            <input id="u" name="username" className="pixel-input" autoComplete="username" /></p>
          <p><label htmlFor="p">Senha</label><br />
            <input id="p" name="password" type="password" className="pixel-input" autoComplete="current-password" /></p>
          {error && <p role="alert" className="tag" style={{ background: 'var(--pink)' }}>{error}</p>}
          <button className="pixel-btn" type="submit">Entrar</button>
        </form>
      )}

      {authed && (
        <form className="pixel-card" onSubmit={savePerson}>
          <h3>Adicionar / editar pessoa</h3>
          <input className="pixel-input" placeholder="name (id, minúsculo)" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
          <input className="pixel-input" placeholder="displayName" value={form.displayName} onChange={e => setForm({ ...form, displayName: e.target.value })} />
          <input className="pixel-input" placeholder="gifUrl (opcional)" value={form.gifUrl} onChange={e => setForm({ ...form, gifUrl: e.target.value })} />
          <label><input type="checkbox" checked={form.isSweetheart} onChange={e => setForm({ ...form, isSweetheart: e.target.checked })} /> sweetheart 💛</label>
          <br /><button className="pixel-btn pixel-btn--pink" type="submit">Salvar pessoa</button>
        </form>
      )}

      <div className="pixel-card">
        <h3>Roster</h3>
        <ul>
          {roster.map(p => (
            <li key={p.name}>
              <b>{p.displayName}</b> ({p.name}){p.isSweetheart ? ' 💛' : ''}
              {authed && <button className="pixel-btn" style={{ marginLeft: 8 }} onClick={() => deactivate(p.name)}>desativar</button>}
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/app/admin/page.test.jsx`
Expected: PASS.

- [ ] **Step 5: Full test + build**

Run: `npx vitest run && npm run build`
Expected: all tests pass; build succeeds.

- [ ] **Step 6: Commit**

```bash
git add src/app/admin
git commit -m "feat: admin login + roster management UI"
```

---

## Task 16: Dockerfile + docker-compose (web + Postgres) + deploy docs

**Files:**
- Create: `Dockerfile`, `docker-compose.yml`, `.dockerignore`
- Modify: `README.md` (deploy notes)

- [ ] **Step 1: Create `.dockerignore`**

```gitignore
node_modules
.next
.git
.github
npm-debug.log*
.env
```

- [ ] **Step 2: Create `Dockerfile` (standalone Node runtime)**

```dockerfile
# Build stage
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npx prisma generate
ENV NODE_ENV=production
RUN npm run build

# Runtime stage — Next.js standalone
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY docker-entrypoint.sh ./docker-entrypoint.sh
RUN chmod +x docker-entrypoint.sh
EXPOSE 3000
CMD ["./docker-entrypoint.sh"]
```

- [ ] **Step 3: Create `docker-entrypoint.sh`**

```sh
#!/bin/sh
set -e
# Apply migrations, seed if empty, then start the server.
npx prisma migrate deploy
node prisma/seed.mjs || true
exec node server.js
```

- [ ] **Step 4: Create `docker-compose.yml`**

```yaml
services:
  humor-web:
    build: .
    container_name: ${APP_NAME:-humor-do-dia}
    restart: unless-stopped
    env_file: .env
    environment:
      - DATABASE_URL=postgresql://humor:${DB_PASSWORD}@humor-db:5432/humor?schema=public
    depends_on:
      humor-db:
        condition: service_healthy
    networks:
      - traefik_public
      - humor_internal
    labels:
      - "traefik.enable=true"
      - "traefik.docker.network=traefik_public"
      - "traefik.http.routers.${APP_NAME:-humor-do-dia}.rule=Host(`${DOMAIN}`)"
      - "traefik.http.routers.${APP_NAME:-humor-do-dia}.entrypoints=websecure"
      - "traefik.http.routers.${APP_NAME:-humor-do-dia}.tls=true"
      - "traefik.http.routers.${APP_NAME:-humor-do-dia}.tls.certresolver=letsencrypt"
      - "traefik.http.services.${APP_NAME:-humor-do-dia}.loadbalancer.server.port=3000"
      - "traefik.http.routers.${APP_NAME:-humor-do-dia}.middlewares=humor-ratelimit"
      - "traefik.http.middlewares.humor-ratelimit.ratelimit.average=60"
      - "traefik.http.middlewares.humor-ratelimit.ratelimit.burst=30"
      - "traefik.http.routers.${APP_NAME:-humor-do-dia}-http.rule=Host(`${DOMAIN}`)"
      - "traefik.http.routers.${APP_NAME:-humor-do-dia}-http.entrypoints=web"
      - "traefik.http.routers.${APP_NAME:-humor-do-dia}-http.middlewares=humor-https"
      - "traefik.http.middlewares.humor-https.redirectscheme.scheme=https"
      - "traefik.http.middlewares.humor-https.redirectscheme.permanent=true"

  humor-db:
    image: postgres:16
    container_name: ${APP_NAME:-humor-do-dia}-db
    restart: unless-stopped
    environment:
      POSTGRES_USER: humor
      POSTGRES_PASSWORD: ${DB_PASSWORD}
      POSTGRES_DB: humor
    volumes:
      - humor_pgdata:/var/lib/postgresql/data
    networks:
      - humor_internal
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U humor -d humor"]
      interval: 10s
      timeout: 5s
      retries: 5

volumes:
  humor_pgdata:

networks:
  traefik_public:
    external: true
  humor_internal:
    internal: true
```

- [ ] **Step 5: Update `.env.example`**

Append:
```bash
APP_NAME=humor-do-dia
DOMAIN=humor.isoca.space
DB_PASSWORD=CHANGE_ME
```
(On the VPS, `DATABASE_URL` is derived from `DB_PASSWORD` in compose; keep them consistent.)

- [ ] **Step 6: Local end-to-end smoke (optional but recommended)**

Run:
```bash
cp .env.example .env    # set DB_PASSWORD, ADMIN_* , SESSION_SECRET
docker compose up -d --build
curl -sf http://localhost:3000/api/roster && echo OK
docker compose down
```
Expected: `/api/roster` returns `[]` or the seeded roster; `OK` prints.

- [ ] **Step 7: Update `README.md` deploy section**

Add:
```markdown
## Deploy (VPS, Traefik)
DNS: `humor.isoca.space` A → VPS IP. On the VPS:
`git clone` this repo under /home/isoca/projects, `cp .env.example .env` and fill
`DB_PASSWORD`, `ADMIN_USERNAME`, `ADMIN_PASSWORD_HASH`, `SESSION_SECRET`, then
`docker compose up -d --build`. Migrations + seed run automatically on start.
```

- [ ] **Step 8: Commit**

```bash
git add Dockerfile docker-entrypoint.sh docker-compose.yml .dockerignore .env.example README.md
git commit -m "feat: dockerized web + postgres deploy with migrate-on-start"
```

---

## Self-Review

**Spec coverage:**
- Next.js full-stack Node container + Route Handlers → Tasks 1, 8–11, 16. ✓
- Prisma + Postgres, internal network, volume → Tasks 2, 16. ✓
- Data model (Person, MoodEntry, unique person+date) → Task 2. ✓
- Roster seed from legacy lists → Task 2. ✓
- Posting roster-gated, mood 1–10, server emoji, SP-day upsert → Tasks 3,4,7,8. ✓
- Charm (emoji/gifs/hearts/confetti at 10) → Tasks 4, 13. ✓
- Anti-spam: roster gate (Task 8) + Traefik rate-limit (Task 16). ✓
- Stats (4 views) → Tasks 5, 9, 14. ✓
- Admin login (username+password, password-manager friendly) + roster CRUD → Tasks 6,10,11,15. ✓
- Pixel-cute theme, dark default + toggle, pt-BR → Tasks 12, 13. ✓
- Migrations on deploy → Task 16 (entrypoint). ✓
- Testing (unit lib, API integration, component) → Tasks 3–11, 13, 15. ✓
- Non-goals (backups, multi-user, i18n, historical edits) → excluded. ✓

**Placeholder scan:** No TBD/"add validation"/"similar to Task N". `appData.js` `emojiMap` is an existing file referenced, not a placeholder. Real code in every implementing step. ✓

**Type/name consistency:** `SESSION_COOKIE` ('hdd_session') defined in Task 6, used in Tasks 10/11. `getActivePersonByName`/`normalizeName`/`activeRoster` defined in Task 7, used in Tasks 8/11. `todayInSaoPaulo` (Task 3) used in Task 8. `pickEmoji` (Task 4) used in Task 8. `moodOverTime/teamVibe/perPersonSummary/distribution` (Task 5) used in Task 9. `FlatEntry` fixture type reused by stats. Stats JSON keys (`moodOverTime/teamVibe/perPerson/distribution`) produced in Task 9 match consumption in Task 14. Prisma composite key `personId_date` used in Task 8 upsert matches `@@unique([personId, date])` in Task 2. ✓
