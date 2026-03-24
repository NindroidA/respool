# Respool — Agent Instructions

## Commands

```bash
bun dev              # Dev server (localhost:3000)
bun run build        # Production build
npx tsc --noEmit     # Type check (no tests yet)
bunx prisma migrate dev    # Run migrations
bunx prisma db seed        # Seed filament colors
bunx prisma generate       # Regenerate Prisma client
bunx prisma studio         # Visual database browser
```

## Architecture

```
src/app/(auth)/        Auth pages (login, register)
src/app/(dashboard)/   Authenticated pages + server actions
src/app/api/           Auth handler, health check
src/components/        UI components (ui/, layout/, spools/, etc.)
src/lib/               Auth, Prisma, validators, constants, parser
src/proxy.ts           Route protection (Next.js 16 proxy)
prisma/schema.prisma   Database schema (source of truth)
docs/                  Architecture, design system, features, G-code spec
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
- **Server Actions** for all mutations — validate with Zod, check auth via `getSession()`
- **G-code parser** runs client-side only — never send file data to server
- **Prisma** schema is the source of truth — check `prisma/schema.prisma` before writing queries
- See `docs/` for architecture, design system, features, and G-code parser specs

## Key Patterns

- Every server action must call `requireUser()` or `requireAdmin()`
- Every data query must filter by `userId` — never return other users' data
- Sort fields must be validated against an allowlist (see spools/actions.ts)
- Spool creation uses atomic transactions for sequential `spoolNumber` assignment
- Print status must be one of: `planned`, `in_progress`, `completed`
- `FilamentColor` table is seeded — don't hardcode colors
