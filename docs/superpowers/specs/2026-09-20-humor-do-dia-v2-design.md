# humor-do-dia v2 — Design Spec

**Date:** 2026-09-20
**Owner:** Isabelly Baldo ([@isabellybaldo](https://github.com/isabellybaldo))
**Status:** Approved design → ready for implementation plan
**Repo:** `isabellybaldo/humor-do-dia` · deploys to `https://humor.isoca.space`

## Goal

Upgrade humor-do-dia from a localStorage-only shared mood board into a persistent,
DB-backed **shared daily mood board** with real history, per-person stats, a small
admin area to manage the roster, and a pixel-cute redesign matching the portfolio's
look. Keep all the existing charm.

**Scope note:** This spec covers the **app upgrade only**. The CI/CD change (dedicated
VPS deploy user + deploy-on-merge-to-main) is a separate sub-project with its own spec.

## What exists today

A Next.js (App Router) client-only app: type a name (coworkers get GIFs, husband gets
hearts, a 10 fires confetti), pick a 1–10 mood (random emoji per level), optional note,
"Salvar". Data is stored in `localStorage` keyed by date and wiped except for the current
day — so no history, no DB, no stats. UI is pt-BR, hardcoded dark. It is currently
deployed to `humor.isoca.space` as a static export behind Traefik (see the `deploy/vps`
branch / PR #1).

## Architecture

- **Next.js full-stack**, running as a **Node server container** (not static export).
  - React UI (client) + **Route Handlers** under `src/app/api/**` for the JSON API.
- **Prisma** ORM against **Postgres** (a `postgres` container).
- **Traefik** fronts the web container (`humor.isoca.space`, `letsencrypt` resolver).
  Postgres runs on a **separate internal Docker network**, never published to the host or
  the internet; a named volume holds its data.
- Config via `.env` on the VPS (`DATABASE_URL`, `ADMIN_USERNAME`, `ADMIN_PASSWORD_HASH`,
  `SESSION_SECRET`), never committed.

### Units / boundaries
- `src/lib/db.ts` — Prisma client singleton.
- `src/lib/roster.ts` — roster lookups + validation (is name allowed/active).
- `src/lib/stats.ts` — pure aggregation functions (given entries → chart-ready data).
- `src/lib/auth.ts` — admin session issue/verify (signed cookie).
- `src/app/api/entries/route.ts` — `POST` upsert a mood, `GET` today's board.
- `src/app/api/stats/route.ts` — `GET` aggregated stats.
- `src/app/api/roster/route.ts` — `GET` public active roster; `POST`/`PATCH`/`DELETE`
  admin-only mutations.
- `src/app/api/auth/route.ts` — admin login/logout.
- UI: `src/app/page.js` (board + form), `src/app/stats/page.js` (dashboard),
  `src/app/admin/page.js` (login + roster management).

## Data model (Prisma / Postgres)

```prisma
model Person {
  id           Int         @id @default(autoincrement())
  name         String      @unique            // lowercase key, e.g. "gustavo"
  displayName  String                          // shown in UI
  isActive     Boolean     @default(true)
  isSweetheart Boolean     @default(false)     // husband -> hearts
  gifUrl       String?                          // coworker/husband GIF (optional)
  createdAt    DateTime    @default(now())
  entries      MoodEntry[]
}

model MoodEntry {
  id        Int      @id @default(autoincrement())
  person    Person   @relation(fields: [personId], references: [id], onDelete: Cascade)
  personId  Int
  date      DateTime @db.Date                   // the calendar day (America/Sao_Paulo)
  mood      Int                                  // 1..10
  note      String?
  emoji     String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@unique([personId, date])                    // one entry per person per day (upsert)
}
```

The roster is **seeded** from the current `coworkers` / `husband` lists (with their GIFs)
in the first migration, and thereafter edited via the admin UI.

## Behavior

**Posting a mood** (`POST /api/entries`, public):
- Body: `name`, `mood` (1–10), `note?`. Server resolves `name` → active `Person`
  (case-insensitive). **Unknown/inactive name → 422** with a friendly pt-BR message.
- Emoji is chosen server-side from the level's emoji set (kept from `appData`) and stored.
- Upsert on `(personId, date)` using today's date in `America/Sao_Paulo` — re-posting the
  same day **edits** that day's entry.
- Rate-limited by a Traefik `rate-limit` middleware on the write route.

**Charm preserved:** random emoji per level, coworker GIFs + husband hearts (driven by
`Person.gifUrl` / `isSweetheart`), confetti at mood 10.

**Viewing** (public): today's board on `/`, full dashboard on `/stats`.

**Admin** (`/admin`, login-gated):
- Login form → `POST /api/auth` checks **username + password** against `ADMIN_USERNAME`
  + `ADMIN_PASSWORD_HASH` (bcrypt), issues a signed, HTTP-only, `Secure`, `SameSite=Lax`
  session cookie (JWT via `jose`, ~7-day TTL). Logout clears it.
- **Password-manager friendly**: the login is a real `<form method="post" action="/api/auth">`
  with a username field (`autocomplete="username"`) and a password field
  (`type="password"`, `autocomplete="current-password"`), so Chrome/others offer to save
  and autofill it. A successful non-JS submit still works (progressive enhancement).
- Roster CRUD: add/edit/deactivate people (name, displayName, isActive, isSweetheart,
  gifUrl). All mutation routes verify the session server-side.

## Stats dashboard (`/stats`)

Server aggregates via `src/lib/stats.ts`; charts rendered with **Recharts**, pixel-styled:
1. **Mood over time (per person)** — line chart, one series per active person (selectable).
2. **Team vibe over time** — daily average mood across everyone.
3. **Per-person summary** — cards: average mood, current logging streak, best & worst day,
   latest emoji.
4. **Distribution + today's board** — histogram of 1–10 frequencies + the live today list.

## Pixel-cute theme

Reuse the portfolio's design language: *Press Start 2P* headings + *Nunito* body, pastel
palette (cream/pink/lavender/mint), **dark by default with a light toggle**, chunky pixel
cards/buttons, hard stepped shadows. Applied to the form, board, admin, and dashboard;
charts styled to match (stepped lines, pastel fills). UI stays **pt-BR**.

## Deployment

- `docker-compose.yml`: `web` (Next.js Node server, Traefik labels) + `postgres`
  (internal network, named volume). `web` depends on `postgres` healthy.
- Dockerfile: multi-stage — build Next.js (standalone output) → slim Node runtime.
- **Migrations** run on deploy via `prisma migrate deploy` (an entrypoint step or a
  one-shot init before the web app serves). Seed runs once if the roster is empty.
- Replaces the current static-export deployment of humor-do-dia on the VPS.

## Non-goals (v1 / future)

- DB backups/retention (separate follow-up).
- Multi-user accounts / per-person auth (only a single admin exists).
- i18n (stays pt-BR).
- Editing/deleting arbitrary historical entries via UI (only current-day upsert).

## Testing

- **Unit:** `stats.ts` aggregations (averages, streaks, distribution) with fixture data;
  `roster.ts` validation (known/unknown/inactive).
- **API:** `POST /api/entries` (happy path upsert, unknown-name 422, bad mood 422),
  `GET /api/stats` shape, roster mutation routes reject without a valid admin session.
  Run against a disposable Postgres (CI service container).
- **Component:** the mood form (submit → optimistic update) and admin login gate.
