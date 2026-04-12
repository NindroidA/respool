# Respool — Agent Instructions

## Commands

```bash
bun dev              # Dev server (localhost:3000)
bun run build        # Production build
bun run test         # Run vitest suite (162 tests)
npx tsc --noEmit     # Type check
bunx prisma migrate dev    # Run migrations
bunx prisma db seed        # Seed filament colors
bunx prisma generate       # Regenerate Prisma client
bunx prisma studio         # Visual database browser
```

## Architecture

```
src/app/(auth)/        Auth pages (login, register, verify-2fa)
src/app/(dashboard)/   Authenticated pages + server actions
src/app/api/           Auth handler, health check
src/components/        UI components (ui/, layout/, spools/, calculator/, labels/, etc.)
src/hooks/             Custom hooks (use-calculator.ts)
src/lib/               Auth, Prisma, validators, constants, slicer-profiles, gcode-parser, audit
src/proxy.ts           Route protection (Next.js 16 proxy)
prisma/schema.prisma   Database schema (source of truth)
docs/                  Architecture, design system, features, G-code spec
vitest.config.ts       Test configuration with path aliases
```

## Next.js 16 Notice

This project uses Next.js 16 which has breaking changes from training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

- `middleware.ts` is deprecated — use `proxy.ts` with `export function proxy()` instead
- Route protection is in `src/proxy.ts`

## Database

- PostgreSQL 17 via Docker (`docker compose up db -d`)
- Prisma ORM — always run `bunx prisma generate` after schema changes
- Migrations: `bunx prisma migrate dev --name description`

## Project Conventions

- **Jade green accent** (`#10b981`) — not cyan/blue
- **Server Actions** for all mutations — validate with Zod, check auth via `requireUser()`
- **G-code parser** runs client-side only — never send file data to server
- **Multi-slicer support** — 8 slicers auto-detected (see `docs/GCODE_PARSER.md`)
- **Prisma** schema is the source of truth — check `prisma/schema.prisma` before writing queries
- **Prisma where clauses** must use typed inputs (e.g. `Prisma.SpoolWhereInput`), not `Record<string, unknown>`
- **Error handling** — all catch blocks must inspect errors: `catch (err) { toast.error(err instanceof Error ? err.message : "fallback") }`
- **Audit logging** — all mutations call `audit({ user, action, category, ... })` from `src/lib/audit.ts`
- **Zod helpers** — shared `optionalPositiveNumber`/`optionalPositiveInt` live in `src/lib/validators.ts` — import, don't redeclare
- See `docs/` for architecture, design system, features, and G-code parser specs

## Key Patterns

- Every server action must call `requireUser()` or `requireAdmin()` from `src/lib/auth-helpers.ts`
- `requireUser()` checks both session AND banned status
- Every data query must filter by `userId` — never return other users' data
- Sort fields must be validated against an allowlist (see spools/actions.ts)
- Spool creation uses atomic transactions for sequential `spoolNumber` assignment
- Print status must be one of: `planned`, `in_progress`, `completed`
- `FilamentColor` table is seeded — don't hardcode colors
- One `actions.ts` file per route directory — don't split into multiple action files
- Tests colocate with source files (e.g. `validators.test.ts` next to `validators.ts`)
