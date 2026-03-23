# Respool

Self-hosted 3D printing filament management — track spools, log usage, plan swaps.

## Features

- **Spool Tracking** — manage your filament inventory with rich metadata (brand, material, color, cost)
- **Usage Logging** — log filament usage per spool with quick-log from anywhere
- **Boxes** — organize spools into physical storage containers
- **Print Tracking** — log prints before or after printing with dual-mode flow
- **Dashboard** — stats, charts, low filament alerts, and activity feed
- **Color Database** — 60+ curated filament colors across solid, silk, matte, dual-color, and more
- **Admin Panel** — user management with 2FA requirement for admin access
- **Self-Hosted** — Docker deployment with PostgreSQL, designed for your homelab

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js (App Router) |
| Language | TypeScript (strict) |
| Database | PostgreSQL 17 |
| ORM | Prisma |
| Auth | Better Auth |
| UI | Tailwind CSS v4 + shadcn/ui |
| Animations | Framer Motion |
| Charts | Recharts |
| Package Manager | bun |

## Quick Start (Docker)

```bash
git clone https://github.com/YOUR_USERNAME/respool.git
cd respool
cp .env.example .env
# Edit .env with your secrets
docker compose up -d
```

The app will be available at http://localhost:3000.

## Development

```bash
# Install dependencies
bun install

# Set up database
cp .env.example .env
# Edit .env with your local DATABASE_URL
bunx prisma migrate dev
bunx prisma db seed

# Start dev server
bun dev
```

## Environment Variables

| Variable | Description |
|----------|-------------|
| `DB_PASSWORD` | PostgreSQL password |
| `DATABASE_URL` | Full Postgres connection string |
| `BETTER_AUTH_SECRET` | Auth secret (32+ random chars) |
| `BETTER_AUTH_URL` | App base URL for auth callbacks |
| `GITHUB_CLIENT_ID` | GitHub OAuth app client ID |
| `GITHUB_CLIENT_SECRET` | GitHub OAuth app client secret |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret |
| `NEXT_PUBLIC_APP_URL` | Public-facing app URL |

## Admin Setup

After registering your account, promote yourself to admin:

```bash
bunx prisma db seed
# Or manually via database:
# UPDATE "User" SET role = 'admin' WHERE email = 'your@email.com';
```

## License

MIT
