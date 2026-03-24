# Contributing to Respool

Thanks for your interest in contributing! Here's how to get started.

## Development Setup

### Prerequisites

- [Bun](https://bun.sh/) (package manager & runtime)
- [Docker](https://www.docker.com/) (for PostgreSQL, or bring your own Postgres instance)
- [Node.js 22+](https://nodejs.org/) (for Next.js runtime)

### Getting Started

```bash
# Clone the repo
git clone https://github.com/NindroidA/respool.git
cd respool

# Install dependencies
bun install

# Set up environment
cp .env.example .env
# Edit .env — at minimum set DATABASE_URL and BETTER_AUTH_SECRET

# Start PostgreSQL (via Docker)
docker compose up db -d

# Run database migrations and seed data
bunx prisma migrate dev
bunx prisma db seed

# Start the dev server
bun dev
```

The app will be available at `http://localhost:3000`.

## Making Changes

### Branch Naming

- `feat/short-description` — new features
- `fix/short-description` — bug fixes
- `silly/short-description` - silly fixes
- `docs/short-description` — documentation changes
- `refactor/short-description` — code refactoring

### Code Standards

- **TypeScript strict mode** — no `any`, no `@ts-ignore` without justification
- **Zod validation** on all server action inputs
- **Auth checks** — every server action must call `requireUser()` or `requireAdmin()`
- **Owner checks** — always verify `userId` matches the authenticated user before returning/modifying data
- **Mobile responsive** — every page must work on phone screens
- Use existing components from `src/components/ui/` (shadcn/ui)
- Follow the design system in `docs/DESIGN_SYSTEM.md`

### Commit Messages

Use conventional commits:

```
feat: add spool duplication
fix: correct mass calculation on log delete
silly: misspelled word
docs: update architecture diagram
refactor: extract color matching logic
```

### Testing Your Changes

```bash
# Type check
npx tsc --noEmit

# Run the dev server and test manually
bun dev
```

## Pull Request Process

1. Fork the repository and create your branch from `main`
2. Make your changes following the code standards above
3. Ensure `npx tsc --noEmit` passes with no errors
4. Test your changes locally with `bun dev`
5. Write a clear PR description explaining **what** and **why**
6. Submit the PR — a maintainer will review it

### PR Description Template

```markdown
## What

Brief description of what this PR does.

## Why

Why is this change needed?

## How to Test

Steps to verify the change works correctly.
```

## Project Structure

See `docs/ARCHITECTURE.md` for the full system overview. Key directories:

```
src/
├── app/           # Next.js App Router pages and server actions
├── components/    # React components (ui/, layout/, spools/, etc.)
├── lib/           # Shared utilities (auth, prisma, validators, constants)
└── hooks/         # Custom React hooks
```

## Design System

The app uses a **jade green accent** (`#10b981`) dark theme. See `docs/DESIGN_SYSTEM.md` for the full color palette, typography, and component styles.

## Questions?

Open an issue or start a discussion on the repository. Always happy to help!
